import {
	ApplicationDidLaunchType,
	ApplicationDidTerminateType,
	DeviceDidConnectType,
	DeviceDidDisconnectType,
	DidReceiveGlobalSettingsType,
	DidReceiveSettingsType,
	KeyDownEventType,
	KeyUpEventType,
	PropertyInspectorDidAppearType,
	PropertyInspectorDidDisppearType,
	SendToPluginType,
	TitleParametersDidChangeType,
	SendToPropertyInspectorType,
	WillAppearType,
	WillDisappearType,
} from '@rweich/streamdeck-events/dist/StreamdeckTypes/Sent';
import {
	SetGlobalSettingsType,
	SetSettingsType,
	SwitchToProfileType,
} from '@rweich/streamdeck-events/dist/StreamdeckTypes/Received';

import { BehaviorSubject, filter, firstValueFrom, Observable, Subject, take } from 'rxjs';

export interface StreamDeckEventPayloads {
	/** When a monitored application is launched, the plugin will receive the applicationDidLaunch event. */
	applicationDidLaunch: ApplicationDidLaunchType & { event: 'applicationDidLaunch' };

	/** When a monitored application is terminated, the plugin will receive the applicationDidTerminate event. */
	applicationDidTerminate: ApplicationDidTerminateType & {
		event: 'applicationDidTerminate';
	};

	/** When a device is plugged to the computer, the plugin will receive a deviceDidConnect event. */
	deviceDidConnect: DeviceDidConnectType & { event: 'deviceDidConnect' };

	/** When a device is unplugged from the computer, the plugin will receive a deviceDidDisconnect event. */
	deviceDidDisconnect: DeviceDidDisconnectType & { event: 'deviceDidDisconnect' };

	/** Event received after calling the getGlobalSettings API to retrieve the global persistent data. */
	didReceiveGlobalSettings: DidReceiveGlobalSettingsType & {
		event: 'didReceiveGlobalSettings';
	};

	/** Event received after calling the getSettings API to retrieve the persistent data stored for the action. */
	didReceiveSettings: DidReceiveSettingsType & { event: 'didReceiveSettings' };

	/** When the user presses a key, the plugin will receive the keyDown event. */
	keyDown: KeyDownEventType & { event: 'keyDown' };

	/** When the user releases a key, the plugin will receive the keyUp event. */
	keyUp: KeyUpEventType & { event: 'keyUp' };

	/** Event received when the Property Inspector appears in the Stream Deck user interface, for example, when selecting a new instance. */
	propertyInspectorDidAppear: PropertyInspectorDidAppearType & {
		event: 'propertyInspectorDidAppear';
	};

	/** Event received when the Property Inspector is removed from the Stream Deck user interface, for example, when selecting a different instance. */
	propertyInspectorDidDisppear: PropertyInspectorDidDisppearType & {
		event: 'propertyInspectorDidDisppear';
	};

	/** Event received by the plugin when the Property Inspector uses the sendToPlugin event. */
	sendToPlugin: SendToPluginType & { event: 'sendToPlugin' };

	/** When the computer wakes up, the plugin will receive the systemDidWakeUp event. */
	systemDidWakeUp: { event: 'systemDidWakeUp' };

	/** When the user changes the title or title parameters, the plugin will receive a titleParametersDidChange event. */
	titleParametersDidChange: TitleParametersDidChangeType & {
		event: 'titleParametersDidChange';
	};

	/** Event received by the Property Inspector when the plugin uses the sendToPropertyInspector event. */
	sendToPropertyInspector: SendToPropertyInspectorType & {
		event: 'sendToPropertyInspector';
	};

	/** When an instance of an action is displayed on Stream Deck, for example, when the hardware is first plugged in or when a folder containing that action is entered, the plugin will receive a willAppear event. */
	willAppear: WillAppearType & { event: 'willAppear' };

	/** When an instance of an action ceases to be displayed on Stream Deck, for example, when switching profiles or folders, the plugin will receive a willDisappear event. */
	willDisappear: WillDisappearType & { event: 'willDisappear' };

