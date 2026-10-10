#!/usr/bin/env python3
"""Assemble the live shell from the reviewed preview, keeping one theme layout."""
from pathlib import Path
import shutil

root = Path(__file__).resolve().parent
dist = root / "dist"
dist.mkdir(exist_ok=True)
html = (root / "preview/index.html").read_text()
start = html.index('            <div id="display"')
end = html.index('\n          </div>\n          <div class="monitor-chin"', start)
html = html[:start] + '''            <div id="display" class="display live-display">
              <canvas id="canvas" width="1120" height="832" tabindex="0" aria-label="NeXT emulator display"></canvas>
              <div class="power-screen" id="powerScreen">
                <img src="brand-1989.png" alt="1989" width="90" height="90">
                <h2>Your NeXT chapter.</h2>
                <p>Choose a system disk, or explore the ROM monitor.</p>
                <button id="startButton" type="button" disabled>Loading emulator…</button>
              </div>
            </div>''' + html[end:]
html = html.replace('data-theme="next"', 'data-theme="next" data-runtime="wasm"', 1)
html = html.replace('<title>1989 — NeXT theme preview</title>', '<title>1989 — NeXT in your browser</title>')
html = html.replace('<script type="module" src="preview.js"></script>', '<script src="1989.js" defer></script>\n  <script type="module" src="app.js"></script>')
html = html.replace('</head>', '  <link rel="stylesheet" href="runtime.css">\n</head>')
html = html.replace('../../1989-logo.png', 'brand-1989.png').replace('../../POC/IllustratorScreenshot.jpg', 'reference.jpg')
html = html.replace('Interface preview', 'WebAssembly · experimental').replace('NeXTstation visual preview', 'NeXT emulator')
html = html.replace('<b>NeXTstation</b> <i>68040 · 25 MHz · 32 MB</i>', '<b id="modelName">NeXTcube</b> <i id="modelSpecs">68040 · 25 MHz · 32 MB · Monochrome</i>')
html = html.replace('<div class="machine-caption">', '''<div class="model-picker">
          <label for="modelSelect">Model</label>
          <select id="modelSelect" aria-describedby="modelHint" disabled></select>
          <p id="modelHint">Choose a model before starting.</p>
        </div>
        <div class="machine-caption">''')
html = html.replace('Click a key to try the feel', 'Start the computer to type')
html = html.replace('Preview mode', 'Local session')
html = html.replace('Design preview · emulation is not running', 'SDL3 / WebAssembly · experimental')
html = html.replace('<p class="media-note">', '<p class="storage-note">Disk changes live in this tab. Download writable images before reloading or closing. Originals stay untouched.</p>\n        <p class="media-note">')
html = html.replace('<div class="studio">', '<p id="runStatus" class="run-status" role="status">Loading WebAssembly…</p>\n    <div class="studio">')
(dist / "index.html").write_text(html)
for name in ["app.js", "shell.js", "keyboard.js", "media.js", "models.js", "runtime.css", "README.md", "serve.py"]:
    shutil.copy2(root / name, dist / name)
shutil.copy2(root / "preview/preview.css", dist / "preview.css")
shutil.copytree(root / "preview/themes", dist / "themes", dirs_exist_ok=True)
shutil.copy2(root.parent / "1989-logo.png", dist / "brand-1989.png")
shutil.copy2(root.parent / "POC/IllustratorScreenshot.jpg", dist / "reference.jpg")
shutil.copy2(root.parent / "LICENSE", dist / "LICENSE")
shutil.copy2(root.parent / "ROMS.md", dist / "ROMS.md")
