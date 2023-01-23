<script context="module">
	export const ACTION_ID = `com.brianschwabauer.streamdeck.calendar`;
</script>

<script lang="ts">
	import {
		calendar,
		type CalendarEvent,
		listen,
		openURL,
		onInterval,
		timeUntil,
	} from '../lib';
	import { Group, Marquee, Text } from '../components';

	/** The Stream Deck plugin context (used for interacting with stream deck) */
	export let context: string;

	/** The number of ms after an event has completed when the 'done' state should be shown */
	export let doneInterval: number = 1000 * 60 * 6;

	const interaction = listen(ACTION_ID, context);
	const WARNING_TIME = 1000 * 60 * 5;
	const SIZE = 100;
	const PADDING = 10;
	const SUBHEADER_HEIGHT = SIZE * 0.1;
	const SUBHEADER_Y = SIZE * 0.2;
	const STROKE_WIDTH = 3;
	const RADIUS = SIZE / 2 - STROKE_WIDTH / 2;
	let now = Date.now();
	onInterval(1000, () => (now = Date.now()));
	let tickIndex = 0;
	let now100 = Date.now();
	onInterval(100, () => (now100 = Date.now()));
	$: today = new Date(now).setUTCHours(0, 0, 0, 0);
	$: tickIndex = !now100 ? 0 : (tickIndex + 1) % 100000;
	let status: 'none' | 'upcoming' | 'soon' | 'happening' | 'done' = 'none';
	let event: CalendarEvent;
	let showMeta = false;
	$: showSubHeader = !!event?.name && status !== 'none';

	// Determine the status based on the current time and the calendar events
	$: {
		const activeEvents = getActiveEvents();
		event = activeEvents[0];

		// Check if a meeting just ended but there are upcoming events within 5 minutes
		if (event && event.end < now && now - event.end < doneInterval) {
			event =
				activeEvents.find(
					(e) => e.start - now < WARNING_TIME && e.end - now > doneInterval,
				) || event;
		}
		if (!event) {
			status === 'none';
		} else if (event.start < now && event.end > now) {
			status = 'happening';
		} else if (event.end < now && now - event.end < doneInterval) {
			status = 'done';
		} else if (event.start > now && event.start - now < WARNING_TIME) {
			status = 'soon';
		} else if (event.start > now) {
			status = 'upcoming';
		} else {
			status = 'none';
		}
	}

	// Setup the circle animation
	let dashOffset = 0;
	let dashArray = `${2 * Math.PI * RADIUS}`;
	$: {
		let percent = 100;
		if (!event) {
			percent = 100;
		} else if (status === 'happening') {
			const duration = (event?.end || 0) - (event?.start || 0);
			const elapsed = now - (event?.start || 0);
			percent = elapsed / duration;
		} else if (status === 'done') {
			percent = (now - (event?.end || 0)) / doneInterval;
		} else {
			percent = 100;
		}
		const fullCircle = 2 * Math.PI * RADIUS;
		dashOffset = fullCircle * -0.75;
		dashArray = `${fullCircle * percent} ${fullCircle * (1 - percent)}`;
	}

	// Setup the interaction events
	$: if ($interaction && $interaction.type === 'longpress' && event && event.url) {
		const mapsURL = !event.location
			? ''
			: `https://www.google.com/maps/search/${event.location}`;
		$openURL = event.url || mapsURL;
	}
	$: if ($interaction && $interaction.type === 'click') {
		showMeta = !showMeta;
	}

	/** Returns the calendar events that are currently active */
	function getActiveEvents() {
		return ($calendar?.events || [])
			.filter((e) => e && e.start && e.end)
			.filter((e) => now - e.end < doneInterval && e.start < today + 1000 * 60 * 60 * 24)
			.filter((e) => e.end - e.start < 1000 * 60 * 60 * 24);
	}
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	width="100%"
	height="100%"
	viewBox="0 0 {SIZE} {SIZE}"
	text-anchor="middle"
	fill="black"
	style="background-color: black;">
	{#if status === 'none' || !event}
		{#each ['No', 'Upcoming', 'Events'] as text, i}
			<text
				x="50"
				y={33 + 20 * i}
				text-anchor="middle"
				fill="#5a5a5a"
				font-size="18"
				font-family="Arial, sans-serif">
				{text}
			</text>
		{/each}
	{:else}
		{#if showSubHeader && showMeta}
			<Marquee x={PADDING} width={SIZE - PADDING * 2}>
				<Text
					x={PADDING}
					y={SUBHEADER_Y}
					width={SIZE - PADDING * 2}
					height={SUBHEADER_HEIGHT}
					fill="#9e9e9e"
					align="bottom">
					{event.name}
				</Text>
			</Marquee>
		{/if}
		<Group
			width={SIZE - PADDING * 2}
			height={SIZE - PADDING * 2}
			x={PADDING}
			y={PADDING + 1}
			align="middle">
			{@const [time, label] = timeUntil(
				status === 'upcoming' || status === 'soon' ? event.start : event.end,
				now100,
			)}
			<text
				fill={status === 'done' || status === 'soon' ? 'red' : 'white'}
				font-family="Arial, sans-serif"
				font-size="20">
				{time}
				<tspan font-size="8">{label}</tspan>
			</text>
		</Group>
		{#if showMeta && event}
			<Text
				x={PADDING}
				y={SIZE - SUBHEADER_Y - SUBHEADER_HEIGHT - 1}
				width={SIZE - PADDING * 2}
				height={SUBHEADER_HEIGHT + 3}
				fill="#9e9e9e"
				align="bottom">
				{@const time =
					status === 'upcoming' || status === 'soon' ? event.start : event.end}
				{new Date(time).toLocaleTimeString(undefined, {
					hour: 'numeric',
					minute: 'numeric',
					hour12: true,
				})}
			</Text>
		{/if}
	{/if}

	{#if (status === 'happening' || status === 'done') && event}
		<!-- The progress circles when the event is happening -->
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
			stroke={status === 'done' ? 'red' : 'white'}
			stroke-dasharray={dashArray}
			stroke-dashoffset={dashOffset}
			stroke-width={STROKE_WIDTH}
			fill="none" />

		<!-- The warning circle flash when an event is starting soon -->
		{@const aboutToStart = Math.abs(now100 - event.start) < 5000}
		{@const aboutToEnd = Math.abs(now100 - event.end) < 5000}
		{#if aboutToStart || aboutToEnd}
			<circle
				cx={SIZE / 2}
				cy={SIZE / 2}
				r={RADIUS}
				stroke={tickIndex % 2 > 0 ? (aboutToEnd ? 'red' : 'white') : 'none'}
				stroke-width={STROKE_WIDTH}
				fill="none" />
		{/if}
	{/if}

	<!-- The warning flash when an event is starting soon -->
	{#if status === 'soon' && event.start - now100 < WARNING_TIME && event.start - now100 > WARNING_TIME - 3000}
		<rect
			width={SIZE}
			height={SIZE}
			stroke="none"
			fill={tickIndex % 2 > 0 ? 'red' : 'none'} />
	{/if}
</svg>
