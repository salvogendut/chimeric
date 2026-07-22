---
title: "Complexity over 10000"
date: 2026-07-18T18:41:13+02:00
draft: false
---
Dealing with my new pet project 'NixBench' a sort of Wayland-based desktop for
NetBSD (probably portable to other platforms as well). The level of layering and 
complexity modern *nix desktops have reached due to historical reasons is ridiculous.
For every application you need to take into account the native layer, the GTK compatibility one
the X.org/Xwayland one. When there is an issue and things don't work as expected is usually
a problem of plumbing between all these layers.