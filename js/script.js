// style components
nav_height = $(".navbar").height();

function styleSetup() {

	$("#argoBrand")
	.effect("shake", {
		direction: "up",
		distance: 5,
		times: 3

	}, 1000)
	.animate({
		color: "#CECECE"
	},
	1000
	)
	
	// make sure correct section is highlighted
	function selectSection(){
		var window_top = 1.5*$(window).scrollTop();
		var div_top = $('#tool').offset().top - nav_height;
		if (window_top < div_top) {
			makeSelected('#aboutLink')
		} else {
			makeSelected('#toolLink')
		}
	}

	$(function() {
		$(window).scroll(selectSection);
		selectSection();
	});

	//	dynamic padding and div sizing on window resize
	function dynamicPadding() {
		if ($(window).width() < 993){
			$(".halfleftpadding")
			.removeClass("halfleftpadding")
			.addClass("templeftPadding")

			$(".halfrightpadding")
			.removeClass("halfrightpadding")
			.addClass("temprightPadding")

		} else {
			$(".templeftPadding")
			.removeClass("templeftPadding")
			.addClass("halfleftpadding")

			$(".temprightPadding")
			.removeClass("temprightPadding")
			.addClass("halfrightpadding")
		}
	}

	function dynamicSizing() {
		// $("#extraUtility").css("min-height", `calc(100vh - ${nav_height}px)`);
		$("#map, #detail, #imageContainer").css("height", `calc(100vh - ${nav_height}px)`);
		$("#marker").css('line-height', `calc(100vh - ${nav_height}px - 30px)`);
		$("body").css("padding-top", nav_height)

	}

	// dynamicPadding()
	dynamicSizing()

	$(window).resize(function(){
		nav_height = $(".navbar").height();
		dynamicSizing()
		// dynamicPadding()
	});
};

function makeSelected(element) {
	$(".selected").removeClass("selected");
	$(element).attr("class","selected");
};

function smoothScroll(divId){
	$("html, body").animate({scrollTop:
		$(divId).offset().top - nav_height}, 1000)
};

function transition(element, content){
	$(element).fadeOut(function() {
		$(element).html(content);
		$(element).fadeIn();
	});
}

function imageTransition(imgUrl, clean_date, ride_quality_raw, ride_quality_score) {
	transition('#imageDate', clean_date)
	transition('#rideQuality_raw', ride_quality_raw)
	transition('#rideQuality_score', ride_quality_score)
	$('#rightNext, #leftNext').fadeOut();
	$('#streetImg').fadeOut(function() {
		$('#loaderContainer').fadeIn();
		$('#streetImg')
		.attr('src', imgUrl)
		.load(function() {
			$('#loaderContainer').fadeOut(function() {
				$('#streetImg, #rightNext, #leftNext').fadeIn();
				$('#attributes').fadeIn();
			}
			);
		})
	});
}

function imageCycle(direction){

	if (direction == 'right'){
		inequality = '>',
		ordering = ''
	} else if (direction == 'left') {
		inequality = '<',
		ordering = 'desc'
	}
	query = `
	WITH cte AS (
		SELECT cartodb_id,
		${config.column_names.img_location},
		${config.column_names.ride_quality},
		ROUND(${config.column_names.ride_quality}::numeric, 2) ride_quality_round,
		to_char(${config.column_names.date}, 'Mon DD, YYYY') clean_date,
		TRUNC(100*((${config.column_names.ride_quality} - ${globals.max}) / (${globals.min} - ${globals.max}))) ride_quality_score,
		to_char(${config.column_names.date}, 'HH24:MI:SS') string_date
		FROM ${config.geometry_table}
		WHERE trip_id = ${state.trackID}
		)
	SELECT *
	FROM cte
	WHERE string_date ${inequality} '${state.string_date}'
	ORDER BY string_date ${ordering}
	LIMIT 1`;
	encoded_query = encodeURIComponent(query);
	url = `https://${config.account}.carto.com/api/v2/sql?q=${encoded_query}`
	$.getJSON(url, function(idxData) {
		try {
			// not fully parameterized
			globals.sublayers[0].trigger('featureClick', null, null, null,
			{
				cartodb_id : idxData.rows[0]['cartodb_id'],
				trip_id : state.trackID,
				string_date : idxData.rows[0]['string_date'],
				ride_quality_round : idxData.rows[0]['ride_quality_round'],
				image_url : idxData.rows[0][config.column_names.img_location],
				ride_quality_score : idxData.rows[0]['ride_quality_score']
			});
		}
		catch(err) {
			console.log('Psst, no images that way...');
		}


	});
}

