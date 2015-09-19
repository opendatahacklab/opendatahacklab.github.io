/**
 * SPARQL processor is a javascript library to query a sparql endpoint.
 * It has been developed in the context of the PON project PRISMA - PiattafoRme cloud Interoperbili per SMArt-government,
 * and it is release under the CC-BY 2.0 license (see http://creativecommons.org/licenses/by/2.0/)
 *
 * @author Cristiano Longo, Andrea Costazza.
 */

/**
 * Helper function to print strings in HTML elements.
 * See https://css-tricks.com/snippets/javascript/htmlentities-for-javascript/
 */
function htmlentities(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
/**
 * Perform a query against the specified endpoint and process results by the
 * given processor object. The queryProcessor object must have the attribute query,
 * which returns the query which will be performed against the specified endpoint,
 * and the two methods
 * process(row) , which will be invoked to process each row in the result set (sequentially) and
 * flush(), which is called  when all the result set rows has been processed.
 *
 * @param endpoint URI of the sparql endpoint 
 * @param queryProcessor is an object delegate to specify the uery and handle the query result
 */
function sparql_query(endpoint, queryProcessor){
	var querypart = "query=" + escape(queryProcessor.query);
	// Get our HTTP request object.
	var xmlhttp = getHTTPObject();
	//Include POST OR GET
	xmlhttp.open('POST', endpoint, true); 
	xmlhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
	xmlhttp.setRequestHeader("Accept", "application/sparql-results+json");	
	xmlhttp.onreadystatechange = function() {
		if(xmlhttp.readyState==4 ){
			if(xmlhttp.status==200){				
				//Request accept				
				var resultAsJson=eval('(' + xmlhttp.responseText + ')');
				for(var i = 0; i<  resultAsJson.results.bindings.length; i++) {
					queryProcessor.process(resultAsJson.results.bindings[i]);
				}
				queryProcessor.flush();
			} else {
				// Some kind of error occurred.
					alert("Sparql query error: " + xmlhttp.status + " "
						+ xmlhttp.responseText);
			}
		}	
	};
	xmlhttp.send(querypart);
}

//Request HTTP
function getHTTPObject(){
	var xmlhttp;
	if(!xmlhttp && typeof XMLHttpRequest != 'undefined'){
		try{
			// Code for old browser
			xmlhttp=new ActiveXObject('Msxml2.XMLHTTP');
			}
		catch(err){
			try{
				// Code for IE6, IE5
				xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
			}
			catch(err2){
				try{
					// Code for IE7+, Firefox, Chrome, Opera, Safari
					xmlhttp=new XMLHttpRequest();
				}
				catch(err3){
					xmlhttp=false
				}
			}			
		}
	};
	return xmlhttp;
}