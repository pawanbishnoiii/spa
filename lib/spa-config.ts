export const business={name:"Quiet Ritual Spa",city:"Jaipur, Rajasthan",address:"Gopalpura Mode",phone:"[PHONE]",telegram:"SpaYakshini1",hours:"Confirm on Telegram",registrationFee:"₹199",registrationValidity:"Confirm with the team",retentionDays:90} as const;
export const services=[
 {id:"calm",en:"Quiet Flow Massage",moodEn:"Gentle relaxation",pressureEn:"Soft–medium",durations:[{m:30,p:"Confirm on Telegram"},{m:60,p:"₹1,700"},{m:90,p:"Confirm on Telegram"}],image:"/images/real-calm.jpg"},
 {id:"deep",en:"Deep Release",moodEn:"Firmer pressure",pressureEn:"Medium–firm",durations:[{m:60,p:"₹1,700"},{m:90,p:"Confirm on Telegram"}],image:"/images/real-deep.jpg"},
 {id:"aroma",en:"Botanical Aroma Ritual",moodEn:"Aromatic oils",pressureEn:"Soft",durations:[{m:60,p:"₹1,700"},{m:90,p:"Confirm on Telegram"}],image:"/images/real-aroma.jpg"},
] as const;
export const therapists=[{id:"t1",name:"Relaxation care",en:"Gentle relaxation massage"},{id:"t2",name:"Deep-pressure care",en:"Focused pressure techniques"}] as const;
