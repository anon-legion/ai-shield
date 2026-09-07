import { ulid } from 'ulid';
import type { ULID } from '../models/redaction';

function generateUlid(): ULID {
	return ulid() as ULID;
}

export { generateUlid };
