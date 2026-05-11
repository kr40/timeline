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
