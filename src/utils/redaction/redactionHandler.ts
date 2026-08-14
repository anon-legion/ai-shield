import { filterState } from '../../lib/filterState.svelte';
import type { IFilter } from '../../models/filter';

const REDACTED_PLACEHOLDER = '[REDACTED]';

function redactText(text: string, filters: IFilter[]): string {
	return filters
		.filter((filter) => filter.isEnabled)
		.reduce((acc, filter) => {
			const regex = filter.regex.global
				? filter.regex
				: new RegExp(filter.regex.source, `${filter.regex.flags}g`);

			return acc.replace(regex, REDACTED_PLACEHOLDER);
		}, text);
}

function redact(e: ClipboardEvent): void {
	const originalText = e.clipboardData?.getData('text/plain') ?? '';

	if (!originalText) return;

	const redactedText = redactText(originalText, filterState.state);

	if (redactedText === originalText) return;

	e.preventDefault();
	e.stopPropagation();

	try {
		const selection = window.getSelection();

		if (!selection) return;

		const range = selection.getRangeAt(0);
		range.deleteContents();

		const textNode = document.createTextNode(redactedText);
		range.insertNode(textNode);

		range.setStartAfter(textNode);
		range.setEndAfter(textNode);
		selection.removeAllRanges();
		selection.addRange(range);
	} catch (err) {
		console.error(`AI-Shield: Redaction failed\n${err}}`);
	}
}

function unredact(): void {
	setTimeout(async () => {
		try {
			const text = await navigator.clipboard.readText();
			if (text.includes('[REDACTED]')) {
				await navigator.clipboard.writeText(
					text.replaceAll('[REDACTED]', '[UNREDACTED]'),
				);
			}
		} catch (err) {
			console.error(err);
		}
	}, 0);
}

export { redact, unredact };
