<script lang="ts">
	import { tick } from 'svelte';
	import type { Action } from 'svelte/action';

	export let x = 0;
	export let y = 0;
	export let width = 100;
	export let height = 100;
	export let align: 'top' | 'middle' | 'bottom' = 'middle';
	export let minFontSize = 10;
	export let maxFontSize = 100;
	export let computedFontSize = 0;
	let fontSize = 50;
	let textY = 0;
	let textX = 0;
	let text: SVGTextElement | undefined;

	async function fitText() {
		let low = minFontSize;
		let high = maxFontSize;
		let mid: number;
		let size = low;

		// Binary search for highest best fit
		while (low <= high) {
			mid = (high + low) >> 1;
			fontSize = mid;
			await tick();
			const w = text?.getBBox()?.width || 0;
			const h = text?.getBBox()?.height || 0;
			if (w > width || h > height) {
				high = mid - 1;
			} else {
				size = mid;
				low = mid + 1;
			}
		}
		fontSize = size;
		computedFontSize = fontSize;
	}

	async function positionText() {
		const realY = text?.getBBox()?.y || 0;
		const realX = text?.getBBox()?.x || 0;
		const h = text?.getBBox()?.height || 0;
		const w = text?.getBBox()?.width || 0;
		const alignY =
			align === 'top' ? 0 : align === 'bottom' ? height - h : (height - h) / 2;
		const targetY = y + alignY;
		const targetX = x + (width - w) / 2;
		if (Math.abs(realY - targetY) > 2) textY += targetY - realY;
		if (Math.abs(realX - targetX) > 2) textX += targetX - realX;
	}

	const watchChanges: Action<SVGTextElement> = (node) => {
		const update = async () => {
			await fitText();
			await tick();
			await positionText();
		};
		const mo = new MutationObserver(() => update());
		mo.observe(node, {
			attributes: false,
			childList: true,
			characterData: true,
			subtree: true,
		});
		update();
		return { destroy: () => mo.disconnect() };
	};
</script>

<text
	x={textX}
	y={textY}
	color="white"
	fill="white"
	font-size={fontSize}
	bind:this={text}
	font-family="Arial, sans-serif"
	{...$$restProps}
	use:watchChanges>
	<slot />
</text>
