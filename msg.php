<?php
	$url = 'http://www.mondo.rs/v2/inc/sms/poruka.php';
	$cookie = 'cookies'; 

	$pozivni = 0;
	$mobileNumber = '3925230';
	$destinationNumber = '3925230';

	$pozivni2 = 0;
	$pozivni3 = 0;

	$msg = urlencode($_GET['msg']);
	$params = 'pozivni3='.$pozivni3.'&dstnum='.$destinationNumber.'&textmsg='.$msg.'&Send3.x=1&Send3.y=1';

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

	echo $result;  
	curl_close($ch);


?>