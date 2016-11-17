/*
 * License Text.
 * Authors: Sriram Narasimhan
 */

/** Define a BridgeWinners namespace */
if ( typeof BW === "undefined" ) BW = {};

/**
 * The initialize function. Called only once when the app starts.
 */
BW.initialize = function() {
  // In order to respect data-enhance=false attributes
	$.mobile.ignoreContentEnabled = true;

  //BW.loadPage( "login.html" );
  if ( navigator && navigator.splashscreen ) {
    navigator.splashscreen.hide();
  }

  BW.sitePrefix = "https://52.4.5.8";
  //BW.sitePrefix = "https://127.0.0.1:8000";
  BW.showLoadingDialog("Test");
  //localStorage.removeItem( "BW.accessToken" );
  BW.setupClickHandlers();
  BW.loadUser();
};

/**
 * Utility function to check if running in a browser as oppose to mobile app.
 */
BW.isCordovaApp = function() {
	return ( window.cordova || window.PhoneGap );
};

// Checking for cordova and jQM has to go after BW.initialize because they will call it
// Wait for cordova
var cordovaReady = $.Deferred();
document.addEventListener( "deviceready", cordovaReady.resolve, false );

// Wait for jQueryMobile
var jQueryMobileReady = $.Deferred();
$( document ).bind( "pagecreate", jQueryMobileReady.resolve );

// Both events have fired.
// Added a hack to check if running in browser and not mobile app
// This hack is to allow testing on browser where deviceready event will not fire
if ( BW.isCordovaApp() ) {
	$.when( cordovaReady, jQueryMobileReady ).then( BW.initialize );
}
else {
  $.when( jQueryMobileReady ).then( BW.initialize );
}

/**
 * Load last user.
 */
BW.loadUser = function() {
  BW.accessToken = localStorage.getItem("BW.accessToken");
  if (!BW.accessToken) {
    BW.loadPage("login.html");
  }
  else {
    return BW.authenticateAccessToken();
  }
}

/**
 * Authenticate the access token with the BW server
 */
BW.authenticateAccessToken = function() {
	// Connect to BW server to check if access token is still ok
	var parameters = {
		urlSuffix: "get-profile/",
		loadingMessage: "Authenticating Access",
		method: "GET",
		context: this,
		data: {},
		successCallback: BW.authenticationSuccessCallback,
		failCallback: BW.authenticationFailCallback
	};
	BW.ajax( parameters );
	return false;
};

/**
 * Load user info into account page.
 */
BW.loadAccount = function() {
  $("[data-role='section']").hide();
  $("#name").empty().append(BW.userInfo.name);
  $("#avatar").css("background-image", "url(" + BW.sitePrefix + BW.userInfo.avatar + ")");
  $("[data-role='section'][data-name='account-main-page']").show();
};

/**
 * Authentication Ajax sucess call back
 */
BW.authenticationSuccessCallback = function( data ) {
  BW.userInfo = data;
  BW.loadFooter();
  BW.loadPage("account.html", BW.loadAccount);
  $("#mypage").removeClass("background").addClass("no-background");
};

/**
 * Authentication Ajax fail call back
 */
BW.authenticationFailCallback = function( message ) {
  BW.loadPage("error.html")
	BW.showErrorDialog(message);
};

/**
 * Get a page html using a get request and load into body of document.
 * TODO: cache loaded pages and serve from cache when requested again.
 */
BW.loadPage = function( pageName, callback ) {
  $.get( pageName, function( html ) {
    $("#content").empty().append(html);
    if (pageName == "account.html") {
      BW.setActiveTab("account");
    }
    if (callback) {
      callback();
    }
    BW.hideLoadingDialog();
    return html;
  });
};

/**
 * Load the footer.
 */
BW.loadFooter = function() {
  $.get( "footer.html", function( html ) {
    $("#mypage").append(html);
    $("#mypage").trigger("create");
    return html;
  });
};

/**
 * Remove the footer.
 */
BW.removeFooter = function() {
  $("#myfooter").remove();
};

/**
 * Try to login to BW server.
 * @param {string} username the username to use to login
 * @param {string} password the password to use to login
 */
BW.login = function( username, password ) {
	var parameters = {
		urlSuffix: "get-auth-token/",
		loadingMessage: "Logging In",
		method: "POST",
		context: BW,
		data: { username: username, password: password },
		includeHeaders: false,
		successCallback: BW.loginSuccessCallback,
		failCallback: BW.loginFailCallback
	};
	BW.ajax( parameters );
	return false;
};

