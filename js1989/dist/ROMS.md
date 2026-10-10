# 1989 ROMs

1989 emulates the NeXT family of 68030/68040 machines. Each machine model
loads the matching firmware image from the NeXT ROM set. The images shipped
with the upstream "Previous" 4.3 distribution are included in this project
under `roms/` and installed to `$(pkgdatadir)/roms`:

| File              | Size   | Used by                                  |
|-------------------|--------|------------------------------------------|
| `Rev_1.0_v41.BIN` | 64 KiB | NeXT Computer (68030 Cube)               |
| `Rev_0.8_v31.BIN` | 64 KiB | NeXT Computer (board revision 1)         |
| `Rev_2.5_v66.BIN` | 128 KiB| NeXTstation / NeXTcube (non-Turbo)       |
| `Rev_3.3_v74.BIN` | 128 KiB| NeXTstation Turbo (Color) / NeXTcube Turbo |
| `ND_step1_v43.BIN`| 128 KiB| NeXTdimension Graphics Board             |

The ROM defaults in the configuration file use the data directory, falling
back to the install-time `ROM_INSTALL_DIR` (i.e. `$(pkgdatadir)/roms`) when
the image is not present next to the executable. The per-model selection
happens automatically based on the machine type (`030`, `040`, or `Turbo`),
so the individual file names do not need to be changed when using the
default layout.

## Custom MAC address

The firmware image stores a MAC address. If you run several machines on one
LAN you may want to give each one its own address using the `bUseCustomMac`
option and the `nRomCustomMac0`..`nRomCustomMac5` values in the `[ROM]`
section. The configured address replaces bytes 3..5 of the MAC and the CRC
bytes are recomputed on load.

## Legacy ROM support

The following images are part of the Previous distribution but are not
needed for the standard machine set: `Rev_0.8_v31.BIN` selects the "board
revision 1" personality for the NeXTcube/NeXTstation RTC variant.

The ROM disassembly `docs/ROMV66-0001E-02588.ASM` (from the Previous
distribution) is included for reference only and is not installed.