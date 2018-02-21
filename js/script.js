// style components
nav_height = $(".navbar").height();

function styleSetup() {

	$("#argoBrand").effect("shake", {
		direction: "up",
		distance: 5,
		times: 3

	}, 1000).animate({
		color: "#CECECE"
	}, 1000);

	// make sure correct section is highlighted
	function selectSection() {
		var window_top = 1.5 * $(window).scrollTop();
		var div_top = $('#tool').offset().top - nav_height;
		if (window_top < div_top) {
			makeSelected('#aboutLink');
		} else {
			makeSelected('#toolLink');
		}
	}

	$(function () {
		$(window).scroll(selectSection);
		selectSection();
	});

	//	dynamic padding and div sizing on window resize
	function dynamicPadding() {
		if ($(window).width() < 993) {
			$(".halfleftpadding").removeClass("halfleftpadding").addClass("templeftPadding");

			$(".halfrightpadding").removeClass("halfrightpadding").addClass("temprightPadding");
		} else {
			$(".templeftPadding").removeClass("templeftPadding").addClass("halfleftpadding");

			$(".temprightPadding").removeClass("temprightPadding").addClass("halfrightpadding");
		}
	}

	function dynamicSizing() {
		// $("#extraUtility").css("min-height", `calc(100vh - ${nav_height}px)`);
		$("#map, #detail, #imageContainer").css("height", "calc(100vh - " + nav_height + "px)");
		$("#marker").css('line-height', "calc(100vh - " + nav_height + "px - 30px)");
		$("body").css("padding-top", nav_height);
	}

	// dynamicPadding()
	dynamicSizing();

	$(window).resize(function () {
		nav_height = $(".navbar").height();
		dynamicSizing();
		// dynamicPadding()
	});
};

function makeSelected(element) {
	$(".selected").removeClass("selected");
	$(element).attr("class", "selected");
};

function smoothScroll(divId) {
	$("html, body").animate({ scrollTop: $(divId).offset().top - nav_height }, 1000);
};

function transition(element, content) {
	$(element).fadeOut(function () {
		$(element).html(content);
		$(element).fadeIn();
	});
}

function imageTransition(imgUrl, clean_date, ride_quality_raw, ride_quality_score, ride_quality_score_track) {
	transition('#imageDate', clean_date);
	transition('#rideQuality_raw', ride_quality_raw);
	transition('#rideQuality_score', ride_quality_score);
	transition('#rideQuality_score_track', ride_quality_score_track);
	$('#rightNext, #leftNext').fadeOut();
	$('#streetImg').fadeOut(function () {
		$('#loaderContainer').fadeIn();
		$('#streetImg').attr('src', imgUrl).load(function () {
			$('#loaderContainer').fadeOut(function () {
				$('#streetImg, #rightNext, #leftNext').fadeIn();
				$('#attributes').fadeIn();
			});
		});
	});
}

function imageCycle(direction) {

	if (direction == 'right') {
		inequality = '>', ordering = '';
	} else if (direction == 'left') {
		inequality = '<', ordering = 'desc';
	}
	query = "\n\tWITH CTE_mx_mn AS (\n\t\tSELECT\n\t\t\tMAX(v_value) local_max,\n\t\t\tMIN(v_value) local_min,\n\t\t\tMAX(v_value) - MIN(v_value) diff,\n\t\t\ttrip_id\n\t\tFROM " + config.geometry_table + "\n\t\tGROUP BY trip_id\n\t\t),\n\t\n\n\tcte AS (\n\t\tSELECT cartodb_id,\n\t\t" + config.column_names.img_location + ",\n\t\t" + config.column_names.ride_quality + ",\n\t\tROUND(" + config.column_names.ride_quality + "::numeric, 3) ride_quality_round,\n\t\tto_char(" + config.column_names.date + ", 'Mon DD, YYYY') clean_date,\n\t\tTRUNC(100*((" + config.column_names.ride_quality + " - " + globals.max + ") / (" + globals.min + " - " + globals.max + "))) ride_quality_score,\n\t\tTRUNC(100*((" + config.column_names.ride_quality + " - local_max) / (local_min - local_max))) ride_quality_score_track,\n\t\tto_char(" + config.column_names.date + ", 'HH24:MI:SS') string_date\n\t\tFROM " + config.geometry_table + " all_data, CTE_mx_mn\n\t\tWHERE all_data.trip_id = " + state.trackID + "\n\t\tAND all_data.trip_id = CTE_mx_mn.trip_id\n\t\tAND diff != 0\n\t\t)\n\tSELECT *\n\tFROM cte\n\tWHERE string_date " + inequality + " '" + state.string_date + "'\n\tORDER BY string_date " + ordering + "\n\tLIMIT 1";
	encoded_query = encodeURIComponent(query);
	url = "https://" + config.account + ".carto.com/api/v2/sql?q=" + encoded_query;
	$.getJSON(url, function (idxData) {
		try {
			// not fully parameterized
			globals.sublayers[0].trigger('featureClick', null, null, null, {
				cartodb_id: idxData.rows[0]['cartodb_id'],
				trip_id: state.trackID,
				string_date: idxData.rows[0]['string_date'],
				ride_quality_round: idxData.rows[0]['ride_quality_round'],
				image_url: idxData.rows[0][config.column_names.img_location],
				ride_quality_score: idxData.rows[0]['ride_quality_score'],
				ride_quality_score_track: idxData.rows[0]['ride_quality_score_track']
			});
		} catch (err) {
			console.log('Psst, no images that way...');
		}
	});
}

