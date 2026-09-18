<script lang="ts">
import type { IFilter } from '../../models/filter';
import { filterState } from '../filterState.svelte';
import Button from './Button.svelte';
import TextInput from './TextInput.svelte';

interface IProps {
	filter: IFilter;
	index: number;
	onclose: () => void;
}

const { filter, index, onclose }: IProps = $props();

// deliberate snapshot: the edit buffer seeds from the filter once on mount
// svelte-ignore state_referenced_locally
let editLabel = $state(filter.label);
// svelte-ignore state_referenced_locally
let editTarget = $state(filter.regex.source);

function saveEdit(): void {
	let regex: RegExp;

	try {
		regex = new RegExp(editTarget, filter.regex.flags);
	} catch {
		// prototype behavior: invalid edit regex is a silent no-op
		return;
	}

	filterState.updateFilter(index, {
		...filter,
		label: editLabel.trim() || filter.label,
		regex,
	});

	onclose();
}
</script>

<div class="flex min-w-0 flex-1 flex-col gap-1.5">
	<TextInput bind:value={editLabel} placeholder="Label" class="h-7" />
	<TextInput
		bind:value={editTarget}
		placeholder="Regex source"
		mono
		class="h-7"
	/>
	<div class="flex gap-1.5">
		<Button onclick={saveEdit} class="h-[26px] px-3 text-xs">Save</Button>
		<Button variant="outline" onclick={onclose} class="h-[26px] px-3 text-xs">
			Cancel
		</Button>
	</div>
</div>
