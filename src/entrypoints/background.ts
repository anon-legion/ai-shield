import { registerService } from '@webext-core/proxy-service';
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

export default defineBackground(() => {
	void browser.storage.local.setAccessLevel?.({
		accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS',
	});

	enableToolbarSidePanel();

	const redactionService = createRedactionService(openExtensionDb());

	registerService(REDACTION_SERVICE_KEY, redactionService);
});
