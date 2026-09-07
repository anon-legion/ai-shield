import { describe, expect, test } from 'bun:test';
import { regexUlid } from '@/utils/filter/filterUlid';
import { generateUlid } from '@/utils/ulidGenerator';

describe('generateUlid', () => {
	test('returns a string', () => {
		expect(typeof generateUlid()).toBe('string');
	});

	test('returns exactly 26 characters', () => {
		expect(generateUlid()).toHaveLength(26);
	});

	// regexUlid is global and shared across test files, so .test() carries
	// lastIndex between calls. rebuild from its source: no g flag, and anchored
	// so the whole string must be a ULID rather than merely contain one
	test('matches the ULID format', () => {
		expect(generateUlid()).toMatch(new RegExp(`^${regexUlid.source}$`));
	});

	test('returns unique values on consecutive calls', () => {
		expect(generateUlid()).not.toBe(generateUlid());
	});

	test('avoids Crockford base32 ambiguous characters', () => {
		const generated = Array.from({ length: 50 }, generateUlid).join('');

		for (const excluded of ['I', 'L', 'O', 'U']) {
			expect(generated).not.toContain(excluded);
		}
	});

	// ulid() is not monotonic without monotonicFactory, so two calls inside the
	// same millisecond may be unordered. only cross-millisecond ordering holds.
	test('values across different milliseconds are lexicographically ordered', async () => {
		const first = generateUlid();
		await new Promise((resolve) => setTimeout(resolve, 2));
		const second = generateUlid();

		expect(second >= first).toBe(true);
	});

	test('output is accepted by the ULID filter used to find aliases', async () => {
		const { hasUlid } = await import('@/utils/filter/filterUlid');

		expect(hasUlid(generateUlid())).toBe(true);
	});
});
