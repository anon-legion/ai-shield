import { afterEach, describe, expect, test } from 'bun:test';
import {
	hasUlid,
	matchPlaceholders,
	regexUlid,
} from '@/utils/filter/filterUlid';

const VALID_ULID = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
const OTHER_ULID = '01BX5ZZKBKACTAV9WEVGEMMVRZ';

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

describe('matchPlaceholders', () => {
	test('finds a bracketed placeholder with its offsets', () => {
		const text = `call [${VALID_ULID}] back`;
		const [placeholder] = matchPlaceholders(text);

		expect(placeholder).toEqual({ alias: VALID_ULID, start: 5, end: 33 });
		expect(text.slice(placeholder.start, placeholder.end)).toBe(
			`[${VALID_ULID}]`,
		);
	});

	// the overlay highlights and restores whole placeholders; a ULID the user
	// stripped the brackets off is no longer one
	test('ignores a bare ULID', () => {
		expect(matchPlaceholders(`call ${VALID_ULID} back`)).toEqual([]);
	});

	test('returns every placeholder in document order', () => {
		const found = matchPlaceholders(
			`[${VALID_ULID}] and [${OTHER_ULID}] and [${VALID_ULID}]`,
		);

		expect(found.map((placeholder) => placeholder.alias)).toEqual([
			VALID_ULID,
			OTHER_ULID,
			VALID_ULID,
		]);
	});

	test('returns nothing for text without placeholders', () => {
		expect(matchPlaceholders('nothing [to] see here')).toEqual([]);
		expect(matchPlaceholders('')).toEqual([]);
	});

	test('is repeatable across consecutive calls', () => {
		const text = `[${VALID_ULID}]`;

		expect(matchPlaceholders(text)).toHaveLength(1);
		expect(matchPlaceholders(text)).toHaveLength(1);
	});
});
