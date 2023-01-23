import { Streamdeck } from '@rweich/streamdeck-ts';
import App from './App.svelte';

let isPropertyInspector = false;
const isOnStreamDeck = document.location.protocol === 'file:';
const emptyLogger = {
	debug: () => {},
	error: () => {},
	info: () => {},
	trace: () => {},
	warn: () => {},
};
const plugin = new Streamdeck().plugin();
const propertyInspector = new Streamdeck().propertyinspector();
const initApp = () =>
	new App({
		target: document.body,
		props: {
			isOnStreamDeck,
			isPropertyInspector,
			plugin,
			propertyInspector,
		},
	});

if (!isOnStreamDeck) initApp();

(window as any).connectElgatoStreamDeckSocket = (
	inPort: string,
	inPluginUUID: string,
	inRegisterEvent: string,
	inInfo: string,
	inActionInfo?: string | undefined,
) => {
	isPropertyInspector = inRegisterEvent === 'registerPropertyInspector';
	initApp();
	if (isPropertyInspector) {
		propertyInspector.createStreamdeckConnector()(
			inPort,
			inPluginUUID,
			inRegisterEvent,
			inInfo,
			inActionInfo,
		);
	} else {
		plugin.createStreamdeckConnector()(
			inPort,
			inPluginUUID,
			inRegisterEvent,
			inInfo,
			inActionInfo,
		);
	}
};
