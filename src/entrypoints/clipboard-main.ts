export default defineContentScript({
	matches: ['<all_urls>'],
	world: 'MAIN',

	main() {
		console.log('AI-Shield: Clipboard main script loaded');

		if (!navigator.clipboard) return;

		console.log('AI-Shield: Overriding navigator.clipboard.writeText');

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
