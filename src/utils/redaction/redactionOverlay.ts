import { createProxyService } from '@webext-core/proxy-service';
import { hasUlid, matchPlaceholders } from '../filter/filterUlid';
import { insertText, isTextField } from './redactionHandler';
import { REDACTION_SERVICE_KEY } from './redactionService';

const redactionService = createProxyService(REDACTION_SERVICE_KEY);

// the highlight color; keep equal to --color-redacted in src/assets/tailwind.css,
// which the sidepanel uses (the page cannot read it)
const BLUE = '#458588';

interface IPlaceholder {
	alias: string;
	// where it is drawn: the live dom for editables, the mirror for text fields
	range: Range;
	// offset in its text node, which for text fields is the offset in the value
	start: number;
}

// fixed list, enough for text to wrap like the textarea does; css
// zoom/transform or custom ::-webkit-scrollbar widths can still misalign
const MIRROR_PROPERTIES = [
	'border-top-width',
	'border-right-width',
	'border-bottom-width',
	'border-left-width',
	'padding-top',
	'padding-right',
	'padding-bottom',
	'padding-left',
	'font-family',
	'font-size',
	'font-weight',
	'font-style',
	'font-variant',
	'font-stretch',
	'line-height',
	'letter-spacing',
	'word-spacing',
	'text-indent',
	'text-transform',
	'text-align',
	'tab-size',
	'direction',
	'white-space',
	'overflow-wrap',
	'word-break',
	'overflow-y',
	'scrollbar-width',
	'scrollbar-gutter',
];

// styles are set through element.style throughout: a <style> element would be
// subject to the host page's CSP, cssom writes are not
const host = document.createElement('div');
const layer = document.createElement('div');
// textarea text has no dom ranges, so an invisible copy laid exactly over the
// textarea provides them
const mirror = document.createElement('div');

host.style.cssText = 'position:fixed;top:0;left:0;z-index:2147483647';
mirror.style.cssText =
	'position:fixed;visibility:hidden;pointer-events:none;box-sizing:border-box;margin:0;border-style:solid;border-color:transparent;overflow-x:hidden';
// shadow root keeps the host page's css off the boxes; closed so page script
// cannot reach the restore buttons
host.attachShadow({ mode: 'closed' }).append(mirror, layer);

// tracks whatever editable was focused last, like promptMirror
let chatbox: HTMLElement | null = null;
let isRunning = false;
let lastText: string | null = null;
let lastGeometry = '';
let hasPlaceholder = false;

function placeholdersIn(node: Text): IPlaceholder[] {
	return matchPlaceholders(node.data).map(({ alias, start, end }) => {
		const range = document.createRange();

		range.setStart(node, start);
		range.setEnd(node, end);

		return { alias, range, start };
	});
}

function syncMirror(field: HTMLTextAreaElement | HTMLInputElement): void {
	const style = getComputedStyle(field);
	const rect = field.getBoundingClientRect();

	for (const property of MIRROR_PROPERTIES) {
		mirror.style.setProperty(property, style.getPropertyValue(property));
	}

	mirror.style.left = `${rect.left}px`;
	mirror.style.top = `${rect.top}px`;
	mirror.style.width = `${rect.width}px`;
	mirror.style.height = `${rect.height}px`;
	// zero-width tail keeps a trailing newline's line, so scroll heights agree
	mirror.textContent = `${field.value}\u200b`;
	mirror.scrollTop = field.scrollTop;
	mirror.scrollLeft = field.scrollLeft;
}

function findPlaceholders(element: HTMLElement): IPlaceholder[] {
	if (isTextField(element)) {
		syncMirror(element);

		return placeholdersIn(mirror.firstChild as Text);
	}

	const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
	const placeholders: IPlaceholder[] = [];

	while (walker.nextNode()) {
		placeholders.push(...placeholdersIn(walker.currentNode as Text));
	}

	return placeholders;
}

// vertical span of the element that no scrolling ancestor clips; rich editors
// often scroll in a wrapper, so the editable's own rect is taller than what shows
function visibleSpan(element: HTMLElement): { top: number; bottom: number } {
	let top = 0;
	let bottom = window.innerHeight;

	for (
		let node: HTMLElement | null = element;
		node;
		node = node.parentElement
	) {
		if (getComputedStyle(node).overflowY === 'visible') continue;

		const rect = node.getBoundingClientRect();

		top = Math.max(top, rect.top);
		bottom = Math.min(bottom, rect.bottom);
	}

	return { top, bottom };
}

