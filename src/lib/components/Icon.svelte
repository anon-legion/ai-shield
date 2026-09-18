<script lang="ts" module>
type IconName = 'pin' | 'x' | 'pencil' | 'trash' | 'check';

// lucide path data, inlined to avoid an icon dependency
const shapes: Record<IconName, string> = {
	pin: '<line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14l-1.5-5H6.5z"/><path d="M8 12V6h8v6"/>',
	x: '<line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>',
	pencil:
		'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
	trash:
		'<polyline points="3 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>',
	check: '<polyline points="4 12 10 18 20 6"/>',
};

export type { IconName };
</script>

<script lang="ts">
interface IProps {
	name: IconName;
	size?: number;
	strokeWidth?: number;
}

const { name, size = 14, strokeWidth = 2 }: IProps = $props();
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width={strokeWidth}
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- static local strings -->
	{@html shapes[name]}
</svg>
