/** Define a BridgeWinners namespace */
if ( typeof BW === "undefined" ) BW = {};

/**
 * A class to represent user related activities including login and logout.
 */
BW.User = function( containerID ) {
	this.accessTokenLocalStorageVariableName = "BW.accessToken";
	this.accessToken = localStorage.getItem( this.accessTokenLocalStorageVariableName );
	this.containerID = containerID;
	//this.username = null;
	this.isLoggedIn = false;
	this.isAuthenticated = false;
	this.userInfo = null;
	this.userName = null;
	
	// Setup login and logout submit button handler
	$( document ).on( "click", "#login-submit-button", { user: this }, function( e ) {
		var username = $( "#username" ).val();
		var password = $( "#password" ).val();		
		e.data.user.login( username, password );
		return false;		
	});	
	
	$( document ).on( "click", "#logout-submit-button" , { user: this }, function( e ) {
		e.data.user.logout();
		return false;			
	});
	
	// Login Status change handler
	$( document ).on( "BW.loginStatus:changed", function( e, user ) {
		user.initialize();
	});		
};

/**
 * Initialize the user
 */
BW.User.prototype.initialize = function() {
	
	if ( this.accessToken ) {
		this.authenticateAccessToken();
	}
	else {
		this.isLoggedIn = false;
		BW.disableNavbar();
		BW.hideLoadingDialog();
		BW.loadPage( { page: "login" } );
		//BW.showOneSection( "bw_login" );
		//this.showLoginForm();
	}
};

/**
 * Authenticate the access token with the BW server
 */
BW.User.prototype.authenticateAccessToken = function() {
	// Connect to BW server to check if access token is still ok
	var parameters = {
		urlSuffix: "get-profile/",
		loadingMessage: "Authenticating Access",
		method: "GET",
		context: this,
		data: {},
		successCallback: this.authenticationSuccessCallback,
		failCallback: this.authenticationFailCallback
	};
	BW.ajax( parameters );
	return false;	
};

/**
 * Authentication Ajax sucess call back
 */
BW.User.prototype.authenticationSuccessCallback = function( data ) {
	var user = this.context;
	user.isLoggedIn = true;
	user.isAuthenticated = true;
	user.userInfo = data;
	user.username = data.username;
	var avatarLink = BW.getAvatarLink( user.userInfo.avatar );
	$( "#header-avatar" ).attr( "src", avatarLink );
	user.updateButtonStatus();
	var parameters = {
		page: "vote",
		slug: null
	}
	BW.enableNavbar();
	BW.currentOptions.loadAll( user.username );
	BW.loadPage( parameters );
};

/**
 * Authentication Ajax fail call back
 */
BW.User.prototype.authenticationFailCallback = function( message ) { 
	var user = this.context;
	alert( message ); 
	user.isLoggedIn = false;
	user.accessToken = null;
	$( "#login-submit-button" ).prop( "disabled", false );
	$( document ).trigger( "BW.loginStatus:changed", [user] );	
};


/**
 * Show the login form.
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
	/*html += '<li>';
	html += '<div style="text-align:center;">';
	html += '<h4>Sign In Using Your Existing account At:</h4>';
	html += '<img src="img/g+.png"/>';
	html += '<img src="img/facebook.png"/></div>';
	html += '</li>';*/
	html += '</ul>';
	html += '</div>';			
	$( "#" + this.containerID ).empty().append( html );
	//if ( this.username ) $( "#username" ).val(  this.username );
	$( "#" + this.containerID ).trigger( "create" );
	
};

/**
 * Get the avatar link for current user.
 */
BW.User.prototype.getAvatarLink = function() {
	var userInfo = this.userInfo;
	return BW.getAvatarLink( userInfo.avatar );	
};

/**
 * Load the user profile information.
 * @param {object} userInfo json object containing user information to be displayed.
 */
BW.User.prototype.loadProfile = function() {
	var userInfo = this.userInfo;
	var html = "";
	var avatarLink = BW.getAvatarLink( userInfo.avatar );
	html += "<img style='vertical-align:middle;' height='25px' src='" + avatarLink + "'/>Welcome " + userInfo.name;
	$( "#profile-content" ).empty().html( html );
};


/** LOGIN and LOGOUT */

/**
 * Try to login to BW server.
 * @param {string} username the username to use to login
 * @param {string} password the password to use to login
 */
BW.User.prototype.login = function( username, password ) {
	var parameters = {
		urlSuffix: "get-auth-token/",
		loadingMessage: "Logging In",
		method: "POST",
		context: this,
		data: { username: username, password: password },
		includeHeaders: false,
		successCallback: this.loginSuccessCallback,
		failCallback: this.loginFailCallback
	};
	BW.ajax( parameters );
	return false;
};

/**
 * Login Ajax done call back
 */
BW.User.prototype.loginSuccessCallback = function( data ) {
	var user = this.context;
	user.isLoggedIn = true;
	user.accessToken = data[ "token" ];
	localStorage.setItem( user.accessTokenLocalStorageVariableName, user.accessToken );
	$( document ).trigger( "BW.loginStatus:changed", [user] );
};

/**
 * Login Ajax fail call back
 */
BW.User.prototype.loginFailCallback = function( message ) {
	var user = this.context;
	alert( message ); 
	user.isLoggedIn = false;
	user.accessToken = null;
	$( document ).trigger( "BW.loginStatus:changed", [user] );	
};

/**
 * Logout from BW server
 */
BW.User.prototype.logout = function() {
	this.isLoggedIn = false;
	this.accessToken = null;
	this.isAuthenticated = false;
	this.userInfo = null;
	localStorage.removeItem( this.accessTokenLocalStorageVariableName );
	$( "#header-avatar" ).attr( "src", "" );
	this.updateButtonStatus();
	$( document ).trigger( "BW.loginStatus:changed", [this] );
};


/** UTILITIES */

/**
 * Get access token
 * Used by all ajax requests
 */
BW.User.prototype.getAccessToken = function() {
	return this.accessToken;
};

/**
 * Get Name
 */
BW.User.prototype.getName = function() {
	return this.userInfo.name;
};

/** Update the login/logout button status */
BW.User.prototype.updateButtonStatus = function() {
	$( "#logout-submit-button" ).prop( "disabled", !this.isLoggedIn );
	$( "#login-submit-button" ).prop( "disabled", this.isLoggedIn );
};
