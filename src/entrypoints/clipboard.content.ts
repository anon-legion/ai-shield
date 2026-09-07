export default defineContentScript({
	matches: ['<all_urls>'],
	world: 'MAIN',
	runAt: 'document_start',

	main() {
		if (!navigator.clipboard) return;

		const notifyClipboardWrite = () => {
			window.postMessage({ type: 'ai-shield:clipboard-write' }, '*');
		};

		const originalWriteText = navigator.clipboard.writeText.bind(
			navigator.clipboard,
		);
		navigator.clipboard.writeText = async (text) => {
			const result = await originalWriteText(text);
			notifyClipboardWrite();
			return result;
		};

		const originalWrite = navigator.clipboard.write.bind(navigator.clipboard);
		navigator.clipboard.write = async (data) => {
			const result = await originalWrite(data);
			notifyClipboardWrite();
			return result;
		};
	},
});
