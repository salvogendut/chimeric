# 1989 in the browser (experimental)

The SDL3/WebAssembly build runs the Previous-derived CPU and device core in a
browser. It reaches the **NeXT ROM monitor**, passes its self-test, and accepts
physical and on-screen keyboard input. The NeXT enclosure follows the supplied
[hardware reference](../POC/IllustratorScreenshot.jpg), with the original 1989
logo on both the monitor and keyboard. Retro CRT, Sapporo and Sapporo Dark are
adapted from 1984.

[Issue #3](https://github.com/salvogendut/1989/issues/3) tracks this work on
`3-webassembly-next-theme`. A complete NEXTSTEP installation has **not yet been
validated** in the browser. Audio, networking/NFS, NeXTdimension and native
desktop settings are not exposed in this initial build.

## Build and run

Install [Emscripten 6.0.6](https://github.com/emscripten-core/emsdk/tree/6.0.6),
activate it with `source /path/to/emsdk/emsdk_env.sh`, then from the repo root:

```sh
make -C web -j2
python3 web/serve.py
```

Open <http://127.0.0.1:1989/>. Select any images before clicking **Start NeXT**,
or start empty to explore the ROM monitor. Type `h` followed by Return for the
monitor's commands. Click the display to give physical keyboard input to the
guest; the folding keyboard supports latched modifiers for combinations.

In the usual development container:

```sh
distrobox enter -n my-distrobox -- bash -lc \
  'source ~/emsdk/emsdk_env.sh && make -C /var/home/salvogendut/Dev/1989/web -j2'
```

The output is a self-contained `web/dist/` tree. Native `make` remains separate.
The Emscripten SDL3 port is still experimental; the pinned SDK uses SDL 3.4.2.
Firmware comes from the existing `roms/` directory, as on desktop; see
[ROMS.md](../ROMS.md) for provenance and licensing notes. Guest OS/disk images
are supplied by the user and are not uploaded.

## Models

Use **Model** above the monitor before starting the computer. The default is
a non-Turbo NeXTcube. All browser profiles use **32 MB RAM**, with the correct
memory-bank layout and bundled firmware selected automatically.

| Model | CPU | Display | Native floppy | Native MO |
| --- | --- | --- | --- | --- |
| NeXT Computer | 68030, 25 MHz | Monochrome | No | Yes |
| NeXTcube | 68040, 25 MHz | Monochrome | Yes | Yes |
| NeXTcube Turbo | 68040, 33 MHz | Monochrome | Yes | No |
| NeXTstation | 68040, 25 MHz | Monochrome | Yes | No |
| NeXTstation Turbo | 68040, 33 MHz | Monochrome | Yes | No |
| NeXTstation Color | 68040, 25 MHz | Color | Yes | No |
| NeXTstation Turbo Color | 68040, 33 MHz | Color | Yes | No |

The model is locked after startup: it cannot reset an active disk session.
To change it, shut down NEXTSTEP, download your writable images, then reload
and select a new model. The enclosure theme is independent of the model.

Unsupported drive pickers are disabled. Images already selected for those
drives are kept for download or another model choice before startup, but are
not connected to the guest. SCSI disk and CD-ROM are available on every model.

## Media and saving

| Device | Connection | Behavior |
| --- | --- | --- |
| Hard disk | SCSI ID 1 | Select before starting; writable session copy, downloadable |
| CD-ROM | SCSI ID 3 | Load/eject at runtime; read-only |
| Floppy | Native controller, drive 0 | Load/eject at runtime; writable session copy, downloadable |
| Magneto-optical | Native MO controller, drive 0 | Load/eject at runtime; writable session copy, downloadable |

Supported removable drives are connected from power-on, so inserting/ejecting an image
does not change controller topology or reset the machine. Host and guest eject
are reflected in the panel. Eject leaves a writable session image available for
download. The other disks stay attached. Replacing the fixed hard disk requires
a fresh browser session; it is disabled while the CPU runs.

**Disk changes live only in the current tab.** Original selected files are never
modified. Use **Download image** to save the current writable copy. The CPU
briefly pauses at an I/O checkpoint and flushes host file buffers for this
operation. This cannot flush the guest OS's own caches: shut down NEXTSTEP
before downloading a final disk image. Reloading/closing discards session
copies; the browser prompts before leaving a session with writable images,
and before replacing a writable image used by the guest. Downloads do not
turn on automatic saving. Themes are the only persistent browser preference.

The initial in-memory implementation accepts at most **512 MiB of images in
total** and needs additional browser memory for emulation and downloads. Floppy
sizes are 720 KB, 1.44 MB or 2.88 MB. SCSI disk/CD images require whole 512/2048
byte sectors; MO images use Previous's 1296-byte encoded sectors. Validation
checks geometry, not whether an image contains a bootable or healthy filesystem.
Large images and durable browser storage need a later storage backend.

## Hosting

The CPU runs in a worker using Emscripten pthreads. SDL3 rendering and browser
input stay on the browser thread. The UI never waits synchronously for CPU/file
I/O; media operations use an acknowledged pause before changing files.

Serve over HTTPS (or localhost) with these headers on the static assets:

```text
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Resource-Policy: same-origin
```

`serve.py` provides those headers and binds only to localhost. A plain
`python3 -m http.server` is sufficient for the design preview but **not** the
live threaded build. The live page reports missing isolation instead of
attempting to start. The need for isolation follows
[Emscripten's threading requirements](https://emscripten.org/docs/porting/pthreads.html).

The [WebAssembly workflow](../.github/workflows/web.yml) builds on branch pushes,
pull requests and tags, runs browser tests, and uploads the static artifact and
a ROM screenshot. It does not publish a hosted site or attach experimental web
assets to the native release.

## Tests and code boundaries

```sh
cd web
npm ci
npx playwright install chromium
npm test
npm run test:browser
```

The browser test starts its own isolated local server. It uses disposable
images and the real WASM build to check all seven models' ROM startup, model
locking and drive compatibility, rendered output, virtual
and physical input, independent host/guest eject, insertion, invalid-image
rejection, byte-exact export, keyboard folding and all four responsive themes.
These checks do not establish NEXTSTEP installation or long-running disk
reliability. The native suite remains `make -C tests check`.

- `web_host.c`: initial hardware profile, guest input, acknowledged CPU pause,
  removable-media operations. CPU/MMU/device implementations stay in `src/`.
- `app.js`: runtime startup and status, connecting the UI to the core.
- `models.js`: model picker, core-provided descriptions and drive availability.
- `media.js`: session copies, validation, serialized media operations and export.
- `keyboard.js`: on-screen key translation and key release.
- `shell.js`: shared theme, media-row and keyboard presentation.
- `preview/`: reviewed layout and theme CSS; `assemble.py` replaces the preview
  display with the real canvas and assembles the live assets.

To view the original interface-only preview, serve the repository root and
open `/web/preview/`. Its pickers display filenames only, without reading disk
contents. Live and preview themes use separate `javascript1989.theme` and
`javascript1989.preview.theme` keys. `?theme=Sapporo` selects a theme for a visit;
names are case-insensitive and unknown values fall back to NeXT.

## Remaining work

- Validate boot/install, desktop use and disk writes with real NEXTSTEP media.
- Add durable/sparse storage for larger images, recovery after reload and better
  tracking of unsaved guest writes.
- Bring up audio, browser-native halt/error recovery and wider browser testing.
- Decide browser transports for networking/NFS and a NeXTdimension strategy.
- Validate deployment before hosted publication or web release packaging.
