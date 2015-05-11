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

BW.users = {
	"bridge winners" : {
		name: "Bridge Winners",
		image: "http://media.bridgewinners.com/images/icons/banner_logo_cropped.png"
	},
	"gavin wolpert" : {
		name: "Gavin Wolpert",
		image: "http://media.bridgewinners.com/cache/b5/a5/b5a537ff5d712573d506aa9501356caa.png"
	}
};

BW.votingProblems = [
	{
		number: 5816,
		type: "bidding",
		name: "Greg Humphreys",
		image: "http://media.bridgewinners.com/cache/47/a8/47a8a90973610fdf86881ccacdbe3cd1.png",
		direction: 's',
		deal: {
			dealer: 'n',
			vulnerability: 'e',
			scoring: "20VP",
			hands : {
				s: {
					direction:"s",
					name:"South",
					hand:"sKJT32hJ32dKcAKQJ"
				}				
			},
			auction: "p2dp2sp3dp",
			notes: "Pd is very sound in 2nd seat red."
		}
	},
	{
		number: 48,
		type: "lead",
		name: "Gavin Wolpert",
		image: "http://media.bridgewinners.com/cache/b5/a5/b5a537ff5d712573d506aa9501356caa.png",
		direction: 's',
		deal: {
			dealer: 's',
			vulnerability: 'b',
			scoring: "KO",
			hands : {
				s: {
					direction:"s",
					name:"South",
					hand:"sq32haq432ckj32d2"
				}				
			},
			auction: "1hx2h3d3hxp4dp5dppp",
			notes: "Your opponents in the District 9 GNT Qualifier are Meckwell, Meck is West, Rodwell is East.<br/>2♥ showed less than a constructive raise... the second double by Meck was just values takeout (kind of asking for a heart stopper).<br/>I'd love comments on your best guess of dummy's hand."
		}
	}	
];


BW.recentProblem = {};

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

/**
 * The initialize function. Called only once when the app starts.
 */
BW.initialize = function() {
	
	if ( navigator && navigator.splashscreen ) navigator.splashscreen.hide();
	
	// In order to respect data-enhanced=false attributes
	$.mobile.ignoreContentEnabled = true;
	$.mobile.buttonMarkup.hoverDelay = 0;
	$.mobile.hoverDelay = 0;
	
	BW.androidSwipeFix();
	
	// Hack to always have 2 voting problems.
	//var problems = localStorage.getItem( "BW::votingproblems" );
	//if ( !problems ) localStorage.setItem( "BW::votingproblems", JSON.stringify( BW.votingProblems ) );
	"BW::bridge_votingProblems"
	localStorage.setItem( "BW::gavin_votingProblems", JSON.stringify( BW.votingProblems ) );
	localStorage.setItem( "BW::bridge_votingProblems", JSON.stringify( BW.votingProblems ) );
	localStorage.removeItem( "BW::bridge_currentVotingProblem" );
	localStorage.removeItem( "BW::gavin_currentVotingProblem" );
	
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
	
	// Load the different pages from menu
	$( "a[role='page']" ).click( function() {
		var page = $( this ).data("page");
		if ( BW.currentUser.isLoggedIn ) BW.loadPage( page );
	});
	
	// Load the current user
	BW.currentUser = new BW.User( BW.contentID );
	BW.currentUser.initialize();
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
 * The hash change handler.
 * Dispatches to appropriate handler based on action and passes the hash parameters
 */
BW.loadPage = function( page ) {	
	$.mobile.loading( "show" );
	$( "#bw-voting-problem-recent" ).hide();
	var pages = [ "vote.html", "options.html", "create.html", "profile.html", "about.html" ];
	if ( !_.indexOf( pages, page ) === -1 ) {
		alert( "Unknown page : " + page );
		return;
	}
	if ( _.has( BW.pageCache, page ) ) {
		$( '#' + BW.contentID ).empty().append( BW.pageCache[ page ] );
		BW.pageLoaded( page );
		$.mobile.loading( "hide" );
	}
	else {
		$.get( page, function( html ) {
			BW.pageCache[ page ] = html;
			$( '#' + BW.contentID ).empty().append( BW.pageCache[ page ] );
			BW.pageLoaded( page );
			$.mobile.loading( "hide" );
		});
	}	
};

/**
 * Actions after page is loaded.
 * @param {object} parameters the associative array of hash parameters
 */
BW.pageLoaded = function( page ) {
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
	}
	else if ( page === "vote.html" ) {
		BW.votingProblem.initialize();
	}
	else if ( page === "create.html" ) {
		BW.createProblem.initialize();
	}
	else if ( page === "profile.html" ) {
		BW.currentUser.loadProfile();
	}
	else if ( page === "about.html" ) {
	}
	else {
		alert( "Unknown page : " + page );
		return;
	}
	$( '#' + BW.contentID ).trigger( "create" );
};










