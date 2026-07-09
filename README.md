# SSHFS-Win Manager Sky

Mount remote SSH/SFTP folders as local Windows drives — in one clean, compact window.

Sky is a redesign of [SSHFS-Win Manager Evo](https://github.com/emulsion-io/sshfs-win-manager-evo) by Fabrice Simonet, based on the original [SSHFS-Win Manager](https://github.com/evsar3/sshfs-win-manager) by Evandro Araujo.

## Screenshots

| Connections | Settings | Compact mode |
|---|---|---|
| ![Connections](imgs/sky-connections.png) | ![Settings](imgs/sky-settings.png) | ![Compact](imgs/sky-compact.png) |

## What's different from Evo

Evo modernized the original app; Sky rethinks how it looks and feels:

- **One window for everything.** Frameless, fixed-size, with a top tab bar and a slim status bar. Connection details, adding and editing all happen inline — no popup windows, no side panels.
- **Compact mode.** Shrinks to 440 px with icon-only tabs, made to sit docked at the edge of your screen.
- **Quieter design.** Small native-utility feel instead of a website in a window: compact cards, restrained highlights, drag the window from anywhere.
- **Optional password encryption.** The passkey can now be switched on or off in Settings — your choice between convenience and encrypted storage.
- **More languages.** German, Spanish, Italian and Chinese added to English and French.
- **Seamless switch.** On first start, your Evo connections and settings are migrated automatically.

Everything that made Evo solid — encrypted password storage, the full range of SSH authentication modes, reliable auto-connect, favorites, import/export, tray operation — is untouched underneath.

## Install

1. Install [SSHFS-Win](https://github.com/winfsp/sshfs-win) (includes WinFsp).
2. Download the installer from [Releases](https://github.com/2ndSky95/sshfs-win-manager-sky/releases) and run it.

Coming from Evo? Install Sky, check that your connections are there, then uninstall Evo.

## Build from source

```
npm install
npm run dev        # development with hot reload
npm run build:win  # NSIS installer in build/
```

## Credits & license

- Original: [SSHFS-Win Manager](https://github.com/evsar3/sshfs-win-manager) — Evandro Araujo
- Evo: [SSHFS-Win Manager Evo](https://github.com/emulsion-io/sshfs-win-manager-evo) — Fabrice Simonet ([emulsion.io](https://emulsion.io))
- Sky: [4-sky.de](https://4-sky.de)

MIT license. Original copyright and license notices are preserved.
