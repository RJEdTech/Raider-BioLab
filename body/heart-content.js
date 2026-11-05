BioLab.addPractical({
heart:{
  hook:'Put two fingers on your neck and count your pulse for 15 seconds. Each pulse is your left ventricle squeezing. At rest, how much blood does your heart move in one minute, and where does a single red blood cell go on its way around?',
  answer:'At 72 beats per minute and 70 mL per beat, your heart moves about 5 liters a minute. That is about all of your blood, every minute. One cell goes from the vena cava through the right side of the heart to the lungs, back through the left side, out the aorta to the body, and home.',
  uses:[
    'Athletes: training mostly raises stroke volume. A trained runner can move 5 L/min at rest with only about 50 beats per minute, because each beat moves more blood.',
    'A doctor with a stethoscope: “lub” is the tricuspid and bicuspid valves closing, and “dub” is the pulmonary and aortic valves closing. Blood leaking the wrong way adds a whoosh called a murmur.',
    'Getting blood drawn: the blood in the tube is dark red even though the arm’s veins look blue through skin. Blood is never blue.'
  ],
  takeaway:'Artery means away from the heart, and vein means toward it. Neither word tells you about oxygen. Follow the path, and you will always know which kind of blood is where.',
  tour:[
    'A red blood cell, ringed in white, comes home from your body through a vena cava. It has dropped off its oxygen, so it is dark red. It is never blue.',
    'The cell enters the right atrium. When the ventricle relaxes, the tricuspid valve opens and the cell drops into the right ventricle.',
    'The right ventricle squeezes. The tricuspid valve slams shut (“lub”), the pulmonary valve opens, and the cell enters a pulmonary artery on its way to the lungs.',
    'In the tiny capillaries of the lungs, the cell drops carbon dioxide and picks up oxygen. This is where it turns bright red.',
    'The pulmonary veins carry the bright red blood back to the left atrium. They are veins because they head toward the heart.',
    'The cell drops through the bicuspid valve into the left ventricle, the strongest chamber. The squeeze opens the aortic valve and sends the cell up the aorta.',
    'The aorta branches, and the branches lead to capillaries. Oxygen leaves for your muscles and organs, the cell turns dark red, and it heads home to start again.'
  ]
}
});
BioLab.addReview({
heart:{
  questions:[
  {id:'order',kind:'test',lvl:'bio',
    q:'Blood has just entered the right atrium. Which order does it follow next?',
    choices:['Tricuspid valve, right ventricle, pulmonary valve, pulmonary arteries','Bicuspid valve, left ventricle, aortic valve, aorta','Pulmonary valve, right ventricle, tricuspid valve, pulmonary veins','Tricuspid valve, left ventricle, aortic valve, aorta'],correct:0,
    steps:['Each atrium empties into the ventricle on the same side, so the right atrium leads to the right ventricle through the tricuspid valve.','The right ventricle pushes blood through the pulmonary valve into the pulmonary arteries.','The left side does the same job after the lungs: left atrium, bicuspid valve, left ventricle, aortic valve, aorta.'],
    lab:{set:{view:'path',auto:false},act:'first',look:'Press <b>Next stop</b> and read each name as the cell moves.'}},
  {id:'trap',kind:'test',lvl:'bio',
    q:'Which vessels carry oxygen-rich blood?',
    choices:['Pulmonary arteries and aorta','Pulmonary veins and aorta','Pulmonary veins and vena cava','Pulmonary arteries and vena cava'],correct:1,
    steps:['Blood picks up oxygen in the lungs, so everything from the lungs to the body is oxygen-rich: pulmonary veins, left side of the heart, aorta.','The pulmonary arteries carry blood to the lungs, so that blood is still oxygen-poor.','Artery and vein describe direction, away from or toward the heart, not oxygen.'],
    lab:{set:{view:'circuits',vessel:'pv'},look:'Change <b>Vessel</b> and read <b>Direction</b> and <b>Blood</b> for each one.'}},
  {id:'co',kind:'test',lvl:'bio',
    q:'Your heart rate is 72 BPM and your stroke volume is 70 mL. What is your cardiac output, in L/min? Round to one decimal place.',
    num:{ans:5,tol:.1,unit:'L/min'},
    steps:['Cardiac output = heart rate × stroke volume.','72 × 70 mL = 5,040 mL per minute.','Divide by 1,000 to change mL to L: about 5.0 L/min.'],
    lab:{set:{view:'output',hr:72,sv:70},look:'Read <b>Cardiac output</b>, then change one slider and watch it respond.'},verify:[['co',5.04,.02]]},
  {id:'exercise',kind:'real',lvl:'bio',
    q:'A jogger’s heart rate is 150 BPM and stroke volume is 100 mL. About how many times more blood moves each minute than at rest (5 L/min)?',
    choices:['About 1.5 times','About 3 times','About 10 times','About 30 times'],correct:1,
    steps:['150 × 100 mL = 15,000 mL per minute, or 15 L/min.','15 ÷ 5 = 3.','Most of the extra blood goes to working muscles, and both heart rate and stroke volume helped.'],
    lab:{set:{view:'output'},act:'jog',look:'Read <b>Cardiac output</b>, and watch how fast the jug fills.'},verify:[['co',15,.05]]},
  {id:'wall',kind:'test',lvl:'bio',
    q:'Why is the wall of the left ventricle much thicker than the wall of the right ventricle?',
    choices:['It holds much more blood','It pushes blood through the whole body, while the right ventricle only pushes blood to the lungs','It has to pump oxygen-rich blood, which is heavier','It contains the septum'],correct:1,
    steps:['Both ventricles pump the same amount of blood per beat in a healthy heart.','The left ventricle pushes against about 115 mmHg. The right pushes against only about 25 mmHg.','More pressure takes more muscle. Structure matches function.'],
    lab:{set:{view:'path',auto:false},look:'Compare the muscle around the two ventricles in the cutaway.'}},
  {id:'components',kind:'test',lvl:'bio',
    q:'Match the job: which part of blood clots a cut?',
    choices:['Red blood cells','White blood cells','Platelets','Plasma'],correct:2,
    steps:['Red blood cells carry oxygen, and white blood cells fight infection.','Platelets are cell fragments that plug leaks and start a clot.','Plasma is the liquid that carries everything else. It makes up about 55% of blood.'],
    lab:{set:{view:'blood',cell:'plt'},look:'Find the small purple platelets in the field.'}},
  {id:'athlete',kind:'real',lvl:'honors',
    q:'After months of running, your resting heart rate falls from 72 to 56 BPM, and your resting cardiac output stays about 5 L/min. What has happened to your stroke volume?',
    choices:['It fell to about 54 mL','It stayed at 70 mL','It rose to about 90 mL','It rose to about 180 mL'],correct:2,
    steps:['Cardiac output = heart rate × stroke volume, so stroke volume = output ÷ rate.','5,040 mL ÷ 56 beats = 90 mL per beat.','Training builds a heart that moves more per beat, so it can beat less often at rest.'],
    lab:{set:{view:'output',hr:56,sv:90},look:'Read <b>Cardiac output</b>. It matches the resting value.'},verify:[['co',5.04,.03]]},
  {id:'leak',kind:'test',lvl:'honors',
    q:'A person’s bicuspid valve leaks. Which symptom makes the most sense?',
    choices:['Shortness of breath, because blood backs up toward the lungs','Blue blood in the aorta','More blood than usual reaches the body','A septal defect'],correct:0,
    steps:['When the left ventricle squeezes, some blood goes back into the left atrium rather than out the aorta.','The left atrium receives blood from the pulmonary veins, so pressure backs up into the lungs.','Fluid in the lungs causes shortness of breath, and the body gets less forward flow.'],
    lab:{set:{view:'breaks',brk:'mitral',leak:40},look:'Compare <b>Cardiac output</b> with <b>Blood reaching the body</b>.'}},
  {id:'ef',kind:'test',lvl:'ap',
    q:'A left ventricle holds 150 mL before it squeezes and 60 mL after. What is the ejection fraction, in percent?',
    num:{ans:60,tol:1,unit:'%'},
    steps:['Stroke volume = 150 − 60 = 90 mL.','Ejection fraction = stroke volume ÷ volume before the squeeze.','90 ÷ 150 = 0.60, or 60%, which is in the normal range of about 55 to 70%.']},
  {id:'vsd',kind:'real',lvl:'ap',
    q:'In a septal defect, why does blood cross from the left ventricle to the right, and not the other way?',
    choices:['The left ventricle squeezes first','Left ventricle pressure is far higher than right ventricle pressure during the squeeze','The septum has a one-way valve','Oxygen-rich blood is pulled toward oxygen-poor blood'],correct:1,
    steps:['Fluids flow from high pressure to low pressure.','During systole, the left ventricle reaches about 115 mmHg and the right only about 25 mmHg.','So oxygen-rich blood crosses to the right and takes an extra trip through the lungs. Lung flow rises while body flow falls.'],
    lab:{set:{view:'breaks',brk:'vsd',leak:40},look:'Compare <b>Blood through the lungs</b> with <b>Blood reaching the body</b>.'}}
  ]}
});
