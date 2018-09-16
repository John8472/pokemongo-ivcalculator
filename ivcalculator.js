// UTF8

class IvCalculatorCombo
{
	constructor(species, lvl, iv_sta, iv_atk, iv_def)
	{
		this.species = species;
		this.lvl = lvl;
		this.iv_sta = iv_sta;
		this.iv_atk = iv_atk;
		this.iv_def = iv_def;
	}

	clone()
	{
		return new IvCalculatorCombo(this.species, this.lvl, this.iv_sta, this.iv_atk, this.iv_def);
	}

	sta()
	{
		return IvCalculator.calc_sta(this.species, this.iv_sta, this.lvl);
	}

	atk()
	{
		return IvCalculator.calc_atk(this.species, this.iv_atk, this.lvl);
	}

	def()
	{
		return IvCalculator.calc_def(this.species, this.iv_def, this.lvl);
	}

	iv_total()
	{
		return this.iv_sta + this.iv_atk + this.iv_def;
	}

	iv_perc()
	{
		return this.iv_total() / 45;
	}

	hp()
	{
		return IvCalculator.calc_hp(this.species, this.iv_sta, this.lvl);
	}

	cp()
	{
		return IvCalculator.calc_cp(this.sta(), this.atk(), this.def());
	}

	compare_iv(oth)
	{
		if( this.iv_sta < oth.iv_sta ) return -1;
		if( oth.iv_sta < this.iv_sta ) return 1;

		if( this.iv_atk < oth.iv_atk ) return -1;
		if( oth.iv_atk < this.iv_atk ) return 1;

		if( this.iv_def < oth.iv_def ) return -1;
		if( oth.iv_def < this.iv_def ) return 1;

		return 0;
	}
};

class IvCalculator
{
	/**
	 * \brief
	 * Calculates the stamina value based on the species, iv and level
	 */
	static
	calc_sta(species, iv, lvl)
	{
		return (species.sta + iv) * IvCalculator.power_up_table[lvl][3];
	}

	/**
	 * \brief
	 * Calculates the attack value based on the species, iv and level
	 */
	static
	calc_atk(species, iv, lvl)
	{
		return (species.atk + iv) * IvCalculator.power_up_table[lvl][3];
	}

	/**
	 * \brief
	 * Calculates the defense value based on the species, iv and level
	 */
	static
	calc_def(species, iv, lvl)
	{
		return (species.def + iv) * IvCalculator.power_up_table[lvl][3];
	}

	/**
	 * \brief
	 * Calculates the hitpoints value based on the species, iv and level
	 */
	static
	calc_hp(species, iv, lvl)
	{
		return Math.floor( IvCalculator.calc_sta(species, iv, lvl) );
	}

	/**
	 * \brief
	 * Calculates the combat power value based on the stamina, attack and defense
	 *
	 * Note: These are not the IV values, but the actual values
	 */
	static
	calc_cp(sta, atk, def)
	{
		return Math.floor( Math.sqrt(sta) * atk * Math.sqrt(def) * 0.1);
	}

	constructor()
	{}

	ua_iv_range(appraisal)
	{
		appraisal.min_stat = {
			sta: 1,
			atk: 1,
			def: 1
		};

		appraisal.max_stat = {
			sta: 15,
			atk: 15,
			def: 15
		}

		if( appraisal.best_stat.iv.min ) {
			if( appraisal.best_stat.sta ) appraisal.min_stat.sta = appraisal.best_stat.iv.min;
			if( appraisal.best_stat.atk ) appraisal.min_stat.atk = appraisal.best_stat.iv.min;
			if( appraisal.best_stat.def ) appraisal.min_stat.def = appraisal.best_stat.iv.min;
		}

		if( appraisal.best_stat.iv.max ) {
			if( appraisal.best_stat.sta ) appraisal.max_stat.sta = appraisal.best_stat.iv.max;
			if( appraisal.best_stat.atk ) appraisal.max_stat.atk = appraisal.best_stat.iv.max;
			if( appraisal.best_stat.def ) appraisal.max_stat.def = appraisal.best_stat.iv.max;
		}
	}

