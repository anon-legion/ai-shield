const regexUlid = /[0-7][0-9A-HJKMNP-TV-Z]{25}/g;

function hasUlid(value: string): boolean {
	regexUlid.lastIndex = 0;

	return regexUlid.test(value);
}

export { hasUlid, regexUlid };
