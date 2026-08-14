import { redact, unredact } from '../utils/redaction/redactionHandler';

export default defineContentScript({
	matches: ['<all_urls>'],
	main() {
		document.addEventListener('copy', unredact);
		document.addEventListener('cut', unredact);

		document.addEventListener('paste', redact, { capture: true });
	},
});
