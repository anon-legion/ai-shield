import { describe, expect, test } from 'bun:test';
import type { IRedaction } from '@/models/redaction';
import { filterDefault } from '@/utils/filter/filterDefault';
import { generateRedaction } from '@/utils/redaction/redactionGenerator';
import {
	boundTarget,
	countMatches,
	escapeRegExp,
	findMatches,
	redactText,
	unredactText,
} from '@/utils/redaction/redactionText';

function redaction(target: string, alias: string): IRedaction {
	return generateRedaction({ target, alias });
}

function matches(target: string, text: string): boolean {
	return new RegExp(boundTarget(target), 'u').test(text);
}

describe('escapeRegExp', () => {
	test('escapes metacharacters so they match literally', () => {
		expect(new RegExp(escapeRegExp('a+b(c)')).test('a+b(c)')).toBe(true);
		expect(new RegExp(escapeRegExp('a+b(c)')).test('aab')).toBe(false);
	});
});

describe('boundTarget', () => {
	test('guards both ends when the target is all word characters', () => {
		expect(boundTarget('Sam')).toBe(
			'(?<![\\p{L}\\p{N}_])Sam(?![\\p{L}\\p{N}_])',
		);
	});

	test('does not match inside a longer word', () => {
		expect(matches('Sam', 'Sam went home')).toBe(true);
		expect(matches('Sam', 'a Samsung tv')).toBe(false);
		expect(matches('Ali', 'Alice waved')).toBe(false);
	});

	// the regression a blanket \b(?:...)\b would have caused: a leading `+` is
	// not a word character, so \b would demand one before it and never match
	test('omits the left guard when the target starts with punctuation', () => {
		expect(boundTarget('+15551234567')).toBe(
			'\\+15551234567(?![\\p{L}\\p{N}_])',
		);
		expect(matches('+15551234567', 'call +15551234567 now')).toBe(true);
	});

	test('omits both guards when the target starts and ends with punctuation', () => {
		const block = '-----BEGIN RSA PRIVATE KEY-----';

		expect(boundTarget(block)).toBe(escapeRegExp(block));
		expect(matches(block, `key ${block} end`)).toBe(true);
	});

	// \w would classify Cyrillic as non-word and let the guard pass trivially
	test('bounds non-latin targets', () => {
		expect(matches('Иван', 'Иван Петров')).toBe(true);
		expect(matches('Иван', 'Иванов пришёл')).toBe(false);
	});

	test('escapes metacharacters in the target', () => {
		expect(matches('a+b(c)', 'x a+b(c) y')).toBe(true);
		expect(matches('a+b(c)', 'x aab y')).toBe(false);
	});

	test('output compiles under the u flag for every default filter match', () => {
		const sample = [
			'Name: John Smith',
			'reach me at a.b@example.com or +15551234567',
			'card 4111 1111 1111 1111',
			'IBAN DE89370400440532013000',
			'AKIAIOSFODNN7EXAMPLE',
			'password: hunter2hunter2',
			'Passport: A12345678',
		].join('\n');

		filterDefault.forEach((filter) => {
			findMatches(sample, [filter.regex]).forEach((match) => {
				expect(() => new RegExp(boundTarget(match), 'gu')).not.toThrow();
			});
		});
	});
});

describe('findMatches', () => {
	test('dedupes repeated matches', () => {
		expect(findMatches('a@b.com and a@b.com', [/[a-z]+@[a-z.]+/g])).toEqual([
			'a@b.com',
		]);
	});

	test('returns an empty array when nothing matches', () => {
		expect(findMatches('nothing here', [/\d{4}/g])).toEqual([]);
	});

	test('collects across multiple patterns', () => {
		expect(findMatches('abc 123', [/[a-z]+/g, /\d+/g])).toEqual(['abc', '123']);
	});

	// a shared `g` regex carries lastIndex between calls; findMatches resets it
	test('is repeatable with a stateful global regex', () => {
		const regex = /\d{4}/g;

		expect(findMatches('1234 5678', [regex])).toEqual(['1234', '5678']);
		expect(findMatches('1234 5678', [regex])).toEqual(['1234', '5678']);
	});
});

