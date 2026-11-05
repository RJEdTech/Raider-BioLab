/* Practical and review content for the skeleton tool. */
BioLab.addPractical({skeleton:{
  hook:'A construction crew digs up one femur, 52.4 cm long, from a Caucasian male. There is no other bone with it. How tall was he?',
  answer:'About 187 cm, or 6 feet 2 inches. The handout’s equation is height = 2.32 × 52.4 + 65.53, give or take 3.94 cm. Long bones and height grow together, so one bone gives a useful range, not an exact number.',
  uses:[
    'Forensic anthropology: teams estimate a person’s height from a single long bone, which helps narrow a list of missing people.',
    'Sports medicine: athletic trainers name bones and landmarks exactly, like "tender over the lateral malleolus," so everyone on the care team knows what they mean.',
    'Bone marrow donation: doctors usually collect marrow from the back of the pelvis, because that flat bone holds so much red marrow in adults.'],
  takeaway:'Know each bone by where it sits and what it touches. Then its name, its group and its job are easy to work out, and they stay with you past the quiz.'
}});
BioLab.addReview({skeleton:{questions:[
  {id:'axial',kind:'test',lvl:'bio',q:'Which set contains only appendicular bones?',choices:['Cranium, ribs, sternum','Clavicle, scapula, pelvis, femur','Sacrum, coccyx, femur','Thoracic vertebrae, humerus, tibia'],correct:1,
    steps:['Axial bones form the center of the body: skull, vertebral column and ribcage.','Appendicular bones are the arms, legs, shoulder bones and hip bones.','The clavicle and scapula are shoulder bones, the pelvis is the hip bones and the femur is a leg bone, so all four are appendicular.'],
    lab:{set:{task:'groups',view:'front',zoom:'whole',sortMode:'show'},look:'Blue bones are axial and amber bones are appendicular. Find the clavicle and the sacrum.'}},
  {id:'count',kind:'test',lvl:'bio',q:'Going down the spine, what are the vertebrae counts for the cervical, thoracic and lumbar sections?',choices:['7, 12, 5','5, 12, 7','12, 5, 7','7, 5, 12'],correct:0,
    steps:['The neck has 7 cervical vertebrae.','The chest has 12 thoracic vertebrae, one for each pair of ribs.','The lower back has 5 lumbar vertebrae. Remember breakfast at 7, lunch at 12, dinner at 5.'],
    lab:{set:{task:'explore',view:'back',zoom:'whole',bone:'thoracic'},look:'Count the thoracic vertebrae and the ribs attached to them. Zoom in on Chest and shoulders to see them closer.'}},
  {id:'carpal',kind:'test',lvl:'bio',q:'A word bank has Carpals, Tarsals, Metacarpals and Metatarsals. Which one names the bones of the palm?',choices:['Carpals','Tarsals','Metacarpals','Metatarsals'],correct:2,
    steps:['Carpals are in the wrist and tarsals are in the ankle.','Meta means beyond. Metacarpals sit beyond the carpals, in the palm.','Metatarsals sit beyond the tarsals, in the foot.'],
    lab:{set:{task:'explore',view:'front',zoom:'hand',bone:'metacarpals'},look:'See where the metacarpals sit between the carpals and the phalanges.'}},
  {id:'fall',kind:'real',lvl:'bio',q:'A soccer player falls hard onto the point of her shoulder. An athletic trainer sees a bump along the thin bone running from the top of her sternum to her shoulder. Which bone is that?',choices:['Scapula','Humerus','Clavicle','Sternum'],correct:2,
    steps:['That bone is across the top of the chest, from the sternum to the shoulder.','That is the clavicle, the collarbone.','The scapula is on the upper back. The humerus is in the upper arm. This is a naming question, not medical advice: an injury like this needs a professional evaluation.'],
    lab:{set:{task:'explore',view:'front',zoom:'chest',bone:'clavicle'},look:'Follow the clavicle from the sternum out to the shoulder.'}},
  {id:'marrow',kind:'test',lvl:'honors',q:'Which part of a long bone is the site of hematopoiesis?',choices:['Yellow marrow in the medullary cavity','Red marrow in spongy bone','Compact bone','Articular cartilage'],correct:1,
    steps:['Hematopoiesis means making blood cells.','Red marrow does this, and it fills the spaces in spongy bone.','Yellow marrow is mostly fat, so it stores energy.'],
    lab:{set:{task:'long',part:'red',age:'grow'},look:'Find the red marrow in the end of the bone, between the struts of spongy bone.'}},
  {id:'grow',kind:'real',lvl:'honors',q:'A 15-year-old and a 25-year-old both start lifting weights. Which structure lets only the 15-year-old’s femur still get longer?',choices:['The periosteum','The epiphyseal plate','The medullary cavity','The articular cartilage'],correct:1,
    steps:['Bones get longer at the cartilage of the epiphyseal plate.','By the mid to late teens the plate turns to bone, leaving the epiphyseal line.','The periosteum can still thicken bone at any age, but it cannot add length.'],
    lab:{set:{task:'long',part:'plate',age:'adult'},look:'Switch Age between Growing teen and Adult and watch the plate become a line.'}},
  {id:'height',kind:'real',lvl:'honors',q:'Use the handout’s equation for a Caucasian female femur: height = 2.47x + 54.10. A partner’s femur is 45.0 cm. What is her calculated height?',num:{ans:165.25,tol:.3,unit:'cm'},
    steps:['Multiply first: 2.47 × 45.0 = 111.15.','Then add the intercept: 111.15 + 54.10 = 165.25 cm.','The equation’s ± is 3.72 cm, so a good report is a range: about 161.5 to 169.0 cm.']},
  {id:'se',kind:'test',lvl:'ap',q:'Bones 2 and 5 from the site are femurs from African-American females, 44.0 cm and 43.9 cm. The equation is 2.28x + 59.76 ± 3.41. What can you say?',choices:['They must be from the same person.','The two women must have been the same height.','Their ranges overlap, so they could be the left and right femurs of one person or come from two women of different heights.','They must be from two different people.'],correct:2,
    steps:['Both calculate to about 160 cm, with ranges of roughly 156.5 to 163.4 cm.','Near-equal length means they could be a matched pair from one person, but nothing proves it.','The ± is a standard error. It says that people with the same femur length vary in height, so two women could differ by several centimeters.']},
  {id:'hormone',kind:'test',lvl:'ap',q:'Which is a real function of bone that the skeleton performs as an endocrine organ?',choices:['Making osteocalcin, which helps regulate blood sugar','Making insulin','Making hemoglobin in compact bone','Storing bile'],correct:0,
    steps:['Bone cells called osteoblasts release osteocalcin into the blood.','Osteocalcin helps regulate blood sugar and energy use.','Insulin comes from the pancreas, and hemoglobin is made by developing red blood cells in red marrow.'],
    lab:{set:{task:'func',fn:'hormone',view:'front'},look:'The dots stand for hormone released from bone into the blood.'}}
]}});
