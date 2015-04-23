/*
 * License Text.
 * Authors: Sriram Narasimhan
 */
 
/** Define a BridgeWinners namespace */
var BW = {};

/**
 * The initialize function. Called only once when the app starts.
 */
BW.initialize = function() {
	
	// In order to respect data-enhanced=false attributes
	$.mobile.ignoreContentEnabled = true;
	
	// The currently loaded deal
	BW.deal = null;
	
	// The status of user
	BW.loggedIn = false;

	// The id of the main content
	BW.contentID = "mycontent";	
	
	// Assume that north is hand shown. It should not matter (famous last words)
	BW.handDirection = 'n';
	
	// Was the last state a ui dialog
	BW.isUIStateDialog = false;
	
	// Has the login status changed
	BW.loginStatusChanged = false;
	
	// What is the problem type
	BW.problemType = null;
	
	// A cache to store loaded html files
	BW.pageCache = {};
	
	// Most things are handled by hash change so add hash change handler
	$( window ).hashchange( BW.hashChangeHandler );
	
	// Trigger the hash change for the current page (first page)
	$( window ).hashchange();
	
	// Handler for saving the deal
	$( document ).on( "deal:changed", function( e ) {
		BW.saveDeal( BW.deal );
		BW.updatePublishButtonStatus( BW.deal );
	});
	
	// Setup login and logout submit button handler
	$( "#login-submit-button").click( BW.login );
	$( "#logout-submit-button").click( BW.logout );
	BW.updateLoginStatus();
	// Handler for login status change
	$( document ).on( "loginStatus:changed", BW.updateLoginStatus );
	
	// All the options
	var options = localStorage.getItem( "options" );
	BW.options = ( options ? JSON.parse( options ) : {} );
	_.defaults( BW.options, {
		"theme" : "css/themes/default/jquery.mobile-1.4.5.min.css",
		"collapsible" : false,
		"enableDebug": false
	});
	BW.options.enableDebug = true;
	BW.loadOptions( BW.options );
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
 * Load the options
 * @param {object} options - the set of options
 * @param {string} [option] - optional specific option to load
 */
BW.loadOptions = function( options, option ) {
	
	// Check if a specific option has been specified
	if ( typeof option !== "undefined" ) {
		var derivedOptions = {};
		derivedOptions[ option ] = options[ option ];
	}
	else {
		var derivedOptions = options;
	}
	
	// Process the options
	for( var option in derivedOptions ) {
		switch ( option ) {
			case "theme" :
				// Load the stylesheet
				$( "#jqm-stylesheet" ).attr( "href", BW.options.theme );		
				break;
			case "collapsible" :
				var value = derivedOptions[ option ];
				break;
			default :
				break;
		}
	}
	
};


/**
 * Set the options
 * @param {object} options - the set of options
 */
BW.setOptions = function( options ) {
	$( "#theme" ).val( options.theme );
	$( "#make-card-deck-collapsible" ).prop( "checked", options.collapsible );
};

/**
 * Save the options to local storage
 * @param {object} options - the set of options
 */
BW.saveOptions = function( options ) {
	localStorage.setItem( "options", JSON.stringify( options ) );
};

/**
 * An utility function to determine if page should be recreated/redrawn
 * @param {boolean} isDialog - is the current page a dialog
 * @param {boolean} isLastDialog - was the last page a dialog
 */
BW.recreatePage = function( isDialog, isLastDialog ) {
	if ( isDialog ) return false;
	if ( isLastDialog && !BW.loginStatusChanged ) return false;
	return true;
};

/**
 * The hash change handler.
 * Dispatches to appropriate handler based on action and passes the hash parameters
 */
BW.hashChangeHandler = function() {
	// Parse the hash parameters
	var parameters = Bridge.getHash();
	_.defaults( parameters, { action: "load", page: "home.html" } );
	var action = parameters.action;
	var uiState = parameters[ "ui-state" ];
	if ( uiState && uiState === "dialog" ) isDialog = true;
	else isDialog = false;
	var recreatePage = BW.recreatePage( isDialog, BW.isUIStateDialog );
	BW.isUIStateDialog = isDialog;
	if ( !recreatePage ) return;
	BW.loginStatusChanged = false;
	switch ( action ) {
		case "load" :
		case "create" :
			var page = parameters.page;
			$.mobile.loading( "show" );
			if ( _.has( BW.pageCache, page ) ) {
				$( '#' + BW.contentID ).empty().append( BW.pageCache[ page ] );
				BW.pageLoaded( parameters );
				$.mobile.loading( "hide" );
			}
			else {
				$.get( page, function( html ) {
					BW.pageCache[ page ] = html;
					$( '#' + BW.contentID ).empty().append( BW.pageCache[ page ] );
					BW.pageLoaded( parameters );
					$.mobile.loading( "hide" );
				});
			}
			break;
		default :
			alert( "Unknown action : " + action );
	}
};

/**
 * Handler for option changes.
 */
BW.optionChanged = function() {
	var name = $( this ).attr( "name" );
	var type = $( this ).attr( "type" )
	if ( type === "checkbox" ) {
		var value = $( this ).prop( "checked" );
	}
	else {
		var value = $( this ).val();
	}
	BW.options[ name ] = value;
	BW.saveOptions( BW.options );
	BW.loadOptions( BW.options, name );
};

/**
 * Actions after page is loaded.
 * Here we can add event handlers etc that are page dependent.
 */
BW.pageLoaded = function( parameters ) {
	if ( parameters.page === "options.html" ) {
		BW.setOptions( BW.options );
		$( "#index" ).trigger( "create" );
		$( ".options" ).change( BW.optionChanged );
	}
	else if ( parameters.page === "create.html" ) {
		BW.problemType = parameters.problem;
		$( '#problem-title' ).html( "Create a " + BW.problemType + " problem" );
		BW.loadDeal();
		// Since we are loading the page we have to activate components
		$( "#index" ).trigger( "create" );		
	}
	else {
		$( "#index" ).trigger( "create" );
	}
};


/**
 * Load a deal based on saved information
 */
BW.loadDeal = function() {
	// Get the saved information from local storage
	var dealString = localStorage.getItem( "deal" );
	if ( BW.options.enableDebug ) console.log( "Deal String is " + dealString );
	if ( !dealString ) dealString = "{}";
	dealJSON = JSON.parse( dealString );
	if ( !_.has( dealJSON, "version" ) || dealJSON.version !== "1.0" ) dealJSON = {};
	
	// Load the deal
	BW.deal = new Bridge.Deal();
	BW.deal.fromJSON( dealJSON );
	
	if ( BW.options.enableDebug ) console.log( "Loaded deal is " + BW.deal.toString() );
	
	// Setup all the controls
	BW.setupDealInfo( BW.deal );
	BW.setupHandAndCardDeck( BW.deal, BW.handDirection );
	BW.setupAuctionAndBiddingBox( BW.deal );
	
	// Click for opening card deck 
	$( "#hand" ).click( function() {
		$( "#select-cards" ).popup( "open", { transition: "flow" } );
	});
	
	// Click to open bidding box
	$( "#auction" ).click( function() {
		$( "#select-auction" ).popup( "open", { transition: "flow" } );
	});		
	
	// Set the publish button status	
	BW.updatePublishButtonStatus( BW.deal );	
};

/**
 * Load values for scoring, dealer, vul and notes from loaded deal
 * Additionally add a handler callback for when a value is changed
 * @param {object} deal - the deal to get values from
 */
BW.setupDealInfo = function( deal ) {
	// Populate fields and controls
	var fields = [ "scoring", "dealer", "vulnerability", "notes" ];
	for( var i = 0; i < fields.length; ++i ) {
		var field = fields[i];
		$( '#' + field ).val( BW.deal.get( field ) );
	}
	
	// Handler for change
	$( ".deal-info" ).change( function() {
		var field = $( this ).attr( "field" );
		var value = $( this ).val();
		// This is for notes
		if ( value === null ) value = '';
		deal.set( field, value );		
	});		
};

/**
 * Setup hand and card-deck to manage specification of hand.
 * @param {object} deal - instance of Deal class that contains the hand
 */
BW.setupHandAndCardDeck = function( deal ) {
	// Hand shown in main page and also repeated on card deck page for convenience
	var hand = deal.getHand( BW.handDirection );
	hand.toHTML( { containerID: "hand", show: { countInContent: true }, idPrefix: "h", registerChangeHandler: true } );
	hand.toHTML( { containerID: "hand-summary", show: { countInContent: true }, idPrefix: "hs", registerChangeHandler: true } );

	// Card Deck
	deal.toCardDeck( { containerID: "card-deck", idPrefix: "cd", show: { text:false, title: false, activeHand: false, assignedTo: false }, classes: { "card-deck": ["images"] } } );
};

/**
 *Setup auction and bidding box to manage specification of auction.
 * @param {object} deal - instance of Deal class that contains the auction
 */
BW.setupAuctionAndBiddingBox = function( deal ) {
	// Get the auction
	var auction = deal.getAuction();
	auction.toBBODiagram( { containerID: "auction", idPrefix: "a", registerChangeHandler: true } );
	auction.toBBODiagram( { containerID: "auction-summary", idPrefix: "as", registerChangeHandler: true } );
	
	// Setup bidding box
	auction.toBiddingBox( { layout: "full", containerID: "bidding-box", idPrefix: "bb", classes: { "bidding-box": ["bbo"] }, registerChangeHandler: true } );
};


/**
 * An utility to update the text and status of a button.
 * @param {string} id - the id of button being updated
 * @param {string} text - the text/html for the button
 * @param {boolean} disabled - whether the button is disabled or enabled
 */
BW.updateButton = function( id, text, disabled ) {
	$( '#' + id ).prop( "disabled", disabled ).html( text );
}

/**
 * Handle login button click
 */
BW.login = function( event ) {
	
	var username = $( "#username" ).val();
	var password = $( "#password" ).val();
	if ( username !== "bridge" || password !== "winners" ) {
		alert( "Invalid credentials" );
	}
	else {
		BW.loggedIn = true;
		$( "#login-dialog" ).popup( "close" );
		$( document ).trigger( "loginStatus:changed",  [ BW.loggedIn ]);
	}
	event.preventDefault();
	event.stopPropagation();
	return false;	
};

/**
 * Handle login button click
 */
BW.logout = function( event ) {
	BW.loggedIn = false;
	$( "#logout-dialog" ).popup( "close" );
	$( document ).trigger( "loginStatus:changed",  [ BW.loggedIn ]);
	event.preventDefault();
	event.stopPropagation();
	return false;	
};

/**
 * Set the login and logout button and dialog
 */
BW.updateLoginStatus = function() {
	var text = BW.loggedIn ? "Profile" : "Login";
	var addClass = BW.loggedIn ? "ui-icon-user" : "ui-icon-power";
	var removeClass = BW.loggedIn ? "ui-icon-power" : "ui-icon-user";
	var href = BW.loggedIn ? "#logout-dialog" : "#login-dialog";
	$( "#login-button" ).attr( "href", href ).addClass( addClass ).removeClass( removeClass ).html( text );
	BW.updatePublishButtonStatus( BW.deal );
};

/**
 * Information in deal has changed.
 * Save to local storage and update all controls
 * @param {object} deal - the deal that has all the information
 */
BW.saveDeal = function( deal ) {
	localStorage.setItem( "deal", JSON.stringify( deal.toJSON() ) );
};

/**
 * Enable or Disable the Publish button based on status of hand, auction and login.
 * It will also depend on whether this is a bidding or lead problem
 * @param {object} deal - the deal to get values from
 */
BW.updatePublishButtonStatus = function( deal ) {
	if ( !deal ) return;
	var id = "publish-button";
	var count = deal.getHand( BW.handDirection ).getCount();
	if ( count !== 13 ) {
		var disabled = true;
		var text = "Not Enough Cards";
		BW.updateButton( id, text, disabled );
		return;
	}
	var auction = deal.getAuction();
	switch( BW.problemType ) {
		case "bidding" :
			if ( auction.getContract().isComplete ) {
				var disabled = true;
				var text = "Auction is already complete";				
				BW.updateButton( id, text, disabled );
				return;
			}
			break;
		case "lead" :
			if ( !auction.getContract().isComplete ) {
				var disabled = true;
				var text = "Auction is not complete";				
				BW.updateButton( id, text, disabled );
				return;
			}
			break;
		default :
			var disabled = true;
			var text = "Unknown Problem Type";				
			BW.updateButton( id, text, disabled );
			return;		
	}
	if ( !BW.loggedIn ) {
		var disabled = true;
		var text = "Not Logged In";	
		BW.updateButton( id, text, disabled );
		return;	
	}
	BW.updateButton( id, "Publish", false );
};

