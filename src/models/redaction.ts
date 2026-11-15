type ULID = string & { readonly _brand: 'ULID' };

interface IRedaction {
	id: ULID;
	target: string;
	alias: string;
	timestamp: number;
}

// a run of mirrored prompt text; alias and nth (occurrence index of that
// alias in the prompt) are set only on spans that are redacted in the chatbox
interface IPromptSegment {
	text: string;
	alias?: string;
	nth?: number;
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

// sidepanel→content message type: restore one placeholder in the chatbox
const RESTORE_MESSAGE = 'ai-shield:restore';

export {
	Idb,
	type IPromptSegment,
	type IRedaction,
	MenuId,
	RESTORE_MESSAGE,
	type ULID,
};
