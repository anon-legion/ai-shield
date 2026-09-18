import type { IFilter } from '../../models/filter';
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

function enabledPatterns(filters: IFilter[]): RegExp[] {
	return filters
		.filter((filter) => filter.isEnabled)
		.map((filter) =>
			filter.regex.global
				? filter.regex
				: new RegExp(filter.regex.source, `${filter.regex.flags}g`),
		);
}

export { buildFilterRegex, enabledPatterns };
