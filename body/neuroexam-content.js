/* Neuro exam: practical layer and review. Questions follow Ms. McKeon's cranial nerve table and her myotome and dermatome key. */
BioLab.addPractical({
neuroexam:{
  hook:'A player takes a knee to the helmet and says she feels fine. You have a kit, two hands and a couple of minutes. How do you check each nerve, and what would show you one is not working?',
  answer:'Run each test and compare the athlete’s two sides. A left eye that stops at the middle when tracking points to nerve VI. A dull left shoulder with weak abduction points to the C5 root. You never need a machine to find these, just a careful, side-by-side exam.',
  uses:[
    'Sideline care: Athletic Trainers run a cranial nerve screen after a head injury, often with only a penlight, a pen and their hands.',
    'Neck injuries: weak shoulder abduction and a dull shoulder on one side can mean a nerve root problem, sometimes called a stinger, and it needs a clinician’s evaluation.',
    'Emergency rooms: a pupil that stays wide after a head injury is a warning that the pressure inside the skull may be rising.'
  ],
  takeaway:'Test both sides every time. The athlete’s other side is the best normal you have, and one nerve’s job tells you where to look when a side looks different.',
  tour:[
    'The kit is simple: gum, a penlight, a pen, water and your hands. You start at the top with nerve I. Each nostril smells mint, one at a time, because the two sides can differ.',
    'Light goes across the eyes. Both pupils narrow, like a camera shutter. Normal looks like this: pupils equal and reactive to light, or <b>PEARL</b>. Nerve III narrows them.',
    'Now the left nerve VI is not working. The pen goes left and the left eye stops at the middle. The right side shows you what normal looks like. That’s why you <b>compare sides</b>.',
    'Below the head, spinal nerve roots take over. Each root has muscles it runs, its <b>myotome</b>, and skin it feels, its <b>dermatome</b>. C5 runs shoulder abduction and feels the outside of the shoulder.',
    'If one root is hurt, its muscles test weak on that side. Here the left arm gives way against your push while the right arm holds.',
    'Now touch the skin with the athlete’s eyes closed. The left shoulder feels dull too. Weakness plus dull skin on one side points to one root, <b>C5</b> on the left.'
  ]
}});
BioLab.addReview({
neuroexam:{
  questions:[
  {id:'smell',kind:'real',lvl:'bio',q:'After a hit to the head, an athlete cannot smell strong mint through either nostril. Which cranial nerve do you think of first?',choices:['I Olfactory','V Trigeminal','VII Facial','IX Glossopharyngeal'],correct:0,
    steps:['Match the function to the nerve. Smell belongs to nerve I, the Olfactory nerve.','Nerve V carries touch from the face, not smell.','This is a finding for a clinician to follow up, not a diagnosis on its own.'],
    lab:{set:{view:'cn',ath:'shown',test:'smell',supply:'scent'},act:'run',look:'Watch what the athlete says at each nostril.'}},
  {id:'pearl',kind:'test',lvl:'bio',q:'What does PEARL mean in a pupil check?',choices:['Pupils Equal And Reactive to Light','Pupils Enlarged And Round in Light','Peripheral Eyes And Retina Look normal','Pupils Elevated And Reacting Late'],correct:0,
    steps:['PEARL is what you write when the exam is normal.','Pupils should be equal in size, and each should narrow when light crosses it.','Nerve III narrows the pupil.'],
    lab:{set:{view:'cn',ath:'healthy',test:'pupil',supply:'light'},act:'run',look:'Watch both pupils narrow as the light crosses.'}},
  {id:'derm',kind:'test',lvl:'bio',q:'What is a dermatome?',choices:['An area of skin supplied by a single spinal nerve root','A group of muscles innervated by a single spinal nerve root','A nerve that leaves the brain directly','A test of skin strength'],correct:0,
    steps:['Dermatome goes with "derm", which means skin.','A myotome is the group of muscles innervated by a single spinal nerve root.','Together they make a map of the body.']},
  {id:'c6',kind:'test',lvl:'bio',q:'On your key, which root goes with the thumb and with elbow flexion and wrist extension?',choices:['C6','C5','C7','L4'],correct:0,
    steps:['Find the thumb on the key: C6.','C6 also covers elbow flexion and wrist extension.','C7 is the middle finger, elbow extension and wrist flexion. The two sit next to each other, so they’re easy to mix up.'],
    lab:{set:{view:'myo',ath:'shown',mtest:'C6'},act:'mSen',look:'The skin area lights up. Which part of the hand is it?'}},
  {id:'hipl',kind:'test',lvl:'bio',q:'Which root goes with the medial knee and knee extension on your key?',choices:['L3','L1/L2','L4','L5'],correct:0,
    steps:['Find the medial knee: L3.','Knee extension belongs to the same root.','L1/L2 is the medial thigh and hip flexion.']},
  {id:'viii',kind:'real',lvl:'honors',q:'An athlete sways and steps during a BESS check and does not hear a finger rub by the right ear. Which nerve fits both findings?',choices:['VIII Vestibulocochlear','VI Abducens','V Trigeminal','X Vagus'],correct:0,
    steps:['Nerve VIII has two jobs: hearing and balance.','Both findings fit the same nerve, which is good evidence.','Balance also depends on the brain, so a balance problem alone does not prove a nerve VIII problem.'],
    lab:{set:{view:'cn',ath:'shown',test:'hear',supply:'hands'},act:'run',look:'Watch for the hearing and balance findings.'}},
  {id:'both',kind:'real',lvl:'honors',q:'Why does an Athletic Trainer test both sides for every nerve root?',choices:['The athlete’s uninjured side shows what is normal for that person','It takes less time than testing one side','Only the left side has nerve roots','It lets the athlete rest between tests'],correct:0,
    steps:['Strength and feeling vary from person to person, so a textbook "normal" is not enough.','The other side is that person’s own normal.','A difference between sides is what makes a finding stand out.']},
  {id:'c5',kind:'test',lvl:'honors',q:'Shoulder abduction is weak on one side and the same lateral shoulder feels dull. Which root fits, and why not just one muscle?',choices:['C5: one root supplies both the muscle group and the skin area','C5: the deltoid alone is weak','C4: it always covers the shoulder','L5: it supplies the top of the body'],correct:0,
    steps:['Your key pairs anterior and lateral shoulder skin with shoulder abduction: C5.','A hurt muscle would not make skin feel dull.','Strength and skin changing together, on one side, points to the shared nerve root.'],
    lab:{set:{view:'myo',ath:'shown',mtest:'C5'},act:'mStr',look:'Compare the two sides, then test sensation.'}},
  {id:'ii-iii',kind:'real',lvl:'ap',q:'Light in the left eye does not narrow either pupil. Light in the right eye narrows both. Where is the problem most likely?',choices:['Left optic nerve (II), the input from that eye','Left oculomotor nerve (III), the output to that eye','Right oculomotor nerve (III)','Both trochlear nerves (IV)'],correct:0,
    steps:['Light in the right eye narrows both pupils, so both outputs (nerve III) work.','Light in the left eye does nothing, so its signal never arrives. That is the input side, nerve II.','If the left nerve III were the problem, the left pupil would stay wide no matter which eye got the light.'],
    lab:{set:{view:'cn',ath:'healthy',test:'pupil',supply:'light'},act:'run',look:'This is the normal response. Set Athlete to See abnormal to compare, or use a hidden deficit.'}},
  {id:'xi',kind:'test',lvl:'ap',q:'An athlete’s left shoulder gives way on a shrug, and the head turns weakly toward the right. Which nerve fits?',choices:['Left nerve XI','Right nerve XI','Left nerve XII','Left nerve VII'],correct:0,
    steps:['Nerve XI runs the trapezius (shrug) and the sternocleidomastoid (head turn).','The left sternocleidomastoid turns the head to the right.','So one left nerve explains both the left shrug and the weak turn to the right.'],
    lab:{set:{view:'cn',ath:'shown',test:'shrug',supply:'hands'},act:'run',look:'Compare the two shoulders and the two head turns.'}}
  ]}});
