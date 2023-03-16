<script context="module">
	export const ACTION_ID = `com.brianschwabauer.streamdeck.calendar`;
</script>

<script lang="ts">
	import {
		type Calendar,
		calendar,
		maybeUpdateCalendarEvents,
		streamdeck,
		getGlobalSettings,
		setGlobalSettings,
	} from './../lib';

	let url: string;
	let checkEvery: number;
	let includeDaysBefore: number;
	let includeDaysAfter: number;
	let globalSettings: { calendar: Calendar } | undefined;
	const streamdeckEvents = streamdeck.event$;

	// Update the calendar data when the global settings are updated
	$: if ($streamdeckEvents) {
		const e = $streamdeckEvents;
		const type = e.event;
		if (type === 'didReceiveGlobalSettings') {
			globalSettings = e.payload.settings as any;
			const calendarData = globalSettings?.calendar;
			if (!!calendarData) {
				if (!$calendar) $calendar = calendarData;
				if (calendarData.url) maybeUpdateCalendarEvents($calendar);
			}
		} else if (type === 'websocketOpen') {
			getGlobalSettings(streamdeck.uuid);
		}
	}
	if (streamdeck.uuid) getGlobalSettings(streamdeck.uuid);

	$: if (streamdeck.uuid && $calendar) {
		setGlobalSettings({ context: streamdeck.uuid, payload: { calendar: $calendar } });
	}
	$: if ($calendar) {
		url = $calendar.url;
		checkEvery = Math.max(60, $calendar.checkEvery ?? 300);
		includeDaysAfter = $calendar.includeDaysAfter ?? 7;
		includeDaysBefore = $calendar.includeDaysBefore ?? 1;
	}

	function updateSettings() {
		$calendar = {
			events: [],
			...$calendar,
			url,
			includeDaysAfter,
			includeDaysBefore,
			checkEvery: Math.max(60, checkEvery),
		};
		if (!streamdeck.uuid) return;
	}
</script>

<div class="sdpi-wrapper">
	<!-- @see https://developer.elgato.com/documentation/stream-deck/sdk/property-inspector/ -->
	<div class="sdpi-item">
		<div class="sdpi-item-label">Calendar URL</div>
		<input
			class="sdpi-item-value"
			type="url"
			bind:value={url}
			on:change={updateSettings}
			placeholder="Calendar URL" />
	</div>
	<div class="sdpi-item">
		<div class="sdpi-item-label">Update Calendar Every (secs)</div>
		<input
			class="sdpi-item-value"
			type="number"
			min="60"
			bind:value={checkEvery}
			on:change={updateSettings}
			placeholder="Number of seconds to check for updates" />
	</div>
	<div class="sdpi-item">
		<div class="sdpi-item-label">Include Days Before</div>
		<input
			class="sdpi-item-value"
			type="number"
			min="0"
			bind:value={includeDaysBefore}
			on:change={updateSettings}
			placeholder="Number of days before today to include" />
	</div>
	<div class="sdpi-item">
		<div class="sdpi-item-label">Include Days After</div>
		<input
			class="sdpi-item-value"
			type="number"
			min="0"
			bind:value={includeDaysAfter}
			on:change={updateSettings}
			placeholder="Number of days after today to include" />
	</div>
</div>

<style lang="scss">
	input:invalid {
		color: red;
	}
</style>
