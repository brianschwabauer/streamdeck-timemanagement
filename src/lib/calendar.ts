import { parse, Component, Event } from 'ical.js';
import { writable } from 'svelte/store';

export interface CalendarEvent {
	/** The ID of the event (from the calendar provider) */
	id: string;

	/** The epoch timestamp (in ms) when the event starts */
	start: number;

	/** The epoch timestamp (in ms) when the event ends */
	end: number;

	/** The name of the event */
	name: string;

	/** The description of the event */
	description: string;

	/** The list of names of people invited to the event */
	attendees: string[];

	/** The url of the event (usually a link to a video meeting) */
	url: string;

	/** The location of the event */
	location: string;
}

export interface Calendar {
	/** The URL to the ICS file to get the calendar events */
	url: string;

	/** The list of events in the calendar */
	events: CalendarEvent[];

	/** The epoch time (in ms) when the calendar events were last fetched */
	fetched?: number;

	/** How often (in seconds) that the calendar events should be updated @default 300 */
	checkEvery?: number;

	/** The number of days before today when the events should occur to be included @default 1 */
	includeDaysBefore?: number;

	/** The number of days after today when the events should occur to be included @default 7 */
	includeDaysAfter?: number;
}

/** A store the emits all the events/interactions of the plugin */
export const calendar = writable<Calendar | undefined>(undefined);

let fetching = false;

/** Fetches the ics calendar events from the given url */
export async function maybeUpdateCalendarEvents(state: Calendar) {
	if (!state.url || fetching) return;
	const now = Date.now();
	const checkEvery = Math.max(60, state.checkEvery || 300);
	if (now - (state.fetched || 0) < checkEvery * 1000) return;
	fetching = true;
	const isOnStreamDeck = document.location.protocol === 'file:';
	const proxyURL = isOnStreamDeck ? `` : `https://proxy.brianschwabauer.workers.dev/`;
	const url = `${proxyURL}${state.url}`;
	const response = await fetch(url).catch(() => ({} as Response));
	fetching = response.ok;
	if (!response.ok) return;
	const after = now - 1000 * 60 * 60 * 24 * (state.includeDaysBefore ?? 1);
	const before = now + 1000 * 60 * 60 * 24 * (state.includeDaysAfter ?? 7);
	const text = await response.text().catch(() => '');
	const ics = parse(text);
	const comp = new Component(ics);
	const events: CalendarEvent[] = [];
	comp.getAllSubcomponents('vevent').forEach((vevent) => {
		const event = new Event(vevent);
		const name = event.summary;
		const description = event.description;
		const addEvent = (start: number, end: number) => {
			events.push({
				id: event.uid,
				start,
				end,
				name,
				description,
				attendees: event.attendees.map((a) =>
					(a.getFirstValue() || '').replace(/^mailto:/, ''),
				),
				url: event.description.match(/https?:\/\/[^\s\\]+/)?.[0] || '',
				location: event.location || '',
			});
		};

		if (event.isRecurring()) {
			const iterator = event.iterator();
			while (!iterator.complete) {
				const time = iterator.next();
				if (!time) break;
				const start = time.toJSDate().getTime();
				const end =
					start +
					event.endDate.toJSDate().getTime() -
					event.startDate.toJSDate().getTime();
				if (start > before) break;
				if (end < after) continue;
				addEvent(start, end);
			}
		} else {
			const start = event.startDate.toJSDate().getTime();
			const end = event.endDate.toJSDate().getTime();
			if (end > after && start < before) addEvent(start, end);
		}
	});
	events.sort((a, b) => a.start - b.start);
	calendar.update((current) => ({ ...(current || state), events, fetched: now }));
	fetching = false;
}
