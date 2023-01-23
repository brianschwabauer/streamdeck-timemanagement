<script context="module">
	export const ACTION_ID = `com.brianschwabauer.streamdeck.clock`;
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import { listen } from '../lib';
	import { Text } from '../components';
	import { onInterval } from '../lib/timer';

	export let context: string;
	const DEFAULT_COUNT_DOWN = 60 * 30;
	const SIZE = 100;
	const PADDING = 15;
	const TIME_PADDING = 7;
	const STROKE_WIDTH = 3;
	const RADIUS = SIZE / 2 - STROKE_WIDTH / 2;
	let countDown = DEFAULT_COUNT_DOWN;
	let time: number | undefined;
	let timer: ReturnType<typeof setInterval> | undefined;
	let now = Date.now();
	onInterval(1000, () => (now = Date.now()));
	let now100 = Date.now();
	onInterval(100, () => (now100 = Date.now()));
	let tickIndex = 0;
	$: tickIndex = !now100 ? 0 : (tickIndex + 1) % 100000;
	const interaction = listen(ACTION_ID, context);

	function toggleTimer() {
		if (timer) {
			clearInterval(timer);
			timer = undefined;
		} else {
			let start = Date.now();
			const lastTime = time || countDown || 0;
			time = lastTime;
			timer = setInterval(() => {
				if (countDown > 0) {
					time = lastTime - (Date.now() - start) / 1000;
					if (time <= 0) {
						clearInterval(timer);
						timer = undefined;
						time = 0;
						setTimeout(() => {
							if (time === 0) time = undefined;
						}, 60 * 1000);
					}
				} else {
					time = lastTime + (Date.now() - start) / 1000;
				}
			}, 50);
		}
	}
	onMount(() => {
		const unsubscribe = interaction.subscribe((i) => {
			if (!i) return;
			if (i.type === 'click') {
				toggleTimer();
			} else if (i.type === 'longpress') {
				clearInterval(timer);
				timer = undefined;
				time = undefined;
			} else if (i.type === 'doubleclick') {
				countDown = countDown ? 0 : DEFAULT_COUNT_DOWN;
				clearInterval(timer);
				timer = undefined;
				time = undefined;
				toggleTimer();
			}
		});
		return unsubscribe;
	});
	onMount(() => () => clearInterval(timer));

	// Setup the circle animation
	let dashOffset = 0;
	let dashArray = `${2 * Math.PI * RADIUS}`;
	$: {
		const percent = !countDown ? 100 : time === 0 ? 0 : 1 - (time || 0) / countDown;
		const fullCircle = 2 * Math.PI * RADIUS;
		dashOffset = fullCircle * -0.75;
		dashArray = `${fullCircle * percent} ${fullCircle * (1 - percent)}`;
	}
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	width="100%"
	height="100%"
	viewBox="0 0 {SIZE} {SIZE}"
	fill="black"
	style="background-color: black;">
	{#if typeof time === 'number'}
		<!-- The timer text when the timer is running -->
		<Text x={PADDING} y={PADDING} width={SIZE - PADDING * 2} height={SIZE - PADDING * 2}>
			{#if time > 60 * 60}
				{Math.floor(time / 60 / 60)}:{(Math.floor(time / 60) % 60).toLocaleString(
					undefined,
					{ minimumIntegerDigits: 2, maximumFractionDigits: 0 },
				)}
			{:else if time > 60}
				{@const date = new Date(new Date().setUTCHours(0, 0, 0, 0) + time * 1000)}
				{date
					.toLocaleTimeString(undefined, { second: 'numeric', minute: 'numeric' })
					.replace(/^0/, '')}{time >= 60 ? '' : `.${Math.floor((time % 1) * 10)}`}
			{:else}
				{Math.floor(time)}.{Math.abs(Math.floor((time % 1) * 10))}
			{/if}
		</Text>

		<!-- The progress circles when the timer is running -->
		{#if timer}
			<circle
				cx={SIZE / 2}
				cy={SIZE / 2}
				r={RADIUS}
				stroke="#5a5a5a"
				stroke-width={STROKE_WIDTH}
				fill="none" />
			<circle
				cx={SIZE / 2}
				cy={SIZE / 2}
				r={RADIUS}
				stroke={countDown > 0 ? 'white' : '#5a5a5a'}
				stroke-dasharray={dashArray}
				stroke-dashoffset={dashOffset}
				stroke-width={STROKE_WIDTH}
				fill="none" />
		{/if}

		<!-- The paused animation -->
		{#if !timer}
			<circle
				cx={SIZE / 2}
				cy={SIZE / 2}
				r={RADIUS}
				stroke={'white'}
				opacity={tickIndex % 30 >= 15 ? 1 - (tickIndex % 15) / 15 : (tickIndex % 15) / 15}
				stroke-width={STROKE_WIDTH}
				fill="none" />
		{/if}
	{:else}
		<g transform="translate(44, 10) scale(.5)">
			{#if countDown > 0}
				<path
					fill="#5a5a5a"
					d="m18 22l-.01-6L14 12l3.99-4.01L18 2H6v6l4 4l-4 3.99V22h12zM8 7.5V4h8v3.5l-4 4l-4-4z" />
			{:else}
				<path
					fill="#5a5a5a"
					d="M12 5c-4.411 0-8 3.589-8 8s3.589 8 8 8s8-3.589 8-8s-3.589-8-8-8zm1 8h-2V8h2v5zM9 2h6v2H9zm9.707 2.293l2 2l-1.414 1.414l-2-2z" />
			{/if}
		</g>
		{@const date = new Date(now)}
		<Text
			x={TIME_PADDING}
			y={TIME_PADDING}
			width={SIZE - TIME_PADDING * 2}
			height={SIZE - 10 - TIME_PADDING * 2}
			fill="white">
			{date.getHours() % 12 || 12}:{date
				.getMinutes()
				.toLocaleString(undefined, { minimumIntegerDigits: 2 })}
		</Text>
		<Text
			x={TIME_PADDING}
			y={67}
			width={SIZE - TIME_PADDING * 2}
			height={20}
			fill="#5a5a5a">
			{date.getHours() >= 12 ? 'PM' : 'AM'}
		</Text>
	{/if}
	{#if time === 0 && countDown > 0}
		<circle
			cx={SIZE / 2}
			cy={SIZE / 2}
			r={RADIUS}
			stroke={tickIndex % 2 > 0 ? 'red' : 'none'}
			stroke-width={STROKE_WIDTH}
			fill="none" />
	{/if}
</svg>
