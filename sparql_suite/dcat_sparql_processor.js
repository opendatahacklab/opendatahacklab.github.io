/**
 * DCAT SPARQL processor is part of the SPARQL Processing Library.
 * It is release under the CC-BY 4.0 license (https://creativecommons.org/licenses/by/4.0/)
 *
 * This processor is intended to retrieve and process instances of Dataset and
 * Dataset Distribution, as defined in the DCAT (Data Catalog)) vocabulary, 
 * 
 * see http://www.w3.org/TR/vocab-dcat/ . 
 *
 * Processor behaviour must be customized by overriding the processDataset method.
 * It can be used with the sparql_query method.
 * 
 * @author Cristiano Longo
 * @version 0.2
 */

/**
 * An helper class to represent dataset themes.
 */
function Theme(uri, label){
	this.uri=uri;
	this.label=label;
}

/**
 * A Dataset. Name is a mandatory field, whereas description and landing page
 * can be set later.
 * 
 * @param uri
 *            individual uri of the dataset in the knowledge base
 * @param name
 */
function Dataset(uri, title) {
	this.uri = uri;
	this.title = title;
	this.description = null;
	this.landingPage = null;
	this.themes = new Array();
}

/**
 * A query processor, to be used with the sparl_query function to retrieve and
 * process dcat:Dataset instances. The method processDataset has to be
 * implemented in order to process projects retrieved by a query. In addition,
 * one can override the flush method. The additionalPrefixes and
 * additionalConstraints constructor parameters may be used to append to the
 * query additional selection mechanisms to filter the retrieved projects.
 * 
 * @param additionalPrefix
 *            additional prefix declaration which will be inserted into the
 *            query, these additional prefixes can be used in the graph pattern
 *            specified in additionalContrains
 * @param additionalConstraints
 *            a graph pattern to filter projects. The project is indicated by
 *            the variable ?item.
 * 
 */
function DCATProcessor(additionalPrefixes, additionalConstraints) {
	this.query = "PREFIX dcat:<http://www.w3.org/ns/dcat#>\n";
	this.query += "PREFIX dcterms:<http://purl.org/dc/terms/>\n";
	this.query += "PREFIX skos:<http://www.w3.org/2004/02/skos/core#>\n";
	if (additionalPrefixes != null)
		this.query += locationQueryProcessor.additionalPrefixes + "\n";

	this.query += "SELECT ?item ?title ?description ?landingPage ?theme ?themeName WHERE {\n"
			+ "\t?item a dcat:Dataset .\n";
	if (additionalConstraints != null)
		this.query += "\t" + additionalConstraints + " .\n";

	this.query += "\t?item dcterms:title ?title .\n"
			+ "\tOPTIONAL { ?item dcterms:description ?description }\n"
			+ "\tOPTIONAL { ?item dcat:landingPage ?landingPage }\n" 
			+ "\tOPTIONAL { ?item dcat:theme ?theme . ?theme skos:prefLabel ?themeName}\n"+
			"} ORDER BY ?item desc(?theme)\n";
	
	this.current=null;
}

/**
 * Helper method to create a novel dataset instance from
 * a row of the sparql reply.
 */
function initDataset(row){
	var d = new Dataset(row.item.value, row.title.value);
	if (row.description != null)
		d.description = row.description.value;
	if (row.landingPage != null)
		d.landingPage = row.landingPage.value;
	if (row.theme!=null && row.themeName!=null)
		d.themes[0]=new Theme(row.theme.value, row.themeName.value);
	return d;
}
/**
 * Process a query result-set row. Do not override.
 */
DCATProcessor.prototype.process = function(row) {	
	if (this.current==null)
		this.current = initDataset(row);
	else if (this.current.uri!=row.item.value){
		this.processDataset(this.current);
		this.current = initDataset(row);		
	} else {
		if (row.theme!=null && row.themeName!=null)
			this.current.themes[this.current.themes.length]=new Theme(row.theme.value, row.themeName.value);
	}
};

/**
 * Process a project. Override this to handle projects.
 */
DCATProcessor.prototype.processDataset = function(dataset) {
	alert("processDataset not implemented!");
};

/**
 * Processing ended, flush the last remaining dataset, if any.
 */
DCATProcessor.prototype.flush = function() {
	if (this.current!=null)
		this.processDataset(this.current);
	this.datasetsEnded();
};

/**
 * Processing ended, do nothing. Override this if appropriate
 */
DCATProcessor.prototype.datasetsEnded = function() {
	//intentionally empty
};

/**
 * Create an instance of DCATProcessor to draw the selected datasets in a web 
 * page unsing the article tag.
 * 
 * @param containerElement
 *            the container element where the datasets will be placed as article
 *            HTML element
 * @param loadingElement
 *            an element showing the loading icon or text. It is expected to be
 *            the solely content of the container element, and will be removed
 *            when all the datasets are drawn to the page. May be null.
 * @param additionalPrefixes
 *            see the DCATProcessor
 * @param additionalConstraints
 *            see the DCATProcessor
 */
function createDCAT2HTMLProcessor(containerElement, loadingElement, 
		additionalPrefixes, additionalConstraints) {
	var processor=new DCATProcessor(additionalPrefixes, additionalConstraints);
	
	processor.processDataset = function(dataset){	
		var article = document.createElement("article");
		containerElement.insertBefore(article, loadingElement);
			
		var title = document.createElement("h2");
	    title.appendChild(document.createTextNode(htmlentities(dataset.title)));	
		article.appendChild(title);
		
		if (dataset.description!=null && dataset.description.length>0){
			var description = document.createElement("p");
			description.appendChild(document.createTextNode(htmlentities(dataset.description)));
			article.appendChild(description);
		}
		
		if (dataset.themes.length>0){
			var themes = document.createElement("p");
			article.appendChild(themes);
			var l = document.createElement("em");
			themes.appendChild(l);
			l.appendChild(document.createTextNode("Themes: "));
			for(var i=0; i<dataset.themes.length; i++){
				var theme =document.createElement("a");
				themes.appendChild(theme);
				theme.href=dataset.themes[i].uri;
				theme.appendChild(document.createTextNode(htmlentities(dataset.themes[i].label)));
				if (i<dataset.themes.length-1)
					themes.appendChild(document.createTextNode(" - "));
			}
		}

		var nav =document.createElement("nav");	
		article.appendChild(nav);

		if (dataset.landingPage!=null){
			var landing = document.createElement("a");
			nav.appendChild(landing);
			landing.href=dataset.landingPage;
			landing.title="Dataset landing page";
			landing.target="_blank";
			
			var landingImg = document.createElement("img");
			landingImg.src="https://upload.wikimedia.org/wikipedia/commons/6/6a/External_link_font_awesome.svg";
			landing.appendChild(landingImg);
		}
		
	};

	processor.datasetsEnded = function(){ 
		if (loadingElement!=null)
			containerElement.removeChild(loadingElement);
	};

	return processor;
};


