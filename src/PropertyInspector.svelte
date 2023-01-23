<script lang="ts">
	import type { PropertyInspector } from '@rweich/streamdeck-ts';
	import { SETTINGS_PAGES } from './settings';

	export let pi: PropertyInspector;

	let settingsPage: typeof SETTINGS_PAGES[keyof typeof SETTINGS_PAGES] | undefined;
	pi.on('websocketOpen', (e) => {
		settingsPage = Object.entries(SETTINGS_PAGES).find(
			([action]) => action === pi.actionInfo?.action,
		)?.[1];
	});
</script>

{#if settingsPage}
	<svelte:component this={settingsPage} {pi} />
{/if}
