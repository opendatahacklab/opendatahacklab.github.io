/**
 * Event SPARQL processor is part of the SPARQL Processing Library.
 * It is release under the CC-BY 4.0 license (https://creativecommons.org/licenses/by/4.0/)
 *
 * The processor and the helper methods allow to query, filter and process instances
 * of the Event class, which is defined in the Event vocabulary:
 *
 * http://motools.sourceforge.net/event/event.html
 *
 * @author Cristiano Longo
 * @author Mirko Raimondo Aiello
 */

/**
 * An arbitrary classification of a space/time region, by a
 * cognitive agent. An event may have actively participating agents,
 * passive factors, products, and a location in space/time.
 * 
 * @param uri the URI of the Event
 * @param eventName name of the event
 * @param logo a logo of the event, may be null
 * @param timeStart the start time of the event
 * @param timeEnd the end time of the event
 * @param address the physical address of the event
 */ 
function Event(uri, eventName, logo, timeStart, timeEnd, address){
	this.URI=uri;
	this.eventName=eventName;
	this.logo=logo;
	this.timeStart=timeStart;
	this.timeEnd=timeEnd;
	this.address=address;
	this.participants=[];
	this.posts=[];
	this.photos=[];
}

/**
 * Relates an event to an active agent (a person, an organization, ... )
 *
 * @param uri the URI of the Post
 * @param name a name for some thing.
 *
*/

function Participant(uri, name){
	this.URI=uri;
	this.name=name;
}
/**
 * An article or message that can be posted to a Forum. 
 *
 * @param uri the URI of the Post
 * @param title a name given to the resource.
 * @param label a human-readable version of a resource's name
 * @param creator a resource that the Person is a creator of
*/
function Post(uri, title, label, creator){
	this.URI=uri;
	this.title=title;
	this.label=label;
	this.creator=creator;
}

/**
 * A depiction of some thing
*/
function Photo(depiction){
	this.depiction=depiction;
}

/**
 * Associate an item to a participant
 *
 * @param item an instance of Participant
 */
Event.prototype.addParticipantItem = function (item) {
	var find = false;
	for (var i = 0; i < this.participants.length; i++)
		if (this.participants[i].URI == item.URI)
			find = true;
	if (!find)
		this.participants[this.participants.length]=item;
};

/**
 * Associate an item to a post
 *
 * @param item an instance of Post
 * @param eventReferred the event to which it refers
 */
Event.prototype.addPostItem = function (item, eventReferred) {
	if (this.URI == eventReferred.URI) {
		var find = false;
		for (var i = 0; i < this.posts.length; i++)
			if (this.posts[i].URI == item.URI)
				find = true;
		if (!find)
			this.posts[this.posts.length]=item;
	}
};

/**
 * Associate an item to a photo
 *
 * @param item an instance of Photo
 */
Event.prototype.addPhotoItem = function (item) {
	var find = false;
	for (var i = 0; i < this.photos.length; i++)
		if (this.photos[i].depiction == item.depiction)
			find = true;
	if (!find)
		this.photos[this.photos.length]=item;
};

/**
 * A query processor, to be used with the sparl_query function
 * to retrieve and process event:Event instances. Query parameters and
 * query result processing are delegate to a event query processor, i.e.
 * an object which provides
 *   - the attribute additionalConstraints (optional, use null if no such constraint is required), which is a string which will be added to the where clause of the query performed to retrieve the event:Event instances; This parameter can be used to specify additional selection criteria on locations and items; The item must be indicated with the variable ?item; The string MUST NOT end with a dot.
 *   - the attribute additionalPrefixes, which eventually provides the definition of the prefixes used in additionalConstrains;
 *   - the method processPast(event), invoked for each past event;
 *   - the method processNext(event), invoked for the event just after the current date;
 *   - the method processFuture(event), invoked for each future event, except for the next;
 *   - the method flush(), invoked all the Event instances have been processed.
 */
