BioLab.addPractical({
injury:{
  hook:'A sprained ankle stops hurting after 3 weeks and an athlete wants to go back to full practice. The ligament feels fine. How strong is it?',
  answer:'Well short of normal. In this model a grade II ligament sprain is at about 30% of its uninjured strength at 3 weeks under controlled load. Its collagen is still disorganized, and full practice from week 1 keeps tearing it. Even after a year of good rehab, it reaches only about two-thirds of normal.',
  uses:[
    'Athletic trainers build return-to-play around what tissue can take in each phase, because pain fades well before strength returns.',
    'Runners who add miles too fast can get stress fractures: a load that’s safe once fails bone after thousands of repeats without recovery.',
    'Rehab after a sprain starts with gentle, controlled motion rather than strict rest, because collagen lines up along the load it feels.'
  ],
  takeaway:'Tissue fails from force, and heals under load: not too little, not too much. Pain going away doesn’t mean the tissue has healed, and the repair phase is when people usually reinjure.'
}
});
BioLab.addReview({
injury:{questions:[
  {id:'forces',kind:'test',lvl:'bio',
    q:'A helmet hits the front of a player’s thigh and crushes the muscle against the femur. Which force is this, and what’s the injury?',
    choices:['Tension, strain','Compression, contusion','Shear, sprain','Tension, contusion'],correct:1,
    steps:['Crushing is a squeezing force, so it’s compression.','Blood vessels break in the muscle, but the skin stays intact.','That’s a contusion, or bruise.'],
    lab:{set:{view:'forces',tissue:'muscle',force:'compression',load:90,reps:'1',rest:false},look:'The load is past the limit in compression for muscle. Read the result card.'}},
  {id:'sprainstrain',kind:'test',lvl:'bio',
    q:'What is the difference between a sprain and a strain?',
    choices:['A sprain is a ligament injury and a strain is a muscle or tendon injury','A sprain is always worse','A strain is a ligament injury and a sprain is a muscle or tendon injury','There is no difference'],correct:0,
    steps:['Sprain goes with ligament, which connects bone to bone.','Strain goes with muscle or tendon.','Both use grades I to III, based on how much of the tissue is torn.'],
    lab:{set:{view:'grades',kind:'sprain',grade:2},look:'Switch between Sprain and Strain under Injury and compare the tissue drawn.'}},
  {id:'grade2',kind:'test',lvl:'bio',
    q:'An athlete has a partial ligament tear, some joint laxity and an antalgic gait, and ROM and strength are down. What grade of sprain does this match?',
    choices:['Grade I','Grade II','Grade III','None, since sprains have no grades'],correct:1,
    steps:['Grade I is stretching, with WB OK and ROM and strength WNL.','Grade II is a partial tear, with joint laxity, an antalgic gait, and less ROM and strength.','Grade III is a complete tear, NWB, with significant swelling.'],
    lab:{set:{view:'grades',kind:'sprain',grade:2},look:'Compare the three grades on the right of the stage.'}},
  {id:'phases',kind:'test',lvl:'bio',
    q:'Which order and timing of healing phases is correct?',
    choices:['Remodeling (3 to 4 days), inflammatory (6 weeks), repair (3 years)','Inflammatory (3 to 4 days), repair and regeneration (3 days to 6 weeks), remodeling and maturation (4 weeks to 3 years)','Repair (1 day), inflammatory (6 weeks), remodeling (1 year)','Inflammatory (6 weeks), remodeling (3 months), repair (3 years)'],correct:1,
    steps:['Inflammation comes first, for 3 to 4 days. The goal is to decrease pain and swelling.','Repair and regeneration runs from 3 days to 6 weeks. Collagen arrives disorganized.','Remodeling and maturation runs from 4 weeks to as long as 3 years.'],
    lab:{set:{view:'healing',tissue:'ligament',grade:2,rehab:'ctrl',day:45},look:'The three bars above the graph show the phases, and they overlap on purpose.'}},
  {id:'reinjury',kind:'real',lvl:'bio',
    q:'A soccer player’s sprained ankle feels fine at week 3 and she wants to play this weekend. What’s the best thing to tell her?',
    choices:['If it doesn’t hurt, it’s healed','Pain fades before strength returns. The repair phase is when people usually reinjure, so progress the load with your athletic trainer','Rest completely for 3 more years','Run as hard as possible to toughen it up'],correct:1,
    steps:['At 3 weeks the tissue is in repair and regeneration, and the new collagen is still disorganized.','The tissue needs tension, but controlled tension.','An athletic trainer decides when she’s ready to return. She shouldn’t judge it by pain alone.'],
    lab:{set:{view:'healing',tissue:'ligament',grade:2,rehab:'early',day:50},look:'Follow the too much too early line, and look for the X marks where the tissue tore again.'}},
  {id:'stress',kind:'real',lvl:'bio',
    q:'A cross-country runner’s shin hurts after she suddenly doubled her miles. No single run caused it. What best explains this?',
    choices:['An acute fracture from one load','A chronic injury: a load that’s safe once, repeated without enough recovery, lowered bone’s limit','Bone can’t adapt at all','A sprain of the shin'],correct:1,
    steps:['One step is far below what bone can handle.','Each repeat leaves a little damage, and it adds up faster than the bone repairs when miles climb quickly.','That’s how a stress fracture forms. An athletic trainer or doctor should evaluate it.'],
    lab:{set:{view:'forces',tissue:'bone',force:'tension',load:60,reps:'100000',rest:false},look:'Compare with Once: the same load doesn’t fail the bone on one repeat. Try Recovery between sessions at Closer look.'}},
  {id:'order',kind:'test',lvl:'bio',
    q:'Put these rehab components in order: muscular strength, regain ROM, functional progressions, minimize swelling. What comes first and what comes last?',
    choices:['Strength first, swelling last','Minimize swelling first, functional progressions last','Functional progressions first, ROM last','Regain ROM first, strength last'],correct:1,
    steps:['Full order: minimize swelling, control pain, regain ROM, neuromuscular control, balance and posture, muscular strength, cardiorespiratory endurance, functional progressions.','Swelling and pain block everything after them.','Sport and ADLs come last, since they need all of the earlier steps.'],
    lab:{set:{view:'plan'},look:'Build the whole plan and press Check my order.'}},
  {id:'weakest',kind:'test',lvl:'honors',
    q:'In which force is bone weakest?',
    choices:['Tension','Compression','Shear','All the same'],correct:2,
    steps:['Bone is strongest in compression, about 1.5 times its tensile strength.','It’s weakest in shear, about half its tensile strength.','Bone is built to carry weight along its length, so a sideways sliding load is its worst case.'],
    lab:{set:{view:'forces',tissue:'bone',force:'shear',load:60,reps:'1',rest:false},look:'At the same 60% load, switch between the three forces and watch which ones fail.'}},
  {id:'blood',kind:'real',lvl:'honors',
    q:'Why does a ligament take longer to heal than a muscle with the same grade of injury?',
    choices:['Ligaments have limited blood supply, so healing materials arrive more slowly','Ligaments have more blood supply','Muscles have no collagen','Ligaments have no cells'],correct:0,
    steps:['Healing needs cells and nutrients delivered by blood.','Muscle has a rich blood supply. Ligament’s is limited.','Compare the strength at 6 weeks for each tissue.'],
    lab:{set:{view:'healing',tissue:'ligament',grade:2,rehab:'ctrl',day:54},look:'Read tissue strength at 6 weeks, then switch Tissue to Muscle.'}}
]}
});
