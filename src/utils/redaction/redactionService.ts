import type { ProxyServiceKey } from '@webext-core/proxy-service';
import type { IRedaction, ULID } from '../../models/redaction';
import type { ExtensionDb } from '../data/database';

interface IRedactionService {
	add(redaction: IRedaction): Promise<IRedaction | null>;
	addMany(redactions: IRedaction[]): Promise<IRedaction[]>;
	getAll(): Promise<IRedaction[]>;
	getManyByAlias(aliases: string[]): Promise<IRedaction[]>;
	getManyByTarget(targets: string[]): Promise<IRedaction[]>;
	getById(id: ULID): Promise<IRedaction | null>;
	getByAlias(alias: string): Promise<IRedaction | null>;
	getByTarget(target: string): Promise<IRedaction | null>;
	update(redaction: IRedaction): Promise<IRedaction | null>;
	deleteById(id: ULID): Promise<boolean>;
}

function createRedactionService(_db: Promise<ExtensionDb>): IRedactionService {
	return {
		async add(redaction: IRedaction) {
			try {
				const db = await _db;
				const result = await db.add('redactions', redaction);

				return result ? redaction : null;
			} catch (err) {
				console.error(err);

				return null;
			}
		},
		async addMany(redactions: IRedaction[]) {
			try {
				const db = await _db;
				const results = await Promise.all(
					redactions.map(async (redaction) => db.add('redactions', redaction)),
				);

				return results.length > 0 ? redactions : [];
			} catch (err) {
				console.error(err);

				return [];
			}
		},
		async getAll() {
			try {
				const db = await _db;

				return await db.getAll('redactions');
			} catch (err) {
				console.error(err);

				return [];
			}
		},
		async getManyByAlias(aliases: string[]) {
			try {
				const db = await _db;

				const results = (
					await db.getAllFromIndex('redactions', 'by-alias')
				).filter((redaction) => aliases.includes(redaction.alias));

				return results;
			} catch (err) {
				console.error(err);

				return [];
			}
		},
		async getManyByTarget(targets: string[]) {
			try {
				const db = await _db;

				const results = (
					await db.getAllFromIndex('redactions', 'by-target')
				).filter((redaction) => targets.includes(redaction.target));

				return results;
			} catch (err) {
				console.error(err);

				return [];
			}
		},
		async getById(id: ULID) {
			try {
				const db = await _db;

				return (await db.get('redactions', id)) || null;
			} catch (err) {
				console.error(err);

				return null;
			}
		},
		async getByAlias(alias: string) {
			try {
				const db = await _db;

				return (await db.getFromIndex('redactions', 'by-alias', alias)) || null;
			} catch (err) {
				console.error(err);

				return null;
			}
		},
		async getByTarget(target: string) {
			try {
				const db = await _db;

				return (
					(await db.getFromIndex('redactions', 'by-target', target)) || null
				);
			} catch (err) {
				console.error(err);

				return null;
			}
		},
		async update(redaction: IRedaction) {
			try {
				const db = await _db;
				// db.put() performs an upsert operation
				const result = await db.put('redactions', redaction);

				return result ? redaction : null;
			} catch (err) {
				console.error(err);

				return null;
			}
		},
		async deleteById(id: ULID) {
			try {
				const db = await _db;
				const target = await db.get('redactions', id);

				if (!target) {
					throw new Error(`Redaction with id: ${id} does not exist.`);
				}

				// db.delete() considers the operations successful even if no record was dceleted
				await db.delete('redactions', id);

				return true;
			} catch (err) {
				console.error(err);

				return false;
			}
		},
	};
}

const REDACTION_SERVICE_KEY =
	'redaction-service' as ProxyServiceKey<IRedactionService>;

export {
	createRedactionService,
	type IRedactionService,
	REDACTION_SERVICE_KEY,
};
