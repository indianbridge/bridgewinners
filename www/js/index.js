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
	$.mobile.buttonMarkup.hoverDelay = 0;
	$.mobile.hoverDelay = 0;
	BW.isInit = true;
	
	// enable fast click
	var attachFastClick = Origami.fastclick;
	attachFastClick(document.body);
	
	// The current user
	BW.currentUser = new BW.User();
	
	// Load all the default, published and unpublished problems
	BW.problems = new BW.Problems();
	
	// Load the current options
	BW.currentOptions = new BW.Options();
	
	// Enable or Disable debug logging
	BW.enableDebug = true;	
	Bridge.options.enableDebug = true;

	// The id of the main content
	BW.contentID = "mycontent";	
	
	// Assume that north is hand shown. It should not matter (famous last words)
	BW.handDirection = 'n';
	
	// Was the last state a ui dialog
	BW.isUIStateDialog = false;
	
	// A cache to store loaded html files
	BW.pageCache = {};
	
	// Most things are handled by hash change so add hash change handler
	$( window ).hashchange( BW.hashChangeHandler );
	
	// Trigger the hash change for the current page (first page)
	$( window ).hashchange();
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
BW.hashChangeHandler = function() {
	// Parse the hash parameters
	var init = BW.isInit;
	BW.isInit = false;
	var parameters = Bridge.getHash();
	_.defaults( parameters, { action: "load", page: "home.html" } );
	var action = parameters.action;
	var uiState = parameters[ "ui-state" ];
	if ( !init && uiState && uiState === "dialog" ) isDialog = true;
	else isDialog = false;
	var recreatePage = !(isDialog || BW.isUIStateDialog);
	BW.isUIStateDialog = isDialog;
	if ( !recreatePage ) return;
	switch ( action ) {
		case "load" :
		case "create" :
		case "view" :
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
 * Actions after page is loaded.
 * @param {object} parameters the associative array of hash parameters
 */
BW.pageLoaded = function( parameters ) {
	if ( parameters.page === "options.html" ) {
		BW.currentOptions.initializeAll();
		$( "#index" ).trigger( "create" );
		$( ".options" ).change( function() {
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
	else if ( parameters.page === "create.html" ) {
		BW.problems.loadProblem( parameters.name );
		// Since we are loading the page we have to activate components
		$( "#index" ).trigger( "create" );		
	}
	else if ( parameters.page === "list.html" ) {
		BW.problems.loadProblemList( parameters.type );
		// Since we are loading the page we have to activate components
		$( "#index" ).trigger( "create" );	
	}
	else {
		$( "#index" ).trigger( "create" );
	}
};

/**
 * An utility to update the text and status of a button.
 * @param {string} id - the id of button being updated
 * @param {string} text - the text/html for the button
 * @param {boolean} disabled - whether the button is disabled or enabled
 */
BW.updateButton = function( id, text, disabled ) {
	$( '#' + id ).prop( "disabled", disabled ).html( text );
	if ( disabled ) $( '#' + id ).addClass('ui-disabled');
	else $( '#' + id ).removeClass('ui-disabled');
}

/**
 * A class to manage all the problems.
 * Problems can belong to defaults, published or unpublished lists.
 */
BW.Problems = function() {
	var defaultList = localStorage.getItem( "defaults" );
	if ( !defaultList ) localStorage.setItem( "defaults", JSON.stringify( [ "bidding", "lead" ] ) );
	this.lists = [ "defaults", "unpublished", "published" ];
	this.names = {};
	this.problems = {};
	_.each( this.lists, function( listName ) {
		this.names[ listName ] = [];
		var names = localStorage.getItem( listName );
		if ( names ) this.names[ listName ] = JSON.parse( names );
		var newList = [];
		_.each( this.names[ listName ], function( name ) {
			var problem = BW.Problem.create( name, listName );
			if ( problem !== null ) {
				newList.push( name );
				this.problems[ name ] = problem;
			}
		}, this );
		this.names[ listName ] = newList;
		localStorage.setItem( listName, JSON.stringify( this.names[ listName ] ) );
	}, this );
};

/**
 * Load a problem into the page.
 * @param {string} name the unique identifier name of the problem.
 */
BW.Problems.prototype.loadProblem = function( name ) {
	var problem = this.getProblem( name );
	problem.loadDeal();
};

/**
 * Load a problem list into the page.
 * @param {string} list the list to load
 */
BW.Problems.prototype.loadProblemList = function ( list ) {
	var html = "";
	var listName = _.capitalize( list );
	if ( this.names[ list ].length <= 0 ) {
		html += "<h4>You don't seem to have any problems in the " + listName + " list. Live a lttle. Create some problems, save them, publish them.</h4>";	
	}
	else {
		html += "<ul data-role='listview' data-inset='true'>";
		for ( var i = 0;i < this.names[ list ].length; ++i ) {
			var name = this.names[ list ][i];
			html += this.getProblem( name ).toHTML();				}
		html += "</ul>";
	}	
	$( "#problem-list-title" ).empty().html( listName + " problems list" );
	$( "#problem-list" ).empty().html( html );	
};

/**
 * Retrieve a problem by name.
 * @param {string} name the unique identifier name of the problem.
 * @return {object} the problem object with specified name.
 */
BW.Problems.prototype.getProblem = function( name ) {
	return this.problems[ name ];
};


/**
 * Add a newly created problem to the problems list.
 * @param {object} problem the newly created problem
 */
BW.Problems.prototype.addProblem = function( problem ) {
	var list = problem.list;
	var name = problem.name;
	this.names[ list ].unshift( name );
	localStorage.setItem( list, JSON.stringify( this.names[ list ] ) );
	this.problems[ name ] = problem;
	problem.save();
};


/**
 * Publish a problem to BW server
 * @param {string} name the unique identifier name of the problem.
 */
BW.Problems.prototype.publishProblem = function( name ) {
	var problem = this.getProblem( name );
	var deal = problem.deal;	
	var type = problem.type;
	var list = problem.list;
	var count = deal.getHand( BW.handDirection ).getCount();
	if ( count !== 13 ) {
		alert( "Publish Error: Hand does not have 13 cards." );
		return;
	}
	var auction = deal.getAuction();
	var isComplete = auction.getContract().isComplete;
	if ( type === "bidding" && isComplete ) {
		alert( "Publish Error: This is a bidding problem and Auction is already completed" );
		return;
	}
	if ( type === "lead" && !isComplete ) {
		alert( "Publish Error: This is a lead problem and Auction is not complete" );
		return;		
	}
	var user = BW.currentUser;
	if ( !user.isLoggedIn ) {
		alert( "Publish Error: Not logged in to BW server" );
		return;		
	}
	
	// Everything looks good use Whatever process to publish
	
	// This would actually be in a call back from publish process
	var newList = "published";
	var index = $.inArray( name, this.names[ list ] );
	if ( index === -1 ) {
		alert( "An error occurred. Unable to move problem : " + problem.name );
	}
	else {
		if ( list === "defaults" ) {
			var newProblem = this.duplicateProblem( problem.name, newList );	
			alert( "Published Problem successfully" );	
			return;
		}
		else if ( list === "unpublished" ) {
			this.names[ list ].splice( index, 1 );
			localStorage.setItem( list, JSON.stringify( this.names[ list ] ) );
			problem.list = newList;
			this.names[ newList ].unshift( name );
			localStorage.setItem( newList, JSON.stringify( this.names[ newList ] ) );
			alert( "Published Problem successfully" );	
			var url = "#action=view&page=list.html&type="+list;
			$.mobile.navigate( url );						
		}
		else {
			alert( "Cannot publish problem from " + list + " list!" );
			return;
		}
	}	
};


/**
 * Delete a problem from the problems list ( and change the page so that delete problem is not shown)
 * @param {string} name the unique identifier name of the problem.
 */
BW.Problems.prototype.deleteProblem = function( name ) {
	var problem = this.getProblem( name );
	var list = problem.list;
	var index = $.inArray( name, this.names[ list ] );
	if ( index === -1 ) {
		alert( "An error occurred. Unable to delete problem : " + problem.name );
		return false;
	}
	else {
		this.names[ list ].splice( index, 1 );
		localStorage.setItem( list, JSON.stringify( this.names[ list ] ) );
		localStorage.removeItem( name );
		return true;		
	}
};

/**
 * Move a problem from one list to another.
 * @param {string} name the unique identifier name of the problem.
 */
BW.Problems.prototype.moveProblem = function( name, newList ) {
	var problem = this.getProblem( name );
	var index = $.inArray( name, this.names[ list ] );
	if ( index === -1 ) {
		alert( "An error occurred. Unable to move problem : " + problem.name );
	}
	else {
		if ( list !== "defaults" ) {
			this.names[ list ].splice( index, 1 );
			localStorage.setItem( list, JSON.stringify( this.names[ list ] ) );
		}
		else {
		}
		this.names[ newList ].unshift( name );
		localStorage.setItem( newList, JSON.stringify( this.names[ newList ] ) );
	}	
};

/**
 * Duplicate an existing problem and place it in specified list.
 * @param {string} name the unique identifier name of the problem to duplicate
 * @param {string} list the list to the place the newly duplicated problem
 */
BW.Problems.prototype.duplicateProblem = function( name, list ) {
	var problem = this.getProblem( name );
	var newProblem = problem.duplicate( list );
	this.addProblem( newProblem );
	return newProblem;
};

/**
 * A class to represent a single problem
 */
BW.Problem = function( name, list, type, dealJSON ) {
	// Name
	this.name = name;
	this.list = list;
	this.type = type;
	this.deal = new Bridge.Deal();
	this.deal.disableEventTrigger();
	this.deal.fromJSON( dealJSON );	
	this.deal.enableEventTrigger();
};

/**
 * Load the the deal information associated with this problem into page.
 */
BW.Problem.prototype.loadDeal = function() {
	var status = ( this.list === "published" ? "Published" : "Unpublished" );
	var title = "Create a " + this.type + " problem ( Status : " + status + " )";
	$( '#problem-title' ).html( title );
	// Setup all the controls
	
	this.setupDealInfo();
	this.setupHandAndCardDeck();
	this.setupAuctionAndBiddingBox();
	this.setupClickHandlers();
	this.setupButtons();
	var user = BW.currentUser;
	$( document ).trigger( "loginStatus:changed",  [ user, user.isLoggedIn ]);
};
	

/**
 * Setup the click handlers on the loaded problem page.
 */
BW.Problem.prototype.setupClickHandlers = function() {
	if ( this.list !== "published" ) {
		// Click for opening card deck 
		$( "#hand" ).click( function() {
			$( "#select-cards" ).off( "popupbeforeposition" );
			$( "#select-cards" ).on( "popupbeforeposition", function( event, ui ) {
				var width = $(window).width();
				var height = $(window).height();
				if ( width >= 500 && height >= 500 ) {
					width = width / 15.5;
					height = width * 1.35;
					alert( width + ", " + height );
					$( "div.images span.card-deck-field-cards" ).width( width ).height( height );
				}
			});
			$( "#select-cards" ).popup( "open" );
		});
		
		// Click to open bidding box
		$( "#auction" ).click( function() {
			$( "#select-auction" ).popup( "open" );
		});	
	}
	var event = "deal:changed.problem"
	$( document ).off( event );
	if ( this.list !== "published" ) {
		// Handler for saving the deal
		$( document ).on( event, { problem: this }, function( e, deal ) {
			var problem = e.data.problem;
			if ( problem.deal !== deal ) return;
			problem.save();
			problem.updatePublishButtonStatus( BW.currentUser);
		});	
	}
	
	event = "loginStatus:changed.problem";
	$( document ).off( event );
	if ( this.list !== "published" ) {
		// Handler for login status changed
		$( document ).on( event, { problem: this }, function( e, user ) {
			var problem = e.data.problem;
			problem.updatePublishButtonStatus( user );
		});	
	}
};


/**
 * Setup the status and click handlers for all buttons in the loaded problem page.
 */
BW.Problem.prototype.setupButtons = function() {	
	var buttonName = "delete-button";
	if ( this.list === "defaults" ) {
		BW.updateButton( buttonName, "Delete Draft", true );
		$( "#" + buttonName ).hide();
	}
	else {
		BW.updateButton( buttonName, "Delete", false );
		$( "#" + buttonName ).show();
		$( "#" + buttonName ).click( { problem: this }, function( e ) {
			var problem = e.data.problem;
			$( "#confirm-dialog" ).popup();
			$( "#confirm-dialog" ).popup( "open" );
			$( "#yes-button" ).on( "click", { problem: problem }, function( e ) {
				$( "#yes-button" ).off( "click" );
				$( "#no-button" ).off( "click" );
				var problem = e.data.problem;
				var list = problem.list;
				BW.problems.deleteProblem( problem.name );
				$( "#confirm-dialog" ).one( "popupafterclose", { list: list }, function ( e ) {
					var url = "#action=view&page=list.html&type="+e.data.list;
					$.mobile.navigate( url );	
				});
				$( "#confirm-dialog" ).popup( "close" );
				
			});
			$( "#no-button" ).on( "click", { problem: this }, function( e ) {
				$( "#yes-button" ).off( "click" );
				$( "#no-button" ).off( "click" );
				$( "#confirm-dialog" ).popup( "close" );
			});			
		});
	}
	
	buttonName = "save-button";
	if ( this.list === "defaults" || this.list === "published" ) {
		var text = ( this.list === "defaults" ? "Save to Unpublished" : "Duplicate to Unpublished" );
		BW.updateButton( buttonName, text, false );	
		$( "#" + buttonName ).show();	
		$( "#" + buttonName ).click( { problem: this }, function( e ) {
			var problem = e.data.problem;
			var newProblem = BW.problems.duplicateProblem( problem.name, "unpublished" );
			var url = "#action=create&page=create.html&problem=" + newProblem.type + "&name="+newProblem.name;
			$.mobile.navigate( url );			
		});
	}
	else {
		BW.updateButton( buttonName, "Save", true );
		$( "#" + buttonName ).hide();
	}	
	
	buttonName = "publish-button";
	if ( this.list === "published" ) {
		$( "#" + buttonName ).hide();
	}
	else {
		$( "#" + buttonName ).click( { problem: this }, function ( e ) {
			var problem = e.data.problem;
			BW.problems.publishProblem( problem.name );
		});
		$( "#" + buttonName ).show();
	}
};


/**
 * Enable or Disable the Publish button based on status of hand, auction and login.
 * It will also depend on whether this is a bidding or lead problem
 * @param {object} user the current user object which has information about login status.
 */
BW.Problem.prototype.updatePublishButtonStatus = function( user ) {
	var id = "publish-button";
	if ( $( "#" + id ).length <= 0 ) return;
	var text = "Publish";
	var disabled = true;
	var deal = this.deal;	
	var type = this.type;
	var count = deal.getHand( BW.handDirection ).getCount();
	var auction = deal.getAuction();
	var isComplete = auction.getContract().isComplete;
	if ( count !== 13 ) text = "Not Enough Cards"
	else if ( type === "bidding" && isComplete ) text = "Auction is already completed";
	else if ( type === "lead" && !isComplete ) text = "Auction is not complete";	
	else if ( !user.isLoggedIn ) text = "Not Logged In";
	else disabled = false;
	BW.updateButton( id, text, disabled );
};


/**
 * Load values for scoring, dealer, vul and notes from loaded deal
 * Additionally add a handler callback for when a value is changed
 */
BW.Problem.prototype.setupDealInfo = function() {
	var disabled = ( this.list === "published" ? true : false );
	// Populate fields and controls
	var fields = [ "scoring", "dealer", "vulnerability", "notes" ];
	for( var i = 0; i < fields.length; ++i ) {
		var field = fields[i];
		$( '#' + field ).val( this.deal.get( field ) );
		if ( disabled ) $( '#' + field ).prop( "disabled", true );
	}
	
	if ( !disabled ) {
		// Handler for change
		$( ".deal-info" ).change( { deal: this.deal }, function( e ) {
			var field = $( this ).attr( "field" );
			var value = $( this ).val();
			// This is for notes
			if ( value === null ) value = '';
			e.data.deal.set( field, value );		
		});	
	}	
};

/**
 * Setup hand and card-deck to manage specification of hand.
 */
BW.Problem.prototype.setupHandAndCardDeck = function() {
	// Hand shown in main page and also repeated on card deck page for convenience
	var hand = this.deal.getHand( BW.handDirection );
	hand.toHTML( { containerID: "hand", show: { countInContent: true }, idPrefix: "h", registerChangeHandler: true } );
	hand.toHTML( { containerID: "hand-summary", show: { countInContent: true }, idPrefix: "hs", registerChangeHandler: true } );

	// Card Deck
	var width = $( window ).width();
	var height = $( window ).height();
	if ( width < 500 || height < 500 ) {
		var useText = true;
		var mainClass = "bbo";
	}
	else {
		var useText = false;
		var mainClass = "images";		
	}
	var config = {
		containerID: "card-deck", 
		idPrefix: "cd", 
		show: { reset: true, text:useText, title: false, activeHand: false, assignedTo: false }, 
		classes: { "card-deck": [ mainClass ] },
		tags: {}
	};
	var prefix = "card-deck";
	config.tags[ prefix ] = "div";
	config.tags[ prefix + "-header" ] = "div";
	config.tags[ prefix + "-content" ] = "div";
	config.tags[ prefix + "-footer" ] = "div";
	config.tags[ prefix + "-row" ] = "div";
	config.tags[ prefix + "-column" ] = "span";
	config.tags[ prefix + "-field" ] = "span";	
	this.deal.toCardDeck( config );
};

/**
 * Setup auction and bidding box to manage specification of auction.
 */
BW.Problem.prototype.setupAuctionAndBiddingBox = function() {
	// Get the auction
	var auction = this.deal.getAuction();
	auction.toBBODiagram( { containerID: "auction", idPrefix: "a", registerChangeHandler: true } );
	auction.toBBODiagram( { containerID: "auction-summary", idPrefix: "as", registerChangeHandler: true } );
	
	// Setup bidding box
	auction.toBiddingBox( { layout: "full", containerID: "bidding-box", idPrefix: "bb", classes: { "bidding-box": ["bbo"] }, registerChangeHandler: true } );
};

/**
 * Create a new problem object.
 * If the specified name exists in local storage then that information is used.
 * If not then default information is used.
 * @param {string} name the unique identifier name of the problem
 * @param {string} listName the list to place the problem in
 * @return {object} the create problem object - null if info cannot be found.
 */
BW.Problem.create = function( name, listName ) {
	var info = localStorage.getItem( name );
	if ( info ) {
		var infoJSON = JSON.parse( info );
		type = infoJSON.type;
		var dealJSON = infoJSON.deal;
	}	
	else if ( listName === "defaults" ) {
		type = name;
		var dealJSON = {};
	}
	else {
		return null;
	}
	return new BW.Problem( name, listName, type, dealJSON );
}

/**
 * Duplicate this problem and add it to the specified list.
 * @param {string} newList the list to place the duplicated problem
 * @return {object} the newly duplicated problem object
 */
BW.Problem.prototype.duplicate =  function( newList ) {
	var d = new Date();
	var name = "" + d.getTime();
	var type = this.type;
	var list = newList;
	var dealJSON = this.deal.toJSON();
	return new BW.Problem( name, list, type, dealJSON );
};

/**
 * Save this problem to local storage.
 */
BW.Problem.prototype.save = function() {
	var info = {
		type: this.type,
		list: this.list,
		deal: this.deal.toJSON()
	};
	localStorage.setItem( this.name, JSON.stringify( info ) );
};

/**
 * Create a summary html of this problem to be shown in the problem list page.
 * @return {string} the html representation of this problem
 */
BW.Problem.prototype.toHTML = function() {
	var name = this.name;
	var deal = this.deal;
	var type = this.type;
	var hand = deal.getHand( BW.handDirection );
	var icon = ( type === "bidding" ? "img/Box-Red.png" : "img/cardback.png" );	
	var html = "";
	html += "<li>";
	html += "<a data-ajax='false' href='#action=create&page=create.html&problem=" + type + "&name=" + name + "'>";
	html += "<img src='" + icon + "' alt='" + type + "' class='ui-li-icon'>"
	html += "<div>" + hand.toHTML( { registerChangeHandler: false } ) + "</div>";
	var secondLine = "<span class='highlight-box'>" + deal.get( "scoring" ) + "</span><span class='highlight-box'>" + " Dealer: " + Bridge.directions[ deal.get( "dealer" ) ].name + "</span><span class='highlight-box'>" + " Vul: " + Bridge.vulnerabilities[ deal.get( "vulnerability" ) ].name + "</span>";	
	html += "<div>" + secondLine + "</div></a></li>";			
	return html;	
};


/**
 * A class to represent user related activities including login and logout.
 */
BW.User = function() {
	this.isLoggedIn = false;
	this.username = null;
	this.password = null;
	
	// Setup login and logout submit button handler
	$( "#login-submit-button").click( function() {
		var username = $( "#username" ).val();
		var password = $( "#password" ).val();		
		BW.currentUser.login( username, password );
		event.preventDefault();
		event.stopPropagation();
		return false;		
	});
	$( "#logout-submit-button").click( function() {
		BW.currentUser.logout();
		event.preventDefault();
		event.stopPropagation();
		return false;			
	});
	this.updateLoginStatus();
	$( document ).on( "loginStatus:changed", function( e, user ) {
		user.updateLoginStatus();
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
	if ( this.username !== "bridge" || this.password !== "winners" ) {
		alert( "Invalid credentials" );
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
		var userInfo = {
			name: "Bridge Winners",
			photo: "img/logo.png"
		};
		this.loadProfile( userInfo );
		$( "#login-submit-button" ).prop( "disabled", false );
		$( "#login-dialog" ).popup( "close" );
		$( document ).trigger( "loginStatus:changed",  [ this, this.isLoggedIn ]);
	}	
};

/**
 * Logout from BW server
 */
BW.User.prototype.logout = function() {
	this.isLoggedIn = false;
	$( "#logout-dialog" ).popup( "close" );
	$( document ).trigger( "loginStatus:changed",  [ this, this.isLoggedIn ]);
};

BW.User.prototype.loadProfile = function( userInfo ) {
	var html = "";
	html += "<img style='vertical-align:middle;' height='25px' src='" + userInfo.photo + "'/>Welcome " + userInfo.name;
	$( "#profile-content" ).empty().html( html );
};


/**
 * Update the login and logout button and dialog based on login status.
 */
BW.User.prototype.updateLoginStatus = function() {
	var text = this.isLoggedIn ? "Profile" : "Login";
	var addClass = this.isLoggedIn ? "ui-icon-user" : "ui-icon-power";
	var removeClass = this.isLoggedIn ? "ui-icon-power" : "ui-icon-user";
	var href = this.isLoggedIn ? "#logout-dialog" : "#login-dialog";
	$( "#login-button" ).attr( "href", href ).addClass( addClass ).removeClass( removeClass ).html( text );
};

/** 
 * Class to handle options setting, loading, saving etc. 
 */
BW.Options = function() {
	this.itemName = "options";
	var options = localStorage.getItem( this.itemName );
	this.values = ( options ? JSON.parse( options ) : {} );
	_.defaults( this.values, {
		"theme" : "css/themes/default/jquery.mobile-1.4.5.min.css",
		"enableDebug": false
	});
	this.loadAll();	
};

/**
 * Get the value of an option.
 * @param {string} name the name of the option whose value is requested.
 * @return {mixed} the value of the requested option
 */
BW.Options.prototype.get = function( name ) {
	if ( ! _.has( this.values, name ) ) {
		alert( "Cannot find " + name + " in options" );
		return null;
	}	
	return this.values[ name ];
};

/**
 * Load/Propagate the value for the specified option.
 * @param {string} name the name of the option whose value is propagated.
 */
BW.Options.prototype.load = function ( name ) {
	if ( ! _.has( this.values, name ) ) {
		alert( "Cannot find " + name + " in options" );
		return;
	}
	// only one option for now
	switch ( name ) {
		case "theme" :
			// Load the stylesheet
			$( "#jqm-stylesheet" ).attr( "href", this.values[ name ] );		
			break;
		default :
			break;
	}	
};

/**
 * Load/Propagate all the options.
 */
BW.Options.prototype.loadAll = function() {
	for( var option in this.values ) {
		this.load( option );
	}
};

/**
 * Initialize the field value that the user will be using to change the options.
 * @param {string} name the name of the option whose value is initialized.
 */
BW.Options.prototype.initialize = function( name ) {
	if ( ! _.has( this.values, name ) ) {
		alert( "Cannot find " + name + " in options" );
		return;
	}	
	// Only one option for now
	switch ( name ) {
		case "theme" :
			$( "#theme" ).val( this.values[ name ] );	
			break;
		default :
			break;
	}	
};

/**
 * Initialize all the field values that the user will be using to change the options.
 */
BW.Options.prototype.initializeAll = function( options ) {
	for( var option in this.values ) {
		this.initialize( option );
	}
};

/**
 * Save all the options to local storage.
 */
BW.Options.prototype.save = function( options ) {
	localStorage.setItem( this.itemName, JSON.stringify( this.values ) );
};

/**
 * The callback handler function whenever an option value is changed by the user.
 * @param {string} name the name of the option that has changed
 * @param {mixed} value the new value of the changed option
 */
BW.Options.prototype.change = function( name, value ) {
	this.values[ name ] = value;
	this.save();
	this.load( name );
};

