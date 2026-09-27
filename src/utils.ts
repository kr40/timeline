import { IconType } from './types';

export const ICON_OPTIONS: IconType[] = [
	'camera',
	'heart',
	'baby',
	'star',
	'smile',
	'gift',
	'moon',
	'music',
	'footprints',
];

const DATE_FORMATTER = new Intl.DateTimeFormat(undefined, {
	year: 'numeric',
	month: 'long',
	day: 'numeric',
});

export const formatDate = (dateString: string) => DATE_FORMATTER.format(new Date(dateString));

export function getVoterId(): string {
	const CACHE_KEY = 'timeline_fp';
	try {
		const cached = localStorage.getItem(CACHE_KEY);
		if (cached) return cached;
	} catch { /* localStorage unavailable */ }

	const raw = [
		navigator.userAgent,
		String(screen.width),
		String(screen.height),
		Intl.DateTimeFormat().resolvedOptions().timeZone,
		navigator.language,
		navigator.platform,
	].join('|');

	let hash = 5381;
	for (let i = 0; i < raw.length; i++) {
		hash = ((hash << 5) + hash) ^ raw.charCodeAt(i);
	}
	const fp = Math.abs(hash).toString(36);

	try { localStorage.setItem(CACHE_KEY, fp); } catch { /* ignore */ }
	return fp;
}

/** Parses a Postgres `date` ('YYYY-MM-DD') at local noon so it never slips a day across time zones. */
export const parseDay = (value: string): Date =>
	/^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : new Date(value);

export const formatDay = (value: string, style: 'short' | 'long' = 'short'): string =>
	parseDay(value).toLocaleDateString(
		undefined,
		style === 'long'
			? { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
			: { day: 'numeric', month: 'short', year: 'numeric' },
	);

export function relativeTime(iso: string): string {
	const diff  = Date.now() - new Date(iso).getTime();
	const mins  = Math.floor(diff / 60000);
	const hours = Math.floor(diff / 3600000);
	const days  = Math.floor(diff / 86400000);
	if (mins  < 1)  return 'just now';
	if (mins  < 60) return `${mins}m ago`;
	if (hours < 24) return `${hours}h ago`;
	if (days  < 7)  return `${days}d ago`;
	return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

/** An error whose message is written for guests and safe to show them. */
export class FriendlyError extends Error {}

/** Guest-safe message: FriendlyError text, otherwise the fallback (raw errors go to the console). */
export function errorMessage(err: unknown, fallback: string): string {
	if (err instanceof FriendlyError) return err.message;
	console.error(err);
	return fallback;
}
