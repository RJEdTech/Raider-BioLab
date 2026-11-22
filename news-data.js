/* Raider Labs: In the News (data for news.html).
   Newest week first. To add a week: put its stories at the TOP of the array.
   Each story: id, week (YYYY-MM-DD, the Sunday it was added), date (event date),
   title, summary, numbers[] (each with its source link and date), concept{title,html},
   hook{prompt, parts[{label, answer, tol, unit, signHint?}], worked}, hides, evidence,
   investigate, related[{href, label}].
   Rules: every number has a source and date; label company-reported figures;
   name agencies and programs, never parties; no em dashes. */
window.RAIDER_NEWS = [
 {
  "id": "who-tb-report-2026",
  "week": "2026-11-22",
  "date": "2026-11-12",
  "title": "WHO: TB deaths have fallen 35% since 2015, and treatment has saved an estimated 86 million lives",
  "summary": "The World Health Organization released its Global Tuberculosis Report 2026 on November 12. Deaths from tuberculosis (TB), a bacterial lung disease, keep falling, though the world is about five years behind its targets and millions of cases are still missed.",
  "numbers": [
   "About 1.13 million people died of TB in 2025, down from 1.18 million in 2024 and 1.74 million in 2015, a 35% drop since 2015 (<a href=\"https://healthpolicy-watch.news/global-tuberculosis-burden-declining-but-five-years-behind-schedule/\" target=\"_blank\" rel=\"noopener\">Health Policy Watch, reporting the WHO Global TB Report 2026, Nov 13, 2026</a>).",
   "New TB cases in 2025: 129 per 100,000 people, down from 131 in 2024 and 14% lower than in 2015; the End TB Strategy milestone for 2025 was a 50% drop (<a href=\"https://healthpolicy-watch.news/global-tuberculosis-burden-declining-but-five-years-behind-schedule/\" target=\"_blank\" rel=\"noopener\">Health Policy Watch, reporting the WHO Global TB Report 2026, Nov 13, 2026</a>).",
   "About 10.6 million people fell ill with TB in 2025; 8.4 million were diagnosed, leaving about 2.2 million undiagnosed or unreported (<a href=\"https://www.manoramayearbook.in/current-affairs/world/2026/11/14/who-global-tuberculosis-report-2026.html\" target=\"_blank\" rel=\"noopener\">Manorama Yearbook, reporting the WHO Global TB Report 2026, Nov 14, 2026</a>).",
   "TB treatment has saved an estimated 86 million lives since 2000 (<a href=\"https://www.manoramayearbook.in/current-affairs/world/2026/11/14/who-global-tuberculosis-report-2026.html\" target=\"_blank\" rel=\"noopener\">Manorama Yearbook, reporting the WHO Global TB Report 2026, Nov 14, 2026</a>).",
   "About 370,000 people developed TB resistant to the drug rifampicin in 2025, and 42% of them got treatment (<a href=\"https://www.manoramayearbook.in/current-affairs/world/2026/11/14/who-global-tuberculosis-report-2026.html\" target=\"_blank\" rel=\"noopener\">Manorama Yearbook, reporting the WHO Global TB Report 2026, Nov 14, 2026</a>).",
   "Funding for TB care reached $6.6 billion in 2025, about 30% of the $22 billion a year targeted for 2027 (<a href=\"https://healthpolicy-watch.news/global-tuberculosis-burden-declining-but-five-years-behind-schedule/\" target=\"_blank\" rel=\"noopener\">Health Policy Watch, reporting the WHO Global TB Report 2026, Nov 13, 2026</a>)."
  ],
  "concept": {
   "title": "Why TB is treated with several antibiotics at once",
   "html": "TB is caused by the bacterium <i>Mycobacterium tuberculosis</i>, which spreads through the air and grows very slowly, so treatment lasts months. In a large population of bacteria, a few may already carry a random mutation that resists one drug. If you treat with that drug alone, those few survive and multiply: natural selection in action. Resistance to two different drugs usually needs two separate mutations, so the chances <b>multiply</b>: if 1 in a million resists drug A and 1 in 100 million resists drug B, only about 1 in 10<sup>14</sup> resists both. That is why TB patients take a combination of drugs, and why stopping early is dangerous."
  },
  "hook": {
   "prompt": "Parts (a) and (b) use the report's numbers. Part (c) uses made-up teaching numbers: a patient's lungs hold 10<sup>9</sup> TB bacteria; 1 in 10<sup>6</sup> resists drug A and 1 in 10<sup>8</sup> resists drug B, independently.",
   "parts": [
    {
     "label": "(a) By what percent did TB deaths fall from 2015 (1.74 million) to 2025 (1.13 million)?",
     "answer": 35.1,
     "tol": 0.2,
     "unit": "%"
    },
    {
     "label": "(b) What percent of the 10.6 million people who fell ill in 2025 were diagnosed?",
     "answer": 79.2,
     "tol": 0.3,
     "unit": "%"
    },
    {
     "label": "(c) About how many of the 10<sup>9</sup> bacteria resist drug A?",
     "answer": 1000,
     "tol": 1,
     "unit": "bacteria"
    },
    {
     "label": "(d) To expect even one bacterium resistant to both drugs, how many times more than 10<sup>9</sup> bacteria would there need to be?",
     "answer": 100000,
     "tol": 1,
     "unit": "times"
    }
   ],
   "worked": "(a) 1.74 &minus; 1.13 = 0.61 million fewer deaths. 0.61 &divide; 1.74 = 0.351, about <b>35.1%</b>. (b) 8.4 &divide; 10.6 = 0.792, about <b>79.2%</b>; about 1 in 5 cases was missed. (c) 10<sup>9</sup> &times; 10<sup>&minus;6</sup> = <b>1,000 bacteria</b>: one drug alone would leave a resistant population to regrow. (d) Both: 10<sup>&minus;6</sup> &times; 10<sup>&minus;8</sup> = 10<sup>&minus;14</sup>. You would need 10<sup>14</sup> bacteria to expect one, and 10<sup>14</sup> &divide; 10<sup>9</sup> = <b>100,000 times</b> more than the patient has. Two drugs together almost never fail at once."
  },
  "hides": "Deaths are estimates built from death records, surveys and models, especially in countries where many deaths are not registered. About 2.2 million cases were never diagnosed, so the counts depend on how hard countries look. Progress is uneven: the report shows a 42% drop in new cases in the European Region since 2015 but only 6.6% in the Eastern Mediterranean Region. Drug-resistant TB is rising as a share of the problem, and less than half of those cases got treatment. The mutation rates in the hook are teaching numbers, not measured values.",
  "evidence": "Strong: WHO's annual report, built from country data. This page read news coverage of the report, not the WHO report itself, and the two sources describe the 2030 target differently (80% or 90% fewer cases), so that target is not quoted.",
  "investigate": "Open WHO's <a href=\"https://www.who.int/teams/global-tuberculosis-programme/tb-reports/global-tuberculosis-report-2025\" target=\"_blank\" rel=\"noopener\">Global TB Report 2025 page</a> and find the estimated TB deaths for 2024. Use it with this year's 1.13 million for 2025. What one-year percent change do you get, and does it match the 4% drop reported?",
  "related": [
   {
    "href": "index.html#antibiotic",
    "label": "Antibiotic resistance: evolution you can watch"
   },
   {
    "href": "index.html#epidemic",
    "label": "Epidemics and herd immunity"
   }
  ]
 },
 {
  "id": "cervical-cancer-elimination-day-2026",
  "week": "2026-11-22",
  "date": "2026-11-17",
  "title": "166 countries now vaccinate against HPV, and the first cancer ever targeted for elimination is in sight",
  "summary": "On November 17, the world marked the first official World Cervical Cancer Elimination Day. WHO's Director-General and co-authors wrote that 166 countries now include the HPV vaccine in routine immunization, and that Australia and Sweden are approaching the elimination of cervical cancer as a public health problem.",
  "numbers": [
   "166 countries have introduced HPV vaccination, including Burundi, Papua New Guinea and Ukraine in the past year (<a href=\"https://allafrica.com/stories/202611160848.html\" target=\"_blank\" rel=\"noopener\">column by WHO Director-General Tedros Adhanom Ghebreyesus and co-authors, via allAfrica, Nov 16, 2026</a>).",
   "96 countries report using a one-dose schedule (<a href=\"https://allafrica.com/stories/202611160848.html\" target=\"_blank\" rel=\"noopener\">column by WHO Director-General Tedros Adhanom Ghebreyesus and co-authors, via allAfrica, Nov 16, 2026</a>).",
   "Global HPV vaccination coverage has reached 33% (<a href=\"https://allafrica.com/stories/202611160848.html\" target=\"_blank\" rel=\"noopener\">column by WHO Director-General Tedros Adhanom Ghebreyesus and co-authors, via allAfrica, Nov 16, 2026</a>). The column does not say which year or which age group.",
   "More than 600,000 women are diagnosed with cervical cancer each year, and about 280,000 die (<a href=\"https://allafrica.com/stories/202611160848.html\" target=\"_blank\" rel=\"noopener\">column by WHO Director-General Tedros Adhanom Ghebreyesus and co-authors, via allAfrica, Nov 16, 2026</a>).",
   "The 2030 targets: 90% of girls vaccinated, 70% of women screened, and 90% of women with precancer or cancer treated (<a href=\"https://allafrica.com/stories/202611160848.html\" target=\"_blank\" rel=\"noopener\">column by WHO Director-General Tedros Adhanom Ghebreyesus and co-authors, via allAfrica, Nov 16, 2026</a>; <a href=\"https://www.who.int/campaigns/world-cervical-cancer-elimination-day/2026\" target=\"_blank\" rel=\"noopener\">WHO, World Cervical Cancer Elimination Day 2026, Nov 17, 2026</a>).",
   "194 countries adopted the WHO elimination strategy on November 17, 2020, the first global commitment to eliminate a cancer (<a href=\"https://www.who.int/campaigns/world-cervical-cancer-elimination-day/2026\" target=\"_blank\" rel=\"noopener\">WHO, World Cervical Cancer Elimination Day 2026, Nov 17, 2026</a>)."
  ],
  "concept": {
   "title": "How a virus causes cancer, and how a vaccine stops it",
   "html": "Almost all cervical cancer starts with a long-lasting infection by certain types of human papillomavirus (HPV). The virus makes two proteins, E6 and E7, that switch off the cell's own brakes on the cell cycle: E6 leads to the breakdown of p53, and E7 blocks Rb. With the brakes off, infected cells keep dividing and collect more mutations over years. The vaccine contains only the virus's outer shell protein (L1) assembled into empty <b>virus-like particles</b>, with no viral DNA, so it cannot infect anyone. The immune system learns to make antibodies against that shell and blocks the real virus before it ever gets into cells. Because cancer takes years to develop after infection, vaccinating girls today prevents cancers decades from now."
  },
  "hook": {
   "prompt": "Use the numbers from the column.",
   "parts": [
    {
     "label": "(a) What percent of the 166 countries use a one-dose schedule?",
     "answer": 57.8,
     "tol": 0.3,
     "unit": "%"
    },
    {
     "label": "(b) Coverage must go from 33% to the 90% target. How many times today's coverage is that?",
     "answer": 2.73,
     "tol": 0.02,
     "unit": "times"
    },
    {
     "label": "(c) About 280,000 deaths and 600,000 new cases a year: deaths are what percent of new cases?",
     "answer": 46.7,
     "tol": 0.3,
     "unit": "%"
    }
   ],
   "worked": "(a) 96 &divide; 166 = 0.578, about <b>57.8%</b>. (b) 90 &divide; 33 = <b>2.73 times</b>. (c) 280,000 &divide; 600,000 = 0.467, about <b>46.7%</b>. This is a rough ratio, not a death rate: this year's deaths are mostly among women diagnosed in earlier years, and survival is much higher where screening and treatment are available."
  },
  "hides": "The 33% coverage figure comes without its year, age group or number of doses, so it cannot be compared directly with the 90% target. The case and death totals are rounded and the column did not cite their source. \"Elimination as a public health problem\" does not mean zero cases: in WHO's 2020 strategy it means fewer than 4 new cases per 100,000 women per year (that threshold was not in the pages read this week). Vaccination prevents future cancers, so screening still matters for women who were never vaccinated.",
  "evidence": "Moderate to strong: an opinion column by WHO's Director-General and other leaders, plus WHO's own campaign page. WHO's November 17 news update on screening and treatment could not be opened by this automated run, so its figures are not included.",
  "investigate": "Open the <a href=\"https://immunizationdata.who.int/\" target=\"_blank\" rel=\"noopener\">WHO immunization data portal</a> and search for HPV vaccination coverage in the United States and in one other country you choose. Which is closer to 90%? What does the portal count: first dose or last dose, girls or boys?",
  "related": [
   {
    "href": "index.html#cellcycle",
    "label": "Cell cycle and cancer"
   },
   {
    "href": "index.html#virus",
    "label": "Viruses: lytic and lysogenic"
   }
  ]
 },
 {
  "id": "frisco-creek-bears-2026",
  "week": "2026-11-15",
  "date": "2026-11-12",
  "title": "Colorado: a record 47 orphaned bear cubs were nursed back to health at Frisco Creek",
  "summary": "Colorado Parks and Wildlife's Frisco Creek Wildlife Rehabilitation Center took in a record 47 orphaned black bear cubs in 2026, after drought, late spring freezes and wildfires caused what CPW calls the worst statewide year for bear food since 2008. Most will go back to the wild this fall.",
  "numbers": [
   "47 cubs in 2026, a record for the center; about 20 a year on average over 15 years; 29 in 2025 (<a href=\"https://coloradooutdoorsmag.com/2026/11/12/orphaned-burned-and-broken-the-frisco-creek-bears-of-2026/\" target=\"_blank\" rel=\"noopener\">Colorado Outdoors (CPW), Nov 12, 2026</a>).",
   "A yearling burned on all four paws in a wildfire arrived on July 20 at 31 lb and is now past 120 lb (<a href=\"https://coloradooutdoorsmag.com/2026/11/12/orphaned-burned-and-broken-the-frisco-creek-bears-of-2026/\" target=\"_blank\" rel=\"noopener\">Colorado Outdoors, Nov 12, 2026</a>).",
   "Release minimums: 70 lb for males and 60 lb for females; most cubs weigh 80 to 100 lb (<a href=\"https://coloradooutdoorsmag.com/2026/11/12/orphaned-burned-and-broken-the-frisco-creek-bears-of-2026/\" target=\"_blank\" rel=\"noopener\">Colorado Outdoors, Nov 12, 2026</a>).",
   "About 31 cubs are expected to be released this fall; the rest go to dens or stay until spring. 10 will wear GPS collars, tracked for up to 18 months, paid for by a Great Outdoors Colorado grant (<a href=\"https://coloradooutdoorsmag.com/2026/11/12/orphaned-burned-and-broken-the-frisco-creek-bears-of-2026/\" target=\"_blank\" rel=\"noopener\">Colorado Outdoors, Nov 12, 2026</a>).",
   "Where they came from: Southeast 21, Northeast 18, Southwest 7, Northwest 1 (<a href=\"https://coloradooutdoorsmag.com/2026/11/12/orphaned-burned-and-broken-the-frisco-creek-bears-of-2026/\" target=\"_blank\" rel=\"noopener\">Colorado Outdoors, Nov 12, 2026</a>)."
  ],
  "concept": {
   "title": "Food webs and a fat budget",
   "html": "Black bears depend on wild foods such as berries, acorns and other <b>mast</b>. A late freeze can kill flowers before they become fruit, and drought shrinks what plants produce, so less energy moves up the food web from producers to bears. A bear must store enough fat in late summer and fall to survive months in a den without eating. That is why rehab centers set release weights: below a minimum, a cub may not have the energy reserve to make it through winter."
  },
  "hook": {
   "prompt": "Use CPW's numbers.",
   "parts": [
    {
     "label": "(a) How many times the 15-year average (about 20 a year) is this year's 47 cubs?",
     "answer": 2.35,
     "tol": 0.02,
     "unit": "times"
    },
    {
     "label": "(b) By what percent did the number of cubs rise from 2025 (29) to 2026 (47)?",
     "answer": 62.1,
     "tol": 0.4,
     "unit": "%"
    },
    {
     "label": "(c) The burned yearling went from 31 lb on July 20 to at least 120 lb by Nov 12 (115 days). What was its average gain, in lb per day?",
     "answer": 0.77,
     "tol": 0.02,
     "unit": "lb/day"
    }
   ],
   "worked": "(a) 47 &divide; 20 = <b>2.35 times</b>. (b) (47 &minus; 29) &divide; 29 = 18 &divide; 29 = 0.621, a <b>62.1%</b> rise. (c) 120 &minus; 31 = 89 lb. July 20 to Nov 12 is 11 + 31 + 30 + 31 + 12 = 115 days. 89 &divide; 115 = <b>0.77 lb per day</b>, at least, since it is \"past\" 120 lb."
  },
  "hides": "The rescue is good news, but the reason for the record is not: a failed food year that pushed hungry bears into trouble. A record at one center also depends on how many cubs people report and how many the center can take. How many released cubs survive is not known yet; the GPS collars are how CPW will find out. The source is CPW's own magazine.",
  "evidence": "Moderate: counts from the state wildlife agency that runs the center. Release numbers are staff projections. The CPW press release itself could not be opened by this automated run; the numbers come from CPW's Colorado Outdoors article.",
  "investigate": "The <a href=\"https://droughtmonitor.unl.edu/\" target=\"_blank\" rel=\"noopener\">US Drought Monitor</a> has weekly drought maps. Compare Colorado's map in July 2026 with July 2025. Do the driest areas match the regions most cubs came from?",
  "related": [
   {
    "href": "index.html#popgrowth",
    "label": "Population growth: deer on an island"
   },
   {
    "href": "index.html#productivity",
    "label": "Primary productivity"
   }
  ]
 },
 {
  "id": "fda-factor-xia-stroke-2026",
  "week": "2026-11-15",
  "date": "2026-11-09",
  "title": "FDA approves the first factor XIa blocker to help prevent a second stroke",
  "summary": "The US Food and Drug Administration (FDA) approved asundexian, made by Bayer, for adults who recently had a mild to moderate ischemic stroke (a clot blocking blood to the brain) or a high-risk mini-stroke. It blocks one enzyme in the blood clotting cascade and is taken along with antiplatelet medicine.",
  "numbers": [
   "The OCEANIC-STROKE trial was phase 3, randomized, double-blind and placebo-controlled, with 12,327 adults (<a href=\"https://www.fda.gov/news-events/press-announcements/fda-approves-first-factor-xla-inhibitor-help-prevent-stroke-certain-adults-high-risk\" target=\"_blank\" rel=\"noopener\">FDA, Nov 9, 2026</a>).",
   "Patients were enrolled within 72 hours of their symptoms (<a href=\"https://www.fda.gov/news-events/press-announcements/fda-approves-first-factor-xla-inhibitor-help-prevent-stroke-certain-adults-high-risk\" target=\"_blank\" rel=\"noopener\">FDA, Nov 9, 2026</a>).",
   "Risk of another ischemic stroke was 26% lower than with placebo, over a median of 14.2 months of treatment (<a href=\"https://www.fda.gov/news-events/press-announcements/fda-approves-first-factor-xla-inhibitor-help-prevent-stroke-certain-adults-high-risk\" target=\"_blank\" rel=\"noopener\">FDA, Nov 9, 2026</a>).",
   "Major bleeding overall was similar to placebo, but higher in patients over 75 and in the first 90 days; stomach and gut bleeding was more common (<a href=\"https://www.fda.gov/news-events/press-announcements/fda-approves-first-factor-xla-inhibitor-help-prevent-stroke-certain-adults-high-risk\" target=\"_blank\" rel=\"noopener\">FDA, Nov 9, 2026</a>).",
   "It is the FDA's 48th novel drug approval of 2026 (<a href=\"https://www.fda.gov/drugs/novel-drug-approvals-fda/novel-drug-approvals-2026\" target=\"_blank\" rel=\"noopener\">FDA Novel Drug Approvals 2026, as of Nov 9, 2026</a>)."
  ],
  "concept": {
   "title": "A cascade of enzymes",
   "html": "A blood clot forms through a <b>cascade</b>: one clotting factor, an enzyme, activates many copies of the next, which each activate many of the next, so a small signal is amplified into a large clot. Factor XI (\"eleven\") is one step. Researchers think it matters more for clots growing inside blood vessels than for sealing a cut, so blocking it may prevent strokes with less bleeding than older blood thinners. The trial tested that idea against a placebo."
  },
  "hook": {
   "prompt": "The FDA page gives a relative risk reduction (26%) but not the stroke rate in each group. Suppose, as a made-up example, that 6.0% of the placebo group had another stroke.",
   "parts": [
    {
     "label": "(a) With 26% lower risk, what percent of the drug group would have a stroke?",
     "answer": 4.44,
     "tol": 0.03,
     "unit": "%"
    },
    {
     "label": "(b) What is the absolute risk reduction, in percentage points?",
     "answer": 1.56,
     "tol": 0.03,
     "unit": "points"
    },
    {
     "label": "(c) Number needed to treat: about how many people must take the drug to prevent one stroke?",
     "answer": 64,
     "tol": 1,
     "unit": "people"
    }
   ],
   "worked": "(a) 6.0% &times; (1 &minus; 0.26) = 6.0 &times; 0.74 = <b>4.44%</b>. (b) 6.0 &minus; 4.44 = <b>1.56 percentage points</b>. (c) 1 &divide; 0.0156 = 64.1, so about <b>64 people</b> treated for about 14 months to prevent one stroke. The same 26% would mean a much larger number needed to treat if the starting risk were lower. That is why you need both numbers."
  },
  "hides": "A relative reduction sounds the same whether the starting risk is high or low; the absolute numbers decide how much difference it makes to one person. The 6.0% here is invented for practice; the real rates are in the trial report, not on the FDA page. Bleeding risk was higher in people over 75 and early in treatment, and the drug is not approved for strokes caused by atrial fibrillation.",
  "evidence": "Strong: a federal approval based on a large phase 3 randomized, double-blind, placebo-controlled trial. The stroke rate in each group, the absolute risk reduction and confidence intervals were not on the FDA page and were not checked.",
  "investigate": "Search <a href=\"https://clinicaltrials.gov/search?term=OCEANIC-STROKE\" target=\"_blank\" rel=\"noopener\">ClinicalTrials.gov for OCEANIC-STROKE</a>. What was the trial's primary outcome, and how long were patients followed?",
  "related": [
   {
    "href": "index.html#enzymes",
    "label": "Catalase activity: how enzymes work"
   },
   {
    "href": "index.html#homeostasis",
    "label": "Homeostasis"
   }
  ]
 },
 {
  "id": "small-populations-2026",
  "week": "2026-11-08",
  "date": "2026-11-05",
  "title": "Tiny animal populations can bounce back with help",
  "summary": "Researchers at Monash University and the Zoological Society of London reviewed every bird and mammal species known to have fallen below 50 wild animals since 1950. With direct help, most of them grew back.",
  "numbers": [
   "141 bird and mammal species had enough tracked history to study; 51 got direct conservation action (<a href=\"https://newshub.medianet.com.au/2026/11/small-populations-big-potential-new-research-overturns-extinction-assumptions/180371/\" target=\"_blank\" rel=\"noopener\">Monash University release, Nov 5, 2026</a>).",
   "61% of the 51 helped species recovered to at least 100 individuals (<a href=\"https://newshub.medianet.com.au/2026/11/small-populations-big-potential-new-research-overturns-extinction-assumptions/180371/\" target=\"_blank\" rel=\"noopener\">Monash University release, Nov 5, 2026</a>).",
   "Of species with no direct help, 37% went extinct and only 2% reached 100 (<a href=\"https://newshub.medianet.com.au/2026/11/small-populations-big-potential-new-research-overturns-extinction-assumptions/180371/\" target=\"_blank\" rel=\"noopener\">Monash University release, Nov 5, 2026</a>).",
   "The Lord Howe woodhen grew from 23 birds in the late 1970s to more than 1,600 today (<a href=\"https://newshub.medianet.com.au/2026/11/small-populations-big-potential-new-research-overturns-extinction-assumptions/180371/\" target=\"_blank\" rel=\"noopener\">Monash University release, Nov 5, 2026</a>).",
   "Paper: <i>Proceedings of the Royal Society B</i>, 2026, DOI <a href=\"https://doi.org/10.1098/rspb.2026.2436\" target=\"_blank\" rel=\"noopener\">10.1098/rspb.2026.2436</a>."
  ],
  "concept": {
   "title": "Exponential growth, then a ceiling",
   "html": "Very small populations face extra risks: a few unlucky births or deaths can wipe them out, and they lose genetic variety. Once the threats are removed (predators controlled, habitat restored, animals bred and moved), a population can grow by a roughly constant <b>percent</b> each year at first. That is exponential growth: N = N<sub>0</sub> &times; (1 + r)<sup>t</sup>. Later, growth slows as the population nears what its habitat can support (logistic growth). To find an average yearly rate, take the <b>t-th root</b> of the growth factor."
  },
  "hook": {
   "prompt": "(a) About how many of the 51 helped species reached 100 individuals? (b) If the woodhen grew from 23 to 1,600 birds over 47 years (assume 1979 to 2026), what average yearly growth rate does that imply?",
   "parts": [
    {
     "label": "(a) Number of helped species that recovered",
     "answer": 31,
     "tol": 0.6,
     "unit": "species"
    },
    {
     "label": "(b) Average yearly growth rate, as a percent",
     "answer": 9.4,
     "tol": 0.2,
     "unit": "% per year"
    }
   ],
   "worked": "(a) 0.61 &times; 51 = 31.1, so about <b>31 species</b>. (b) Growth factor = 1,600 &divide; 23 = 69.6. Yearly factor = 69.6<sup>1/47</sup> = 1.094, so about <b>9.4% per year</b> on average. The real growth was faster early and slower later, because the island has a ceiling."
  },
  "hides": "\"Late 1970s\" is approximate, so the 47-year span is our assumption. Reaching 100 animals is a milestone, not safety: the co-author notes that genetic risks are real (<a href=\"https://newshub.medianet.com.au/2026/11/small-populations-big-potential-new-research-overturns-extinction-assumptions/180371/\" target=\"_blank\" rel=\"noopener\">Monash University release, Nov 5, 2026</a>). Species that got help may differ from those that did not, so the comparison shows a pattern, not proof that each action works.",
  "evidence": "Moderate to strong. A peer-reviewed review of every known case since 1950. The paper itself could not be opened, and the size of the no-help group was not in the release.",
  "investigate": "The <a href=\"https://www.iucnredlist.org/\" target=\"_blank\" rel=\"noopener\">IUCN Red List</a> shows population trends. Find a species with a rising trend and estimate its yearly growth rate from two counts.",
  "related": [
   {
    "href": "index.html#popgrowth",
    "label": "Population growth: deer on an island"
   }
  ]
 },
 {
  "id": "who-ntd-2026",
  "week": "2026-11-08",
  "date": "2026-11-04",
  "title": "63 countries have now eliminated at least one neglected tropical disease",
  "summary": "WHO's Global report on neglected tropical diseases 2026 tracks diseases such as sleeping sickness, Guinea worm and river blindness that mostly affect the world's poorest communities. Fewer people need treatment than at any point WHO has tracked.",
  "numbers": [
   "63 countries had eliminated at least one neglected tropical disease (NTD) by June 2026, up from 42 at the end of 2020 (<a href=\"https://allafrica.com/stories/202611050063.html\" target=\"_blank\" rel=\"noopener\">WHO release of Nov 4, 2026, as reprinted by allAfrica</a>).",
   "1.41 billion people required NTD interventions in 2024, down 36% since 2010 and 19% since 2020 (<a href=\"https://allafrica.com/stories/202611050063.html\" target=\"_blank\" rel=\"noopener\">WHO release of Nov 4, 2026, as reprinted by allAfrica</a>).",
   "Sleeping sickness cases are down 98% since 1999, and Guinea worm fell to a record low of 10 human cases in 2025 (<a href=\"https://allafrica.com/stories/202611050063.html\" target=\"_blank\" rel=\"noopener\">WHO release of Nov 4, 2026, as reprinted by allAfrica</a>).",
   "2030 goals: 90% fewer people needing interventions than in 2010, and 100 countries eliminating at least one NTD (<a href=\"https://allafrica.com/stories/202611050063.html\" target=\"_blank\" rel=\"noopener\">WHO release of Nov 4, 2026, as reprinted by allAfrica</a>)."
  ],
  "concept": {
   "title": "Breaking the cycle, and running a percent change backward",
   "html": "Many NTDs pass through a cycle: a parasite, often a carrier such as a fly or a water snail, and a human host. Breaking any link (medicine for whole communities, clean water, or controlling the carrier) can push the average number of new cases caused by each case below 1, and then the disease shrinks. To undo a percent drop, divide: if a number fell 36%, today's value is 64% of the old one, so <b>old = today &divide; 0.64</b>. Subtracting 36% of today's number is a common mistake."
  },
  "hook": {
   "prompt": "Use WHO's numbers. (a) How many people needed NTD interventions in 2010? (b) In 2020? (c) Countries went from 42 (end of 2020) to 63 (June 2026). How many new countries per year are needed to reach 100 by the end of 2030?",
   "parts": [
    {
     "label": "(a) 2010, in billions of people",
     "answer": 2.2,
     "tol": 0.03,
     "unit": "billion"
    },
    {
     "label": "(b) 2020, in billions of people",
     "answer": 1.74,
     "tol": 0.03,
     "unit": "billion"
    },
    {
     "label": "(c) Countries per year needed, June 2026 to end of 2030",
     "answer": 8.2,
     "tol": 0.2,
     "unit": "per year"
    }
   ],
   "worked": "(a) 1.41 &divide; (1 &minus; 0.36) = 1.41 &divide; 0.64 = <b>2.20 billion</b>. (b) 1.41 &divide; 0.81 = <b>1.74 billion</b>. The 90% goal from 2010 would be about 0.22 billion. (c) 100 &minus; 63 = 37 countries in 4.5 years = <b>8.2 per year</b>. The past pace was 21 countries in 5.5 years, about 3.8 per year, so the goal needs more than double the pace."
  },
  "hides": "A global total can hide where things are getting worse: dengue reached a record 15.1 million cases in 2024, and yaws eradication is off track. Funding for NTD programs is about 30% below pre-COVID levels, and nearly 80% of 2018 to 2024 aid came from a small number of donors (<a href=\"https://allafrica.com/stories/202611050063.html\" target=\"_blank\" rel=\"noopener\">WHO release of Nov 4, 2026, as reprinted by allAfrica</a>).",
  "evidence": "Strong. An official WHO monitoring report. The numbers here come from WHO's release text as reprinted by allAfrica; the full report was not read.",
  "investigate": "WHO's <a href=\"https://www.who.int/data/gho/data/themes/neglected-tropical-diseases\" target=\"_blank\" rel=\"noopener\">Global Health Observatory</a> has NTD data by country. Pick one disease and graph the number of people needing treatment over time.",
  "related": [
   {
    "href": "index.html#epidemic",
    "label": "Epidemics and herd immunity"
   }
  ]
 },
 {
  "id": "barbados-hiv-2026",
  "week": "2026-11-08",
  "date": "2026-10-30",
  "title": "Barbados eliminates mother-to-child transmission of HIV",
  "summary": "WHO, through PAHO, validated Barbados as having eliminated mother-to-child transmission of HIV. Babies born there from 2022 to 2024 were protected by a chain of care: reach the mother, test her, and treat her.",
  "numbers": [
   "98% of pregnant women received antenatal care, 98% were tested for HIV, and 98% of pregnant women living with HIV were treated, 2022 to 2024 (<a href=\"https://www.paho.org/en/news/30-10-2026-barbados-eliminates-mother-child-transmission-hiv\" target=\"_blank\" rel=\"noopener\">PAHO/WHO, Oct 30, 2026</a>).",
   "No new HIV infections from mother-to-child transmission were reported among babies born in Barbados, 2022 to 2024 (<a href=\"https://www.paho.org/en/news/30-10-2026-barbados-eliminates-mother-child-transmission-hiv\" target=\"_blank\" rel=\"noopener\">PAHO/WHO, Oct 30, 2026</a>).",
   "Barbados joins 26 countries and territories recognized for this kind of elimination (HIV, syphilis or hepatitis B) or for being on track; 15 are in the Americas (<a href=\"https://www.paho.org/en/news/30-10-2026-barbados-eliminates-mother-child-transmission-hiv\" target=\"_blank\" rel=\"noopener\">PAHO/WHO, Oct 30, 2026</a>).",
   "15 of the 23 countries and territories with certified elimination of HIV transmission to babies are in the Americas (<a href=\"https://www.unaids.org/en/resources/presscentre/pressreleaseandstatementarchive/2026/october/20261030_PS_Barbados_emtct\" target=\"_blank\" rel=\"noopener\">UNAIDS, Oct 30, 2026</a>)."
  ],
  "concept": {
   "title": "How treatment stops a virus from reaching a baby",
   "html": "HIV is a retrovirus: it copies its RNA into DNA and uses the host cell to make new virus particles. Antiretroviral drugs block steps in that cycle, so the amount of virus in the mother's blood drops very low and far less can reach the baby during pregnancy, birth or breastfeeding. Prevention works as a <b>cascade</b>: each step only helps the people who made it through the step before, so the steps multiply. If 98% are tested and 98% of those who test positive are treated, about 0.98 &times; 0.98 = 96% of mothers with HIV are both found and treated (if the steps are independent)."
  },
  "hook": {
   "prompt": "PAHO says 15 of 26 recognized countries and territories are in the Americas. UNAIDS says 15 of 23. Find both percentages, then explain why they differ.",
   "parts": [
    {
     "label": "PAHO: 15 out of 26, as a percent",
     "answer": 57.7,
     "tol": 0.6,
     "unit": "%"
    },
    {
     "label": "UNAIDS: 15 out of 23, as a percent",
     "answer": 65.2,
     "tol": 0.6,
     "unit": "%"
    }
   ],
   "worked": "15 &divide; 26 = 0.577, or <b>57.7%</b>. 15 &divide; 23 = 0.652, or <b>65.2%</b>. The tops match but the bottoms count different things: PAHO's 26 includes syphilis, hepatitis B and \"on track\" recognitions, while UNAIDS's 23 counts HIV certifications only. Same numerator, different denominator, different answer. Always ask \"out of what?\""
  },
  "hides": "Barbados is small, and about 93% of births happen at one hospital, which makes it easier to reach every mother (<a href=\"https://www.paho.org/en/news/30-10-2026-barbados-eliminates-mother-child-transmission-hiv\" target=\"_blank\" rel=\"noopener\">PAHO/WHO, Oct 30, 2026</a>). Keeping the status needs continued testing, and PAHO notes syphilis testing must expand. A count of countries treats a small island and a huge country the same.",
  "evidence": "Strong. Official WHO validation after an in-country assessment. WHO's numeric validation thresholds were not in the pages read, so they are not quoted here.",
  "investigate": "Look up which other countries in the Americas are validated, and when, on the <a href=\"https://www.paho.org/en/topics/hiv-aids\" target=\"_blank\" rel=\"noopener\">PAHO HIV pages</a>. Make a timeline. Is the count speeding up?",
  "related": [
   {
    "href": "index.html#virus",
    "label": "Viruses: lytic and lysogenic cycles"
   }
  ]
 }
];
