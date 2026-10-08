# AI Shield

Browser extension that redacts sensitive text pasted into AI chat sites and restores it when
you copy the response. Everything runs locally; see [PRIVACY.md](PRIVACY.md).

## Build from source

Requirements: [Bun](https://bun.sh) 1.4.2 and Node.js 25.1.0 (Linux, macOS or Windows).

```bash
bun install --frozen-lockfile   # also runs `wxt prepare`
bun run zip:firefox             # Firefox: .output/ai-shield-<version>-firefox.zip
bun run zip                     # Chrome:  .output/ai-shield-<version>-chrome.zip
```

The unpacked Firefox build is in `.output/firefox-mv2/`, Chrome in `.output/chrome-mv3/`.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Svelte](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode).

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) first — it covers the
fork-and-branch workflow, branch naming, and the project's policy on AI-assisted work.

## License

Copyright (C) 2026 AI Shield contributors.

This program is free software: you can redistribute it and/or modify it under the terms of
the GNU General Public License as published by the Free Software Foundation, either version 3
of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
See the [GNU General Public License](LICENSE) for more details.
