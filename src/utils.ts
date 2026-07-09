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
