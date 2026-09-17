# God's Eye (godseye)

A complete interface overhaul for [0 A.D.](https://play0ad.com), the free open-source RTS. Modern styling, a reworked lobby, smarter game setup, and deep customization, all in one mod.

![God's Eye](https://user-images.githubusercontent.com/90521128/194136599-a1e687b6-eded-4036-968f-178caabbf61d.png)

## Features

**Modern interface.** A full visual reskin across menus, lobby, game setup, and summary screens. Custom borders, buttons, panels, and the ModernDialog theme replace the default look.

**Enhanced lobby.** Extra toolbar buttons (buddy list, civilization info, forum, hotkeys, leaderboard, profile), game list filters, richer chat with notifications and sounds, player list improvements, and profile panels.

**Smarter game setup.** Streamlined host and join flow, per-player controls, ready/check states, and optional countdown before match start.

**In-game tweaks.** Configurable stats and players overlays, chat panel resizing, and quality-of-life options carried over from the AutoCiv tradition.

**Custom audio.** New UI sounds for chat alerts and game events, plus additional menu music tracks.

**Configurable.** Most behavior can be toggled in the mod's options page. Settings persist in `godseye_data/default_config.json`.

## Compatibility

Built for **0 A.D. 28 "Boiorix"** (`0ad=0.28.0`). Disable other UI mods while using God's Eye to avoid conflicts.

## Installation

**From a release (recommended):**

1. Download the latest `godseye-<version>.pyromod` from the [Releases](../../releases) page.
2. Place it in your 0 A.D. mods folder:
   - Linux: `~/.local/share/0ad/mods/`
   - macOS: `~/Library/Application Support/0AD/Mods/`
   - Windows: `~\Documents\My Games\0ad\mods\`
3. Launch 0 A.D., open **Settings > Mod Selection**, enable God's Eye, and click **Save and Restart**.

**From source:**

1. Clone this repo into your mods folder under the name `godseye`.
2. Enable it from **Settings > Mod Selection** and restart.

## Building

Pushes to the `ALARIC` branch automatically build a `.pyromod` via GitHub Actions. Tagging `vX.Y.Z` creates a GitHub Release with the packaged mod and a sha256 checksum.

To build locally, zip the repo contents (excluding `.git` and `.github`) and rename the archive to `godseye.pyromod`.

## Configuration

Open the mod's options page in-game, or edit `godseye_data/default_config.json` directly. Key toggles include lobby chat behavior, game setup countdown, overlay visibility, and chat panel sizing.

## Contributing

Issues and pull requests are welcome. The mod targets the latest stable 0 A.D. release; GUI files are full overrides of the base game, so changes to upstream screens need re-basing. See the commit history for how past migrations were handled.

## Credits

Built by [rossenburgg](https://github.com/rossenburgg). Interface concepts in the tradition of the 0 A.D. modding community, including AutoCiv. 0 A.D. itself is by Wildfire Games.

## License

Derived from 0 A.D., so the same terms apply: GPL-2.0 for code, CC-BY-SA-3.0 for artwork, unless noted otherwise. Audio attributions are in `audio/LICENSE.txt`.
