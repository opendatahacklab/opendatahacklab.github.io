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
	if (additionalPrefixes != null)
		this.query += locationQueryProcessor.additionalPrefixes + "\n";

	this.query += "SELECT ?item ?title ?description ?landingPage WHERE {\n"
			+ "\t?item a dcat:Dataset .\n";
	if (additionalConstraints != null)
		this.query += "\t" + additionalConstraints + " .\n";

	this.query += "\t?item dcterms:title ?title .\n"
			+ "\tOPTIONAL { ?item dcterms:description ?description }\n"
			+ "\tOPTIONAL { ?item dcat:landingPage ?landingPage }\n" + "}\n";
}

/**
 * Process a query result-set row. Do not override.
 */
DCATProcessor.prototype.process = function(row) {
	var item = new Dataset(row.item, row.title.value);
	if (row.description != null)
		item.description = row.description.value;
	if (row.landingPage != null)
		item.landingPage = row.landingPage.value;
	this.processDataset(item);
};

/**
 * Process a project. Override this to handle projects.
 */
DCATProcessor.prototype.processDataset = function(dataset) {
	alert("processDataset not implemented!");
};

/**
 * Processing ended, do nothing. Override this if appropriate
 */
DCATProcessor.prototype.flush = function() {
	// intentionally empty
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
	    title.appendChild(document.createTextNode(dataset.title));	
		article.appendChild(title);
		
		if (dataset.description!=null && dataset.description.length>0){
			var description = document.createElement("p");
			description.appendChild(document.createTextNode(dataset.description));
			article.appendChild(description);
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

	processor.flush = function(){ 
		if (this.loading!=null)
			this.container.removeChild(loading);
	};

	return processor;
};


