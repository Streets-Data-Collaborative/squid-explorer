////// visualization state object and global data object
state = {
	"featureID" : "<UNIQUE_IDENTIFIER>",
	"trackID" : "<UNIQUE_TRACK_IDENTIFIER>",
	"string_date" : "<TIME>",
	"minQuality" : "<MINIMUM_RIDE_QUALITY>",
	"maxQuality" : "<MAX_RIDE_QUALITY>"
}

globals = {
	"sublayers" : [],
	"max" : "",
	"min" : ""
}

function dataSetup(callback) {
	query = `
	SELECT *
	FROM ${config.geometry_table}`;
	encoded_query = encodeURIComponent(query);
	url = `https://${config.account}.carto.com/api/v2/sql?q=${encoded_query}`
	$.getJSON(url, function(idxData) {
		var	min = 0,
		max = idxData.total_rows,
		randIdx =  Math.floor(Math.random() * (max - min)) + min,
		randLocation = idxData.rows[randIdx]['cartodb_id'];
		state.featureID = randLocation
		state.trackID = idxData.rows[randIdx]['trip_id']
		state.string_date = idxData.rows[randIdx]['string_date']


		query = `
		SELECT
			max(${config.column_names.ride_quality}) mx,
			min(${config.column_names.ride_quality}) mn
		FROM ${config.attribute_table}`,
		encoded_query = encodeURIComponent(query),
	url = `https://${config.account}.carto.com/api/v2/sql?q=${encoded_query}`;

	$.getJSON(url, function(qualityData) {
		globals.max = qualityData.rows[0]['mx'];
		globals.min = qualityData.rows[0]['mn'];
		callback();
	});

});

}




////// cartography object

var cartography = {
	"cartocss" : "<GEOM_DEPENDENT>",
	"legend" : "<GEOM_DEPENDENT>",
	'tooltip' :
	`
	<div class="cartodb-tooltip-content-wrapper light">
	<div class="cartodb-tooltip-content">
	<h3>Block-level</h3>
	<h4>FIPS code</h4>
	<p>{{hr_name}}</p>
	<h4>Percent Over/Under Target</h4>
	<p>{{percentdifference}}%</p>
	<h4>Population</h4>
	<p>{{population}}</p>
	<h3>Group-level</h3>
	<h4>Median Income</h4>
	<p>\${{income}}</p>
	<h4>Median Year Structure Built</h4>
	<p>{{year_built}}</p>
	<h4>Characteristic Education</h4>
	<p>{{ed}}</p>
	<h4>Primary Limited English Speaking Household Language</h4>
	<p>{{limited_english}}</p>
	</div>
	</div>
	`

}

// define legend
// (should probably be contained within some cartographySetup() function for increased elegance)
choropleth = new cdb.geo.ui.Legend({
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
	},		{
		name: "bin5",
		value: "#3EAB45"
	}]
})

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
})
};

// define cartocss
if (config.geom_type == "point") {
	cartography.cartocss =
	`#table {
		marker-fill-opacity: .75;
		marker-line-width: 0;
		marker-width: 10;
		marker-allow-overlap: true;
		polygon-comp-op: multiply;
		}

		#table [ ${config.column_names.ride_quality_colName_id} > 100] {marker-fill: gray;}
		#table [ ${config.column_names.ride_quality_colName_id} <= 100] {marker-fill: #3EAB45;}
		#table [ ${config.column_names.ride_quality_colName_id} <= 80] { marker-fill: #B9D14C; }
		#table [ ${config.column_names.ride_quality_colName_id} <= 60] { marker-fill: #D9C24F; }
		#table [ ${config.column_names.ride_quality_colName_id} <= 40] { marker-fill: #D99F4F; }
		#table [ ${config.column_names.ride_quality_colName_id} <= 20] { marker-fill: #D9534F; }

	`
}
