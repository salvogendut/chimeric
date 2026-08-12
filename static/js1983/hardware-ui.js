(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.JS1983Hardware = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const INPUT_JOYSTICK = 'joystick';
  const INPUT_MOUSE = 'mouse';

  function normalizeInputDevice(device) {
    if (device === INPUT_JOYSTICK || device === INPUT_MOUSE) return device;
    throw new Error('unsupported input device: ' + device);
  }

  function normalizeExtensions(extensions) {
    if (!Array.isArray(extensions))
      throw new Error('extensions must be an array');
    return [...new Set(extensions.map(name => String(name).trim()).filter(Boolean))];
  }

  function createPeripheralState() {
    let inputDevice = INPUT_JOYSTICK;
    let extensions = [];

    return {
      setInputDevice(device) {
        inputDevice = normalizeInputDevice(device);
        return inputDevice;
      },
      getInputDevice() {
        return inputDevice;
      },
      setExtensions(names) {
        extensions = normalizeExtensions(names);
        return [...extensions];
      },
      getExtensions() {
        return [...extensions];
      },
      cartridgeSlotOwner(slot) {
        if (slot !== 0 && slot !== 1)
          throw new Error('unsupported cartridge slot: ' + slot);
        return slot === 1 && extensions.length ? extensions[0] : null;
      },
      cartridgeSlotAvailable(slot) {
        return this.cartridgeSlotOwner(slot) === null;
      },
    };
  }

  return {
    INPUT_JOYSTICK,
    INPUT_MOUSE,
    normalizeInputDevice,
    createPeripheralState,
  };
}));