	um_lvl_range(species, measurement)
	{
		measurement.min_lvl = -1;
		measurement.max_lvl = -1;

		{
			var lvl_idx = 0;

			//Find the first level that matches the stardust amount
			for(; lvl_idx < 80; ++lvl_idx) {
				if( IvCalculator.power_up_table[lvl_idx][1] < measurement.stardust ) continue;
				break;
			}

			//Within the stardust amount, find the first level that could
			//possibly be valid, even if the STA is max
			for(; lvl_idx < 80; ++lvl_idx) {
				if( IvCalculator.calc_hp(species, 15, lvl_idx) < measurement.hp ) continue;
				break;
			}

			//This is the minimum level
			measurement.min_lvl = lvl_idx;

			//Find the last level that is still valid
			for(; lvl_idx < 80; ++lvl_idx) {
				if( measurement.stardust == IvCalculator.power_up_table[lvl_idx][1] ) continue;
				break;
			}

			//TODO: Compare with calc_hp(species, 1, lvl_idx)?

			measurement.max_lvl = lvl_idx;
		}

		if( 80 <= measurement.max_lvl ) {
			alert('Invalid data');
			return false;
		}
	}

	get_possible_combinations(species, appraisal, measurement)
	{
		this.um_lvl_range(species, measurement);

		var possible_combos = [];

		for(var lvl_idx = measurement.min_lvl; lvl_idx <= measurement.max_lvl; ++lvl_idx) {

			if( (lvl_idx % 2 == 1) && !measurement.was_powered) continue;

			for(var it_sta = appraisal.min_stat.sta; it_sta <= appraisal.max_stat.sta; ++it_sta) {
				if( IvCalculator.calc_hp(species, it_sta, lvl_idx) != measurement.hp ) continue;

				let it_sta_val = IvCalculator.calc_sta(species, it_sta, lvl_idx);

				for(var it_atk = appraisal.min_stat.atk; it_atk <= appraisal.max_stat.atk; ++it_atk) {
					let it_atk_val = IvCalculator.calc_atk(species, it_atk, lvl_idx);

					for(var it_def = appraisal.min_stat.def; it_def <= appraisal.max_stat.def; ++it_def) {
						let it_def_val = IvCalculator.calc_def(species, it_def, lvl_idx);

						var total_iv = it_sta + it_atk + it_def;
						var combo_cp = IvCalculator.calc_cp(it_sta_val, it_atk_val, it_def_val);

						if( appraisal.best_stat.sta || appraisal.best_stat.atk || appraisal.best_stat.def ) {
							if( (appraisal.best_stat.sta || appraisal.best_stat.atk) && ((appraisal.best_stat.sta && appraisal.best_stat.atk) != (it_sta == it_atk)) ) continue;
							if( (appraisal.best_stat.sta || appraisal.best_stat.def) && ((appraisal.best_stat.sta && appraisal.best_stat.def) != (it_sta == it_def)) ) continue;
							if( (appraisal.best_stat.atk || appraisal.best_stat.def) && ((appraisal.best_stat.atk && appraisal.best_stat.def) != (it_atk == it_def)) ) continue;
//
//							if( (best_sta && !best_atk) && (it_sta < it_atk) ) continue;
//							if( (best_sta && !best_def) && (it_sta < it_def) ) continue;
//
//							if( (best_atk && !best_sta) && (it_atk < it_sta) ) continue;
//							if( (best_atk && !best_def) && (it_atk < it_def) ) continue;
//
//							if( (best_def && !best_sta) && (it_def < it_sta) ) continue;
//							if( (best_def && !best_atk) && (it_def < it_atk) ) continue;
						}

						if( (0 < appraisal.total.iv.min) && (total_iv < appraisal.total.iv.min) ) continue;
						if( (0 < appraisal.total.iv.max) && (appraisal.total.iv.max < total_iv) ) continue;

						if( combo_cp != measurement.cp ) continue;

						possible_combos.push(new IvCalculatorCombo(species, lvl_idx, it_sta, it_atk, it_def));
					}
				}
			}
		}

		return possible_combos;
	}

