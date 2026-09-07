import type { IRedaction } from '../../models/redaction';

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
		.map(boundTarget)
		.join('|');

	const regex = new RegExp(pattern, 'gu');

	return text.replace(regex, (match) => `[${aliasByTarget.get(match)}]`);
}

function unredactText(text: string, redactions: IRedaction[]): string {
	if (redactions.length === 0) return text;

	const targetByAlias = new Map(
		redactions.map((redaction) => [redaction.alias, redaction.target]),
	);

	const pattern = [...targetByAlias.keys()]
		.sort((a, b) => b.length - a.length)
		.flatMap((alias) => [
			boundTarget(`[**${alias}**]`),
			boundTarget(`[${alias}]`),
			boundTarget(alias),
		])
		.join('|');

	const regex = new RegExp(pattern, 'gu');

	return text.replace(regex, (match) => {
		// strip brackets and/or asterisks to extract alias used as key in the map
		const alias = match.replace(/^\[?\*{0,2}/, '').replace(/\*{0,2}\]?$/, '');
		return targetByAlias.get(alias) ?? match;
	});
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
	boundTarget,
	escapeRegExp,
	findMatches,
	getRedactionsToPersist,
	redactText,
	unredactText,
};
