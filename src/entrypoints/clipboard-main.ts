export default defineContentScript({
	matches: ['<all_urls>'],
	world: 'MAIN',
	main() {
		if (!navigator.clipboard) return;
		const orig = navigator.clipboard.writeText.bind(navigator.clipboard);

		navigator.clipboard.writeText = (text: string) =>
			orig(text.replaceAll('[REDACTED]', '[UNREDACTED]'));
	},
});
