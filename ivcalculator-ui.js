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
				min: parseInt($('#total_iv_val').val().split('-')[0], 10),
				max: parseInt($('#total_iv_val').val().split('-')[1], 10)
			}
		},
		best_stat: {
			sta: $('#best_sta').is(':checked'),
			atk: $('#best_atk').is(':checked'),
			def: $('#best_def').is(':checked'),
			iv: {
				min: parseInt($('#best_iv_val').val().split('-')[0], 10),
				max: parseInt($('#best_iv_val').val().split('-')[1], 10)
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
		let grade = '?';
		if( 45 === combo.iv_total() ) {
			grade = 'S';
		} else if( combo.iv_total() >= 41 ) {
			grade = 'A';
		} else if( combo.iv_total() >= 37 ) {
			grade = 'B';
		} else if( combo.iv_total() >= 33 ) {
			grade = 'C';
		} else if( combo.iv_total() >= 29 ) {
			grade = 'D';
		} else if( combo.iv_total() >= 25 ) {
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
				.append($('<td>').text(combo.iv_sta + ' (' + Math.floor(combo.sta()) + ')'))
				.append($('<td>').text(combo.iv_atk + ' (' + Math.floor(combo.atk()) + ')'))
				.append($('<td>').text(combo.iv_def + ' (' + Math.floor(combo.def()) + ')'))
				.append($('<td>').text((Math.floor( combo.iv_perc() * 1000 ) / 10) + '%'))
				.append($('<td>').text(grade))
				.append($('<td>').append(button))
		);
	}
});

$(document).on('click', '#button_more', function() {
	let i = 1;
	for(; (i <= 100) && (0 < $('#specimen' + i + '_cp').length); ++i);

	let template = '<div class="form-group specimen-group"><label for="specimen1_cp">Values</label><div class="row"><div class="cell-md-6"><input type="number" id="specimen1_cp" min="10" max="9999" data-role="input" data-prepend="CP"></div><div class="cell-md-6"><input type="number" id="specimen1_hp" min="10" max="9999" data-role="input" data-prepend="HP"></div></div><div class="row"><div class="cell-md-6"><input type="number" id="specimen1_stardust" min="200" max="10000" data-role="input" data-prepend="Stardust"></div><div class="cell-md-6"><select id="specimen1_powered" data-role="select" data-prepend="Powered?"><option value="1" selected>Yes or maybe</option><option value="0">Definately not</option></select></div></div></div>';
	let node = $(template.replace(/specimen1/g, 'specimen' + i));
	node.find('label').text('Values ' + i);

	$('#specimen' + (i - 1) + '_cp').parents('.form-group').after(node);
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
	$('.specimen-group:gt(0)').remove();

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

		if( key.startsWith('specimen') ) {
			let i = parseInt(key.split('_')[0].substr(8), 10);
			while( $('.specimen-group').length < i ) {
				$('#button_more').click();
			}
		}

		let x = $('#main_form #' + key);

		if( x.is('[type="checkbox"]') ) {
			x.prop('checked', 'true' === val).change();
		} else if( x.is('select') && x.data('select') ) {
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

	let combo = $(this).data('combo').clone();

	$('#future tbody tr').remove();

	let combo_list = [];
	for(let x of $('#output button')) {
		combo_list.push($(x).data('combo').clone());
	}

	for(; combo.lvl < 80; ++combo.lvl) {
		let matching_combo_list = [];
		for(let other_combo of combo_list) {
			other_combo.lvl = combo.lvl;

			let exists = matching_combo_list.find(function(a) {
				return (a.cp() == other_combo.cp()) && (a.hp() == other_combo.hp());
			});

			if( undefined === exists ) {
				matching_combo_list.push(other_combo);
			}
		}

		let tr = $('<tr>')
			.append($('<td>').text(combo.lvl + 1))
			.append($('<td>').text(combo.cp()))
			.append($('<td>').text(combo.hp()))
			.append($('<td>').text(IvCalculator.power_up_table[combo.lvl][1]))
			.append($('<td>').text(IvCalculator.power_up_table[combo.lvl][2]))
		;

		if( matching_combo_list.length == combo_list.length ) {
			//There is one different cp / hp for each combo
			//This means that at this level you are guaranteed to know
			//which combo is the richt one
			tr.addClass('success');
		} else if( 1 < matching_combo_list.length ) {
			//There are at least two combinations possible
			//While this doesn't give you the exact numbers,
			//it at least narrows it down
			tr.addClass('info');
		} // else: Only 1 combo => all options are indistinguishable

		$('#future tbody').append(tr);
	}
});
