import { MenuId } from '../models/redaction';
import { AI_MATCH_PATTERNS, isAiSite } from '../utils/aiSites';
import { initPromptMirror } from '../utils/promptMirror';
import {
	redact,
	redactSelection,
	unredact,
	whitelistSelection,
} from '../utils/redaction/redactionHandler';

export default defineContentScript({
	matches: AI_MATCH_PATTERNS,
	main() {
		// ponytail: match patterns can't gate SPA path changes (x.com/i/grok),
		// re-check here; navigating into /i/grok after load stays uncovered
		if (!isAiSite(location.hostname, location.pathname)) return;

		initPromptMirror();

		document.addEventListener('copy', unredact);
		document.addEventListener('cut', unredact);
		window.addEventListener('message', (e) => {
			if (e.source === window && e.data?.type === 'ai-shield:clipboard-write') {
				unredact();
			}
		});

		document.addEventListener('paste', redact, { capture: true });

		// context menu clicks, pushed from the background
		browser.runtime.onMessage.addListener((message) => {
			if (message?.type === MenuId.Redact) redactSelection();
			if (message?.type === MenuId.Whitelist) void whitelistSelection();
		});
	},
});
