<script lang="ts">
import type { Snippet } from 'svelte';

interface IProps {
	variant?: 'primary' | 'outline';
	disabled?: boolean;
	onclick: () => void;
	class?: string;
	children: Snippet;
}

const {
	variant = 'primary',
	disabled = false,
	onclick,
	class: cls = '',
	children,
}: IProps = $props();
</script>

<button
	type="button"
	{disabled}
	{onclick}
	class={[
		'cursor-pointer rounded-[3px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50',
		variant === 'primary'
			? 'bg-primary text-panel hover:bg-primary-hover'
			: 'border border-border bg-transparent text-muted hover:text-fg',
		cls,
	]}
>
	{@render children()}
</button>
