import { registerService } from '@webext-core/proxy-service';
import { MenuId } from '../models/redaction';
import { AI_MATCH_PATTERNS } from '../utils/aiSites';
import { openExtensionDb } from '../utils/data/database';
import {
	createRedactionService,
	REDACTION_SERVICE_KEY,
} from '../utils/redaction/redactionService';

interface IBrowserWithSidebar {
	sidebarAction?: { toggle(): Promise<void> };
	browserAction?: {
		onClicked: { addListener(callback: () => void): void };
	};
}

// open the side panel from the toolbar icon; chrome via panel behavior,
// firefox via sidebarAction toggle
function enableToolbarSidePanel(): void {
	if (browser.sidePanel) {
		void browser.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
		return;
	}

	const { sidebarAction, browserAction } = browser as typeof browser &
		IBrowserWithSidebar;

	if (sidebarAction && browserAction) {
		browserAction.onClicked.addListener(() => void sidebarAction.toggle());
	}
}

// re-created on every background start: chrome keeps menus across worker
// restarts (duplicate ids throw), firefox drops them on browser restart
function registerContextMenus(): void {
	void browser.contextMenus.removeAll().then(() => {
		for (const [id, title] of [
			[MenuId.Redact, 'Redact'],
			[MenuId.Whitelist, 'Whitelist'],
		]) {
			browser.contextMenus.create({
				id,
				title,
				contexts: ['selection'],
				documentUrlPatterns: AI_MATCH_PATTERNS,
			});
		}
	});

	// proxy-service only goes content→background, so the click is pushed to
	// the tab natively; the content script owns the selection and does the work
	browser.contextMenus.onClicked.addListener((info, tab) => {
		if (tab?.id === undefined) return;

		// rejects when no content script listens (e.g. x.com outside /i/grok)
		browser.tabs.sendMessage(tab.id, { type: info.menuItemId }).catch(() => {});
	});
}

export default defineBackground(() => {
	void browser.storage.local.setAccessLevel?.({
		accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS',
	});

	enableToolbarSidePanel();
	registerContextMenus();

	const redactionService = createRedactionService(openExtensionDb());

	registerService(REDACTION_SERVICE_KEY, redactionService);
});
