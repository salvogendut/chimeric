/* USB/SDL scancodes, translated to NeXT keys by the existing native keymap. */
const keys = {esc:41,delete:42,tab:43,return:40,space:44,'-':45,'=':46,'[':47,']':48,'\\':49,';':51,"'":52,'`':53,',':54,'.':55,'/':56,'→':79,'←':80,'↓':81,'↑':82};
const numeric = {'/':84,'*':85,'−':86,'+':87,enter:88,'1':89,'2':90,'3':91,'4':92,'5':93,'6':94,'7':95,'8':96,'9':97,'0':98,'.':99,'=':103,'`':53,'☀ −':58,'☀ +':59,'vol −':62,'vol +':63};
const modifiers = {control:[224,0x40],shift:[225,0x1],alternate:[226,0x100],command:[227,0x400]};

export function scancode(label, keypad = false) {
  label = label.includes('|') ? label.split('|')[1] : label;
  if (keypad) return numeric[label] || 0;
  if (/^[A-Z]$/.test(label)) return label.charCodeAt(0) - 65 + 4;
  if (/^[1-9]$/.test(label)) return Number(label) + 29;
  if (label === '0') return 39;
  return keys[label] || 0;
}

export function createKeyboard(getCore) {
  let held = [], timer;
  function release() {
    clearTimeout(timer);
    const core = getCore();
    if (core) for (const [code] of held.reverse()) core._web_key(code, 0, 0);
    held = [];
  }
  function press(label, modifierNames, keypad) {
    release();
    const core = getCore(), code = scancode(label, keypad);
    if (!core || !code) return;
    const mods = [...new Set(modifierNames)].map(name=>modifiers[name]).filter(Boolean);
    const mask = mods.reduce((value, [, bit])=>value | bit, 0);
    for (const [modifier] of mods) { core._web_key(modifier, 1, mask); held.push([modifier]); }
    core._web_key(code, 1, mask); held.push([code]);
    // Leave time for the NeXT keyboard controller to consume a press before release.
    timer = setTimeout(release, 80);
  }
  window.addEventListener('blur', release);
  document.addEventListener('visibilitychange',()=>{if(document.hidden) release();});
  return {press, release};
}
