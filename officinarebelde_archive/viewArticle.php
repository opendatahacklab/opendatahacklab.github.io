<?php
	require("dbConfig.php");
	$id=$_GET['id'];
	$db = new mysqli($host,$username, $password,$database) or die("Failed to connect to MySQL: (" . $mysqli->connect_errno . ") " . $mysqli->connect_error); 
	$res=$db->query("SELECT titre, soustitre, chapo, texte, date, date_modif FROM spip_articles where id_article='$id'");
	$row = $res->fetch_assoc();
	$title=htmlentities($row['titre']);
	$subtitle=htmlentities($row['soustitre']);
	$chapo=htmlentities($row['chapo']);
	$text=htmlentities($row['texte']);
	$db->close();
?>
<!DOCTYPE html>
<html lang="it">
	<head>
		<meta charset="cp-1252" />
		<title>Officina Rebelde - <?=$title?></title>
	</head>
	<body>
		<h1><?=$title?></h1>
		<p>subtitle:<?=$subtitle?></p>
		<p>chapo:<?=$chapo?></p>
		<p><?=$text?></p>
	</body>
</html>