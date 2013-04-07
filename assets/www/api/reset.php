<?php
	$prefix = $_GET['prefix'];
	$phoneNumber = $_GET['phoneNumber'];

	$cookie = 'cookies/cookie-'.$prefix.$phoneNumber;

	@unlink($cookie);

	$text = '';

	$callback = $_GET['callback'];

	$callback = $callback.'('.json_encode($text).')';

	echo $callback;


?>