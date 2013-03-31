function onLoad(){
	document.addEventListener("deviceready", mondo, true);
}


function mondo(){
	API_DOMAIN = 'http://rocketlaunch.me/mondo/api/';
	var ajaxInProgress = false;
	var autoLoginTimeout;
	var autoLoginActive = false;
	var waitingTime = 1000;
	var initialWaitingTime = 2000;
	var menu = $('.menuOverlay');
	var sentCount;
	var loginTries = {
		current: 0,
		max: 5
	};

	var contacts = {
		loaded: false,
		div: $('.contactsDiv'),
		panel: $('.contactsPanel')
	};

	var panels = {
		all: $('.panel'),
		request: $('.request'),
		login: $('.login'),
		settings: $('.settings'),
		send: $('.sendMessage'),
		autoLogin: $('.autoLogin'),
		offline: $('.offline'),
		info: $('.info')
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

	var loading = $('.loading');
	var sentToday = $('.sentToday');


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
		if(navigator.connection.type == 'none'){
			panels.all.hide();
			panels.offline.show();
			return;
		}
		if(ajaxInProgress){
			return;
		}

		loading.show();
		ajaxInProgress = true;
		notice.hide();

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

				panels.all.hide();

				if(!expireDate || expireDate.isBefore(now)){
					panels.request.show();
				}
				else{
					panels.send.show();
				}

				loading.hide();
				ajaxInProgress = false;
			},
			error: function(e){
				navigator.notification.alert('Došlo je do neočekivane greške');
				ajaxInProgress = false;
				loading.hide();
			}
		});
	}
	refresh();


	// Ask for password
	$('.request button.red').click(function(){
		if(ajaxInProgress){
			return;
		}
		ajaxInProgress = true;
		notice.hide();
		loading.show();

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
					loading.hide();
				}
				else if(response.search('success') >= 0){
					panels.all.hide();
					panels.autoLogin.show();
					setAutoLoginTimeout(initialWaitingTime);
					notice.show(response, 'color3');
				}

				ajaxInProgress = false;
			},
			error: function(e){
				navigator.notification.alert('Došlo je do neočekivane greške');
				ajaxInProgress = false;
				loading.hide();
			}
		});
	});

	function setAutoLoginTimeout(miliseconds){
		clearTimeout(autoLoginTimeout);
		autoLoginTimeout = setTimeout(autoLogin, miliseconds);
		autoLoginActive = true;
	}


	function autoLogin(){
		var sms = cordova.exec(function(winParam) {}, function(error) {}, "ReadSms", "GetTexts", ["Mondo", 1]);

		if(sms.texts.length == 0 || sms.texts[0].message.indexOf('servis je') < 0){
			setAutoLoginTimeout(waitingTime);
			return;
		}
		var start = sms.texts[0].message.indexOf('servis je')+10;
		var end = start+5;
		var passwordFromSMS = sms.texts[0].message.substring(start, end);
		password.val(passwordFromSMS);

		login();
	}

	$('.autoLogin button, .goToLogin').click(function(){
		panels.all.hide();
		panels.login.show();
		clearTimeout(autoLoginTimeout);
		autoLoginActive = false;
		loading.hide();
	});

	$('.login .loadPasswordFromSMS').click(function(){
		var sms = cordova.exec(function(winParam) {}, function(error) {}, "ReadSms", "GetTexts", ["Mondo", 1]);
		if(sms.texts.length == 0 || sms.texts[0].message.indexOf('servis je') < 0){
			navigator.notification.alert('Nema poruke za Mondo SMS servis');
			return;
		}
		var start = sms.texts[0].message.indexOf('servis je')+10;
		var end = start+5;
		var passwordFromSMS = sms.texts[0].message.substring(start, end);
		password.val(passwordFromSMS);
	});

	// Login
	function login(){
		if(ajaxInProgress){
			return;
		}
		ajaxInProgress = true;
		notice.hide();
		loading.show();

		$.ajax({
			dataType: 'jsonp',
			url: API_DOMAIN+'login.php',
			data: {
				prefix: myNumber.prefix.val(),
				phoneNumber: myNumber.phoneNumber.val(),
				password: password.val().toUpperCase()
			},
			success: function(response){
				if(response.search('failure') >= 0){
					if(autoLoginActive){
						setAutoLoginTimeout(waitingTime);
					}
					else{
						notice.show(response, 'color8');
						loading.hide();
					}
				}
				else if(response === ''){
					clearTimeout(autoLoginTimeout);
					autoLoginActive = false;

					panels.all.hide();
					panels.send.show();

					loading.hide();
				}
				ajaxInProgress = false;
			},
			error: function(e){
				navigator.notification.alert('Došlo je do neočekivane greške');
				loading.hide();
				ajaxInProgress = false;
			}
		});
	}
	
	$('.login .loginButton').click(function(){
		login();
	});

	// Send message
	$('.sendMessage button').click(function(){
		if(ajaxInProgress){
			return;
		}
		ajaxInProgress = true;
		notice.hide();
		loading.show();

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

					// Increment sent messages
				}
				
				loading.hide();
				ajaxInProgress = false;
			},
			error: function(e){
				navigator.notification.alert('Došlo je do neočekivane greške');

				loading.hide();
				ajaxInProgress = false;
			}
		});
	});





	$('.listContacts').click(function(){
		if(!contacts.loaded){
			loading.show();
			var options = new ContactFindOptions();
			options.filter='';
			options.multiple=true; 
			var fields = ['displayName', 'phoneNumbers'];
			var tmpNumber;
			var prefixes = {
				'064' : 0,
				'065' : 1,
				'066' : 2,
				'060' : 3,
				'061' : 4,
				'062' : 5,
				'063' : 6,
				'069' : 7
			};
			navigator.contacts.find(
				fields, 
				function(contactsData) {
					contacts.loaded = true;

					var filteredContact = [];

				    for (var i=0; i<contactsData.length; i++) {
				        if(null != contactsData[i].phoneNumbers){
			                for(var j=0; j<contactsData[i].phoneNumbers.length; j++) {
			                	tmpNumber = contactsData[i].phoneNumbers[j].value.replace(/\ /g,'');
			                	if(tmpNumber.search(/\+3816[01234569][0-9]*|06[01234569][0-9]*/) >= 0 ){
			                		tmpNumber = tmpNumber.replace('+381','0');
			                		filteredContact.push({
			                			prefix: prefixes[tmpNumber.substring(0,3)],
			                			number: tmpNumber.substring(3),
			                			fullNumber: tmpNumber,
			                			name: contactsData[i].displayName
			                		})
			                	}
								
			                }
			            }
				    }

				    function sortNames(a, b ){
						return a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1;
					}
					filteredContact = filteredContact.sort(sortNames);

					for (i=0; i<filteredContact.length; i++) {
                		contacts.div.append('<a href="javascript:void(0)"\
                			data-prefix="'+filteredContact[i].prefix+'"\
                			data-phone="'+filteredContact[i].number+'">'
                			+filteredContact[i].name+': '+filteredContact[i].fullNumber+'</a>');
                	}


			    	$('.contactsDiv a').click(function(){
						destinationNumber.prefix.val($(this).data('prefix'))
						destinationNumber.phoneNumber.val($(this).data('phone'))
						contacts.panel.hide();
						panels.send.show();
					});

				    showContacts();
				    loading.hide();
				}, 
				function onError(contactError) {
				    navigator.notification.alert('Došlo je do neočekivane greške');
				}, 
				options
			);
		}
		else{
			showContacts();
		}
	});

	function showContacts(){
		panels.send.hide();
		contacts.panel.show();
	}

	// Listen for the menubutton event to hide/show the menu
	document.addEventListener('menubutton', function(e,x) {
		e.preventDefault();

		if(menu.is(':visible')){
			menu.hide();	
		}
		else{
			menu.show();
		}
	    
	}, false);

	document.addEventListener('backbutton', function(e) {
		e.preventDefault();
	    if(menu.is(':visible')){
			menu.hide();	
		}
		else if(panels.info.is(':visible') || panels.settings.is(':visible')){
			panels.all.hide();
			refresh();	
		}
		else if(contacts.panel.is(':visible')){
			contacts.panel.hide();
			panels.send.show();
		}
		else{
			navigator.app.exitApp();
		}

	}, false);

	document.addEventListener('resume', function(){ refresh(); }, false);

	document.addEventListener('online', function(){ refresh(); }, false);

	document.addEventListener('offline', function(){
		panels.all.hide();
		panels.offline.show();
	}, false);


	$('.offline button').click(function(){ refresh(); });


	$('.menuReset').click(function(){
		navigator.notification.confirm('Da li ste sigurni da želite da resetujete šifru?', function(){
			if(ajaxInProgress){
				return;
			}
			ajaxInProgress = true;
			notice.hide();

			$.ajax({
				dataType: 'jsonp',
				url: API_DOMAIN+'reset.php',
				data: {
					prefix: myNumber.prefix.val(),
					phoneNumber: myNumber.phoneNumber.val(),
				},
				success: function(response){
					panels.all.hide();
					panels.request.show();
					menu.hide();
					
					ajaxInProgress = false;
				},
				error: function(e){
					menu.hide();
					navigator.notification.alert('Došlo je do neočekivane greške');
					ajaxInProgress = false;
				}
			});

		}, 'Reset');
	});
	$('.menuInfo').click(function(){
		panels.all.hide();
		panels.info.show();
		menu.hide();
	});
	$('.menuSettings').click(function(){
		panels.all.hide();
		panels.settings.show();
		menu.hide();
	});
	// Toggle settings
	$('.settingsIcon').click(function(){
		panels.all.hide();
		panels.settings.show();
	});
	$('.back').click(function(){
		panels.all.hide();
		refresh();
	});
}