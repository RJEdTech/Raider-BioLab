BioLab.addPractical({
skin:{
  hook:'Put on a watch and you notice it for a minute. By lunch you forget it is there, even though it is pressing on your wrist the whole time. What changed: the watch, your skin, or your brain?',
  answer:'The watch did not change. Fast-adapting receptors such as hair follicle receptors fired when it went on, then went quiet. Slow-adapting Merkel cells keep firing at a low rate, but your attention drops them. This is adaptation: receptors report change far more than they report steady conditions.',
  uses:[
    'Athletic tape: a fresh wrap feels tight for the first few minutes and then fades, so check tightness by circulation and color, not only by how it feels.',
    'Fingertip reading: Braille dots sit about 2.5 mm apart, right at the fingertip’s two-point threshold. The same dots would feel like one bump on your forearm.',
    'Hot tubs and cold pools: the first step feels extreme, then heat and cold endings partly adapt. Heat above about 45 °C keeps hurting, because pain endings barely adapt, and that warning protects tissue.'
  ],
  takeaway:'Your skin tells your brain about change first. Where and how sharply you feel depends on how many receptors are packed into that skin.',
  tour:[
    'Three layers stack up like a sandwich. The <b>epidermis</b> is the thin top, the <b>dermis</b> is the thick working middle, and the <b>hypodermis</b> below is fat and is not really part of the skin. All your skin together covers about 2.2 m² and is about 15% of your body weight.',
    'The epidermis is like a conveyor belt. The <b>stratum basale</b> makes new keratinocytes, and they get pushed up, flatten and die until the <b>stratum corneum</b> flakes them off. A whole new epidermis takes 25 to 45 days.',
    'The dermis holds the working parts: <b>capillary loops</b>, <b>hair follicles</b>, <b>sebaceous</b> and <b>sudoriferous glands</b>, and most of the touch receptors.',
    'A steady touch lands on a fingertip. <b>Meissner’s corpuscle</b> fires a quick burst, then goes quiet while the touch continues. It reports change, like a doorbell that rings once.',
    'The <b>Merkel cell</b> slows down but keeps firing as long as the touch lasts. Fast adapters tell you what just changed. Slow adapters tell you what is still there.',
    'The <b>Pacinian corpuscle</b> is layered like an onion, deep in the skin. It fires at every change in pressure, so fast vibration, like a buzzing phone, keeps it firing hundreds of times a second.',
    '<b>Free nerve endings</b> sense heat, cold, pain, itch and tickle. Pain barely adapts. It works like a smoke alarm, staying on until the danger is gone.',
    'Every sensation needs four things in a row: a <b>stimulus</b>, a <b>receptor</b>, an <b>afferent pathway</b> to the central nervous system, and a <b>sensory cortex</b> to make sense of it. Break any link and you feel nothing.',
    'Move the same touch to the back of the calf. There are far fewer receptors there, so the two-point threshold jumps from about 3 mm to about 45 mm. It is like comparing a sharp photo to a blurry one.'
  ]
}
});
BioLab.addReview({
skin:{
  questions:[
  {id:'layers',kind:'test',lvl:'bio',q:'Which layer has no blood vessels of its own?',choices:['Epidermis','Dermis','Hypodermis','Reticular layer'],correct:0,
    steps:['The epidermis is avascular: it has no blood vessels.','It gets its nutrients by diffusion from the capillary loops in the dermal papillae just below.','That is why a shallow paper cut can sting, from nerve endings, without bleeding much.'],
    lab:{set:{view:'explore',part:'epidermis'},look:'Look at the cross-section. The capillary loops stop at the bottom edge of the epidermis.'}},
  {id:'strata',kind:'test',lvl:'bio',q:'Put the strata in order from deepest to the surface.',choices:['Basale, spinosum, granulosum, lucidum, corneum','Corneum, lucidum, granulosum, spinosum, basale','Basale, granulosum, spinosum, lucidum, corneum','Spinosum, basale, granulosum, corneum, lucidum'],correct:0,
    steps:['New cells are born in the stratum basale, on top of the dermis.','They move up through the spinosum and granulosum, where they flatten and die.','Thick skin adds the clear lucidum, and the dead corneum is on top.'],
    lab:{set:{view:'explore',part:'basale',site:'palm'},look:'Read the zoom panel from the bottom up, and watch the cells rise.'}},
  {id:'hypo',kind:'test',lvl:'bio',q:'A student says the skin has three layers: epidermis, dermis and hypodermis. What is the correction?',choices:['The hypodermis lies under the skin and is not part of it','The dermis is not part of the skin','There are 5 layers','Nothing, the student is right'],correct:0,
    steps:['Skin is the epidermis plus the dermis.','The hypodermis, or subcutaneous layer, is adipose tissue beneath the skin.','It insulates, stores energy and anchors skin to the muscle below.'],
    lab:{set:{view:'explore',part:'hypodermis'},look:'Find the fat lobules under the dermis.'}},
  {id:'adapt',kind:'real',lvl:'bio',q:'You stop noticing your socks a few minutes after you put them on. Which best explains that?',choices:['Fast-adapting receptors fired when the socks went on, then stopped reporting a stimulus that was not changing','The socks stopped touching your skin','Your skin grew a callus','Nerve fibers died'],correct:0,
    steps:['Touching a sock is a steady stimulus after the first moment.','Fast-adapting receptors, such as hair follicle receptors, fire only when the stimulus changes.','Your brain also filters out slow signals that do not change, which frees attention for new ones.'],
    lab:{set:{view:'test',stim:'touch',site:'calf',S:60},look:'Watch the spike rows. The first row goes quiet quickly while the stimulus bar stays on.'}},
  {id:'twopoint',kind:'real',lvl:'bio',q:'Why can a fingertip read Braille when a forearm cannot?',choices:['Fingertips have many more touch receptors with smaller receptive fields','Fingertip skin is thinner than forearm skin','Forearms have no touch receptors','Fingertips have more hair'],correct:0,
    steps:['Braille dots are about 2.5 mm apart.','The fingertip two-point threshold is about 2 to 3 mm, while the forearm’s is about 38 mm.','Tightly packed receptors put each dot on its own receptive field. Sparse receptors merge the dots into one.'],
    lab:{set:{view:'test',site:'fingertip',stim:'touch'},look:'Read the two-point threshold here, then change the site to Forearm.'}},
  {id:'chain',kind:'test',lvl:'bio',q:'A person has an intact fingertip and working receptors but a damaged sensory cortex for the hand. Do they feel a touch?',choices:['No. Receptors fire, but the fourth link is missing','Yes. Feeling happens in the fingertip','Yes, but only for fast-adapting receptors','No, because the receptors will not fire'],correct:0,
    steps:['Sensation needs four things: stimulus, receptor, afferent pathway and sensory cortex.','The first three still work, so signals still travel.','Without the cortex to make sense of them, they do not become a felt sensation.'],
    lab:{set:{view:'test',stim:'touch',site:'fingertip'},look:'Follow the four boxes along the bottom of the stage.'}},
  {id:'firefighter',kind:'real',lvl:'honors',q:'A firefighter’s gear blocks heat so well that they feel little until burned. Which design idea uses what you know about receptors?',choices:['A sensor that changes the signal on the skin as temperature climbs, because receptors report change best','A steady warm patch that stays on, so they stop noticing heat','Thicker gear with no sensor, so they feel nothing','A cold pack that numbs the hands'],correct:0,
    steps:['A steady stimulus fades as receptors adapt, so a constant warning stops working.','A changing signal, such as a pulse that speeds up, keeps fast-adapting receptors firing.','Good alarms pulse for the same reason.'],
    lab:{set:{view:'test',stim:'vib',site:'palm',f:120,S:70},look:'Vibration keeps the fast adapters firing with no adaptation.'}},
  {id:'pacinian',kind:'test',lvl:'honors',q:'A Pacinian corpuscle under steady deep pressure fires when?',choices:['At the start and when the pressure is released','Steadily, at a constant rate','Only when the pressure is released','Only if the pressure hurts'],correct:0,
    steps:['Pacinian corpuscles adapt very fast.','Their layers absorb steady pressure, so the nerve ending inside only deforms during a change.','That gives an on burst and an off burst.'],
    lab:{set:{view:'test',stim:'press',site:'palm',S:80},look:'Press Remove stimulus after a few seconds and watch for the second burst.'}},
  {id:'time',kind:'test',lvl:'ap',q:'A touch signal travels 1.7 m from the sole of the foot on an Aβ fiber at 50 m/s. How many milliseconds does it take?',num:{ans:34,tol:1,unit:'ms'},
    steps:['time = distance ÷ speed.','1.7 m ÷ 50 m/s = 0.034 s.','0.034 s × 1000 = 34 ms, ignoring short delays at the synapses.'],
    lab:{set:{view:'test',stim:'touch',site:'sole'},look:'Read Time for the signal to reach the cortex.'}}
  ]
}
});
