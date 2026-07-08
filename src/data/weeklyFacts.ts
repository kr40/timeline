export type WeeklyFact = {
	week:  number;
	facts: [string, string, string];
};

export const weeklyFacts: WeeklyFact[] = [
	{ week: 4,  facts: ['The embryo is smaller than a grain of rice', 'The neural tube — future brain and spine — is forming', 'Implantation is complete and pregnancy hormones are rising'] },
	{ week: 5,  facts: ['Baby\'s heart is forming and will soon start beating', 'Tiny arm and leg buds are just beginning to appear', 'The placenta is developing to nourish your baby'] },
	{ week: 6,  facts: ['Baby\'s heart is beating about 100–160 times per minute', 'The face is starting to form, including the jaw and cheeks', 'Tiny kidneys are beginning to develop'] },
	{ week: 7,  facts: ['Baby has doubled in size since last week', 'The brain is growing at an astonishing rate', 'Hands and feet are emerging from the arm and leg buds'] },
	{ week: 8,  facts: ['All essential organs have begun forming', 'Baby is constantly moving, though you can\'t feel it yet', 'Fingers and toes are webbed but developing rapidly'] },
	{ week: 9,  facts: ['Baby can now flex their arms at the elbows', 'Tiny earlobes are forming', 'The embryo is now officially called a fetus'] },
	{ week: 10, facts: ['Baby\'s vital organs are mostly formed', 'Fingernails are beginning to grow', 'Baby can now make small movements in the womb'] },
	{ week: 11, facts: ['Baby can open and close their fists', 'The skeleton is starting to harden into bone', 'Hiccups may begin as baby\'s diaphragm develops'] },
	{ week: 12, facts: ['Risk of miscarriage drops significantly this week', 'Baby\'s reflexes are developing — touching the lips causes a sucking reflex', 'The digestive system is practicing contractions'] },
	{ week: 13, facts: ['Baby\'s fingerprints are forming — completely unique to them', 'Vocal cords are developing', 'Baby\'s intestines are moving from the cord into the abdomen'] },
	{ week: 14, facts: ['Baby can make facial expressions', 'The roof of the mouth is fully formed', 'You may start to show a baby bump this week'] },
	{ week: 15, facts: ['Baby is practicing breathing with amniotic fluid', 'Tiny legs are now longer than the arms', 'Baby can sense light through closed eyelids'] },
	{ week: 16, facts: ['You may feel baby\'s first flutters — like butterflies!', 'Baby\'s eyes can make small movements from side to side', 'The nervous system is rapidly connecting to muscles'] },
	{ week: 17, facts: ['Baby can now hear sounds from outside the womb', 'Fat is beginning to develop under the skin', 'Baby\'s skeleton is changing from cartilage to bone'] },
	{ week: 18, facts: ['Baby is yawning, hiccupping, and sucking their thumb', 'Unique fingerprints are now set for life', 'Baby can hear your heartbeat and digestive sounds'] },
	{ week: 19, facts: ['Baby\'s senses of taste, smell, and touch are developing', 'Vernix — a waxy protective coating — is forming on baby\'s skin', 'Baby can hear voices from outside the womb clearly'] },
	{ week: 20, facts: ['You\'re halfway there! 🎉', 'Baby has a regular sleep-wake cycle now', 'The uterus has risen to belly button level'] },
	{ week: 21, facts: ['Baby can swallow and taste the amniotic fluid', 'Taste buds are fully formed — baby may taste what you eat!', 'Eyebrows are visible now'] },
	{ week: 22, facts: ['Baby\'s grip is getting stronger every day', 'Baby\'s eyes are formed, though the irises lack pigment', 'The senses of smell and taste continue developing'] },
	{ week: 23, facts: ['Your baby can now hear your voice — talk and sing to them!', 'Eyebrows and eyelashes are now visible', 'Baby\'s skin is still wrinkled as fat fills in gradually'] },
	{ week: 24, facts: ['Baby\'s face is fully formed, complete with eyebrows and lashes', 'Ears are fully developed — baby recognizes familiar voices', 'Lungs are producing surfactant to prepare for breathing air'] },
	{ week: 25, facts: ['Baby is beginning to develop a sense of direction', 'Baby may respond to familiar sounds and voices', 'Hands are fully developed — baby explores their environment'] },
	{ week: 26, facts: ['Baby\'s eyes are starting to open for the first time!', 'The retinas are forming to detect light and colour', 'Brain activity is increasing rapidly this week'] },
	{ week: 27, facts: ['Baby is practicing breathing movements in the womb', 'Eyes can open and close, and detect light', 'Baby is now capable of hiccupping — you may feel it!'] },
	{ week: 28, facts: ['Baby can blink and has developed eyelashes', 'The brain is developing billions of neurons', 'Baby may react to sounds with kicks and movement'] },
	{ week: 29, facts: ['Baby\'s brain is growing at an incredible rate', 'Baby is building up brown fat to help regulate temperature', 'Muscles and lungs are continuing to mature'] },
	{ week: 30, facts: ['Baby is putting on fat to regulate temperature after birth', 'Baby recognizes your voice and may respond to music', 'The brain now controls breathing and body temperature'] },
	{ week: 31, facts: ['Baby can process information from all five senses', 'Baby is going through REM sleep cycles', 'Antibodies are being passed from you to baby'] },
	{ week: 32, facts: ['Baby is practicing breathing and sucking every day', 'Baby\'s toenails have grown to the tips of the toes', 'Baby is running out of space but still very active'] },
	{ week: 33, facts: ['Baby\'s bones are hardening everywhere except the skull', 'The skull stays flexible to fit through the birth canal', 'Baby is gaining about 250g per week now'] },
	{ week: 34, facts: ['Baby\'s central nervous system is maturing rapidly', 'Most babies are now in a head-down position', 'Baby\'s fingernails have grown to the tips of the fingers'] },
	{ week: 35, facts: ['Baby may feel less active as space runs out — kicks feel stronger', 'Baby\'s kidneys are fully developed', 'Almost all organs are fully functional except the lungs'] },
	{ week: 36, facts: ['Baby is early term — lungs are nearly ready!', 'Baby is shedding the lanugo that covered their body', 'Baby is practicing sucking and swallowing for feeding'] },
	{ week: 37, facts: ['Baby is full term — they could arrive any day!', 'Baby\'s immune system is continuing to strengthen', 'Baby is sleeping 90% of the time, storing energy for birth'] },
	{ week: 38, facts: ['Baby\'s grip is incredibly strong — they\'ll hold your finger tight', 'Baby is shedding vernix and lanugo', 'The brain and nervous system are fine-tuning connections'] },
	{ week: 39, facts: ['Baby has shed most of the vernix coating their skin', 'Baby is fully developed and adding a little more weight', 'You may notice baby dropping lower into the pelvis'] },
	{ week: 40, facts: ['Baby is fully cooked and ready to meet the world! 🎉', 'The placenta is passing antibodies to protect baby after birth', 'Baby knows your voice — they\'ll recognize it at birth'] },
];

export function getFactsForWeek(week: number): WeeklyFact {
	const clamped = Math.max(4, Math.min(40, week));
	return weeklyFacts.find(f => f.week === clamped) ?? weeklyFacts[weeklyFacts.length - 1];
}
