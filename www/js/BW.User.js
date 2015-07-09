/** Define a BridgeWinners namespace */
if ( typeof BW === "undefined" ) BW = {};

/**
 * A class to represent user related activities including login and logout.
 */
BW.User = function( containerID ) {
	this.accessTokenLocalStorageVariableName = "BW.accessToken";
	this.accessToken = localStorage.getItem( this.accessTokenLocalStorageVariableName );
	this.containerID = containerID;
	this.username = null;
	this.isLoggedIn = false;
	this.userInfo = null;
	
	// Setup login and logout submit button handler
	$( document ).on( "click", "#logout-submit-button", { user: this }, function( e ) {
		e.data.user.logout();
		event.preventDefault();
		event.stopPropagation();
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
		BW.loadPage( "vote.html" );
	}
};

/**
 * Get Link to avatar
 */
BW.User.prototype.getAvatarLink = function() {
	return BW.sitePrefix + this.userInfo.avatar;
};

/**
 * Get Name
 */
BW.User.prototype.getName = function() {
	return this.userInfo.name;
};


/**
 * Authenticate the access token with the BW server
 */
BW.User.prototype.authenticateAccessToken = function() {
	// Connect to BW server to check if access token is still ok
	BW.showLoadingDialog( "Authenticating Access" );
	/*$.mobile.loading( "show", {
	  text: "Connecting to BW server",
	  textVisible: true
	});*/
	
	var url = encodeURI(BW.sitePrefix + 'rest-api/v1/get-profile/');
	var request = $.ajax({
	  method: "GET",
	  context: this,
	  url: url,
	  headers: {'Authorization': 'Token ' + this.accessToken}
	});	
	request.done(function( data ) {
		var user = this;
		user.isLoggedIn = true;
		user.userInfo = data;
		user.username = data.username;
		var avatarLink = user.getAvatarLink();
		$( "#header-avatar" ).attr( "src", avatarLink );
		//$.mobile.loading( "hide" );
		BW.hideLoadingDialog();
		BW.loadPage( "vote.html" );
	});
	request.fail(function(jqXHR, textStatus, errorThrown){ 
		var user = this;
		alert( "Unable to authenticate access. Please login again to continue" ); 
		user.isLoggedIn = false;
		user.username = null;
		BW.hideLoadingDialog();
		BW.loadPage( "vote.html" );
	});	

};


/**
 * Get access token
 */
BW.User.prototype.getAccessToken = function() {
	return this.accessToken;
};

/**
 * Get the locat storage variable name
 */
BW.User.prototype.getLocalStorageVariableName = function( itemName ) {
	return "BW::" + this.username + "_" + itemName;
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
	//if ( this.username ) $( "#username" ).val(  this.username );
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
	var url = encodeURI(BW.sitePrefix + 'rest-api/v1/get-auth-token/');
	BW.showLoadingDialog( "Logging In" );
	var request = $.ajax({
	  method: "POST",
	  context: this,
	  url: url,
	  data: { username: username, password: password }
	});	
	request.done(function( data ) {
		var user = this;
		user.isLoggedIn = true;
		user.accessToken = data[ "token" ];
		localStorage.setItem( this.accessTokenLocalStorageVariableName, user.accessToken );
		BW.hideLoadingDialog();
		//$.mobile.loading( "hide" );
		$( "#login-submit-button" ).prop( "disabled", false );
		$( document ).trigger( "BW.loginStatus:changed", [user] );
	});
	request.fail(function(jqXHR, textStatus, errorThrown){ 
		var user = this;
		BW.hideLoadingDialog();
		alert( "Unable to login with the passed credentials" ); 
		user.isLoggedIn = false;
		user.accessToken = null;
		$( "#login-submit-button" ).prop( "disabled", false );
		$( document ).trigger( "BW.loginStatus:changed", [user] );
	});	
};

/**
 * Logout from BW server
 */
BW.User.prototype.logout = function() {
	this.isLoggedIn = false;
	this.accessToken = null;
	this.userInfo = null;
	localStorage.removeItem( this.accessTokenLocalStorageVariableName );
	$( "#header-avatar" ).attr( "src", "" );
	$( document ).trigger( "BW.loginStatus:changed", [this] );
};

/**
 * Load the user profile information.
 * @param {object} userInfo json object containing user information to be displayed.
 */
BW.User.prototype.loadProfile = function() {
	var userInfo = this.userInfo;
	var html = "";
	var avatarLink = BW.sitePrefix + this.userInfo.avatar;
	html += "<img style='vertical-align:middle;' height='25px' src='" + avatarLink + "'/>Welcome " + userInfo.name;
	$( "#profile-content" ).empty().html( html );
	//this.loadPublishedProblems();
};

BW.User.prototype.loadPublishedProblems = function() {
	var publishedItemsName = "BW::" + BW.currentUser.getUsername() + "_publishedProblems";
	var publishedProblems = localStorage.getItem( publishedItemsName );	
	if ( !publishedProblems ) publishedProblems = [];
	else publishedProblems = JSON.parse( publishedProblems );
	var html = "";
	if ( publishedProblems.length <= 0 ) {
		html += "<h4>You have not published any problems. Live a lttle. Publish some bidding and lead problems.</h4>";	
	}
	else {
		html += "<ul data-role='listview' data-inset='false'>";
		_.each( publishedProblems, function( problem ) {
			var deal = new Bridge.Deal();
			deal.fromJSON( problem.deal );
			var type = problem.type;
			var hand = deal.getHand( problem.handDirection );
			var icon = ( type === "bidding" ? "img/Box-Red.png" : "img/cardback.png" );	
			html += "<li><a role='page' data-page='view.html' data-problem=''>";
			html += "<img src='" + icon + "' alt='" + type + "' class='ui-li-icon'>"
			html += "<div>" + hand.toHTML( { registerChangeHandler: false } ) + "</div>";
			var spanClass = "bw-published-problem-information";
			var secondLine = "<span class='" + spanClass + "'>" + BW.scoringTypes[ deal.get( "scoring" ) ] + "</span>, <span class='" + spanClass + "'>" + " Dealer: " + Bridge.directions[ deal.get( "dealer" ) ].name + "</span>, <span class='" + spanClass + "'>" + " Vul: " + Bridge.vulnerabilities[ deal.get( "vulnerability" ) ].name + "</span>";	
			html += "<div>" + secondLine + "</div></a></li>";					
		}, this );			
		html += "</ul>";
	}		
	$( "#bw-published-problems" ).empty().append( html );
};

