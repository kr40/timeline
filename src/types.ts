export type IconType = 'camera' | 'heart' | 'baby' | 'star' | 'smile' | 'gift' | 'moon' | 'music' | 'footprints';

export type Milestone = {
	id:          number;
	title:       string;
	date:        string;
	description: string;
	image:       string | null;  // legacy column — kept until DB column is dropped
	images:      string[];       // canonical multi-image field
	icon:        IconType;
};

export type NewEvent = Omit<Milestone, 'id'>;

/** Normalises legacy single-image rows and new multi-image rows into one array. */
export const getImages = (m: Pick<Milestone, 'image' | 'images'>): string[] => {
	if (m.images && m.images.length > 0) return m.images;
	if (m.image) return [m.image];
	return [];
};

export type Vote = {
	id:         string;
	voter_id:   string;
	choice:     'boy' | 'girl';
	voter_name: string | null;
	created_at: string;
};

export type Wish = {
	id:          string;
	author_name: string;
	message:     string;
	category:    'blessing' | 'advice' | null;
	created_at:  string;
};

export type BirthCapsule = {
	id:               string;
	birth_date:       string | null;
	birth_time:       string | null;
	weight_kg:        number | null;
	length_cm:        number | null;
	location:         string | null;
	headlines:        string[];
	sports_results:   string[];
	top_song:         string | null;
	top_movie:        string | null;
	famous_birthdays: string[];
	weather:          string | null;
	notes:            string | null;
	baby_name:        string | null;
	name_meaning:     string | null;
	nicknames:        string[];
	letter_to_baby:   string | null;
	visitors:         string[];
	created_at:       string;
};

export type TraitVote = {
	id: string;
	voter_id: string;
	trait: 'eyes' | 'nose' | 'hair' | 'smile';
	choice: 'aditi' | 'kartik';
	created_at: string;
};

export type Guess = {
	id: string;
	voter_id: string;
	guesser_name: string;
	guess_date: string;
	is_winner: boolean;
	created_at: string;
};

export type WishReaction = {
	id: string;
	voter_id: string;
	wish_id: string;
	emoji: '❤️' | '😂' | '🥹' | '🎉';
	created_at: string;
};

export type FunPollVote = {
	id: string;
	voter_id: string;
	poll: 'sleep' | 'diaper' | 'inherit' | 'pushover' | 'googler';
	choice: 'aditi' | 'kartik';
	created_at: string;
};

export type ShowerPost = {
	id: string;
	author_name: string;
	message: string;
	image_url: string | null;
	created_at: string;
};
