/**
 * DOAP SPARQL processor is part of the SPARQL Processing Library.
 * It is release under the CC-BY 4.0 license (https://creativecommons.org/licenses/by/4.0/)
 *
 * This processor is intended to retrieve and process instances of Projects, as
 * defined in the DOAP (Description Of A Project) vocabulary, see 
 * https://github.com/edumbill/doap . 
 *
 * Processor behaviour must be customized by overriding the processProject method.
 * It can be used with the sparql_query method.
 * 
 * @author Cristiano Longo
 * @version 0.9
 */

/**
 * A Project. Name, license and short description are mandatory fields, whereas 
 * project home page, git repository and long description are optional and should be
 * set later.
 * 
 * @param uri individual uri of the project in the knowledge base
 * @param name 
 * @param license
 * @param shortdesc
 */
function Project(uri, name, license, shortdesc){
	this.uri=uri;
	this.name=name;
	this.license=license;
	this.shortdesc=shortdesc;
	this.homepage=null;
	this.gitrepo=null;
	this.desc=null;
}
 

/**
 * A query processor, to be used with the sparl_query function
 * to retrieve and process doap:Project instances. 
 * the method processProject has to be implemented in order to
 * process projects retrieved by a query. In addition, the flush method
 * can be override. The additionalPrefixes and additionalConstraints
 * constructor parameters may be used to append to the query 
 * additional selection mechanisms to filter the retrieved projects. 
 * 
 * @param additionalPrefix additional prefix declaration which will be inserted into the
 * query, these additional prefixes can be used in the graph pattern specified in additionalContrains
 * @param additionalConstraints a graph pattern to filter projects. The project is indicated
 * by the variable ?item.
 *
 */
function DOAPProcessor(additionalPrefixes, additionalConstraints)
{
	this.query = "PREFIX doap:<http://usefulinc.com/ns/doap#>"	
	if (additionalPrefixes!=null)
		this.query+=locationQueryProcessor.additionalPrefixes+"\n";
	
	this.query+="SELECT DISTINCT ?item ?name ?shortdesc ?homepage ?desc ?gitrepo WHERE {\n"+
	"\t?item a doap:Project .\n";
	if (additionalConstraints!=null)
		this.query+="\t"+additionalConstraints+" .\n";

	this.query+="\t?item doap:name ?name .\n"+
	"\t?item doap:shortdesc ?shortdesc\n"+ 
	"\tOPTIONAL { ?item doap:homepage ?homepage }\n"+
	"\tOPTIONAL { ?item doap:desc ?desc }\n"+
	"\tOPTIONAL { ?item doap:repository ?repoelem . \n"+
	"\t\t?repoelem a doap:GitRepository .\n"+
	"\t\t?repoelem doap:location ?gitrepo }\n"+
	"}\n"; 
}

/**
 * Process a query result-set row. Do not override.
 */
DOAPProcessor.prototype.process = function(row){
	var item = new Project(row.item, row.name.value, row.license, row.shortdesc.value);
	if (row.homepage!=null)
		item.homepage=row.homepage.value;
	if (row.gitrepo!=null)
		item.gitrepo=row.gitrepo.value;
	if (row.desc!=null)
		item.desc=row.desc.value;
	this.processProject(item);
}

/**
 * Process a project. Override this to handle projects.
 */
DOAPProcessor.prototype.processProject = function(project){
	alert("Poject "+project.name+" not handled!");
}

/**
 * Processing ended, do nothing. Override this if appropriate
 */
DOAPProcessor.prototype.flush = function(){
	//intentionally empty
}