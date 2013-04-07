function onLoad(){
	document.addEventListener('deviceready', startApplication, true);
}

jQuery.expr[':'].containsCaseInsensitive = jQuery.expr.createPseudo(function(arg) {
    return function(elem) {
        return jQuery(elem).text().toUpperCase().indexOf(arg.toUpperCase()) >= 0;
    };
});

function startApplication(){
	//console.log('On device ready, start application!');

	var app, modules, helpers;

	app = {
		// options that are saved on the device
		options: {
			prefix: 0,
			number: false,
			useAutoLogin: true,
			lastSent: false,
			sentToday: 0
		},
		// global variables
		global: {
			API_URL: 'http://rocketlaunch.me/mondo/api/',
			prefixes: {
				'064' : 0,
				'065' : 1,
				'066' : 2,
				'060' : 3,
				'061' : 4,
				'062' : 5,
				'063' : 6,
				'069' : 7
			},
			ajaxInProgress: false,
			panels: $('.panel'),
			loading: $('.loading')
		},
		init: function(){
			app.bindings();
			app.checkSettings();
		},
		bindings: function(){
			// global bindings
			document.addEventListener('resume', function(){ app.checkSettings(); }, false);
			document.addEventListener('online', function(){ app.checkSettings(); }, false);
			document.addEventListener('offline', function(){ helpers.showPanel('offline'); }, false);

			// physical buttons
			document.addEventListener('menubutton', function(e){ app.onMenuButton(e); }, false);
			document.addEventListener('backButton', function(e){ app.onBackButton(e); }, false);

			// module bindings
			for(var module in modules){
                if (typeof(modules[module].bindings) == 'function') {
                    modules[module].bindings();
                    //console.log('Bindings for: '+module);
                }
			}
			// helpers bindings
			helpers.notice.bindings();
		},
		setSettings: function(prefix, number, useAutoLogin){
			var onError = function(){
				navigator.notification.alert('Došlo je do neočekivane greške');
			};

			app.options.prefix = prefix;
			app.options.number = number;
			app.options.useAutoLogin = useAutoLogin;

			window.plugins.applicationPreference.set('prefix', prefix, null, onError);
			window.plugins.applicationPreference.set('number', number, null, onError);
			window.plugins.applicationPreference.set('useAutoLogin', useAutoLogin, onSuccess, onError);
		},
		setMessageCount: function(){
			var onError = function(){
				navigator.notification.alert('Došlo je do neočekivane greške');
			};

			app.options.sentToday++;
			window.plugins.applicationPreference.set('sentToday', app.options.sentToday, null, onError);
			window.plugins.applicationPreference.set('lastSent', moment().format('YYYY-MM-DD'), null, onError);
			app.updateMessageDiv();
		},
		updateMessageDiv: function(){
			$('.sentToday').html(app.options.sentToday);
		},
		checkSettings: function(){
			// read settings and check if empty
			window.plugins.applicationPreference.load(
				function(data){
					// sets default autologin to true
					if(!data.useAutoLogin || typeof(data.useAutoLogin) == 'undefined'){
						data.useAutoLogin = true;
					}

					if(data.lastSent != moment().format('YYYY-MM-DD')){
						data.sentToday = 0;
					}

					// if there is no number, asks for client to enter it
					if(!data.prefix || typeof(data.number) == 'undefined'){
						helpers.notice.show('Morate uneti broj telefona');
						helpers.showPanel('settings');
					}
					else{
						app.options.prefix = data.prefix;
						app.options.number = data.number;
						app.options.useAutoLogin = data.useAutoLogin;
						app.options.sentToday = parseInt(data.sentToday, 10);

						// set old settings
						modules.settings.prefix.val(data.prefix);
						modules.settings.number.val(data.number);
						app.updateMessageDiv();

						if(data.useAutoLogin){
							modules.settings.autoLoginToggle.prop('checked', true);
						}
						else{
							modules.settings.autoLoginToggle.prop('checked', false);
						}
					}
					app.refresh();
				},
				function(){
					navigator.notification.alert('Došlo je do neočekivane greške');
				}
			);
		},
		// refresh method
		// checks for the application status
		refresh: function(){
			if(navigator.connection.type == 'none'){
				helpers.showPanel('offline');
				return;
			}
			if(app.global.ajaxInProgress){
				return;
			}

			helpers.loading.show();
			app.global.ajaxInProgress = true;
			helpers.notice.hide();

			$.ajax({
				dataType: 'jsonp',
				url: app.global.API_URL+'refresh.php',
				data: {
					prefix: app.options.prefix,
					phoneNumber: app.options.number
				},
				success: function(response){
					var format = 'dd, DD-MMM-YYYY hh:mm:ss Z';
					var expireDate = response.substring(response.search('expires')+8);
					expireDate = moment(expireDate, format);

					var now = moment(moment(), format);

					if(!expireDate || expireDate.isBefore(now)){
						helpers.showPanel('requestPassword');
					}
					else{
						helpers.showPanel('sendMessage');
					}

					helpers.loading.hide();
					app.global.ajaxInProgress = false;
				},
				error: function(e){
					navigator.notification.alert('Došlo je do neočekivane greške');
					app.global.ajaxInProgress = false;
					helpers.loading.hide();
				}
			});
		},
		onMenuButton: function(e){
			e.preventDefault();

			if(modules.menu.element.is(':visible')){
				modules.menu.element.hide();
			}
			else{
				modules.menu.element.show();
			}
		},
		onBackButton: function(e){
			e.preventDefault();
			if(modules.menu.element.is(':visible')){
				modules.menu.element.hide();
			}
			else if(modules.info.element.is(':visible')){
				app.global.panels.hide();
				app.refresh();
			}
			else if(modules.settings.element.is(':visible')){
				modules.settings.onChange();
			}
			else if(modules.contacts.element.is(':visible')){
				helpers.showPanel('sendMessage');
			}
			else{
				navigator.app.exitApp();
			}
		}
	};

	modules = {
		requestPassword: {
			element: $('.request'),
			bindings: function(){
				// Request new password
				modules.requestPassword.element.find('button.red').click(function(){
					if(app.global.ajaxInProgress){
						return;
					}
					app.global.ajaxInProgress = true;
					helpers.notice.hide();
					helpers.loading.show();

					$.ajax({
						dataType: 'jsonp',
						url: app.global.API_URL+'request.php',
						data: {
							prefix: app.options.prefix,
							phoneNumber: app.options.number
						},
						success: function(response){
							if(response.search('failure') >= 0){
								helpers.notice.show(response, 'color8');
								helpers.loading.hide();
							}
							else if(response.search('success') >= 0){
								if(app.options.useAutoLogin){
									modules.autoLogin.setMethodTimeout(modules.autoLogin.initialWaitingTime);
									helpers.showPanel('autoLogin');	
								}
								else{
									helpers.showPanel('login');	
								}
								
								helpers.notice.show(response, 'color3');
							}

							app.global.ajaxInProgress = false;
						},
						error: function(e){
							navigator.notification.alert('Došlo je do neočekivane greške');
							app.global.ajaxInProgress = false;
							helpers.loading.hide();
						}
					});
				});
			}
		},
		login: {
			element: $('.login'),
			password: $('input.password'),
			backToRequest: $('.backToRequest'),
			bindings: function(){
				$('.login .loginButton').click(function(){
					modules.login.doLogin();
				});
				$('.login .loadPasswordFromSMS').click(function(){
					var sms = cordova.exec(function(winParam) {}, function(error) {}, "ReadSms", "GetTexts", ["Mondo", 1]);
					if(sms.texts.length === 0 || sms.texts[0].message.indexOf('servis je') < 0){
						navigator.notification.alert('Nema poruke za Mondo SMS servis');
						return;
					}
					var start = sms.texts[0].message.indexOf('servis je')+10;
					var end = start+5;
					var passwordFromSMS = sms.texts[0].message.substring(start, end);
					modules.login.password.val(passwordFromSMS);
				});
				modules.login.backToRequest.click(function(){
					helpers.showPanel('requestPassword');
				});
			},
			doLogin: function (){
				if(app.global.ajaxInProgress){
					return;
				}
				app.global.ajaxInProgress = true;
				helpers.notice.hide();
				helpers.loading.show();

				$.ajax({
					dataType: 'jsonp',
					url: app.global.API_URL+'login.php',
					data: {
						prefix: app.options.prefix,
						phoneNumber: app.options.number,
						password: modules.login.password.val().toUpperCase()
					},
					success: function(response){
						if(response.search('failure') >= 0){
							if(modules.autoLogin.active){
								modules.login.password.val('');
								modules.autoLogin.setMethodTimeout(modules.autoLogin.waitingTime);
							}
							else{
								helpers.notice.show(response, 'color8');
								helpers.loading.hide();
							}
						}
						else if(response === ''){
							clearTimeout(modules.autoLogin.timeout);
							modules.autoLogin.active = false;

							helpers.showPanel('sendMessage');
							helpers.loading.hide();
						}
						app.global.ajaxInProgress = false;
					},
					error: function(e){
						navigator.notification.alert('Došlo je do neočekivane greške');
						helpers.loading.hide();
						app.global.ajaxInProgress = false;
					}
				});
			}
		},
		autoLogin: {
			element: $('.autoLogin'),
			timeout: false,
			active: true,
			waitingTime: 1000,
			initialWaitingTime: 2000,
			loginTries: {
				current: 0,
				max: 5
			},
			bindings: function(){
				$('.autoLogin button, .goToLogin').click(function(){
					helpers.showPanel('login');
					clearTimeout(modules.autoLogin.timeout);
					modules.autoLogin.active = false;
					helpers.loading.hide();
				});
			},
			setMethodTimeout: function(miliseconds){
				clearTimeout(modules.autoLogin.timeout);

				// if maximum number of tries is reached, go to login
				if(modules.autoLogin.loginTries.current++ >= modules.autoLogin.loginTries.max){
					modules.autoLogin.active = false;
					helpers.loading.hide();
					app.global.ajaxInProgress = false;
					helpers.showPanel('login');
					return;
				}

				modules.autoLogin.timeout = setTimeout(function(){ modules.autoLogin.tryLogin(); }, miliseconds);
				modules.autoLogin.active = true;
			},
			tryLogin: function(){
				var sms = cordova.exec(function(winParam) {}, function(error) {}, "ReadSms", "GetTexts", ["Mondo", 1]);

				if(sms.texts.length === 0 || sms.texts[0].message.indexOf('servis je') < 0){
					modules.autoLogin.setMethodTimeout(modules.autoLogin.waitingTime);
					return;
				}
				var start = sms.texts[0].message.indexOf('servis je')+10,
					end = start+5,
					passwordFromSMS = sms.texts[0].message.substring(start, end);

				modules.login.password.val(passwordFromSMS);
				modules.login.doLogin();
			}
		},
		sendMessage: {
			element: $('.sendMessage'),
			destinationNumber: {
				prefix: $('.sendMessage .phoneNumber select'),
				phoneNumber: $('.sendMessage .phoneNumber input')
			},
			message: $('.message'),
			bindings: function(){
				// Send message
				$('.sendMessage button').click(function(){
					if(app.global.ajaxInProgress){
						return;
					}
					app.global.ajaxInProgress = true;
					helpers.notice.hide();
					helpers.loading.show();

					$.ajax({
						dataType: 'jsonp',
						url: app.global.API_URL+'message.php',
						data: {
							prefix: app.options.prefix,
							phoneNumber: app.options.number,
							destinationPrefix: modules.sendMessage.destinationNumber.prefix.val(),
							destinationNumber: modules.sendMessage.destinationNumber.phoneNumber.val(),
							message: modules.sendMessage.message.val()
						},
						success: function(response){
							if(response.search('failure') >= 0){
								helpers.notice.show(response, 'color8');
							}
							else if(response.search('success') >= 0){
								helpers.notice.show(response, 'color3');
								modules.sendMessage.message.val('');

								// Increment sent messages
								app.setMessageCount();
							}

							helpers.loading.hide();
							app.global.ajaxInProgress = false;
						},
						error: function(e){
							navigator.notification.alert('Došlo je do neočekivane greške');

							helpers.loading.hide();
							app.global.ajaxInProgress = false;
						}
					});
				});
			}
		},
		contacts: {
			element: $('.contactsPanel'),
			loaded: false,
			button: $('.listContacts'),
			list: $('.contactsDiv'),
			searchInput: $('.contactsPanel input'),
			bindings: function(){
				modules.contacts.button.click(function(){
					if(!modules.contacts.loaded){
						modules.contacts.loadContacts();
					}
					else{
						helpers.showPanel('contacts');
					}
				});
			},
			loadContacts: function(){
				helpers.loading.show();
				var options = new ContactFindOptions();
				options.filter='';
				options.multiple=true;

				navigator.contacts.find(
					['displayName', 'phoneNumbers'],
					function(contactsData) {
						modules.contacts.loaded = true;

						var filteredContact = [],
							tmpNumber;

						// Filters contacts for those who have phones with specified prefixes
						for (var i=0; i<contactsData.length; i++) {
							// If there is no numbers, skip it
							if(contactsData[i].phoneNumbers !== null){
								for(var j=0; j<contactsData[i].phoneNumbers.length; j++) {
									// Removes spaces from phone number
									tmpNumber = contactsData[i].phoneNumbers[j].value.replace(/\ /g,'');

									// Searches for +381[prefix][number] and 0[prefix][number]
									if(tmpNumber.search(/\+3816[01234569][0-9]*|06[01234569][0-9]*/) >= 0 ){
										tmpNumber = tmpNumber.replace('+381','0');
										filteredContact.push({
											prefix: app.global.prefixes[tmpNumber.substring(0,3)],
											number: tmpNumber.substring(3),
											fullNumber: tmpNumber,
											name: contactsData[i].displayName
										});
									}

								}
							}
						}
						// Sort by names
						filteredContact = filteredContact.sort(function (a, b ){ return a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1; });

						// Adding HTML
						for (i=0; i<filteredContact.length; i++) {
							modules.contacts.list.append(
									'<a data-prefix="'+filteredContact[i].prefix+'" data-phone="'+filteredContact[i].number+'">'+
									filteredContact[i].name+': '+filteredContact[i].fullNumber+'</a>');
						}

						// Bindings on click
						modules.contacts.element.find('a').click(function(e){
							e.preventDefault();
							modules.sendMessage.destinationNumber.prefix.val($(this).data('prefix'));
							modules.sendMessage.destinationNumber.phoneNumber.val($(this).data('phone'));
							helpers.showPanel('sendMessage');
							return false;
						});

						// Bindings on search
						modules.contacts.searchInput.keyup(function(){
							var searchTerm = $.trim($(this).val());
							if(searchTerm===''){
								modules.contacts.element.find('a').show();
							}
							else{
								modules.contacts.element.find('a').hide();
								modules.contacts.element.find('a:containsCaseInsensitive('+searchTerm+')').show();
							}
						});

						helpers.showPanel('contacts');
						helpers.loading.hide();
					},
					function onError(contactError) {
						navigator.notification.alert('Došlo je do neočekivane greške prilikom učitavanja kontakata');
					},
					options
				);
			}
		},
		menu: {
			element: $('.menuOverlay'),
			bindings: function(){
				$('.menuReset').click(function(){
					navigator.notification.confirm('Da li ste sigurni da želite da resetujete šifru?', function(){
						if(app.global.ajaxInProgress){
							return;
						}
						app.global.ajaxInProgress = true;
						helpers.notice.hide();

						$.ajax({
							dataType: 'jsonp',
							url: app.global.API_URL+'reset.php',
							data: {
								prefix: app.options.prefix,
								phoneNumber: app.options.number
							},
							success: function(response){
								helpers.showPanel('requestPassword');
								app.global.ajaxInProgress = false;
							},
							error: function(e){
								modules.menu.element.hide();
								helpers.navigator.notification.alert('Došlo je do neočekivane greške');
								app.global.ajaxInProgress = false;
							}
						});

					}, 'Reset');
				});
				$('.menuInfo').click(function(){
					helpers.showPanel('info');
				});
				$('.menuSettings, .settingsIcon').click(function(){
					helpers.showPanel('settings');
				});
				$('.back').click(function(){
					app.global.panels.hide();
					app.refresh();
				});
			}
		},
		offline: {
			element: $('.offline')
		},
		info: {
			element: $('.info')
		},
		settings: {
			element: $('.settings'),
			prefix: $('.settings .phoneNumber select'),
			number: $('.settings .phoneNumber input'),
			autoLoginToggle: $('.autoLoginToggle'),
			bindings: function(){
				$('.settings .gray').click(function(){
					modules.settings.onChange();
				});
			},
			onChange: function(){
				if($.trim(modules.settings.number.val()) === '' ){
					helpers.notice.show('Morate uneti broj telefona');
					return;
				}
				if(
					app.options.prefix != modules.settings.prefix.val() ||
					app.options.number != modules.settings.number.val() ||
					modules.settings.autoLoginToggle.is(':checked') != app.options.useAutoLogin
				){
					app.setSettings(modules.settings.prefix.val(), modules.settings.number.val(), modules.settings.autoLoginToggle.is(':checked'));
				}
				app.global.panels.hide();
				app.refresh();
			}
		}
	};

	helpers = {
		notice: {
			element: $('#notice'),
			bindings: function(){
				$('#notice button').click(function(){
					helpers.notice.hide();
				});
			},
			show: function(text, cssClass){
				if(typeof(cssClass)==='undefined'){
					cssClass = 'color3';
				}
				helpers.notice.element.attr('class', cssClass).show().find('.text').html(text);
			},
			hide: function(){
				helpers.notice.element.hide();
			}
		},
		loading: $('.loading'),
		showPanel: function(panelToShow){
			// show module
			app.global.panels.hide();
			modules[panelToShow].element.show();

			// hide menu
			modules.menu.element.hide();
		}
	};

	app.init();
}
