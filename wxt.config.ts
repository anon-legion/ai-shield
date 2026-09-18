import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
	srcDir: 'src',
	modules: ['@wxt-dev/module-svelte', '@wxt-dev/auto-icons'],
	autoIcons: {
		baseIconPath: 'assets/icon.svg',
		developmentIndicator: false,
	},
	manifest: {
		permissions: ['clipboardRead', 'clipboardWrite', 'storage'],
		// no popup: the toolbar icon opens the side panel (see background.ts)
		action: {
			default_title: 'AI Shield',
		},
	},
	vite: () => ({
		plugins: [tailwindcss()],
	}),
});
