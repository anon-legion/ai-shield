import { mount } from 'svelte';
import type { ContentScriptContext } from 'wxt/utils/content-script-context';
import css from '../assets/toast.css?inline';
import Toast, { showToast } from '../lib/components/Toast.svelte';

let context: ContentScriptContext | undefined;
let host: Promise<HTMLElement> | undefined;

async function createHost(ctx: ContentScriptContext): Promise<HTMLElement> {
	// css goes in as a string: no fetch, nothing web accessible to the page
	const ui = await createShadowRootUi(ctx, {
		name: 'ai-shield-toast',
		css,
		position: 'inline',
		anchor: 'html',
		// closed like the redaction overlay, page script cannot reach in
		mode: 'closed',
		onMount: (container) => mount(Toast, { target: container }),
	});

	ui.mount();

	return ui.shadowHost;
}

function initToast(ctx: ContentScriptContext): void {
	context = ctx;
}

function notify(message: string): void {
	if (!context) return;

	showToast(message);

	// built on first use: a page that never auto-redacts pays nothing
	host ??= createHost(context);

	host
		.then((element) => {
			// spa re-renders can drop foreign nodes
			if (!element.isConnected) document.documentElement.append(element);
		})
		.catch((err) => {
			console.error(`AI-Shield: Could not show toast\n${err}`);
		});
}

export { initToast, notify };
