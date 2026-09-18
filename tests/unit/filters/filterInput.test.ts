import { describe, expect, test } from 'bun:test';
import { buildFilterRegex } from '@/utils/filter/filterInput';

describe('buildFilterRegex', () => {
	test('text mode escapes regex metacharacters', () => {
		const regex = buildFilterRegex('a.b', 'text', false);

		expect('a.b'.match(regex)).toEqual(['a.b']);
		expect('axb'.match(regex)).toBeNull();
	});

	test('regex mode uses raw source', () => {
		const regex = buildFilterRegex('INV-\\d{6}', 'regex', false);

		expect('see INV-123456 and INV-654321'.match(regex)).toEqual([
			'INV-123456',
			'INV-654321',
		]);
	});

	test('always sets g flag', () => {
		expect(buildFilterRegex('x', 'text', false).flags).toBe('g');
	});

	test('adds i flag when case insensitive', () => {
		const regex = buildFilterRegex('Acme', 'text', true);

		expect(regex.flags).toBe('gi');
		expect('acme ACME'.match(regex)).toEqual(['acme', 'ACME']);
	});

	test('trims target', () => {
		expect(buildFilterRegex('  acme  ', 'text', false).source).toBe('acme');
	});

	test('throws on invalid regex source', () => {
		expect(() => buildFilterRegex('(', 'regex', false)).toThrow();
	});

	test('text mode never throws on metacharacters', () => {
		expect(buildFilterRegex('(', 'text', false).source).toBe('\\(');
	});
});
