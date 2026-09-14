import { escapeRegExp } from '../redaction/redactionText';

// throws on invalid regex source — caller catches and surfaces the message
function buildFilterRegex(
	target: string,
	mode: 'text' | 'regex',
	caseInsensitive: boolean,
): RegExp {
	const source = mode === 'text' ? escapeRegExp(target.trim()) : target.trim();

	return new RegExp(source, `g${caseInsensitive ? 'i' : ''}`);
}

export { buildFilterRegex };
