/*
 * License Text.
 * Authors: Sriram Narasimhan
 */
 
// Wait for cordova
var cordovaReady = $.Deferred();
document.addEventListener( "deviceready", cordovaReady.resolve, false );

// Wait for jQueryMobile
var jQueryMobileReady = $.Deferred();
$( document ).bind( "pagecreate", jQueryMobileReady.resolve );

// Both events have fired. 
// Added a hack to check if running in chrome.
// This hack is allow testing on Chrome browser where deviceready event will not fire
// TODO: Remove the hack because it is only for testing on browsers.
if (navigator.userAgent.match(/chrome/i)) {
	$.when( jQueryMobileReady ).then( BW.initialize );
}
else {
	$.when( cordovaReady, jQueryMobileReady ).then( BW.initialize );
}
 
/** Define a BridgeWinners namespace */
var BW = {};

/** The currently loaded deal */
BW.deal = null;

/**
 * The initialize function. Called only once when the app starts.
 */
BW.initialize = function() {
	
	// Most things are handled by hash change so add hash change handler
	$( window ).hashchange( BW.hashChangeHandler );
	
	// Trigger the hash change for the current page (first page)
	$( window ).hashchange();
};
 
// Variables to store common header and footer
var $header = "";
var $footer = "";

// The deal to hold deal information
var deal = null;

// The query parameters if any
var queryParameters = {};



function initialize() {
	
	$( window ).hashchange(function() {
		var hash = location.hash;
		var parameters = Bridge.readQueryParameters( hash, '#' );
		var page = parameters[ "page" ];
		if ( !page ) page = "home.html";
		if ( page === "login.html" ) {
			$( "#myPopupDialog" ).popup( "open" );
		}
		else {
			$( "#mycontent" ).load( page );
		}
	});
	// Since the event is only triggered when the hash changes, we need to trigger
	// the event now, to handle the hash the page may have loaded with.
	$( window ).hashchange();
};


 
function initialize1() {
	
	// TODO: Check if this can be done in a better way
	// Header and Footer is added only to index.html page
	// Get the header and footer html on initialize (which is only called for index.html)
	// and store it for injecting into other pages.
	$header = $('#myheader');
    $footer = $('#myfooter');
    $( 'a' ).click( function() {
		queryParameters = Bridge.readQueryParameters( $( this ).attr( "href" ) );
	});
	
	// When page is created first time inject common header and footer
	$( document ).on( "pagecreate", function( event ) {
		addHeaderAndFooter( event.target );	
		if ( event.target.id === 'createPage' ) {
			try {
				setUpBiddingProblem()
			}
			catch(err) {
				alert(err.message);
			}
			//setupDeck( event.target );
			//$( "[data-role=panel]" ).panel().enhanceWithin();
		}
		$(".ui-content").css('margin-bottom', $('#myfooter').height());
	});
	$( document ).bind("submit",function(e) {
		alert( "Login feature has not been implemented yet!" );
		e.preventDefault();
		return false;
	});	
};

// Add common header and footer to page
function addHeaderAndFooter( contentDiv ) {
	// Clone and add header and footer if it does not exist already.
	if ( $( contentDiv ).children( "div[data-role='header']" ).length === 0 ) {
		$header.clone().prependTo( contentDiv );
	}
	if ( $( contentDiv ).children( "div[data-role='footer']" ).length === 0 ) {
		$footer.clone().appendTo( contentDiv ); 
	}
};


function saveDeal( deal ) {
	localStorage.setItem( "deal", JSON.stringify( deal.toJSON() ) );
	updateHand( deal );
	updateAuction( deal );
	createBiddingBox( deal );
	checkSubmitButtonStatus( deal );
};

function updateButton( id, text, disabled ) {
	if ( typeof text === "undefined" ) text = "Publish";
	if ( typeof disabled === "undefined" ) disabled = false;
	$( '#' + id ).prop( "disabled", disabled ).html( text );
};

function checkSubmitButtonStatus( deal ) {
	var id = "publish-button";
	var count = deal.get( 'count', 'n' );
	if ( count !== 13 ) {
		var disabled = true;
		var text = "Not Enough Cards";
		updateButton( id, text, disabled );
		return;
	}
	var auction = deal.getAuction();
	var problemType = queryParameters.problem;
	switch( problemType ) {
		case "bidding" :
			if ( auction.contract && auction.contract.isComplete ) {
				var disabled = true;
				var text = "Auction is already complete";				
				updateButton( id, text, disabled );
				return;
			}
			break;
		case "lead" :
			if ( auction.contract && !auction.contract.isComplete ) {
				var disabled = true;
				var text = "Auction is not complete";				
				updateButton( id, text, disabled );
				return;
			}
			break;
		default :
			var disabled = true;
			var text = "Unknown Problem Type";				
			updateButton( id, text, disabled );
			return;		
	}
	updateButton( id );
}

function updateHand( deal ) {
	var count = deal.get( 'count', 'n' );
	var countHTML = '<span class="ui-li-count">' + deal.get( 'count', 'n' ) + '</span>';
	$( "#hand" ).html( deal.hands['n'].toString( true ) + countHTML );	
	var html = "";
	html += "<button class='ui-btn ui-corner-all'>";
	html += "Hand : " + deal.hands['n'].toString( true ) + countHTML;
	html += "</button>";
	$( "#hand-summary" ).html( html  );	

};

