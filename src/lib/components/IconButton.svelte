<script lang="ts">
import Icon, { type IconName } from './Icon.svelte';

interface IProps {
	name: IconName;
	label: string;
	size?: number;
	iconSize?: number;
	danger?: boolean;
	active?: boolean;
	onclick: () => void;
}

const {
	name,
	label,
	size = 24,
	iconSize = 13,
	danger = false,
	active = false,
	onclick,
}: IProps = $props();
</script>

<button
	type="button"
	aria-label={label}
	title={label}
	{onclick}
	class={[
		'grid shrink-0 cursor-pointer place-items-center rounded-[3px] transition-colors hover:bg-rule',
		danger ? 'text-muted hover:text-danger' : 'text-muted hover:text-fg',
		active && 'bg-rule text-fg',
	]}
	style:width="{size}px"
	style:height="{size}px"
>
	<Icon {name} size={iconSize} />
</button>
