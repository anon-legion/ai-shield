import type { IFilter, ISerializedFilter } from '../models/filter';
import { filterDefault } from '../utils/filter/filterDefault';

function serializeFilterList(filters: IFilter[]): ISerializedFilter[] {
	return filters.map((filter) => ({
		label: filter.label,
		source: filter.regex.source,
		flags: filter.regex.flags,
		isEnabled: filter.isEnabled,
	}));
}

function deserializeFilterList(
	serializedFilters: ISerializedFilter[],
): IFilter[] {
	return serializedFilters.map((filter) => ({
		label: filter.label,
		regex: new RegExp(filter.source, filter.flags),
		isEnabled: filter.isEnabled,
	}));
}

const filterStore = storage.defineItem<ISerializedFilter[]>('local:filters', {
	fallback: serializeFilterList(filterDefault),
});

export type { ISerializedFilter as SerializedFilter };

export { deserializeFilterList, filterStore, serializeFilterList };
