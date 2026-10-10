/* Shared theme and keyboard presentation; emulator policy lives in app.js. */
export function mountShell({live = false, pressKey = () => {}, releaseInput = () => {}} = {}) {
const $ = id => document.getElementById(id);
const themes = { next: "NeXT", "retro-crt": "Retro CRT", sapporo: "Sapporo", "sapporo-dark": "Sapporo Dark" };
const storageKey = live ? "javascript1989.theme" : "javascript1989.preview.theme";
function resolveTheme(value) {
  const name = String(value || "").trim().toLowerCase();
  return Object.keys(themes).find(key => key === name || themes[key].toLowerCase() === name) || "next";
}
function applyTheme(value, save = true) {
  const theme = resolveTheme(value);
  document.documentElement.dataset.theme = theme;
  $("themeName").textContent = themes[theme];
  document.querySelectorAll("#themeMenu button").forEach(button => {
    const selected = button.dataset.theme === theme;
    button.setAttribute("aria-pressed", String(selected));
  });
  if (save) { try { localStorage.setItem(storageKey, theme); } catch {} }
}
let savedTheme = "next";
try { savedTheme = localStorage.getItem(storageKey) || "next"; } catch {}
const requestedTheme = new URLSearchParams(location.search).get("theme");
applyTheme(requestedTheme === null ? savedTheme : requestedTheme, false);
function closeThemes() { $("themeMenu").hidden = true; $("themeButton").setAttribute("aria-expanded", "false"); }
$("themeButton").addEventListener("click", () => {
  $("themeMenu").hidden = !$("themeMenu").hidden;
  $("themeButton").setAttribute("aria-expanded", String(!$("themeMenu").hidden));
});
$("themeMenu").addEventListener("click", event => {
  const button = event.target.closest("button[data-theme]");
  if (!button) return;
  applyTheme(button.dataset.theme); closeThemes(); $("themeButton").focus();
});
document.addEventListener("click", event => { if (!event.target.closest(".theme-picker")) closeThemes(); });
document.addEventListener("keydown", event => { if (event.key === "Escape" && !$("themeMenu").hidden) { closeThemes(); $("themeButton").focus(); } });

const devices = [
  { id: "disk", label: "Hard disk", connection: "SCSI · ID 1", empty: "No system disk selected", accept: ".sd,.img,.hdd,.hd,.dsk" },
  { id: "cd", label: "CD-ROM", connection: "SCSI · ID 3", empty: "No disc selected", accept: ".iso,.cdr,.img" },
  { id: "floppy", label: "Floppy", connection: "Native · 1.44 MB", empty: "No floppy selected", accept: ".fd,.img,.ima" },
  { id: "mo", label: "Magneto-optical", connection: "Native · MO", empty: "No MO disk selected", accept: ".mo,.od,.img" }
];
devices.forEach(device => {
  const slot = document.createElement("section");
  slot.className = "media-slot";
  slot.dataset.device = device.id;
  slot.innerHTML = `<div class="media-slot-heading"><svg aria-hidden="true"><use href="#${device.id}-icon"/></svg><div><h3>${device.label}</h3><span>${device.connection}</span></div></div><output class="media-filename" aria-live="polite">${device.empty}</output><div class="media-buttons"><label class="load-button">Load image <input type="file" accept="${device.accept}" aria-label="Select ${device.label} image${live ? "" : " for preview"}"></label>${device.id === "disk" ? '<span class="write-state">LOCAL IMAGE</span>' : `<button class="eject-button" type="button" disabled aria-label="Eject ${device.label}"><svg aria-hidden="true"><use href="#eject-icon"/></svg>Eject</button>`}</div>`;
  const input = slot.querySelector("input");
  const output = slot.querySelector("output");
  const eject = slot.querySelector(".eject-button");
  if (live) {
    $("mediaSlots").append(slot);
    return;
  }
  input.addEventListener("change", () => {
    const file = input.files[0];
    if (!file) return;
    output.textContent = file.name;
    output.title = `${file.name} — selected for preview only`;
    slot.classList.add("loaded");
    if (eject) eject.disabled = false;
    $("announcement").textContent = `${device.label}: ${file.name} selected for preview. Its contents are not read or changed.`;
  });
  if (eject) eject.addEventListener("click", () => {
    input.value = ""; output.textContent = device.empty; output.removeAttribute("title");
    slot.classList.remove("loaded"); eject.disabled = true;
    $("announcement").textContent = `${device.label} selection cleared. Other media unchanged.`;
  });
  $("mediaSlots").append(slot);
});

// US NeXT-style keyboard. Key gestures illustrate the UI; no guest events exist yet.
const rows = [
  ["esc", "!|1", "@|2", "#|3", "$|4", "%|5", "^|6", "&|7", "*|8", "(|9", ")|0", "_|-", "+|=", ["delete", 1.7]],
  [["tab", 1.5], "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "{|[", "}|]", "\\"],
  [["control", 1.8], "A", "S", "D", "F", "G", "H", "J", "K", "L", ":|;", '"|\'', ["return", 1.9]],
  [["shift", 2.3], "Z", "X", "C", "V", "B", "N", "M", "<|,", ">|.", "?|/", ["shift", 2.4]],
  [["alternate", 1.5], ["command", 1.6], ["space", 5.8], ["command", 1.6], ["alternate", 1.5], "←", "↓", "↑", "→"]
];
const modifiers = new Set(["shift", "control", "alternate", "command"]);
function releaseKeys() {
  releaseInput();
  document.querySelectorAll(".key").forEach(key => { key.classList.remove("active"); if (key.hasAttribute("aria-pressed")) key.setAttribute("aria-pressed", "false"); });
  $("keyStatus").textContent = live ? "Click a key to type" : "Click a key to try the feel";
}
function createKey(definition) {
  const [label, width] = Array.isArray(definition) ? definition : [definition, 1];
  const key = document.createElement("button"); key.type = "button"; key.className = "key";
  key.dataset.label = label;
  key.style.setProperty("--key-width", width); key.setAttribute("aria-label", label === "space" ? "Space" : label.replace("|", " or "));
  if (label.length > 3 && !label.includes("|")) key.classList.add("key-wide");
  if (label === "command") key.classList.add("key-command");
  if (label.includes("|")) {
    const [upper, lower] = label.split("|"); const small = document.createElement("small"); small.textContent = upper; key.append(small, document.createTextNode(lower));
  } else { key.textContent = label === "space" ? "" : label; }
  if (modifiers.has(label)) key.setAttribute("aria-pressed", "false");
  key.addEventListener("click", () => {
    if (modifiers.has(label)) {
      key.setAttribute("aria-pressed", String(key.getAttribute("aria-pressed") !== "true"));
      $("keyStatus").textContent = `${label} ${key.getAttribute("aria-pressed") === "true" ? "on" : "off"}${live ? "" : " · preview"}`;
    } else {
      const held = [...document.querySelectorAll('.key[aria-pressed="true"]')].map(k => k.textContent);
      releaseKeys(); key.classList.add("active"); setTimeout(() => key.classList.remove("active"), 160);
      pressKey(label, held, key.closest(".numeric-keys") !== null);
      $("keyStatus").textContent = [...held, label.replace("|", " / ")].join(" + ") + (live ? "" : " · preview");
    }
  });
  return key;
}
rows.forEach(row => { const element = document.createElement("div"); element.className = "key-row"; row.forEach(key => element.append(createKey(key))); $("typingKeys").append(element); });
["☀ −", "☀ +", "vol −", "vol +", "`", "=", "/", "*", "7", "8", "9", "−", "4", "5", "6", "+", "1", "2", "3", "enter", "0", "."].forEach(label => {
  const key = createKey(label); if (label === "0") key.classList.add("key-zero"); if (label === "enter") key.classList.add("key-enter"); $("numericKeys").append(key);
});
$("keyboardToggle").addEventListener("click", () => {
  const hidden = !$("keyboardPanel").hidden;
  releaseKeys(); $("keyboardPanel").hidden = hidden;
  $("keyboardToggle").setAttribute("aria-expanded", String(!hidden));
  $("keyboardToggle").querySelector("span").textContent = hidden ? "Show keyboard" : "Hide keyboard";
  $("keyboardToggle").querySelector("b").textContent = hidden ? "⌄" : "⌃";
});
window.addEventListener("blur", releaseKeys);
document.addEventListener("visibilitychange", () => { if (document.hidden) releaseKeys(); });
$("scanlines").addEventListener("change", () => $("display").classList.toggle("scanlines", $("scanlines").checked));
$("fullscreen").addEventListener("click", async () => {
  try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.querySelector(".workbench").requestFullscreen(); }
  catch { $("announcement").textContent = "Fullscreen is not available in this browser."; }
});

return {releaseKeys};
}