function legendSetup() {
	$(function () {
		$('.legend-title').html(" <div class=\"input-group\">\n\n            <span class=\"input-group-addon fixed-width\" id=\"qualityMeasure-addon\">\n              Ride Quality Measure\n            </span>\n            <div>\n              <input type=\"text\" class=\"form-control\" id=\"qualityMeasure\" aria-describedby=\"qualityMeasure-addon\" disabled>\n            </div>\n            <div class=\"input-group-btn dropup\">\n              <button tabindex=\"0\" class=\"btn btn-default\" id=\"qualityMeasure_wrapper\" data-toggle=\"popover\" data-title=\"Notes\" aria-expanded=\"false\"><i class=\"glyphicon glyphicon-info-sign\"></i></button>\n              <button type=\"button\" class=\"btn btn-default dropdown-toggle\" data-toggle=\"dropdown\" aria-haspopup=\"true\" aria-expanded=\"false\"><i class=\"glyphicon glyphicon-menu-hamburger\"></i></button>\n              <ul class=\"dropdown-menu dropdown-menu-right\">\n                <li><a id=\"raw\" href=\"javascript: legendToggle('#qualityMeasure', '#raw');\">Accelerometer Reading</a></li>\n                <li><a id=\"score\" href=\"javascript: legendToggle('#qualityMeasure', '#score');\">Between Track Score (0-100)</a></li>\n                <li><a id=\"score_track\" href=\"javascript: legendToggle('#qualityMeasure', '#score_track');\">Within Track Score (0-100)</a></li>\n              </ul>\n            </div>\n          </div>");
		$(".min").css("text-transform", "lowercase");
		$(".max").css("text-transform", "lowercase");
		$('.cartodb-legend-stack').css({
			"margin-left": "15px",
			"margin-right": "-5px"
		});

		$('[data-toggle="popover"]').popover({
			'trigger': 'focus',
			'placement': 'top',
			'html': 'true',
			'tabindex': "0"
		});
		$('[data-toggle="dropdown"]').dropdown();
	});
}

