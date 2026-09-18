<script lang="ts">
import FilterRow from '@/lib/components/FilterRow.svelte';
import NewFilterForm from '@/lib/components/NewFilterForm.svelte';
import PromptSection from '@/lib/components/PromptSection.svelte';
import Toggle from '@/lib/components/Toggle.svelte';
import { filterState } from '@/lib/filterState.svelte';
import { autoRedactStore } from '@/lib/settingsStore';
import { storedItem } from '@/lib/storedItem.svelte';

const autoRedact = storedItem(autoRedactStore);

let tab = $state<'redact' | 'extra'>('redact');

const enabledCount = $derived(
	filterState.state.filter((filter) => filter.isEnabled).length,
);

function tabClass(active: boolean): string {
	return active
		? '-mb-[2px] h-[34px] cursor-pointer border-b-2 font-semibold border-primary text-fg'
		: '-mb-[2px] h-[34px] cursor-pointer border-b-2 font-semibold border-transparent text-muted hover:text-fg';
}
</script>

<div
	class="flex h-screen flex-col border-l border-rule bg-panel font-sans text-[13px] leading-[1.4] text-fg"
>
	<nav class="flex gap-4 border-b-2 border-rule px-3.5">
		{#each [['redact', 'Redact'], ['extra', 'Extra']] as const as [ id, title ] (id)}
			<button
				type="button"
				onclick={() => (tab = id)}
				class={tabClass(tab === id)}
			>
				{title}
			</button>
		{/each}
	</nav>

	{#if tab === 'redact'}
		<section class="flex items-center border-b-2 border-rule px-3.5 py-3">
			<div class="flex-1">
				<h2 class="font-semibold">Auto redact</h2>
				<p class="text-[11.5px] text-muted">from clipboard</p>
			</div>
			<Toggle
				checked={autoRedact.value}
				label="Auto redact from clipboard"
				onclick={() => autoRedact.set(!autoRedact.value)}
			/>
		</section>

		<div class="flex items-baseline px-3.5 pt-3 pb-1.5">
			<h2 class="flex-1 font-semibold">Filters</h2>
			<span class="text-[11px] whitespace-nowrap text-muted">
				{enabledCount}
				of {filterState.state.length} active
			</span>
		</div>
		<div class="min-h-0 flex-1 overflow-y-auto px-3.5">
			{#each filterState.state as filter, index (filter)}
				<FilterRow {filter} {index} />
			{/each}
		</div>

		<NewFilterForm />

		<PromptSection />
	{:else}
		<div class="flex flex-1 items-center justify-center text-xs text-muted">
			Under development
		</div>
	{/if}
</div>
