const regexUlid = /[0-7][0-9A-HJKMNP-TV-Z]{25}/g;

const regexPlaceholder = new RegExp(`\\[(${regexUlid.source})\\]`, 'g');

function hasUlid(value: string): boolean {
	regexUlid.lastIndex = 0;

	return regexUlid.test(value);
}

// bracketed placeholders in document order, with their offsets in the text
function matchPlaceholders(
	text: string,
): { alias: string; start: number; end: number }[] {
	// matchAll iterates a clone, so the shared regex keeps no lastIndex state
	return [...text.matchAll(regexPlaceholder)].map((match) => ({
		alias: match[1],
		start: match.index,
		end: match.index + match[0].length,
	}));
}

export { hasUlid, matchPlaceholders, regexUlid };
