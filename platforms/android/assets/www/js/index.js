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

/** Mapping from scoring types to display names. */
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

/** Color palette to use when displaying voting results. */
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

	// The id of the main content
	BW.contentID = "mycontent";	
	
	// Assume that south is hand shown. It should not matter (famous last words)
	BW.handDirection = 's';
	
	// A cache to store loaded html files
	BW.pageCache = {};		
	
	// The address of the BW server
	BW.sitePrefix = "https://108.166.89.84/";
	// the version of the api being used
	BW.restAPIPrefix = "rest-api/v1/";
	
	// Manage active tab
	BW.lastNavbarItem = "vote";
	BW.disableNavbar();
	// This is necessary to have the last active navbar item still be active after a popup
	$( "#bw-popup-menu" ).popup( {
		afterclose: function( event, ui ) {
			BW.setNavbarActiveItem( BW.lastNavbarItem );
		}
	});
	
	// Load the different pages from menu
	$( "body" ).on( "click", "a[role='page'], img[role='page']", function() {
		/*$( "#bw-poll-votes" ).popup( "close" );
		var page = $( this ).data("page");
		var parameterNames = [ "slug", "back_name", "back_page", "back_html" ];
		parameters = {};
		for( var i = 0; i < parameterNames.length; ++i ) {
			var parameterValue = $( this ).data( parameterNames[i] );
			if ( parameterValue ) parameters[ parameterNames[i] ] = parameterValue;
		}*/
		BW.loadPage( $( this ).data() );
	});
	
	// Expand problem vote details
	$( "body" ).on( "click", ".bw-problem-summary-button", function() {
		var html = "";
		var slug = $( this ).data( "slug" );
		var source = $( this ).data( "source" );
		html += BW.VotingProblem.getVotesTable( BW.problems[slug] );
		html += '<a class="ui-btn" role="page" data-page="view" data-source="' + source + '" data-slug="' + slug + '">View Problem Details</a>';
		$( "#bw-poll-votes-content" ).empty().append( html );
		$( "#bw-poll-votes" ).popup( "open" );
	});
	
	
	// Loaded problems
	BW.problems = {};
	
	// Show empty screen
	BW.showOneSection( "default" );
	
	// Card dimension ratio
	BW.cardDimensionRatio = 1.3924;
	
	// Load the current user
	BW.currentUser = new BW.User( BW.contentID );
	
	// Try again button
	$( document ).on( "click", "#bw-connect-server", { user: BW.currentUser }, function( e ) {
		alert("test");
		$( document ).trigger( "BW.loginStatus:changed", [e.data.user] );	
		return false;		
	});		
	
	// Load the options
	BW.currentOptions = new BW.Options();
	
	// Setup voting problem class
	BW.votingProblem = new BW.VotingProblem( "bw-voting-problem" );
	
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
// This hack is to allow testing on browser where deviceready event will not fire
if ( BW.isBrowser() ) {
	$.when( jQueryMobileReady ).then( BW.initialize );
}
else {
	$.when( cordovaReady, jQueryMobileReady ).then( BW.initialize );
}

/**
 * Perform an Ajax request.
 */
BW.ajax = function( parameters ) {
	var url = encodeURI( BW.sitePrefix + BW.restAPIPrefix + parameters.urlSuffix );
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
		BW.showConnectionError();
	});	
	return false;
};

/**
 * Show unable to connect to BW server message
 */
BW.showConnectionError = function() {
	BW.disableNavbar();
	BW.showOneSection( "bw_connect_error" );			
};

/**
 * Load a page/section
 */
