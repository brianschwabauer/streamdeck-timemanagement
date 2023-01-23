<script context="module">
	export const ACTION_ID = `com.brianschwabauer.streamdeck.clock`;
</script>

<script lang="ts">
	import type { PropertyInspector } from '@rweich/streamdeck-ts';
	import { onMount } from 'svelte';

	export let pi: PropertyInspector;

	let countdownTime = 60 * 30;

	// Update the calendar data when the global settings are updated
	pi.on('didReceiveSettings', (e) => {
		const settings = e.settings || ({} as any);
		countdownTime = settings.countdownTime || 60 * 30;
	});
	pi.on('websocketOpen', () => {
		if (pi.pluginUUID) pi.getSettings(pi.pluginUUID);
	});
	onMount(() => {
		if (pi.pluginUUID) pi.getSettings(pi.pluginUUID);
	});

	function updateSettings() {
		if (pi.pluginUUID) pi.setSettings(pi.pluginUUID, { countdownTime });
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
