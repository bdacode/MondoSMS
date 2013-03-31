<?php
	include_once('simple_html_dom.php');

	$url = 'http://www.mondo.rs/v2/inc/sms/poruka.php';

	$prefix = $_GET['prefix'];
	$phoneNumber = $_GET['phoneNumber'];

	$message = urlencode($_GET['message']);

	$cookie = 'cookies/cookie-'.$prefix.$phoneNumber;

	$callback = $_GET['callback'];
	
	$params = '';

	$ch = curl_init(); 
	curl_setopt ($ch, CURLOPT_URL, $url); 
	curl_setopt ($ch, CURLOPT_SSL_VERIFYPEER, FALSE); 
	curl_setopt ($ch, CURLOPT_USERAGENT, "Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.8.1.6) Gecko/20070725 Firefox/2.0.0.6"); 
	curl_setopt ($ch, CURLOPT_TIMEOUT, 60); 
	curl_setopt ($ch, CURLOPT_FOLLOWLOCATION, 0); 
	curl_setopt ($ch, CURLOPT_RETURNTRANSFER, 1); 
	curl_setopt ($ch, CURLOPT_COOKIEJAR, $cookie); 
	curl_setopt ($ch, CURLOPT_COOKIEFILE, $cookie);
	curl_setopt ($ch, CURLOPT_REFERER, $url); 

	// get headers too with this line
	curl_setopt($ch, CURLOPT_HEADER, 1);

	curl_setopt ($ch, CURLOPT_POSTFIELDS, $params); 
	curl_setopt ($ch, CURLOPT_POST, 1); 
	$result = curl_exec ($ch); 

	curl_close($ch);

	// get cookies
	$cookies = array();
	preg_match_all('/Set-Cookie:(?<cookie>\s{0,}.*)$/im', $result, $cookies);

	$text = ($cookies['cookie'][0]); // show harvested cookies
	$text = str_replace("\r", "", $text);



	$callback = $callback.'('.json_encode(sprintf('%s', $text)).')';

	echo $callback;


?>