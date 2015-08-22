/**
 * LOCN SPARQL processor is part of the SPARQL Processing Library.
 * It has been developed in the context of the PON project PRISMA - PiattafoRme cloud Interoperbili per SMArt-government,
 * and it is release under the CC-BY 4.0 license (https://creativecommons.org/licenses/by/4.0/)
 *
 * The processor and the helper methods allow to query, filter and process instances
 * of the  Location class, which is defined in the LOCN vocabolary:
 *
 * https://joinup.ec.europa.eu/asset/core_location/description 
 *
 * @author Cristiano Longo
 * @author Mirko Raimondo Aiello
 * @version 1.1
 */

/**
 * A generic item (physical or abstract) placed in some location. Examples are 
 * organizations based in the location or offices.
 * 
 * @param name human readable name of the object
 * @param homepage a web page describing the object, may be null
 */
function LocatedItem(name, homepage, logo){
	this.name=name;
	this.homepage=homepage;
	this.logo=logo;
}
 
/**
 * A Physical location, initially create with no associated object. The field locatedItems is an array of LocatedItem and
 * indicates a set of objects (physical or not) placed in the location. It is initially empty.  Objects can be associated to
 * the location via the addLocatedObject method.
 *
 * @param address the address in human readable form, it should conform the INSPIRE Data Specification on Geographical Names.
 * @param latitude location latitude
 * @param longitude location longitute
 *
 *
 */ 
function Location(address, latitude, longitude){
	this.address=address;
	this.latitude=latitude;
	this.longitude=longitude;
	this.locatedItems=[];
}

/**
 * Associate an item to a location.
 *
 * @param item an instanze of LocatedItem
 */
Location.prototype.addLocatedItem= function (item){
	this.locatedItems[this.locatedItems.length]=item;
}

/**
 * A query processor, to be used with the sparl_query function
 * to retrieve and process locn:Location instances. Query parameters and
 * query result processing are delegate to a location query processor, i.e.
 * an object which provides
 *   - the attribute additionalConstraints (optional, use null if no such constraint is required), which is a string which will be added to the where clause of the query performed to retrieve the locn:Location instances; This parameter can be used to specify additional selection criteria on locations and items; The item must be indicated with the variable ?item; The string MUST NOT end with a dot.
 *   - the attribute additionalPrefixes, which eventually provides the definition of the prefixes used in additionalConstrains;
 *   - the method process(location), invoked to handle each Location instance found;
 *   - the method flush(), invoked all the Location instances have been processed.
 */
function LOCNQueryProcessor(locationQueryProcessor)
{
	this.query = "PREFIX locn:<http://www.w3.org/ns/locn#>\n"+
	"PREFIX wsg84:<http://www.w3.org/2003/01/geo/wgs84_pos#>\n"+
	"PREFIX foaf:<http://xmlns.com/foaf/0.1/>\n"+
	"PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#>\n";
	
	if (locationQueryProcessor.additionalPrefixes!=null)
		this.query+=locationQueryProcessor.additionalPrefixes+"\n";
	
	this.query+="SELECT DISTINCT ?address ?latitude ?longitude ?itemlabel ?itemhomepage ?logo WHERE {\n";

	if (locationQueryProcessor.additionalConstraints!=null)
		this.query+="\t"+locationQueryProcessor.additionalConstraints+" .\n";
	
	this.query+="\t?item locn:location ?site .\n"+
	"\t?item rdfs:label ?itemlabel .\n" +
	"\t?site locn:address ?a .\n"+
	"\t?a locn:fullAddress ?address .\n"+
	"\t?site locn:geometry ?g .\n"+
	"\t?g wsg84:lat ?latitude .\n"+
	"\t?g wsg84:long ?longitude .\n"+
	"\tOPTIONAL {?item foaf:homepage ?itemhomepage} .\n"+
	"\tOPTIONAL {?item foaf:logo ?logo} .\n"+
	"} ORDER BY ?latitude ?longitude";	

	this.location=null;
	this.processor=locationQueryProcessor;
}

/**
 * Process a query result-set row.
 */
LOCNQueryProcessor.prototype.process = function(row){
	var address = row.address.value;
	var latitude = row.latitude.value;
	var longitude = row.longitude.value;
	var item = new LocatedItem(row.itemlabel.value, 
		row.itemhomepage==null ? null : row.itemhomepage.value, row.logo==null ? null : row.logo.value);
	
        //first point
	if (this.location==null){
		this.location=new Location(address, latitude, longitude);
		this.location.addLocatedItem(item);
	} else if  (this.location.latitude==latitude && this.location.longitude==longitude)
		this.location.addLocatedItem(item);
	else {
		this.processor.process(this.location);
		this.location=new Location(address, latitude, longitude);
		this.location.addLocatedItem(item);
	}
}

/**
 * Processing ended, flush the last location
 */
LOCNQueryProcessor.prototype.flush = function(){
	this.processor.process(this.location);
	this.location=null;
	this.processor.flush();	
}

//GOOGLE MAPS LOCN PROCESSOR

