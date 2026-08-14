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

export { Idb, type IRedaction, type ULID };
