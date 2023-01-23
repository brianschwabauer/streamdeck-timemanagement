import { onMount } from 'svelte';

/** Runs a callback function every interval. @returns a destroy function to clear the interval */
export const onInterval = (interval: number, callback: () => void) => {
	const timer = setInterval(callback, interval);
	onMount(() => () => clearInterval(timer));
	return () => clearInterval(timer);
};

/** Runs a callback function after timeout. @returns a destroy function to clear the timeout */
export const onTimeout = (timeout: number, callback: () => void) => {
	const timer = setTimeout(callback, timeout);
	onMount(() => () => clearTimeout(timer));
	return () => clearTimeout(timer);
};

/** Returns a time string (and optional label) representing the time between the two given numbers */
export function timeUntil(timeInMS: number, nowTime: number): [string, string] {
	const time = Math.abs(nowTime - timeInMS);
	if (time < 0) return ['NOW', ''];
	if (time < 1000 * 10) return [`${(time / 1000).toFixed(1)}`, 's'];
	if (time < 1000 * 60) return [`${Math.floor(time / 1000)}`, 's'];
	if (time <= 1000 * 60 * 10) {
		const date = new Date(new Date().setUTCHours(0, 0, 0, 0) + time);
		return [
			date
				.toLocaleTimeString(undefined, {
					minute: 'numeric',
					second: 'numeric',
				})
				.replace(/^0/, ''),
			'',
		];
	}
	if (time <= 1000 * 60 * 90) return [`${Math.floor(time / 1000 / 60)}`, 'm'];
	if (time <= 1000 * 60 * 60 * 10) return [`${+(time / 1000 / 60 / 60).toFixed(0)}`, 'h'];
	return [`${Math.floor(time / 1000 / 60 / 60)}`, 'h'];
}
