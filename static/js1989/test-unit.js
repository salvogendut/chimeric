import test from 'node:test';
import assert from 'node:assert/strict';
import {validateImage} from './media.js';
import {scancode} from './keyboard.js';

test('reject malformed images before replacing an attached medium',()=>{
  for(const [id,size] of [['disk',0],['disk',513],['cd',512],['floppy',1024],['mo',1297],['unknown',512]])
    assert.throws(()=>validateImage(id,size));
  for(const [id,size] of [['disk',512],['cd',2048],['floppy',737280],['floppy',1474560],['floppy',2949120],['mo',1296]])
    assert.doesNotThrow(()=>validateImage(id,size));
});

test('NeXT keyboard distinguishes the keypad and maps hardware control keys',()=>{
  assert.equal(scancode('Q'),20);
  assert.equal(scancode('!|1'),30);
  assert.equal(scancode('1',true),89);
  assert.equal(scancode('return'),40);
  assert.equal(scancode('enter',true),88);
  assert.equal(scancode('☀ −',true),58);
  assert.equal(scancode('vol +',true),63);
  assert.equal(scancode('unknown'),0);
});