function legendSetup(){
	$(function () {
		$('.legend-title')
		.html(
		` <div class="input-group">

            <span class="input-group-addon fixed-width" id="qualityMeasure-addon">
              Ride Quality Measure
            </span>
            <div>
              <input type="text" class="form-control" id="qualityMeasure" aria-describedby="qualityMeasure-addon" disabled>
            </div>
            <div class="input-group-btn dropup">
              <!-- <button tabindex="0" class="btn btn-default" id="qualityMeasure_wrapper" data-toggle="popover" data-title="Ride Quality Measure Note" aria-expanded="false"><i class="glyphicon glyphicon-info-sign"></i></button>-->
              <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"><i class="glyphicon glyphicon-menu-hamburger"></i></button>
              <ul class="dropdown-menu dropdown-menu-right">
                <li><a id="raw" href="javascript: legendToggle('#qualityMeasure', '#raw');">Accelerometer Reading</a></li>
                <li><a id="score" href="javascript: legendToggle('#qualityMeasure', '#score');">Relative Score (0-100)</a></li>
              </ul>
            </div>
          </div>`
		)
	$(".min").css("text-transform" , "lowercase")
	$(".max").css("text-transform" , "lowercase")
	$('.cartodb-legend-stack').css({
			"margin-left" : "15px",
			"margin-right" : "-5px"
		})

	$('[data-toggle="popover"]').popover({
			'trigger': 'focus',
			'placement' : 'top',
			'html' : 'true',
			'tabindex': "0"
		})
		$('[data-toggle="dropdown"]').dropdown()

	})
}

function legendToggle(displayForm_id, colName_id, setup=false) {

	var disclaimers = {
		"#score" : "<p>Customers without explicit household size data are assigned a default value based on the 2016 Census Block Group average household size.</p><p> In the absence of reliable dwelling unit data, the total household sizes of larger RESIDENTIAL_MULTI customers with many units will be underestimated using this approach.</p>",
		"#raw" : "<p>The most recent release of Census Block-level demographic data was 2010.</p><p>Population in areas that have experienced substantial population change since 2010 (e.g. new development) will be incorrectly estimated with this approach.</p>"
	}

	var legendText = {
		"#score" : ["0", "100"],
		"#raw" : ["5 g", "0 g"]
	}

	var cartoCSS = {
		"#score" : cartography.cartocss,
		"#raw" : `

		#table {

		marker-fill-opacity: .75;
		marker-line-width: 0;
		marker-width: 10;
		marker-allow-overlap: true;
		polygon-comp-op: multiply;

		}

		#table [ v_value > 4] {marker-fill: #D9534F;}
		#table [ v_value <= 4] { marker-fill: #D99F4F; }
		#table [ v_value <= 3] { marker-fill: #D9C24F; }
		#table [ v_value <= 2] { marker-fill: #B9D14C; }
		#table [ v_value <= 1] { marker-fill: #3EAB45; }


		`
	}


	$(displayForm_id+"_wrapper")
		.attr('data-content', disclaimers[colName_id])
		.popover('fixTitle')

	dataName = $(colName_id).html()
	$(displayForm_id).val(dataName)

	// transition('.min', legendText[colName_id][0])
	// transition('.max', legendText[colName_id][1])
	$('.min').html(legendText[colName_id][0])
	$('.max').html(legendText[colName_id][1])

	if (setup == false){
		globals.sublayers[0].setCartoCSS(cartoCSS[colName_id])
	};
	
}