	/** When a websocket connection is sucessfully made */
	websocketOpen: { event: 'websocketOpen'; uuid: string };
}

export interface StreamDeckDevice {
	/** A value to identify the device. */
	id: string;

	/**	The name of the device set by the user. */
	name: string;

	/** The number of columns and rows of keys that the device owns. */
	size: {
		columns: number;
		rows: number;
	};

	/**
	 * Type of device. Possible values are kESDSDKDeviceType_StreamDeck (0), kESDSDKDeviceType_StreamDeckMini (1), kESDSDKDeviceType_StreamDeckXL (2), kESDSDKDeviceType_StreamDeckMobile (3), kESDSDKDeviceType_CorsairGKeys (4), kESDSDKDeviceType_StreamDeckPedal (5), kESDSDKDeviceType_CorsairVoyager (6), and kESDSDKDeviceType_StreamDeckPlus (7).
	 */
	type: number;
}

export interface StreamDeckAppInfo {
	application: {
		font: string;

		/** In which language the Stream Deck application is running */
		language: string;

		/** On which platform the Stream Deck application is running */
		platform: 'mac' | 'windows';

		/** 	The operating system version. */
		platformVersion: string;

		/** The Stream Deck application version. */
		version: '5.0.0.14247';
	};
	plugin: {
		uuid: string;
		version: string;
	};
	devicePixelRatio: number;
	colors: {
		buttonPressedBackgroundColor: string;
		buttonPressedBorderColor: string;
		buttonPressedTextColor: string;
		disabledColor: string;
		highlightColor: string;
		mouseDownColor: string;
	};
	devices: StreamDeckDevice[];
}

export interface StreamDeckActionInfo {
	/** The action's unique identifier. If your plugin supports multiple actions, you should use this value to see which action was triggered. */
	action: string;

	/** An value to identify the instance's action. You will need to pass this opaque value to several APIs like the setTitle API. */
	context: string;

	/** An value to identify the device. */
	device: string;

	payload: {
		/** This JSON object contains data that you can set and are stored persistently */
		settings: Record<string, unknown>;

		/** The coordinates of the action triggered. */
		coordinates: {
			column: number;
			row: number;
		};
	};
}

export type StreamDeckEventID = keyof StreamDeckEventPayloads;
export type StreamDeckEvent = StreamDeckEventPayloads[StreamDeckEventID];

export const streamdeck = {
	isOnStreamDeck: document.location.protocol === 'file:',
	isPropertyInspector: false,
	uuid: '', // plugin uuid
	port: 0, // websocket port
	appInfo: undefined as StreamDeckAppInfo | undefined,
	actionInfo: undefined as StreamDeckActionInfo | undefined,
	registerEvent: 'registerPlugin' as 'registerPropertyInspector' | 'registerPlugin',
	event$: new Subject<StreamDeckEvent>(),
	init$: new BehaviorSubject(false),

	/** Returns an observable that emits events of the given eventID and context */
	on<T extends StreamDeckEventID>(eventID: T, context?: string) {
		return streamdeck.event$.pipe(
			filter((e: any) => e.event === eventID && (!context || e.context === context)),
		) as Observable<StreamDeckEventPayloads[T]>;
	},

	/** Returns the a promise that resolves the latest event of the given event (in the given context) */
	once<T extends StreamDeckEventID>(eventID: T, context?: string) {
		return firstValueFrom(streamdeck.on(eventID, context).pipe(take(1)));
	},
};

let ws: WebSocket;
let eventQueue: { event: string }[] = [];

/** Sends an event via websocket */
function send(event: { event: string; [key: string]: any }, addToQueue = true) {
	if (!ws || ws.readyState !== ws.OPEN) {
		if (addToQueue) eventQueue.push(event);
		initWebsocket();
		return;
	}
	// console.log(`Sending message ${event.event}`, event);
	ws.send(JSON.stringify(event));
}

/** Returns global data from the plugin (or property inspector) */
export async function getGlobalSettings(context: string) {
	const data = streamdeck.once('didReceiveGlobalSettings');
	send({ event: 'getGlobalSettings', context });
	return data;
}

