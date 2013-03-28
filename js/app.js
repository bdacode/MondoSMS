$(document).ready(function(){
	API_DOMAIN = 'http://rocketlaunch.me/mondo/api/';

	var panels = {
		all: $('.panel'),
		request: $('.request'),
		login: $('.login'),
		settings: $('.settings'),
		send: $('.sendMessage')
	};

	panels.request.show();

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

	// Ask for password
	$('.request button').click(function(){
		$.ajax({
			dataType: 'jsonp',
			url: API_DOMAIN+'request.php',
			data: {
				prefix: myNumber.prefix.val(),
				phoneNumber: myNumber.phoneNumber.val()
			},
			success: function(response){
				// TODO error handling

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
		$.ajax({
			dataType: 'jsonp',
			url: API_DOMAIN+'login.php',
			data: {
				prefix: myNumber.prefix.val(),
				phoneNumber: myNumber.phoneNumber.val(),
				password: password.val()
			},
			success: function(response){
				// TODO error handling

				panels.all.hide();
				panels.send.show();
			}
		});
	});

	// Send message
	$('.sendMessage button').click(function(){
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
				// TODO error handling

				// Clear fields
				// TODO Should phone number be cleared??
				message.val('');
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
		panels.request.show();
	});

});