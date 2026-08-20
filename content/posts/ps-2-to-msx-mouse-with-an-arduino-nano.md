---
title: "PS/2 to MSX mouse with an Arduino Nano"
date: 2026-08-19T21:42:06+02:00
draft: false
tags: ["MSX", "Arduino", "hardware", "mouse"]
---
I was able to put together a cheap PS/2-to-MSX mouse interface using an Arduino Nano. The project works by using the Arduino Nano as the bridge between a standard PS/2 mouse and the MSX mouse port.

The design is based on [denjhang’s MSX Nano Mouse 2025 repository](https://github.com/denjhang/MSX-Nano-Mouse-2025), which provides both the Gerber files for the PCB and the firmware source code. Having those files available made the build straightforward and inexpensive: I could order the board, assemble the small set of components, flash the Nano, and connect a PS/2 mouse.

I used a cheap Arduino Nano clone, so getting the firmware uploaded required a little experimentation in the Arduino IDE. The important part was selecting **ATmega328P (Old Bootloader)** as the processor option and using the **2014 `.ino` file** from the repository.

I tested the adapter successfully in both **SymbOS** and **GeoBench**. In each case, the mouse was recognized and usable, making it a practical low-cost option for adding mouse support to an MSX setup.

![PS/2-to-MSX mouse interface screenshot](https://i.postimg.cc/KjnzXCXV/20260819-223329.jpg)

If you want to build one yourself, the Gerber files, code, and project documentation are available in the [MSX-nano-mouse-2025 repository](https://github.com/denjhang/MSX-Nano-Mouse-2025).
