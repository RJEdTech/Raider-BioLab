/* Concussion: practical layer and review. Follows Ms. McKeon's concussion notes. */
BioLab.addPractical({
concussion:{
  hook:'A freshman takes a hit in Friday’s game, gets up and says he’s fine, but he asks the score twice. The coach wants him back in. What is happening in his brain, what do you do right now, and when can he play again?',
  answer:'His brain moved inside his skull and his brain cells stretched. Asking the same question twice is a sign, so remove him with no return today. In Colorado he needs written clearance from a health care provider before any supervised team activity, and an athletic trainer cannot give it. He climbs six stages, at least 24 hours per step, going back if symptoms return.',
  uses:[
    'Colorado high school sports: the Jake Snakenberg Youth Concussion Act removes an athlete with a suspected concussion from play and supervised team activities until a health care provider gives written clearance.',
    'Baseline testing: many programs score BESS and symptoms before the season, so an injured athlete can be compared with their own normal.',
    'School: a student with a concussion may need less screen time, more breaks or part-time days as part of a return to learn plan.'
  ],
  takeaway:'When in doubt, sit them out. A red flag means EMS, any other sign or symptom means remove from play, and the return is step by step, at least 24 hours at a time.',
  tour:[
    'Think of a passenger in a car that stops suddenly. The skull moves away from the blow in about 12 thousandths of a second. The brain floats in fluid, so it <b>lags behind</b> and presses on the skull.',
    'Like a passenger rocking back, the brain swings the other way. So two sides can be hurt: under the hit (<b>coup</b>) and across from it (<b>contrecoup</b>). Watch for the two glows.',
    'Twisting a wet towel stretches it more than pushing on it. Rotation stretches brain tissue the same way. A hit to the body can do it too, without anything touching the head.',
    'On the sideline, look for red flags first: numbness, uneven pupils, neck pain, a severe or worsening headache and others call for <b>EMS</b>. Any other sign or symptom means <b>remove from play</b>, with no return today.',
    'BESS is a balance check. Eyes closed, hands on hips, three stances for 20 seconds each. You count errors, then compare them with the athlete’s own preseason number, not a teammate’s.',
    'The way back is a staircase of six stages, from No Activity to Return to Play. Each step takes at least <b>24 hours</b>. Symptoms come back? Go back a step. Written clearance comes before the first team drills.'
  ]
}});
BioLab.addReview({
concussion:{
  questions:[
  {id:'def',kind:'test',lvl:'bio',q:'Which description matches the CDC HEADS UP definition of a concussion?',choices:['A traumatic brain injury from a bump, blow or jolt that causes chemical changes and can stretch and damage brain cells','A bruise on the skull that shows up on a CT scan','An injury that only happens if you lose consciousness','A neck muscle strain from a hit'],correct:0,
    steps:['A concussion is a traumatic brain injury.','A bump, blow or jolt moves the brain inside the skull, which causes chemical changes and stretches and damages cells.','Most concussions happen without any loss of consciousness.'],
    lab:{set:{view:'mech',hit:'front',g:95},act:'hitrun',look:'Watch the brain lag behind the skull, then rebound.'}},
  {id:'sport',kind:'test',lvl:'bio',q:'In high school sport-related concussion, which sports are the leading causes?',choices:['Football for males, soccer for females','Basketball for both','Wrestling for males, volleyball for females','Baseball for males, softball for females'],correct:0,
    steps:['Your notes list football as the leading cause for males.','They list soccer as the leading cause for females.','Concussions happen in every sport, so stay alert in all of them.']},
  {id:'delay',kind:'real',lvl:'bio',q:'A player feels fine at the end of the game after a hard hit. Should you tell the family anything?',choices:['Yes. Symptoms may take up to 24 hours, so tell them what to watch for.','No. If they feel fine, they’re fine.','Only if they lost consciousness.','Only if the hit was above 100 g.'],correct:0,
    steps:['Symptoms may take up to 24 hours to appear.','So a normal check right now is not the final word.','Make a plan for rechecking, and tell the family what to look for.'],
    lab:{set:{view:'side',scn:'d'},act:'dwatch',look:'Read why watching and rechecking is the right call here.'}},
  {id:'flag',kind:'real',lvl:'bio',q:'Which finding is a red flag that means call EMS?',choices:['Unequal pupils','A mild headache','Feeling foggy','Bothered by bright light'],correct:0,
    steps:['Red flags include unequal or non-reactive pupils, posturing, seizures, repeated vomiting and fading consciousness.','A headache, fogginess and light sensitivity are symptoms of concussion. They mean remove from play.','A red flag can mean a worse injury than a concussion, so EMS comes first.'],
    lab:{set:{view:'side',scn:'c'},act:'dems',look:'Red signs on the list are red flags.'}},
  {id:'err',kind:'test',lvl:'honors',q:'Which of these is NOT counted as a BESS error?',choices:['Keeping the eyes closed','Hands coming off the hips','Lifting the forefoot or heel','Moving the hip out past 30°'],correct:0,
    steps:['Eyes closed is how the test is meant to be done, so opening the eyes is the error.','The other errors: hands off hips, step or stumble, hip past 30°, forefoot or heel lift, out of position over 5 seconds.','You count errors for 20 seconds in each of three stances.'],
    lab:{set:{view:'bess',who:'today',stance:'single'},act:'bstart',look:'Practice counting. Press Count an error for each one you see.'}},
  {id:'rise',kind:'test',lvl:'honors',q:'An athlete’s preseason BESS total was 5. After a hit, the total is 12. By how many errors did the score rise?',num:{ans:7,tol:0,unit:'errors'},
    steps:['Subtract the athlete’s own baseline: 12 − 5.','The rise is 7 errors.','A rise of several errors is a warning sign, but BESS alone does not diagnose or clear anyone.']},
  {id:'law',kind:'real',lvl:'honors',q:'Under Colorado’s Jake Snakenberg Youth Concussion Act, what must happen when a coach suspects a concussion?',choices:['Immediate removal, with no return to play or supervised team activities until a health care provider gives written clearance','A 24-hour rest and then return','A CT scan before leaving the field','Nothing unless the athlete lost consciousness'],correct:0,
    steps:['The law starts with suspicion. You do not need a confirmed diagnosis.','The coach removes the athlete immediately.','No return to play or supervised physical team activities until a health care provider gives written clearance. It covers activities where most participants are at least 11 and under 19, not college.'],
    lab:{set:{view:'side',scn:'b'},act:'dremove',look:'Read the explanation of the call.'}},
  {id:'who',kind:'test',lvl:'honors',q:'Under Colorado’s law, who can NOT give the written clearance?',choices:['An athletic trainer','An MD or DO','A licensed nurse practitioner or physician assistant','A licensed doctor of psychology with concussion training'],correct:0,
    steps:['The law lists MDs, DOs, licensed NPs, licensed PAs and licensed doctors of psychology with concussion training.','An athletic trainer is not on that list.','After written clearance, a licensed athletic trainer who knows the athlete’s condition may manage the graduated return.']},
  {id:'ct',kind:'test',lvl:'honors',q:'Why are CT and MRI not routine for a concussion?',choices:['A concussion usually looks normal on them, so they are used when a bleed or fracture is suspected','They are never useful in head injury','They make a concussion worse','Only a coach can order them'],correct:0,
    steps:['A concussion is mostly a problem of how brain cells are working, so structure usually looks normal.','CT and MRI look for structure: bleeds and fractures.','Clinicians use them when red flags raise concern for those problems.']},
  {id:'back',kind:'real',lvl:'ap',q:'An athlete on step 3 of the return gets a headache that keeps coming back during the session. What is the right next move?',choices:['Go back a step and try again after at least 24 hours','Finish the session, then move up tomorrow','Skip ahead to practice to test it','Start over with a week of total rest in a dark room'],correct:0,
    steps:['Each step takes at least 24 hours, and symptoms decide when to move up.','If symptoms return, go back a step and try again after at least 24 hours.','Current consensus favors early light activity over total rest in a dark room.'],
    lab:{set:{view:'rtp'},act:'rup',look:'Move up fast on a new case, and watch what the symptom line does.'}},
  {id:'cte',kind:'test',lvl:'ap',q:'Which statement about CTE is true?',choices:['It is only diagnosed at autopsy and is linked with repeated head impacts','It is diagnosed with a sideline test','It is the same thing as second impact syndrome','It shows up within 24 hours of a single concussion'],correct:0,
    steps:['CTE can only be confirmed by examining the brain after death.','It is linked with repeated head impacts over years.','SIS is different: rare, sudden brain swelling after a second hit before the first has healed.']}
  ]}});
