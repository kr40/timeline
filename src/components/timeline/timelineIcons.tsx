import { Baby, Camera, Footprints, Gift, Heart, Moon, MusicNotes, Smiley, Star, type Icon } from '@phosphor-icons/react';
import type { IconType } from '../../types';

const ICONS: Record<IconType, { Icon: Icon; bg: string }> = {
	heart:      { Icon: Heart,      bg: 'bg-pink' },
	baby:       { Icon: Baby,       bg: 'bg-sky' },
	star:       { Icon: Star,       bg: 'bg-butter' },
	smile:      { Icon: Smiley,     bg: 'bg-peach' },
	gift:       { Icon: Gift,       bg: 'bg-mint' },
	moon:       { Icon: Moon,       bg: 'bg-lav' },
	music:      { Icon: MusicNotes, bg: 'bg-pink' },
	footprints: { Icon: Footprints, bg: 'bg-peach' },
	camera:     { Icon: Camera,     bg: 'bg-lav' },
};

export const timelineIcon = (type: IconType) => ICONS[type] ?? ICONS.camera;
