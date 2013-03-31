<?php
	include_once('simple_html_dom.php');


	$url = 'http://www.mondo.rs/v2/inc/sms/password.php';
	$cookie = 'cookies'; 

	$prefix = $_GET['prefix'];
	$phoneNumber = $_GET['phoneNumber'];

	$callback = $_GET['callback'];


	$params = 'pozivni='.$prefix.'&passnum='.$phoneNumber.'&Send2.x=1&Send2.y=1&pozivni2=0&mobnum=&passs=';

	$ch = curl_init();

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
