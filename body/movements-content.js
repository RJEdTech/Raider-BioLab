/* Body movements and joints: practical layer and review questions (McKeon, SPAT and Anatomy & Physiology). */
BioLab.addPractical({
movements:{
  hook:'A volleyball hitter can only raise her arm to 140°, while the other arm goes to 180°. To describe this to a doctor in one line, what movement and plane do you name, and how do you know the 140° is a problem?',
  answer:'Shoulder flexion in the sagittal plane if the arm goes forward, or shoulder abduction in the frontal plane if it goes out to the side. The normal range for either is about 0° to 180°. Her other arm shows 180°, so 140° is a real loss for her. Always compare both sides, because normal varies between people.',
  uses:[
    'Rehab: an athletic trainer measures range of motion with a goniometer and compares it with the other side to track recovery after an injury.',
    'Exercise choice: a lateral raise trains the frontal plane, a curl trains the sagittal plane and a trunk twist trains the transverse plane.',
    'Sprains: the ankle inverts farther than it everts, which is why most ankle sprains are inversion sprains on the lateral side.'
  ],
  takeaway:'Name the joint, the movement and the plane. The shape of the joint tells you which movements are possible and what gets hurt when a force pushes past them.',
  tour:[
    'Every movement starts from anatomical position and comes in a pair of opposites. The blue part moves. The dashed green arc is its normal range, and the red wedge is how far it has moved.',
    'A biceps curl is elbow flexion, because the angle at the joint gets smaller. It moves in the sagittal plane, which you see best from the side.',
    'A lateral raise is shoulder abduction, because the arm moves away from the midline. It moves in the frontal plane, which you see best from the front.',
    'With the elbow bent, the humerus spins on its own length and the forearm swings like a gate. Rotation moves in the transverse plane, like a trunk twist.',
    'Turn your palm down for pronation and up for supination. The radius crosses over the ulna to do this, so the elbow’s hinge is not involved.',
    'Point your toes for plantarflexion and pull them up for dorsiflexion. Turn the sole inward for inversion and outward for eversion.',
    'The shape of a joint sets what it can do. A ball and socket moves in every plane, a hinge in one, a pivot only spins and a saddle rocks in two directions.'
  ]
}
});
BioLab.addReview({
movements:{
  questions:[
  {id:'curl',kind:'test',lvl:'bio',
    q:'A biceps curl is which movement at the elbow, in which plane?',
    choices:['Flexion, sagittal','Abduction, frontal','Pronation, transverse','Extension, frontal'],correct:0,
    steps:['The angle at the elbow gets smaller, so it is flexion.','The forearm swings forward and back, so you see it best from the side.','That makes it the sagittal plane.'],
    lab:{set:{joint:'elbow',move:'flexion',angle:110},look:'Read the <b>Plane</b> tile and the exercise.'}},
  {id:'abd',kind:'test',lvl:'bio',
    q:'A jumping jack moves your arms and legs out to the side. What movement is this?',
    choices:['Flexion','Abduction','Adduction','Rotation'],correct:1,
    steps:['Out to the side means away from the midline.','Moving away from the midline is abduction, and it happens in the frontal plane.','Bringing the limbs back in is adduction.'],
    lab:{set:{joint:'hip',move:'abduction',angle:40},look:'Read the plane, then try it at the shoulder.'}},
  {id:'palm',kind:'test',lvl:'bio',
    q:'You hold a bowl of soup with your palm up. Which movement put your palm there?',
    choices:['Pronation','Supination','Inversion','Eversion'],correct:1,
    steps:['Palm up is supination, and the word has "soup" in it as a memory aid.','Pronation is the opposite, palm down.','Inversion and eversion describe the sole of the foot.'],
    lab:{set:{joint:'elbow',move:'supination',angle:70},look:'Watch the orange palm of the hand turn upward.'}},
  {id:'ankle',kind:'real',lvl:'bio',
    q:'An athlete rolls her ankle so that the sole of her foot faces the other foot. Which movement went too far?',
    choices:['Inversion','Eversion','Dorsiflexion','Plantarflexion'],correct:0,
    steps:['Inversion turns the sole inward, toward the other foot.','Eversion turns it outward.','Inversion sprains are the most common ankle sprain, and they stretch the ligaments on the lateral side.'],
    lab:{set:{joint:'ankle',move:'inversion',angle:30},look:'Watch the outlined sole turn inward. Then read the normal range.'}},
  {id:'rom',kind:'real',lvl:'bio',
    q:'An athlete’s knee flexes to about 90° after surgery. The normal range is about 135°. How many more degrees of flexion does she need to reach normal?',
    num:{ans:45,tol:1,unit:'°'},
    steps:['Normal knee flexion is about 135°.','135° − 90° = 45°.','In practice you also compare the result with her other knee, since normal varies between people.'],
    lab:{set:{joint:'knee',move:'flexion',angle:90},look:'Move the slider from 90° to the end of the range.'}},
  {id:'twist',kind:'test',lvl:'bio',
    q:'Which exercise moves mostly in the transverse plane?',
    choices:['Biceps curl','Lateral raise','Trunk twist','Calf raise'],correct:2,
    steps:['A curl and a calf raise move forward and back, in the sagittal plane.','A lateral raise moves out to the side, in the frontal plane.','A trunk twist spins around a long axis, in the transverse plane.'],
    lab:{set:{joint:'hip',move:'er',angle:40},look:'This rotation is in the same plane as a trunk twist.'}},
  {id:'stable',kind:'real',lvl:'honors',
    q:'The shoulder dislocates far more often than the hip, though both are ball and socket joints. Why?',
    choices:['The shoulder socket is shallow, which gives it more range and less stability','The shoulder has no ligaments','The hip has a smaller ball','The shoulder is a hinge joint'],correct:0,
    steps:['Both joints have a ball in a socket, so they can move in all three planes.','The glenoid is shallow, and the acetabulum is deep.','A shallow socket gives more range but holds the bone less, so a force can push the humerus out.'],
    lab:{set:{view:'types',jtype:'ball'},look:'Read the comparison in the panel, then compare abduction at the shoulder and the hip.'}},
  {id:'endfeel',kind:'test',lvl:'honors',
    q:'What stops the elbow at full extension?',
    choices:['The biceps press on the forearm','The olecranon seats into the back of the humerus','The radius crosses the ulna','The triceps run out of length'],correct:1,
    steps:['Extension straightens the elbow.','The olecranon of the ulna moves into a pit on the back of the humerus, and the two bones meet.','Flexion stops differently: the forearm presses into the muscle of the upper arm.'],
    lab:{set:{joint:'elbow',move:'extension',angle:150},look:'The slider is at the end of the range. Read the caption under the figure.'}},
  {id:'axis',kind:'test',lvl:'ap',
    q:'Shoulder abduction happens in the frontal plane. Which axis does it turn around?',
    choices:['Side-to-side','Front-to-back','Long axis of the humerus'],correct:1,
    steps:['An axis is always perpendicular to its plane.','The frontal plane runs side to side and up and down, so the line perpendicular to it runs front to back.'],
    lab:{set:{joint:'shoulder',move:'abduction',angle:90},look:'Read the Plane line in the panel. Compare the inset with the main figure.'}}
  ]
}
});
