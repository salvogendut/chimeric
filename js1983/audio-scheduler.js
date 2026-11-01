"use strict";

(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.JS1983Audio = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const DEFAULT_SAMPLE_RATE = 44100;

  function createFrameClock(frameHz, maxCatchUpFrames = 5) {
    let frameDuration = 1000 / frameHz;
    let previousTime = null;
    let accumulator = 0;

    function setRate(hz) {
      if (!(hz > 0)) throw new Error("frame rate must be positive");
      frameDuration = 1000 / hz;
      previousTime = null;
      accumulator = 0;
    }

    function consume(time) {
      if (previousTime === null) {
        previousTime = time;
        return 0;
      }
      let elapsed = time - previousTime;
      previousTime = time;
      if (elapsed < 0) elapsed = 0;
      elapsed = Math.min(elapsed, frameDuration * maxCatchUpFrames);
      accumulator += elapsed;
      const frames = Math.min(
        maxCatchUpFrames,
        Math.floor((accumulator + 1e-7) / frameDuration)
      );
      accumulator -= frames * frameDuration;
      return frames;
    }

    function reset() {
      previousTime = null;
      accumulator = 0;
    }

    return { consume, reset, setRate };
  }

  function createScheduler(options) {
    const emulator = options.emulator;
    const context = options.context;
    const ringPtr = options.ringPtr;
    const ringSize = options.ringSize;
    const sampleRate = options.sampleRate ?? DEFAULT_SAMPLE_RATE;
    const chunkSize = options.chunkSize ?? 1024;
    const startDelay = options.startDelay ?? 0.12;
    const minimumLead = options.minimumLead ?? 0.035;
    const targetLead = options.targetLead ?? 0.18;
    const activeSources = new Set();
    let nextStart = context.currentTime + startDelay;

    function stopScheduledSources() {
      for (const source of activeSources) {
        source.onended = null;
        try { source.stop(); } catch (_) { /* Source may have already ended. */ }
        try { source.disconnect(); } catch (_) { /* Already disconnected. */ }
      }
      activeSources.clear();
    }

    function reset() {
      stopScheduledSources();
      emulator._poc_audio_reset();
      nextStart = context.currentTime + startDelay;
    }

    function schedule() {
      if (context.state !== "running") return { buffers: 0, frames: 0 };
      const now = context.currentTime;
      if (nextStart < now + minimumLead) nextStart = now + minimumLead;
      let buffers = 0;
      let scheduledFrames = 0;

      while (nextStart - now < targetLead) {
        const available = emulator._poc_audio_avail();
        if (available <= 0) break;
        const frames = Math.min(chunkSize, available);
        const readPosition = emulator._poc_audio_read_pos();
        const ring = new Int16Array(
          emulator.HEAPU8.buffer,
          ringPtr,
          ringSize
        );
        const buffer = context.createBuffer(1, frames, sampleRate);
        const mono = buffer.getChannelData(0);
        for (let i = 0; i < frames; i++)
          mono[i] = ring[(readPosition + i) % ringSize] / 32768;
        emulator._poc_audio_advance(frames);

        const source = context.createBufferSource();
        source.buffer = buffer;
        source.connect(context.destination);
        source.onended = () => {
          activeSources.delete(source);
          try { source.disconnect(); } catch (_) { /* Already disconnected. */ }
        };
        activeSources.add(source);
        source.start(nextStart);
        nextStart += frames / sampleRate;
        ++buffers;
        scheduledFrames += frames;
      }
      return { buffers, frames: scheduledFrames };
    }

    return {
      reset,
      schedule,
      stop: stopScheduledSources,
      scheduledSourceCount: () => activeSources.size,
    };
  }

  return { createFrameClock, createScheduler, DEFAULT_SAMPLE_RATE };
});
