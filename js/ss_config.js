var config = {
	"account" : "<CARTO_ACCOUNT>",
	"trackingID" : "<ANALYTICS_TRACKING_ID>",

	"geometry_table" : "<MUNI_DATA>",
	"zoom" : "<ZOOM_LEVEL>",
	"coordinates" : "<MAP_CENTER>",
	"geom_type" : "<GEOM_TYPE>",

	"attribute_table" : "<MUNI_DATA>",
	"column_names" : {
		"date" : '<TIMESTAMP>',
		"ride_quality" : '<RIDE_QUALITY>',
		"img_location" : "<LINK_TO_IMAGE>"
	}
}

//// set config values
config.account = "california-data-collaborative"
config.trackingID = "UA-46240051-10"

//cartography related configuration
config.geometry_table = "squid_bike"//
// config.geometry_table = 'squid_syracuse'
config.zoom = 12
config.coordinates = [40.72,-73.96]
config.geom_type = "point"

//attribute related configuration
config.attribute_table = "squid_bike"
config.column_names.date = 'timestamp'
config.column_names.ride_quality = 'v_value'
// config.column_names.ride_quality = 'ride_quality'
config.column_names.img_location = 'image_url'
// config.column_names.img_location = 'link_to_s3_image'