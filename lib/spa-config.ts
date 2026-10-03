export const business = {
  name: "Quiet Ritual Spa", city: "[CITY]", address: "[ADDRESS]", phone: "[PHONE]",
  telegram: "SpaYakshini1", hours: "[OPENING_HOURS]",
  registrationFee: "[REGISTRATION_FEE]", registrationValidity: "[VALIDITY]", retentionDays: 90,
} as const;

export const services = [
  { id: "calm", en: "Quiet Flow Massage", hi: "क्वायट फ्लो मसाज", moodEn: "Gentle relaxation", moodHi: "हल्का विश्राम", pressureEn: "Soft–medium", pressureHi: "हल्का–मध्यम", durations: [{m:30,p:"[PRICE_30]"},{m:60,p:"[PRICE_60]"},{m:90,p:"[PRICE_90]"}], image: "/images/service-calm.webp" },
  { id: "deep", en: "Deep Release", hi: "डीप रिलीज़", moodEn: "Firmer pressure", moodHi: "गहरा दबाव", pressureEn: "Medium–firm", pressureHi: "मध्यम–गहरा", durations: [{m:60,p:"[PRICE_60]"},{m:90,p:"[PRICE_90]"}], image: "/images/service-deep.webp" },
  { id: "aroma", en: "Botanical Aroma Ritual", hi: "बॉटैनिकल अरोमा रिचुअल", moodEn: "Aromatic oils", moodHi: "सुगंधित तेल", pressureEn: "Soft", pressureHi: "हल्का", durations: [{m:60,p:"[PRICE_60]"},{m:90,p:"[PRICE_90]"}], image: "/images/service-aroma.webp" },
] as const;

export const therapists = [
  { id: "t1", name: "[THERAPIST_1]", en: "Relaxation massage · Hindi, English", hi: "रिलैक्सेशन मसाज · हिंदी, अंग्रेज़ी" },
  { id: "t2", name: "[THERAPIST_2]", en: "Deep-pressure techniques · Hindi", hi: "डीप-प्रेशर तकनीक · हिंदी" },
] as const;
