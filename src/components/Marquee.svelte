<script lang="ts">
	import { onInterval } from './../lib';

	export let x = 0;
	export let width = 100;
	export let speed = 0.8;

	let group: SVGGraphicsElement | undefined;
	let translateX = 999999;

	onInterval(50, () => {
		const w = group?.getBBox()?.width || 0;
		const realX = group?.getBBox()?.x || 0;
		if (width > w) {
			translateX = 0;
			return;
		}
		if (translateX < -w - realX || translateX > 9999) translateX = w + realX;
		translateX -= speed;
	});
</script>

<g>
	<g transform={`translate(${translateX}, 0)`} bind:this={group}>
		<slot />
	</g>
	<rect x={0} y={0} width={(100 - width) / 2} height={100} fill="black" />
	<rect x={x + width} y={0} width={(100 - width) / 2} height={100} fill="black" />
</g>
