(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.JS1983Media = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function resolveHttpUrl(value, baseUrl, parameter) {
    if (!value) return null;
    let url;
    try {
      url = new URL(value, baseUrl);
    } catch (_) {
      throw new Error(parameter + ' is not a valid URL');
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:')
      throw new Error(parameter + ' must use HTTP or HTTPS');
    return url.href;
  }

  function validateAutorun(value) {
    if (!value) return null;
    if (value.length > 240 || /[\x00-\x1f\x7f"]/.test(value))
      throw new Error('autorun contains unsupported characters');
    return value;
  }

  function validateMachine(value) {
    if (value === null) return null;
    const machine = value.trim().toLowerCase();
    if (machine === 'msx1' || machine === 'cbios') return 0;
    if (machine === 'nms8250' || machine === 'msx2') return 1;
    throw new Error('machine must be msx1 or nms8250');
  }

  function validateExtensions(params) {
    if (!params.has('extensions')) return null;
    const value = params.get('extensions').trim();
    if (!value) return [];
    const supported = new Set(['sdmapper', 'unapi']);
    const extensions = [];
    for (const item of value.split(',')) {
      const extension = item.trim().toLowerCase();
      if (!supported.has(extension))
        throw new Error('unsupported extension: ' + (extension || '(empty)'));
      if (!extensions.includes(extension)) extensions.push(extension);
    }
    return extensions;
  }

  function validateSdMode(value, hasImage) {
    if (value === null) return null;
    if (!hasImage) throw new Error('sdmode requires an sda or sdb URL');
    if (value !== 'readonly' && value !== 'readwrite')
      throw new Error('sdmode must be readonly or readwrite');
    return value;
  }

  function parseStartupMedia(search, baseUrl) {
    const params = new URLSearchParams(search || '');
    const media = {
      machine: validateMachine(
        params.has('machine') ? params.get('machine') : null
      ),
      disk: resolveHttpUrl(params.get('disk'), baseUrl, 'disk'),
      cartridge: resolveHttpUrl(params.get('cartridge'), baseUrl, 'cartridge'),
      cartridge2: resolveHttpUrl(params.get('cartridge2'), baseUrl, 'cartridge2'),
      sdA: resolveHttpUrl(params.get('sda'), baseUrl, 'sda'),
      sdB: resolveHttpUrl(params.get('sdb'), baseUrl, 'sdb'),
      extensions: validateExtensions(params),
      autorun: validateAutorun(params.get('autorun')),
    };
    media.sdMode = validateSdMode(
      params.has('sdmode') ? params.get('sdmode').trim().toLowerCase() : null,
      Boolean(media.sdA || media.sdB)
    );
    if (media.autorun && !media.disk)
      throw new Error('autorun requires a disk URL');
    return media;
  }

  function resolveStartupExtensions(media, current = {}) {
    let sdMapper = Boolean(current.sdMapper);
    let unapi = Boolean(current.unapi);
    if (media.extensions !== null) {
      sdMapper = media.extensions.includes('sdmapper');
      unapi = media.extensions.includes('unapi');
    }
    if (media.sdA || media.sdB) sdMapper = true;
    return { sdMapper, unapi };
  }

  function filenameFromUrl(value, fallback) {
    if (!value) return fallback;
    const path = new URL(value).pathname;
    const encoded = path.slice(path.lastIndexOf('/') + 1);
    if (!encoded) return fallback;
    try {
      return decodeURIComponent(encoded);
    } catch (_) {
      return encoded;
    }
  }

  return { parseStartupMedia, resolveStartupExtensions, filenameFromUrl };
}));
