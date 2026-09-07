import { describe, expect, spyOn, test } from 'bun:test';
import { regexUlid } from '@/utils/filter/filterUlid';
import { generateRedaction } from '@/utils/redaction/redactionGenerator';

// deliberately not using mock.module to pin generateUlid: bun applies module
// mocks process-wide, and a fixed id leaks into the round trip suites, where
// every redaction would collapse onto the same alias.

describe('generateRedaction', () => {
	test('returns an object with the expected shape', () => {
		expect(
			generateRedaction({ target: 'hello', alias: 'world' }),
		).toMatchObject({
			id: expect.any(String),
			target: 'hello',
			alias: 'world',
			timestamp: expect.any(Number),
		});
	});

	test('keeps the target verbatim', () => {
		expect(generateRedaction({ target: 'a@b.com', alias: '' }).target).toBe(
			'a@b.com',
		);
	});

	test('uses the provided alias when non-empty', () => {
		expect(generateRedaction({ target: 'hello', alias: 'world' }).alias).toBe(
			'world',
		);
	});

	// redact() always passes alias: '' and relies on this defaulting
	test('defaults the alias to the generated id when alias is empty', () => {
		const result = generateRedaction({ target: 'hello', alias: '' });

		expect(result.alias).toBe(result.id);
	});

	test('id matches the ULID filter pattern', () => {
		regexUlid.lastIndex = 0;

		expect(generateRedaction({ target: 'x', alias: 'y' }).id).toMatch(
			regexUlid,
		);
	});

	// unredact resolves a target by alias, so two targets sharing an alias would
	// make one of them unrecoverable
	test('gives distinct redactions distinct ids and aliases', () => {
		const first = generateRedaction({ target: 'a', alias: '' });
		const second = generateRedaction({ target: 'b', alias: '' });

		expect(first.id).not.toBe(second.id);
		expect(first.alias).not.toBe(second.alias);
	});

	test('timestamp comes from Date.now', () => {
		const spy = spyOn(Date, 'now').mockReturnValue(12345);

		expect(generateRedaction({ target: 'x', alias: 'y' }).timestamp).toBe(
			12345,
		);

		spy.mockRestore();
	});

	test('timestamp falls between the surrounding clock reads', () => {
		const before = Date.now();
		const result = generateRedaction({ target: 'x', alias: 'y' });
		const after = Date.now();

		expect(result.timestamp).toBeGreaterThanOrEqual(before);
		expect(result.timestamp).toBeLessThanOrEqual(after);
	});
});
