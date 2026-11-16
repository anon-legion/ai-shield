import type { IPromptSegment, IRedaction } from '../../models/redaction';

function escapeRegExp(text: string): string {
	return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function boundTarget(target: string): string {
	const start = /^[\p{L}\p{N}_]/u.test(target) ? '(?<![\\p{L}\\p{N}_])' : '';
	const end = /[\p{L}\p{N}_]$/u.test(target) ? '(?![\\p{L}\\p{N}_])' : '';

	return `${start}${escapeRegExp(target)}${end}`;
}

function findMatches(text: string, patterns: RegExp[]): string[] {
	return patterns.flatMap((regex) => {
		regex.lastIndex = 0;
		// a pattern that can match nothing (x*, an emptied filter) yields '',
		// which as a target would put a placeholder between every character
		return [...new Set(text.match(regex) ?? [])].filter(Boolean);
	});
}

// a whitelist pattern matching anywhere in the target exempts
// it; anchor sources with ^$ if full-match is ever wanted
function applyWhitelist(targets: string[], whitelist: RegExp[]): string[] {
	if (whitelist.length === 0) return targets;

	return targets.filter(
		(target) =>
			!whitelist.some((regex) => {
				regex.lastIndex = 0; // g-flagged regex test() is stateful

				return regex.test(target);
			}),
	);
}

function redactText(text: string, redactions: IRedaction[]): string {
	if (redactions.length === 0) return text;

	const aliasByTarget = new Map(
		redactions.map((redaction) => [redaction.target, redaction.alias]),
	);

	const pattern = [...aliasByTarget.keys()]
		.sort((a, b) => b.length - a.length)
		.map(boundTarget)
		.join('|');

	const regex = new RegExp(pattern, 'gu');

	return text.replace(regex, (match) => `[${aliasByTarget.get(match)}]`);
}

// cuts text into plain runs and restored spans, so callers can tell which
// parts were placeholders; unredactText is the same walk joined back together
function splitRedactions(
	text: string,
	redactions: IRedaction[],
): IPromptSegment[] {
	if (!text) return [];
	if (redactions.length === 0) return [{ text }];

	const targetByAlias = new Map(
		redactions.map((redaction) => [redaction.alias, redaction.target]),
	);

	const pattern = [...targetByAlias.keys()]
		.sort((a, b) => b.length - a.length)
		.flatMap((alias) => [
			// markdown-escaped variants first: chatbot "copy" buttons serialize
			// messages to markdown, turning [alias] into \[alias\]
			boundTarget(`\\[**${alias}**\\]`),
			boundTarget(`[**${alias}**]`),
			boundTarget(`\\[${alias}\\]`),
			boundTarget(`[${alias}]`),
			boundTarget(alias),
		])
		.join('|');

	const regex = new RegExp(pattern, 'gu');

	const segments: IPromptSegment[] = [];
	const seenByAlias = new Map<string, number>();
	let plainStart = 0;

	for (const match of text.matchAll(regex)) {
		// strip (escaped) brackets and/or asterisks to extract alias used as key in the map
		const alias = match[0]
			.replace(/^\\?\[?\*{0,2}/, '')
			.replace(/\*{0,2}\\?\]?$/, '');
		const target = targetByAlias.get(alias);

		if (target === undefined) continue;

		if (match.index > plainStart) {
			segments.push({ text: text.slice(plainStart, match.index) });
		}

		const nth = seenByAlias.get(alias) ?? 0;

		seenByAlias.set(alias, nth + 1);
		segments.push({ text: target, alias, nth });
		plainStart = match.index + match[0].length;
	}

	if (plainStart < text.length) {
		segments.push({ text: text.slice(plainStart) });
	}

	return segments;
}

function unredactText(text: string, redactions: IRedaction[]): string {
	return splitRedactions(text, redactions)
		.map((segment) => segment.text)
		.join('');
}

// filters run independently, so one span can yield several overlapping targets
// and redactText only substitutes some of them. the emitted text is the ground
// truth: checking it for [alias] covers both reasons a target goes unused, a
// boundTarget guard blocking an embedded-only target and a longer target
// shadowing a shorter one, without re-deriving either rule.
function getRedactionsToPersist(
	redactedText: string,
	redactions: IRedaction[],
): IRedaction[] {
	return redactions.filter((redaction) =>
		redactedText.includes(`[${redaction.alias}]`),
	);
}

export {
	applyWhitelist,
	boundTarget,
	escapeRegExp,
	findMatches,
	getRedactionsToPersist,
	redactText,
	splitRedactions,
	unredactText,
};
