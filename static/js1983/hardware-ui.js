(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.JS1983Hardware = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const INPUT_JOYSTICK = 'joystick';
  const INPUT_MOUSE = 'mouse';
  const RAM_SIZES_KB = Object.freeze([
    16, 32, 64, 128, 256, 512, 1024, 2048, 4096,
  ]);
  const DEFAULT_RAM_KB = Object.freeze([64, 128, 128]);

  function ramSizesForModel(model) {
    if (model === 0) return [...RAM_SIZES_KB];
    if (model === 1 || model === 2) return RAM_SIZES_KB.slice(2);
    throw new Error('unsupported machine model: ' + model);
  }

  function normalizeRamKb(model, value) {
    const sizes = ramSizesForModel(model);
    const requested = Number(value);
    let normalized = sizes[0];
    for (const size of sizes) {
      if (requested === size) return size;
      if (requested > size) normalized = size;
    }
    return normalized;
  }

  function defaultRamKb(model) {
    if (model !== 0 && model !== 1 && model !== 2)
      throw new Error('unsupported machine model: ' + model);
    return DEFAULT_RAM_KB[model];
  }

  function formatRamKb(value) {
    const ramKb = Number(value);
    return ramKb >= 1024 ? (ramKb / 1024) + ' MiB' : ramKb + ' KiB';
  }

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
        return cartridgeExtensions[slot] || null;
      },
      cartridgeSlotAvailable(slot) {
        return this.cartridgeSlotOwner(slot) === null;
      },
    };
  }

  return {
    INPUT_JOYSTICK,
    INPUT_MOUSE,
    RAM_SIZES_KB,
    ramSizesForModel,
    normalizeRamKb,
    defaultRamKb,
    formatRamKb,
    normalizeInputDevice,
    createPeripheralState,
  };
}));