BW.loadPage = function( parameters ) {	
	BW.closeAllPopups();
	var page = parameters.page;
	if ( BW.lastNavbarItem === "vote" ) BW.showOneSection( "default" );
	if ( page !== "more" ) $( "#bw-recent-vote" ).hide();
	switch( page ) {
		case "vote" :
			BW.showRecentVote();
			BW.votingProblem.load();
			BW.setNavbarActiveItem( "vote" );			
			break;
		case "create" :
			BW.showOneSection( "bw_create_problem" );
			BW.setNavbarActiveItem( "create" );
			BW.createProblem.initialize();		
			break;
		case "view" :
			BW.setNavbarActiveItem( "view" );
			if ( parameters.slug ) {
				if ( parameters.source === "view") parameters[ "back-button-html" ] = "Back to Recently Voted List";
				else if ( parameters.source === "profile") parameters[ "back-button-html" ] = "Back to Recently Published List";
				else if ( parameters.source === "vote" ) parameters[ "back-button-html" ] = "Back to Voting Problem";
				BW.votingProblem.load( parameters );
			}
			else {
				BW.showOneSection( "bw_problem_list" );
				var listParameters = {
					source: "view",
					type: "voted",
					containerID: "#bw-problem-list-contents"
				};				
				BW.showProblemList( listParameters );
			}
			break;
		case "profile":
			BW.setNavbarActiveItem( "profile" );
			BW.showOneSection( "bw_profile" );
			BW.currentUser.loadProfile();
			var listParameters = {
				source: "profile",
				type: "published",
				containerID: "#bw-published-problem-list-contents"
			};
			BW.showProblemList( listParameters );
			break;
		case "more" :
			$( "#bw-popup-menu" ).popup( "open" );
			break;
		case "about" :
			BW.setNavbarActiveItem( "more" );
			BW.showOneSection( "bw_about" );		
			break;
		case "options" :
			BW.setNavbarActiveItem( "more" );
			BW.showOneSection( "bw_options" );
			break;
		default:
			alert( "Cannot load unknown section " + page );
			break;
	}

};

/**
 * Show the list of problems recently voted on
 */
BW.showProblemList = function( parameters ) {
	data = {
		start:0,
		end: 9
	};
	if ( parameters.type === "published" ) {
		var urlSuffix = "get-recent-published/";
		var message = "Getting Recent Published Problem List";
	}
	else {
		var urlSuffix = "get-recent-answers/";
		var message = "Getting Recent Voted Problem List";
	}
	var parameters = {
		urlSuffix: urlSuffix,
		loadingMessage: message,
		method: "POST",
		context: this,
		parameters: parameters,
		data: data,
		successCallback: function( data ) {
			var answers = data.recent_answers;
			var html = "";
			var source = this.parameters.source;
			if ( answers.length <= 0 ) {
				if ( this.parameters.type === "published" ) {
					html += "<h4>You have not published any problems yet!</h4>";
				}
				else {
					html += "<h4>You have not voted on any problems yet!</h4>";
				}
			}
			else {
				html += "<ul data-role='listview' data-inset='true'>";
				_.each( answers, function( answer ) {
					BW.problems[ answer.slug ] = answer;
					//html += "<li data-icon='false'><a role='page' data-source='" + source +"' data-page='view' data-slug='" + answer.slug + "'>";
					html += "<li data-icon='carat-d'><a class='bw-problem-summary-button' data-source='" + source +"' data-slug='" + answer.slug + "'>";
					var icon = ( answer.type.toLowerCase() === "bidding" ? "img/Box-Red.png" : "img/cardback.png" );	
					
					html += '<img src="' + icon + '" class="ui-li-icon"/>';
					html += '<div>';
					var hand = new Bridge.Hand( 'n' );
					hand.setHand(answer.lin_str);
					html += hand.toHTML();
					html += '</div>';
					if ( this.parameters.type === "voted" ) {
						html += '<div>';
						var avatarLink = BW.getAvatarLink( answer.avatar );
						html += '<img src="' + avatarLink + '"/> ';
						html += answer.author + '</div>';
					}
					var suffix = ( answer.num_answers === 1 ? "vote" : "votes" );
					html += '<span class="ui-li-count">' + answer.num_answers + ' ' + suffix + '</span>';	
					html += '</a></li>';			
				}, this );			
				html += "</ul>";			
			}
			var list = $( this.parameters.containerID );
			list.empty().append( html );	
			list.trigger( "create" );
		},
		failCallback: function( message ) { 
			$( "#bw-error-message" ).empty().append( message );
			BW.showOneSection( "error" ); 
		}
	};
	BW.ajax( parameters );
	return false;		
};

/**
 * Show the last problem user voted on.
 */
