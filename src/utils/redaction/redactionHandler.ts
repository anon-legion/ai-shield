import { createProxyService } from '@webext-core/proxy-service';
import { filterState, whitelistState } from '../../lib/filterState.svelte';
import { autoRedactStore } from '../../lib/settingsStore';
import type { IRedaction } from '../../models/redaction';
import { buildFilterRegex, enabledPatterns } from '../filter/filterInput';
import { hasUlid, regexUlid } from '../filter/filterUlid';
import { generateRedaction } from './redactionGenerator';
import { REDACTION_SERVICE_KEY } from './redactionService';
import {
	applyWhitelist,
	findMatches,
	getRedactionsToPersist,
	redactText,
	unredactText,
} from './redactionText';

const redactionService = createProxyService(REDACTION_SERVICE_KEY);

// keep local mirror of db to make redaction synchronous and finish inside
// the paste event to prevent race condition with page's own handler
const redactionByTarget = new Map<string, IRedaction>();

// pre-warmed like the cache above because redact() must stay synchronous
let autoRedact = autoRedactStore.fallback;

autoRedactStore.getValue().then((value) => {
	autoRedact = value;
});
autoRedactStore.watch((value) => {
	autoRedact = value ?? autoRedactStore.fallback;
});

redactionService
	.getAll()
	.then((redactions) => {
		redactions.forEach((redaction) => {
			redactionByTarget.set(redaction.target, redaction);
		});
	})
	.catch((err) => {
		console.error(`AI-Shield: Failed to warm redaction cache\n${err}`);
	});

function notifyInput(element: HTMLElement): void {
	element.dispatchEvent(
		new InputEvent('input', { bubbles: true, inputType: 'insertText' }),
	);
	element.dispatchEvent(new Event('change', { bubbles: true }));
}

function insertIntoFormField(
	element: HTMLInputElement | HTMLTextAreaElement,
	text: string,
): boolean {
	const prototype =
		element instanceof HTMLTextAreaElement
			? HTMLTextAreaElement.prototype
			: HTMLInputElement.prototype;

	// use prototype setter because React based host pages' value shim swallows a plain assignment — a no-op elsewhere
	const setValue = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;

	if (!setValue) return false;

	const start = element.selectionStart ?? element.value.length;
	const end = element.selectionEnd ?? start;
	const caret = start + text.length;

	setValue.call(
		element,
		`${element.value.slice(0, start)}${text}${element.value.slice(end)}`,
	);
	element.setSelectionRange(caret, caret);
	notifyInput(element);

	return true;
}

function insertIntoEditable(element: HTMLElement, text: string): boolean {
	const selection = window.getSelection();

	if (!selection?.rangeCount) return false;

	const range = selection.getRangeAt(0);

	// caret drifted out of the editor (e.g. onto a placeholder overlay)
	if (!element.contains(range.commonAncestorContainer)) return false;

	range.deleteContents();

	const { startContainer, startOffset } = range;
	let caretNode: Text;

	if (startContainer.nodeType === Node.TEXT_NODE) {
		// mutate in place so rich editors keep node identity and reconcile
		caretNode = startContainer as Text;
		caretNode.data = `${caretNode.data.slice(0, startOffset)}${text}${caretNode.data.slice(startOffset)}`;
		selection.collapse(caretNode, startOffset + text.length);
	} else {
		caretNode = document.createTextNode(text);
		range.insertNode(caretNode);
		selection.collapse(caretNode, text.length);
	}

	notifyInput(element);

	return true;
}

function insertText(element: HTMLElement, text: string): boolean {
	const inserted =
		element instanceof HTMLTextAreaElement ||
		element instanceof HTMLInputElement
			? insertIntoFormField(element, text)
			: insertIntoEditable(element, text);

	// use deprecated execCommand native insert as last resort so blocked paste never loses the user's text
	return inserted || document.execCommand('insertText', false, text);
}

