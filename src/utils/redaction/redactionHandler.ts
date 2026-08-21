import { createProxyService } from '@webext-core/proxy-service';
import { filterState } from '../../lib/filterState.svelte';
import type { IRedaction } from '../../models/redaction';
import { hasUlid, regexUlid } from '../filter/filterUlid';
import { generateRedaction } from './redactionGenerator';
import { REDACTION_SERVICE_KEY } from './redactionService';

const redactionService = createProxyService(REDACTION_SERVICE_KEY);

function escapeRegExp(text: string): string {
	return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findMatches(text: string, patterns: RegExp[]): string[] {
	return patterns.flatMap((regex) => {
		regex.lastIndex = 0;
		return [...new Set(text.match(regex) ?? [])];
	});
}

function redactText(text: string, redactions: IRedaction[]): string {
	if (redactions.length === 0) return text;

	const aliasByTarget = new Map(
		redactions.map((redaction) => [redaction.target, redaction.alias]),
	);

	const pattern = [...aliasByTarget.keys()]
		.sort((a, b) => b.length - a.length)
		.map(escapeRegExp)
		.join('|');

	const regex = new RegExp(pattern, 'g');

	return text.replace(regex, (match) => `[${aliasByTarget.get(match)}]`);
}

function unredactText(text: string, redactions: IRedaction[]): string {
	console.log('Unredact handler triggered');
	if (redactions.length === 0) return text;

	const targetByAlias = new Map(
		redactions.map((redaction) => [redaction.alias, redaction.target]),
	);

	const pattern = [...targetByAlias.keys()]
		.sort((a, b) => b.length - a.length)
		.flatMap((alias) => [
			escapeRegExp(`[**${alias}**]`),
			escapeRegExp(`[${alias}]`),
			escapeRegExp(alias),
		])
		.join('|');

	const regex = new RegExp(pattern, 'g');

	return text.replace(regex, (match) => {
		// strip brackets and/or asterisks to extract alias used as key in the map
		const alias = match.replace(/^\[?\*{0,2}/, '').replace(/\*{0,2}\]?$/, '');
		return targetByAlias.get(alias) ?? match;
	});
}

async function redact(e: ClipboardEvent): Promise<void> {
	const originalText = e.clipboardData?.getData('text/plain') ?? '';

	if (!originalText) return;

	const activeFilters = filterState.state.filter((filter) => filter.isEnabled);

	const patterns = activeFilters.map((filter) =>
		filter.regex.global
			? filter.regex
			: new RegExp(filter.regex.source, `${filter.regex.flags}g`),
	);

	const matchedTargets = findMatches(originalText, patterns);

	if (matchedTargets.length < 1) return;

	e.stopPropagation();
	e.preventDefault();

	try {
		const existingRedactions =
			await redactionService.getManyByTarget(matchedTargets);
		const existingTargets = new Map(
			existingRedactions.map((redaction) => [redaction.target, redaction]),
		);
		const newRedactions: IRedaction[] = [];
		const allRedactions = matchedTargets.map((target) => {
			const existing = existingTargets.get(target);
			if (existing) return existing;

			const created = generateRedaction({ target, alias: '' });
			newRedactions.push(created);
			return created;
		});

		const redactedText = redactText(originalText, allRedactions);

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

		if (newRedactions.length < 1) return;

		redactionService.addMany(newRedactions).catch((err) => {
			console.error(`AI-Shield: Failed to persist new redactions\n${err}`);
		});
	} catch (err) {
		console.error(`AI-Shield: Redaction failed\n${err}}`);
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

export { redact, unredact };
