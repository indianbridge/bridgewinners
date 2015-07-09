/*
 * License Text.
 * Authors: Sriram Narasimhan
 */
 
/** Define a BridgeWinners namespace */
if ( typeof BW === "undefined" ) BW = {};

BW.androidSwipeFix = function() {
	// Touchmove events are cancelled on Android KitKat when scrolling is possible on the touched element.  
	// Scrolling is always vertical in our app. Cancel the event when a touchmove is horizontal,  
	// so that all following touchmove events will be raised normally.  
	var startLoc = null;  
	$( "body" ).on( "touchstart", function( e ) {  
	  if( e.originalEvent.touches.length == 1 ) { // one finger touch  
		// Remember start location.  
		var touch = e.originalEvent.touches[ 0 ];  
		startLoc = { x : touch.pageX, y : touch.pageY };  
	  }  
	} );  
	  
	  
	$( "body" ).on( "touchmove", function( e ) {  
	  // Only check first move after the touchstart.  
	  if( startLoc ) {  
		var touch = e.originalEvent.touches[ 0 ];  
		// Check if the horizontal movement is bigger than the vertical movement.  
		if( Math.abs( startLoc.x - touch.pageX ) >  
		  Math.abs( startLoc.y - touch.pageY ) ) {  
		  // Prevent default, like scrolling.  
		  e.preventDefault();  
		}  
		startLoc = null;  
	  }  
	} );  	
};

BW.scoringTypes = {
	"KO": "IMPs (Knockout)",
	"Matchpoints": "Matchpoints",
	"20VP": "IMPs (20 Victory Point Scale)",
	"30VP": "IMPs (30 Victory Point Scale)",
	"WL": "IMPs (Win/Loss Swiss)",
	"CrossImps": "Cross-Imps",
	"BAM": "Board-a-Match",
	"TP": "Total Points",
	"Money": "Money",
	"Any": "Any"
};

BW.colorPalette = [ "#5158AB", "#41AE32", "#E74224", "#E73390", "#2F8E9A", "#D056F2", "#855D1B",
"#3A7140", "#AD4346", "#C277AF", "#E07B39", "#A89829", "#436790", "#2D9B80", "#D446B7", "#E06A84",
"#B97AD8", "#697224", "#756CE2", "#9487C2", "#A53381", "#589FCE", "#4DA65F", "#7CA637", "#7D5780",
"#E5494C", "#D93366", "#6088E1", "#864A9D", "#DC765A", "#3D7A21", "#995231", "#9F4361", "#C5872E",
"#E267AB", "#AC4B14", "#E43AD6", "#B359D7", "#B53625", "#E9721E"];

/**
 * The initialize function. Called only once when the app starts.
 */
BW.initialize = function() {
	
	if ( navigator && navigator.splashscreen ) navigator.splashscreen.hide();
	
	// In order to respect data-enhanced=false attributes
	$.mobile.ignoreContentEnabled = true;
	$.mobile.buttonMarkup.hoverDelay = 0;
	$.mobile.hoverDelay = 0;
	$.mobile.pushStateEnabled = false;
	
	BW.androidSwipeFix();
	
	// enable fast click
	var attachFastClick = Origami.fastclick;
	attachFastClick(document.body);
	
	// Was the last state a ui dialog
	BW.isUIStateDialog = false;	

	// The id of the main content
	BW.contentID = "mycontent";	
	
	// Assume that north is hand shown. It should not matter (famous last words)
	BW.handDirection = 's';
	
	// A cache to store loaded html files
	BW.pageCache = {};		
	
	// The address of the BW server
	BW.sitePrefix = "http://108.166.89.84/";
	
	// Manage active tab
	BW.lastNavbarItem = "vote";
	$( "#popupMenu" ).popup( {
		afterclose: function( event, ui ) {
			BW.setNavbarActiveItem( BW.lastNavbarItem );
		}
	});
	
	// Load the different pages from menu
	$( "body" ).on( "click", "a[role='page'], img[role='page']", function() {
		var page = $( this ).data("page");
		var parameterNames = [ "slug" ];
		parameters = {};
		for( var i = 0; i < parameterNames.length; ++i ) {
			var parameterValue = $( this ).data( parameterNames[i] );
			if ( parameterValue ) parameters[ parameterNames[i] ] = parameterValue;
		}
		BW.loadPage( page, parameters );
	});
	
	// Load the current user
	BW.currentUser = new BW.User( BW.contentID );
	
	// Load the options
	BW.currentOptions = new BW.Options();
	
	// Setup voting problem class
	BW.votingProblem = new BW.VotingProblem( "bw-voting-problem" );
	
	// Setup view problem class
	BW.viewProblem = new BW.VotingProblem( "bw-view-problem" );
	
	// Setup create problem class
	BW.createProblem = new BW.CreateProblem( "bw-create-problem" );	
	
	// Trigger login status change so that appropriate start page can be loaded
	$( document ).trigger( "BW.loginStatus:changed", [BW.currentUser] );
};

/**
 * Utility function to check if running in a browser as oppose to mobile app.
 */
