import type { WxtStorageItem } from '@wxt-dev/storage';

interface IStoredItem<T> {
	readonly value: T;
	set(value: T): void;
}

// reactive wrapper over a wxt storage item: warm from storage, follow
// external writes via watch, write through on set
function storedItem<T>(
	item: WxtStorageItem<T, Record<string, unknown>>,
): IStoredItem<T> {
	const state = $state({ value: item.fallback });

	item.getValue().then((value) => {
		state.value = value;
	});
	item.watch((value) => {
		state.value = value ?? item.fallback;
	});

	return {
		get value() {
			return state.value;
		},
		set(value: T) {
			state.value = value;

			item.setValue(value).catch((err) => {
				console.error(err);
			});
		},
	};
}

export type { IStoredItem };
export { storedItem };