// must stay synchronous: preventDefault and the insert have to happen in the same tick as the paste event
function redact(e: ClipboardEvent): void {
	if (!autoRedact) return;

	const originalText = e.clipboardData?.getData('text/plain') ?? '';

	if (!originalText) return;

	const matchedTargets = applyWhitelist(
		findMatches(originalText, enabledPatterns(filterState.state)),
		enabledPatterns(whitelistState.state),
	);

	if (matchedTargets.length < 1) return;

	const element = document.activeElement;

	if (!(element instanceof HTMLElement)) return;

	e.preventDefault();
	e.stopImmediatePropagation();

	try {
		const newRedactions: IRedaction[] = [];
		const allRedactions = matchedTargets.map((target) => {
			const existing = redactionByTarget.get(target);

			if (existing) return existing;

			const created = generateRedaction({ target, alias: '' });
			newRedactions.push(created);

			return created;
		});

		const redactedText = redactText(originalText, allRedactions);

		if (!insertText(element, redactedText)) {
			console.error('AI-Shield: Could not insert redacted text');
			return;
		}

		// cache and db must agree
		const persisted = getRedactionsToPersist(redactedText, newRedactions);

		if (persisted.length < 1) return;

		persisted.forEach((redaction) => {
			redactionByTarget.set(redaction.target, redaction);
		});

		redactionService.addMany(persisted).catch((err) => {
			console.error(`AI-Shield: Failed to persist new redactions\n${err}`);
		});
	} catch (err) {
		console.error(`AI-Shield: Redaction failed\n${err}`);
	}
}

function unredact(): void {
	setTimeout(async () => {
		try {
			const text = await navigator.clipboard.readText();

			if (!text || !hasUlid(text)) return;

			const aliases = findMatches(text, [regexUlid]);

			if (aliases.length < 1) return;

			const redactions = await redactionService.getManyByAlias(aliases);

			await navigator.clipboard.writeText(unredactText(text, redactions));
		} catch (err) {
			console.error(err);
		}
	}, 0);
}

function isTextField(
	element: Element | null,
): element is HTMLTextAreaElement | HTMLInputElement {
	return (
		element instanceof HTMLTextAreaElement ||
		element instanceof HTMLInputElement
	);
}

// read from the dom, not the menu's selectionText: chrome normalizes its
// whitespace, and firefox getSelection() is empty inside form fields
function readSelection(element: Element | null): string {
	if (isTextField(element)) {
		return element.value.slice(
			element.selectionStart ?? 0,
			element.selectionEnd ?? 0,
		);
	}

	return window.getSelection()?.toString() ?? '';
}

// manual redaction of the selected chatbox text, no filter rule involved
function redactSelection(): void {
	const element = document.activeElement;

	// only inside an editable: with focus elsewhere (e.g. body) the insert
	// would delete selected page content
	if (!(element instanceof HTMLElement)) return;
	if (!isTextField(element) && !element.isContentEditable) return;

	const target = readSelection(element);

	// nothing to redact, or already (partly) a placeholder
	if (!target.trim() || hasUlid(target)) return;

	const existing = redactionByTarget.get(target);
	const redaction = existing ?? generateRedaction({ target, alias: '' });

	if (!insertText(element, `[${redaction.alias}]`)) {
		console.error('AI-Shield: Could not insert redacted text');
		return;
	}

	if (existing) return;

	// cache and db must agree
	redactionByTarget.set(target, redaction);

	redactionService.addMany([redaction]).catch((err) => {
		console.error(`AI-Shield: Failed to persist new redactions\n${err}`);
	});
}

// ponytail: only exempts future pastes, the placeholder in the current
// message stays; in-place restore is the upgrade path
async function whitelistSelection(): Promise<void> {
	try {
		let text = readSelection(document.activeElement).trim();

		// chatbox text is usually already redacted: whitelist the original
		// value behind the placeholder, not the placeholder itself
		if (hasUlid(text)) {
			const aliases = findMatches(text, [regexUlid]);
			const redactions = await redactionService.getManyByAlias(aliases);

			text = unredactText(text, redactions);
		}

		// empty, or a placeholder that could not be resolved
		if (!text || hasUlid(text)) return;

		const regex = buildFilterRegex(text, 'text', false);

		const isListed = whitelistState.state.some(
			(filter) => filter.regex.source === regex.source,
		);

		if (isListed) return;

		await whitelistState.addFilter({ label: text, regex, isEnabled: true });
	} catch (err) {
		console.error(`AI-Shield: Whitelist failed\n${err}`);
	}
}

export { redact, redactSelection, unredact, whitelistSelection };
