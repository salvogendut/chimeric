---
title: "Browsing the Internet on SymbOS"
date: 2026-08-20T23:40:12+02:00
draft: false
tags: ["SymbOS", "SymZilla", "MSX", "Amstrad CPC", "Retrocomputing", "Web Browser"]
---
Browsing the modern Internet from an 8-bit computer is no small feat. **SymZilla** was originally developed by SymbOS’s Prodatron as a document viewer. My contribution was to add networking and support for displaying simplified HTML pages, helping bring web browsing to [SymbOS](https://symbos.org/) on classic machines.

The browser relies on [GB-proxy](https://github.com/salvogendut/GB-proxy), a companion proxy designed to reduce the complexity of today’s web. GB-proxy retrieves pages on behalf of the client, handles SSL/TLS connections, strips pages down to a simpler form of HTML, and shrinks and converts images into a format SymbOS can display. This lets the browser concentrate on presenting a practical, lightweight version of the web within the limits of the platform.

The result is a remarkably capable browsing experience across the SymbOS machines, including MSX and Amstrad CPC systems.

## Screenshots

### SymbOS on MSX

![SymZilla browser running on SymbOS for MSX](https://i.postimg.cc/ydtWRpbJ/1983-03743.png)

![Another SymZilla browsing view on SymbOS for MSX](https://i.postimg.cc/V6p5tZVt/1983-05339.png)

### SymbOS on Amstrad CPC

![SymZilla browser running on SymbOS for Amstrad CPC](https://i.postimg.cc/tTw76vMP/1984-1787258493.png)

![Another SymZilla browsing view on SymbOS for Amstrad CPC](https://i.postimg.cc/3RVWGfcm/1984-1787258594.png)

## Projects

- [SymbOS website](http://www.symbos.de/)
- [SymZilla source code](https://github.com/salvogendut/symapp-symzilla)
- [GB-proxy source code](https://github.com/salvogendut/GB-proxy)
