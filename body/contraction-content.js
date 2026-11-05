/* Practical hook and review questions for the Muscle contraction tool (A&P, McKeon). */
BioLab.addPractical({
contraction:{
  hook:'Squeeze a clothespin as fast as you can. Within about half a minute your hand slows and starts to burn, yet you could squeeze slowly for minutes. What is running out, and why does the pace matter so much?',
  answer:'At top speed, fast twitch fibers make ATP without oxygen. That is quick, but it gets only a little ATP per glucose and builds up lactic acid, so force falls within tens of seconds. At an easy pace, slow twitch fibers use oxygen and keep up with demand for a long time.',
  uses:[
    'Track and field: a 100 m sprinter trains fast twitch power, and a distance runner trains slow twitch endurance and oxygen delivery.',
    'Weight training: a heavy set ends in seconds not because you are out of ATP completely, but because the supply cannot keep up and force falls.',
    'A cramp-free stretch: a sarcomere stretched too far loses overlap and makes less force, so muscles work best near their resting length.'
  ],
  takeaway:'A nerve signal releases calcium, calcium uncovers actin, and myosin heads pull using ATP. Force depends on the signal rate and sarcomere length, and how long it lasts depends on how fast the fiber can make ATP.'
}});
BioLab.addReview({
contraction:{questions:[
  {id:'sliding',kind:'test',lvl:'bio',
    q:'When a sarcomere shortens, what happens to the filaments?',
    choices:['Both filaments get shorter','The thin filaments slide past the thick filaments, and both keep their length','The thick filaments slide out through the Z discs','The filaments fold in half'],correct:1,
    steps:['Myosin heads pull actin toward the middle of the sarcomere.','The Z discs come closer together, while each filament stays the same length.','That is why this is called the sliding filament model.'],
    lab:{set:{scene:'sarc',rate:40},look:'Watch the Z discs move in and the length readout change. Compare with the filaments.'}},
  {id:'cajob',kind:'test',lvl:'bio',
    q:'What does calcium do in a contraction?',
    choices:['It provides the energy for the power stroke','It uncovers the binding sites on actin so myosin can attach','It breaks down lactic acid','It carries the nerve signal down the axon'],correct:1,
    steps:['At rest, tropomyosin blocks the binding sites on actin.','Released calcium binds to troponin, and troponin moves tropomyosin out of the way.','ATP provides the energy. Calcium is the switch.'],
    lab:{set:{scene:'sarc',rate:40,caOn:false},look:'Calcium is off. The signal arrives, but force stays at zero. Turn calcium back on and compare.'}},
  {id:'rigor',kind:'real',lvl:'bio',
    q:'Rigor mortis stiffens a body a few hours after death. Why?',
    choices:['ATP runs out, so myosin heads stay attached to actin','Calcium is pumped away, so muscles contract harder','Lactic acid freezes the muscle','Tendons shorten after death'],correct:0,
    steps:['Letting go of actin takes a new ATP.','With no more ATP, heads stay attached, and the calcium pump stops too.','The muscle is locked until the proteins break down later.'],
    lab:{set:{scene:'sarc',rate:40},look:'Turn off <b>ATP available</b> and watch force stay locked.'}},
  {id:'fibertype',kind:'test',lvl:'bio',
    q:'Which description matches a fast twitch fiber?',
    choices:['Red, lots of myoglobin, aerobic, fatigue resistant','White, little myoglobin, powerful, anaerobic, fatigues fast','Red, little myoglobin, anaerobic, fatigue resistant','White, lots of myoglobin, aerobic, fatigues slowly'],correct:1,
    steps:['Myoglobin stores oxygen and makes fibers red, so red goes with aerobic.','Fast twitch fibers lack it, so they look white and rely on anaerobic ATP.','They trade endurance for speed and power.'],
    lab:{set:{scene:'energy',fiber:'fast',effort:100},look:'Compare the fiber drawing and fatigue time with a slow twitch fiber.'}},
  {id:'atpcount',kind:'test',lvl:'bio',
    q:'Using the equations from your handout, how many times more ATP does aerobic respiration give than anaerobic respiration, per glucose?',
    num:{ans:19,tol:.1,unit:'times'},
    steps:['Aerobic: glucose + oxygen → 38 ATP + water + CO₂.','Anaerobic: glucose → 2 ATP + lactic acid.','38 ÷ 2 = 19. (The real aerobic yield is nearer 30 to 32 ATP, as the About section explains. Your handout uses 38.)']},
  {id:'tetanus',kind:'test',lvl:'honors',
    q:'A motor neuron fires much faster. Why does the muscle’s force rise above a single twitch?',
    choices:['Each sarcomere gets longer','New signals arrive before relaxation, so twitches add together','The muscle makes more fibers','Each signal has more voltage'],correct:1,
    steps:['One twitch reaches only about a quarter of maximum.','If the next signal arrives before the fiber relaxes, the second twitch builds on the first. That is summation.','At high rates force is nearly smooth. That is tetanus.'],
    lab:{set:{scene:'sarc',rate:15},look:'Raise the rate from 15 to 80 and watch the force trace.'}},
  {id:'stretch',kind:'real',lvl:'honors',
    q:'At the very bottom of a deep squat, and at full lockout, your legs feel weaker than in between. What does the length-tension curve predict?',
    choices:['Force is highest when sarcomeres are at middle lengths, where filament overlap is best','Force always rises as a muscle stretches','Force is the same at every length','Force is highest when a muscle is shortest'],correct:0,
    steps:['Force depends on how many heads can reach actin.','Too long, and the overlap is lost. Too short, and thin filaments collide and interfere.','Joint leverage also changes through a squat, so the curve is part of the story, not all of it.'],
    lab:{set:{scene:'sarc',rate:80,L0:3.4},look:'Open the length-tension graph, and compare force at 1.6, 2.2, 2.8 and 3.4 µm.'}},
  {id:'order',kind:'test',lvl:'ap',
    q:'At the start of an all-out sprint, in what order do the fast ATP sources step in?',
    choices:['Creatine phosphate, then anaerobic glycolysis, with aerobic supply rising slowly throughout','Aerobic first, then anaerobic, then creatine phosphate','Anaerobic first, then creatine phosphate','Only aerobic respiration, at a higher rate'],correct:0,
    steps:['Creatine phosphate can remake ATP at once, and it lasts seconds.','Anaerobic glycolysis takes over the bulk of supply, building lactic acid.','Aerobic supply takes time to ramp up, and is too slow for peak demand in fast fibers.'],
    lab:{set:{scene:'energy',fiber:'fast',effort:100},look:'Open <b>Where ATP comes from</b> to see which source carries the load, and when.'}}
]}});
