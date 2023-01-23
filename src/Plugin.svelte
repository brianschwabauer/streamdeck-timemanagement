<script lang="ts">
	import type { Action } from 'svelte/action';
	import type { Plugin } from '@rweich/streamdeck-ts';
	import { type ComponentType } from 'svelte';
	import {
		event,
		openURL,
		type Calendar,
		calendar,
		maybeUpdateCalendarEvents,
		onInterval,
	} from './lib';
	import { ACTIONS } from './actions';

	export let plugin: Plugin;
	export let isOnStreamDeck: boolean;
	let initialized = false;
	let activeActions: { action: string; context: string; component?: ComponentType }[] =
		[];

	// Sends the current SVG image to the stream deck for the given context
	const updateImage = (element: HTMLElement, context: string) => {
		if (!initialized || !element.innerHTML) return;
		const image = `data:image/svg+xml;base64,${btoa(element.innerHTML)}`;
		plugin.setImage(image, context);
	};

	// Handle plugin events
	plugin.on('websocketOpen', (e) => {
		initialized = true;
		if (plugin.pluginUUID) plugin.getGlobalSettings(plugin.pluginUUID);
	});
	plugin.on('keyDown', (e) => {
		$event = { type: 'keydown', action: e.action, context: e.context, detail: e };
	});
	plugin.on('keyUp', (e) => {
		$event = { type: 'keyup', action: e.action, context: e.context, detail: e };
	});
	plugin.on('willAppear', (e) => {
		if (activeActions.some((a) => a.context === e.context)) return;
		activeActions.push({
			action: e.action,
			context: e.context,
			component: ACTIONS[e.action as keyof typeof ACTIONS],
		});
		plugin.getSettings(e.context);
		activeActions = activeActions;
	});
	$: if ($openURL) plugin.openUrl($openURL);

	// Update the calendar data when the global settings are updated
	plugin.on('didReceiveGlobalSettings', (e) => {
		const calendarData: Calendar = (e?.settings as any)?.calendar;
		if (!calendarData) return;
		if (($calendar?.fetched || 0) >= (calendarData.fetched || 0)) return;
		$calendar = calendarData;
		if (calendarData.url) maybeUpdateCalendarEvents($calendar);
	});

	// Handle local developement when not on stream deck
	if (!isOnStreamDeck) {
		Object.entries(ACTIONS).forEach(([action, component]) => {
			activeActions.push({ action, context: action, component });
		});
		activeActions = activeActions;
		const calendarData: Partial<Calendar> = JSON.parse(
			localStorage.getItem('calendar') || '{}',
		);
		$calendar = {
			events: [],
			...calendarData,
			url: import.meta.env.PUBLIC_CALENDAR_URL,
		};
		maybeUpdateCalendarEvents($calendar);
	}

	// Update the settings when the calendar data is updated
	$: if (!isOnStreamDeck) localStorage.setItem('calendar', JSON.stringify($calendar));
	$: if (isOnStreamDeck && plugin.pluginUUID) {
		plugin.setGlobalSettings(plugin.pluginUUID, { calendar: $calendar });
	}

	// Check every 30 seconds if the calendar data should be updated
	onInterval(30000, () => {
		if ($calendar && $calendar.url) maybeUpdateCalendarEvents($calendar);
	});

	// Watches for changes in the DOM and updates the stream deck image
	const watchChanges: Action<HTMLElement, { action: string; context: string }> = (
		node,
		{ context } = { action: '', context: '' },
	) => {
		const throttleTime = 10;
		let timer: ReturnType<typeof setTimeout>;
		const mo = new MutationObserver(() => {
			clearTimeout(timer);
			timer = setTimeout(() => updateImage(node, context), throttleTime);
		});
		mo.observe(node, {
			attributes: true,
			childList: true,
			characterData: true,
			subtree: true,
		});
		updateImage(node, context);
		return { destroy: () => mo.disconnect() };
	};
</script>

{#each activeActions as { action, context, component }}
	<div
		class="screen"
		use:watchChanges={{ action, context }}
		on:pointerdown={(e) =>
			e.button !== 0 || event.set({ type: 'keydown', action, context })}
		on:pointerup={(e) => e.button !== 0 || event.set({ type: 'keyup', action, context })}>
		{#if component}
			<svelte:component this={component} {context} />
		{/if}
	</div>
{/each}

<style lang="scss">
	.screen {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 100%;
		aspect-ratio: 1 / 1;
		max-width: 400px;
		max-height: 400px;
		cursor: pointer;
		border-radius: 10%;
		overflow: hidden;
	}
</style>
