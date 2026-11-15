type ULID = string & { readonly _brand: 'ULID' };

interface IRedaction {
	id: ULID;
	target: string;
	alias: string;
	timestamp: number;
}

const Idb = {
	DbName: 'ai-shield',
	DbObjectStoreName: 'redactions' as const,
};

// context menu item ids, doubling as the background→content message type
const MenuId = {
	Redact: 'ai-shield:redact',
	Whitelist: 'ai-shield:whitelist',
} as const;

export { Idb, type IRedaction, MenuId, type ULID };
