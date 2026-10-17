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
	manifest: ({ browser }) => ({
		permissions: ['clipboardRead', 'clipboardWrite', 'storage'],
		// no popup: the toolbar icon opens the side panel (see background.ts)
		action: {
			default_title: 'AI Shield',
		},
		...(browser === 'firefox' && {
			browser_specific_settings: {
				gecko: {
					// permanent AMO identity, NEVER CHANGE
					id: 'ai-shield@shiftleft.systems',
					// nothing leaves the device
					data_collection_permissions: { required: ['none'] },
				},
			},
		}),
	}),
	vite: () => ({
		plugins: [tailwindcss()],
	}),
});
