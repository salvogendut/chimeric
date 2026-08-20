---
title: "Smoke testing the Omega MSX"
date: 2026-08-19T21:35:45+02:00
draft: false
tags: ["MSX", "Omega MSX", "repair", "retrocomputing", "hardware"]
---
After some initial setbacks, we are finally making progress with the Omega MSX.

The first problem was a defective **Yamaha 8139** chip, which prevented the system from booting at all. Once that was resolved, we were able to get the machine to display **C-BIOS** and its diagnostic screens.

That revealed a second fault: capacitor **C64** was measuring only **68 µF**, rather than its specified **220 µF**. This was responsible for a strange yellow ghosting effect on the display.

![Faulty C64 capacitor](https://i.postimg.cc/528Syrxm/20260819-113329.jpg)

![Omega MSX diagnostics and display issue](https://i.postimg.cc/JhmckQn9/20260819-113353.jpg)

![Omega MSX repair detail](https://i.postimg.cc/BvscKCbf/20260819-113400.jpg)

There was one further setback: while manoeuvring the RTC chip back into its socket, I completely tore off one of its pins. It is not repairable, so I have had to back-order a replacement RTC chip.

Once the replacement arrives and is installed, the Omega should be fairly complete. Then it will be time to try it with some real cartridges and/or games.
