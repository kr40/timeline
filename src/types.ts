export type IconType = 'camera' | 'heart' | 'baby' | 'star' | 'smile' | 'gift' | 'moon' | 'music' | 'footprints';

export type Milestone = {
	id: number;
	title: string;
	date: string;
	description: string;
	image: string | null;
	icon: IconType;
};

export type NewEvent = Omit<Milestone, 'id'>;