/**
 * Logout from bridgewinner server.
 */
BW.logout = function() {
  BW.accessToken = null;
  localStorage.removeItem( "BW.accessToken");
  BW.removeFooter();
  BW.loadPage("login.html");
  return false;
}

/**
 * Login Ajax done call back
 */
BW.loginSuccessCallback = function( data ) {
	BW.accessToken = data[ "token" ];
	localStorage.setItem( "BW.accessToken", BW.accessToken );
  return BW.authenticateAccessToken();
};

/**
 * Login Ajax fail call back
 */
BW.loginFailCallback = function( message ) {
  BW.accessToken = null;
  localStorage.removeItem( "BW.accessToken" );
  BW.showErrorDialog(message);
};

BW.setupClickHandlers = function() {
  $( document ).on( "tap", "#login-submit-button", { user: this }, function( e ) {
    return BW.login($( "#username" ).val(), $( "#password" ).val());
	});
  $( document ).on( "tap", "#logout-submit-button" , { user: this }, function( e ) {
		return BW.logout();
	});
  // Menu item change
  $(document).on("tap", ".footer-wrapper-cell", function(e) {
    BW.setActiveTab($(this).data("item"));
  });
  // Section change
  $(document).on("tap", "[data-role='section-change']", function(e) {
    $("[data-role='section']").hide();
    var section = $(this).data("section");
    $("[data-role='section'][data-name='" + section + "']").show();
  });
};

/**
 * Set active tab.
 */
BW.setActiveTab = function(tabName) {
  $(".footer-cell").removeClass("selected").addClass("not-selected");
  $(".footer-cell." + tabName + "-icon").removeClass("not-selected").addClass("selected");
  $(".footer-wrapper-cell").removeClass("selected").addClass("not-selected");
  $(".footer-wrapper-cell." + tabName + "-icon").removeClass("not-selected").addClass("selected");
  $(".footer-wrapper-cell").removeClass("not-clickable").addClass("clickable");
  $(".footer-wrapper-cell." + tabName + "-icon").removeClass("clickable").addClass("not-clickable");
  $(".footer-wrapper-icon").removeClass("selected").addClass("not-selected");
  $(".footer-wrapper-icon." + tabName + "-icon").removeClass("not-selected").addClass("selected");
};

/**
 * Perform an Ajax request.
 */
BW.ajax = function( parameters ) {
	var url = encodeURI( BW.sitePrefix + "/rest-api/v1/" + parameters.urlSuffix );
	var showDialog = !parameters.hasOwnProperty( "showDialog" ) || parameters.showDialog;
	if ( showDialog ) {
		BW.showLoadingDialog( parameters.loadingMessage );
	}
	if ( parameters.hasOwnProperty( "includeHeaders" ) && !parameters.includeHeaders ) {
		var headers = {};
	}
	else {
		var headers = { 'Authorization': 'Token ' + BW.accessToken };
	}
	var request = $.ajax({
		method: parameters.method,
		context: parameters.context,
		url: url,
		data: parameters.data,
		headers: headers,
    timeout: 5000
	});
	request.done( function( data ) {
		if ( showDialog ) BW.hideLoadingDialog();
		if ( data.hasOwnProperty( "error" ) && data.error ) {
			parameters.failCallback( data.message );
		}
		else {
			parameters.successCallback( data );
		}
	});
	request.fail( function( jqXHR, textStatus, errorThrown ) {
		if ( showDialog ) BW.hideLoadingDialog();
    errorMessage = "Error - " + textStatus + ": " + errorThrown;
    parameters.failCallback( errorMessage );
	});
	return false;
};

/**
 * Show a popup overlay loading dialog while perfoming ajax request.
 */
BW.showLoadingDialog = function( text ) {
	$( "#loading-popup-content" ).empty().append( text );
	$( "#loading-popup" ).popup( "open" );
};

/**
 * Show a popup overlay error dialog after an error.
 */
BW.showErrorDialog = function( text ) {
	$( "#error-popup-content" ).empty().append( text );
	$( "#error-popup" ).popup( "open" );
};

/**
 * Hide the popup overlay loading dialog
 */
BW.hideLoadingDialog = function() {
	$( "#loading-popup" ).popup( "close" );
};
