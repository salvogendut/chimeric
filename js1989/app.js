import {mountShell} from './shell.js';
import {createKeyboard} from './keyboard.js';
import {createMedia,devices} from './media.js';
import {createModelPicker} from './models.js';

let core, media, models, running = false, starting = false, failed = false;
const $ = id => document.getElementById(id);
function status(message,error=false) { $('runStatus').textContent=message; $('runStatus').classList.toggle('error',error); }
const keyboard = createKeyboard(()=>running ? core : null);
mountShell({live:true,pressKey:keyboard.press,releaseInput:keyboard.release});
const slots = new Map(devices.map(id=>[id,document.querySelector(`[data-device="${id}"]`)]));
for (const [id,slot] of slots) {
  slot.querySelector('input').disabled=true;
  slot.querySelector('input').addEventListener('change',event=>{
    const file=event.target.files[0]; event.target.value='';
    if(file && media) media.load(id,file);
  });
  slot.querySelector('.eject-button')?.addEventListener('click',()=>media.eject(id));
  if (id !== 'cd') {
    const save=document.createElement('button');save.className='save-button';save.type='button';
    save.textContent='Download image';save.disabled=true;save.addEventListener('click',()=>media.download(id));slot.append(save);
  }
  if(id==='disk') {
    slot.querySelector('.write-state').textContent='SESSION COPY';
    const note=document.createElement('p');note.className='media-hint';note.textContent='Choose before starting the computer.';slot.append(note);
  }
  if(id==='floppy' || id==='mo') {
    const note=document.createElement('p');note.className='media-hint model-unavailable';note.hidden=true;slot.append(note);
  }
}
function refresh() {
  models?.refresh(running || starting || failed);
  for (const [id,slot] of slots) {
    const selection=media?.selections.get(id), unavailable=!media || media.busy || starting;
    const supported=models?.supports(id) ?? true;
    slot.querySelector('input').disabled=unavailable || !supported || (id==='disk' && running);
    const eject=slot.querySelector('.eject-button');if(eject) eject.disabled=unavailable || !selection?.inserted || (running && !supported);
    const save=slot.querySelector('.save-button');if(save) save.disabled=unavailable || !selection;
    if(selection) {
      slot.querySelector('output').textContent=(!supported ? 'Not connected · ' : selection.inserted ? '' : 'Ejected · ')+selection.name;
      slot.querySelector('output').title=selection.name;
    } else {slot.querySelector('output').textContent='No image selected';slot.querySelector('output').removeAttribute('title');}
    slot.classList.toggle('loaded',supported && Boolean(selection?.inserted));
    const note=slot.querySelector('.model-unavailable');
    if(note) {
      note.hidden=supported;
      note.textContent=(id==='mo' ? 'Native MO requires a non-Turbo Cube.' : 'Native floppy requires a 68040 model.')+(selection ? ' Your selected image is kept and can still be downloaded.' : '');
    }
  }
  $('startButton').disabled=!media || media.busy || starting || running || failed;
}
async function start() {
  if(!core || running || starting || media.busy || failed) return;
  starting=true; refresh(); status('Starting the NeXT…');
  try {
    core.callMain([]);
    if(!core._web_ready()) throw new Error('The emulator could not initialize. Reload to retry.');
    running=true; document.documentElement.dataset.running='true';
    $('powerScreen').hidden=true; $('canvas').focus();
    media.sync(); status('Running · ROM monitor. Click the screen to use your keyboard and mouse.');
    setInterval(()=>media.sync(),500);
  } catch(error) { failed=true; $('startButton').textContent='Reload to retry'; status(error.message,true); }
  finally {starting=false;refresh();}
}
$('startButton').addEventListener('click',start);
$('canvas').addEventListener('pointerdown',()=>$('canvas').focus());
$('canvas').addEventListener('contextmenu',event=>event.preventDefault());

try {
  if(!crossOriginIsolated || typeof SharedArrayBuffer==='undefined') throw new Error('Threading is unavailable. Serve this build with web/serve.py or enable COOP/COEP headers over HTTPS.');
  core=await window.create1989({
    canvas:$('canvas'),noInitialRun:true,
    print:message=>console.info('[1989]',message),
    printErr:message=>console.warn('[1989]',message),
    onAbort:message=>status(`Emulator stopped: ${message}`,true)
  });
  models=createModelPicker(core,{canChange:()=>Boolean(media) && !media.busy && !starting && !running && !failed,onChange:refresh});
  media=createMedia(core,{isRunning:()=>running,isAvailable:id=>models.supports(id),status,refresh});
  $('startButton').textContent='Start NeXT'; refresh();
  status('Ready · choose a model, load your images, then start. Guest disk changes stay in this tab until downloaded.');
} catch(error) {status(error.message,true);$('startButton').textContent='Unable to start';}
