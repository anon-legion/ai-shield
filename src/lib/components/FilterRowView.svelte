<script lang="ts">
import type { IFilter } from '../../models/filter';
import IconButton from './IconButton.svelte';

interface IProps {
	filter: IFilter;
	isCustom: boolean;
	onedit: () => void;
}

const { filter, isCustom, onedit }: IProps = $props();
</script>

<span class="min-w-0 flex-1 truncate">{filter.label}</span>
{#if isCustom}
	<span
		class="shrink-0 rounded-[2px] border border-custom px-1 text-[9.5px] leading-[14px] font-semibold tracking-[0.06em] uppercase text-custom"
	>
		Custom
	</span>
{/if}
<IconButton name="pencil" label="Edit filter" onclick={onedit} />
