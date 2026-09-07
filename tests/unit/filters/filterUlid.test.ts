import { afterEach, describe, expect, test } from 'bun:test';
import { hasUlid, regexUlid } from '@/utils/filter/filterUlid';

const VALID_ULID = '01ARZ3NDEKTSV4RRFFQ69G5FAV';

afterEach(() => {
	regexUlid.lastIndex = 0;
});

describe('regexUlid', () => {
	test('is a global RegExp', () => {
		expect(regexUlid).toBeInstanceOf(RegExp);
		expect(regexUlid.flags).toContain('g');
	});
});

describe('hasUlid', () => {
	test('returns true for a bare ULID', () => {
		expect(hasUlid(VALID_ULID)).toBe(true);
	});

	test('returns true for a ULID embedded in surrounding text', () => {
		expect(hasUlid(`call [${VALID_ULID}] back`)).toBe(true);
	});

	test('returns false for text with no ULID', () => {
		expect(hasUlid('nothing to see here')).toBe(false);
	});

	test('returns false for empty text', () => {
		expect(hasUlid('')).toBe(false);
	});

	test('returns false for a too short candidate', () => {
		expect(hasUlid(VALID_ULID.slice(0, 25))).toBe(false);
	});

	test('rejects Crockford base32 ambiguous characters', () => {
		for (const excluded of ['I', 'L', 'O', 'U']) {
			expect(hasUlid(`${excluded}${VALID_ULID.slice(1)}`)).toBe(false);
		}
	});

	// hasUlid shares a global regex with unredact's findMatches call, so a
	// leftover lastIndex would make consecutive checks disagree
	test('is repeatable across consecutive calls', () => {
		expect(hasUlid(VALID_ULID)).toBe(true);
		expect(hasUlid(VALID_ULID)).toBe(true);
		expect(hasUlid(VALID_ULID)).toBe(true);
	});
});
