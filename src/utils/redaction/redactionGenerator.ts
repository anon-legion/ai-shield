import { ulid } from 'ulid';
import type { IRedaction, ULID } from '../../models/redaction';

function generateUlid(): ULID {
	return ulid() as ULID;
}

function generateRedaction(
	redaction: Omit<IRedaction, 'id' | 'timestamp'>,
): IRedaction {
	const id = generateUlid();

	return {
		id,
		target: redaction.target,
		alias: redaction.alias ? redaction.alias : id,
		timestamp: Date.now(),
	};
}

export { generateRedaction, generateUlid };
