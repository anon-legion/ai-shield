<script lang="ts">
import { type IPromptSegment, RESTORE_MESSAGE } from '../../models/redaction';
import { promptMirrorStore } from '../settingsStore';
import { storedItem } from '../storedItem.svelte';
import Icon from './Icon.svelte';

const promptMirror = storedItem(promptMirrorStore);

const redactionCount = $derived(
	promptMirror.value.filter((segment) => segment.alias).length,
);

const redactionNoun = $derived(
	redactionCount === 1 ? 'redaction' : 'redactions',
);

// the chatbox lives in the page: ask the active tab's content script to swap
// the placeholder back; its input event then refreshes this mirror
async function restore(segment: IPromptSegment): Promise<void> {
	try {
		const [tab] = await browser.tabs.query({
			active: true,
			currentWindow: true,
		});

		if (tab?.id === undefined) return;

		await browser.tabs.sendMessage(tab.id, {
			type: RESTORE_MESSAGE,
			alias: segment.alias,
			nth: segment.nth,
		});
	} catch (err) {
		console.error(`AI-Shield: Could not restore redaction\n${err}`);
	}
}
</script>

<section class="border-t-2 border-rule bg-surface px-3.5 pt-2.5 pb-3">
	<div class="flex items-baseline">
		<h2 class="flex-1 font-semibold">Prompt</h2>
		<span class="text-[11px] text-muted">
			<span class="font-semibold text-primary">{redactionCount}</span>
			{redactionNoun}
		</span>
	</div>
	<!-- pre-wrap makes template whitespace visible. svelte trims it at block
	     edges, so segments abut; the button is a snippet so the formatter has
	     no seam inside <mark> to break with a space -->
	<div
		class="mt-1.5 h-28 overflow-y-auto rounded-[3px] border border-rule bg-panel p-2 text-xs leading-[1.45] wrap-break-word whitespace-pre-wrap text-muted"
	>
		{#each promptMirror.value as segment, index (index)}
			{#if segment.alias}
				{#snippet restoreButton()}
					<button
						type="button"
						aria-label="Restore original text"
						title="Restore original text"
						onclick={() => restore(segment)}
						class="absolute -top-2 -right-2 grid size-3 cursor-pointer place-items-center rounded-full bg-redacted text-panel"
					>
						<Icon name="x" size={8} strokeWidth={3} />
					</button>
				{/snippet}
				<mark class="relative rounded-[2px] bg-redacted/35 text-fg"
					>{segment.text}{@render restoreButton()}</mark
				>
			{:else}
				{segment.text}
			{/if}
		{/each}
	</div>
	<p class="text-[11px] text-faint">Mirrors the chatbox, unredacted.</p>
</section>
