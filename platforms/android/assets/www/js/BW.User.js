/** Define a BridgeWinners namespace */
if ( typeof BW === "undefined" ) BW = {};

/**
 * A class to represent user related activities including login and logout.
 */
BW.User = function( containerID ) {
	this.localStorageVariableName = "BW.currentUser";
	this.containerID = containerID;
	this.isLoggedIn = false;
	this.username = null;
	this.password = null;
	this.accessToken = null;
	this.userInfo = null;
	this.initialize = true;
	
	// load from local storage
	this.load();
	
	// Setup login and logout submit button handler

	$( document ).on( "click", "#logout-submit-button", { user: this }, function( e ) {
		e.data.user.logout();
		event.preventDefault();
		event.stopPropagation();
		return false;			
	});
	$( document ).on( "loginStatus:changed", function( e, user ) {
		user.updateLoginStatus();
	});	
	
	this.authenticateAccessToken();
	this.initialize = false;
};

/**
 * Get name of this user
 */
BW.User.prototype.getName = function() { return this.userInfo ? this.userInfo.name : ""; }

/**
 * Get the image of this user
 */
BW.User.prototype.getImage = function() { return this.userInfo ? this.userInfo.image : ""; }

/**
 * Save the user info to local storage
 * Do not save password.
 */
BW.User.prototype.save = function() {
	var userInfo = {
		username: this.username,
		password: this.password,
		accessToken: this.accessToken
	};
	localStorage.setItem( this.localStorageVariableName, JSON.stringify( userInfo ) );
};


/**
 * Load current user info if any from local storage
 */
BW.User.prototype.load = function() {
	var user = localStorage.getItem( this.localStorageVariableName );
	if ( user ) {
		var info = JSON.parse( user );
		this.username = info.username;
		this.password = info.password;
		this.accessToken = info.accessToken;
		this.userInfo = BW.users[ this.username + " " + this.password ];
	}
	
};

/**
 * Authenticate the access token with the BW server
 */
BW.User.prototype.authenticateAccessToken = function() {
	// Connect to BW server to check if access token is still ok
	if ( this.accessToken ) {
		$.mobile.loading( "show", {
		  text: "Connecting to BW server",
		  textVisible: true
		});
		// Connect and reset should go in callback
		this.userInfo = BW.users[ this.username + " " + this.password ];
		this.isLoggedIn = true;
		//this.loadProfile( this.userInfo );
		//$( "#login-submit-button" ).prop( "disabled", false );
		$.mobile.loading( "hide" );
	}
	else {
		this.isLoggedIn = false;
	}
	$( document ).trigger( "loginStatus:changed",  [ this, this.isLoggedIn ]);
};

/**
 * Show the login form.
 * @param {string} containerID - the container for the form
 */
BW.User.prototype.showLoginForm = function() {
	var html = "";
	html += '<div data-role="header">';
	html += '<h4>Sign In to access features of this app</h4>';
	html += '</div>';
	html += '<div data-role="main" class="ui-content">';
	html += '<ul data-role="listview" data-inset="true">';
	html += '<li>';
	html += '<form id="loginForm" data-ajax="false">';
	html += '<div data-role="fieldcontain" class="ui-hide-label">';
	html += '<label for="username">Username:</label>';
	html += '<input type="text" name="username" id="username" value="" placeholder="Email or Username" />';
	html += '</div>';
	html += '<div data-role="fieldcontain" class="ui-hide-label">';
	html += '<label for="password">Password:</label>';
	html += '<input type="password" name="password" id="password" value="" placeholder="Password" />';
	html += '</div>';
	html += '<input type="submit" value="LOG IN" id="login-submit-button">';
	html += '</form>';
	html += '</li>';
	html += '<li>';
	html += '<div style="text-align:center;">';
	html += '<h4>Sign In Using Your Existing account At:</h4>';
	html += '<img src="img/g+.png"/>';
	html += '<img src="img/facebook.png"/></div>';
	html += '</li>';
	html += '</ul>';
	html += '</div>';			
	$( "#" + this.containerID ).empty().append( html );
	if ( this.username ) $( "#username" ).val(  this.username );
	$( "#" + this.containerID ).trigger( "create" );
	$( "#login-submit-button").click( { user: this }, function( e ) {
		var username = $( "#username" ).val();
		var password = $( "#password" ).val();		
		e.data.user.login( username, password );
		event.preventDefault();
		event.stopPropagation();
		return false;		
	});	
};

/**
 * Try to login to BW server.
 * @param {string} username the username to use to login
 * @param {string} password the password to use to login
 */
BW.User.prototype.login = function( username, password ) {
	$( "#login-submit-button" ).prop( "disabled", true );
	this.username = username;
	this.password = password;
	if ( !_.has( BW.users, username + " " + password ) ) {
		alert( 'Invalid Credentials!' );
		$( "#login-submit-button" ).prop( "disabled", false );
	}
	else {
		// Do whatever is necessary to login to server
		/*if( this.username != "" && this.password !== "" ) {
			$.post("bw.server?method=login&returnformat=json", { username:this.username, password: this.password }, function(res) {
				if(res == true) {
					// Finish login
				} else {
					alert( "Login failed" );
				}
			 $( "#login-submit-button" ).prop( "disabled", false );
			},"json");
		} else {
			alert( "You must enter a username and password" );
			$( "#login-submit-button" ).prop( "disabled", false );
		}	*/	
		this.isLoggedIn = true;
		this.userInfo = BW.users[ this.username + " " + this.password ];
		this.accessToken = "random_access_token";
		//this.loadProfile( this.userInfo );
		//$( "#login-submit-button" ).prop( "disabled", false );
		$( document ).trigger( "loginStatus:changed",  [ this, this.isLoggedIn ]);
	}	
};

/**
 * Logout from BW server
 */
BW.User.prototype.logout = function() {
	this.isLoggedIn = false;
	this.accessToken = null;
	this.userInfo = null;
	$( document ).trigger( "loginStatus:changed",  [ this, this.isLoggedIn ]);
	//$( "#logout-dialog" ).popup( "close" );
};

/**
 * Load the user profile information.
 * @param {object} userInfo json object containing user information to be displayed.
 */
BW.User.prototype.loadProfile = function() {
	var userInfo = this.userInfo;
	var html = "";
	html += "<img style='vertical-align:middle;' height='25px' src='" + userInfo.image + "'/>Welcome " + userInfo.name;
	$( "#profile-content" ).empty().html( html );
};

/**
 * Update the login and logout button and dialog based on login status.
 */
BW.User.prototype.updateLoginStatus = function() {
	this.save();
	if ( this.isLoggedIn ) {
		//$( "#profile-button" ).removeClass( "ui-disabled" );
		$( "a[role='page']" ).removeClass( "ui-disabled" );
		if ( this.initialize ) BW.loadPage( "vote.html" );
		else $( "#home-tab" ).trigger( "click" );
	}
	else {
		//$( "#profile-button" ).addClass( "ui-disabled" );
		$( "a[role='page']" ).addClass( "ui-disabled" );
		this.showLoginForm();
	}
};