/** Saves global data from the plugin (or property inspector) */
export function setGlobalSettings(data: Omit<SetGlobalSettingsType, 'event'>) {
	send({ event: 'setGlobalSettings', ...data });
}

/** Returns action's instance data from the plugin (or property inspector) */
export async function getSettings(context: string) {
	const data = streamdeck.once('didReceiveSettings');
	send({ event: 'getSettings', context });
	return data;
}

/** Saves action's instance data from the plugin (or property inspector) */
export function setSettings(data: Omit<SetSettingsType, 'event'>) {
	send({ event: 'setSettings', ...data });
}

/** Opens the given URL in the default browser */
export function openUrl(url: string) {
	send({ event: 'openUrl', payload: { url } });
}

/** Plugin can use this to send a payload to the Property Inspector */
export function sendToPropertyInspector(data: {
	context: string;
	action: string;
	payload: Record<string, unknown>;
}) {
	send({ event: 'sendToPropertyInspector', ...data });
}

/** Property Inspector can use this to send a payload to the Plugin */
export function sendToPlugin(data: {
	context: string;
	action: string;
	payload: Record<string, unknown>;
}) {
	send({ event: 'sendToPlugin', ...data });
}

/** Updates the image of the button for the given context. The image must be base64 encoded png, jpeg, svg */
export function setImage(context: string, image: string) {
	send({ event: 'setImage', context, payload: { image, target: 0 } });
}

/** Updates the state of an action that supports multiple states (like a multiaction button) */
export function setState(context: string, state: number) {
	send({ event: 'setState', context, payload: { state } });
}

/** Updates the title of the action */
export function setTitle(context: string, title: string) {
	send({ event: 'setTitle', context, payload: { title, target: 0 } });
}

/** Switches the StreamDeck to the given profile */
export function switchToProfile(data: Omit<SwitchToProfileType, 'event'>) {
	send({ event: 'switchToProfile', ...data });
}

function initWebsocket() {
	console.log('initializing websocket', ws);
	if (ws && (ws.readyState === ws.OPEN || ws.readyState === ws.CONNECTING)) {
		return;
	}
	ws = new WebSocket(`ws://127.0.0.1:${streamdeck.port}`);
	ws.addEventListener('open', () => {
		console.log('Websocket Opened', eventQueue, streamdeck);
		if (!streamdeck.init$.value) streamdeck.init$.next(true);
		console.log('Registering Plugin', {
			event: streamdeck.registerEvent,
			uuid: streamdeck.uuid,
		});
		ws.send(JSON.stringify({ event: streamdeck.registerEvent, uuid: streamdeck.uuid }));
		streamdeck.event$.next({ event: 'websocketOpen', uuid: streamdeck.uuid });
		eventQueue.map((event) => ws.send(JSON.stringify(event)));
		eventQueue = [];
	});
	ws.addEventListener('close', () => {
		console.log('Websocket Closed, reconnecting...');
		initWebsocket();
	});
	ws.addEventListener('error', (error) => {
		console.error('Websocket Error', error);
	});
	ws.addEventListener('message', (message) => {
		const event = JSON.parse(message.data.toString());
		console.log(`Received Message ${event.event}`, event);
		streamdeck.event$.next(event);
	});
}

/** Initializes the stream deck and registers as a plugin */
export function initStreamDeck(
	inPort: number,
	inPluginUUID: string,
	inRegisterEvent: 'registerPropertyInspector' | 'registerPlugin',
	inInfo: string,
	inActionInfo?: string,
) {
	if (ws) ws.close();
	streamdeck.isPropertyInspector = inRegisterEvent === 'registerPropertyInspector';
	streamdeck.uuid = inPluginUUID;
	streamdeck.port = inPort;
	streamdeck.registerEvent = inRegisterEvent;
	streamdeck.appInfo = JSON.parse(inInfo || '{}');
	streamdeck.actionInfo = inActionInfo ? JSON.parse(inActionInfo) : undefined;
	initWebsocket();
}