function createBox(rect: DOMRect, alias: string, nth: number): HTMLElement {
	const box = document.createElement('div');
	const button = document.createElement('button');

	// 59 = 35% alpha, translucent so the placeholder stays readable
	box.style.cssText = `position:fixed;left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px;border-radius:3px;background:${BLUE}59;pointer-events:none`;

	button.type = 'button';
	button.textContent = '×';
	button.title = 'Restore original text';
	button.style.cssText = `all:initial;position:absolute;top:-8px;right:-8px;width:14px;height:14px;border-radius:50%;background:${BLUE};color:#fbf1c7;font:700 11px/14px sans-serif;text-align:center;cursor:pointer;pointer-events:auto`;

	// mousedown, not click: keeps focus and caret in the chatbox,
	// and a re-render between down and up cannot swallow it
	// mouse only, the sidepanel x is the keyboard path
	button.addEventListener('mousedown', (e) => {
		// a real click only: a scripted one would hand the original to the page
		if (!e.isTrusted) return;

		e.preventDefault();
		void restoreRedaction(alias, nth);
	});

	box.append(button);

	return box;
}

function render(element: HTMLElement): void {
	// spa re-renders can drop foreign nodes
	if (!host.isConnected) document.documentElement.append(host);

	// single-line inputs get no box, the mirror wraps where they
	// scroll; chatboxes are textareas or editables
	const placeholders =
		element instanceof HTMLInputElement ? [] : findPlaceholders(element);

	const span = visibleSpan(element);
	const seenByAlias = new Map<string, number>();

	const boxes = placeholders.flatMap(({ alias, range }) => {
		const nth = seenByAlias.get(alias) ?? 0;

		seenByAlias.set(alias, nth + 1);

		// one box over the bounding rect; a placeholder wrapping
		// across lines gets a two-line box. getClientRects() if that shows
		const rect = range.getBoundingClientRect();

		// midpoint, not edges: glyph boxes can poke a pixel past a tight chatbox
		const middle = (rect.top + rect.bottom) / 2;

		// scrolled out of view
		if (rect.width === 0 || middle < span.top || middle > span.bottom) {
			return [];
		}

		return [createBox(rect, alias, nth)];
	});

	layer.replaceChildren(...boxes);
}

// polls per frame instead of listening: host pages clear and move the chatbox
// without events (send, layout animations). only runs while a placeholder
// is in the chatbox, and only re-renders when text or geometry changed
function tick(): void {
	const element = chatbox?.isConnected ? chatbox : null;
	const text = !element
		? ''
		: isTextField(element)
			? element.value
			: (element.textContent ?? '');

	if (text !== lastText) {
		lastText = text;
		lastGeometry = '';
		hasPlaceholder = hasUlid(text);
	}

	if (!element || !hasPlaceholder) {
		layer.replaceChildren();
		isRunning = false;
		lastText = null;

		return;
	}

	const rect = element.getBoundingClientRect();
	const geometry = [
		rect.x,
		rect.y,
		rect.width,
		rect.height,
		element.scrollTop,
		element.scrollLeft,
	].join();

	if (geometry !== lastGeometry) {
		lastGeometry = geometry;
		render(element);
	}

	requestAnimationFrame(tick);
}

function track(): void {
	const element = document.activeElement;

	if (!(element instanceof HTMLElement)) return;
	if (!isTextField(element) && !element.isContentEditable) return;

	chatbox = element;

	if (isRunning) return;

	isRunning = true;
	requestAnimationFrame(tick);
}

// swaps the nth placeholder of this alias in the chatbox back to its original
// text; the redaction record stays, other messages may still carry the alias
async function restoreRedaction(alias: string, nth: number): Promise<void> {
	try {
		const element = chatbox;

		if (!element?.isConnected) return;

		const redaction = await redactionService.getByAlias(alias);

		if (!redaction) return;

		// located after the await: the text may have changed meanwhile
		// counts bracketed placeholders only; if the user stripped the
		// brackets off one, the sidepanel's nth can land on a sibling occurrence
		const placeholder = findPlaceholders(element).filter(
			(found) => found.alias === alias,
		)[nth];

		if (!placeholder) return;

		if (isTextField(element)) {
			element.setSelectionRange(
				placeholder.start,
				placeholder.start + alias.length + 2,
			);
		} else {
			const selection = window.getSelection();

			selection?.removeAllRanges();
			selection?.addRange(placeholder.range);
			// editors with their own selection model (lexical) sync it on this
			// event, which the browser only fires after the insert below
			document.dispatchEvent(new Event('selectionchange'));
		}

		if (!insertText(element, redaction.target)) {
			console.error('AI-Shield: Could not restore redacted text');
		}
	} catch (err) {
		console.error(`AI-Shield: Restore failed\n${err}`);
	}
}

function initRedactionOverlay(): void {
	document.addEventListener('focusin', track);
	document.addEventListener('input', track, { capture: true });
}

export { initRedactionOverlay, restoreRedaction };
