<?php
if (array_key_exists ( 'command', $_GET )) {
	$key=$_GET['key'];
	if ($_GET['command'] === 'codifica'){
		$plaintext = $_GET['plaintext'];
		$ciphertext = openssl_encrypt($plaintext, 'AES-256-CTR', $key);	
	}
	else{
		$ciphertext = $_GET['ciphertext'];
		$plaintext = openssl_decrypt($ciphertext, 'AES-256-CTR', $key);
	}
} else{
	$plaintext = '';
	$ciphertext = '';
	$key='unachiavedicodifica';
}

?>
<html>
<head>
<title>Simple Symmetric Cryptography</title>
</head>
<body>
	<h1>Piccolo esempio crittografia simmetrica</h1>
	<form method="GET" action="#">
		<label>Testo in chiaro</label>
		<textarea name="plaintext" rows="5" cols="20"><?php echo $plaintext; ?></textarea>
		<input type="submit" name="command" value="codifica" /> 
		
		<label>Chiave</label>
		<input
			type="text" name="key" value="<?php echo $key; ?>" /> <input
			type="submit" name="command" value="decodifica" /> <label>Testo
			codificato</label>
		<textarea name="ciphertext" rows="5" cols="20"><?php echo $ciphertext; ?></textarea>
	</form>
	<p>
		Codifica effettuata con l'algoritmo
		<code>AES-256-CTR</code>
		usando la libreria openssl. Vedi anche <a
			href="http://timoh6.github.io/2014/06/16/PHP-data-encryption-cheatsheet.html">PHP
			data encryption primer</a>.
	</p>
	<p><a href="index.php">Torna alle impostazioni iniziali</a></p>
</body>
</html>