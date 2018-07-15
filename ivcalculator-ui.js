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

		$('#output tbody').append(
			$('<tr>')
				.append($('<td>').text(combo.lvl))
				.append($('<td>').text(combo.sta + ' (' + Math.floor(sta) + ')'))
				.append($('<td>').text(combo.atk + ' (' + Math.floor(atk) + ')'))
				.append($('<td>').text(combo.def + ' (' + Math.floor(def) + ')'))
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