function loadDefaults( deal ) {
	var deal = new Bridge.Deal();
	deal.set( "scoring", "KO" );
	var dealer = 'n';
	deal.set( "dealer", dealer );
	deal.set( "vulnerability", '-' );
	deal.addAuction( "Default", dealer );
	return deal;
};

function loadDeal( deal ) {
	var fields = [ "scoring", "dealer", "vulnerability" ];
	for( var i = 0; i < fields.length; ++i ) {
		var field = fields[i];
		var value = deal.get( field );
		$( '#' + field ).val( value ).selectmenu().selectmenu( "refresh" );
	}
	$( "#notes" ).val( deal.get( "notes" ) );
	updateHand( deal );
	updateAuction( deal );
	createBiddingBox( deal );
	
};

function updateAuction( deal ) {
	$( "#auction" ).html( deal.getAuctionTable() );
	var html = "";
	var auction = deal.getAuction();
	html += auction.toHTMLTable();
	$( "#auction-summary" ).html( html );
};

function makeButton( text, disabled ) {
	var html = "<button call='" + text + "' class='ui-btn ui-btn-inline ui-mini ui-corner-all call'";
	if ( disabled ) html += " disabled";
	html += ">" + text + "</button>";
	return html;
};

function createBiddingBox( deal ) {
	var auction = deal.getAuction();
	var current = auction.possibleCalls();
	var html = "";
	html += "<table><thead>";
	html += "<tr><th colspan='2'>" + makeButton( "Double", !current.double ) + "</th>";
	html += "<th>" + makeButton( "Pass", !current.pass ) + "</th>";
	html += "<th colspan='2'>" + makeButton( "ReDouble", !current.redouble ) + "</th></tr>";
	html += "</thead><tbody>";
	for( var i = 1; i <= 7; ++i ) {
		html += "<tr>";
		for( var j = 0; j < Bridge.callOrder.length; ++j ) {
			var call = Bridge.callOrder[j];
			if ( Bridge.calls[ call ].bid ) {
				var disabled = ( i < current.level || ( i ===  current.level && Bridge.calls[ call ].index >= Bridge.calls[ current.suit ].index ) );
				html += "<td>" + makeButton( i+call, disabled ) + "</td>";
			}
		}
		html += "</tr>";
	}
	html += "</tbody>";
	html += "<tfoot><tr><th colspan='2'>" + makeButton( "All Pass", !current.pass ) + "</th>";
	html += "<th></th>";
	html += "<th colspan='2'>" + makeButton( "Undo", !current.undo ) + "</th>";
	html += "</table>";
	$( "#bidding-box" ).html( html );
	$( ".call" ).click( function() {
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
			saveDeal( deal );
		}
		catch( err ) {
			alert( err.message );
		}	
		
	});
};

function setUpBiddingProblem() {
	var dealString = localStorage.getItem( "deal" );
	if ( dealString ) {
		deal = new Bridge.Deal();
		deal.fromJSON( JSON.parse( dealString ) );
	}
	else {
		deal = loadDefaults();
	}
	loadDeal( deal );
	$( ".deal-info" ).change( function() {
		var field = $( this ).attr( "field" );
		var value = $( this ).val();
		if ( value === null ) value = '';
		deal.set( field, value );		
		saveDeal( deal );
	});
	$( "#hand" ).click( function() {
		$( "#select-cards" ).popup( "open", { transition: "flow" } );
	});
	setupDeck( "card-deck", deal );
	$( "#auction" ).click( function() {
		$( "#select-auction" ).popup( "open", { transition: "flow" } );
	});
	checkSubmitButtonStatus( deal );
};

function setupDeck( contentDiv, deal ) {

	var html = "";
	var setName = "card-deck-set";
	html += '<div id="' + setName + '" data-role="collapsibleset">';
	var open = true;
	for( var i = 0; i < Bridge.suitOrder.length; ++i ) {
		var suit = Bridge.suitOrder[i];
		if ( suit === 's' ) open = true;
		else open = false;
		html += createSuitPanel( suit, deal, open );
	}
	html += '</div>';
	$( '#' + contentDiv ).html( html );
	$( '#' + setName ).collapsibleset().collapsibleset( "refresh" );
	$( ".card" ).on( "click", function() {
		var status = $( this ).attr( "status" );
		if ( status === "in-deck" ) {
			var card = $( this ).attr( "card" );
			try {
				deal.addCard( card[0], card[1], 'n' );
				$( this ).attr( "src", "img/cards/cb_blue2.png" ).attr( "status", "in-hand" );
				saveDeal( deal );
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
			saveDeal( deal );
		}	
	});
};

function createSuitPanel( suit, deal, open ) {
	var html = "";
	html += '<div data-role="collapsible"' + (open ? ' data-collapsed="false"' : '') + '>';	
    html += '<h2>' + Bridge.suits[ suit ].html + ' Cards</h2>';
    html += '<div>';
    for( var i = 0; i < Bridge.rankOrder.length; ++i ) {
		var rank = Bridge.rankOrder[i];
		var card = suit + rank;
		if ( deal._hasCard( suit, rank, 'n' ) ) {
			var status = "in-hand";
			var src = "img/cards/cb_blue2.png"
		}
		else {
			var status = "in-deck";
			var src = "img/cards/" + card + ".png";
		}
		html += '<img status="' + status + '" card="' + card + '" class="card" height="50" src="' + src + '"/>';
	}
	html += '</div>';
	html += '</div>	';
	return html;
};
