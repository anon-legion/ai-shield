import type { IFilter, ISerializedFilter } from '../models/filter';
import {
	deserializeFilterList,
	filterStore,
	serializeFilterList,
} from './filterStore';

class FilterState {
	state = $state<IFilter[]>(deserializeFilterList(filterStore.fallback));

	#skipNextUpdate = false;

	constructor() {
		filterStore.getValue().then(this.updateState);
		filterStore.watch(this.updateState); // for external change to store
	}

	updateState = (serialized: ISerializedFilter[] | null): void => {
		if (this.#skipNextUpdate) {
			this.#skipNextUpdate = false;

			return;
		}

		const filterList = deserializeFilterList(
			serialized ?? filterStore.fallback,
		);

		this.state = filterList;
	};

	async #persist(): Promise<void> {
		this.#skipNextUpdate = true; // suppress updateState call by filterStore.watch() triggered by setValue()

		await filterStore.setValue(serializeFilterList(this.state));
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
			const state = [...this.state.filter((_, i) => i !== index)];

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

const filterState = new FilterState();

export { filterState };
