import { registerService } from '@webext-core/proxy-service';
import { openExtensionDb } from '../utils/data/database';
import {
	createRedactionService,
	REDACTION_SERVICE_KEY,
} from '../utils/redaction/redactionService';

export default defineBackground(() => {
	void browser.storage.local.setAccessLevel?.({
		accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS',
	});

	const redactionService = createRedactionService(openExtensionDb());

	registerService(REDACTION_SERVICE_KEY, redactionService);
});
