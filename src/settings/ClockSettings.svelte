<script context="module">
	export const ACTION_ID = `com.brianschwabauer.streamdeck.clock`;
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import { getSettings, setSettings, streamdeck } from '../lib';

	let countdownTime = 60 * 30;
	const streamdeckEvents = streamdeck.event$;

	// Update the calendar data when the global settings are updated
	$: if ($streamdeckEvents) {
		const e = $streamdeckEvents;
		const type = e.event;
		if (type === 'didReceiveSettings') {
			const settings = e.payload.settings || ({} as any);
			countdownTime = settings.countdownTime || 60 * 30;
		} else if (type === 'websocketOpen') {
			if (streamdeck.uuid) getSettings(streamdeck.uuid);
		}
	}

	onMount(() => {
		if (streamdeck.uuid) getSettings(streamdeck.uuid);
	});

	function updateSettings() {
		if (streamdeck.uuid) {
			setSettings({ context: streamdeck.uuid, payload: { countdownTime } });
		}
	}
</script>

<div class="sdpi-wrapper">
	<!-- @see https://developer.elgato.com/documentation/stream-deck/sdk/property-inspector/ -->
	<div class="sdpi-item">
		<div class="sdpi-item-label">Countdown Time</div>
		<input
			class="sdpi-item-value"
			type="number"
			min="1"
			bind:value={countdownTime}
			on:input={updateSettings}
			placeholder="Countdown Time (secs)" />
	</div>
</div>

<style lang="scss">
	input:invalid {
		color: red;
	}
</style>
