<script lang="ts">
import type { IFilter } from '../../models/filter';
import { type FilterState, filterState } from '../filterState.svelte';
import FilterRowEdit from './FilterRowEdit.svelte';
import FilterRowView from './FilterRowView.svelte';
import Icon from './Icon.svelte';

interface IProps {
	filter: IFilter;
	index: number;
	filters?: FilterState;
}

const { filter, index, filters = filterState }: IProps = $props();

// ponytail: suffix sniff instead of an isDefault field — avoids a storage
// migration; add the field when defaults become renamable
const isCustom = $derived(!filter.label.endsWith('(default)'));

let editing = $state(false);

const checkboxClass = $derived(
	filter.isEnabled
		? 'bg-enabled text-panel'
		: 'border-[1.5px] border-unchecked hover:border-muted',
);
</script>

<div class="flex items-center gap-2.5 border-t border-rule py-2">
	<label
		class={[
			'grid size-4 shrink-0 cursor-pointer place-items-center rounded-[2px] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary',
			checkboxClass,
		]}
	>
		<input
			type="checkbox"
			class="sr-only"
			checked={filter.isEnabled}
			aria-label={filter.label}
			onchange={() => filters.toggleFilter(index)}
		>
		{#if filter.isEnabled}
			<Icon name="check" size={11} strokeWidth={3.5} />
		{/if}
	</label>
	{#if editing}
		<FilterRowEdit
			{filter}
			{index}
			{filters}
			onclose={() => (editing = false)}
		/>
	{:else}
		<FilterRowView
			{filter}
			{index}
			{filters}
			{isCustom}
			onedit={() => (editing = true)}
		/>
	{/if}
</div>
