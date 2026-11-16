import { createProxyService } from '@webext-core/proxy-service';
import { promptMirrorStore } from '../lib/settingsStore';
import { hasUlid, regexUlid } from './filter/filterUlid';
import { isTextField } from './redaction/redactionHandler';
import { REDACTION_SERVICE_KEY } from './redaction/redactionService';
import { findMatches, splitRedactions } from './redaction/redactionText';

const redactionService = createProxyService(REDACTION_SERVICE_KEY);

const DEBOUNCE_MS = 300;

let timer: ReturnType<typeof setTimeout> | undefined;
let lastPushed: string | undefined;

function readEditableText(): string | null {
	const element = document.activeElement;

	if (isTextField(element)) return element.value;

	if (element instanceof HTMLElement && element.isContentEditable) {
		return element.innerText;
	}

	return null;
}

async function push(text: string): Promise<void> {
	try {
		const redactions = hasUlid(text)
			? await redactionService.getManyByAlias(findMatches(text, [regexUlid]))
			: [];

		const segments = splitRedactions(text, redactions);
		const serialized = JSON.stringify(segments);

		if (serialized === lastPushed) return;

		lastPushed = serialized;

		await promptMirrorStore.setValue(segments);
	} catch (err) {
		console.error(`AI-Shield: Failed to mirror prompt\n${err}`);
	}
}

// mirrors whatever editable is focused, not "the chatbox";
// per-site chatbox detection is the upgrade path if this gets noisy
function initPromptMirror(): void {
	const onActivity = (): void => {
		// ignore non-editable focus targets, keep the last known chatbox text
		const text = readEditableText();

		if (text === null) return;

		clearTimeout(timer);
		timer = setTimeout(() => void push(text), DEBOUNCE_MS);
	};

	document.addEventListener('focusin', onActivity);
	document.addEventListener('input', onActivity, { capture: true });
}

export { initPromptMirror };
