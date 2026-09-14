<script lang="ts">
import iconUrl from '@/assets/icon.svg';
import FilterRow from '@/lib/components/FilterRow.svelte';
import IconButton from '@/lib/components/IconButton.svelte';
import NewFilterForm from '@/lib/components/NewFilterForm.svelte';
import Toggle from '@/lib/components/Toggle.svelte';
import { filterState } from '@/lib/filterState.svelte';
import { autoRedactStore, promptMirrorStore } from '@/lib/settingsStore';
import { storedItem } from '@/lib/storedItem.svelte';
import { countMatches } from '@/utils/redaction/redactionText';

const autoRedact = storedItem(autoRedactStore);
const promptMirror = storedItem(promptMirrorStore);

let tab = $state<'redact' | 'extra'>('redact');

const canPin = !!browser.sidePanel?.setPanelBehavior;

let pinned = $state(false);

if (canPin) {
	browser.sidePanel.getPanelBehavior().then((behavior) => {
		pinned = behavior.openPanelOnActionClick ?? false;
	});
}

async function togglePin(): Promise<void> {
	await browser.sidePanel.setPanelBehavior({
		openPanelOnActionClick: !pinned,
	});

	pinned = !pinned;
}

const enabledCount = $derived(
	filterState.state.filter((filter) => filter.isEnabled).length,
);

const enabledPatterns = $derived(
	filterState.state
		.filter((filter) => filter.isEnabled)
		.map((filter) =>
			filter.regex.global
				? filter.regex
				: new RegExp(filter.regex.source, `${filter.regex.flags}g`),
		),
);

const redactionCount = $derived(
	countMatches(promptMirror.value, enabledPatterns),
);
</script>

<div
	class="flex h-screen flex-col border-l border-rule bg-panel font-sans text-[13px] leading-[1.4] text-fg"
>
	<header class="flex items-center gap-2 border-b-2 border-rule px-3.5 py-2.5">
		<img src={iconUrl} alt="" width="16" height="16">
		<h1 class="text-sm font-extrabold">AI Shield</h1>
		<span class="flex-1"></span>
		{#if canPin}
			<IconButton
				name="pin"
				label={pinned ? 'Unpin from toolbar click' : 'Pin to toolbar click'}
				size={26}
				iconSize={14}
				active={pinned}
				onclick={togglePin}
			/>
		{/if}
		<IconButton
			name="x"
			label="Close panel"
			size={26}
			iconSize={14}
			onclick={() => window.close()}
		/>
	</header>

	<nav class="flex gap-4 border-b-2 border-rule px-3.5">
		{#each [['redact', 'Redact'], ['extra', 'Extra']] as const as [ id, title ] (id)}
			<button
				type="button"
				onclick={() => (tab = id)}
				class={[
					'-mb-[2px] h-[34px] cursor-pointer border-b-2 font-semibold',
					tab === id
						? 'border-primary text-fg'
						: 'border-transparent text-muted hover:text-fg',
				]}
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

		<section class="border-t-2 border-rule bg-surface px-3.5 pt-2.5 pb-3">
			<div class="flex items-baseline">
				<h2 class="flex-1 font-semibold">Prompt</h2>
				<span class="text-[11px] text-muted">
					<span class="font-semibold text-primary">{redactionCount}</span>
					{redactionCount === 1 ? 'redaction' : 'redactions'}
				</span>
			</div>
			<textarea
				disabled
				readonly
				value={promptMirror.value}
				class="mt-1.5 h-[112px] w-full resize-none rounded-[3px] border border-rule bg-panel p-2 text-xs leading-[1.45] text-muted outline-none"
			></textarea>
			<p class="text-[11px] text-faint">Mirrors the chatbox, unredacted.</p>
		</section>
	{:else}
		<div class="flex flex-1 items-center justify-center text-xs text-muted">
			Nothing here yet
		</div>
	{/if}
</div>
