<script lang="ts">
import { countMatches } from '../../utils/redaction/redactionText';
import { filterState } from '../filterState.svelte';
import { promptMirrorStore } from '../settingsStore';
import { storedItem } from '../storedItem.svelte';

const promptMirror = storedItem(promptMirrorStore);

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

const redactionNoun = $derived(
	redactionCount === 1 ? 'redaction' : 'redactions',
);
</script>

<section class="border-t-2 border-rule bg-surface px-3.5 pt-2.5 pb-3">
	<div class="flex items-baseline">
		<h2 class="flex-1 font-semibold">Prompt</h2>
		<span class="text-[11px] text-muted">
			<span class="font-semibold text-primary">{redactionCount}</span>
			{redactionNoun}
		</span>
	</div>
	<textarea
		disabled
		readonly
		value={promptMirror.value}
		class="mt-1.5 h-28 w-full resize-none rounded-[3px] border border-rule bg-panel p-2 text-xs leading-[1.45] text-muted outline-none"
	></textarea>
	<p class="text-[11px] text-faint">Mirrors the chatbox, unredacted.</p>
</section>
