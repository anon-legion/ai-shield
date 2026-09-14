import { initPromptMirror } from '../utils/promptMirror';
import { redact, unredact } from '../utils/redaction/redactionHandler';

export default defineContentScript({
	matches: ['<all_urls>'],
	main() {
		initPromptMirror();

		document.addEventListener('copy', unredact);
		document.addEventListener('cut', unredact);
		window.addEventListener('message', (e) => {
			if (e.source === window && e.data?.type === 'ai-shield:clipboard-write') {
				unredact();
			}
		});

		document.addEventListener('paste', redact, { capture: true });
	},
});
