---
title: "New MSX developments"
date: 2026-07-31T13:12:33+02:00
draft: false
---
![rainbios boot screen](https://i.postimg.cc/sxqT31C0/rainbios-1.png)
![rainbios boot menu](https://i.postimg.cc/hv62KhRM/rainbios-2.png)
I have beend digging a lot recently,  on the MSX side of things. After making sure GEOBENCH would run properly on the platform
and developing a UNAPI-compatible network daemon for SymbOS (which is at the moment 'unreleased' until I hear from
Prodatron). I decided to dedicate some time to the issue of 'having an open source bios for the MSX which can run basic
and launch cartridges'. I named the project : [rainbios](https://github.com/salvogendut/rainbios) .Right now it kinda boots
and lets you boot simple game cartridges that do not require disk or other particular hardware. A second rom has been added with
the Z80 version of the BBC basic and can be run from the menu. Basic kinda works but it's still early in the process and I am 
expecting lots of bugs. 
