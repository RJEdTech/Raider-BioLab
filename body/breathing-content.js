BioLab.addPractical({
breathing:{
  hook:'Visitors to Denver get winded on the stairs, and a hiker on a 14er gets winded just walking. The air there is still about 21% oxygen, so what changed? How much less oxygen reaches your blood at each height?',
  answer:'The percent of oxygen stays the same, but the air is thinner, so its pressure is lower. Alveolar O₂ falls from about 100 mmHg at sea level to about 77 in Denver and about 48 on a 14er. Hemoglobin stays about 94% full in Denver, then falls to about 83% on a 14er.',
  uses:[
    'Colorado altitude: a sea-level visitor in Denver has about 20% less O₂ in the alveoli. Their breathing speeds up to help make up for it, and over days the body makes more red blood cells.',
    'Swimming: never overbreathe before an underwater swim. It lowers CO₂, which delays your urge to breathe, and you can black out before you feel the need to surface.',
    'Doctors’ offices: a finger clip (pulse oximeter) reads how full your hemoglobin is. Healthy readings are about 95 to 98% near sea level and often a little lower in Denver.'
  ],
  takeaway:'Air moves because muscles change chest volume and pressure. Gases then move from high to low partial pressure at the lungs and again at the cells. Your urge to breathe comes mostly from CO₂, not from low oxygen.',
  tour:[
    'Breathing in starts with your muscles, not your lungs. The diaphragm flattens and the ribs lift, so your chest gets bigger. Pressure inside drops below the outside air, and air flows in.',
    'Start running. Your muscles make more CO₂, your brain stem senses it, and your breathing speeds up. You don’t have to think about it.',
    'The air sac has lots of O₂, and the blood arriving has little, so O₂ crosses into the blood. CO₂ goes the other way. Each gas moves from high to low.',
    'Hundreds of millions of tiny air sacs together have about the floor space of a classroom. One big sac with the same air would have about the area of a small tray.',
    'Hemoglobin holds 4 oxygen molecules. Each red blood cell has about 250 million hemoglobin, so about 1 billion oxygen molecules. Carbon dioxide rides back mostly as bicarbonate.',
    'At your cells, the blood has more oxygen than the cell, so oxygen moves in. Carbon dioxide moves out into the blood. Blood goes home with hemoglobin still about 75% full.',
    'In Denver, the air is thinner, so there is less oxygen pressure in the air sacs. Hemoglobin still stays about 94% full. On Everest it falls far lower.'
  ]
}
});
BioLab.addReview({
breathing:{
  questions:[
  {id:'mech',kind:'test',lvl:'bio',
    q:'Put these in order for breathing in: (1) air flows in, (2) diaphragm contracts and flattens, (3) pressure in the chest goes down, (4) chest volume goes up.',
    choices:['2, 4, 3, 1','1, 4, 3, 2','2, 3, 4, 1','4, 2, 1, 3'],correct:0,
    steps:['Muscles start it: the diaphragm contracts and flattens, and the rib muscles lift the ribs.','The chest gets bigger, so the same air has more room and its pressure falls.','Pressure inside is now lower than outside, so air flows in.'],
    lab:{set:{view:'vent'},look:'Watch the numbered list and the pressure bar through one full breath.'}},
  {id:'co2',kind:'test',lvl:'bio',
    q:'What does the brain stem mainly sense to set your breathing rate?',
    choices:['Oxygen in the lungs','Carbon dioxide in the blood','Temperature of the blood','How full the lungs are'],correct:1,
    steps:['The brain stem monitors blood CO₂.','When CO₂ rises, as in exercise or a breath hold, the brain stem speeds up breathing.','Low oxygen also drives breathing, but mainly when it gets quite low, as at high altitude.'],
    lab:{set:{view:'vent'},act:'hold',look:'Watch <b>Blood CO₂</b> climb until your brain stem ends the hold.'}},
  {id:'rate',kind:'test',lvl:'bio',
    q:'At 15 breaths per minute, about how many breaths do you take in a day?',
    num:{ans:21600,tol:500,unit:'breaths'},
    steps:['A day has 24 × 60 = 1,440 minutes.','15 × 1,440 = 21,600 breaths.','That’s where the “about 22,000 a day” figure comes from.'],
    lab:{set:{view:'vent'},look:'Read <b>Breaths per day at this rate</b>.'}},
  {id:'direction',kind:'test',lvl:'bio',
    q:'At the lungs, which way do O₂ and CO₂ move?',
    choices:['Both move into the blood','Both move into the air','O₂ moves into the blood, and CO₂ moves into the air','O₂ moves into the air, and CO₂ moves into the blood'],correct:2,
    steps:['Alveolar O₂ is about 100 mmHg, and arriving blood is about 40. O₂ moves into the blood.','Arriving blood has CO₂ near 45 mmHg, and alveolar air has about 40. CO₂ moves into the air.','Each gas follows its own gradient, high to low.'],
    lab:{set:{view:'ext'},look:'Read the two sets of pressures, and watch which way the dots cross.'}},
  {id:'denver',kind:'real',lvl:'bio',
    q:'Why do sea-level visitors get winded more easily in Denver?',
    choices:['Denver’s air has a lower percent of oxygen','Denver’s air is at lower pressure, so less O₂ reaches the blood','Denver’s air has more carbon dioxide','Lungs shrink at altitude'],correct:1,
    steps:['Air is still about 21% oxygen at every height on Earth.','Total pressure is lower, about 630 mmHg instead of 760, so O₂’s partial pressure falls too.','A lower gradient means slightly less oxygen on hemoglobin, so the body has to work harder for the same effort.'],
    lab:{set:{view:'ext',alt:'denver'},look:'Compare <b>Hemoglobin full</b> with the sea-level value. Then try a 14er.'},wait:12},
  {id:'alveoli',kind:'real',lvl:'honors',
    q:'A person with emphysema has lost much of their alveolar surface. They feel fine sitting, but get winded climbing stairs. Why?',
    choices:['Exercise makes alveoli shrink further','During exercise blood moves through faster, leaving less time to load through the smaller surface','They breathe out too much oxygen','Hemoglobin stops working during exercise'],correct:1,
    steps:['At rest, blood has about 0.75 s in the capillary, and a healthy lung fills it in about 0.25 s, so there is time to spare.','With less surface, loading takes longer. Rest still has enough time.','During exercise, transit falls to about 0.3 s, so blood leaves before it is full.'],
    lab:{set:{view:'ext',area:15,act:'run'},look:'Compare <b>Hemoglobin full</b> with Rest and Run selected. Look at the O₂ along the lung capillary graph.'},wait:12},
  {id:'hb',kind:'test',lvl:'honors',
    q:'One hemoglobin carries 4 O₂. A red blood cell has about 250 million hemoglobin. About how many O₂ can one red blood cell carry?',
    choices:['About 4 million','About 250 million','About 1 billion','About 4 billion'],correct:2,
    steps:['Each hemoglobin has 4 iron atoms, and each one binds one O₂.','250,000,000 × 4 = 1,000,000,000.','So one cell carries about 1 billion O₂ molecules.'],
    lab:{set:{view:'trans'},look:'Read the line under the hemoglobin molecules.'}},
  {id:'co2t',kind:'test',lvl:'honors',
    q:'In what form does most CO₂ travel in the blood?',
    choices:['Dissolved gas in plasma','Bound to hemoglobin','Bicarbonate','Attached to oxygen'],correct:2,
    steps:['About 7% stays dissolved in plasma.','About 23% binds to hemoglobin.','About 70% becomes bicarbonate (HCO₃⁻).'],
    lab:{set:{view:'trans'},look:'Read the bar across the lower part of the stage.'}},
  {id:'alv',kind:'test',lvl:'ap',
    q:'At sea level, total air pressure is 760 mmHg, water vapor is 47 mmHg, and air is 20.93% O₂. Alveolar CO₂ is 40 mmHg, and the respiratory ratio is 0.8. Calculate the alveolar O₂, in mmHg.',
    num:{ans:99,tol:2,unit:'mmHg'},
    steps:['Inspired O₂ = 0.2093 × (760 − 47) = 149 mmHg.','Subtract CO₂’s share: 40 ÷ 0.8 = 50 mmHg.','149 − 50 = about 99 mmHg, close to the usual 100.'],
    lab:{set:{view:'ext'},look:'Read <b>Alveolar O₂</b>.'},verify:[['pa',99,1.5]]},
  {id:'curve',kind:'real',lvl:'ap',
    q:'Alveolar O₂ falls by about 22 mmHg going from sea level to Denver, and hemoglobin drops only about 3%. The same 22 mmHg drop from 60 to 38 mmHg would lower hemoglobin by about 18%. Why?',
    choices:['Hemoglobin’s curve is flat near the top and steep in the middle','Hemoglobin doesn’t need oxygen near the top','Denver’s air has more oxygen','Blood flows faster at altitude'],correct:0,
    steps:['Four binding sites cooperate, so hemoglobin’s curve is S-shaped.','On the flat top, it stays nearly full even when O₂ falls.','On the steep middle, small drops release a lot of oxygen, right where tissues need it.'],
    lab:{set:{view:'ext',alt:'denver'},look:'Choose <b>Hemoglobin curve</b> in the graph, and find the Lungs and Tissues points.'}}
  ]}
});