function legendToggle(displayForm_id, colName_id) {
	var setup = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;


	//not currently in use
	var disclaimers = {
		"#score": "\n\t\t<p><small>\n\t\t\n\t\t<b>Definition:</b> The <i>Between Track Score</i> ranks accelerometer readings across all tracks in the city.\n\t\t\n\t\t</small></p>\n\t\t\n\t\t<p><small>\n\n\t\t<b>Disclaimer:</b> While this measure is track-agnostic, different vehicles may have non-trivially different suspensions. To account for this, check the <i>Within Track Score</i> as well. \n\n\t\t</small></p>\n\t\t",

		"#score_track": "\n\t\t<p><small>\n\t\t\n\t\t<b>Definition:</b> The <i>Within Track Score</i> ranks accelerometer readings across all measurements in the selected track.\n\t\t\n\t\t</small></p>\n\n\t\t<p><small>\n\n\t\t<b>Disclaimer:</b> While this measure normalizes across all measurements in the selected track, certain tracks may only traverse high quality streets. To account for this, check the other measures as well. \n\n\t\t</small></p>\n\t\t",

		"#raw": "\n\t\t<p><small>\n\t\t\n\t\t<b>Definition:</b> The <i>Accelerometer Reading</i> represents the raw accelerometer readings.\n\t\t\n\t\t</small></p>\n\n\t\t<p><small>\n\n\t\t<b>Disclaimer:</b> While this measure is track-agnostic, different vehicles may have non-trivially different suspensions. To account for this, check the <i>Within Track Score</i> as well. \n\n\t\t</small></p>\n\t\t"

		// var colNames = {
		// 	"#score" : 'ride_quality_score',
		// 	"#score_track" : 'ride_quality_score_track',
		// 	"#raw" : "v_value"
		// }
		// config.column_names.ride_quality_colName_id = colNames[colName_id]

	};var legendText = {
		"#score": ["0", "100"],
		"#score_track": ["0", "100"],
		"#raw": ["5 g", "0 g"]
	};

	var cartoCSS = {
		"#score": "\n\t\t#table {\n\t\tmarker-fill-opacity: .75;\n\t\tmarker-line-width: 0;\n\t\tmarker-width: 10;\n\t\tmarker-allow-overlap: true;\n\t\tpolygon-comp-op: multiply;\n\t\t}\n\n\t\t#table [ ride_quality_score > 100] {marker-fill: gray;}\n\t\t#table [ ride_quality_score <= 100] {marker-fill: #3EAB45;}\n\t\t#table [ ride_quality_score <= 80] { marker-fill: #B9D14C; }\n\t\t#table [ ride_quality_score <= 60] { marker-fill: #D9C24F; }\n\t\t#table [ ride_quality_score <= 40] { marker-fill: #D99F4F; }\n\t\t#table [ ride_quality_score <= 20] { marker-fill: #D9534F; }\n\t\t",
		"#score_track": "\n\t\t#table {\n\t\tmarker-fill-opacity: .75;\n\t\tmarker-line-width: 0;\n\t\tmarker-width: 10;\n\t\tmarker-allow-overlap: true;\n\t\tpolygon-comp-op: multiply;\n\t\t}\n\n\t\t#table [ ride_quality_score_track > 100] {marker-fill: gray;}\n\t\t#table [ ride_quality_score_track <= 100] {marker-fill: #3EAB45;}\n\t\t#table [ ride_quality_score_track <= 80] { marker-fill: #B9D14C; }\n\t\t#table [ ride_quality_score_track <= 60] { marker-fill: #D9C24F; }\n\t\t#table [ ride_quality_score_track <= 40] { marker-fill: #D99F4F; }\n\t\t#table [ ride_quality_score_track <= 20] { marker-fill: #D9534F; }\n\t\t",
		"#raw": "\n\n\t\t#table {\n\n\t\tmarker-fill-opacity: .75;\n\t\tmarker-line-width: 0;\n\t\tmarker-width: 10;\n\t\tmarker-allow-overlap: true;\n\t\tpolygon-comp-op: multiply;\n\n\t\t}\n\n\t\t#table [ v_value > 4] {marker-fill: #D9534F;}\n\t\t#table [ v_value <= 4] { marker-fill: #D99F4F; }\n\t\t#table [ v_value <= 3] { marker-fill: #D9C24F; }\n\t\t#table [ v_value <= 2] { marker-fill: #B9D14C; }\n\t\t#table [ v_value <= 1] { marker-fill: #3EAB45; }\n\n\n\t\t"
	};

	$(displayForm_id + "_wrapper").attr('data-content', disclaimers[colName_id]).popover('fixTitle');

	dataName = $(colName_id).html();
	$(displayForm_id).val(dataName);

	// transition('.min', legendText[colName_id][0])
	// transition('.max', legendText[colName_id][1])
	$('.min').html(legendText[colName_id][0]);
	$('.max').html(legendText[colName_id][1]);

	if (setup == false) {
		globals.sublayers[0].setCartoCSS(cartoCSS[colName_id]);
	};
}

