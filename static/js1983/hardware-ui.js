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
    let cartridgeExtensions = [];
    let portExtensions = [];

    return {
      setInputDevice(device) {
        inputDevice = normalizeInputDevice(device);
        return inputDevice;
      },
      getInputDevice() {
        return inputDevice;
      },
      setCartridgeExtensions(names) {
        cartridgeExtensions = normalizeExtensions(names);
        return [...cartridgeExtensions];
      },
      getCartridgeExtensions() {
        return [...cartridgeExtensions];
      },
      setPortExtensions(names) {
        portExtensions = normalizeExtensions(names);
        return [...portExtensions];
      },
      getPortExtensions() {
        return [...portExtensions];
      },
      cartridgeSlotOwner(slot) {
        if (slot !== 0 && slot !== 1)
          throw new Error('unsupported cartridge slot: ' + slot);
        return slot === 1 && cartridgeExtensions.length
          ? cartridgeExtensions[0] : null;
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
