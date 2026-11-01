/* Integration against the real WASM CPU and device implementations. */
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,readFile} from 'node:fs/promises';

const port=19891, base=`http://127.0.0.1:${port}`;
const server=spawn('python3',['serve.py','--port',String(port)],{stdio:['ignore','pipe','inherit']});
let browser, page;
try {
  await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',code=>reject(new Error(`Server exited: ${code}`)));});
  browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  page=await browser.newPage({viewport:{width:1440,height:1400},acceptDownloads:true});
  const waitFor=(predicate,arg=null,options={})=>page.waitForFunction(predicate,arg,{polling:100,...options});
  await mkdir('test-results',{recursive:true});
  const errors=[];
  page.on('dialog',dialog=>dialog.accept());
  page.on('pageerror',error=>{errors.push(error.message);console.error('Browser error:',error.message);});
  page.on('response',response=>{if(response.status()>=400) errors.push(`${response.status()} ${response.url()}`);});
  await page.addInitScript(()=>{
    let factory;
    Object.defineProperty(window,'create1989',{configurable:true,get:()=>factory,set:fn=>{
      factory=async options=>{const core=await fn(options);window.testCore=core;return core;};
    }});
  });
  await page.goto(base);
  await waitFor(()=>!document.getElementById('startButton').disabled,null,{timeout:30000});
  assert(await page.evaluate(()=>crossOriginIsolated));
  assert(await page.locator('.keyboard-logo').evaluate(img=>img.complete&&img.naturalWidth>0));
  const slot=id=>page.locator(`[data-device=${id}]`);
  async function load(id,name,bytes) {
    await slot(id).locator('input').setInputFiles({name,mimeType:'application/octet-stream',buffer:bytes});
    await waitFor(([id,name])=>document.querySelector(`[data-device=${id}] output`).textContent===name,[id,name]);
  }
  const floppy=Buffer.alloc(1474560,0x6b);
  for(const [id,name,bytes] of [['disk','system.sd',Buffer.alloc(1048576)],['cd','installer.iso',Buffer.alloc(16384)],['floppy','data.fd',floppy],['mo','backup.mo',Buffer.alloc(1296*64)]])
    await load(id,name,bytes);
  assert.equal(await page.locator('#modelSelect option').count(),7);
  await page.locator('#modelSelect').selectOption({label:'NeXTstation Color'});
  assert(await slot('mo').locator('input').isDisabled());
  assert.equal(await slot('mo').locator('output').textContent(),'Not connected · backup.mo');
  assert(!(await slot('mo').locator('.save-button').isDisabled()));
  assert((await page.locator('#modelSpecs').textContent()).endsWith('32 MB · Color'));
  await page.locator('#modelSelect').selectOption({label:'NeXT Computer'});
  assert(await slot('floppy').locator('input').isDisabled());
  assert(!(await slot('mo').locator('input').isDisabled()));
  assert.equal(await slot('mo').locator('output').textContent(),'backup.mo');
  await page.locator('#modelSelect').selectOption({label:'NeXTcube'});
  assert.equal(await slot('floppy').locator('output').textContent(),'data.fd');
  assert.equal(await page.evaluate(()=>testCore._web_set_model(99)),0);
  await page.locator('#startButton').click();
  await waitFor(()=>document.documentElement.dataset.running==='true');
  await waitFor(()=>testCore._web_cycles()>200000000,null,{timeout:45000});
  const mounted=()=>page.evaluate(()=>[0,1,2,3].map(id=>testCore._web_media_present(id)));
  assert.deepEqual(await mounted(),[1,1,1,1]);
  assert(await slot('disk').locator('input').isDisabled());
  assert(await page.locator('#modelSelect').isDisabled());
  assert.equal(await page.evaluate(()=>testCore._web_set_model(0)),0,'Core must reject a running model change');
  await page.locator('#modelSelect').evaluate(select=>{select.value='0';select.dispatchEvent(new Event('change'));});
  assert.equal(await page.locator('#modelSelect').inputValue(),'1','Synthetic changes must not mislabel a running machine');

  // Inspect actual rendered pixels (rather than accepting a "ready" UI label).
  async function consolePixels() {
    // Read the composited image. WebGL's drawing buffer can be discarded after
    // presentation, so drawImage(canvas) between frames can capture blank pixels
    // even while the ROM console is visibly displayed (notably on SwiftShader).
    // Capture the page compositor directly: element screenshots wait for extra
    // animation frames to establish stability, which can starve on busy runners.
    const clip=await page.evaluate(()=>{
      window.scrollTo(0,0);
      const {x,y,width,height}=document.getElementById('canvas').getBoundingClientRect();
      return {x,y,width,height};
    });
    const screenshot=await page.screenshot({clip});
    return page.evaluate(async png=>{
      const source=new Image(), copy=document.createElement('canvas');
      source.src=`data:image/png;base64,${png}`;
      await source.decode();
      copy.width=1120;copy.height=832;
      const ctx=copy.getContext('2d');ctx.drawImage(source,0,0,1120,832);
      const pixels=ctx.getImageData(90,270,700,280).data;
      let hash=2166136261,white=0;
      for(let i=0;i<pixels.length;i+=4) {hash=Math.imul(hash^pixels[i],16777619);if(pixels[i]>230)white++;}
      return {hash,white};
    },screenshot.toString('base64'));
  }
  const initial=await consolePixels();assert(initial.white>10000,'ROM monitor must draw its console');
  for(const label of ['H','return']) {
    await page.locator(`#typingKeys button[data-label="${label}"]`).click();
    await page.waitForTimeout(150);
  }
  const responseDeadline=Date.now()+30000;
  while((await consolePixels()).hash===initial.hash) {
    assert(Date.now()<responseDeadline,'On-screen h/Return must produce ROM help');
    await page.waitForTimeout(100);
  }

  const cycles=await page.evaluate(()=>testCore._web_cycles());
  await slot('cd').locator('.eject-button').click();
  await waitFor(()=>document.querySelector('[data-device=cd] output').textContent.startsWith('Ejected'));
  assert.deepEqual(await mounted(),[1,0,1,1]);
  assert((await page.evaluate(()=>testCore._web_cycles()))>=cycles,'Eject must not reset the CPU');
  await load('cd','other.iso',Buffer.alloc(32768));
  assert.deepEqual(await mounted(),[1,1,1,1]);

  // Invalid insertion must leave the existing medium and other drives intact.
  await slot('floppy').locator('input').setInputFiles({name:'bad.fd',mimeType:'application/octet-stream',buffer:Buffer.alloc(3)});
  await waitFor(()=>document.getElementById('runStatus').classList.contains('error'));
  assert.equal(await slot('floppy').locator('output').textContent(),'data.fd');
  assert.deepEqual(await mounted(),[1,1,1,1]);

  // Physical keyboard issues the ROM's floppy-eject command, exercising guest eject.
  await page.locator('#canvas').focus();
  await page.keyboard.type('ef',{delay:100});await page.keyboard.press('Enter');
  await waitFor(()=>document.querySelector('[data-device=floppy] output').textContent.startsWith('Ejected'),null,{timeout:30000});
  assert.deepEqual(await mounted(),[1,1,0,1]);
  const downloadEvent=page.waitForEvent('download');
  await slot('floppy').locator('.save-button').click();
  const download=await downloadEvent;
  assert.equal(download.suggestedFilename(),'data.fd');
  assert.deepEqual(await readFile(await download.path()),floppy,'Ejected writable images remain downloadable');
  await slot('mo').locator('.eject-button').click();
  await waitFor(()=>document.querySelector('[data-device=mo] output').textContent.startsWith('Ejected'));
  assert.deepEqual(await mounted(),[1,1,0,0]);
  await load('mo','second.mo',Buffer.alloc(1296*32));
  assert.deepEqual(await mounted(),[1,1,0,1]);

  await page.getByRole('button',{name:'command',exact:true}).first().click();
  await page.locator('#keyboardToggle').click();
  assert.equal(await page.locator('.key[aria-pressed=true]').count(),0);
  await page.locator('#keyboardToggle').click();
  for(const theme of ['next','retro-crt','sapporo','sapporo-dark']) {
    await page.locator('#themeButton').click();await page.locator(`#themeMenu [data-theme=${theme}]`).click();
    for(const width of [1440,768,390,320]) {
      await page.setViewportSize({width,height:900});
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${theme} overflows at ${width}`);
    }
  }
  await page.setViewportSize({width:1440,height:1400});
  await page.locator('#themeButton').click();await page.locator('#themeMenu [data-theme=next]').click();
  await page.screenshot({path:'test-results/next-rom-monitor.png',fullPage:true});
  // Fresh instances exercise every CPU/ROM/video variant, including ADB on Turbo.
  const profiles=[
    [0,'NeXT Computer',false,true],
    [2,'NeXTcube Turbo',true,false],
    [3,'NeXTstation',true,false],
    [4,'NeXTstation Turbo',true,false],
    [5,'NeXTstation Color',true,false],
    [6,'NeXTstation Turbo Color',true,false]
  ];
  for(const [index,name,hasFloppy,hasMO] of profiles) {
    await page.reload();
    await waitFor(()=>!document.getElementById('startButton').disabled,null,{timeout:30000});
    // Staged incompatible media must remain in the browser, never in the guest.
    await load('floppy','data.fd',floppy);
    await load('mo','backup.mo',Buffer.alloc(1296*64));
    await page.locator('#modelSelect').selectOption(String(index));
    assert.equal(await slot('floppy').locator('input').isDisabled(),!hasFloppy);
    assert.equal(await slot('mo').locator('input').isDisabled(),!hasMO);
    await page.locator('#startButton').click();
    await waitFor(()=>document.documentElement.dataset.running==='true');
    await waitFor(()=>testCore._web_cycles()>200000000,null,{timeout:45000});
    assert.deepEqual(await mounted(),[0,0,Number(hasFloppy),Number(hasMO)],name);
    await page.screenshot({path:`test-results/model-${index}.png`,fullPage:true});
    assert((await consolePixels()).white>10000,`${name} ROM console`);
    await page.locator('#canvas').focus();
    await page.keyboard.type(hasFloppy ? 'ef' : 'ej',{delay:100});await page.keyboard.press('Enter');
    await waitFor(device=>testCore._web_media_present(device)===0,hasFloppy ? 2 : 3,{timeout:30000});
    assert.equal(await page.evaluate(()=>testCore._web_set_model(1)),0);
    if(index===0) {
      const retainedDownload=page.waitForEvent('download');
      await slot('floppy').locator('.save-button').click();
      assert.deepEqual(await readFile(await (await retainedDownload).path()),floppy,'An unsupported drive must retain its selected image byte-for-byte');
    }
    if(!hasFloppy || !hasMO) {
      await page.evaluate(()=>testCore._web_pause(1));
      await waitFor(()=>testCore._web_paused());
      const device=hasMO ? 2 : 3;
      assert.equal(await page.evaluate(device=>testCore._web_insert(device),device),0,'Core must reject unsupported media');
      await page.evaluate(()=>testCore._web_pause(0));
    }
    if(index===6) {
      // Longest model name must fit even on the smallest supported viewport.
      for(const width of [768,390,320]) {
        await page.setViewportSize({width,height:900});
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${name} overflows at ${width}`);
      }
      await page.setViewportSize({width:1440,height:1400});
    }
    await page.screenshot({path:`test-results/model-${index}.png`,fullPage:true});
    console.log(`PASS: ${name} ROM, display, keyboard and compatible drives.`);
  }
  assert.deepEqual(errors,[]);
  console.log('PASS: real ROM boot, framebuffer, virtual/physical keyboard, four media slots, host/guest eject without reset, insertion, validation, byte-exact download, keyboard collapse and responsive themes.');
} catch(error) {
  if(page && !page.isClosed()) {
    await page.screenshot({path:'test-results/failure.png',fullPage:true}).catch(()=>{});
    console.error('Guest state:',await page.evaluate(()=>({
      cycles:window.testCore?._web_cycles(),
      status:document.getElementById('runStatus')?.textContent,
      model:document.getElementById('modelName')?.textContent
    })).catch(()=>null));
  }
  throw error;
} finally {
  await browser?.close();server.kill();
}
