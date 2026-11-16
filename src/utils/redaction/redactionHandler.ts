import { createProxyService } from '@webext-core/proxy-service';
import { filterState, whitelistState } from '../../lib/filterState.svelte';
import { autoRedactStore } from '../../lib/settingsStore';
import type { IRedaction } from '../../models/redaction';
import { buildFilterRegex, enabledPatterns } from '../filter/filterInput';
import { hasUlid, regexUlid } from '../filter/filterUlid';
import { notify } from '../toast';
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

// lexical (perplexity) deletes dom nodes it did not create, so a direct insert
// vanishes: hand it a paste event carrying the text and let it insert itself
// lexical only; paste-first for every rich editor is the upgrade
// path if another one rejects direct dom edits
function pasteIntoEditor(element: HTMLElement, text: string): boolean {
	const clipboardData = new DataTransfer();

	clipboardData.setData('text/plain', text);

	const paste = new ClipboardEvent('paste', {
		clipboardData,
		bubbles: true,
		cancelable: true,
	});

	// a browser that drops the init data would have the editor paste nothing
	if (paste.clipboardData?.getData('text/plain') !== text) return false;

	// dispatchEvent is false once a listener cancels: the editor took the paste
	if (element.dispatchEvent(paste)) return false;

	// lexical renders in a microtask and fires no input event: announce it
	// afterwards, on document, where its own input handler does not listen
	setTimeout(() => document.dispatchEvent(new Event('input')));

	return true;
}

function insertIntoEditable(element: HTMLElement, text: string): boolean {
	const selection = window.getSelection();

	if (!selection?.rangeCount) return false;

	const range = selection.getRangeAt(0);

	// caret drifted out of the editor (e.g. onto a placeholder overlay)
	if (!element.contains(range.commonAncestorContainer)) return false;

	if (
		element.closest('[data-lexical-editor]') &&
		pasteIntoEditor(element, text)
	) {
		return true;
	}

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

// the known redaction for a target, or a new one that is not persisted yet
function redactionFor(target: string): IRedaction {
	return (
		redactionByTarget.get(target) ?? generateRedaction({ target, alias: '' })
	);
}

// cache and db must agree; redactions already in the cache are skipped
function persistRedactions(redactions: IRedaction[]): void {
	const created = redactions.filter(
		(redaction) => redactionByTarget.get(redaction.target) !== redaction,
	);

	if (created.length < 1) return;

	created.forEach((redaction) => {
		redactionByTarget.set(redaction.target, redaction);
	});

	redactionService.addMany(created).catch((err) => {
		console.error(`AI-Shield: Failed to persist new redactions\n${err}`);
	});
}

// must stay synchronous: preventDefault and the insert have to happen in the same tick as the paste event
function redact(e: ClipboardEvent): void {
	// scripted pastes carry no real clipboard; ours is already redacted
	if (!e.isTrusted) return;

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

	// login and other non-prompt inputs keep their native paste
	if (element instanceof HTMLInputElement && !isTextField(element)) return;

	e.preventDefault();
	e.stopImmediatePropagation();

	try {
		const redactions = matchedTargets.map(redactionFor);
		const redactedText = redactText(originalText, redactions);

		if (!insertText(element, redactedText)) {
			console.error('AI-Shield: Could not insert redacted text');
			return;
		}

		persistRedactions(getRedactionsToPersist(redactedText, redactions));
		notify('Clipboard redacted');
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

			const unredactedText = unredactText(text, redactions);

			// no alias resolved: leave the clipboard alone, nothing to announce
			if (unredactedText === text) return;

			await navigator.clipboard.writeText(unredactedText);
			notify('Clipboard unredacted');
		} catch (err) {
			console.error(err);
		}
	}, 0);
}

// prompt-like fields only: password, email and the like are not prompts,
// and most other input types throw on setSelectionRange
function isTextField(
	element: Element | null,
): element is HTMLTextAreaElement | HTMLInputElement {
	return (
		element instanceof HTMLTextAreaElement ||
		(element instanceof HTMLInputElement &&
			(element.type === 'text' || element.type === 'search'))
	);
}

// read from the dom, not the menu's selectionText: chrome normalizes its
// whitespace, and firefox getSelection() is empty inside form fields
function readSelection(element: Element | null): string {
	if (!isTextField(element)) return window.getSelection()?.toString() ?? '';

	// offsets are only null on input types isTextField rejects; Number() is
	// for the type, and maps null to 0
	return element.value.slice(
		Number(element.selectionStart),
		Number(element.selectionEnd),
	);
}

// the focused prompt field: a text field or a contenteditable
function activeEditable(): HTMLElement | null {
	const element = document.activeElement;

	if (!(element instanceof HTMLElement)) return null;

	return isTextField(element) || element.isContentEditable ? element : null;
}

// the selected text, or '' when there is nothing to redact or it is already
// (partly) a placeholder
function redactableSelection(element: HTMLElement): string {
	const target = readSelection(element);

	return target.trim() && !hasUlid(target) ? target : '';
}

// manual redaction of the selected chatbox text, no filter rule involved
function redactSelection(): void {
	const element = activeEditable();

	// only inside an editable: with focus elsewhere (e.g. body) the insert
	// would delete selected page content
	if (!element) return;

	const target = redactableSelection(element);

	if (!target) return;

	const redaction = redactionFor(target);

	if (!insertText(element, `[${redaction.alias}]`)) {
		console.error('AI-Shield: Could not insert redacted text');
		return;
	}

	persistRedactions([redaction]);
}

// the text with its placeholders swapped for their originals, or '' when one
// could not be resolved
async function resolvePlaceholders(text: string): Promise<string> {
	if (!hasUlid(text)) return text;

	const aliases = findMatches(text, [regexUlid]);
	const redactions = await redactionService.getManyByAlias(aliases);
	const resolved = unredactText(text, redactions);

	return hasUlid(resolved) ? '' : resolved;
}

// only exempts future pastes, the placeholder in the current
// message stays; in-place restore is the upgrade path
async function whitelistSelection(): Promise<void> {
	try {
		// chatbox text is usually already redacted: whitelist the original
		// value behind the placeholder, not the placeholder itself
		const text = await resolvePlaceholders(
			readSelection(document.activeElement).trim(),
		);

		if (!text) return;

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

export {
	activeEditable,
	insertText,
	isTextField,
	redact,
	redactSelection,
	unredact,
	whitelistSelection,
};
