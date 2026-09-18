<script lang="ts">
import type { FilterState } from '../filterState.svelte';
import FilterRow from './FilterRow.svelte';
import Icon from './Icon.svelte';
import NewFilterForm from './NewFilterForm.svelte';

interface IProps {
	title: string;
	kind: string;
	filters: FilterState;
	open?: boolean;
	bordered?: boolean;
}

const {
	title,
	kind,
	filters,
	open = false,
	bordered = false,
}: IProps = $props();

const enabledCount = $derived(
	filters.state.filter((filter) => filter.isEnabled).length,
);
</script>

<!-- shared name makes sibling sections a native exclusive accordion -->
<details
	name="section"
	{open}
	class={[
		'group/sec flex min-h-0 flex-col open:flex-1',
		bordered && 'border-t-2 border-rule',
	]}
>
	<summary
		class="flex cursor-pointer list-none items-baseline gap-1.5 px-3.5 pt-3 pb-1.5 [&::-webkit-details-marker]:hidden"
	>
		<span class="self-center transition-transform group-open/sec:rotate-90">
			<Icon name="chevron" size={12} />
		</span>
		<h2 class="flex-1 font-semibold">{title}</h2>
		<span class="text-[11px] whitespace-nowrap text-muted">
			{enabledCount}
			of {filters.state.length} active
		</span>
	</summary>
	<div class="min-h-0 flex-1 overflow-y-auto px-3.5">
		{#each filters.state as filter, index (filter)}
			<FilterRow {filter} {index} {filters} />
		{/each}
	</div>

	<NewFilterForm {filters} {kind} />
</details>
