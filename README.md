# AI Shield

Browser extension that redacts sensitive text pasted into AI chat sites and restores it when
you copy the response. Everything runs locally; see [PRIVACY.md](PRIVACY.md).

## What it does

When you paste text into the chatbox of a supported AI site, AI Shield swaps every sensitive
value it recognises for a placeholder such as `[01JX3M8Q2V7K4T9B6N5C0D1EFG]` before the page
sees it. The AI only ever receives the placeholder. When you copy text back out of the
conversation, placeholders in the clipboard are swapped back to the original values.

The same value always gets the same placeholder, so the AI can still tell "this is the same
person/account as before" without knowing who or what it is.

## Supported sites

| Site | Host |
| --- | --- |
| ChatGPT | `chatgpt.com`, `chat.openai.com` |
| Claude | `claude.ai` |
| Gemini | `gemini.google.com` |
| Grok | `grok.com`, `x.com/i/grok` |
| Copilot | `copilot.microsoft.com` |
| DeepSeek | `chat.deepseek.com` |
| Perplexity | `perplexity.ai` |
| Mistral | `mistral.ai` |

The extension does nothing on any other site.

## Features

- **Auto redact on paste.** Pasted plain text is checked against your enabled filters and
  matches are replaced with placeholders. Can be switched off in the side panel.
- **Restore on copy.** Copying or cutting on the page, or using a site's own "copy" button,
  rewrites the clipboard so placeholders become the original values again. Bold and
  markdown-escaped forms of a placeholder (`[**…**]`, `\[…\]`) are recognised too.
- **Toast on automatic changes.** When a paste is redacted or a copy is restored, a short
  notice appears on the page for three seconds. Actions you trigger yourself show none.
- **Built-in filters.** Emails, phone numbers, names, credit cards, bank accounts, API keys,
  secrets (private keys, bearer tokens, passwords in `key=value` form, credentials in URLs)
  and passport numbers. Each can be switched off or have its label and pattern edited.
- **Custom filters.** Add your own as plain text or as a regular expression, optionally case
  insensitive. Custom filters can be deleted; built-in ones can only be disabled or edited.
- **Whitelist.** Values that should never be redacted. A whitelist entry exempts any filter
  match that contains it, so whitelisting `example.com` also exempts `me@example.com`.
- **Manual redact.** Select text in the chatbox, right-click, **Redact**: the selection
  becomes a placeholder. No filter is created, it is a one-off.
- **Whitelist from the page.** Select text, right-click, **Whitelist**. If the selection is a
  placeholder, the original value behind it is what gets whitelisted.
- **Highlighted redactions.** Placeholders in the chatbox are highlighted in translucent
  blue. Each highlight has an **×** at its upper-right corner that puts the original text
  back.
- **Prompt mirror.** The side panel shows what you are about to send with the original
  values filled in, the redacted parts highlighted, an **×** on each to restore it in the
  chatbox, and a count of redactions.

## How to use

1. **Install.** Build from source (below), then load the unpacked build:
   - Chrome: `chrome://extensions` → enable *Developer mode* → *Load unpacked* →
     `.output/chrome-mv3/`
   - Firefox: `about:debugging#/runtime/this-firefox` → *Load Temporary Add-on* →
     `.output/firefox-mv2/manifest.json`
2. **Open the side panel** by clicking the AI Shield toolbar icon.
3. **Paste as usual** on a supported site. Sensitive values arrive in the chatbox as
   highlighted placeholders; the side panel's *Prompt* section shows the original text.
4. **Fix what the filters got wrong:**
   - something was redacted that should not be → click the **×** on its highlight (in the
     chatbox or in the side panel). To stop it being redacted in future pastes, select it,
     right-click → **Whitelist**.
   - something was missed → select it in the chatbox, right-click → **Redact**. To catch it
     automatically next time, add a filter under *New filter* in the side panel.
5. **Send the message.**
6. **Copy the response** (select + copy, or the site's copy button) and paste it wherever
   you need it: the original values are back.

Filters and whitelist entries are managed in the side panel: tick the checkbox to enable or
disable one, use the pencil to edit it, and *New filter* / *New white list* to add one.

## What it can and cannot do

It can:

- keep recognised sensitive values out of what you paste into a supported AI site;
- give you the originals back in anything you copy out of the conversation;
- let you redact or restore individual values by hand before sending;
- work entirely offline: no network requests, no account, no telemetry.

It cannot:

- **Redact what you type.** Only pasted text is checked automatically. Typed text is sent
  as-is unless you redact it by hand.
- **Guarantee detection.** Filters are regular expressions. They miss values in unexpected
  formats and sometimes match things that are not sensitive. Names in particular are only
  caught after cue words such as `Name:`, `Dear` or `To`. Always check the highlights and
  the prompt mirror before sending.
- **Redact files, images or attachments.** Only plain text pasted into the chatbox is
  handled; uploads and drag-and-drop are not inspected.
- **Take back what was already sent.** Restoring or whitelisting only affects the message
  you are still composing and future pastes.
- **Show original values in the conversation.** Responses on the page keep their
  placeholders; originals come back only when you copy.
- **Keep formatting on a redacted paste.** When a paste contains a match, it is inserted as
  plain text.
- **Let the AI reason about a redacted value.** It sees an opaque token, so it cannot, for
  example, validate an email address or do arithmetic on a redacted number.
- **Work on other sites,** or on Grok inside x.com if you navigated there from another x.com
  page without a reload.
- **Protect stored data from someone with access to your browser profile.** Original values
  and their placeholders are kept in the browser's local extension storage, and
  are only removed by uninstalling the extension.

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
