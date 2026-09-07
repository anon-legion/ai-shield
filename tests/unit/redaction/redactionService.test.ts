import { beforeEach, describe, expect, test } from 'bun:test';
import type { IRedaction, ULID } from '@/models/redaction';
import type { ExtensionDb } from '@/utils/data/database';
import {
	createRedactionService,
	type IRedactionService,
} from '@/utils/redaction/redactionService';

function makeRedaction(overrides: Partial<IRedaction> = {}): IRedaction {
	return {
		id: '01ARZ3NDEKTSV4RRFFQ69G5FAV' as ULID,
		target: 'original-value',
		alias: 'ALIAS_VALUE',
		timestamp: 0,
		...overrides,
	};
}

function createMockDb(store: Map<ULID, IRedaction>) {
	return {
		add: async (_store: string, value: IRedaction) => {
			store.set(value.id, value);
			return value.id;
		},
		getAll: async () => [...store.values()],
		getAllFromIndex: async () => [...store.values()],
		get: async (_store: string, key: ULID) => store.get(key),
		getFromIndex: async (_store: string, index: string, key: string) =>
			[...store.values()].find((redaction) =>
				index === 'by-alias'
					? redaction.alias === key
					: redaction.target === key,
			),
		put: async (_store: string, value: IRedaction) => {
			store.set(value.id, value);
			return value.id;
		},
		delete: async (_store: string, key: ULID) => {
			store.delete(key);
		},
	};
}

function throwingService(): IRedactionService {
	const fail = async () => {
		throw new Error('DB error');
	};

	return createRedactionService(
		Promise.resolve({
			add: fail,
			getAll: fail,
			getAllFromIndex: fail,
			get: fail,
			getFromIndex: fail,
			put: fail,
			delete: fail,
		} as unknown as ExtensionDb),
	);
}

const redactionA = makeRedaction({
	id: '01ARZ3NDEKTSV4RRFFQ69G5FAV' as ULID,
	target: 'target-a',
	alias: 'alias-a',
});
const redactionB = makeRedaction({
	id: '01ARZ3NDEKTSV4RRFFQ69G5FAX' as ULID,
	target: 'target-b',
	alias: 'alias-b',
});

let store: Map<ULID, IRedaction>;
let service: IRedactionService;

beforeEach(() => {
	store = new Map();
	service = createRedactionService(
		Promise.resolve(createMockDb(store) as unknown as ExtensionDb),
	);
});

describe('add', () => {
	test('returns the redaction and persists it', async () => {
		expect(await service.add(redactionA)).toEqual(redactionA);
		expect(store.get(redactionA.id)).toEqual(redactionA);
	});

	test('returns null when the db throws', async () => {
		expect(await throwingService().add(redactionA)).toBeNull();
	});
});

describe('addMany', () => {
	test('returns the input array and persists every record', async () => {
		expect(await service.addMany([redactionA, redactionB])).toEqual([
			redactionA,
			redactionB,
		]);
		expect(store.size).toBe(2);
	});

	test('returns an empty array for empty input', async () => {
		expect(await service.addMany([])).toEqual([]);
	});

	test('returns an empty array when the db throws', async () => {
		expect(await throwingService().addMany([redactionA])).toEqual([]);
	});
});

describe('getAll', () => {
	test('returns an empty array for an empty store', async () => {
		expect(await service.getAll()).toEqual([]);
	});

	test('returns every stored redaction', async () => {
		store.set(redactionA.id, redactionA);
		store.set(redactionB.id, redactionB);

		const result = await service.getAll();

		expect(result).toHaveLength(2);
		expect(result).toContainEqual(redactionA);
		expect(result).toContainEqual(redactionB);
	});

	test('returns an empty array when the db throws', async () => {
		expect(await throwingService().getAll()).toEqual([]);
	});
});

describe('getManyByAlias', () => {
	beforeEach(() => {
		store.set(redactionA.id, redactionA);
		store.set(redactionB.id, redactionB);
	});

	test('returns the redaction matching one alias', async () => {
		expect(await service.getManyByAlias(['alias-a'])).toEqual([redactionA]);
	});

	test('returns every redaction matching multiple aliases', async () => {
		expect(await service.getManyByAlias(['alias-a', 'alias-b'])).toHaveLength(
			2,
		);
	});

	test('ignores aliases with no match', async () => {
		expect(await service.getManyByAlias(['alias-a', 'unknown'])).toEqual([
			redactionA,
		]);
	});

	test('returns an empty array for empty input', async () => {
		expect(await service.getManyByAlias([])).toEqual([]);
	});

	test('returns an empty array when the db throws', async () => {
		expect(await throwingService().getManyByAlias(['alias-a'])).toEqual([]);
	});
});

