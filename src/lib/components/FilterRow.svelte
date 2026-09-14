<script lang="ts">
import type { IFilter } from '../../models/filter';
import { filterState } from '../filterState.svelte';
import Button from './Button.svelte';
import Icon from './Icon.svelte';
import IconButton from './IconButton.svelte';
import TextInput from './TextInput.svelte';

interface IProps {
	filter: IFilter;
	index: number;
}

const { filter, index }: IProps = $props();

// ponytail: suffix sniff instead of an isDefault field — avoids a storage
// migration; add the field when defaults become renamable
const isCustom = $derived(!filter.label.endsWith('(default)'));

let editing = $state(false);
let editLabel = $state('');
let editTarget = $state('');

function startEdit(): void {
	editLabel = filter.label;
	editTarget = filter.regex.source;
	editing = true;
}

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

	editing = false;
}
</script>

<div class="flex items-center gap-2.5 border-t border-rule py-2">
	<label
		class={[
			'grid size-4 shrink-0 cursor-pointer place-items-center rounded-[2px] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary',
			filter.isEnabled
				? 'bg-enabled text-panel'
				: 'border-[1.5px] border-unchecked hover:border-muted',
		]}
	>
		<input
			type="checkbox"
			class="sr-only"
			checked={filter.isEnabled}
			aria-label={filter.label}
			onchange={() => filterState.toggleFilter(index)}
		>
		{#if filter.isEnabled}
			<Icon name="check" size={11} strokeWidth={3.5} />
		{/if}
	</label>
	{#if editing}
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
				<Button
					variant="outline"
					onclick={() => (editing = false)}
					class="h-[26px] px-3 text-xs"
				>
					Cancel
				</Button>
			</div>
		</div>
	{:else}
		<span class="min-w-0 flex-1 truncate">{filter.label}</span>
		{#if isCustom}
			<span
				class="shrink-0 rounded-[2px] border border-custom px-1 text-[9.5px] leading-[14px] font-semibold tracking-[0.06em] uppercase text-custom"
			>
				Custom
			</span>
		{/if}
		<IconButton name="pencil" label="Edit filter" onclick={startEdit} />
		{#if isCustom}
			<IconButton
				name="trash"
				label="Delete filter"
				danger
				onclick={() => filterState.removeFilter(index)}
			/>
		{/if}
	{/if}
</div>
