import {
	ACTION_ID as CALENDAR_ACTION_ID,
	default as CalendarSettings,
} from './CalendarSettings.svelte';
import {
	ACTION_ID as CLOCK_ACTION_ID,
	default as ClockSettings,
} from './ClockSettings.svelte';

export const SETTINGS_PAGES = {
	[CALENDAR_ACTION_ID]: CalendarSettings,
	[CLOCK_ACTION_ID]: ClockSettings,
};