describe('getManyByTarget', () => {
	beforeEach(() => {
		store.set(redactionA.id, redactionA);
		store.set(redactionB.id, redactionB);
	});

	test('returns the redaction matching one target', async () => {
		expect(await service.getManyByTarget(['target-a'])).toEqual([redactionA]);
	});

	test('returns every redaction matching multiple targets', async () => {
		expect(
			await service.getManyByTarget(['target-a', 'target-b']),
		).toHaveLength(2);
	});

	test('ignores targets with no match', async () => {
		expect(await service.getManyByTarget(['unknown'])).toEqual([]);
	});

	test('returns an empty array for empty input', async () => {
		expect(await service.getManyByTarget([])).toEqual([]);
	});

	test('returns an empty array when the db throws', async () => {
		expect(await throwingService().getManyByTarget(['target-a'])).toEqual([]);
	});
});

describe('getById', () => {
	test('returns the redaction when the id exists', async () => {
		store.set(redactionA.id, redactionA);

		expect(await service.getById(redactionA.id)).toEqual(redactionA);
	});

	test('returns null when the id does not exist', async () => {
		expect(
			await service.getById('99999999999999999999999999' as ULID),
		).toBeNull();
	});

	test('returns null when the db throws', async () => {
		expect(await throwingService().getById(redactionA.id)).toBeNull();
	});
});

describe('getByAlias', () => {
	test('returns the redaction when the alias matches', async () => {
		store.set(redactionA.id, redactionA);

		expect(await service.getByAlias('alias-a')).toEqual(redactionA);
	});

	test('returns null when no redaction has that alias', async () => {
		expect(await service.getByAlias('unknown-alias')).toBeNull();
	});

	test('returns null when the db throws', async () => {
		expect(await throwingService().getByAlias('alias-a')).toBeNull();
	});
});

describe('getByTarget', () => {
	test('returns the redaction when the target matches', async () => {
		store.set(redactionA.id, redactionA);

		expect(await service.getByTarget('target-a')).toEqual(redactionA);
	});

	test('returns null when no redaction has that target', async () => {
		expect(await service.getByTarget('unknown-target')).toBeNull();
	});

	test('returns null when the db throws', async () => {
		expect(await throwingService().getByTarget('target-a')).toBeNull();
	});
});

describe('update', () => {
	test('returns the updated redaction and overwrites the record', async () => {
		store.set(redactionA.id, redactionA);

		const updated = { ...redactionA, alias: 'new-alias' };

		expect(await service.update(updated)).toEqual(updated);
		expect(store.get(redactionA.id)?.alias).toBe('new-alias');
	});

	test('upserts a record that does not exist yet', async () => {
		expect(await service.update(redactionA)).toEqual(redactionA);
		expect(store.has(redactionA.id)).toBe(true);
	});

	test('returns null when the db throws', async () => {
		expect(await throwingService().update(redactionA)).toBeNull();
	});
});

describe('deleteById', () => {
	test('returns true and removes the record when the id exists', async () => {
		store.set(redactionA.id, redactionA);

		expect(await service.deleteById(redactionA.id)).toBe(true);
		expect(store.has(redactionA.id)).toBe(false);
	});

	// db.delete() reports success even when nothing matched, so the service
	// looks the record up first and treats a miss as a failure
	test('returns false for an id that does not exist', async () => {
		expect(await service.deleteById('99999999999999999999999999' as ULID)).toBe(
			false,
		);
	});

	test('returns false when the delete itself throws', async () => {
		const service = createRedactionService(
			Promise.resolve({
				...createMockDb(new Map([[redactionA.id, redactionA]])),
				delete: async () => {
					throw new Error('delete failed');
				},
			} as unknown as ExtensionDb),
		);

		expect(await service.deleteById(redactionA.id)).toBe(false);
	});
});
