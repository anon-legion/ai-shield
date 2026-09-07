import type { IRedaction } from '../../models/redaction';
import { generateUlid } from '../ulidGenerator';

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

export { generateRedaction };
