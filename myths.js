/* Myth or fact (idea from Dr. Sandy Robertson's ENSO Explorer, Nov 17, 2026).
   BioLab.addMyths({toolId:[{k,s,fact,why,lvl}]}): students pick Myth or Fact, one graded try, then read why.
   Mix in real facts so students can't just answer "myth" every time. Keep each statement one sentence. */
BioLab.addMyths({
plates:[
 {k:'float',s:'The continents float on a sea of melted rock.',fact:false,why:'The mantle under the plates is almost all solid rock. It flows very slowly, a few centimeters a year, like warm wax. Pockets of melt form only in certain places, such as above a sinking plate.'},
 {k:'speed',s:'Plates move about as fast as your fingernails grow.',fact:true,why:'Most plates move 2 to 10 cm a year. GPS stations measure it directly.'},
 {k:'ring',s:'Most of the world’s large earthquakes happen along plate boundaries.',fact:true,why:'Plates grind, pull apart or dive under each other at their edges. The Pacific “Ring of Fire” alone has about 80% of the largest quakes.'},
 {k:'colorado',s:'Colorado has no earthquakes because it is not on a plate boundary.',fact:false,why:'Quakes are rarer in the middle of a plate, but not absent. Colorado records small earthquakes most years, including some caused by injecting wastewater deep underground.'}
],
soil:[
 {k:'clay',s:'Clay soil holds the most water, so it is always best for plants.',fact:false,why:'Clay holds water but drains slowly and can drown roots. Loam, a mix of sand, silt and clay, holds water and still lets air reach roots.'},
 {k:'slow',s:'An inch of topsoil can take hundreds of years to form.',fact:true,why:'Rock breaks down and organic matter builds up slowly, so topsoil lost to erosion is not replaced on a human time scale.'},
 {k:'dirt',s:'Soil is just ground-up rock.',fact:false,why:'About half of good soil is pore space for air and water, and it holds organic matter and billions of living things in every handful.'},
 {k:'ph',s:'Soil pH changes how easily plants can take up nutrients.',fact:true,why:'At very low or high pH, nutrients like phosphorus bind to other minerals and roots can’t take them up, even when a soil test shows they are there.'}
],
seasons:[
 {k:'close',s:'Summer happens because Earth is closer to the Sun.',fact:false,why:'Earth is actually closest to the Sun in early January. Seasons come from Earth’s 23.5° tilt: in summer your half leans toward the Sun, so sunlight hits more directly and days are longer.'},
 {k:'opposite',s:'When it is summer in Colorado, it is winter in Australia.',fact:true,why:'The tilt points one hemisphere toward the Sun while the other leans away, so the seasons are opposite.'},
 {k:'equator',s:'Air rises at the equator and sinks around 30° north and south, which is why many deserts sit near 30°.',fact:true,why:'Rising air cools and drops its rain over the tropics. The dry air sinks near 30°, where the Sahara, the Atacama and Australia’s deserts are.'},
 {k:'wind',s:'Winds blow straight from high pressure to low pressure.',fact:false,why:'Earth’s spin bends moving air (the Coriolis effect), so the trade winds blow from the east and the westerlies from the west instead of straight north or south.'}
],
albedo:[
 {k:'snow',s:'Fresh snow reflects most of the sunlight that hits it.',fact:true,why:'Fresh snow reflects about 80 to 90%. Melting it exposes darker ground that absorbs more heat, which melts more snow.'},
 {k:'ocean',s:'Open ocean reflects more sunlight than sea ice.',fact:false,why:'Dark ocean water absorbs about 90% of sunlight; sea ice reflects most of it. As Arctic ice melts, the ocean warms faster.'},
 {k:'roof',s:'Painting roofs white can make a city cooler.',fact:true,why:'Light roofs reflect sunlight that a dark roof would turn into heat. Cool roofs can lower roof temperatures by tens of degrees and cut air conditioning use.'},
 {k:'black',s:'A black car and a white car parked in the sun get equally hot.',fact:false,why:'The black car absorbs far more sunlight, so its surface and inside get noticeably hotter.'}
],
enso:[
 {k:'every',s:'El Niño comes every year around Christmas.',fact:false,why:'Fishers named the warm current for the Christ child because it showed up near Christmas, but El Niño events come irregularly, every 2 to 7 years.'},
 {k:'warm',s:'During El Niño, warm water spreads east toward South America.',fact:true,why:'The trade winds weaken, so warm water that usually piles up near Indonesia slides east. Upwelling of cold water off Peru weakens.'},
 {k:'fish',s:'El Niño can hurt Peru’s anchovy catch.',fact:true,why:'Warm surface water caps the cold, nutrient-rich upwelling, plankton drops, and anchovies, the fish and the seabirds that eat them all suffer.'},
 {k:'all',s:'El Niño makes every place on Earth warmer and drier.',fact:false,why:'It shifts rain and heat. Indonesia and Australia often get drier, while Peru’s coast and the southern United States often get wetter.'}
]
});