BW.isBrowser = function() {
	return !( window.cordova || window.PhoneGap );
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
// This hack is allow testing on browser where deviceready event will not fire
if ( BW.isBrowser() ) {
	$.when( jQueryMobileReady ).then( BW.initialize );
}
else {
	$.when( cordovaReady, jQueryMobileReady ).then( BW.initialize );
}

/**
 * Show a popup overlay loading dialog while perfoming ajax request.
 */
BW.showLoadingDialog = function( text ) {
	$( "#loading-popup-content" ).empty().append( text );
	$( "#loading-popup" ).popup( "open" );
};

/**
 * Hide the popup overlay loading dialog
 */
BW.hideLoadingDialog = function() {
	$( "#loading-popup" ).popup( "close" );
};

/**
 * Perform an Ajax request.
 */
BW.ajax = function( parameters ) {
	var url = encodeURI( BW.sitePrefix + parameters.urlSuffix );
	var showDialog = !parameters.hasOwnProperty( "showDialog" ) || parameters.showDialog;
	if ( showDialog ) {
		BW.showLoadingDialog( parameters.loadingMessage );
	}
	if ( parameters.hasOwnProperty( "includeHeaders" ) && !parameters.includeHeaders ) {
		var headers = {};
	}
	else {
		var headers = { 'Authorization': 'Token ' + BW.currentUser.getAccessToken() };
	}
	var request = $.ajax({
		method: parameters.method,
		context: parameters.context,
		url: url,
		data: parameters.data,
		headers: headers
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
		var message = "Unable to connect to BW Server";
		parameters.failCallback( message );
	});	
	return false;
};

/**
 * The hash change handler.
 * Dispatches to appropriate handler based on action and passes the hash parameters
 */
BW.loadPage = function( page, parameters ) {	
	$( "#bw-voting-problem-recent" ).hide();
	$( "#popupMenu" ).popup( "close" );
	BW.showLoadingDialog( "Loading Page" );
	if ( BW.currentUser.isLoggedIn ) {
		$( "a[role='page']" ).removeClass( "ui-disabled" );
		var pages = [ "vote.html", "options.html", "create.html", "view.html", "profile.html", "more.html", "about.html" ];
		if ( !_.indexOf( pages, page ) === -1 ) {
			BW.hideLoadingDialog();
			alert( "Unknown page : " + page );
			return;
		}
		if ( page === "more.html" ) {
			BW.hideLoadingDialog();
			$( "#popupMenu" ).popup( "open", { positionTo: "#more-tab" } );
		}
		else {
			if ( _.has( BW.pageCache, page ) ) {
				$( '#' + BW.contentID ).empty().append( BW.pageCache[ page ] );
				BW.hideLoadingDialog();
				BW.pageLoaded( page, parameters );
			}
			else {
				$.get( page, function( html ) {
					BW.pageCache[ page ] = html;
					$( '#' + BW.contentID ).empty().append( BW.pageCache[ page ] );
					BW.hideLoadingDialog();
					BW.pageLoaded( page, parameters );
				});
			}	
		}		
	}
	else {
		$( "a[role='page']" ).addClass( "ui-disabled" );
		BW.hideLoadingDialog();
		BW.currentUser.showLoginForm();
	}
};

/**
 * Actions after page is loaded.
 * @param {object} parameters the associative array of hash parameters
 */
BW.pageLoaded = function( page, parameters ) {
	if ( page === "options.html" ) {
		BW.currentOptions.initializeAll();
		$( ".bw-options" ).change( function() {
			var name = $( this ).attr( "name" );
			var type = $( this ).attr( "type" )
			if ( type === "checkbox" ) {
				var value = $( this ).prop( "checked" );
			}
			else {
				var value = $( this ).val();
			}
			BW.currentOptions.change( name, value );		
		});
		BW.setNavbarActiveItem( "more" );
	}
	else if ( page === "vote.html" ) {
		BW.setNavbarActiveItem( "vote" );
		BW.votingProblem.initialize();
	}
	else if ( page === "create.html" ) {
		BW.setNavbarActiveItem( "create" );
		BW.createProblem.initialize();
	}
	else if ( page === "profile.html" ) {
		BW.setNavbarActiveItem( "profile" );
		BW.currentUser.loadProfile();
	}
	else if ( page === "view.html" ) {
		BW.setNavbarActiveItem( "view" );
		if ( parameters.hasOwnProperty( "slug" ) ) {
			var slug = parameters[ "slug" ];
			BW.viewProblem.initialize( slug );
		}
		else {
			BW.viewProblem.showList();
		}
	}
	else if ( page === "about.html" ) {
		BW.setNavbarActiveItem( "more" );
	}	
	else {
		alert( "Unknown page : " + page );
		return;
	}
	$( '#' + BW.contentID ).trigger( "create" );
};

/**
 * Set the active navbar item
 */
BW.setNavbarActiveItem = function( itemName ) {
	BW.lastNavbarItem = itemName;
	$( "[data-type='navbar-item']" ).each( function( index, element ) {
		var name = $( this ).data( "name" );
		if ( name === itemName ) $( this ).addClass( "ui-btn-active" );
		else $( this ).removeClass( "ui-btn-active" );
	});
};










