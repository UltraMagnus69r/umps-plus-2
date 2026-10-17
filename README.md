# PipMint

**PipMint · Custom Card Creator** (v0.3.0)

Custom Magic-style card studio for web, desktop (Electron), and Android (Capacitor).

## Get installers

Prebuilt packages are on the **[GitHub Release for v0.3.0](https://github.com/UltraMagnus69r/umps-plus-2/releases/tag/v0.3.0)** (too large for the git tree):

| File | Platform |
|------|----------|
| `PipMint-Setup-0.3.0.exe` | Windows installer |
| `PipMint-Portable-0.3.0.exe` | Windows portable (no install) |
| `PipMint-0.3.0.x86_64.rpm` | Fedora / RHEL |
| `PipMint-0.3.0-debug.apk` | Android (sideload) |

**Fedora:** `sudo dnf install ./PipMint-0.3.0.x86_64.rpm`

**Windows:** run `PipMint-Setup-0.3.0.exe`, or use the portable `.exe`.

**Android:** `adb install -r PipMint-0.3.0-debug.apk` (or open the APK on device).

Debian `.deb` is built with `npm run desktop:linux` when needed; include it in the Desktop installer set when present.

## Develop from source

```bash
npm install
npm run dev
```

Production web build:

```bash
npm run build
```

Other packages:

```bash
npm run desktop:linux   # .deb + .rpm
npm run desktop:win     # NSIS + portable + zip
npm run android:apk     # Capacitor debug APK
```

Requires Node.js 18+ (Electron / Android tooling as documented in each script).
