#!/bin/sh
java -jar ../semanticoctopus/target/semanticoctopus-0.1.1.jar http://localhost/~cristianolongo/opendatahacklab/site/odhl.owl >odhlfull.owl
curl -X PUT -H "Content-Type: application/rdf+xml" -u 'cristianolongo'  --data-binary @odhlfull.owl http://dydra.com/cristianolongo/odhl/service
sleep 5
rm odhlfull.owl

