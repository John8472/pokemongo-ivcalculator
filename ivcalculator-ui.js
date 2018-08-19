$(document).ready(function() {
	let map = {};

	map['0'] = 'Custom';
	$(IvCalculator.species_table).each(function(idx, stats) {
		map[ '' + stats[0] ] = stats[1];
	});

	$('#species_id').data('select').data(map);
});

$(document).on('change', '#species_id', function() {
	let id = $(this).val();
	if( id === '0' ) {
		$('#custom_species input').prop('disabled', false);
	} else {
		id = parseInt(id, 10);

		$('#custom_species input').prop('disabled', true);

		$('#species_sta').val( IvCalculator.species_table[ id - 1 ][2] );
		$('#species_atk').val( IvCalculator.species_table[ id - 1 ][3] );
		$('#species_def').val( IvCalculator.species_table[ id - 1 ][4] );
	}
});

$(document).on('click', '#button_run', function() {
	let grade_to_class = {
		'S': 'primary',
		'A': 'secondary',
		'B': 'success',
		'C': 'yellow'
	};

	let species = {
		sta: parseInt($('#species_sta').val(), 10),
		atk: parseInt($('#species_atk').val(), 10),
		def: parseInt($('#species_def').val(), 10)
	};

	let appraisal = {
		total: {
			iv: {
				min: parseInt($('#total_iv_val').data('select').val().split('-')[0], 10),
				max: parseInt($('#total_iv_val').data('select').val().split('-')[1], 10)
			}
		},
		best_stat: {
			sta: $('#best_sta').is(':checked'),
			atk: $('#best_atk').is(':checked'),
			def: $('#best_def').is(':checked'),
			iv: {
				min: parseInt($('#best_iv_val').data('select').val().split('-')[0], 10),
				max: parseInt($('#best_iv_val').data('select').val().split('-')[1], 10)
			}
		}
	};

	let measurement_list = [];
	for(let i = 1; 1 == $('#specimen' + i + '_hp').length; ++i) {
		let measurement = {
			cp: parseInt($('#specimen' + i + '_cp').val(), 10),
			hp: parseInt($('#specimen' + i + '_hp').val(), 10),
			stardust: parseInt($('#specimen' + i + '_stardust').val(), 10),
			was_powered: 0 < parseInt($('#specimen' + i + '_powered').val(), 10)
		};

		if( !measurement.cp || !measurement.hp || !measurement.stardust ) continue;

		measurement_list.push(measurement);
	}

	let calculator = new IvCalculator();

	let possible_combos = calculator.calculate(species, appraisal, measurement_list);

	$('#output tbody tr').remove();

	for(let combo of possible_combos) {
		let sta = IvCalculator.calc_sta(species, combo.sta, combo.lvl);
		let atk = IvCalculator.calc_atk(species, combo.atk, combo.lvl);
		let def = IvCalculator.calc_def(species, combo.def, combo.lvl);

		let iv_total = combo.sta + combo.atk + combo.def;
		let iv_perc = iv_total / 45;

		let grade = '?';
		if( 45 === iv_total ) {
			grade = 'S';
		} else if( iv_total >= 41 ) {
			grade = 'A';
		} else if( iv_total >= 37 ) {
			grade = 'B';
		} else if( iv_total >= 33 ) {
			grade = 'C';
		} else if( iv_total >= 29 ) {
			grade = 'D';
		} else if( iv_total >= 25 ) {
			grade = 'E';
		} else {
			grade = 'F';
		}

		var button = $('<button type="button">')
			.data('combo', combo)
			.addClass('button primary cycle small outline')
			.text('\u21B4')
		;

		$('#output tbody').append(
			$('<tr>').addClass(grade_to_class[grade])
				.append($('<td>').text(combo.lvl + 1))
				.append($('<td>').text(combo.sta + ' (' + Math.floor(sta) + ')'))
				.append($('<td>').text(combo.atk + ' (' + Math.floor(atk) + ')'))
				.append($('<td>').text(combo.def + ' (' + Math.floor(def) + ')'))
				.append($('<td>').text((Math.floor( iv_perc * 1000 ) / 10) + '%'))
				.append($('<td>').text(grade))
				.append($('<td>').append(button))
		);
	}
});

$(document).on('click', '#button_example', function() {
	$('#species_id').data('select').val(4);

	$('#total_iv_val').data('select').val('37-45');
	$('#best_sta').prop('checked', false);
	$('#best_atk').prop('checked', true);
	$('#best_def').prop('checked', false);
	$('#best_iv_val').data('select').val('15-15');

	$('#specimen1_cp').val(465);
	$('#specimen1_hp').val(53);
	$('#specimen1_stardust').val(2500);
	$('#button_run').click();
});

$(document).on('click', '#button_reset', function() {
	$('#main_form input[type="checkbox"]').each(function() {
		this.checked = this.defaultChecked;
	});
	$('#main_form input[type="text"], #main_form input[type="number"]').each(function() {
		this.value = this.defaultValue;
	});
	$('#main_form select').each(function() {
		let t = $(this);
		t.data('select').val( t.find('option:first').val() );
	});
});

$(document).on('click', '#button_import', function() {
	$('#button_reset').click();

	let txt = $('#imexport').val().split('\n');

	for(let line of txt) {
		let parts = line.split(':=', 2);
		if( parts.length < 2 ) continue;

		let key = parts[0].trim();
		let val = parts[1].trim();

		let x = $('#main_form #' + key);

		if( x.is('[type="checkbox"]') ) {
			x.prop('checked', 'true' === val).change();
		} else if( x.is('select') ) {
			x.data('select').val(val);
		} else {
			x.val(val);
		}
	}

	$('#button_run').click();
});

$(document).on('click', '#button_export', function() {
	var txt = '';

	for(var x of $('#main_form').find('input, select')) {
		x = $(x);

		if( !x.attr('id') ) continue;
		if( x.is(':disabled') ) continue;

		var val = x.val();
		if( x.is('[type="checkbox"]') ) {
			val = x.is(':checked') ? 'true' : 'false';
		}

		txt += x.attr('id') + ' := ' + val + '\n';
	}

	$('#imexport').val( txt );
});

$(document).on('click', '#output button', function() {
	let species = {
		sta: parseInt($('#species_sta').val(), 10),
		atk: parseInt($('#species_atk').val(), 10),
		def: parseInt($('#species_def').val(), 10)
	};

	let combo = $(this).data('combo');

	$('#future tbody tr').remove();

	for(let lvl_idx = combo.lvl; lvl_idx < 80; ++lvl_idx) {
		let sta = IvCalculator.calc_sta(species, combo.sta, lvl_idx);
		let atk = IvCalculator.calc_atk(species, combo.atk, lvl_idx);
		let def = IvCalculator.calc_def(species, combo.def, lvl_idx);

		let cp = IvCalculator.calc_cp(sta, atk, def);
		let hp = IvCalculator.calc_hp(species, combo.sta, lvl_idx);

		$('#future tbody').append(
			$('<tr>')
				.append($('<td>').text(lvl_idx + 1))
				.append($('<td>').text(cp))
				.append($('<td>').text(hp))
				.append($('<td>').text(IvCalculator.power_up_table[lvl_idx][1]))
		);
	}
});
