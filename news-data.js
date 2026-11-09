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
