<!DOCTYPE html>
<html lang="it">
	<head>
		<meta charset="cp-1252" />
		<title>Archivio di www.officinarebelde.org</title>
	</head>
	<body>
		<table>
			<tr>
				<th />
				<th>Titolo</th>
				<th>Data di Creazione</th>
				<th>Data di Modifica</th>
			</tr>
<?php
	require("dbConfig.php");
	$db = new mysqli($host,$username, $password,$database) or die("Failed to connect to MySQL: (" . $mysqli->connect_errno . ") " . $mysqli->connect_error); 
	$res=$db->query("SELECT id_article, titre, date, date_modif FROM spip_articles order by id_article");
	echo "found $res->num_rows articles\n";
	foreach($res as $a){
		$id=$a['id_article'];
		$t=htmlentities($a['titre']);
		$c=$a['date'];
		$m=$a['date_modif'];
		echo "\t\t\t<tr><td>$id</td><td><a href=\"viewArticle.php?id=$id\">$t</a></td><td>$c</td><td>$m</td></tr>\n";
	}
	$db->close();
?>
	</body>
</html>