// vizualization components
function mapSetup() {
	var map = new L.Map("map", {
		center: config.coordinates,
		zoom: config.zoom,
		scrollWheelZoom: false
	});

	// Highlight feature setup below based on: http://bl.ocks.org/javisantana/d20063afd2c96a733002
	var sql = new cartodb.SQL({
		user: config.account,
		format: 'geojson' });
	var polygon;

	function showFeature(cartodb_id) {

		sql.execute("select ST_Centroid(the_geom) as the_geom from " + config.geometry_table + " where cartodb_id = {{cartodb_id}}", { cartodb_id: cartodb_id }).done(function (geojson) {
			if (polygon) {

				map.removeLayer(polygon);
			}
			polygon = L.geoJson(geojson, {
				style: {}
			}).addTo(map);
		});
	}
	// End highlight feature setup

	var query = "\n\twith CTE_mx_mn AS (\n\t\tSELECT\n\t\t\tMAX(v_value) local_max,\n\t\t\tMIN(v_value) local_min,\n\t\t\tMAX(v_value) - MIN(v_value) diff,\n\t\t\ttrip_id\n\t\tFROM " + config.geometry_table + "\n\t\tGROUP BY trip_id\n\t\t)\n\t\n\n\tSELECT\n\tcartodb_id,\n\tall_data.trip_id,\n\t" + config.column_names.date + ",\n\t" + config.column_names.img_location + ",\n\tthe_geom,\n\tthe_geom_webmercator,\n\t" + config.column_names.ride_quality + ",\n\tROUND(" + config.column_names.ride_quality + "::numeric, 2) ride_quality_round,\n\tto_char(" + config.column_names.date + ", 'HH24:MI:SS') string_date,\n\tto_char(" + config.column_names.date + ", 'Mon DD, YYYY') clean_date,\n\tTRUNC(100*((" + config.column_names.ride_quality + " - " + globals.max + ") / (" + globals.min + " - " + globals.max + "))) ride_quality_score,\n\tTRUNC(100*((" + config.column_names.ride_quality + " - local_max) / (local_min - local_max))) ride_quality_score_track\n\tFROM " + config.geometry_table + " all_data, CTE_mx_mn\n\tWHERE all_data.trip_id = CTE_mx_mn.trip_id\n\tAND diff != 0\n\tORDER BY " + config.column_names.ride_quality + "\n\t";

	var placeLayer = {
		user_name: config.account,
		type: 'cartodb',
		sublayers: [{
			sql: query,
			cartocss: cartography.cartocss,
			interactivity: ['trip_id', 'string_date', config.column_names.date, 'clean_date', 'ride_quality_score', 'ride_quality_score_track', 'ride_quality_round', config.column_names.img_location, 'cartodb_id']
		}]
	};

	// Pull tiles from OpenStreetMap
	L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
		attribution: 'Powered by <a href="http://www.argolabs.org/">ARGO</a> | &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors</a>'
	}).addTo(map);

	$("#map").append(cartography.legend.render().el);

	cartodb.createLayer(map, placeLayer, options = {
		https: true
	}).addTo(map, 0).done(function (layer) {

		for (var i = 0; i < layer.getSubLayerCount(); i++) {
			globals.sublayers[i] = layer.getSubLayer(i);
		};
		globals.sublayers[0].setInteraction(true);
		globals.sublayers[0].on('featureClick', function (e, latlng, pos, data) {
			$('#initalPrompt').fadeOut();
			showFeature(data.cartodb_id);
			state.featureID = data.cartodb_id;
			state.trackID = data.trip_id, state.string_date = data['string_date'];

			imgUrl = data[config.column_names.img_location], clean_date = data['clean_date'], ride_quality_score = data.ride_quality_score;
			ride_quality_score_track = data.ride_quality_score_track;
			ride_quality_raw = data['ride_quality_round'];

			// transition('#rideQuality', config.column_names.ride_quality)

			imageTransition(imgUrl, clean_date, ride_quality_raw + " g", ride_quality_score, ride_quality_score_track);
		});
		globals.sublayers[0].on('featureOver', function (e, latlng, pos, data) {
			$("#map").css('cursor', 'pointer');
		});

		globals.sublayers[0].on('featureOut', function (e, latlng, pos, data) {
			$("#map").css('cursor', '');
		});
	});
}

// app build
function main() {

	// style setup
	styleSetup();

	// vizualization setup
	mapSetup();
	legendSetup();
	legendToggle('#qualityMeasure', '#score_track', setup = true);
}