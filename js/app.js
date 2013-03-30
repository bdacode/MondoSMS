$(document).ready(function(){
	API_DOMAIN = 'http://rocketlaunch.me/mondo/api/';

	var panels = {
		all: $('.panel'),
		request: $('.request'),
		login: $('.login'),
		settings: $('.settings'),
		send: $('.sendMessage')
	};

	var myNumber = {
		prefix: $('.settings select'),
		phoneNumber: $('.settings input')
	};

	var password = $('input.password');

	var destinationNumber = {
		prefix: $('.sendMessage .phoneNumber select'),
		phoneNumber: $('.sendMessage .phoneNumber input')
	};

	var message = $('.message');


	var notice = {
		element: $('#notice'),
		show: function(text, cssClass){
			if(typeof(cssClass)==='undefined'){
				cssClass = 'color3';
			}

			this.element.attr('class', cssClass).show().find('.text').html(text);
		},
		hide: function(){
			this.element.hide();
		}
	};
	notice.element.find('button').click(function(){
		notice.hide();
	});


	// Resfresh
	function refresh(){
		$.ajax({
			dataType: 'jsonp',
			url: API_DOMAIN+'refresh.php',
			data: {
				prefix: myNumber.prefix.val(),
				phoneNumber: myNumber.phoneNumber.val()
			},
			success: function(response){
				var format = 'dd, DD-MMM-YYYY hh:mm:ss Z';
				var expireDate = response.replace(/.*r$/, '');
				expireDate = response.substring(response.search('expires')+8);
				expireDate = moment(expireDate, format);
				
				var now = moment(moment(), format);

				if(!expireDate || expireDate.isBefore(now)){
					panels.request.show();
				}
				else{
					panels.send.show();
				}
			}
		});
	}
	refresh();


	// Ask for password
	$('.request button').click(function(){
		notice.hide();
		$.ajax({
			dataType: 'jsonp',
			url: API_DOMAIN+'request.php',
			data: {
				prefix: myNumber.prefix.val(),
				phoneNumber: myNumber.phoneNumber.val()
			},
			success: function(response){
				if(response.search('failure') >= 0){
					notice.show(response, 'color8');
				}
				else if(response.search('success') >= 0){
					panels.all.hide();
					panels.login.show();
					notice.show(response, 'color3');
				}

			}
		});
	});

	// Login
	$('.login button').click(function(){
		notice.hide();
		$.ajax({
			dataType: 'jsonp',
			url: API_DOMAIN+'login.php',
			data: {
				prefix: myNumber.prefix.val(),
				phoneNumber: myNumber.phoneNumber.val(),
				password: password.val()
			},
			success: function(response){
				if(response.search('failure') >= 0){
					notice.show(response, 'color8');
				}
				else if(response === ''){
					panels.all.hide();
					panels.send.show();
				}
			}
		});
	});

	// Send message
	$('.sendMessage button').click(function(){
		notice.hide();
		$.ajax({
			dataType: 'jsonp',
			url: API_DOMAIN+'message.php',
			data: {
				destinationPrefix: destinationNumber.prefix.val(),
				destinationNumber: destinationNumber.phoneNumber.val(),
				prefix: myNumber.prefix.val(),
				phoneNumber: myNumber.phoneNumber.val(),
				message: message.val()
			},
			success: function(response){
				if(response.search('failure') >= 0){
					notice.show(response, 'color8');
				}
				else if(response.search('success') >= 0){
					notice.show(response, 'color3');
					message.val('');
					message.val('');
				}

				// Clear fields
				// TODO Should phone number be cleared??
				
			}
		});
	});

	// Toggle settings
	$('.config').click(function(){
		panels.all.hide();
		panels.settings.show();
	});
	$('.settings button.gray').click(function(){
		panels.settings.hide();
		refresh();
	});

});