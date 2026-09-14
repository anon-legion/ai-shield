<script lang="ts">
interface IProps {
	checked: boolean;
	label: string;
	onclick: () => void;
}

const { checked, label, onclick }: IProps = $props();
</script>

<label
	class={[
		'flex h-5 w-[38px] shrink-0 cursor-pointer rounded-[3px] p-[2px] transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary',
		checked ? 'justify-end bg-enabled' : 'justify-start bg-border',
	]}
>
	<input
		type="checkbox"
		class="sr-only"
		{checked}
		aria-label={label}
		onchange={onclick}
	>
	<span
		class={['size-4 rounded-[2px]', checked ? 'bg-panel' : 'bg-muted']}
	></span>
</label>
