import { MenuId, RESTORE_MESSAGE } from '../models/redaction';
import { AI_MATCH_PATTERNS, isAiSite } from '../utils/aiSites';
import { initPromptMirror } from '../utils/promptMirror';
import {
	redact,
	redactSelection,
	unredact,
	whitelistSelection,
} from '../utils/redaction/redactionHandler';
import {
	initRedactionOverlay,
	restoreRedaction,
} from '../utils/redaction/redactionOverlay';
import { initToast } from '../utils/toast';

export default defineContentScript({
	matches: AI_MATCH_PATTERNS,
	main(ctx) {
		// ponytail: match patterns can't gate SPA path changes (x.com/i/grok),
		// re-check here; navigating into /i/grok after load stays uncovered
		if (!isAiSite(location.hostname, location.pathname)) return;

		initPromptMirror();
		initRedactionOverlay();
		initToast(ctx);

		document.addEventListener('copy', unredact);
		document.addEventListener('cut', unredact);
		window.addEventListener('message', (e) => {
			if (e.source === window && e.data?.type === 'ai-shield:clipboard-write') {
				unredact();
			}
		});

		document.addEventListener('paste', redact, { capture: true });

		const handlers: Record<
			string,
			(message: { alias: string; nth?: number }) => void
		> = {
			// context menu clicks, pushed from the background
			[MenuId.Redact]: redactSelection,
			[MenuId.Whitelist]: () => void whitelistSelection(),
			// x on a highlighted span in the sidepanel prompt mirror
			[RESTORE_MESSAGE]: ({ alias, nth = 0 }) =>
				void restoreRedaction(alias, nth),
		};

		browser.runtime.onMessage.addListener((message) => {
			handlers[message?.type]?.(message);
		});
	},
});
