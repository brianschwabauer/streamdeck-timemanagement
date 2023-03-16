import App from './App.svelte';
import { initStreamDeck } from './lib';

const isOnStreamDeck = document.location.protocol === 'file:';
let app: InstanceType<typeof App>;
const initApp = (
) => {
	if (app) app.$destroy();
	app = new App({
		target: document.body,
		props: {
			isOnStreamDeck,
		},
	});
};
if (!isOnStreamDeck) initApp();

(window as any).connectElgatoStreamDeckSocket = (
	inPort: number,
	inPluginUUID: string,
	inRegisterEvent: 'registerPropertyInspector' | 'registerPlugin',
	inInfo: string,
	inActionInfo?: string | undefined,
) => {
	console.log(
		'connectElgatoStreamDeckSocket',
		inPort,
		inPluginUUID,
		inRegisterEvent,
		inInfo,
		inActionInfo,
	);
	initStreamDeck(inPort, inPluginUUID, inRegisterEvent, inInfo, inActionInfo);
	initApp();
};
