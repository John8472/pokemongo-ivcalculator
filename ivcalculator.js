// UTF8

class PokemonSpecies
{
	constructor(id, name, sta, atk, def, cap, flee, maxcp, type1, type2, _, variant)
	{
		this.id = id;
		this.name = name;
		this.sta = sta;
		this.atk = atk;
		this.def = def;
		this.cap = cap;
		this.flee = flee;
		this.maxcp = maxcp;
		this.type1 = type1;
		this.type2 = type2;
		this.variant = variant;
		this.evolutions = new Map();
	}
}

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
		let hp = Math.floor( IvCalculator.calc_sta(species, iv, lvl) );
		if( hp < 10 ) hp = 10;
		return hp;
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
		let cp = Math.floor( Math.sqrt(sta) * atk * Math.sqrt(def) * 0.1);
		if( cp < 10 ) cp = 10;
		return cp;
	}

	constructor()
	{}

	ua_iv_range(appraisal)
	{
		appraisal.min_stat = {
			sta: 0,
			atk: 0,
			def: 0
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

							if( (appraisal.best_stat.sta && !appraisal.best_stat.atk) && (it_sta < it_atk) ) continue;
							if( (appraisal.best_stat.sta && !appraisal.best_stat.def) && (it_sta < it_def) ) continue;

							if( (appraisal.best_stat.atk && !appraisal.best_stat.sta) && (it_atk < it_sta) ) continue;
							if( (appraisal.best_stat.atk && !appraisal.best_stat.def) && (it_atk < it_def) ) continue;

							if( (appraisal.best_stat.def && !appraisal.best_stat.sta) && (it_def < it_sta) ) continue;
							if( (appraisal.best_stat.def && !appraisal.best_stat.atk) && (it_def < it_atk) ) continue;
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

// https://pokeassistant.com/main/pokemonstats
IvCalculator.name_mapping = [[1,"Bulbasaur"],[2,"Ivysaur"],[3,"Venusaur"],[4,"Charmander"],[5,"Charmeleon"],[6,"Charizard"],[7,"Squirtle"],[8,"Wartortle"],[9,"Blastoise"],[10,"Caterpie"],[11,"Metapod"],[12,"Butterfree"],[13,"Weedle"],[14,"Kakuna"],[15,"Beedrill"],[16,"Pidgey"],[17,"Pidgeotto"],[18,"Pidgeot"],[19,"Rattata"],[20,"Raticate"],[21,"Spearow"],[22,"Fearow"],[23,"Ekans"],[24,"Arbok"],[25,"Pikachu"],[26,"Raichu"],[27,"Sandshrew"],[28,"Sandslash"],[29,"Nidoran♀"],[30,"Nidorina"],[31,"Nidoqueen"],[32,"Nidoran♂"],[33,"Nidorino"],[34,"Nidoking"],[35,"Clefairy"],[36,"Clefable"],[37,"Vulpix"],[38,"Ninetales"],[39,"Jigglypuff"],[40,"Wigglytuff"],[41,"Zubat"],[42,"Golbat"],[43,"Oddish"],[44,"Gloom"],[45,"Vileplume"],[46,"Paras"],[47,"Parasect"],[48,"Venonat"],[49,"Venomoth"],[50,"Diglett"],[51,"Dugtrio"],[52,"Meowth"],[53,"Persian"],[54,"Psyduck"],[55,"Golduck"],[56,"Mankey"],[57,"Primeape"],[58,"Growlithe"],[59,"Arcanine"],[60,"Poliwag"],[61,"Poliwhirl"],[62,"Poliwrath"],[63,"Abra"],[64,"Kadabra"],[65,"Alakazam"],[66,"Machop"],[67,"Machoke"],[68,"Machamp"],[69,"Bellsprout"],[70,"Weepinbell"],[71,"Victreebel"],[72,"Tentacool"],[73,"Tentacruel"],[74,"Geodude"],[75,"Graveler"],[76,"Golem"],[77,"Ponyta"],[78,"Rapidash"],[79,"Slowpoke"],[80,"Slowbro"],[81,"Magnemite"],[82,"Magneton"],[83,"Farfetch'd"],[84,"Doduo"],[85,"Dodrio"],[86,"Seel"],[87,"Dewgong"],[88,"Grimer"],[89,"Muk"],[90,"Shellder"],[91,"Cloyster"],[92,"Gastly"],[93,"Haunter"],[94,"Gengar"],[95,"Onix"],[96,"Drowzee"],[97,"Hypno"],[98,"Krabby"],[99,"Kingler"],[100,"Voltorb"],[101,"Electrode"],[102,"Exeggcute"],[103,"Exeggutor"],[104,"Cubone"],[105,"Marowak"],[106,"Hitmonlee"],[107,"Hitmonchan"],[108,"Lickitung"],[109,"Koffing"],[110,"Weezing"],[111,"Rhyhorn"],[112,"Rhydon"],[113,"Chansey"],[114,"Tangela"],[115,"Kangaskhan"],[116,"Horsea"],[117,"Seadra"],[118,"Goldeen"],[119,"Seaking"],[120,"Staryu"],[121,"Starmie"],[122,"Mr. Mime"],[123,"Scyther"],[124,"Jynx"],[125,"Electabuzz"],[126,"Magmar"],[127,"Pinsir"],[128,"Tauros"],[129,"Magikarp"],[130,"Gyarados"],[131,"Lapras"],[132,"Ditto"],[133,"Eevee"],[134,"Vaporeon"],[135,"Jolteon"],[136,"Flareon"],[137,"Porygon"],[138,"Omanyte"],[139,"Omastar"],[140,"Kabuto"],[141,"Kabutops"],[142,"Aerodactyl"],[143,"Snorlax"],[144,"Articuno"],[145,"Zapdos"],[146,"Moltres"],[147,"Dratini"],[148,"Dragonair"],[149,"Dragonite"],[150,"Mewtwo"],[151,"Mew"],[152,"Chikorita"],[153,"Bayleef"],[154,"Meganium"],[155,"Cyndaquil"],[156,"Quilava"],[157,"Typhlosion"],[158,"Totodile"],[159,"Croconaw"],[160,"Feraligatr"],[161,"Sentret"],[162,"Furret"],[163,"Hoothoot"],[164,"Noctowl"],[165,"Ledyba"],[166,"Ledian"],[167,"Spinarak"],[168,"Ariados"],[169,"Crobat"],[170,"Chinchou"],[171,"Lanturn"],[172,"Pichu"],[173,"Cleffa"],[174,"Igglybuff"],[175,"Togepi"],[176,"Togetic"],[177,"Natu"],[178,"Xatu"],[179,"Mareep"],[180,"Flaaffy"],[181,"Ampharos"],[182,"Bellossom"],[183,"Marill"],[184,"Azumarill"],[185,"Sudowoodo"],[186,"Politoed"],[187,"Hoppip"],[188,"Skiploom"],[189,"Jumpluff"],[190,"Aipom"],[191,"Sunkern"],[192,"Sunflora"],[193,"Yanma"],[194,"Wooper"],[195,"Quagsire"],[196,"Espeon"],[197,"Umbreon"],[198,"Murkrow"],[199,"Slowking"],[200,"Misdreavus"],[201,"Unown"],[202,"Wobbuffet"],[203,"Girafarig"],[204,"Pineco"],[205,"Forretress"],[206,"Dunsparce"],[207,"Gligar"],[208,"Steelix"],[209,"Snubbull"],[210,"Granbull"],[211,"Qwilfish"],[212,"Scizor"],[213,"Shuckle"],[214,"Heracross"],[215,"Sneasel"],[216,"Teddiursa"],[217,"Ursaring"],[218,"Slugma"],[219,"Magcargo"],[220,"Swinub"],[221,"Piloswine"],[222,"Corsola"],[223,"Remoraid"],[224,"Octillery"],[225,"Delibird"],[226,"Mantine"],[227,"Skarmory"],[228,"Houndour"],[229,"Houndoom"],[230,"Kingdra"],[231,"Phanpy"],[232,"Donphan"],[233,"Porygon2"],[234,"Stantler"],[235,"Smeargle"],[236,"Tyrogue"],[237,"Hitmontop"],[238,"Smoochum"],[239,"Elekid"],[240,"Magby"],[241,"Miltank"],[242,"Blissey"],[243,"Raikou"],[244,"Entei"],[245,"Suicune"],[246,"Larvitar"],[247,"Pupitar"],[248,"Tyranitar"],[249,"Lugia"],[250,"Ho-Oh"],[251,"Celebi"],[252,"Treecko"],[253,"Grovyle"],[254,"Sceptile"],[255,"Torchic"],[256,"Combusken"],[257,"Blaziken"],[258,"Mudkip"],[259,"Marshtomp"],[260,"Swampert"],[261,"Poochyena"],[262,"Mightyena"],[263,"Zigzagoon"],[264,"Linoone"],[265,"Wurmple"],[266,"Silcoon"],[267,"Beautifly"],[268,"Cascoon"],[269,"Dustox"],[270,"Lotad"],[271,"Lombre"],[272,"Ludicolo"],[273,"Seedot"],[274,"Nuzleaf"],[275,"Shiftry"],[276,"Taillow"],[277,"Swellow"],[278,"Wingull"],[279,"Pelipper"],[280,"Ralts"],[281,"Kirlia"],[282,"Gardevoir"],[283,"Surskit"],[284,"Masquerain"],[285,"Shroomish"],[286,"Breloom"],[287,"Slakoth"],[288,"Vigoroth"],[289,"Slaking"],[290,"Nincada"],[291,"Ninjask"],[292,"Shedinja"],[293,"Whismur"],[294,"Loudred"],[295,"Exploud"],[296,"Makuhita"],[297,"Hariyama"],[298,"Azurill"],[299,"Nosepass"],[300,"Skitty"],[301,"Delcatty"],[302,"Sableye"],[303,"Mawile"],[304,"Aron"],[305,"Lairon"],[306,"Aggron"],[307,"Meditite"],[308,"Medicham"],[309,"Electrike"],[310,"Manectric"],[311,"Plusle"],[312,"Minun"],[313,"Volbeat"],[314,"Illumise"],[315,"Roselia"],[316,"Gulpin"],[317,"Swalot"],[318,"Carvanha"],[319,"Sharpedo"],[320,"Wailmer"],[321,"Wailord"],[322,"Numel"],[323,"Camerupt"],[324,"Torkoal"],[325,"Spoink"],[326,"Grumpig"],[327,"Spinda"],[328,"Trapinch"],[329,"Vibrava"],[330,"Flygon"],[331,"Cacnea"],[332,"Cacturne"],[333,"Swablu"],[334,"Altaria"],[335,"Zangoose"],[336,"Seviper"],[337,"Lunatone"],[338,"Solrock"],[339,"Barboach"],[340,"Whiscash"],[341,"Corphish"],[342,"Crawdaunt"],[343,"Baltoy"],[344,"Claydol"],[345,"Lileep"],[346,"Cradily"],[347,"Anorith"],[348,"Armaldo"],[349,"Feebas"],[350,"Milotic"],[351,"Castform"],[352,"Kecleon"],[353,"Shuppet"],[354,"Banette"],[355,"Duskull"],[356,"Dusclops"],[357,"Tropius"],[358,"Chimecho"],[359,"Absol"],[360,"Wynaut"],[361,"Snorunt"],[362,"Glalie"],[363,"Spheal"],[364,"Sealeo"],[365,"Walrein"],[366,"Clamperl"],[367,"Huntail"],[368,"Gorebyss"],[369,"Relicanth"],[370,"Luvdisc"],[371,"Bagon"],[372,"Shelgon"],[373,"Salamence"],[374,"Beldum"],[375,"Metang"],[376,"Metagross"],[377,"Regirock"],[378,"Regice"],[379,"Registeel"],[380,"Latias"],[381,"Latios"],[382,"Kyogre"],[383,"Groudon"],[384,"Rayquaza"],[385,"Jirachi"],[386,"Deoxys"],[387,"Turtwig"],[388,"Grotle"],[389,"Torterra"],[390,"Chimchar"],[391,"Monferno"],[392,"Infernape"],[393,"Piplup"],[394,"Prinplup"],[395,"Empoleon"],[396,"Starly"],[397,"Staravia"],[398,"Staraptor"],[399,"Bidoof"],[400,"Bibarel"],[401,"Kricketot"],[402,"Kricketune"],[403,"Shinx"],[404,"Luxio"],[405,"Luxray"],[406,"Budew"],[407,"Roserade"],[408,"Cranidos"],[409,"Rampardos"],[410,"Shieldon"],[411,"Bastiodon"],[412,"Burmy"],[413,"Wormadam"],[414,"Mothim"],[415,"Combee"],[416,"Vespiquen"],[417,"Pachirisu"],[418,"Buizel"],[419,"Floatzel"],[420,"Cherubi"],[421,"Cherrim"],[422,"Shellos"],[423,"Gastrodon"],[424,"Ambipom"],[425,"Drifloon"],[426,"Drifblim"],[427,"Buneary"],[428,"Lopunny"],[429,"Mismagius"],[430,"Honchkrow"],[431,"Glameow"],[432,"Purugly"],[433,"Chingling"],[434,"Stunky"],[435,"Skuntank"],[436,"Bronzor"],[437,"Bronzong"],[438,"Bonsly"],[439,"Mime Jr."],[440,"Happiny"],[441,"Chatot"],[442,"Spiritomb"],[443,"Gible"],[444,"Gabite"],[445,"Garchomp"],[446,"Munchlax"],[447,"Riolu"],[448,"Lucario"],[449,"Hippopotas"],[450,"Hippowdon"],[451,"Skorupi"],[452,"Drapion"],[453,"Croagunk"],[454,"Toxicroak"],[455,"Carnivine"],[456,"Finneon"],[457,"Lumineon"],[458,"Mantyke"],[459,"Snover"],[460,"Abomasnow"],[461,"Weavile"],[462,"Magnezone"],[463,"Lickilicky"],[464,"Rhyperior"],[465,"Tangrowth"],[466,"Electivire"],[467,"Magmortar"],[468,"Togekiss"],[469,"Yanmega"],[470,"Leafeon"],[471,"Glaceon"],[472,"Gliscor"],[473,"Mamoswine"],[474,"Porygon-Z"],[475,"Gallade"],[476,"Probopass"],[477,"Dusknoir"],[478,"Froslass"],[479,"Rotom"],[480,"Uxie"],[481,"Mesprit"],[482,"Azelf"],[483,"Dialga"],[484,"Palkia"],[485,"Heatran"],[486,"Regigigas"],[487,"Giratina"],[488,"Cresselia"],[489,"Phione"],[490,"Manaphy"],[491,"Darkrai"],[492,"Shaymin"],[493,"Arceus"],[494,"Victini"],[495,"Snivy"],[496,"Servine"],[497,"Serperior"],[498,"Tepig"],[499,"Pignite"],[500,"Emboar"],[501,"Oshawott"],[502,"Dewott"],[503,"Samurott"],[504,"Patrat"],[505,"Watchog"],[506,"Lillipup"],[507,"Herdier"],[508,"Stoutland"],[509,"Purrloin"],[510,"Liepard"],[511,"Pansage"],[512,"Simisage"],[513,"Pansear"],[514,"Simisear"],[515,"Panpour"],[516,"Simipour"],[517,"Munna"],[518,"Musharna"],[519,"Pidove"],[520,"Tranquill"],[521,"Unfezant"],[522,"Blitzle"],[523,"Zebstrika"],[524,"Roggenrola"],[525,"Boldore"],[526,"Gigalith"],[527,"Woobat"],[528,"Swoobat"],[529,"Drilbur"],[530,"Excadrill"],[531,"Audino"],[532,"Timburr"],[533,"Gurdurr"],[534,"Conkeldurr"],[535,"Tympole"],[536,"Palpitoad"],[537,"Seismitoad"],[538,"Throh"],[539,"Sawk"],[540,"Sewaddle"],[541,"Swadloon"],[542,"Leavanny"],[543,"Venipede"],[544,"Whirlipede"],[545,"Scolipede"],[546,"Cottonee"],[547,"Whimsicott"],[548,"Petilil"],[549,"Lilligant"],[550,"Basculin"],[551,"Sandile"],[552,"Krokorok"],[553,"Krookodile"],[554,"Darumaka"],[555,"Darmanitan"],[556,"Maractus"],[557,"Dwebble"],[558,"Crustle"],[559,"Scraggy"],[560,"Scrafty"],[561,"Sigilyph"],[562,"Yamask"],[563,"Cofagrigus"],[564,"Tirtouga"],[565,"Carracosta"],[566,"Archen"],[567,"Archeops"],[568,"Trubbish"],[569,"Garbodor"],[570,"Zorua"],[571,"Zoroark"],[572,"Minccino"],[573,"Cinccino"],[574,"Gothita"],[575,"Gothorita"],[576,"Gothitelle"],[577,"Solosis"],[578,"Duosion"],[579,"Reuniclus"],[580,"Ducklett"],[581,"Swanna"],[582,"Vanillite"],[583,"Vanillish"],[584,"Vanilluxe"],[585,"Deerling"],[586,"Sawsbuck"],[587,"Emolga"],[588,"Karrablast"],[589,"Escavalier"],[590,"Foongus"],[591,"Amoonguss"],[592,"Frillish"],[593,"Jellicent"],[594,"Alomomola"],[595,"Joltik"],[596,"Galvantula"],[597,"Ferroseed"],[598,"Ferrothorn"],[599,"Klink"],[600,"Klang"],[601,"Klinklang"],[602,"Tynamo"],[603,"Eelektrik"],[604,"Eelektross"],[605,"Elgyem"],[606,"Beheeyem"],[607,"Litwick"],[608,"Lampent"],[609,"Chandelure"],[610,"Axew"],[611,"Fraxure"],[612,"Haxorus"],[613,"Cubchoo"],[614,"Beartic"],[615,"Cryogonal"],[616,"Shelmet"],[617,"Accelgor"],[618,"Stunfisk"],[619,"Mienfoo"],[620,"Mienshao"],[621,"Druddigon"],[622,"Golett"],[623,"Golurk"],[624,"Pawniard"],[625,"Bisharp"],[626,"Bouffalant"],[627,"Rufflet"],[628,"Braviary"],[629,"Vullaby"],[630,"Mandibuzz"],[631,"Heatmor"],[632,"Durant"],[633,"Deino"],[634,"Zweilous"],[635,"Hydreigon"],[636,"Larvesta"],[637,"Volcarona"],[638,"Cobalion"],[639,"Terrakion"],[640,"Virizion"],[641,"Tornadus"],[642,"Thundurus"],[643,"Reshiram"],[644,"Zekrom "],[645,"Landorus"],[646,"Kyurem"],[647,"Keldeo"],[648,"Meloetta"],[649,"Genesect"],[650,"Chespin"],[651,"Quilladin"],[652,"Chesnaught"],[653,"Fennekin"],[654,"Braixen"],[655,"Delphox"],[656,"Froakie"],[657,"Frogadier"],[658,"Greninja"],[659,"Bunnelby"],[660,"Diggersby"],[661,"Fletchling"],[662,"Fletchinder"],[663,"Talonflame"],[664,"Scatterbug"],[665,"Spewpa"],[666,"Vivillon"],[667,"Litleo"],[668,"Pyroar"],[669,"Flabébé"],[670,"Floette"],[671,"Florges"],[672,"Skiddo"],[673,"Gogoat"],[674,"Pancham"],[675,"Pangoro"],[676,"Furfrou"],[677,"Espurr"],[678,"Meowstic"],[679,"Honedge"],[680,"Doublade"],[681,"Aegislash"],[682,"Spritzee"],[683,"Aromatisse"],[684,"Swirlix"],[685,"Slurpuff"],[686,"Inkay"],[687,"Malamar"],[688,"Binacle"],[689,"Barbaracle"],[690,"Skrelp"],[691,"Dragalge"],[692,"Clauncher"],[693,"Clawitzer"],[694,"Helioptile"],[695,"Heliolisk"],[696,"Tyrunt"],[697,"Tyrantrum"],[698,"Amaura"],[699,"Aurorus"],[700,"Sylveon"],[701,"Hawlucha"],[702,"Dedenne"],[703,"Carbink"],[704,"Goomy"],[705,"Sliggoo"],[706,"Goodra"],[707,"Klefki"],[708,"Phantump"],[709,"Trevenant"],[710,"Pumpkaboo"],[711,"Gourgeist"],[712,"Bergmite"],[713,"Avalugg"],[714,"Noibat"],[715,"Noivern"],[716,"Xerneas"],[717,"Yveltal"],[718,"Zygarde"],[719,"Diancie"],[720,"Hoopa"],[721,"Volcanion"],[722,"Rowlet"],[723,"Dartrix"],[724,"Decidueye"],[725,"Litten"],[726,"Torracat"],[727,"Incineroar"],[728,"Popplio"],[729,"Brionne"],[730,"Primarina"],[731,"Pikipek"],[732,"Trumbeak"],[733,"Toucannon"],[734,"Yungoos"],[735,"Gumshoos"],[736,"Grubbin"],[737,"Charjabug"],[738,"Vikavolt"],[739,"Crabrawler"],[740,"Crabominable"],[741,"Oricorio"],[742,"Cutiefly"],[743,"Ribombee"],[744,"Rockruff"],[745,"Lycanroc"],[746,"Wishiwashi"],[747,"Mareanie"],[748,"Toxapex"],[749,"Mudbray"],[750,"Mudsdale"],[751,"Dewpider"],[752,"Araquanid"],[753,"Fomantis"],[754,"Lurantis"],[755,"Morelull"],[756,"Shiinotic"],[757,"Salandit"],[758,"Salazzle"],[759,"Stufful"],[760,"Bewear"],[761,"Bounsweet"],[762,"Steenee"],[763,"Tsareena"],[764,"Comfey"],[765,"Oranguru"],[766,"Passimian"],[767,"Wimpod"],[768,"Golisopod"],[769,"Sandygast"],[770,"Palossand"],[771,"Pyukumuku"],[772,"Type: Null"],[773,"Silvally"],[774,"Minior"],[775,"Komala"],[776,"Turtonator"],[777,"Togedemaru"],[778,"Mimikyu"],[779,"Bruxish"],[780,"Drampa"],[781,"Dhelmise"],[782,"Jangmo-o"],[783,"Hakamo-o"],[784,"Kommo-o"],[785,"Tapu Koko"],[786,"Tapu Lele"],[787,"Tapu Bulu"],[788,"Tapu Fini"],[789,"Cosmog"],[790,"Cosmoem"],[791,"Solgaleo"],[792,"Lunala"],[793,"Nihilego"],[794,"Buzzwole"],[795,"Pheromosa"],[796,"Xurkitree"],[797,"Celesteela"],[798,"Kartana"],[799,"Guzzlord"],[800,"Necrozma"],[801,"Magearna"],[802,"Marshadow"],[803,"Poipole"],[804,"Naganadel"],[805,"Stakataka"],[806,"Blacephalon"],[807,"Zeraora"],[808,"Meltan"],[809,"Melmetal"]];

// https://pokeassistant.com/main/pokemonstats
IvCalculator.species_table = [[1,[128,118,111,20,10,1115,12,4,1]],[2,[155,151,143,10,7,1699,12,4,1]],[3,[190,198,189,5,5,2720,12,4,1]],[4,[118,116,93,20,10,980,10,null,1]],[5,[151,158,126,10,7,1653,10,null,1]],[6,[186,223,173,5,5,2889,10,3,1]],[7,[127,94,121,20,10,946,11,null,1]],[8,[153,126,155,10,7,1488,11,null,1]],[9,[188,171,207,5,5,2466,11,null,1]],[10,[128,55,55,50,20,437,7,null,1]],[11,[137,45,80,25,9,450,7,null,1]],[12,[155,167,137,12,6,1827,7,3,1]],[13,[120,63,50,50,20,456,7,4,1]],[14,[128,46,75,25,9,432,7,4,1]],[15,[163,169,130,12,6,1846,7,4,1]],[16,[120,85,73,50,20,680,1,3,1]],[17,[160,117,105,25,9,1194,1,3,1]],[18,[195,166,154,12,6,2129,1,3,1]],[19,[102,103,70,50,20,734,1,null,1]],[20,[146,161,139,20,7,1730,1,null,1]],[21,[120,112,60,50,15,798,1,3,1]],[22,[163,182,133,20,7,1997,1,3,1]],[23,[111,110,97,50,15,927,4,null,1]],[24,[155,167,153,20,7,1921,4,null,1]],[25,[111,112,96,20,10,938,13,null,1]],[26,[155,193,151,10,6,2182,13,null,1]],[27,[137,126,120,50,10,1261,5,null,1]],[28,[181,182,175,20,6,2374,5,null,1]],[29,[146,86,89,50,15,816,4,null,1]],[30,[172,117,120,25,7,1309,4,null,1]],[31,[207,180,173,12,5,2488,4,5,1]],[32,[130,105,76,50,15,860,4,null,1]],[33,[156,137,111,25,7,1393,4,null,1]],[34,[191,204,156,12,5,2567,4,5,1]],[35,[172,107,108,30,10,1155,18,null,1]],[36,[216,178,162,10,6,2437,18,null,1]],[37,[116,96,109,30,10,883,10,null,1]],[38,[177,169,190,10,6,2279,10,null,1]],[39,[251,80,41,50,10,724,1,18,1]],[40,[295,156,90,20,6,1926,1,18,1]],[41,[120,83,73,50,20,667,4,3,1]],[42,[181,161,150,20,7,1976,4,3,1]],[43,[128,131,112,60,15,1228,12,4,1]],[44,[155,153,136,30,7,1681,12,4,1]],[45,[181,202,167,15,5,2559,12,4,1]],[46,[111,121,99,40,15,1018,7,12,1]],[47,[155,165,146,20,7,1859,7,12,1]],[48,[155,100,100,50,15,1004,7,4,1]],[49,[172,179,143,20,7,2082,7,4,1]],[50,[67,109,78,50,10,676,5,null,1]],[51,[111,167,134,20,6,1557,5,null,1]],[52,[120,92,78,50,15,748,1,null,1]],[53,[163,150,136,20,7,1689,1,null,1]],[54,[137,122,95,50,10,1106,11,null,1]],[55,[190,191,162,20,6,2450,11,null,1]],[56,[120,148,82,50,10,1164,2,null,1]],[57,[163,207,138,20,6,2288,2,null,1]],[58,[146,136,93,30,10,1243,10,null,1]],[59,[207,227,166,10,6,3029,10,null,1]],[60,[120,101,82,50,15,829,11,null,1]],[61,[163,130,123,25,7,1419,11,null,1]],[62,[207,182,184,12,5,2586,11,2,1]],[63,[93,195,82,50,99,1342,14,null,1]],[64,[120,232,117,25,7,2059,14,null,1]],[65,[146,271,167,10,5,3057,14,null,1]],[66,[172,137,82,50,10,1278,2,null,1]],[67,[190,177,125,25,7,2031,2,null,1]],[68,[207,234,159,10,5,3056,2,null,1]],[69,[137,139,61,50,15,1033,12,4,1]],[70,[163,172,92,25,7,1611,12,4,1]],[71,[190,207,135,12,5,2431,12,4,1]],[72,[120,97,149,50,15,1040,11,4,1]],[73,[190,166,209,20,7,2422,11,4,1]],[74,[120,132,132,50,10,1293,6,5,1]],[75,[146,164,164,25,7,1897,6,5,1]],[76,[190,211,198,12,5,2949,6,5,1]],[77,[137,170,127,40,10,1697,10,null,1]],[78,[163,207,162,15,6,2461,10,null,1]],[79,[207,109,98,50,10,1226,11,14,1]],[80,[216,177,180,20,6,2545,11,14,1]],[81,[93,165,121,50,10,1362,13,9,1]],[82,[137,223,169,20,6,2485,13,9,1]],[83,[141,124,115,30,9,1236,1,3,1]],[84,[111,158,83,50,10,1200,1,3,1]],[85,[155,218,140,20,6,2362,1,3,1]],[86,[163,85,121,50,9,971,11,null,1]],[87,[207,139,177,20,6,1985,11,15,1]],[88,[190,135,90,50,10,1374,4,null,1]],[89,[233,190,172,20,6,2757,4,null,1]],[90,[102,116,134,50,10,1080,11,null,1]],[91,[137,186,256,20,6,2547,11,15,1]],[92,[102,186,67,40,10,1229,8,4,1]],[93,[128,223,107,20,7,1963,8,4,1]],[94,[155,261,149,10,5,2878,8,4,1]],[95,[111,85,232,20,9,1101,6,5,1]],[96,[155,89,136,50,10,1040,14,null,1]],[97,[198,144,193,20,6,2090,14,null,1]],[98,[102,181,124,50,15,1561,11,null,1]],[99,[146,240,181,20,7,2829,11,null,1]],[100,[120,109,111,50,10,1010,13,null,1]],[101,[155,173,173,20,6,2099,13,null,1]],[102,[155,107,125,50,10,1175,12,14,1]],[103,[216,233,149,20,6,3014,12,14,1]],[104,[137,90,144,40,10,1019,5,null,1]],[105,[155,144,186,15,6,1835,5,null,1]],[106,[137,224,181,20,9,2576,2,null,1]],[107,[137,193,197,20,9,2332,2,null,1]],[108,[207,108,137,20,9,1411,1,null,1]],[109,[120,119,141,50,10,1214,4,null,1]],[110,[163,174,197,20,6,2293,4,null,1]],[111,[190,140,127,50,10,1651,5,6,1]],[112,[233,222,171,5,6,3179,5,6,1]],[113,[487,60,128,20,9,1255,1,null,1]],[114,[163,183,169,40,9,2238,12,null,1]],[115,[233,181,165,20,9,2586,1,null,1]],[116,[102,129,103,50,10,1056,11,null,1]],[117,[146,187,156,20,6,2093,11,null,1]],[118,[128,123,110,50,15,1152,11,null,1]],[119,[190,175,147,20,7,2162,11,null,1]],[120,[102,137,112,50,15,1157,11,null,1]],[121,[155,210,184,20,6,2584,11,14,1]],[122,[120,192,205,30,9,2228,14,18,1]],[123,[172,218,170,30,9,2706,7,3,1]],[124,[163,223,151,30,9,2555,15,14,1]],[125,[163,198,158,20,9,2334,13,null,1]],[126,[163,206,154,20,9,2394,10,null,1]],[127,[163,238,182,30,9,2959,7,null,1]],[128,[181,198,183,30,9,2620,1,null,1]],[129,[85,29,85,70,15,274,11,null,1]],[130,[216,237,186,10,7,3391,11,3,1]],[131,[277,165,174,5,9,2641,11,15,1]],[132,[134,91,91,20,10,832,1,null,1]],[133,[146,104,114,40,10,1071,1,null,1]],[134,[277,205,161,12,6,3114,11,null,1]],[135,[163,232,182,12,6,2888,13,null,1]],[136,[163,246,179,12,6,3029,10,null,1]],[137,[163,153,136,40,9,1720,1,null,1]],[138,[111,155,153,40,9,1544,6,11,1]],[139,[172,207,201,15,5,2786,6,11,1]],[140,[102,148,140,40,9,1370,6,11,1]],[141,[155,220,186,15,5,2713,6,11,1]],[142,[190,221,159,20,9,2783,6,3,1]],[143,[330,190,169,5,9,3225,1,null,1]],[144,[207,192,236,3,10,3051,15,3,1]],[145,[207,253,185,3,10,3527,13,3,1]],[146,[207,251,181,3,10,3465,10,3,1]],[147,[121,119,91,40,9,1004,16,null,1]],[148,[156,163,135,10,6,1780,16,null,1]],[149,[209,263,198,5,5,3792,16,3,1]],[150,[214,300,182,6,10,4178,14,null,1]],[151,[225,210,210,100,0,3265,14,null,1]],[152,[128,92,122,20,10,935,12,null,2]],[153,[155,122,155,12,7,1454,12,null,2]],[154,[190,168,202,5,5,2410,12,null,2]],[155,[118,116,93,20,10,980,10,null,2]],[156,[151,158,126,12,7,1653,10,null,2]],[157,[186,223,173,5,5,2889,10,null,2]],[158,[137,117,109,20,10,1131,11,null,2]],[159,[163,150,142,12,7,1722,11,null,2]],[160,[198,205,188,5,5,2857,11,null,2]],[161,[111,79,73,50,20,618,1,null,2]],[162,[198,148,125,15,7,1758,1,null,2]],[163,[155,67,88,50,15,677,1,3,2]],[164,[225,145,156,15,7,2024,1,3,2]],[165,[120,72,118,50,20,728,7,3,2]],[166,[146,107,179,15,7,1346,7,3,2]],[167,[120,105,73,50,20,816,7,4,2]],[168,[172,161,124,15,7,1772,7,4,2]],[169,[198,194,178,10,5,2646,4,3,2]],[170,[181,106,97,40,10,1119,11,13,2]],[171,[268,146,137,15,7,2085,11,13,2]],[172,[85,77,53,0,5,473,13,null,2]],[173,[137,75,79,0,5,671,18,null,2]],[174,[207,69,32,0,5,535,1,18,2]],[175,[111,67,116,0,5,657,18,null,2]],[176,[146,139,181,5,5,1708,18,3,2]],[177,[120,134,89,40,15,1102,14,3,2]],[178,[163,192,146,15,7,2188,14,3,2]],[179,[146,114,79,50,10,991,13,null,2]],[180,[172,145,109,25,7,1521,13,null,2]],[181,[207,211,169,12,5,2852,13,null,2]],[182,[181,169,186,5,5,2281,12,null,2]],[183,[172,37,93,50,10,461,11,18,2]],[184,[225,112,152,15,7,1588,11,18,2]],[185,[172,167,176,12,5,2148,6,null,2]],[186,[207,174,179,10,5,2449,11,null,2]],[187,[111,67,94,50,12,600,12,3,2]],[188,[146,91,120,25,7,976,12,3,2]],[189,[181,118,183,12,5,1636,12,3,2]],[190,[146,136,112,20,9,1348,1,null,2]],[191,[102,55,55,50,9,395,12,null,2]],[192,[181,185,135,10,7,2141,12,null,2]],[193,[163,154,94,30,10,1470,7,3,2]],[194,[146,75,66,40,10,641,11,5,2]],[195,[216,152,143,15,7,1992,11,5,2]],[196,[163,261,175,0,5,3170,14,null,2]],[197,[216,126,240,0,5,2137,17,null,2]],[198,[155,175,87,20,10,1562,17,3,2]],[199,[216,177,180,10,5,2545,11,14,2]],[200,[155,167,154,30,7,1926,8,null,2]],[201,[134,136,91,30,10,1185,14,null,2]],[202,[382,60,106,25,7,1026,14,null,2]],[203,[172,182,133,30,7,2046,1,14,2]],[204,[137,108,122,40,12,1108,7,null,2]],[205,[181,161,205,15,7,2282,7,9,2]],[206,[225,131,128,30,20,1689,1,null,2]],[207,[163,143,184,20,7,1857,5,3,2]],[208,[181,148,272,10,5,2414,9,5,2]],[209,[155,137,85,40,10,1237,18,null,2]],[210,[207,212,131,15,8,2552,18,null,2]],[211,[163,184,138,30,8,2051,11,4,2]],[212,[172,236,181,5,5,3001,7,9,2]],[213,[85,17,396,30,7,405,7,6,2]],[214,[190,234,179,30,9,3101,7,2,2]],[215,[146,189,146,20,7,2051,17,15,2]],[216,[155,142,93,50,20,1328,1,null,2]],[217,[207,236,144,15,7,2945,1,null,2]],[218,[120,118,71,30,10,895,10,null,2]],[219,[137,139,191,12,6,1702,10,6,2]],[220,[137,90,69,30,10,741,15,5,2]],[221,[225,181,138,12,6,2345,15,5,2]],[222,[146,118,156,30,12,1378,11,6,2]],[223,[111,127,69,50,10,912,11,null,2]],[224,[181,197,141,15,7,2315,11,null,2]],[225,[128,128,90,20,20,1094,15,3,2]],[226,[163,148,226,30,7,2108,11,3,2]],[227,[163,148,226,20,9,2108,9,3,2]],[228,[128,152,83,40,10,1234,17,10,2]],[229,[181,224,144,15,6,2635,17,10,2]],[230,[181,194,194,10,5,2641,11,16,2]],[231,[207,107,98,50,20,1206,5,null,2]],[232,[207,214,185,12,7,3013,5,null,2]],[233,[198,198,180,5,5,2711,1,null,2]],[234,[177,192,131,30,8,2164,1,null,2]],[235,[146,40,83,25,7,431,1,null,2]],[236,[111,64,64,0,20,492,2,null,2]],[237,[137,173,207,10,5,2156,2,null,2]],[238,[128,153,91,0,20,1291,15,14,2]],[239,[128,135,101,0,20,1206,13,null,2]],[240,[128,151,99,0,20,1323,10,null,2]],[241,[216,157,193,20,8,2354,1,null,2]],[242,[496,129,169,5,5,2757,1,null,2]],[243,[207,241,195,2,4,3452,13,null,2]],[244,[251,235,171,2,4,3473,10,null,2]],[245,[225,180,235,2,4,2983,11,null,2]],[246,[137,115,93,40,10,1040,6,5,2]],[247,[172,155,133,10,7,1766,6,5,2]],[248,[225,251,207,5,4,3834,6,17,2]],[249,[235,193,310,2,4,3703,14,3,2]],[250,[214,239,244,2,4,3863,10,3,2]],[251,[225,210,210,100,0,3265,14,12,2]],[252,[120,124,94,20,10,1053,12,null,3]],[253,[137,172,120,10,7,1673,12,null,3]],[254,[172,223,169,5,5,2757,12,null,3]],[255,[128,130,87,20,10,1093,10,null,3]],[256,[155,163,115,10,7,1652,10,2,3]],[257,[190,240,141,5,5,2848,10,2,3]],[258,[137,126,93,20,10,1128,11,null,3]],[259,[172,156,133,10,7,1776,11,5,3]],[260,[225,208,175,5,5,2974,11,5,3]],[261,[111,96,61,50,20,678,17,null,3]],[262,[172,171,132,20,7,1926,17,null,3]],[263,[116,58,80,50,20,508,1,null,3]],[264,[186,142,128,20,7,1662,1,null,3]],[265,[128,75,59,50,20,578,7,null,3]],[266,[137,60,77,25,9,553,7,null,3]],[267,[155,189,98,12,6,1765,7,3,3]],[268,[137,60,77,25,9,553,7,null,3]],[269,[155,98,162,12,6,1224,7,4,3]],[270,[120,71,77,50,20,598,11,12,3]],[271,[155,112,119,25,9,1197,11,12,3]],[272,[190,173,176,12,6,2323,11,12,3]],[273,[120,71,77,50,20,598,12,null,3]],[274,[172,134,78,25,9,1227,12,17,3]],[275,[207,200,121,12,6,2333,12,17,3]],[276,[120,106,61,50,20,765,1,3,3]],[277,[155,185,124,20,7,1920,1,3,3]],[278,[120,106,61,50,20,765,11,3,3]],[279,[155,175,174,20,7,2127,11,3,3]],[280,[99,79,59,40,9,539,14,18,3]],[281,[116,117,90,10,6,966,14,18,3]],[282,[169,237,195,5,5,3093,14,18,3]],[283,[120,93,87,50,20,791,7,11,3]],[284,[172,192,150,20,7,2270,7,3,3]],[285,[155,74,110,50,20,810,12,null,3]],[286,[155,241,144,20,7,2628,12,2,3]],[287,[155,104,92,40,9,1002,1,null,3]],[288,[190,159,145,10,6,1968,1,null,3]],[289,[284,290,166,5,5,4431,1,null,3]],[290,[104,80,126,20,10,768,7,5,3]],[291,[156,196,112,10,7,1942,7,3,3]],[292,[1,153,73,5,5,393,7,8,3]],[293,[162,92,42,50,20,671,1,null,3]],[294,[197,134,81,25,9,1327,1,null,3]],[295,[232,179,137,12,6,2347,1,null,3]],[296,[176,99,54,50,10,817,2,null,3]],[297,[302,209,114,20,6,2829,2,null,3]],[298,[137,36,71,10,4,364,1,18,3]],[299,[102,82,215,20,9,993,6,null,3]],[300,[137,84,79,50,10,739,1,null,3]],[301,[172,132,127,20,6,1496,1,null,3]],[302,[137,141,136,20,7,1476,17,8,3]],[303,[137,155,141,50,9,1634,9,18,3]],[304,[137,121,141,50,20,1307,9,6,3]],[305,[155,158,198,25,9,2056,9,6,3]],[306,[172,198,257,12,6,3000,9,6,3]],[307,[102,78,107,50,10,693,2,14,3]],[308,[155,121,152,20,6,1431,2,14,3]],[309,[120,123,78,50,10,965,13,null,3]],[310,[172,215,127,20,6,2340,13,null,3]],[311,[155,167,129,30,9,1778,13,null,3]],[312,[155,147,150,30,9,1694,13,null,3]],[313,[163,143,166,30,9,1771,7,null,3]],[314,[163,143,166,30,9,1771,7,null,3]],[315,[137,186,131,30,9,1870,12,4,3]],[316,[172,80,99,50,10,866,4,null,3]],[317,[225,140,159,20,6,1978,4,null,3]],[318,[128,171,39,50,10,1020,11,17,3]],[319,[172,243,83,20,6,2181,11,17,3]],[320,[277,136,68,50,10,1468,11,null,3]],[321,[347,175,87,20,6,2280,11,null,3]],[322,[155,119,79,50,10,1057,10,5,3]],[323,[172,194,136,20,6,2193,10,5,3]],[324,[172,151,203,30,9,2093,10,null,3]],[325,[155,125,122,50,10,1334,14,null,3]],[326,[190,171,188,20,6,2369,14,null,3]],[327,[155,116,116,30,9,1220,1,null,3]],[328,[128,162,78,40,9,1274,5,null,3]],[329,[137,134,99,10,6,1225,5,16,3]],[330,[190,205,168,5,5,2661,5,16,3]],[331,[137,156,74,50,10,1242,12,null,3]],[332,[172,221,115,20,6,2298,12,17,3]],[333,[128,76,132,50,10,824,1,3,3]],[334,[181,141,201,20,6,2004,16,3,3]],[335,[177,222,124,30,9,2418,1,null,3]],[336,[177,196,118,30,9,2105,4,null,3]],[337,[207,178,153,30,9,2327,6,14,3]],[338,[207,178,153,30,9,2327,6,14,3]],[339,[137,93,82,50,10,819,11,5,3]],[340,[242,151,141,20,6,2075,11,5,3]],[341,[125,141,99,50,10,1230,11,null,3]],[342,[160,224,142,20,6,2474,11,17,3]],[343,[120,77,124,50,10,787,5,14,3]],[344,[155,140,229,20,6,1971,5,14,3]],[345,[165,105,150,50,10,1291,6,12,3]],[346,[200,152,194,20,6,2211,6,12,3]],[347,[128,176,100,50,10,1529,6,7,3]],[348,[181,222,174,20,6,2848,6,7,3]],[349,[85,29,85,70,15,274,11,null,3]],[350,[216,192,219,10,7,3005,11,null,3]],[351,[172,139,139,30,10,1632,1,null,3]],[352,[155,161,189,30,10,2047,1,null,3]],[353,[127,138,65,40,10,1018,8,null,3]],[354,[162,218,126,20,7,2298,8,null,3]],[355,[85,70,162,40,10,706,8,null,3]],[356,[120,124,234,20,7,1591,8,null,3]],[357,[223,136,163,30,10,1941,12,3,3]],[358,[181,175,170,30,10,2259,14,null,3]],[359,[163,246,120,50,10,2526,17,null,3]],[360,[216,41,86,30,10,534,14,null,3]],[361,[137,95,95,50,10,888,15,null,3]],[362,[190,162,162,20,6,2105,15,null,3]],[363,[172,95,90,50,10,962,15,11,3]],[364,[207,137,132,25,7,1714,15,11,3]],[365,[242,182,176,12,5,2726,15,11,3]],[366,[111,133,135,50,10,1270,11,null,3]],[367,[146,197,179,20,6,2340,11,null,3]],[368,[146,211,179,20,6,2494,11,null,3]],[369,[225,162,203,90,1,2528,11,6,3]],[370,[125,81,128,30,10,848,11,null,3]],[371,[128,134,93,40,9,1156,16,null,3]],[372,[163,172,155,10,6,2031,16,null,3]],[373,[216,277,168,5,5,3749,16,3,3]],[374,[120,96,132,40,9,976,9,14,3]],[375,[155,138,176,10,6,1721,9,14,3]],[376,[190,257,228,5,5,3791,9,14,3]],[377,[190,179,309,2,1,3122,6,null,3]],[378,[190,179,309,2,1,3122,15,null,3]],[379,[190,143,285,2,1,2447,9,null,3]],[380,[190,228,246,2,1,3510,16,14,3]],[381,[190,268,212,2,1,3812,16,14,3]],[382,[205,270,228,2,1,4115,11,null,3]],[383,[205,270,228,2,1,4115,5,null,3]],[384,[213,284,170,2,1,3835,16,3,3]],[385,[225,210,210,2,1,3265,9,14,3]],[386,[137,345,115,6,1,3160,14,null,3]],[387,[146,119,110,20,10,1187,12,null,4]],[388,[181,157,143,10,7,1890,12,null,4]],[389,[216,202,188,5,5,2934,12,5,4]],[390,[127,113,86,20,10,957,10,null,4]],[391,[162,158,105,10,7,1574,10,2,4]],[392,[183,222,151,5,5,2683,10,2,4]],[393,[142,112,102,20,10,1075,11,null,4]],[394,[162,150,139,10,7,1701,11,null,4]],[395,[197,210,186,5,5,2900,11,9,4]],[396,[120,101,58,50,20,719,1,3,4]],[397,[146,142,94,25,9,1299,1,3,4]],[398,[198,234,140,12,6,2825,1,3,4]],[399,[153,80,73,50,20,721,1,null,4]],[400,[188,162,119,20,7,1823,1,11,4]],[401,[114,45,74,50,20,401,7,null,4]],[402,[184,160,100,20,7,1653,7,null,4]],[403,[128,117,64,50,10,876,13,null,4]],[404,[155,159,95,25,7,1486,13,null,4]],[405,[190,232,156,12,5,2888,13,null,4]],[406,[120,91,109,10,4,856,12,4,4]],[407,[155,243,185,15,7,2971,12,4,4]],[408,[167,218,71,50,10,1820,6,null,4]],[409,[219,295,109,20,6,3298,6,null,4]],[410,[102,76,195,50,10,890,6,9,4]],[411,[155,94,286,20,6,1539,6,9,4]],[412,[120,53,83,50,20,488,7,null,4]],[413,[155,141,180,15,7,1773,7,12,4]],[414,[172,185,98,15,7,1815,7,3,4]],[415,[102,59,83,15,7,494,7,3,4]],[416,[172,149,190,15,7,2005,7,3,4]],[417,[155,94,172,30,9,1213,13,null,4]],[418,[146,132,67,50,10,1054,11,null,4]],[419,[198,221,114,20,6,2443,11,null,4]],[420,[128,108,92,50,9,950,12,null,4]],[421,[172,170,153,10,7,2048,12,null,4]],[422,[183,103,105,50,10,1136,11,null,4]],[423,[244,169,143,20,6,2324,11,5,4]],[424,[181,205,143,20,6,2418,1,null,4]],[425,[207,117,80,40,10,1197,8,3,4]],[426,[312,180,102,20,7,2382,8,3,4]],[427,[146,130,105,50,10,1258,1,null,4]],[428,[163,156,194,20,6,2059,1,null,4]],[429,[155,211,187,10,7,2615,8,null,4]],[430,[225,243,103,10,7,2711,17,3,4]],[431,[135,109,82,40,10,934,1,null,4]],[432,[174,172,133,15,8,1953,1,null,4]],[433,[128,114,94,10,4,1005,14,null,4]],[434,[160,121,90,50,10,1151,4,17,4]],[435,[230,184,132,20,6,2358,4,17,4]],[436,[149,43,154,50,10,603,9,14,4]],[437,[167,161,213,20,6,2239,9,14,4]],[438,[137,124,133,10,4,1302,6,null,4]],[439,[85,125,142,10,4,1095,14,18,4]],[440,[225,25,77,10,4,371,1,null,4]],[441,[183,183,91,30,9,1791,1,3,4]],[442,[137,169,199,10,4,2072,8,17,4]],[443,[151,124,84,40,9,1112,16,5,4]],[444,[169,172,125,10,6,1874,16,5,4]],[445,[239,261,193,5,5,3962,16,5,4]],[446,[286,137,117,10,4,1892,1,null,4]],[447,[120,127,78,0,20,993,2,null,4]],[448,[172,236,144,10,5,2703,2,9,4]],[449,[169,124,118,40,10,1358,5,null,4]],[450,[239,201,191,15,8,3085,5,null,4]],[451,[120,93,151,40,10,1009,4,7,4]],[452,[172,180,202,15,8,2453,4,17,4]],[453,[134,116,76,40,12,952,4,2,4]],[454,[195,211,133,15,7,2488,4,2,4]],[455,[179,187,136,90,1,2159,12,null,4]],[456,[135,96,116,50,10,971,11,null,4]],[457,[170,142,170,20,6,1814,11,null,4]],[458,[128,105,179,10,4,1248,11,3,4]],[459,[155,115,105,30,10,1159,12,15,4]],[460,[207,178,158,12,6,2362,12,15,4]],[461,[172,243,171,15,9,3005,17,15,4]],[462,[172,238,205,12,5,3205,13,9,4]],[463,[242,161,181,15,9,2467,1,null,4]],[464,[251,241,190,5,5,3733,5,6,4]],[465,[225,207,184,15,10,3030,12,null,4]],[466,[181,249,163,15,10,3079,13,null,4]],[467,[181,247,172,15,10,3132,10,null,4]],[468,[198,225,217,1,5,3332,18,3,4]],[469,[200,231,156,17,5,2946,7,3,4]],[470,[163,216,219,12,6,2944,12,null,4]],[471,[163,238,205,12,6,3126,15,null,4]],[472,[181,185,222,12,9,2692,5,3,4]],[473,[242,247,146,5,5,3328,15,5,4]],[474,[198,264,150,5,5,3266,1,null,4]],[475,[169,237,195,50,5,3093,14,2,4]],[476,[155,135,275,10,7,2080,6,9,4]],[477,[128,180,254,10,5,2388,8,null,4]],[478,[172,171,150,20,7,2040,15,8,4]],[479,[137,185,159,30,10,2031,13,8,4]],[480,[181,156,270,2,4,2524,14,null,4]],[481,[190,212,212,2,4,3058,14,null,4]],[482,[181,270,151,2,4,3210,14,null,4]],[483,[205,275,211,2,4,4038,9,16,4]],[484,[189,280,215,2,4,3991,11,16,4]],[485,[209,251,213,2,4,3754,10,9,4]],[486,[221,287,210,2,4,4346,1,null,4]],[487,[284,187,225,2,4,3379,8,16,4]],[488,[260,152,258,2,4,2857,14,null,4]],[489,[190,162,162,2,0,2105,11,null,4]],[490,[225,210,210,2,0,3265,11,null,4]],[491,[172,285,198,2,0,3739,17,null,4]],[492,[225,210,210,2,0,3265,12,null,4]],[493,[237,238,238,2,0,3989,1,null,4]],[494,[225,210,210,null,null,3265,14,10,5]],[495,[128,88,107,null,null,849,12,null,5]],[496,[155,122,152,null,null,1441,12,null,5]],[497,[181,161,204,null,null,2277,12,null,5]],[498,[163,115,85,null,null,1083,10,null,5]],[499,[207,173,106,null,null,1924,10,2,5]],[500,[242,235,127,null,null,2982,10,2,5]],[501,[146,117,85,null,null,1046,11,null,5]],[502,[181,159,116,null,null,1741,11,null,5]],[503,[216,212,157,null,null,2826,11,null,5]],[504,[128,98,73,null,null,791,1,null,5]],[505,[155,165,139,null,null,1819,1,null,5]],[506,[128,107,86,null,null,915,1,null,5]],[507,[163,145,126,null,null,1583,1,null,5]],[508,[198,206,182,null,null,2827,1,null,5]],[509,[121,98,73,null,null,772,17,null,5]],[510,[162,187,106,null,null,1846,17,null,5]],[511,[137,104,94,null,null,956,12,null,5]],[512,[181,206,133,null,null,2350,12,null,5]],[513,[137,104,94,null,null,956,10,null,5]],[514,[181,206,133,null,null,2350,10,null,5]],[515,[137,104,94,null,null,956,11,null,5]],[516,[181,206,133,null,null,2350,11,null,5]],[517,[183,111,92,null,null,1145,14,null,5]],[518,[253,183,166,null,null,2723,14,null,5]],[519,[137,98,80,null,null,848,1,3,5]],[520,[158,144,107,null,null,1442,1,3,5]],[521,[190,226,146,null,null,2734,1,3,5]],[522,[128,118,64,null,null,882,13,null,5]],[523,[181,211,136,null,null,2428,13,null,5]],[524,[146,121,110,null,null,1205,6,null,5]],[525,[172,174,143,null,null,2029,6,null,5]],[526,[198,226,201,null,null,3228,6,null,5]],[527,[163,107,85,null,null,1016,14,3,5]],[528,[167,161,119,null,null,1716,14,3,5]],[529,[155,154,85,null,null,1376,5,null,5]],[530,[242,255,129,null,null,3244,5,9,5]],[531,[230,114,163,null,null,1682,1,null,5]],[532,[181,134,87,null,null,1315,2,null,5]],[533,[198,180,134,null,null,2169,2,null,5]],[534,[233,243,158,null,null,3337,2,null,5]],[535,[137,98,78,null,null,839,11,null,5]],[536,[181,128,109,null,null,1392,11,5,5]],[537,[233,188,150,null,null,2564,11,5,5]],[538,[260,172,160,null,null,2562,2,null,5]],[539,[181,231,153,null,null,2788,2,null,5]],[540,[128,96,124,null,null,977,7,12,5]],[541,[146,115,162,null,null,1370,7,12,5]],[542,[181,205,165,null,null,2580,7,12,5]],[543,[102,83,99,null,null,706,7,4,5]],[544,[120,100,173,null,null,1144,7,4,5]],[545,[155,203,175,null,null,2447,7,4,5]],[546,[120,71,111,null,null,700,12,18,5]],[547,[155,164,176,null,null,2014,12,18,5]],[548,[128,119,91,null,null,1030,12,null,5]],[549,[172,214,155,null,null,2550,12,null,5]],[550,[172,189,129,null,null,2090,11,null,5]],[551,[137,132,69,null,null,1037,5,17,5]],[552,[155,155,90,null,null,1418,5,17,5]],[553,[216,229,158,null,null,3046,5,17,5]],[554,[172,153,86,null,null,1442,10,null,5]],[555,[233,263,114,null,null,3105,10,null,5]],[556,[181,201,130,null,null,2274,12,null,5]],[557,[137,118,128,null,null,1224,7,6,5]],[558,[172,188,200,null,null,2542,7,6,5]],[559,[137,132,132,null,null,1372,17,2,5]],[560,[163,163,222,null,null,2283,17,2,5]],[561,[176,204,167,null,null,2550,14,3,5]],[562,[116,95,141,null,null,982,8,null,5]],[563,[151,163,237,null,null,2273,8,null,5]],[564,[144,134,146,null,null,1488,11,6,5]],[565,[179,192,197,null,null,2621,11,6,5]],[566,[146,213,89,null,null,1842,6,3,5]],[567,[181,292,139,null,null,3331,6,3,5]],[568,[137,96,122,null,null,1000,4,null,5]],[569,[190,181,164,null,null,2345,4,null,5]],[570,[120,153,78,null,null,1175,17,null,5]],[571,[155,250,127,null,null,2571,17,null,5]],[572,[146,98,80,null,null,872,1,null,5]],[573,[181,198,130,null,null,2242,1,null,5]],[574,[128,98,112,null,null,951,14,null,5]],[575,[155,137,153,null,null,1604,14,null,5]],[576,[172,176,205,null,null,2419,14,null,5]],[577,[128,170,83,null,null,1367,14,null,5]],[578,[163,208,103,null,null,2018,14,null,5]],[579,[242,214,148,null,null,2927,14,null,5]],[580,[158,84,96,null,null,856,11,3,5]],[581,[181,182,132,null,null,2088,11,3,5]],[582,[113,118,106,null,null,1033,15,null,5]],[583,[139,151,138,null,null,1591,15,null,5]],[584,[174,218,184,null,null,2822,15,null,5]],[585,[155,115,100,null,null,1135,1,12,5]],[586,[190,198,146,null,null,2416,1,12,5]],[587,[146,158,127,null,null,1633,13,3,5]],[588,[137,137,87,null,null,1182,7,null,5]],[589,[172,223,187,null,null,2889,7,9,5]],[590,[170,97,91,null,null,979,12,4,5]],[591,[249,155,139,null,null,2140,12,4,5]],[592,[146,115,134,null,null,1257,11,8,5]],[593,[225,159,178,null,null,2338,11,8,5]],[594,[338,138,131,null,null,2169,11,null,5]],[595,[137,110,98,null,null,1023,7,13,5]],[596,[172,201,128,null,null,2206,7,13,5]],[597,[127,82,155,null,null,941,12,9,5]],[598,[179,158,223,null,null,2321,12,9,5]],[599,[120,98,121,null,null,956,9,null,5]],[600,[155,150,174,null,null,1847,9,null,5]],[601,[155,199,214,null,null,2637,9,null,5]],[602,[111,105,78,null,null,811,13,null,5]],[603,[163,156,130,null,null,1715,13,null,5]],[604,[198,217,152,null,null,2732,13,null,5]],[605,[146,148,100,null,null,1385,14,null,5]],[606,[181,221,163,null,null,2753,14,null,5]],[607,[137,108,98,null,null,1006,8,10,5]],[608,[155,169,115,null,null,1708,8,10,5]],[609,[155,271,182,null,null,3268,8,10,5]],[610,[130,154,101,null,null,1368,16,null,5]],[611,[165,212,123,null,null,2234,16,null,5]],[612,[183,284,172,null,null,3593,16,null,5]],[613,[146,128,74,null,null,1069,15,null,5]],[614,[216,233,152,null,null,3042,15,null,5]],[615,[190,190,218,null,null,2798,15,null,5]],[616,[137,72,140,null,null,834,7,null,5]],[617,[190,220,120,null,null,2441,7,null,5]],[618,[240,144,171,null,null,2162,5,13,5]],[619,[128,160,98,null,null,1389,2,null,5]],[620,[163,258,127,null,null,2710,2,null,5]],[621,[184,213,170,null,null,2732,16,null,5]],[622,[153,127,92,null,null,1189,5,8,5]],[623,[205,222,154,null,null,2854,5,8,5]],[624,[128,154,114,null,null,1433,17,9,5]],[625,[163,232,176,null,null,2844,17,9,5]],[626,[216,195,182,null,null,2797,1,null,5]],[627,[172,150,97,null,null,1491,1,3,5]],[628,[225,232,152,null,null,3088,1,3,5]],[629,[172,105,139,null,null,1271,17,3,5]],[630,[242,129,205,null,null,2138,17,3,5]],[631,[198,204,129,null,null,2395,10,null,5]],[632,[151,217,188,null,null,2659,7,9,5]],[633,[141,116,93,null,null,1062,17,16,5]],[634,[176,159,135,null,null,1839,17,16,5]],[635,[211,256,188,null,null,3625,17,16,5]],[636,[146,156,107,null,null,1496,7,10,5]],[637,[198,264,189,null,null,3632,7,10,5]],[638,[209,192,229,null,null,3022,9,2,5]],[639,[209,260,192,null,null,3698,6,2,5]],[640,[209,192,229,null,null,3022,12,2,5]],[641,[188,266,164,null,null,3345,3,null,5]],[642,[188,266,164,null,null,3345,13,3,5]],[643,[225,302,232,null,null,4820,16,10,5]],[644,[225,302,232,null,null,4820,16,13,5]],[645,[205,261,182,null,null,3588,5,3,5]],[646,[268,270,187,null,null,4255,16,15,5]],[647,[209,260,192,null,null,3698,11,2,5]],[648,[225,250,225,null,null,3972,1,14,5]],[649,[174,252,199,null,null,3353,7,9,5]],[650,[148,110,106,null,null,1096,12,null,6]],[651,[156,146,156,null,null,1719,12,null,6]],[652,[204,201,204,null,null,2954,12,2,6]],[653,[120,116,102,null,null,1028,10,null,6]],[654,[153,171,130,null,null,1813,10,null,6]],[655,[181,230,189,null,null,3059,10,14,6]],[656,[121,122,84,null,null,992,11,null,6]],[657,[144,168,114,null,null,1636,11,null,6]],[658,[176,223,152,null,null,2654,11,17,6]],[659,[116,68,72,null,null,553,1,null,6]],[660,[198,112,155,null,null,1509,1,5,6]],[661,[128,95,80,null,null,800,1,3,6]],[662,[158,145,110,null,null,1469,10,3,6]],[663,[186,176,155,null,null,2205,10,3,6]],[664,[116,63,63,null,null,492,7,null,6]],[665,[128,48,89,null,null,479,7,null,6]],[666,[190,176,103,null,null,1855,7,3,6]],[667,[158,139,112,null,null,1425,10,1,6]],[668,[200,221,149,null,null,2767,10,1,6]],[669,[127,108,120,null,null,1063,18,null,6]],[670,[144,136,151,null,null,1532,18,null,6]],[671,[186,212,244,null,null,3234,18,null,6]],[672,[165,123,102,null,null,1250,12,null,6]],[673,[265,196,146,null,null,2798,12,null,6]],[674,[167,145,107,null,null,1489,2,null,6]],[675,[216,226,146,null,null,2902,2,17,6]],[676,[181,164,167,null,null,2111,1,null,6]],[677,[158,120,114,null,null,1259,14,null,6]],[678,[179,166,167,null,null,2124,14,null,6]],[679,[128,135,139,null,null,1390,9,8,6]],[680,[153,188,206,null,null,2443,9,8,6]],[681,[155,97,291,null,null,1595,9,8,6]],[682,[186,110,113,null,null,1252,18,null,6]],[683,[226,173,150,null,null,2341,18,null,6]],[684,[158,109,119,null,null,1179,18,null,6]],[685,[193,168,163,null,null,2199,18,null,6]],[686,[142,98,95,null,null,927,17,14,6]],[687,[200,177,165,null,null,2359,17,14,6]],[688,[123,96,120,null,null,946,6,11,6]],[689,[176,194,205,null,null,2675,6,11,6]],[690,[137,109,109,null,null,1063,4,11,6]],[691,[163,177,207,null,null,2383,4,16,6]],[692,[137,108,117,null,null,1088,11,null,6]],[693,[174,221,171,null,null,2763,11,null,6]],[694,[127,115,78,null,null,933,13,1,6]],[695,[158,219,168,null,null,2600,13,1,6]],[696,[151,158,123,null,null,1635,6,16,6]],[697,[193,227,191,null,null,3128,6,16,6]],[698,[184,124,109,null,null,1363,6,15,6]],[699,[265,186,163,null,null,2802,6,15,6]],[700,[216,203,205,null,null,3069,18,null,6]],[701,[186,195,153,null,null,2410,2,3,6]],[702,[167,164,134,null,null,1841,13,18,6]],[703,[137,95,285,null,null,1467,6,18,6]],[704,[128,101,112,null,null,976,16,null,6]],[705,[169,159,176,null,null,2037,16,null,6]],[706,[207,220,242,null,null,3505,16,null,6]],[707,[149,160,179,null,null,1949,9,18,6]],[708,[125,125,103,null,null,1123,8,12,6]],[709,[198,201,154,null,null,2559,8,12,6]],[710,[135,121,123,null,null,1222,8,12,6]],[711,[163,175,213,null,null,2390,8,12,6]],[712,[146,117,120,null,null,1215,15,null,6]],[713,[216,196,240,null,null,3198,15,null,6]],[714,[120,83,73,null,null,667,3,16,6]],[715,[198,205,175,null,null,2764,3,16,6]],[716,[270,275,203,null,null,4514,18,null,6]],[717,[270,275,203,null,null,4514,17,3,6]],[718,[239,203,232,null,null,3410,16,5,6]],[719,[137,190,285,null,null,2734,6,18,6]],[720,[190,287,206,null,null,4014,14,8,6]],[721,[190,252,216,null,null,3628,10,11,6]],[10001,[137,414,46,6,1,2580,14,null,null]],[10002,[137,144,330,6,1,2274,14,null,null]],[10003,[137,230,218,6,1,2879,14,null,null]],[10004,[155,141,180,15,7,1773,7,5,null]],[10005,[155,127,175,15,7,1593,7,9,null]],[10006,[225,261,166,2,0,3592,12,3,null]],[10007,[284,225,187,2,4,3683,8,16,null]],[10008,[137,204,219,30,10,2579,13,10,null]],[10009,[137,204,219,30,10,2579,13,11,null]],[10010,[137,204,219,30,10,2579,13,15,null]],[10011,[137,204,219,30,10,2579,13,3,null]],[10012,[137,204,219,30,10,2579,13,12,null]],[10013,[172,139,139,30,10,1632,10,null,null]],[10014,[172,139,139,30,10,1632,11,null,null]],[10015,[172,139,139,30,10,1632,15,null,null]],[10016,[172,189,129,null,null,2090,11,null,null]],[10017,[233,243,202,null,null,3738,10,14,null]],[10018,[225,269,188,null,null,3915,1,2,null]],[10019,[188,238,189,null,null,3215,3,null,null]],[10020,[188,295,161,null,null,3659,13,3,null]],[10021,[205,289,179,null,null,3922,5,3,null]],[10022,[268,341,201,null,null,5497,16,15,null]],[10023,[268,341,201,null,null,5497,16,15,null]],[10024,[209,260,192,null,null,3698,11,2,null]],[10025,[179,166,167,null,null,2124,14,null,null]],[10026,[155,291,97,null,null,2637,9,8,null]],[10027,[127,122,124,null,null,1202,8,12,null]],[10028,[144,120,122,null,null,1244,8,12,null]],[10029,[153,118,120,null,null,1250,8,12,null]],[10030,[146,171,219,null,null,2254,8,12,null]],[10031,[181,179,206,null,null,2521,8,12,null]],[10032,[198,182,200,null,null,2633,8,12,null]],[10033,[190,241,246,null,null,3698,12,4,null]],[10034,[186,273,213,null,null,3850,10,16,null]],[10035,[186,319,212,null,null,4455,10,3,null]],[10036,[188,264,237,null,null,3941,11,null,null]],[10037,[146,367,207,null,null,4510,14,null,null]],[10038,[155,349,199,null,null,4336,8,4,null]],[10039,[233,246,210,null,null,3850,1,null,null]],[10040,[163,305,231,null,null,4182,7,3,null]],[10041,[216,292,247,null,null,4717,11,17,null]],[10042,[190,292,210,null,null,4118,6,3,null]],[10043,[235,412,222,null,null,6491,14,2,null]],[10044,[235,426,229,null,null,6802,14,null,null]],[10045,[207,294,203,null,null,4245,13,16,null]],[10046,[172,279,250,null,null,4087,7,9,null]],[10047,[190,334,223,null,null,4814,7,2,null]],[10048,[181,289,194,null,null,3842,17,10,null]],[10049,[225,309,276,null,null,5347,6,17,null]],[10050,[190,329,168,null,null,4161,10,2,null]],[10051,[169,326,229,null,null,4512,14,18,null]],[10052,[137,188,217,null,null,2380,9,18,null]],[10053,[172,247,331,null,null,4162,9,null,null]],[10054,[155,205,179,null,null,2495,2,14,null]],[10055,[172,286,179,null,null,3580,13,null,null]],[10056,[162,312,160,null,null,3594,8,null,null]],[10057,[163,314,130,null,null,3301,17,null,null]],[10058,[239,339,222,null,null,5424,16,5,null]],[10059,[172,310,175,null,null,3826,2,9,null]],[10060,[207,240,191,null,null,3405,12,15,null]],[10061,[179,243,217,null,null,3418,18,null,null]],[10062,[190,289,297,null,null,4801,16,14,null]],[10063,[190,335,241,null,null,5007,16,14,null]],[10064,[225,283,218,null,null,4401,11,5,null]],[10065,[172,320,186,null,null,4056,12,16,null]],[10066,[137,151,216,null,null,1942,17,8,null]],[10067,[181,222,218,null,null,3163,16,18,null]],[10068,[169,326,230,null,null,4521,14,2,null]],[10069,[230,147,239,null,null,2524,1,18,null]],[10070,[172,289,144,null,null,3273,11,17,null]],[10071,[216,224,259,null,null,3755,11,14,null]],[10072,[181,212,327,null,null,3670,9,5,null]],[10073,[195,280,175,null,null,3680,1,3,null]],[10074,[190,252,168,null,null,3229,15,null,null]],[10075,[137,342,235,null,null,4346,6,18,null]],[10076,[190,300,289,null,null,4911,9,14,null]],[10077,[225,364,276,null,null,6255,11,null,null]],[10078,[225,364,276,null,null,6255,5,10,null]],[10079,[233,389,216,null,null,6039,16,3,null]],[10086,[190,341,210,null,null,4775,14,17,null]],[10087,[172,253,183,null,null,3220,10,5,null]],[10088,[163,282,214,null,null,3745,1,2,null]],[10089,[216,310,251,null,null,5031,16,3,null]],[10090,[163,303,148,null,null,3383,7,4,null]],[10091,[102,103,70,50,20,734,17,1,null]],[10092,[181,135,154,20,7,1705,17,1,null]],[10100,[155,201,154,10,6,2286,13,14,null]],[10101,[137,125,129,50,10,1293,15,9,null]],[10102,[181,177,195,20,6,2432,15,9,null]],[10103,[116,96,109,30,10,883,15,null,null]],[10104,[177,170,193,10,6,2309,15,18,null]],[10105,[67,109,82,50,10,690,5,9,null]],[10106,[111,201,145,20,6,1915,5,9,null]],[10107,[120,99,78,50,15,797,17,null,null]],[10108,[163,158,136,20,7,1771,17,null,null]],[10109,[120,132,132,50,10,1293,6,13,null]],[10110,[146,164,164,25,7,1897,6,13,null]],[10111,[190,211,198,12,5,2949,6,13,null]],[10112,[190,135,90,50,10,1374,4,17,null]],[10113,[233,190,172,20,6,2757,4,17,null]],[10114,[216,230,153,20,6,3014,12,16,null]],[10115,[155,144,186,15,6,1835,10,8,null]]].map(function(a) {
	if( 10000 < a[0] ) {
		//not sure why they can't use the Bulbapedia variants
		//TODO: Make a mapping
		return null;
	}

	return new (Function.prototype.bind.apply(PokemonSpecies,
		[PokemonSpecies].concat([a[0]]).concat([IvCalculator.name_mapping[a[0]-1][1]]).concat(a[1])
	));
});

// https://bulbapedia.bulbagarden.net/w/index.php?title=List_of_Pok%C3%A9mon_by_evolution_family&action=edit
for(let row of [[1,2],[2,3],[4,5],[5,6],[7,8],[8,9],[10,11],[11,12],[13,14],[14,15],[16,17],[17,18],[19,20],[21,22],[23,24],[172,25],[25,26],[27,28],[29,30],[30,31],[32,33],[33,34],[173,35],[35,36],[37,38],[174,39],[39,40],[41,42],[42,169],[43,44],[44,45],[44,182],[46,47],[48,49],[50,51],[52,53],[54,55],[56,57],[58,59],[60,61],[61,62],[61,186],[63,64],[64,65],[66,67],[67,68],[69,70],[70,71],[72,73],[74,75],[75,76],[77,78],[79,80],[79,199],[81,82],[82,462],[84,85],[86,87],[88,89],[90,91],[92,93],[93,94],[95,208],[96,97],[98,99],[100,101],[102,103],[104,105],[236,106],[236,107],[236,237],[108,463],[109,110],[111,112],[112,464],[440,113],[113,242],[114,465],[116,117],[117,230],[118,119],[120,121],[439,122],[123,212],[238,124],[239,125],[125,466],[240,126],[126,467],[129,130],[133,134],[133,135],[133,136],[133,196],[133,197],[133,470],[133,471],[133,700],[137,233],[233,474],[138,139],[140,141],[446,143],[147,148],[148,149],[152,153],[153,154],[155,156],[156,157],[158,159],[159,160],[161,162],[163,164],[165,166],[167,168],[170,171],[175,176],[176,468],[177,178],[179,180],[180,181],[298,183],[183,184],[438,185],[187,188],[188,189],[190,424],[191,192],[193,469],[194,195],[198,430],[200,429],[360,202],[204,205],[207,472],[209,210],[215,461],[216,217],[218,219],[220,221],[221,473],[223,224],[458,226],[228,229],[231,232],[246,247],[247,248],[252,253],[253,254],[255,256],[256,257],[258,259],[259,260],[261,262],[263,264],[265,266],[265,268],[270,271],[271,272],[273,274],[274,275],[276,277],[278,279],[280,281],[281,282],[281,475],[283,284],[285,286],[287,288],[288,289],[290,291],[290,292],[293,294],[294,295],[296,297],[299,476],[300,301],[304,305],[305,306],[307,308],[309,310],[406,315],[315,407],[316,317],[318,319],[320,321],[322,323],[325,326],[328,329],[329,330],[331,332],[333,334],[339,340],[341,342],[343,344],[345,346],[347,348],[349,350],[353,354],[355,356],[356,477],[433,358],[361,362],[361,478],[363,364],[364,365],[366,367],[366,368],[371,372],[372,373],[374,375],[375,376]]) {
	IvCalculator.species_table[row[0] - 1].evolutions.set(row[1], IvCalculator.species_table[row[1] - 1]);
}
