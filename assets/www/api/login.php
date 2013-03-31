<?php
	include_once('simple_html_dom.php');

	$url = 'http://www.mondo.rs/v2/inc/sms/password.php';

	$prefix = $_GET['prefix'];
	$phoneNumber = $_GET['phoneNumber'];
	$password = $_GET['password'];

	$cookie = 'cookies/cookie-'.$prefix.$phoneNumber;

	$params = 'pozivni2='.$prefix.'&mobnum='.$phoneNumber.'&passs='.$password.'&Send3.x=1&Send3.y=1';
     
    $callback = $_GET['callback']; 



	$ch = curl_init(); 

	// get headers too with this line
	curl_setopt($ch, CURLOPT_HEADER, 1);

	curl_setopt ($ch, CURLOPT_URL, $url); 
	curl_setopt ($ch, CURLOPT_SSL_VERIFYPEER, FALSE); 
	curl_setopt ($ch, CURLOPT_USERAGENT, "Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.8.1.6) Gecko/20070725 Firefox/2.0.0.6"); 
	curl_setopt ($ch, CURLOPT_TIMEOUT, 60); 
	curl_setopt ($ch, CURLOPT_FOLLOWLOCATION, 0); 
	curl_setopt ($ch, CURLOPT_RETURNTRANSFER, 1); 
	curl_setopt ($ch, CURLOPT_COOKIEJAR, $cookie); 
	curl_setopt ($ch, CURLOPT_REFERER, $url); 

	

	curl_setopt ($ch, CURLOPT_POSTFIELDS, $params); 
	curl_setopt ($ch, CURLOPT_POST, 1); 
	$result = curl_exec ($ch); 

	curl_close($ch);

	$html = new simple_html_dom();
	$html = str_get_html($result);


	$text = $html->find('.obavestenje .notice', 0);  

	$callback = $callback.'('.json_encode(sprintf('%s', $text)).')';

	echo $callback;
?>