	calculate(species, appraisal, measurement_list)
	{
		if( !species.sta || !species.atk || !species.def ) {
			console.error('Species:', species)
			throw new Error('Invalid species');
		}

		if( !appraisal.best_stat ) {
			appraisal.best_stat = {'any': false, iv: null};
		} else {
			appraisal.best_stat.any = appraisal.best_stat.sta || appraisal.best_stat.atk || appraisal.best_stat.def;
		}

		this.ua_iv_range(appraisal);

		let possible_combos = false;

		for(let measurement of measurement_list) {
			let new_possible_combos = this.get_possible_combinations(species, appraisal, measurement);

			if( false === possible_combos ) {
				possible_combos = new_possible_combos;
				continue;
			}

			possible_combos = possible_combos.filter(function(combo) {
				return new_possible_combos.find(function(new_combo, idx, array) {
					return 0 == combo.compare_iv(new_combo);
				}, combo);
			});
		}

		return possible_combos;
	}
}

// https://bulbapedia.bulbagarden.net/wiki/Power_Up
IvCalculator.power_up_table = [[1,200,1,0.094],[2,200,1,0.1351374318],[3,200,1,0.16639787],[4,200,1,0.192650919],[5,400,1,0.21573247],[6,400,1,0.2365726613],[7,400,1,0.25572005],[8,400,1,0.2735303812],[9,600,1,0.29024988],[10,600,1,0.3060573775],[11,600,1,0.3210876],[12,600,1,0.3354450362],[13,800,1,0.34921268],[14,800,1,0.3624577511],[15,800,1,0.37523559],[16,800,1,0.3875924064],[17,1000,1,0.39956728],[18,1000,1,0.4111935514],[19,1000,1,0.42250001],[20,1000,1,0.4335116883],[21,1300,2,0.44310755],[22,1300,2,0.4530599591],[23,1300,2,0.46279839],[24,1300,2,0.4723360832],[25,1600,2,0.48168495],[26,1600,2,0.4908558003],[27,1600,2,0.49985844],[28,1600,2,0.508701765],[29,1900,2,0.51739395],[30,1900,2,0.5259425113],[31,1900,2,0.53435433],[32,1900,2,0.542635767],[33,2200,2,0.55079269],[34,2200,2,0.5588305763],[35,2200,2,0.56675452],[36,2200,2,0.574569153],[37,2500,2,0.58227891],[38,2500,2,0.5898879171],[39,2500,2,0.59740001],[40,2500,2,0.6048188139],[41,3000,3,0.61215729],[42,3000,3,0.6194041117],[43,3000,3,0.62656713],[44,3000,3,0.6336491729],[45,3500,3,0.64065295],[46,3500,3,0.6475809666],[47,3500,3,0.65443563],[48,3500,3,0.6612192524],[49,4000,3,0.667934],[50,4000,3,0.6745818959],[51,4000,4,0.68116492],[52,4000,4,0.6876849236],[53,4500,4,0.69414365],[54,4500,4,0.70054287],[55,4500,4,0.70688421],[56,4500,4,0.713169119],[57,5000,4,0.71939909],[58,5000,4,0.7255756036],[59,5000,4,0.7317],[60,5000,4,0.734741036],[61,6000,6,0.73776948],[62,6000,6,0.7407855738],[63,6000,6,0.74378943],[64,6000,6,0.7467812109],[65,7000,8,0.74976104],[66,7000,8,0.7527290867],[67,7000,8,0.75568551],[68,7000,8,0.7586303783],[69,8000,10,0.76156384],[70,8000,10,0.7644860647],[71,8000,10,0.76739717],[72,8000,10,0.7702972656],[73,9000,12,0.7731865],[74,9000,12,0.7760649616],[75,9000,12,0.77893275],[76,9000,12,0.7817900548],[77,10000,15,0.78463697],[78,10000,15,0.7874735776],[79,10000,15,0.79030001],[80,10000,15,0.7931163638]];