function EventQueryProcessor(eventQueryProcessor, currentDate){
	this.query = "PREFIX locn:<http://www.w3.org/ns/locn#>\n"+
	"PREFIX wsg84:<http://www.w3.org/2003/01/geo/wgs84_pos#>\n"+
	"PREFIX foaf:<http://xmlns.com/foaf/0.1/>\n"+
	"PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#>\n"+
	"PREFIX event:<http://purl.org/NET/c4dm/event.owl#>\n"+
	"PREFIX time:<http://www.w3.org/2006/time#>\n"+
	"PREFIX sioc:<http://rdfs.org/sioc/ns#>\n"+
	"PREFIX dc:<http://purl.org/dc/elements/1.1/>\n";
	
	if (eventQueryProcessor.additionalPrefixes!=null)
		this.query+=eventQueryProcessor.additionalPrefixes+"\n";
	
	this.query+="SELECT DISTINCT ?item ?agent ?post ?depiction ?itemlabel ?logo ?timeStart ?address ?partname ?ptitle ?plabel ?pcreat WHERE {\n";

	if (eventQueryProcessor.additionalConstraints!=null)
		this.query+="\t"+eventQueryProcessor.additionalConstraints+" .\n";
	
	this.query+="\t?item locn:location ?site .\n"+
	"\t?item rdfs:label ?itemlabel .\n" +
	"\t?item event:time ?t .\n"+
	"\t?item event:agent ?agent .\n"+
	"\t?t time:hasBeginning ?hasB .\n"+
	"\t?hasB time:inXSDDateTime ?timeStart .\n"+
	"\t?site locn:address ?a .\n"+
	"\t?a locn:fullAddress ?address .\n"+
	"\tOPTIONAL {?agent rdfs:label ?partname} .\n"+
	"\tOPTIONAL {?item foaf:depiction ?depiction} .\n"+
	"\tOPTIONAL {?hasB time:xsdDateTime ?timeEnd} .\n"+
	"\tOPTIONAL {?item foaf:logo ?logo} .\n"+
	"\tOPTIONAL {?post sioc:about ?item .\n"+
    "\t\t?post dc:title ?ptitle .\n"+
    "\t\t?post rdfs:label ?plabel .\n"+
    "\t\t?post sioc:has_creator ?pc .\n"+
    "\t\t?pc rdfs:label ?pcreat .\n"+
	"\t} .\n"+
	"} ORDER BY DESC(?timeStart) ?item";	
	
	this.event=null;
	this.processor=eventQueryProcessor;
	this.currentDate=currentDate ==null ? new Date() : currentDate;
	this.isNextEvent=false;
}


/**
 * Process a query result-set row.
 */
EventQueryProcessor.prototype.process = function(row)
{
	var eventURI = row.item.value;
	var eventName = row.itemlabel.value;
	var logo = row.logo==null ? null : row.logo.value;
	var timeStart = row.timeStart.value;
	var timeEnd = row.timeEnd==null ? null : row.timeEnd.value;
	var address = row.address.value;
	var participant = row.agent==null ? null : row.agent.value;
	var participantName = row.partname==null ? null : row.partname.value;
	var post = row.post==null ? null : row.post.value;
	var postTitle = row.ptitle==null ? null : row.ptitle.value;
	var postLabel = row.plabel==null ? null : row.plabel.value;
	var postCreator = row.pcreat==null ? null : row.pcreat.value;
	var depiction = row.depiction==null ? null : row.depiction.value;
	
    //first point
	if (this.event==null){
		this.event=new Event(eventURI, eventName, logo, timeStart, timeEnd, address);
		if (participant!=null)
			this.event.addParticipantItem (new Participant(participant, participantName));
		if (post!=null)
			this.event.addPostItem (new Post(post, postTitle, postLabel, postCreator), eventURI);
		if(depiction!=null)
			this.event.addPhotoItem (new Photo(depiction));
	} else if (this.event.URI==eventURI) {
		if (participant!=null)
			this.event.addParticipantItem (new Participant(participant, participantName));
		if (post!=null)
			this.event.addPostItem (new Post(post, postTitle, postLabel, postCreator), eventURI);
		if(depiction!=null)
			this.event.addPhotoItem (new Photo(depiction));
	}
	else {
		var eventDate = new Date(timeStart);
		if (this.currentDate > eventDate) {
			this.processor.processPast(this.event);
		} else {
			if (this.isNextEvent == false) {
				this.processor.processNext(this.event);
				this.nextEvent=true;
			} else {
				this.processor.processFuture(this.event);
			}
		}
		this.event=new Event(eventURI, eventName, logo, timeStart, timeEnd, address);
		if (participant!=null)
			this.event.addParticipantItem (new Participant(participant, participantName));
		if (post!=null)
			this.event.addPostItem (new Post(post, postTitle, postLabel, postCreator), eventURI);
		if(depiction!=null)
			this.event.addPhotoItem (new Photo(depiction));
	}
};

/**
 * Processing ended, flush the last event
 */
EventQueryProcessor.prototype.flush = function()
{
	if(this.event != null)
	{
		var eventDate = new Date(this.event.timeStart);
		if (this.currentDate > eventDate) {
			this.processor.processPast(this.event);
		} else {
			if (this.isNextEvent == false) {
				this.processor.processNext(this.event);
				this.nextEvent=true;
			} else {
				this.processor.processFuture(this.event);
			}
		}
	}
	this.event=null;
	this.processor.flush();	
};

