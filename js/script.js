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

function imageTransition(imgUrl, clean_date, ride_quality) {
	transition('#imageDate', clean_date)
	transition('#rideQuality', ride_quality)
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
		to_char(${config.column_names.date}, 'Mon YY (HH24:MI:SS)') clean_date,
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
			imgUrl = idxData.rows[0][config.column_names.img_location],
			clean_date = idxData.rows[0]['clean_date'],
			ride_quality_score = idxData.rows[0]['ride_quality_score'],

			imageTransition(imgUrl, clean_date, ride_quality_score)

			globals.sublayers[0].trigger('featureClick', null, null, null,
			{
				cartodb_id : idxData.rows[0]['cartodb_id'],
				trip_id : state.trackID,
				string_date : idxData.rows[0]['string_date']

			});;
		}
		catch(err) {
			console.log('Psst, no images that way...');
		}


	});
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
	SELECT *,
	to_char(${config.column_names.date}, 'HH24:MI:SS') string_date,
	to_char(${config.column_names.date}, 'Mon YY (HH24:MI:SS)') clean_date,
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
			config.column_names.ride_quality,
			config.column_names.img_location,
			'cartodb_id',
			'id'
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
    		
    		// transition('#rideQuality', config.column_names.ride_quality)
    		
    		imageTransition(imgUrl, clean_date, ride_quality_score)
    		
    		// $('#streetImg').attr('src', 'https://storage4.openstreetcam.org/files/photo/2017/5/30/proc/402532_f3ccd_592dbf20cbdd7.jpg')
    		
    		
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

}