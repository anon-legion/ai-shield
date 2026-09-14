import { createProxyService } from '@webext-core/proxy-service';
import { promptMirrorStore } from '../lib/settingsStore';
import { hasUlid, regexUlid } from './filter/filterUlid';
import { REDACTION_SERVICE_KEY } from './redaction/redactionService';
import { findMatches, unredactText } from './redaction/redactionText';

const redactionService = createProxyService(REDACTION_SERVICE_KEY);

const DEBOUNCE_MS = 300;

let timer: ReturnType<typeof setTimeout> | undefined;
let lastPushed: string | undefined;

function readEditableText(): string | null {
	const element = document.activeElement;

	if (
		element instanceof HTMLTextAreaElement ||
		element instanceof HTMLInputElement
	) {
		return element.value;
	}

	if (element instanceof HTMLElement && element.isContentEditable) {
		return element.innerText;
	}

	return null;
}

async function push(text: string): Promise<void> {
	try {
		let unredacted = text;

		if (hasUlid(text)) {
			const aliases = findMatches(text, [regexUlid]);
			const redactions = await redactionService.getManyByAlias(aliases);

			unredacted = unredactText(text, redactions);
		}

		if (unredacted === lastPushed) return;

		lastPushed = unredacted;

		await promptMirrorStore.setValue(unredacted);
	} catch (err) {
		console.error(`AI-Shield: Failed to mirror prompt\n${err}`);
	}
}

// ponytail: mirrors whatever editable is focused, not "the chatbox";
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
