/* Test yourself questions for "Why does a cracker turn sweet?" (enzymes story). Steps are 1-based story steps. */
TestYourself.mount({lab:'BioLab',id:'enzymes',title:'Raider BioLab · Why does a cracker turn sweet?',el:'#ty',scrollTo:'#story',go:i=>window.Story.go(i),
 questions:[
 {q:'Lactase is the enzyme that breaks down lactose, the sugar in milk. Which of these can lactase break down?',choices:['Only lactose, because only lactose fits its pocket','Any sugar','Fat and protein too','Anything, as long as it is warm'],answer:0,
  hint:'Remember what happened when fat and protein met amylase. Did they fit the groove?',step:4,stepName:'only starch fits',
  why:'An enzyme’s pocket fits one kind of molecule. Lactase fits lactose, just as amylase fits starch.'},
 {q:'A cracker on a plate stays starchy for days, but in your mouth it turns sweet in a minute. Why?',choices:['Amylase lowers the energy hill, so the bonds break far more often','Your mouth is hotter than the plate','Chewing breaks the bonds by itself','The air takes the sugar away'],answer:0,
  hint:'Starch can break apart on its own. How often does a bond get over the hill without help?',step:5,stepName:'why you need the enzyme',
  why:'Without the enzyme almost no bond gets over the hill. Amylase lowers the hill, so the same bonds break thousands of times faster.'},
 {q:'In this model, amylase’s rate doubles for every 10 °C warmer, until it starts to unfold near 44 °C. At 17 °C it makes 20 sugars a minute. How many does it make at 37 °C?',answer:80,tol:.01,unit:'sugars a minute',
  hint:v=>Math.abs(v-40)<.01?'40 is one doubling (17 to 27 °C). 37 °C is two doublings warmer.':'17 °C to 37 °C is 20 °C warmer: two steps of 10 °C. Double, then double again.',step:8,stepName:'build the graph yourself',
  why:'20 → 40 at 27 °C → 80 at 37 °C. Warmer molecules hit the enzyme more often and harder.'},
 {q:'Amylase is boiled for a minute, then cooled back to 37 °C. Does it work?',choices:['No: the heat unfolded it, and its shape does not come back','Yes, as soon as it cools','Yes, even faster than before','Only if you add acid'],answer:0,
  hint:'In ice water the enzyme was slow but fine. What happened to its shape in the hot coffee?',step:7,stepName:'hot coffee',
  why:'Heat unfolds the enzyme. Without its shape, the pocket is gone, and cooling does not fold it back.'},
 {q:'Amylase works best near pH 6.8. Stomach acid is about pH 2. What happens to amylase when you swallow?',choices:['It stops working, and pepsin, which works best near pH 2, digests protein instead','It works faster in the acid','It keeps breaking down starch all the way down','It turns into pepsin'],answer:0,
  hint:'Each enzyme has a pH where it works best. How far is pH 2 from 6.8?',step:9,stepName:'swallow: acid switches it off',
  why:'At pH 2 amylase barely works. Pepsin is built for acid, so starch digestion pauses and protein digestion starts.'}]});
