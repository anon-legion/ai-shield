import { describe, expect, test } from 'bun:test';
import type { IFilter } from '@/models/filter';
import { buildFilterRegex, enabledPatterns } from '@/utils/filter/filterInput';

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

describe('enabledPatterns', () => {
	function filter(regex: RegExp, isEnabled: boolean): IFilter {
		return { label: 'f', regex, isEnabled };
	}

	test('keeps only enabled filters', () => {
		const patterns = enabledPatterns([filter(/a/g, true), filter(/b/g, false)]);

		expect(patterns.map((regex) => regex.source)).toEqual(['a']);
	});

	test('forces the g flag, preserving other flags', () => {
		const patterns = enabledPatterns([filter(/a/i, true), filter(/b/g, true)]);

		expect(patterns.map((regex) => regex.flags)).toEqual(['gi', 'g']);
	});
});
