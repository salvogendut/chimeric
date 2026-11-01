/* Session image storage and explicit downloads. No uploads or persistent writes. */
export const devices = ['disk', 'cd', 'floppy', 'mo'];
const maxTotal = 512 * 1024 * 1024;
const path = id => `/media/${id}.img`;
const delay = ms => new Promise(resolve=>setTimeout(resolve,ms));

export function validateImage(id, size) {
  if (!devices.includes(id) || !Number.isSafeInteger(size) || size <= 0) throw new Error('Choose a non-empty disk image.');
  if (id === 'floppy' && ![737280,1474560,2949120].includes(size)) throw new Error('Floppy images must be 720 KB, 1.44 MB or 2.88 MB.');
  const block = id === 'cd' ? 2048 : id === 'mo' ? 1296 : 512;
  if (size % block) throw new Error(`The ${id} image must contain complete ${block}-byte sectors.`);
}

export function createMedia(core, {isRunning, isAvailable, status, refresh}) {
  const selections = new Map();
  let busy = false;
  core.FS.mkdirTree('/media');

  async function paused(action) {
    if (!isRunning()) return action();
    core._web_pause(1);
    try {
      const deadline = performance.now() + 10000;
      while (!core._web_paused()) {
        if (performance.now() > deadline) throw new Error('The CPU did not pause. Media were left unchanged.');
        await delay(10);
      }
      return await action();
    } finally {
      core._web_pause(0);
      // Observe resume before another operation may request a pause.
      const deadline = performance.now() + 10000;
      while (core._web_paused()) {
        if (performance.now() > deadline) throw new Error('The CPU did not resume. Keep this tab open to preserve your session images.');
        await delay(5);
      }
    }
  }
  async function operation(action) {
    if (busy) return;
    busy = true; refresh();
    try { await action(); }
    catch (error) { status(error.message, true); }
    finally { busy = false; refresh(); }
  }
  async function load(id, file) {
    return operation(async()=>{
      if (!isAvailable(id)) throw new Error('This drive is unavailable on the selected model.');
      if (id === 'disk' && isRunning()) throw new Error('Select the system disk before starting the computer.');
      validateImage(id, file.size);
      const total = [...selections].reduce((n,[key,value])=>n + (key === id ? 0 : value.size),file.size);
      if (total > maxTotal) throw new Error('This initial build supports up to 512 MiB of selected images in total.');
      const previous = selections.get(id);
      if (previous && id !== 'cd' && previous.used && !confirm(`Replace ${previous.name}? Download any guest changes first. Your original file is unchanged.`)) return;
      status(`Reading ${file.name}…`);
      const bytes = new Uint8Array(await file.arrayBuffer());
      await paused(()=>{
        const index = devices.indexOf(id), running = isRunning();
        const staging = path(id) + '.new', backup = path(id) + '.old';
        core.FS.writeFile(staging, bytes, {canOwn:true});
        if (running && !core._web_eject(index)) { core.FS.unlink(staging); throw new Error('The drive could not eject; its image was kept.'); }
        if (previous) core.FS.rename(path(id), backup);
        core.FS.rename(staging, path(id));
        if (running && !core._web_insert(index)) {
          core._web_eject(index);
          core.FS.unlink(path(id));
          if (previous) {
            core.FS.rename(backup, path(id));
            if (previous.inserted) core._web_insert(index);
          }
          throw new Error('The drive rejected this image; the previous image was restored.');
        }
        if (previous) core.FS.unlink(backup);
        selections.set(id,{name:file.name,size:file.size,inserted:true,used:running});
      });
      status(`${file.name} ${isRunning() ? 'inserted' : 'ready for startup'}.`);
    });
  }
  async function eject(id) {
    return operation(()=>paused(()=>{
      const selection = selections.get(id);
      if (!selection || id === 'disk') return;
      if (isRunning()) {
        if (!core._web_eject(devices.indexOf(id))) throw new Error('The drive could not eject.');
        selection.inserted = false;
      } else {
        core.FS.unlink(path(id)); selections.delete(id);
      }
      status('Media ejected. The computer and other drives keep running.');
    }));
  }
  async function download(id) {
    return operation(async()=>{
      const selection = selections.get(id);
      if (!selection) return;
      const bytes = await paused(()=>core.FS.readFile(path(id)));
      const url = URL.createObjectURL(new Blob([bytes],{type:'application/octet-stream'}));
      const a=document.createElement('a'); a.href=url; a.download=selection.name; a.click();
      setTimeout(()=>URL.revokeObjectURL(url),30000);
      status(`Downloaded ${selection.name}. Shut down NEXTSTEP before your final download for a clean disk image.`);
    });
  }
  function sync() {
    if (busy || !isRunning()) return;
    for (const [id,selection] of selections) {
      selection.inserted = Boolean(core._web_media_present(devices.indexOf(id)));
      selection.used ||= isAvailable(id);
    }
    refresh();
  }
  window.addEventListener('beforeunload',event=>{
    if ([...selections].some(([id,s])=>id !== 'cd' && s.used)) {event.preventDefault();event.returnValue='';}
  });
  return {load,eject,download,sync,selections,get busy(){return busy;}};
}
