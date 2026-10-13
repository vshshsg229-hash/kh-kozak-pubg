# KH Kozak Gaming Hub — Windows app

This Electron desktop shell opens the existing KH Kozak website in a dedicated Windows window. The site itself remains hosted on GitHub Pages, so an internet connection is required for the website content.

## Build on Windows

1. Install Node.js 22 or newer.
2. Open a terminal in this folder.
3. Run `npm install`.
4. Run `npm run build:win`.
5. Find the installer in `dist/`.

## Build through GitHub Actions

Open the repository's **Actions** tab, choose **Build KH Kozak Windows app**, and press **Run workflow**. When it completes, download the `KH-Kozak-Windows-Installer` artifact from that workflow run.

This creates an installer artifact; it is not published as a public release automatically.
