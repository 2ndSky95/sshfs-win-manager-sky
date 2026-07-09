# SSHFS-Win Manager Sky

A clean, single-window GUI for mounting remote SSH/SFTP folders as local drives with SSHFS.

**Sky Edition** is a design-focused fork of [SSHFS-Win Manager Evo](https://github.com/emulsion-io/sshfs-win-manager-evo) by Fabrice Simonet, which itself modernized the original [SSHFS-Win Manager](https://github.com/evsar3/sshfs-win-manager) by Evandro Araujo.

> **Transparency:** This fork is mostly a visual redesign with a handful of small functional changes and bug fixes — the heavy lifting (encryption, authentication modes, connection engine) is Evo's work. It was also built openly in an AI pair-programming workflow with Claude (Fable 5). See the honest changelog below for exactly what changed beyond design.

## Screenshots

| Connections | Settings | Compact mode |
|---|---|---|
| ![Connections](imgs/sky-connections.png) | ![Settings](imgs/sky-settings.png) | ![Compact](imgs/sky-compact.png) |

## The Sky design

The goal was a subtle, unobtrusive tool that feels like a small native utility instead of a website in a window:

- **One fixed-size, frameless window.** Top tab bar (Favorites / Connections / Settings / Debug / About), thin status bar at the bottom, window controls integrated into the tab bar. The window can be dragged from anywhere.
- **Everything inline.** Clicking a server unfolds its details and actions directly under the card — no side panel, no extra windows. Adding/editing a connection opens as a full-area view inside the same window.
- **Quiet visuals.** Compact cards sized to their content, centered action buttons, restrained hover glow, gold outline for favorites, consistent group boxes and button bars across Settings and the connection form.
- **Compact mode** shrinks the window to 440 px with icon-only tabs for keeping it docked at a screen edge.

## What Evo brought (and Sky keeps)

All of this is Fabrice Simonet's work in Evo and remains fully intact:

- **Encrypted password storage**: AES-256-GCM with a global passkey (scrypt key derivation) instead of the original's plain-text storage, including automatic migration of legacy plain-text passwords.
- **Rich authentication**: private key, key + passphrase, PAM/OTP (`keyboard-interactive`), key + passphrase + PAM/OTP, password, password-on-connect.
- **Reliable startup**: auto-connect runs sequentially, fixing the original's stuck "connecting" state when many servers connect at once; per-connection timeout handling.
- Connection management: favorites, search, sorting, custom per-connection icons, JSON import/export, legacy configuration import.
- Quality of life: Tabby/system terminal integration, SSH command copy, IPv6 support, custom SSHFS command-line options, themes, debug logging, tray operation, start with Windows.
- Modern toolchain: Vue 3 + electron-vite.

## Honest changelog — what Sky actually changes

**Design (the bulk of this fork):** complete single-window tab layout, inline connection details, embedded add/edit form, status bar, compact mode rework, frameless window with integrated controls, countless spacing/sizing refinements.

**Functional changes (small, deliberate):**

- **Passkey on/off switch** in Settings. Turning it off decrypts stored passwords back to plain text (with an explicit warning) and skips all passkey prompts; turning it on re-encrypts them. Toggling always requires entering the passkey.
- **Three new languages** (German, Spanish, Italian, Chinese — in addition to Evo's English/French); default language is now English.
- **Data profile migration**: on first start, the Evo profile (`%AppData%\sshfs-win-manager-evo`) is copied to the Sky profile automatically — connections and settings carry over.
- Default sort mode is now *Manual*; Settings "Cancel" returns to the Connections tab.
- **Removed:** the demo mode toggle and the separate detail side panel (replaced by inline details). Nothing else was removed.

**Bug fixes (also affect upstream Evo):**

- Fixed a crash that made **every password/passphrase/PAM prompt window unusable**: the `@` in `{user}@{host}` inside translation strings is special syntax in vue-i18n and broke message compilation (blank, unclosable modal). Escaped in all locales.
- Fixed a race in the password prompt window that showed a permanent "Loading..." state when the store had not hydrated yet.
- Fixed a CSS data-URI that broke style minification in production builds.

## Install

Download the installer from [Releases](https://github.com/2ndSky95/sshfs-win-manager-sky/releases) and run it. Requirements: [SSHFS-Win](https://github.com/winfsp/sshfs-win) (with WinFsp) must be installed.

If you come from Evo: install Sky, verify your connections are there, then uninstall Evo (otherwise two tray apps run in parallel).

### Build from source

```
npm install
npm run dev        # development with hot reload
npm run build:win  # NSIS installer in build/
```

## Credits & license

- Original project: [SSHFS-Win Manager](https://github.com/evsar3/sshfs-win-manager) — Evandro Araujo
- Evo edition: [SSHFS-Win Manager Evo](https://github.com/emulsion-io/sshfs-win-manager-evo) — Fabrice Simonet ([emulsion.io](https://emulsion.io))
- Sky edition: [4-sky.de](https://4-sky.de), built in an open AI pair-programming session with Claude (Fable 5)

MIT license. Copyright and license notices of the original projects are preserved.
