import { Baby, Camera, Footprints, Gift, Heart, Moon, Music, Smile, Star } from 'lucide-react';
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

export const iconMap: Record<IconType, JSX.Element> = {
	heart: <Heart className='w-6 h-6 text-pink-500 fill-pink-100' />,
	baby: <Baby className='w-6 h-6 text-blue-500 fill-blue-100' />,
	star: <Star className='w-6 h-6 text-yellow-500 fill-yellow-100' />,
	smile: <Smile className='w-6 h-6 text-orange-500 fill-orange-100' />,
	gift: <Gift className='w-6 h-6 text-teal-500 fill-teal-100' />,
	moon: <Moon className='w-6 h-6 text-indigo-500 fill-indigo-100' />,
	music: <Music className='w-6 h-6 text-rose-500' />,
	footprints: <Footprints className='w-6 h-6 text-stone-500 fill-stone-100' />,
	camera: <Camera className='w-6 h-6 text-purple-500 fill-purple-100' />,
};

export const renderIcon = (iconType: IconType) => iconMap[iconType] || iconMap.camera;
