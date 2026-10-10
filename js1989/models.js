/* Model descriptions come from the core; selecting one never starts or resets it. */
export function createModelPicker(core, {canChange, onChange}) {
  const select = document.getElementById('modelSelect');
  const profiles = [];
  for (let index = 0; ; index++) {
    const info = core.ccall('web_model_info', 'string', ['number'], [index]);
    if (!info) break;
    const profile = JSON.parse(info);
    profiles.push(profile);
    select.add(new Option(profile.name, String(profile.index)));
  }
  let selected = JSON.parse(core.ccall('web_model_info', 'string', ['number'], [-1]));
  select.addEventListener('change', () => {
    const profile = profiles.find(item => String(item.index) === select.value);
    if (canChange() && profile && core._web_set_model(profile.index)) selected = profile;
    select.value = String(selected.index);
    onChange();
  });
  function refresh(locked) {
    select.value = String(selected.index);
    select.disabled = !canChange();
    document.getElementById('modelName').textContent = selected.name;
    document.getElementById('modelSpecs').textContent = `${selected.cpu} · ${selected.mhz} MHz · ${selected.memory} MB · ${selected.color ? 'Color' : 'Monochrome'}`;
    const note = locked ? 'Model locked for this session. Download disk changes before reloading to choose another.' : 'Choose before starting. Firmware is selected automatically.';
    const drives = !selected.floppy ? ' Native floppy is unavailable on the 68030.' : !selected.mo ? ' Native MO requires a non-Turbo Cube.' : '';
    document.getElementById('modelHint').textContent = note + drives;
  }
  return {
    refresh,
    supports: id => id === 'floppy' || id === 'mo' ? selected[id] : true
  };
}