// https://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_by_base_stats_(Pok%C3%A9mon_GO)
IvCalculator.species_table = [[1,"Bulbasaur",90,118,118],[2,"Ivysaur",120,151,151],[3,"Venusaur",160,198,198],[4,"Charmander",78,116,96],[5,"Charmeleon",116,158,129],[6,"Charizard",156,223,176],[7,"Squirtle",88,94,122],[8,"Wartortle",118,126,155],[9,"Blastoise",158,171,210],[10,"Caterpie",90,55,62],[11,"Metapod",100,45,94],[12,"Butterfree",120,167,151],[13,"Weedle",80,63,55],[14,"Kakuna",90,46,86],[15,"Beedrill",130,169,150],[16,"Pidgey",80,85,76],[17,"Pidgeotto",126,117,108],[18,"Pidgeot",166,166,157],[19,"Rattata",60,103,70],[20,"Raticate",110,161,144],[21,"Spearow",80,112,61],[22,"Fearow",130,182,135],[23,"Ekans",70,110,102],[24,"Arbok",120,167,158],[25,"Pikachu",70,112,101],[26,"Raichu",120,193,165],[27,"Sandshrew",100,126,145],[28,"Sandslash",150,182,202],[29,"Nidoran♀",110,86,94],[30,"Nidorina",140,117,126],[31,"Nidoqueen",180,180,174],[32,"Nidoran♂",92,105,76],[33,"Nidorino",122,137,112],[34,"Nidoking",162,204,157],[35,"Clefairy",140,107,116],[36,"Clefable",190,178,171],[37,"Vulpix",76,96,122],[38,"Ninetales",146,169,204],[39,"Jigglypuff",230,80,44],[40,"Wigglytuff",280,156,93],[41,"Zubat",80,83,76],[42,"Golbat",150,161,153],[43,"Oddish",90,131,116],[44,"Gloom",120,153,139],[45,"Vileplume",150,202,170],[46,"Paras",70,121,99],[47,"Parasect",120,165,146],[48,"Venonat",120,100,102],[49,"Venomoth",140,179,150],[50,"Diglett",20,109,88],[51,"Dugtrio",70,167,147],[52,"Meowth",80,92,81],[53,"Persian",130,150,139],[54,"Psyduck",100,122,96],[55,"Golduck",160,191,163],[56,"Mankey",80,148,87],[57,"Primeape",130,207,144],[58,"Growlithe",110,136,96],[59,"Arcanine",180,227,166],[60,"Poliwag",80,101,82],[61,"Poliwhirl",130,130,130],[62,"Poliwrath",180,182,187],[63,"Abra",50,195,103],[64,"Kadabra",80,232,138],[65,"Alakazam",110,271,194],[66,"Machop",140,137,88],[67,"Machoke",160,177,130],[68,"Machamp",180,234,162],[69,"Bellsprout",100,139,64],[70,"Weepinbell",130,172,95],[71,"Victreebel",160,207,138],[72,"Tentacool",80,97,182],[73,"Tentacruel",160,166,237],[74,"Geodude",80,132,163],[75,"Graveler",110,164,196],[76,"Golem",160,211,229],[77,"Ponyta",100,170,132],[78,"Rapidash",130,207,167],[79,"Slowpoke",180,109,109],[80,"Slowbro",190,177,194],[81,"Magnemite",50,165,128],[82,"Magneton",100,223,182],[83,"Farfetch'd",104,124,118],[84,"Doduo",70,158,88],[85,"Dodrio",120,218,145],[86,"Seel",130,85,128],[87,"Dewgong",180,139,184],[88,"Grimer",160,135,90],[89,"Muk",210,190,184],[90,"Shellder",60,116,168],[91,"Cloyster",100,186,323],[92,"Gastly",60,186,70],[93,"Haunter",90,223,112],[94,"Gengar",120,261,156],[95,"Onix",70,85,288],[96,"Drowzee",120,89,158],[97,"Hypno",170,144,215],[98,"Krabby",60,181,156],[99,"Kingler",110,240,214],[100,"Voltorb",80,109,114],[101,"Electrode",120,173,179],[102,"Exeggcute",120,107,140],[103,"Exeggutor",190,233,158],[104,"Cubone",100,90,165],[105,"Marowak",120,144,200],[106,"Hitmonlee",100,224,211],[107,"Hitmonchan",100,193,212],[108,"Lickitung",180,108,137],[109,"Koffing",80,119,164],[110,"Weezing",130,174,221],[111,"Rhyhorn",160,140,157],[112,"Rhydon",210,222,206],[113,"Chansey",500,60,176],[114,"Tangela",130,183,205],[115,"Kangaskhan",210,181,165],[116,"Horsea",60,129,125],[117,"Seadra",110,187,182],[118,"Goldeen",90,123,115],[119,"Seaking",160,175,154],[120,"Staryu",60,137,112],[121,"Starmie",120,210,184],[122,"Mr. Mime",80,192,233],[123,"Scyther",140,218,170],[124,"Jynx",130,223,182],[125,"Electabuzz",130,198,173],[126,"Magmar",130,206,169],[127,"Pinsir",130,238,197],[128,"Tauros",150,198,197],[129,"Magikarp",40,29,102],[130,"Gyarados",190,237,197],[131,"Lapras",260,165,180],[132,"Ditto",96,91,91],[133,"Eevee",110,104,121],[134,"Vaporeon",260,205,177],[135,"Jolteon",130,232,201],[136,"Flareon",130,246,204],[137,"Porygon",130,153,139],[138,"Omanyte",70,155,174],[139,"Omastar",140,207,227],[140,"Kabuto",60,148,162],[141,"Kabutops",120,220,203],[142,"Aerodactyl",160,221,164],[143,"Snorlax",320,190,190],[144,"Articuno",180,192,249],[145,"Zapdos",180,253,188],[146,"Moltres",180,251,184],[147,"Dratini",82,119,94],[148,"Dragonair",122,163,138],[149,"Dragonite",182,263,201],[150,"Mewtwo",212,330,200],[151,"Mew",200,210,210],[152,"Chikorita",90,92,122],[153,"Bayleef",120,122,155],[154,"Meganium",160,168,202],[155,"Cyndaquil",78,116,96],[156,"Quilava",116,158,129],[157,"Typhlosion",156,223,176],[158,"Totodile",100,117,116],[159,"Croconaw",130,150,151],[160,"Feraligatr",170,205,197],[161,"Sentret",70,79,77],[162,"Furret",170,148,130],[163,"Hoothoot",120,67,101],[164,"Noctowl",200,145,179],[165,"Ledyba",80,72,142],[166,"Ledian",110,107,209],[167,"Spinarak",80,105,73],[168,"Ariados",140,161,128],[169,"Crobat",170,194,178],[170,"Chinchou",150,106,106],[171,"Lanturn",250,146,146],[172,"Pichu",40,77,63],[173,"Cleffa",100,75,91],[174,"Igglybuff",180,69,34],[175,"Togepi",70,67,116],[176,"Togetic",110,139,191],[177,"Natu",80,134,89],[178,"Xatu",130,192,146],[179,"Mareep",110,114,82],[180,"Flaaffy",140,145,112],[181,"Ampharos",180,211,172],[182,"Bellossom",150,169,189],[183,"Marill",140,37,93],[184,"Azumarill",200,112,152],[185,"Sudowoodo",140,167,198],[186,"Politoed",180,174,192],[187,"Hoppip",70,67,101],[188,"Skiploom",110,91,127],[189,"Jumpluff",150,118,197],[190,"Aipom",110,136,112],[191,"Sunkern",60,55,55],[192,"Sunflora",150,185,148],[193,"Yanma",130,154,94],[194,"Wooper",110,75,75],[195,"Quagsire",190,152,152],[196,"Espeon",130,261,194],[197,"Umbreon",190,126,250],[198,"Murkrow",120,175,87],[199,"Slowking",190,177,194],[200,"Misdreavus",120,167,167],[201,"Unown",96,136,91],[202,"Wobbuffet",380,60,106],[203,"Girafarig",140,182,133],[204,"Pineco",100,108,146],[205,"Forretress",150,161,242],[206,"Dunsparce",200,131,131],[207,"Gligar",130,143,204],[208,"Steelix",150,148,333],[209,"Snubbull",120,137,89],[210,"Granbull",180,212,137],[211,"Qwilfish",130,184,148],[212,"Scizor",140,236,191],[213,"Shuckle",40,17,396],[214,"Heracross",160,234,189],[215,"Sneasel",110,189,157],[216,"Teddiursa",120,142,93],[217,"Ursaring",180,236,144],[218,"Slugma",80,118,71],[219,"Magcargo",100,139,209],[220,"Swinub",100,90,74],[221,"Piloswine",200,181,147],[222,"Corsola",110,118,156],[223,"Remoraid",70,127,69],[224,"Octillery",150,197,141],[225,"Delibird",90,128,90],[226,"Mantine",130,148,260],[227,"Skarmory",130,148,260],[228,"Houndour",90,152,93],[229,"Houndoom",150,224,159],[230,"Kingdra",150,194,194],[231,"Phanpy",180,107,107],[232,"Donphan",180,214,214],[233,"Porygon2",170,198,183],[234,"Stantler",146,192,132],[235,"Smeargle",110,40,88],[236,"Tyrogue",70,64,64],[237,"Hitmontop",100,173,214],[238,"Smoochum",90,153,116],[239,"Elekid",90,135,110],[240,"Magby",90,151,108],[241,"Miltank",190,157,211],[242,"Blissey",510,129,229],[243,"Raikou",180,241,210],[244,"Entei",230,235,176],[245,"Suicune",200,180,235],[246,"Larvitar",100,115,93],[247,"Pupitar",140,155,133],[248,"Tyranitar",200,251,212],[249,"Lugia",212,193,323],[250,"Ho-Oh",212,263,301],[251,"Celebi",200,210,210],[252,"Treecko",80,124,104],[253,"Grovyle",100,172,130],[254,"Sceptile",140,223,180],[255,"Torchic",90,130,92],[256,"Combusken",120,163,115],[257,"Blaziken",160,240,141],[258,"Mudkip",100,126,93],[259,"Marshtomp",140,156,133],[260,"Swampert",200,208,175],[261,"Poochyena",70,96,63],[262,"Mightyena",140,171,137],[263,"Zigzagoon",76,58,80],[264,"Linoone",156,142,128],[265,"Wurmple",90,75,61],[266,"Silcoon",100,60,91],[267,"Beautifly",120,189,98],[268,"Cascoon",100,60,91],[269,"Dustox",120,98,172],[270,"Lotad",80,71,86],[271,"Lombre",120,112,128],[272,"Ludicolo",160,173,191],[273,"Seedot",80,71,86],[274,"Nuzleaf",140,134,78],[275,"Shiftry",180,200,121],[276,"Taillow",80,106,61],[277,"Swellow",120,185,130],[278,"Wingull",80,106,61],[279,"Pelipper",120,175,189],[280,"Ralts",56,79,63],[281,"Kirlia",76,117,100],[282,"Gardevoir",136,237,220],[283,"Surskit",80,93,97],[284,"Masquerain",140,192,161],[285,"Shroomish",120,74,110],[286,"Breloom",120,241,153],[287,"Slakoth",120,104,104],[288,"Vigoroth",160,159,159],[289,"Slaking",273,290,183],[290,"Nincada",62,80,153],[291,"Ninjask",122,199,116],[292,"Shedinja",2,153,80],[293,"Whismur",128,92,42],[294,"Loudred",168,134,81],[295,"Exploud",208,179,142],[296,"Makuhita",144,99,54],[297,"Hariyama",288,209,114],[298,"Azurill",100,36,71],[299,"Nosepass",60,82,236],[300,"Skitty",100,84,84],[301,"Delcatty",140,132,132],[302,"Sableye",100,141,141],[303,"Mawile",100,155,155],[304,"Aron",100,121,168],[305,"Lairon",120,158,240],[306,"Aggron",140,198,314],[307,"Meditite",60,78,107],[308,"Medicham",120,121,152],[309,"Electrike",80,123,78],[310,"Manectric",140,215,127],[311,"Plusle",120,167,147],[312,"Minun",120,147,167],[313,"Volbeat",130,143,171],[314,"Illumise",130,143,171],[315,"Roselia",100,186,148],[316,"Gulpin",140,80,99],[317,"Swalot",200,140,159],[318,"Carvanha",90,171,39],[319,"Sharpedo",140,243,83],[320,"Wailmer",260,136,68],[321,"Wailord",340,175,87],[322,"Numel",120,119,82],[323,"Camerupt",140,194,139],[324,"Torkoal",140,151,234],[325,"Spoink",120,125,145],[326,"Grumpig",160,171,211],[327,"Spinda",120,116,116],[328,"Trapinch",90,162,78],[329,"Vibrava",100,134,99],[330,"Flygon",160,205,168],[331,"Cacnea",100,156,74],[332,"Cacturne",140,221,115],[333,"Swablu",90,76,139],[334,"Altaria",150,141,208],[335,"Zangoose",146,222,124],[336,"Seviper",146,196,118],[337,"Lunatone",180,178,163],[338,"Solrock",180,178,163],[339,"Barboach",100,93,83],[340,"Whiscash",220,151,142],[341,"Corphish",86,141,113],[342,"Crawdaunt",126,224,156],[343,"Baltoy",80,77,131],[344,"Claydol",120,140,236],[345,"Lileep",132,105,154],[346,"Cradily",172,152,198],[347,"Anorith",90,176,100],[348,"Armaldo",150,222,183],[349,"Feebas",40,29,102],[350,"Milotic",190,192,242],[351,"Castform",140,139,139],[352,"Kecleon",120,161,212],[353,"Shuppet",88,138,66],[354,"Banette",128,218,127],[355,"Duskull",40,70,162],[356,"Dusclops",80,124,234],[357,"Tropius",198,136,165],[358,"Chimecho",150,175,174],[359,"Absol",130,246,120],[360,"Wynaut",190,41,86],[361,"Snorunt",100,95,95],[362,"Glalie",160,162,162],[363,"Spheal",140,95,90],[364,"Sealeo",180,137,132],[365,"Walrein",220,182,176],[366,"Clamperl",70,133,149],[367,"Huntail",110,197,194],[368,"Gorebyss",110,211,194],[369,"Relicanth",200,162,234],[370,"Luvdisc",86,81,134],[371,"Bagon",90,134,107],[372,"Shelgon",130,172,179],[373,"Salamence",190,277,168],[374,"Beldum",80,96,141],[375,"Metang",120,138,185],[376,"Metagross",160,257,248],[377,"Regirock",160,179,356],[378,"Regice",160,179,356],[379,"Registeel",160,143,285],[380,"Latias",160,228,268],[381,"Latios",160,268,228],[382,"Kyogre",200,297,276],[383,"Groudon",200,297,276],[384,"Rayquaza",210,312,187],[385,"Jirachi",200,210,210],[386,"Deoxys",100,345,115]];
