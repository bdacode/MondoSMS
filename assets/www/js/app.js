function onLoad(){
	document.addEventListener('deviceready', startApplication, true);
}

jQuery.expr[':'].containsCaseInsensitive = jQuery.expr.createPseudo(function(arg) {
    return function(elem) {
        return jQuery(elem).text().toUpperCase().indexOf(arg.toUpperCase()) >= 0;
    };
});

function startApplication(){
	console.log('On device ready, start application!');

	var app, modules, helpers;

	app = {
		// options that are saved on the device
		options: {
			phoneNumber: {
				prefix: false,
				number: false
			},
			useAutoLogin: false
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
			// read settings and check if empty
			app.bindings();
			app.refresh();
		},
		bindings: function(){
			// global bindings
			document.addEventListener('resume', function(){ app.refresh(); }, false);
			document.addEventListener('online', function(){ app.refresh(); }, false);
			document.addEventListener('offline', function(){ helpers.showPanel('offline'); }, false);

			// physical buttons
			document.addEventListener('menubutton', function(e){ app.onMenuButton(e); }, false);
			document.addEventListener('backButton', function(e){ app.onBackButton(e); }, false);

			// module bindings
			for(var module in modules){
                if (typeof(modules[module].bindings) == 'function') {
                    modules[module].bindings();
                    console.log('Bindings for: '+module);
                }
			}
			// helpers bindings
			helpers.notice.bindings();
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
					prefix: this.options.phoneNumber.prefix,
					phoneNumber: this.options.phoneNumber.number
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
						helpers.sendMessage('requestPassword');
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
			else if(modules.info.element.is(':visible') || modules.settings.element.is(':visible')){
				app.global.panels.hide();
				app.refresh();
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
							prefix: app.options.phoneNumber.prefix,
							phoneNumber: app.options.phoneNumber.number
						},
						success: function(response){
							if(response.search('failure') >= 0){
								helpers.notice.show(response, 'color8');
								helpers.loading.hide();
							}
							else if(response.search('success') >= 0){
								modules.autoLogin.setMethodTimeout(initialWaitingTime);

								helpers.showPanel('autoLogin');
								helpers.notice.show(response, 'color3');
							}

							ajaxInProgress = false;
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
						prefix: this.options.phoneNumber.prefix,
						phoneNumber: this.options.phoneNumber.number,
						password: modules.login.password.val().toUpperCase()
					},
					success: function(response){
						if(response.search('failure') >= 0){
							if(modules.autoLogin.active){
								modules.autoLogin.setMethodTimeout(waitingTime);
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
			active: false,
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
					helpers.showPanel('login');
				}

				modules.autoLogin.timeout = setTimeout(modules.autoLogin.tryLogin, miliseconds);
				modules.autoLogin.active = true;
			},
			tryLogin: function(){
				var sms = cordova.exec(function(winParam) {}, function(error) {}, "ReadSms", "GetTexts", ["Mondo", 1]);

				if(sms.texts.length === 0 || sms.texts[0].message.indexOf('servis je') < 0){
					modules.autoLogin.setMethodTimeout(waitingTime);
					return;
				}
				var start = sms.texts[0].message.indexOf('servis je')+10,
					end = start+5,
					passwordFromSMS = sms.texts[0].message.substring(start, end);

				this.modules.login.password.val(passwordFromSMS);

				this.modules.login.doLogin();
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
							prefix: this.options.phoneNumber.prefix,
							phoneNumber: this.options.phoneNumber.number,
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
					if(!this.contacts.loaded){
						this.contacts.loadContacts();
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
							contacts.div.append(
									'<a data-prefix="'+filteredContact[i].prefix+'" data-phone="'+filteredContact[i].number+'">'+
									filteredContact[i].name+': '+filteredContact[i].fullNumber+'</a>');
						}

						// Bindings on click
						modules.contacts.find('a').click(function(e){
							e.preventDefault();
							modules.sendMessage.destinationNumber.prefix.val($(this).data('prefix'));
							modules.sendMessage.destinationNumber.phoneNumber.val($(this).data('phone'));
							contacts.panel.hide();
							panels.send.show();

							return false;
						});

						// Bindings on search
						modules.contacts.searchInput.keyup(function(){
							var searchTerm = $.trim($(this).val());
							if(searchTerm===''){
								contacts.div.find('a').show();
							}
							else{
								modules.contacts.element.find('a:containsCaseInsensitive('+searchTerm+')').show().siblings().hide();
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
								prefix: myNumber.prefix.val(),
								phoneNumber: myNumber.phoneNumber.val()
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
			element: $('.settings')
		}
	};

	helpers = {
		notice: {
			element: $('#notice'),
			bindings: function(){
				$('#notice button').click(function(){
					notice.hide();
				});
			},
			show: function(text, cssClass){
				if(typeof(cssClass)==='undefined'){
					cssClass = 'color3';
				}
				this.element.attr('class', cssClass).show().find('.text').html(text);
			},
			hide: function(){
				this.element.hide();
			}
		},
		loading: $('loading'),
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
