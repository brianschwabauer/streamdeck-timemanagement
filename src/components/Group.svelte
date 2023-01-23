<script lang="ts">
	import { tick } from 'svelte';
	import type { Action } from 'svelte/action';

	export let x = 0;
	export let y = 0;
	export let width = 100;
	export let height = 100;
	export let align: 'top' | 'middle' | 'bottom' = 'middle';
	export let maxScale = 2;
	let translateX = 0;
	let translateY = 0;
	let scale = 1;
	let group: SVGGraphicsElement | undefined;

	const watchChanges: Action<SVGGraphicsElement> = (node) => {
		const update = async () => {
			await tick();
			const w = group?.getBBox()?.width || 0;
			const h = group?.getBBox()?.height || 0;
			scale = Math.max(0.0001, Math.min(maxScale, width / w, height / h));
			const alignY =
				align === 'top'
					? 0
					: align === 'bottom'
					? height - h * (1 / scale)
					: (height - h * (1 / scale)) / 2;
			const targetY = y + alignY;
			const targetX = x + (width - w) / 2;
			translateX = targetX - (group?.getBBox()?.x || 0);
			translateY = targetY - (group?.getBBox()?.y || 0);
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

<g transform={`translate(${translateX}, ${translateY})`}>
	<g transform={`scale(${scale})`} bind:this={group} use:watchChanges>
		<slot />
	</g>
</g>
