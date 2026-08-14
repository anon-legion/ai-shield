interface IFilter {
	label: string;
	regex: RegExp;
	isEnabled: boolean;
}

interface ISerializedFilter {
	label: string;
	source: string;
	flags: string;
	isEnabled: boolean;
}

export type { IFilter, ISerializedFilter };
