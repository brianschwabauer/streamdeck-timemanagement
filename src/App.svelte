<script lang="ts">
	import {
		Plugin as StreamDeckPlugin,
		PropertyInspector as StreamDeckPropertyInspector,
	} from '@rweich/streamdeck-ts';
	import Plugin from './Plugin.svelte';
	import PropertyInspector from './PropertyInspector.svelte';

	export let isPropertyInspector = false;
	export let isOnStreamDeck = false;
	export let plugin: StreamDeckPlugin;
	export let propertyInspector: StreamDeckPropertyInspector;
</script>

<svelte:head>
	{#if isPropertyInspector}
		<link rel="stylesheet" href="./sdpi.css" />
		<title>Time Management Property Inspector</title>
	{:else}
		<title>Time Management Plugin</title>
	{/if}
</svelte:head>

{#if isPropertyInspector}
	<PropertyInspector pi={propertyInspector} />
{:else}
	{#if !isOnStreamDeck}
		<div class="controls">
			<h1>Time Management Plugin</h1>
		</div>
	{/if}
	<div class="sdplugin-wrapper">
		<Plugin {plugin} {isOnStreamDeck} />
	</div>
{/if}

<style lang="scss">
	:global(body) {
		margin: 0;
		padding: 0;
	}
	.sdplugin-wrapper {
		display: flex;
		margin: 0 auto;
		max-width: 1200px;
		gap: 1rem;
	}
	.controls {
		display: flex;
		margin: 0 auto;
		max-width: 1200px;
		h1 {
			font-size: 2rem;
			font-family: Arial, Helvetica, sans-serif;
		}
	}
</style>
