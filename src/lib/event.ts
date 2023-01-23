import type KeyDownEventData from '@rweich/streamdeck-events/dist/Events/Received/Plugin/KeyDownEvent';
import type KeyUpEventData from '@rweich/streamdeck-events/dist/Events/Received/Plugin/KeyUpEvent';
import { derived, Readable, writable } from 'svelte/store';

export interface KeyDownEvent {
	type: 'keydown';
	action: string;
	context: string;
	detail?: InstanceType<typeof KeyDownEventData>;
}
export interface KeyUpEvent {
	type: 'keyup';
	action: string;
	context: string;
	detail?: InstanceType<typeof KeyUpEventData>;
}
export interface LongPressEvent {
	type: 'longpress';
	action: string;
	context: string;
	detail?: InstanceType<typeof KeyDownEventData>;
}
export interface ClickEvent {
	type: 'click';
	action: string;
	context: string;
	detail?: InstanceType<typeof KeyUpEventData>;
}
export interface DoubleClickEvent {
	type: 'doubleclick';
	action: string;
	context: string;
	detail?: InstanceType<typeof KeyUpEventData>;
}
export interface TripleClickEvent {
	type: 'tripleclick';
	action: string;
	context: string;
	detail?: InstanceType<typeof KeyUpEventData>;
}

export type InteractionEvent =
	| KeyDownEvent
	| KeyUpEvent
	| LongPressEvent
	| ClickEvent
	| DoubleClickEvent
	| TripleClickEvent;

/** A store the emits all the events/interactions of the plugin */
export const event = writable<InteractionEvent | undefined>(undefined);

/** Creates a store that listens to events happening to the given action and context */
export function listen(action: string, context: string): Readable<InteractionEvent> {
	return derived(event, ($event, set) => {
		if ($event?.action === action && $event?.context === context) set($event);
	});
}

/** A store that emits a url when a URL should be opened by the stream deck */
export const openURL = writable<string | undefined>(undefined);

let LONG_PRESS = 500;
let CLICK_THRESHOLD = 200;
let clickTimer: ReturnType<typeof setTimeout> | undefined;
let longpressTimer: ReturnType<typeof setTimeout> | undefined;
let clicks = 0;
let longpress = false;

/** Add the longpress, double click, triple click, and click events based on keyup/keydown */
event.subscribe((e) => {
	if (!e || !e.type) return;
	if (e.type !== 'keydown' && e.type !== 'keyup') return;
	if (e.type === 'keydown') {
		if (clicks) return;
		longpressTimer = setTimeout(() => {
			longpress = true;
			event.set({
				type: 'longpress',
				action: e.action || e.detail?.action || '',
				context: e.context || e.detail?.context || '',
				detail: e.detail,
			});
		}, LONG_PRESS);
		return;
	}
	if (longpress) {
		longpress = false;
		return;
	}
	clearInterval(clickTimer);
	clearInterval(longpressTimer);
	clicks++;
	const emitClick = () => {
		event.set({
			type: clicks === 1 ? 'click' : clicks === 2 ? 'doubleclick' : 'tripleclick',
			action: e.action || e.detail?.action || '',
			context: e.context || e.detail?.context || '',
			detail: e.detail,
		});
		clicks = 0;
	};
	if (clicks > 2) {
		emitClick();
	} else {
		clickTimer = setTimeout(() => emitClick(), CLICK_THRESHOLD);
	}
});