BW.showRecentVote = function() {
	var html = "Loading Most Recent Vote";
	var container = "#bw-recent-vote";
	$( container ).empty().append( html ).show();
	var parameters = {
		urlSuffix: "get-recent-answers/",
		loadingMessage: html,
		showDialog: false,
		method: "POST",
		context: this,
		data: { start:0, end:0 },
		successCallback: function( data ) {
			var answers = data.recent_answers;
			if ( answers.length === 0 ) {
				html = "You have not voted on any problems yet!";
				$( container ).empty().append( html );
			}
			else {
				var answer = answers[0];
				BW.problems[ answer.slug ] = answer;
				var hand = new Bridge.Hand( 'n' );
				hand.setHand( answer.lin_str );
				html = "";
				html += hand.toHTML();
				if ( answer.answer !== "Abstain" ) {
					if ( answer.type === "Bidding" ) html += ' ' + Bridge.getCallHTML(answer.answer);
					else if ( answer.type === "Lead" ) html += ' ' + Bridge.getCardHTML(answer.answer);
					html += ' ' + answer.answer_count + '/' + ( answer.num_answers - answer.num_abstentions ) + ' ' + answer.percent + '%';
				}
				else html +=  ' ' + answer.answer;
				//html = '<a class="bw-no-margin-top ui-btn" role="page" data-name="view" data-page="view" data-slug="' + answer.slug + '">' + html + '</a>';
				html = '<a class="ui-btn ui-icon-carat-d ui-btn-icon-right bw-no-margin-top bw-problem-summary-button" data-source="vote" data-page="view" data-slug="' + answer.slug + '">' + html + '</a>';
				$( container ).empty().append( html );
				// Redraw cards
				BW.votingProblem.positionCards();
			}
		},
		failCallback: function( message ) { 
			$( container ).empty().append( "Unable to load Recent Vote" ); 
		}
	};
	BW.ajax( parameters );
	return false;		
};


/**
 * Disable the navbar
 */
BW.disableNavbar = function() {
	$( "[data-type='navbar-item']" ).addClass( "ui-disabled" );
};

/**
 * Enable the navbar
 */
BW.enableNavbar = function() {
	$( "[data-type='navbar-item']" ).removeClass( "ui-disabled" );
};

/**
 * Set the active navbar item
 */
BW.setNavbarActiveItem = function( itemName ) {
	BW.lastNavbarItem = itemName;
	$( "[data-type='navbar-item']" ).removeClass( "ui-btn-active" );
	$( "[data-type='navbar-item'][data-page='" + itemName + "']" ).addClass( "ui-btn-active" );
};

/**
 * Display one section
 */
BW.showOneSection = function( sectionName ) {
	$( "[data-section]" ).hide();
	$( "[data-section='" + sectionName + "']" ).show();
};

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
 * Close all popups.
 */
BW.closeAllPopups = function() {
	var popups = [ "bw-popup-menu", "bw-poll-votes", "bw-poll-responses" ];
	_.each( popups, function( popup ) {
		$( "#" + popup ).popup( "close" );
	}, this);
};

/**
 * Get Link to avatar
 */
BW.getAvatarLink = function( avatar ) {
	return BW.sitePrefix + avatar;
};


/**
 * The hash change handler.
 * Dispatches to appropriate handler based on action and passes the hash parameters
 */
BW.loadPage1 = function( page, parameters ) {	
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
BW.pageLoaded1 = function( page, parameters ) {
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
		BW.setNavbarActiveItem( "more.html" );
	}
	else if ( page === "vote.html" ) {
		BW.setNavbarActiveItem( "vote.html" );
		BW.votingProblem.initialize();
	}
	else if ( page === "create.html" ) {
		BW.setNavbarActiveItem( "create.html" );
		BW.createProblem.initialize();
	}
	else if ( page === "profile.html" ) {
		BW.setNavbarActiveItem( "profile.html" );
		BW.currentUser.loadProfile();
		BW.recentlyPublishedProblems.showRecentlyPublishedList();
	}
	else if ( page === "view.html" ) {
		BW.setNavbarActiveItem( "view.html" );
		if ( parameters.hasOwnProperty( "slug" ) ) {
			BW.viewProblem.initialize( parameters );
		}
		else {
			BW.viewProblem.showList();
		}
	}
	else if ( page === "about.html" ) {
		BW.setNavbarActiveItem( "more.html" );
	}	
	else {
		alert( "Unknown page : " + page );
		return;
	}	
	$( '#' + BW.contentID ).trigger( "create" );
};










