<script lang="ts" module>
// one toast at a time: a new message replaces the current one
const toast = $state({ id: 0, message: '' });

function showToast(message: string): void {
	toast.message = message;
	toast.id += 1;
}

export { showToast };
</script>

<script lang="ts">
import Icon from './Icon.svelte';
</script>

<div
	role="status"
	class="pointer-events-none fixed inset-x-0 bottom-[22%] z-[2147483647] flex justify-center"
>
	{#if toast.message}
		<!-- keyed: a new toast restarts the animation, which doubles as the
		     timer (--animate-toast in toast.css) -->
		{#key toast.id}
			<div
				class="flex animate-toast items-center gap-2 rounded-[3px] border border-border bg-surface px-3 py-2 font-sans text-[13px] leading-[1.4] font-semibold text-fg"
				onanimationend={() => (toast.message = '')}
			>
				<span class="text-enabled"><Icon name="check" /></span>
				{toast.message}
				<span class="text-[11px] font-normal text-muted">AI Shield</span>
			</div>
		{/key}
	{/if}
</div>
