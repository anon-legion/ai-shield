import { type DBSchema, type IDBPDatabase, openDB } from 'idb';
import type { IRedaction, ULID } from '../../models/redaction';
import { Idb } from '../../models/redaction';

interface ExtensionDbSchema extends DBSchema {
	redactions: {
		key: ULID;
		value: IRedaction;
		indexes: { 'by-target': string; 'by-alias': string };
	};
}

type ExtensionDb = IDBPDatabase<ExtensionDbSchema>;

function openExtensionDb(): Promise<ExtensionDb> {
	return openDB<ExtensionDbSchema>(Idb.DbName, 1, {
		upgrade(db: IDBPDatabase<ExtensionDbSchema>) {
			const store = db.createObjectStore(Idb.DbObjectStoreName, {
				keyPath: 'id',
				autoIncrement: false,
			});

			store.createIndex('by-target', 'target');
			store.createIndex('by-alias', 'alias');
		},
	});
}

export { type ExtensionDb, openExtensionDb };
