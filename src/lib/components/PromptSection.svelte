<script lang="ts">
import { enabledPatterns } from '../../utils/filter/filterInput';
import {
	applyWhitelist,
	boundTarget,
	countMatches,
	findMatches,
} from '../../utils/redaction/redactionText';
import { filterState, whitelistState } from '../filterState.svelte';
import { promptMirrorStore } from '../settingsStore';
import { storedItem } from '../storedItem.svelte';

const promptMirror = storedItem(promptMirrorStore);

// derive surviving targets first so the badge agrees with redact();
// counting bounded unique targets dedupes across patterns, closer to what
// redactText actually substitutes than the old raw per-pattern sum
const targets = $derived(
	applyWhitelist(
		findMatches(promptMirror.value, enabledPatterns(filterState.state)),
		enabledPatterns(whitelistState.state),
	),
);

const redactionCount = $derived(
	countMatches(
		promptMirror.value,
		[...new Set(targets)].map(
			(target) => new RegExp(boundTarget(target), 'gu'),
		),
	),
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
