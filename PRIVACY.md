# Privacy Policy

AI Shield does not collect, transmit, sell or share any data. It makes no network requests,
has no analytics or telemetry, and uses no third-party services.

## What it handles

On the supported AI chat sites (ChatGPT, Claude, Gemini, Grok, Copilot, DeepSeek, Perplexity,
Mistral), AI Shield reads:

- text you paste, to replace sensitive values (matched by your filters) with placeholders;
- text you copy or cut, to put the original values back;
- the text of the focused input, to show the unredacted prompt in the side panel.

## What it stores

All data stays in your browser, on your device:

- **Redactions** (original value, placeholder, timestamp): IndexedDB.
- **Filters, settings and the last mirrored prompt**: extension local storage.

Uninstalling the extension deletes this data.

## Permissions

- `clipboardRead` / `clipboardWrite`: read pasted text and restore original values on copy.
- `storage`: save filters, settings and the mirrored prompt locally.
- Site access (supported AI chat sites only): run the paste/copy handlers on those pages.

## Contact

Questions: open an issue on this project's repository.
