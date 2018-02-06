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
config.account = ""
config.trackingID = ""

//cartography related configuration
config.geometry_table = ""
config.zoom = 13
config.coordinates = [34.06,-118.215]
config.geom_type = "point"

//attribute related configuration
config.attribute_table = ""
config.column_names.date = ""
config.column_names.ride_quality = ""
config.column_names.img_location = ""