<script lang="ts">
interface IProps {
	value?: string;
	placeholder?: string;
	mono?: boolean;
	class?: string;
	oninput?: () => void;
}

let {
	value = $bindable(''),
	placeholder = '',
	mono = false,
	class: cls = '',
	oninput,
}: IProps = $props();
</script>

<input
	type="text"
	bind:value
	{placeholder}
	{oninput}
	class={[
		'h-[30px] w-full rounded-[3px] border border-border bg-surface px-2 text-fg outline-none placeholder:text-faint focus:border-primary',
		mono ? 'font-mono text-xs' : 'font-sans text-[12.5px]',
		cls,
	]}
>
