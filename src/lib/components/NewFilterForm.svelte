<script lang="ts">
import { buildFilterRegex } from '../../utils/filter/filterInput';
import { filterState } from '../filterState.svelte';
import Button from './Button.svelte';
import TextInput from './TextInput.svelte';

let label = $state('');
let target = $state('');
let caseInsensitive = $state(false);
let mode = $state<'text' | 'regex'>('text');
let regexError = $state('');

const addDisabled = $derived(!label.trim() || !target.trim());

function addFilter(): void {
	if (addDisabled) return;

	let regex: RegExp;

	try {
		regex = buildFilterRegex(target, mode, caseInsensitive);
	} catch (err) {
		regexError = `Invalid regex: ${(err as Error).message.replace(
			/^Invalid regular expression: /,
			'',
		)}`;

		return;
	}

	filterState.addFilter({ label: label.trim(), regex, isEnabled: true });

	label = '';
	target = '';
	caseInsensitive = false;
	regexError = '';
}
</script>

<section
	class="flex flex-col gap-1.5 border-t-2 border-rule px-3.5 pt-2.5 pb-3"
>
	<h2 class="text-[13px] font-semibold">New filter</h2>
	<TextInput bind:value={label} placeholder="Label" />
	<TextInput
		bind:value={target}
		placeholder={mode === 'text' ? 'Target text' : 'Regex source, e.g. INV-\\d{6}'}
		mono
		oninput={() => (regexError = '')}
	/>
	<div class="flex items-center">
		<label class="flex flex-1 items-center gap-1.5 text-xs text-muted">
			<input
				type="checkbox"
				bind:checked={caseInsensitive}
				class="size-3.5 accent-enabled"
			>
			Case insensitive
		</label>
		<div
			class="flex h-[22px] overflow-hidden rounded-[3px] border border-border text-[11px]"
		>
			<button
				type="button"
				onclick={() => {
					mode = 'text';
					regexError = '';
				}}
				class={[
					'cursor-pointer px-2',
					mode === 'text' ? 'bg-border text-fg' : 'text-muted hover:text-fg',
				]}
			>
				Text
			</button>
			<button
				type="button"
				onclick={() => (mode = 'regex')}
				class={[
					'cursor-pointer px-2 font-mono',
					mode === 'regex' ? 'bg-border text-fg' : 'text-muted hover:text-fg',
				]}
			>
				.*
			</button>
		</div>
	</div>
	{#if regexError}
		<p class="text-[11px] text-danger">{regexError}</p>
	{/if}
	<Button
		onclick={addFilter}
		disabled={addDisabled}
		class="h-[30px] px-2 text-left text-[12.5px]"
	>
		Add filter
	</Button>
</section>
