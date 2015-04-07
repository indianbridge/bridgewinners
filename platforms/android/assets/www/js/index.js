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
	// The currently loaded deal
	BW.deal = null;
	
	// The status of user
	BW.loggedIn = false;

	// The id of the main content
	BW.contentID = "mycontent";	
	
	// Assume that north is hand shown. It should not matter (famous last words)
	BW.handDirection = 'n';
	
	// The auction name. Can use anything (see previous comment)
	BW.auctionName = "Default";
	
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
	
	// Setup login and logout submit button handler
	$( "#login-submit-button").click( BW.login );
	$( "#logout-submit-button").click( BW.logout );
	BW.updateLoginStatus();
	// This is created in loadOptions
	//BW.createCardDeck();
	BW.createBiddingBox();
	
	// All the options
	var options = localStorage.getItem( "options" );
	BW.options = ( options ? JSON.parse( options ) : {} );
	_.defaults( BW.options, {
		"theme" : "css/themes/default/jquery.mobile-1.4.5.min.css",
		"collapsible" : false
	});
	BW.loadOptions( BW.options );
	
	// Enable card and bid clicks
	BW.enableCardAndBidClicks();
};

/**
 * Utility function to check if running in a browser as oppose to mobile app.
 */
BW.isBrowser = function() {
	return !( window.cordova || window.PhoneGap );
	// Older way for just chrome
	/*if (navigator.userAgent.match(/chrome/i)) {	
	}
	else {
	}*/
	
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
	
	if ( typeof option !== "undefined" ) {
		var derivedOptions = {};
		derivedOptions[ option ] = options[ option ];
	}
	else {
		var derivedOptions = options;
	}
	for( var option in derivedOptions ) {
		switch ( option ) {
			case "theme" :
				// Load the stylesheet
				$( "#jqm-stylesheet" ).attr( "href", BW.options.theme );		
				break;
			case "collapsible" :
				var value = derivedOptions[ option ];
				BW.createCardDeck( value );
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
	var parameters = Bridge.readQueryParameters( location.hash, '#' );
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
		// Activate all click/change handlers
		BW.activateDealEventHandlers( BW.deal );		
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
	if ( !dealString ) dealString = "{}";
	dealJSON = JSON.parse( dealString );
	
	// Set default values if not specified
	var auctionName = BW.auctionName // Does not allow to use BW.auctionName directly in object
	_.defaults( dealJSON, {
		"dealer" : 'n',
		"scoring" : "KO",
		"vulnerability" : '-',
		"auction" : { auctionName : "" }
	});
	
	// Load the deal
	BW.deal = new Bridge.Deal();
	BW.deal.fromJSON( dealJSON );
	
	// Update all controls
	BW.updateDealInfo( BW.deal );
	BW.updateHand( BW.deal, BW.handDirection );
	BW.updateAuction( BW.deal, BW.auctionName );	
	BW.updatePublishButtonStatus( BW.deal );	
	
	// Update the card deck. This is done only once since click handler takes of subsequent changes.
	BW.updateCardDeck( BW.deal );
};

/**
 * Update all controls to values from specified deal
 * @param {object} deal - the deal to get values from
 */
BW.updateDealInfo = function( deal ) {
	// Populate fields and controls
	var fields = [ "scoring", "dealer", "vulnerability", "notes" ];
	for( var i = 0; i < fields.length; ++i ) {
		var field = fields[i];
		$( '#' + field ).val( BW.deal.get( field ) );
	}
};

/**
 * Enable or Disable the Publish button based on status of hand, auction and login.
 * It will also depend on whether this is a bidding or lead problem
 * @param {object} deal - the deal to get values from
 */
BW.updatePublishButtonStatus = function( deal ) {
	var id = "publish-button";
	var count = deal.get( 'count', BW.handDirection );
	if ( count !== 13 ) {
		var disabled = true;
		var text = "Not Enough Cards";
		BW.updateButton( id, text, disabled );
		return;
	}
	var auction = deal.getAuction();
	switch( BW.problemType ) {
		case "bidding" :
			if ( auction.contract && auction.contract.isComplete ) {
				var disabled = true;
				var text = "Auction is already complete";				
				BW.updateButton( id, text, disabled );
				return;
			}
			break;
		case "lead" :
			if ( auction.contract && !auction.contract.isComplete ) {
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
 * Load or update hand display in the create problem page.
 * @param {object} deal - instance of Deal class that contains the hand
 */
BW.updateHand = function( deal ) {
	var direction = BW.handDirection;
	var count = deal.get( 'count', direction );
	var countHTML = '<span class="ui-li-count">' + count + '</span>';
	var handHTML = deal.hands[ direction ].toString( true );
	$( "#hand" ).html( handHTML + countHTML );	
	var html = "";
	html += "<button class='ui-btn ui-corner-all'>";
	html += "Hand : " + handHTML + countHTML;
	html += "</button>";
	$( "#hand-summary" ).html( html  );		
};

/**
 * Update card deck based on deal
 * @param {object} deal - the deal to get which cards have been assigned 
 */
BW.updateCardDeck = function( deal ) {
	for( var i = 0; i < Bridge.suitOrder.length; ++i ) {
		var suit = Bridge.suitOrder[i];
		for( var j = 0; j < Bridge.rankOrder.length; ++j ) {
			var rank = Bridge.rankOrder[j];
			var card = suit + rank;
			if ( deal._hasCard( suit, rank, BW.handDirection ) ) {
				var status = "in-hand";
				var src = "img/cards/cb_blue2.png"
			}
			else {
				var status = "in-deck";
				var src = "img/cards/" + card + ".png";
			}
			$( "#card-" + card ).attr( "src", src ).attr( "status", status );
		}
	}

};

/**
 * Setup card deck for adding and removing cards to hand.
 */
BW.createCardDeck = function( collapsible ) {
	if ( typeof collapsible === "undefined" ) collapsible = false;
	var html = "";
	var dataRole = '"';
	html += '<div class="card-deck" id="card-deck-set"';
	if ( collapsible ) html += ' data-role="collapsibleset" ';
	html += '>';
	var open = true;
	for( var i = 0; i < Bridge.suitOrder.length; ++i ) {
		var suit = Bridge.suitOrder[i];
		// By default spades cards are open
		if ( suit === 's' ) open = true;
		else open = false;
		html += BW.createSuitPanel( suit, open, collapsible );
	}
	html += '</div>';
	$( "#card-deck" ).empty().append( html );		
};

/**
 * Enable the click handlers for card deck when generating hand
 * and bidding box when generating auction.
 * This needs to be done only once since we don't recreate the container each time.
 */
BW.enableCardAndBidClicks = function() {
	// Card deck click
	$( "#card-deck" ).on( "click", ".card", function() {
		var deal = BW.deal;
		var status = $( this ).attr( "status" );
		if ( status === "in-deck" ) {
			var card = $( this ).attr( "card" );
			try {
				deal.addCard( card[0], card[1], 'n' );
				$( this ).attr( "src", "img/cards/cb_blue2.png" ).attr( "status", "in-hand" );
				BW.saveDeal( deal );
				BW.updateHand( deal  );
			}
			catch( err ) {
				alert( err.message );
			}
		}
		else {
			var src = "img/cards/" + $( this ).attr( "card" ) + ".png";
			var card = $( this ).attr( "card" );
			$( this ).attr( "src", src ).attr( "status", "in-deck" );
			deal.removeCard( card[0], card[1] ); 
			BW.saveDeal( deal );
			BW.updateHand( deal );
		}
	});
	// Bidding box
	$( "#bidding-box" ).on( "click", ".call", function() {
		var deal = BW.deal;
		var call = $( this ).attr( "call" ).toLowerCase();
		try {
			switch( call ) {
				case "undo" :
					deal.removeCall();
					break;
				case "pass" :
					deal.addCall( 'p' );
					break;
				case "double" :
					deal.addCall( 'x' );
					break;
				case "redouble" :
					deal.addCall( 'r' );
					break;
				case "all pass" :
					var auction = deal.getAuction();
					auction.addAllPass();
					break;
				default:
					deal.addCall( call );
					break;
			}
			BW.saveDeal( deal );
			BW.updateAuction( deal );
		}
		catch( err ) {
			alert( err.message );
		}	
	});			
}; 


/**
 * An utility to setup clickable cards for any one suit
 * @param {string} suit - the suit to setup for
 * @param {object} deal - the deal to get which cards have been assigned
 * @param {boolean} open - whether the collapsible should be open or not
 */
BW.createSuitPanel = function( suit, open, collapsible ) {
	var html = "";
	html += '<div class="card-deck-suit"';
	if ( collapsible ) html += ' data-role="collapsible" '
	html += (open ? ' data-collapsed="false"' : '') + '>';	
    if ( collapsible ) html += '<h2>' + Bridge.suits[ suit ].html + ' Cards</h2>';
    html += '<div>';
    for( var i = 0; i < Bridge.rankOrder.length; ++i ) {
		var rank = Bridge.rankOrder[i];
		var card = suit + rank;
		var status = "in-deck";
		var src = "img/cards/" + card + ".png";
		html += '<img id="card-' + card + '" status="' + status + '" card="' + card + '" class="card" height="50" src="' + src + '"/>';
	}
	html += '</div>';
	html += '</div>	';
	return html;
}; 

/**
 * Load or update auction display in the create problem page.
 * @param {object} deal - instance of Deal class that contains the auction
 */
BW.updateAuction = function( deal ) {
	var auctionName = BW.auctionName;
	// Get the auction
	var auction = deal.getAuction( auctionName );
	if ( !auction ) {
		// For consistency check. Should not happen
		alert( "Auction could not be found" );
	}
	
	// Setup auction as a styled table
	var html = auction.toHTMLTable();
	$( "#auction" ).html( html );
	$( "#auction-summary" ).html( html );	
	
	// Setup bidding box as styled table
	BW.updateBiddingBox( auction );
};

/**
 * Activate click/change handlers for hand and auction and other deal fields
 * @param {object} deal - instance of Deal class that contains the information
 */
BW.activateDealEventHandlers = function( deal ) {
	// Click on hand
	$( "#hand" ).click( function() {
		$( "#select-cards" ).popup( "open", { transition: "flow" } );
	});
	// Click on auction
	$( "#auction" ).click( function() {
		$( "#select-auction" ).popup( "open", { transition: "flow" } );
	});	
	
	// Deal information controls
	$( ".deal-info" ).change( function() {
		var field = $( this ).attr( "field" );
		var value = $( this ).val();
		// This is for notes
		if ( value === null ) value = '';
		deal.set( field, value );		
		BW.saveDeal( deal );
		BW.updateDealInfo( deal );
		BW.updateAuction( deal );
	});	
	


};

/**
 * An utility function to generate html for a bidding button.
 * Used in generating buttons in bidding box
 * @param {number} level - the level of this bid
 * @param {string} suit - the suit of this bid
 * @param {boolean} disabled - whether the button should be disabled or not
 */
BW.makeBidButton = function( level, suit, disabled ) {
	var id = "call-" + Bridge.makeIdentifier( level + suit );
	var text = level + Bridge.calls[ suit ].html;
	var call = level+suit;
	var html = "<button id='" + id + "' call='" + call + "' class='ui-btn ui-btn-inline ui-mini ui-corner-all call'";
	if ( disabled ) html += " disabled";
	html += ">" + text + "</button>";
	return html;
};

/**
 * An utility function to generate html for a button.
 * @param {string} text - the text that goes inside the button
 * @param {boolean} disabled - whether the button should be disabled or not
 */
BW.makeButton = function( text, disabled ) {
	var id = "call-" + Bridge.makeIdentifier( text );
	var html = "<button id='" + id + "' call = '" + text + "' class='ui-btn ui-btn-inline ui-mini ui-corner-all call'";
	if ( disabled ) html += " disabled";
	html += ">" + text + "</button>";
	return html;
};

/**
 * Setup the bidding box for creating auction in bidding and lead problems.
 */
BW.createBiddingBox = function() {
	var disabled = true;
	var html = "";
	html += "<table><thead>";
	html += "<tr><th colspan='2'>" + BW.makeButton( "Double", disabled ) + "</th>";
	html += "<th>" + BW.makeButton( "Pass", disabled ) + "</th>";
	html += "<th colspan='2'>" + BW.makeButton( "ReDouble", disabled ) + "</th></tr>";
	html += "</thead><tbody>";
	for( var i = 1; i <= 7; ++i ) {
		html += "<tr>";
		for( var j = 0; j < Bridge.callOrder.length; ++j ) {
			var call = Bridge.callOrder[j];
			if ( Bridge.calls[ call ].bid ) {
				html += "<td>" + BW.makeBidButton( i, call, disabled ) + "</td>";
			}
		}
		html += "</tr>";
	}
	html += "</tbody>";
	html += "<tfoot><tr><th colspan='2'>" + BW.makeButton( "All Pass", disabled ) + "</th>";
	html += "<th></th>";
	html += "<th colspan='2'>" + BW.makeButton( "Undo", disabled ) + "</th>";
	html += "</table>";
	$( "#bidding-box" ).html( html );
		
};

/**
 * Update the bidding box in response to some change
 * @param {object} deal - the deal which has auction
 * @param {object} auction - the auction so far to enable appropriate buttons.
 */
BW.updateBiddingBox = function( auction ) {
	var current = auction.possibleCalls();
	for( var i = 1; i <= 7; ++i ) {
		for( var j = 0; j < Bridge.callOrder.length; ++j ) {
			var call = Bridge.callOrder[j];
			if ( Bridge.calls[ call ].bid ) {
				var disabled = ( i < current.level || ( i ===  current.level && Bridge.calls[ call ].index >= Bridge.calls[ current.suit ].index ) );
				var text = i+call;
				$( "#call-" + text ).prop( "disabled", disabled );
			}
		}
	}
	var otherCalls = { 
		"Double" : "double", 
		"Pass" : "pass",
		"ReDouble" : "redouble",
		"All Pass" : "pass",
		"Undo" : "undo" 
	};
	for( var call in otherCalls ) {
		var id = Bridge.makeIdentifier( call );
		var field = otherCalls[ call ];
		$( "#call-" + id ).prop( "disabled", !current[ field ] );
	}
};

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
		BW.updateLoginStatus();
		BW.loginStatusChanged = true;
		$( "#login-dialog" ).popup( "close" );
	}
	event.preventDefault();
	event.stopPropagation();
	return false;	
};

/**
 * Information in deal has changed.
 * Save to local storage and update all controls
 * @param {object} deal - the deal that has all the information
 */
BW.saveDeal = function( deal ) {
	localStorage.setItem( "deal", JSON.stringify( deal.toJSON() ) );
	BW.updatePublishButtonStatus( deal );
};

/**
 * Handle login button click
 */
BW.logout = function( event ) {
	BW.loggedIn = false;
	BW.updateLoginStatus();
	BW.loginStatusChanged = true;
	$( "#logout-dialog" ).popup( "close" );
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
};

