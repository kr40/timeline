export type FunPollId = 'sleep' | 'diaper' | 'inherit' | 'pushover' | 'googler';
export type FunPollChoice = 'aditi' | 'kartik';

export type FunPollDef = {
	id: FunPollId;
	question: string;
	aditiLabel: string;
	kartikLabel: string;
};

export const FUN_POLLS: FunPollDef[] = [
	{ id: 'sleep',    question: 'Whose sleep schedule will the baby ruin first? 😴', aditiLabel: 'Aditi',            kartikLabel: 'Kartik' },
	{ id: 'diaper',   question: 'Who will cry more during diaper changes? 😭',       aditiLabel: 'Aditi',            kartikLabel: 'Kartik' },
	{ id: 'inherit',  question: 'What will baby inherit? 🧬',                        aditiLabel: "Aditi's patience", kartikLabel: "Kartik's appetite" },
	{ id: 'pushover', question: 'Who will baby have wrapped around their finger? 🫠', aditiLabel: 'Aditi',           kartikLabel: 'Kartik' },
	{ id: 'googler',  question: 'Who googles "is this normal?" at 3am more? 🔍',     aditiLabel: 'Aditi',            kartikLabel: 'Kartik' },
];
