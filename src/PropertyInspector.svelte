<script lang="ts">
	import { SETTINGS_PAGES } from './settings';
	import { streamdeck } from './lib';

	let settingsPage: typeof SETTINGS_PAGES[keyof typeof SETTINGS_PAGES] | undefined;
	const init = streamdeck.init$;
	$: if ($init) {
		settingsPage = Object.entries(SETTINGS_PAGES).find(
			([action]) => action === streamdeck.actionInfo?.action,
		)?.[1];
	}
</script>

{#if settingsPage}
	<svelte:component this={settingsPage} />
{/if}
