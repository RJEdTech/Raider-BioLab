/* Body map: practical layer and review questions (McKeon, Anatomy & Physiology). */
BioLab.addPractical({
bodymap:{
  hook:'A patient comes in lying on a stretcher with her palms turned down. The note says "cut 3 cm proximal to the wrist, on the lateral side of the forearm." Which side of her arm do you look at?',
  answer:'The thumb side, about 3 cm toward the elbow. Anatomical terms always assume anatomical position, with the palms forward, so lateral on the forearm means the thumb side no matter how she is lying or where her palms point. Proximal means closer to where the arm joins the trunk.',
  uses:[
    'Injury notes: an athletic trainer writes "tender on the distal, lateral thigh" so that a doctor can find the same spot without seeing the athlete.',
    'Medical images: a CT of the abdomen is usually read in transverse slices, and a knee MRI in sagittal slices that show the ACL and PCL.',
    'CPR: compressions press on the sternum because the heart lies directly posterior to it.'
  ],
  takeaway:'Picture the person in anatomical position first. Then every term compares one structure with another, and the sentence always needs both.',
  tour:[
    'Start from one pose: standing, facing forward, arms at the sides, palms forward. Every term assumes this pose, even when the real person is lying on a table.',
    'Superior means closer to the top of the head. Inferior means closer to the feet. The kidneys are inferior to the heart.',
    'Anterior means toward the front, and posterior means toward the back. The side view shows the esophagus in front of the spinal cord, so the esophagus is anterior to it.',
    'Medial means closer to the midline, an imaginary line down the center of the body. Lateral means farther from it. The nose is medial to the ears.',
    'On an arm or a leg, proximal means closer to where the limb joins the trunk. Distal means farther away. The knee is proximal to the ankle.',
    'A plane is a flat cut through the body. Sagittal divides left from right, frontal divides front from back, and transverse divides top from bottom. A CT scan is a stack of transverse slices.',
    'Cavities are protected spaces that hold organs. The diaphragm, a dome of muscle, divides the thoracic cavity with the heart and lungs from the abdominal cavity below.',
    'Eleven organ systems share the body, and each structure fits its job. Alveoli in the lungs are thin with a huge surface area, because gases must cross them quickly.'
  ]
}
});
BioLab.addReview({
bodymap:{
  questions:[
  {id:'esoph',kind:'test',lvl:'bio',
    q:'The esophagus is ___ to the spinal cord.',
    choices:['Anterior','Posterior','Superior','Distal'],correct:0,
    steps:['Picture the side view of the body in anatomical position.','The spinal cord runs inside the vertebrae, near the back. The esophagus runs just in front of them.','Closer to the front means anterior.'],
    lab:{set:{view:'terms',a:'esophagus',b:'spinalcord'},look:'Compare A and B on the <b>side view</b>.'}},
  {id:'kneepair',kind:'test',lvl:'bio',
    q:'The knee is ___ to the hip but ___ to the foot.',
    choices:['Proximal; distal','Distal; proximal','Superior; inferior','Medial; lateral'],correct:1,
    steps:['Proximal and distal compare spots along one limb, measured from where the limb joins the trunk.','The hip is where the leg joins the trunk, so the knee is farther away, or distal, compared with the hip.','The foot is farther along the leg than the knee, so the knee is proximal to the foot.'],
    lab:{set:{view:'terms',a:'knee',b:'hip'},look:'Read the proximal or distal line. Then set Landmark B to the foot.'}},
  {id:'thumb',kind:'real',lvl:'bio',
    q:'An athlete holds an ice pack with her palm facing her thigh. The trainer writes that the swelling is on the lateral side of the wrist. Which side is that?',
    choices:['The little finger side','The thumb side','The palm side','The back of the hand'],correct:1,
    steps:['Terms assume anatomical position, whatever the arm is doing right now.','In anatomical position the palms face forward, so the thumb points away from the midline.','Lateral on the wrist always means the thumb side.'],
    lab:{set:{view:'terms',a:'thumb',b:'pinky'},look:'Find the thumb and the little finger on the front view.'}},
  {id:'plane',kind:'test',lvl:'bio',
    q:'Which plane divides the body into anterior and posterior parts?',
    choices:['Sagittal','Frontal (coronal)','Transverse'],correct:1,
    steps:['Sagittal gives left and right parts.','Transverse gives superior and inferior parts.','Frontal, also called coronal, gives anterior and posterior parts.'],
    lab:{set:{view:'planes',plane:'frontal',cut:50},look:'Read the labels on the side view, then move the cut.'}},
  {id:'cavity',kind:'test',lvl:'bio',
    q:'Which structure separates the thoracic cavity from the abdominal cavity?',
    choices:['Sternum','Diaphragm','Pelvis','Spinal cord'],correct:1,
    steps:['The heart and lungs sit above this structure, and the stomach and liver sit below it.','The diaphragm is a dome of muscle that forms the floor of the thoracic cavity and the roof of the abdominal cavity.'],
    lab:{set:{view:'cavities',cavity:'thoracic'},look:'Find the dark curved line under the lungs.'}},
  {id:'domino',kind:'real',lvl:'bio',
    q:'Which pair correctly matches a structure with its function?',
    choices:['Alveoli have thin walls and a huge surface area, so gases diffuse quickly','Capillaries have thick walls, so they hold blood under high pressure','Villi smooth the lining of the small intestine, so food moves faster','Skull bones are flexible, so the brain can move freely'],correct:0,
    steps:['Structure fits function: a thin wall and a large area make diffusion fast.','Capillary walls are only one cell thick, villi add surface area for absorption and skull bones fuse into a rigid case.'],
    lab:{set:{view:'systems',system:'respiratory'},look:'Read the structure and function pair in the panel. Then try other systems.'}},
  {id:'sternum',kind:'real',lvl:'honors',
    q:'In CPR you press on the sternum. Which sentence explains why that compresses the heart?',
    choices:['The heart is superior to the sternum','The heart is posterior and deep to the sternum','The heart is lateral to the sternum','The heart is distal to the sternum'],correct:1,
    steps:['The sternum sits at the front of the chest, just under the skin.','The heart lies directly behind it, so it is posterior. It is also farther from the surface, so it is deep.','Distal does not apply, because neither structure is on a limb.'],
    lab:{set:{view:'terms',a:'heart',b:'sternum'},look:'Read the anterior or posterior line and the superficial or deep line.'}},
  {id:'mri',kind:'real',lvl:'honors',
    q:'A doctor wants one image that shows the ACL running from front to back through the knee. Which slice works best?',
    choices:['Sagittal','Transverse','Neither one shows length'],correct:0,
    steps:['The ACL and PCL run in a mostly front-to-back and up-and-down direction.','A sagittal slice contains both of those directions, so it shows the ligament along its length.','A transverse slice cuts across it and shows only a small cross section.'],
    lab:{set:{view:'planes',plane:'sagittal',cut:37},look:'This sagittal cut passes through the right leg.'}},
  {id:'kidneyside',kind:'test',lvl:'ap',
    q:'The liver and the spleen sit on opposite sides of the midline. Which term describes this?',
    choices:['Ipsilateral','Contralateral','Proximal','Superficial'],correct:1,
    steps:['Ipsilateral means on the same side of the midline.','The liver is mostly on the body’s right and the spleen is on the body’s left, so they are contralateral.'],
    lab:{set:{view:'cavities',cavity:'abdominal'},look:'Remember the figure faces you, so the body’s right appears on your left.'}}
  ]
}
});