describe('countMatches', () => {
	// the deliberate difference from findMatches: every occurrence counts
	test('counts repeated occurrences of the same value', () => {
		expect(countMatches('a@b.com and a@b.com', [/[a-z]+@[a-z.]+/g])).toBe(2);
	});

	test('sums across multiple patterns', () => {
		expect(countMatches('abc 123', [/[a-z]+/g, /\d+/g])).toBe(2);
	});

	test('returns 0 for empty text', () => {
		expect(countMatches('', [/\d+/g])).toBe(0);
	});

	test('is repeatable with a stateful global regex', () => {
		const regex = /\d{4}/g;

		expect(countMatches('1234 5678', [regex])).toBe(2);
		expect(countMatches('1234 5678', [regex])).toBe(2);
	});
});

describe('redactText', () => {
	test('returns the input unchanged when there are no redactions', () => {
		expect(redactText('untouched', [])).toBe('untouched');
	});

	test('replaces every occurrence of a target', () => {
		const result = redactText('ping a@b.com, then a@b.com', [
			redaction('a@b.com', 'ALIAS1'),
		]);

		expect(result).toBe('ping [ALIAS1], then [ALIAS1]');
	});

	test('replaces multiple distinct targets', () => {
		const result = redactText('a@b.com and +15551234567', [
			redaction('a@b.com', 'ALIAS1'),
			redaction('+15551234567', 'ALIAS2'),
		]);

		expect(result).toBe('[ALIAS1] and [ALIAS2]');
	});

	test('prefers the longest target when two overlap', () => {
		const result = redactText('John Smith called', [
			redaction('John', 'SHORT'),
			redaction('John Smith', 'LONG'),
		]);

		expect(result).toBe('[LONG] called');
	});

	test('leaves a target that only occurs embedded in a longer run', () => {
		const result = redactText('DE89370400440532013000', [
			redaction('893704004405', 'ALIAS1'),
		]);

		expect(result).toBe('DE89370400440532013000');
	});
});

describe('unredactText', () => {
	test('returns the input unchanged when there are no redactions', () => {
		expect(unredactText('untouched', [])).toBe('untouched');
	});

	test('restores a bracketed alias', () => {
		expect(
			unredactText('call [ALIAS1]', [redaction('0123456789', 'ALIAS1')]),
		).toBe('call 0123456789');
	});

	// ai often echo tokens back wrapped in markdown bold
	test('restores an alias wrapped in markdown bold', () => {
		expect(
			unredactText('call [**ALIAS1**]', [redaction('0123456789', 'ALIAS1')]),
		).toBe('call 0123456789');
	});

	test('restores a bare alias', () => {
		expect(
			unredactText('call ALIAS1', [redaction('0123456789', 'ALIAS1')]),
		).toBe('call 0123456789');
	});

	test('leaves an unknown alias untouched', () => {
		expect(
			unredactText('call [MISSING]', [redaction('0123456789', 'ALIAS1')]),
		).toBe('call [MISSING]');
	});
});

describe('round trip', () => {
	test('redact then unredact restores the original text', () => {
		const original =
			'Name: John Smith, reach me at a.b@example.com or +15551234567';
		const patterns = filterDefault.map((filter) => filter.regex);
		const redactions = findMatches(original, patterns).map((target) =>
			generateRedaction({ target, alias: '' }),
		);

		expect(redactions.length).toBeGreaterThan(0);

		const redacted = redactText(original, redactions);

		expect(redacted).not.toBe(original);
		expect(redacted).not.toContain('a.b@example.com');
		expect(unredactText(redacted, redactions)).toBe(original);
	});
});
