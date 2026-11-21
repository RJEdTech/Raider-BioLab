/* Test yourself questions for "Why can't you drink seawater?" (membrane transport story). Steps are 1-based story steps. */
TestYourself.mount({lab:'BioLab',id:'transport',title:'Raider BioLab · Why can’t you drink seawater?',el:'#ty',scrollTo:'#story',go:i=>window.Story.go(i),
 questions:[
 {q:'Fresh salad leaves go limp after sitting in salty dressing. Why?',choices:['Water leaves the leaf cells toward the saltier outside','Salt pushes into the cells and crushes them','Oil soaks into the cells','The cells burst'],answer:0,
  hint:'Water crosses both ways. Which side has fewer free water molecules when the outside is salty?',step:5,stepName:'make the outside saltier',
  why:'More water leaves the cells than comes in, so they shrink and the leaf goes limp. That is osmosis.'},
 {q:'A red blood cell is placed in pure water. What happens?',choices:['Water rushes in, the cell swells, and it can burst','It shrivels','Nothing happens','Salt rushes in'],answer:0,
  hint:'Now the outside has no salt at all. Which way does more water cross?',step:6,stepName:'now take the salt away',
  why:'More water enters than leaves, and a red blood cell has no wall to stop it, so it swells and can burst.'},
 {q:'Which of these passes straight through the cell membrane without a channel or a pump?',choices:['Oxygen','A sodium ion (Na⁺)','Glucose','A large protein'],answer:0,
  hint:'Remember the three things you sent at the wall. Which one slipped right through?',step:3,stepName:'a wall that picks what passes',
  why:'Small, uncharged oxygen slips through the membrane. Charged ions need channels, and glucose needs a transporter.'},
 {q:'The sodium-potassium pump spends 1 ATP to move 3 Na⁺ out and 2 K⁺ in. How many ATP does it spend to move 30 Na⁺ out?',answer:10,tol:.01,unit:'ATP',
  hint:v=>Math.abs(v-90)<.01?'Each ATP moves 3 Na⁺, so divide, don’t multiply.':'Each ATP moves 3 Na⁺ out. How many groups of 3 are in 30?',step:7,stepName:'moving salt takes work',
  why:'30 ÷ 3 = 10 ATP. Moving salt against the flow always costs energy.'},
 {q:'Why does drinking seawater leave you thirstier?',choices:['Your kidneys need more water to get rid of the salt than the seawater gives you','Seawater has no water in it','Salt blocks your throat','The water evaporates in your stomach'],answer:0,
  hint:'Your blood gets saltier, so your cells lose water. What must your body spend to get rid of the extra salt?',step:8,stepName:'so why not drink seawater?',
  why:'Seawater is saltier than your kidneys can make urine, so flushing out its salt costs more water than you drank.'}]});
