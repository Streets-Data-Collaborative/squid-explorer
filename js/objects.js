////// visualization state object and global data object
state = {
	"featureID": "<UNIQUE_IDENTIFIER>",
	"trackID": "<UNIQUE_TRACK_IDENTIFIER>",
	"string_date": "<TIME>",
	"minQuality": "<MINIMUM_RIDE_QUALITY>",
	"maxQuality": "<MAX_RIDE_QUALITY>"
};

globals = {
	"sublayers": [],
	"max": "",
	"min": ""
};

function dataSetup(callback) {
	query = "\n\tSELECT *\n\tFROM " + config.geometry_table;
	encoded_query = encodeURIComponent(query);
	url = "https://" + config.account + ".carto.com/api/v2/sql?q=" + encoded_query;
	$.getJSON(url, function (idxData) {
		var min = 0,
		    max = idxData.total_rows,
		    randIdx = Math.floor(Math.random() * (max - min)) + min,
		    randLocation = idxData.rows[randIdx]['cartodb_id'];
		state.featureID = randLocation;
		state.trackID = idxData.rows[randIdx]['trip_id'];
		state.string_date = idxData.rows[randIdx]['string_date'];

		query = "\n\t\tSELECT\n\t\t\tmax(" + config.column_names.ride_quality + ") mx,\n\t\t\tmin(" + config.column_names.ride_quality + ") mn\n\t\tFROM " + config.attribute_table, encoded_query = encodeURIComponent(query), url = "https://" + config.account + ".carto.com/api/v2/sql?q=" + encoded_query;

		$.getJSON(url, function (qualityData) {
			globals.max = qualityData.rows[0]['mx'];
			globals.min = qualityData.rows[0]['mn'];
			callback();
		});
	});
}

////// cartography object

var cartography = {
	"cartocss": "<GEOM_DEPENDENT>",
	"legend": "<GEOM_DEPENDENT>",
	'tooltip': "\n\t<div class=\"cartodb-tooltip-content-wrapper light\">\n\t<div class=\"cartodb-tooltip-content\">\n\t<h3>Block-level</h3>\n\t<h4>FIPS code</h4>\n\t<p>{{hr_name}}</p>\n\t<h4>Percent Over/Under Target</h4>\n\t<p>{{percentdifference}}%</p>\n\t<h4>Population</h4>\n\t<p>{{population}}</p>\n\t<h3>Group-level</h3>\n\t<h4>Median Income</h4>\n\t<p>${{income}}</p>\n\t<h4>Median Year Structure Built</h4>\n\t<p>{{year_built}}</p>\n\t<h4>Characteristic Education</h4>\n\t<p>{{ed}}</p>\n\t<h4>Primary Limited English Speaking Household Language</h4>\n\t<p>{{limited_english}}</p>\n\t</div>\n\t</div>\n\t"

	// define legend
	// (should probably be contained within some cartographySetup() function for increased elegance)
};choropleth = new cdb.geo.ui.Legend({
	type: "choropleth",
	show_title: true,
	title: "Quality Index",
	data: [{
		value: "0 -------- 20 -------- 40 ------- 60 ------- 80 ----- 100"
	}, {
		value: ""
	}, {
		name: "bin1",
		value: "#D9534F"
	}, {
		name: "bin2",
		value: "#D99F4F"
	}, {
		name: "bin3",
		value: "#D9C24F"
	}, {
		name: "bin4",
		value: "#B9D14C"
	}, {
		name: "bin5",
		value: "#3EAB45"
	}]
});

if (config.geom_type == "point") {
	// var bubble = new cdb.geo.ui.Legend({
	// 	type: "bubble",
	// 	show_title: true,
	// 	title: "District Population",
	// 	data: [
	// 		{ value: "Smallest" },
	// 		{ value: "Largest" },
	// 		{ name: "graph_color", value: "#ccc" }
	// 		]
	// 	})
	cartography.legend = new cdb.geo.ui.StackedLegend({
		legends: [choropleth]
	});
};

// define cartocss
if (config.geom_type == "point") {
	cartography.cartocss = "#table {\n\t\tmarker-fill-opacity: .75;\n\t\tmarker-line-width: 0;\n\t\tmarker-width: 10;\n\t\tmarker-allow-overlap: true;\n\t\tpolygon-comp-op: multiply;\n\t\t}\n\n\t\t#table [ ride_quality_score > 80] {marker-fill: #3EAB45;}\n\t\t#table [ ride_quality_score <= 80] { marker-fill: #B9D14C; }\n\t\t#table [ ride_quality_score <= 60] { marker-fill: #D9C24F; }\n\t\t#table [ ride_quality_score <= 40] { marker-fill: #D99F4F; }\n\t\t#table [ ride_quality_score <= 20] { marker-fill: #D9534F; }\n\n\t";
}