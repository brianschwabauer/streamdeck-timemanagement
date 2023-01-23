import {
	ACTION_ID as CALENDAR_ACTION_ID,
	default as CalendarAction,
} from './CalendarAction.svelte';
import {
	ACTION_ID as CLOCK_ACTION_ID,
	default as ClockAction,
} from './ClockAction.svelte';

export const ACTIONS = {
	[CALENDAR_ACTION_ID]: CalendarAction,
	[CLOCK_ACTION_ID]: ClockAction,
};
