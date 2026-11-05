/* Practical hook and review questions for the Major muscles tool (A&P, McKeon). */
BioLab.addPractical({
muscles:{
  hook:'On a labeling quiz, “lats” and “biceps” lose the point. Before you open a list of names: can you point to where your Latissimus Dorsi attaches, and say what would stop working if it tore?',
  answer:'The Latissimus Dorsi runs from your lower spine and hip bone to the front of your upper humerus, so it pulls the arm down and back. If it tore, pull-ups and rowing would be weak. The location, the fiber direction and the action all connect.',
  uses:[
    'Athletic training: naming the exact muscle (Biceps Femoris vs. Semitendinosus) tells a clinician which test to run and which tendon to check.',
    'The weight room: a seated calf raise trains Soleus more than Gastrocnemius, because Gastrocnemius crosses the bent knee and goes slack.',
    'Reading names: rectus, oblique, maximus, deltoid and teres each tell you something you can see on the muscle, so the names are less to memorize than they look.'
  ],
  takeaway:'Learn each muscle as a location, a fiber direction and two attachments. A muscle pulls its insertion toward its origin, so the attachments predict the action.'
}});
BioLab.addReview({
muscles:{questions:[
  {id:'quizname',kind:'test',lvl:'bio',
    q:'A labeling quiz points to the large muscle fanning across the chest. Which answer earns the point?',
    choices:['Pecs','Pectoralis Major','Chest muscle','Serratus Anterior'],correct:1,
    steps:['Labeling quizzes want the anatomical name.','Pectoralis means of the chest, and Major means the larger one.','Serratus Anterior is the saw-toothed muscle on the side of the ribs, below the Pectoralis Major.'],
    lab:{set:{act:'explore',muscle:'pec',view:'front'},look:'Pectoralis Major is highlighted. The fibers fan out from the sternum and collarbone to one point on the humerus.'}},
  {id:'hamstrings',kind:'test',lvl:'bio',
    q:'Which three muscles make up the hamstrings?',
    choices:['Rectus Femoris, Vastus Lateralis, Vastus Medialis','Biceps Femoris, Semitendinosus, Semimembranosus','Gastrocnemius, Soleus, Tibialis Anterior','Gluteus Maximus, Gluteus Medius, Adductors'],correct:1,
    steps:['Hamstrings run down the back of the thigh.','Biceps Femoris is on the outer side. Semitendinosus and Semimembranosus are on the inner side.','Rectus Femoris and the vastus muscles are quadriceps, on the front.'],
    lab:{set:{act:'explore',muscle:'bicfem',view:'back',zoom:'lower'},look:'Choose each name in the Muscle list and find it on the back of the thigh.'}},
  {id:'decoder',kind:'test',lvl:'bio',
    q:'Without looking it up: what does the name Rectus Femoris tell you about the muscle?',
    choices:['Its fibers run straight, and it is on the thigh','It has three heads, and it is on the arm','It is the largest muscle of the hip','Its fibers run on a slant, and it is on the abdomen'],correct:0,
    steps:['Rectus means straight.','Femoris refers to the femur, the thigh bone.','The same logic works for Rectus Abdominis: straight fibers on the abdomen.'],
    lab:{set:{act:'decoder',root:'rectus'},look:'Rectus means straight. Both muscles with this root are highlighted on the figure.'}},
  {id:'types',kind:'test',lvl:'bio',
    q:'A tissue sample has striated, branched cells joined by dark discs. It works without conscious control. Which muscle type is it?',
    choices:['Skeletal','Cardiac','Smooth','It could be either skeletal or smooth'],correct:1,
    steps:['Striations rule out smooth muscle, which has no stripes.','Skeletal muscle is striated too, but its fibers are long and unbranched, and it is voluntary.','Branched cells joined by intercalated discs are cardiac muscle.'],
    lab:{set:{act:'types',mtype:'cardiac'},look:'Compare the three samples. Look for stripes, branching and where the nuclei sit.'}},
  {id:'calfraise',kind:'real',lvl:'honors',
    q:'A runner with a calf strain feels pain in a straight-knee calf raise, but much less in a bent-knee calf raise. Which muscle is more likely injured?',
    choices:['Gastrocnemius','Soleus','Tibialis Anterior','Semimembranosus'],correct:0,
    steps:['Both Gastrocnemius and Soleus point the foot down, through the Achilles tendon.','Gastrocnemius starts on the femur, so it crosses the knee. Bending the knee slackens it and it does less work.','Soleus starts below the knee, so it works in both positions. Pain that eases with a bent knee points to Gastrocnemius. An athletic trainer or doctor would confirm it with an exam.'],
    lab:{set:{act:'explore',muscle:'gastroc',view:'back',zoom:'lower'},look:'Compare the origin of Gastrocnemius with the origin of Soleus in the panel. Then lift the surface muscles to see all of Soleus.'}},
  {id:'originins',kind:'test',lvl:'honors',
    q:'The Biceps Brachii starts on the shoulder blade and ends on the radius. When it contracts during a curl, which is the insertion?',
    choices:['The shoulder blade, because it is on top','The radius, because that bone moves','The humerus, because the belly lies over it','Whichever end is thicker'],correct:1,
    steps:['The origin is on the bone that stays still.','The insertion is on the bone that moves.','In a curl, the radius moves toward the shoulder, so the radius holds the insertion.'],
    lab:{set:{act:'pull',elbow:70},act:'flex',look:'Press <b>Flex the elbow</b>. Watch which attachment moves.'}},
  {id:'rotator',kind:'test',lvl:'ap',
    q:'Which back-of-the-shoulder muscle on this chart belongs to the rotator cuff?',
    choices:['Teres Major','Infraspinatus','Rhomboids','Latissimus Dorsi'],correct:1,
    steps:['The rotator cuff is supraspinatus, infraspinatus, teres minor and subscapularis.','Infraspinatus runs from below the ridge of the scapula to the greater tubercle, and rotates the arm outward.','Teres Major has a similar name, but it rotates the arm inward along with the Latissimus Dorsi.'],
    lab:{set:{act:'explore',muscle:'infra',view:'back',zoom:'upper'},look:'Compare Infraspinatus with Teres Major, just below it. Check the insertion of each.'}},
  {id:'footdrop',kind:'real',lvl:'ap',
    q:'After a hard hit to the outer knee, a player’s toes drag when walking because the foot cannot lift. Which muscle is failing, and what nerve supplies it?',
    choices:['Gastrocnemius, tibial nerve','Tibialis Anterior, deep fibular nerve','Soleus, sciatic nerve','Vastus Lateralis, femoral nerve'],correct:1,
    steps:['Lifting the foot is dorsiflexion, which is the action of Tibialis Anterior.','Its nerve, the deep fibular nerve, branches from the common fibular nerve, which wraps close to the skin around the outer knee.','Gastrocnemius and Soleus do the opposite action. This needs medical evaluation. It is not something to self-diagnose.'],
    lab:{set:{act:'explore',muscle:'tibant',view:'front',zoom:'lower'},look:'Read the action and nerve for Tibialis Anterior. Then compare with Gastrocnemius.'}}
]}});
