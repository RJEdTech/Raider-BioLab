BioLab.addPractical({
kineticchain:{
  hook:'A soccer player’s right knee aches on every squat, and nothing is wrong with the knee itself. She sprained that ankle last season. Where should an athletic trainer look first?',
  answer:'At the right ankle as well as the knee. When ankle dorsiflexion falls from 38° to 18° on one side, that knee collapses inward about 9° while the left stays near 3°. The knee hurts, but the ankle failed. Rest can calm the knee, and only getting the ankle moving changes the load.',
  uses:[
    'After an ankle sprain, athletic trainers restore dorsiflexion and check it against the uninjured side, because a stiff ankle changes how the knee and hip move on landings.',
    'A low back that hurts at the bottom of a squat can be a hip problem. Checking hip flexion range can change the whole treatment plan.',
    'Coaches watch for knees caving in on squats and jump landings. Those movement screens often lead to glute strengthening or ankle mobility work.'
  ],
  takeaway:'Location A hurts, location B failed. When a mobile joint loses range, a stable neighbor gives up stability to make up for it. Check above and below the pain, and compare both sides.'
}
});
BioLab.addReview({
kineticchain:{questions:[
  {id:'jobs',kind:'test',lvl:'bio',
    q:'In the Joint by Joint model, which list gives the correct job for each joint, from the ankle up?',
    choices:['Ankle stability, knee mobility, hip stability, lumbar spine mobility','Ankle mobility, knee stability, hip mobility, lumbar spine stability','All four need mobility','Ankle mobility, knee mobility, hip stability, lumbar spine stability'],correct:1,
    steps:['The jobs alternate going up the chain.','The ankle and hip need to move. The knee and lumbar spine need to control motion.','So: ankle mobility, knee stability, hip mobility, lumbar spine stability.'],
    lab:{set:{ankle:38,hip:120,glute:100,sides:'both',cs:'free'},look:'The M and S on each row of the gauges mark the job of each joint.'}},
  {id:'rule',kind:'test',lvl:'bio',
    q:'What usually happens when a mobile joint loses range of motion?',
    choices:['The joint above or below gives up stability to make up for it','The body simply stops using that movement, with no other changes','The joint gets stronger','Only the injured joint is affected'],correct:0,
    steps:['The task still asks for the motion, so the body finds it somewhere.','The nearest joints make up for it, and they’re often the joints meant for stability.','That’s compensation, and it’s why the sore joint isn’t always the source.'],
    lab:{set:{ankle:18,hip:120,glute:100,sides:'both',cs:'free'},look:'Ankle range is 18°. Look for which joints change in the side and front views.'}},
  {id:'kneepain',kind:'real',lvl:'bio',
    q:'A basketball player has knee pain with no injury to the knee. His ankle has been stiff since a sprain. What’s the best next step in the evaluation?',
    choices:['Treat only the knee, since that’s where it hurts','Check the joints above and below the knee, including ankle range on both sides','Tell him to work through it','Check only the injured ankle, not the other side'],correct:1,
    steps:['Regional interdependence: a problem in one region can cause symptoms in another.','Measure ankle dorsiflexion on both sides. The uninjured side shows what’s normal for him.','Treating the knee alone leaves the reason it’s overloaded in place.'],
    lab:{set:{cs:'knee'},look:'Compare right and left ankle range in the case panel, then the two knees in the front view.'}},
  {id:'backpain',kind:'real',lvl:'bio',
    q:'A student’s low back hurts at the bottom of a squat. In the model, hip flexion range is 90°. At a 90° thigh angle, why does the low back round?',
    choices:['The trunk is too upright','The hip runs out of range, so the lumbar spine flexes to finish the movement','The ankle is too mobile','The knee is unstable'],correct:1,
    steps:['Hip demand is about thigh angle plus trunk lean, near 122° here.','Only 90° is available, so about 32° has to come from somewhere.','The pelvis tucks and the lumbar spine flexes. The low back hurts, and the hip failed.'],
    lab:{set:{cs:'back'},look:'Read <b>Lumbar flexion</b>. Then press <b>Restore the joint that failed</b> and read it again.'}},
  {id:'sides',kind:'test',lvl:'bio',
    q:'Why does an athletic trainer evaluate the uninjured side as well as the injured side?',
    choices:['To save time','The uninjured side shows what normal is for that athlete','To spread any swelling evenly','It’s only needed for children'],correct:1,
    steps:['Normal range and strength vary from person to person.','A chart gives a population average. The other side gives this athlete’s own baseline.','So a difference between sides is often the most useful finding.'],
    lab:{set:{cs:'knee',sides:'right'},look:'Only the right ankle is limited. Compare R and L in the front view.'}},
  {id:'valgus',kind:'test',lvl:'honors',
    q:'Weak gluteal muscles most directly lead to which squat fault?',
    choices:['Knee valgus','Stiff ankle','More hip flexion range','Less trunk lean'],correct:0,
    steps:['The gluteal muscles hold the femur out so it doesn’t fall inward.','When they’re weak the femur drops in, and the knee moves toward the midline.','Range is normal in this case, which is why you test strength as well as motion.'],
    lab:{set:{cs:'glute'},look:'Range is normal, yet <b>Knee valgus</b> is high. Compare the two knee rows with their tick marks.'}},
  {id:'load',kind:'real',lvl:'honors',
    q:'Stiff ankles keep a lifter’s knees back. Compared with a healthy squat, the knee’s bending moment falls and the valgus moment rises. What’s the best conclusion?',
    choices:['The knee is safer, since the bending moment is lower','Direction of load matters: a stability joint is now taking side-to-side load','The knee is not involved','Depth doesn’t change'],correct:1,
    steps:['The knees stay back and the squat is shallower, so the bending moment falls.','The knee drifts inward looking for motion, so the side-to-side moment rises.','The knee is built to bend, and less built to take load toward the midline.'],
    lab:{set:{ankle:15,hip:120,glute:100,sides:'both',cs:'free'},look:'Compare <b>Knee bending</b> and <b>Knee valgus</b> with their tick marks.'}},
  {id:'extended',kind:'test',lvl:'ap',
    q:'The extended Joint by Joint model adds two joints above the lumbar spine. What are their jobs?',
    choices:['Thoracic spine stability, shoulder blade mobility','Thoracic spine mobility, shoulder blade stability','Both mobility','Both stability'],correct:1,
    steps:['The pattern keeps alternating. The lumbar spine is stability, so the thoracic spine is mobility.','Above that, the shoulder blade (scapula) is stability.','So a stiff thoracic spine can overload the low back and the shoulder.'],
    lab:{set:{ankle:38,hip:120,glute:100,sides:'both',cs:'free',over:true,thor:0},look:'Arms are overhead and the thoracic spine is stiff. Read <b>Arm drift from vertical</b>.'}}
]}
});
