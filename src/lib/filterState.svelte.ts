import type { IFilter, ISerializedFilter } from '../models/filter';
import {
	deserializeFilterList,
	filterStore,
	serializeFilterList,
	whitelistStore,
} from './filterStore';

class FilterState {
	#store: typeof filterStore;

	state = $state<IFilter[]>([]);

	constructor(store: typeof filterStore) {
		this.#store = store;
		this.state = deserializeFilterList(store.fallback);
		store.getValue().then(this.updateState);
		store.watch(this.updateState); // for external change to store
	}

	updateState = (serialized: ISerializedFilter[] | null): void => {
		const incoming = serialized ?? this.#store.fallback;

		// ignore the watch() echo of our own setValue(): state already matches,
		// and replacing it would remount every row keyed on these objects
		if (
			JSON.stringify(incoming) ===
			JSON.stringify(serializeFilterList(this.state))
		) {
			return;
		}

		this.state = deserializeFilterList(incoming);
	};

	async #persist(): Promise<void> {
		await this.#store.setValue(serializeFilterList(this.state));
	}

	async addFilter(filter: IFilter): Promise<boolean> {
		try {
			const state = [...this.state];

			state.push(filter);

			this.state = state;

			await this.#persist();

			return true;
		} catch (err) {
			console.error(err);

			return false;
		}
	}

	async removeFilter(index: number): Promise<boolean> {
		try {
			const state = this.state.filter((_, i) => i !== index);

			this.state = state;

			await this.#persist();

			return true;
		} catch (err) {
			console.error(err);

			return false;
		}
	}

	async updateFilter(index: number, filter: IFilter): Promise<boolean> {
		try {
			const state = [...this.state];

			if (!state[index]) return false;

			state[index] = filter;

			this.state = state;

			await this.#persist();

			return true;
		} catch (err) {
			console.error(err);

			return false;
		}
	}

	async toggleFilter(index: number): Promise<boolean> {
		try {
			const state = [...this.state];
			const target = state[index];

			if (!target) return false;

			target.isEnabled = !target.isEnabled;

			this.state = state;

			await this.#persist();

			return true;
		} catch (err) {
			console.error(err);
			return false;
		}
	}
}

const filterState = new FilterState(filterStore);
const whitelistState = new FilterState(whitelistStore);

export { FilterState, filterState, whitelistState };