/**
 * A  location query processor implementation to draw locations on a map using the Google Maps API.
 *
 * @param additionalConstraints  optional (use null if no such constraint is required), a string which will be added to the where clause of the query performed to retrieve the locn:Location instances; This parameter can be used to specify additional selection criteria on locations and items; 
 *               The item must be indicated with the variable ?item; The string MUST NOT end with a dot.
 * @param additionalPrefixes eventually provides the definition of the prefixes used in additionalConstrains.
 * 
 * @param map the google map
 */
function GoogleMapsLocationQueryProcessor(additionalConstraints, additionalPrefixes, map)
{
	this.additionalConstraints=additionalConstraints;
	this.additionalPrefixes=additionalPrefixes;
	this.map=map;
}

/**
 * Draw a location on the map.
 */
GoogleMapsLocationQueryProcessor.prototype.process = function(location)
{
	var contentString="<p>"+location.address+"</p><ul>";
	for(var i=0; i<location.locatedItems.length; i++)
	{
		var item = location.locatedItems[i];
		contentString+="<li>";
		if (item.logo!=null)
			contentString+="<img class=\"logo\" src=\""+item.logo+"\" /> ";
		if (item.homepage==null)
			contentString+=item.name;
		else
			contentString+="<a href=\""+item.homepage+"\">"+item.name+"</a>";
		contentString+="</li>";
	}
	
	var infowindow = new google.maps.InfoWindow({
		content: contentString
	});
	
	var marker = new google.maps.Marker({
		position: new google.maps.LatLng(location.latitude,location.longitude),
		map: this.map,
		title: location.address
	});
	
	google.maps.event.addListener(marker, 'click', function() {
		infowindow.open(this.map,marker);
	});	
}

/**
 * no flushing is required.
 */
GoogleMapsLocationQueryProcessor.prototype.flush = function(location){}

/**
 * A specialization of LOCNQueryProcessor to draw locations on a map using the Google Maps API.
 *
 * @param additionalConstraints  optional (use null if no such constraint is required), a string which will be added to the where clause of the query performed to retrieve the locn:Location instances; This parameter can be used to specify additional selection criteria on locations and items; 
 *               The item must be indicated with the variable ?item; The string MUST NOT end with a dot.
 * @param additionalPrefixes eventually provides the definition of the prefixes used in additionalConstrains.
 * 
 * @param map the google map
 */
function GoogleMapsLOCNProcessor(additionalConstraints, additionalPrefixes, map){
	LOCNQueryProcessor.call(this, new GoogleMapsLocationQueryProcessor(additionalConstraints, additionalPrefixes, map));
	this.map=map;
}

GoogleMapsLOCNProcessor.prototype = new Object(LOCNQueryProcessor.prototype);
GoogleMapsLOCNProcessor.prototype.constructor = GoogleMapsLOCNProcessor;

//LEAFLET MAP LOCN PROCESSOR

/**
 * A  location query processor implementation to draw locations on a map using the Google Maps API.
 *
 * @param additionalConstraints  optional (use null if no such constraint is required), a string which will be added to the where clause of the query performed to retrieve the locn:Location instances; This parameter can be used to specify additional selection criteria on locations and items; 
 *               The item must be indicated with the variable ?item; The string MUST NOT end with a dot.
 * @param additionalPrefixes eventually provides the definition of the prefixes used in additionalConstrains.
 * 
 * @param map the google map
 */
function LeafletMapsLocationQueryProcessor(additionalConstraints, additionalPrefixes, map) 
{
	this.additionalConstraints=additionalConstraints;
	this.additionalPrefixes=additionalPrefixes;
	this.map=map;
}

/**
 * Draw a location on the map.
 */
LeafletMapsLocationQueryProcessor.prototype.process = function(location) {
	var contentString = "<p>" + location.address + "</p><ul>";
	for(var i=0; i<location.locatedItems.length; i++)
	{
		var item = location.locatedItems[i];
		contentString+="<li>";
		if (item.logo!=null)
			contentString+="<img class=\"logo\" src=\""+item.logo+"\" /> ";
		if (item.homepage==null)
			contentString+=item.name;
		else
			contentString+="<a href=\""+item.homepage+"\">"+item.name+"</a>";
		contentString+="</li>";
	}
	
	var marker = L.marker([location.latitude, location.longitude]).addTo(this.map);
	marker.bindPopup(contentString);
}

/**
 * no flushing is required.
 */
LeafletMapsLocationQueryProcessor.prototype.flush = function(location){}

/**
 * A specialization of LOCNQueryProcessor to draw locations on a map using the Google Maps API.
 *
 * @param additionalConstraints  optional (use null if no such constraint is required), a string which will be added to the where clause of the query performed to retrieve the locn:Location instances; This parameter can be used to specify additional selection criteria on locations and items; 
 *               The item must be indicated with the variable ?item; The string MUST NOT end with a dot.
 * @param additionalPrefixes eventually provides the definition of the prefixes used in additionalConstrains.
 * 
 * @param map the google map
 */
function LeafletMapsLOCNProcessor(additionalConstraints, additionalPrefixes, map)
{
	LOCNQueryProcessor.call(this, new LeafletMapsLocationQueryProcessor(additionalConstraints, additionalPrefixes, map));
	this.map=map;
}

LeafletMapsLOCNProcessor.prototype = new Object(LOCNQueryProcessor.prototype);
LeafletMapsLOCNProcessor.prototype.constructor = LeafletMapsLOCNProcessor;