// vizualization components
function mapSetup() {
	var map = new L.Map("map", {
		center: config.coordinates,
		zoom: config.zoom,
		scrollWheelZoom:false
	});

	// Highlight feature setup below based on: http://bl.ocks.org/javisantana/d20063afd2c96a733002
	var sql = new cartodb.SQL( {
		user: config.account,
		format: 'geojson' });
	var polygon;

	function showFeature(cartodb_id) {

		sql.execute(`select ST_Centroid(the_geom) as the_geom from ${config.geometry_table} where cartodb_id = {{cartodb_id}}`, {cartodb_id: cartodb_id} )
		.done(function(geojson) {
			if (polygon) {

				map.removeLayer(polygon);

			}
			polygon = L.geoJson(geojson, { 
				style: {}
			}).addTo(map);
		});
	}
	// End highlight feature setup

	var query = `
	SELECT
	cartodb_id,
	trip_id,
	${config.column_names.date},
	${config.column_names.img_location},
	the_geom,
	the_geom_webmercator,
	${config.column_names.ride_quality},
	ROUND(${config.column_names.ride_quality}::numeric, 2) ride_quality_round,
	to_char(${config.column_names.date}, 'HH24:MI:SS') string_date,
	to_char(${config.column_names.date}, 'Mon DD, YYYY') clean_date,
	TRUNC(100*((${config.column_names.ride_quality} - ${globals.max}) / (${globals.min} - ${globals.max}))) ride_quality_score
	FROM ${config.geometry_table}
	ORDER BY ${config.column_names.ride_quality}
	`

	var placeLayer = {
		user_name: config.account,
		type: 'cartodb',
		sublayers: [{
			sql: query,
			cartocss: cartography.cartocss,
			interactivity: [
			'trip_id',
			'string_date',
			config.column_names.date,
			'clean_date',
			'ride_quality_score',
			'ride_quality_round',
			config.column_names.img_location,
			'cartodb_id'
			]
		}]
	};

    // Pull tiles from OpenStreetMap
    L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
    	attribution: 'Powered by <a href="http://www.argolabs.org/">ARGO</a> | &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors</a>'
    }).addTo(map);

    $("#map").append(cartography.legend.render().el);


    cartodb.createLayer(map, placeLayer, options = {
    	https: true
    })
    .addTo(map, 0)
    .done(function(layer) {
    	
    	for (var i = 0; i < layer.getSubLayerCount(); i++) {
    		globals.sublayers[i] = layer.getSubLayer(i);
    	};
    	globals.sublayers[0].setInteraction(true);
    	globals.sublayers[0].on('featureClick', function(e, latlng, pos, data) {
    		$('#initalPrompt').fadeOut();
    		showFeature(data.cartodb_id)
    		state.featureID = data.cartodb_id
    		state.trackID = data.trip_id,
    		state.string_date = data['string_date'];
    		
    		imgUrl =  data[config.column_names.img_location],
    		clean_date = data['clean_date'],
    		ride_quality_score = data.ride_quality_score
    		ride_quality_raw = data['ride_quality_round']
    		
    		// transition('#rideQuality', config.column_names.ride_quality)
    		
    		imageTransition(imgUrl, clean_date, `${ride_quality_raw} g`, ride_quality_score)
    		
    	});
    	globals.sublayers[0].on('featureOver', function(e, latlng, pos, data) {
    		$("#map").css('cursor', 'pointer')
    	});

    	globals.sublayers[0].on('featureOut', function(e, latlng, pos, data) {
    		$("#map").css('cursor','')
    	});

    });
}


// app build
function main(){

	// style setup
	styleSetup();

	// vizualization setup
	mapSetup();
	legendSetup();
	legendToggle('#qualityMeasure', '#score', setup=true);

}