/** Define a BridgeWinners namespace */
if ( typeof BW === "undefined" ) BW = {};

/**
 * A class to represent a bidding or lead problem to be voted on
 */
BW.VotingProblem = function( containerID ) {
	this.containerID = containerID;
	this.itemName = "BW::currentVotingProblem";
	//This is for testing
	localStorage.removeItem( this.itemName );
	var problem = localStorage.getItem( this.itemName );
	if ( problem ) {
		this.currentProblem = JSON.parse( problem );		
	}
	else this.currentProblem = null;
	
	// used by bidding box
	this.selectedLevel = null;
	this.selectedCall = null;
	// set by card deck
	this.selectedCard = null;
	
	var prefix = "bw-bidding-box";
	this.bbConfig = { 
		prefix: prefix,
		layout: "concise", 
		containerID: "bw-voting-problem-call", 
		idPrefix: "bb",
		show: { allpass: false, undo: false, reset: false },
		tags: Bridge.getDivConfig( prefix ),
		registerChangeHandler: false
	};
};

BW.VotingProblem.prototype.showRecentProblem = function() {
	var problem = BW.recentProblem;
	if ( problem ) {
		var deal = new Bridge.Deal();
		deal.fromJSON( problem.deal );
		var html = deal.getHand( problem.direction ).toHTML();
		html += " " + ( problem.type === "bidding" ? Bridge.getCallHTML( problem.vote ) : Bridge.getCardHTML( problem.vote ) );
		if ( problem.vote !== "abstain" ) html += " " + problem.percent + '%';
	}
	else {
		var html = "You have not voted on any problems yet!";
	}
	$( "#bw-voting-problem-recent" ).empty().append( html ).show();
};

/**
 * Get the auction for this problem.
 */
BW.VotingProblem.prototype.getAuction = function() {
	return this.deal.getAuction();
};

/**
 * Display one section
 */
BW.VotingProblem.prototype.showOneSection = function( sectionName ) {
	$( "[data-section]" ).hide();
	$( "[data-section='" + sectionName + "']" ).show();
};

/**
 * Load a problem
 */
BW.VotingProblem.prototype.initialize = function() {
	this.enableClicksAndSwipes();
	this.load();
};

/**
 * Load a problem
 */
BW.VotingProblem.prototype.load = function() {
	this.showOneSection( "loading" );	
	this.showRecentProblem();
	if ( this.currentProblem ) {
		this.show();
	}
	else {
		this.get();
	}
};

/**
 * Enable/Disable previous/next clicks and swipes
 */
BW.VotingProblem.prototype.enableClicksAndSwipes = function() {
	$( "#bw-voting-problem-call" ).on( "click", ".bw-bidding-box-field-level.enabled", { problem: this }, function( e ) {
		var level = _.parseInt( $( this ).data( "level" ) );
		if ( e.data.problem.selectedLevel === level ) return;
		var auction = e.data.problem.getAuction();
		$( "#bw-voting-problem-button-vote" ).addClass( "ui-disabled" );	
		auction.setSelectedLevel( level );
		e.data.problem.selectedCall = null;
		e.data.problem.selectedLevel = level;
		auction.toBiddingBox( e.data.problem.bbConfig );		
		
	});
	$( "#bw-voting-problem-button-abstain" ).click( { problem: this }, function( e ) {
		if ( e.data.problem.currentProblem.type === "bidding" ) {
			var answerPublic = $( "#bw-voting-problem-public" ).prop( "checked" );
			alert( "Thanks for you vote. Abstain selected. Answer is " + ( answerPublic ? "Public" : "Not Public" ) );
			e.data.problem.vote( "abstain" );
		}
		else {
			alert( "Cannot abstain on lead problem." );
		}
	});	
	$( "#bw-voting-problem-call" ).on( "click", ".bw-bidding-box-field-calls.enabled", { problem: this }, function( e ) {
		var call = $( this ).data( "suit" );
		if ( e.data.problem.selectedCall ) {
			var selector = ".bw-bidding-box-field-calls-" + e.data.problem.selectedCall;
			$( selector ).removeClass( "selected" );
		}
		var auction = e.data.problem.getAuction();
		e.data.problem.selectedCall = call;
		if ( !Bridge.isStrain( call ) ) {
			e.data.problem.selectedLevel = null;
			auction.unsetSelectedLevel();
			auction.toBiddingBox( e.data.problem.bbConfig );	
		}
		var selector = ".bw-bidding-box-field-calls-" + call;
		$( selector ).addClass( "selected" );
		$( "#bw-voting-problem-button-vote" ).removeClass( "ui-disabled" );	
	});		
	
	$( "#" + this.containerID ).on( "click", ".bw-card-deck-field-cards", { problem: this }, function( e ) {
		var problem = e.data.problem;
		if ( problem.selectedCard ) {
			$( "[data-card='" + problem.selectedCard + "']" ).removeClass( "bw-card-deck-selected" );
		}
		problem.selectedCard = $( this ).data( "card" );
		$( "[data-card='" + problem.selectedCard + "']" ).addClass( "bw-card-deck-selected" );
		$( "#bw-voting-problem-button-vote" ).removeClass( "ui-disabled" );
	});
	$( "#bw-voting-problem-button-vote" ).click( { problem: this }, function( e ) {
		console.log("Voting");
		var answerPublic = $( "#bw-voting-problem-public" ).prop( "checked" );
		var problem = e.data.problem;
		if ( problem.currentProblem.type === "bidding" ) {
			var call = "";
			call += ( problem.selectedLevel ? problem.selectedLevel : "" );
			call += ( problem.selectedCall ? problem.selectedCall : "" );
			if ( !Bridge.isBid( call ) ) {
				alert( "A valid call has not been selected. Please try again!" );
				return;
			}
			alert( "Thanks for Voting for " + call + ". Answer is " + ( answerPublic ? "Public" : "Not Public" ) );
			e.data.problem.vote( call );
		}
		else {
			alert( "Thanks for Voting for " + e.data.problem.selectedCard + ". Answer is " + ( answerPublic ? "Public" : "Not Public" ) );
			e.data.problem.vote( e.data.problem.selectedCard );
		}
	});	
	
};

/**
 * Send a vote for this problem to BW server
 */
BW.VotingProblem.prototype.vote = function( answer ) {
	// Do whatever is necesary to vote
	BW.recentProblem = JSON.parse( JSON.stringify( this.currentProblem ) );
	BW.recentProblem.vote = answer;
	BW.recentProblem.percent = Math.floor((Math.random() * 100) + 1);
	this.showRecentProblem();
	this.currentProblem = null;		
	this.load();
};

/**
 * Skip a problem
 */
BW.VotingProblem.prototype.skip = function() {
	this.showOneSection( "loading" );
	var problems = localStorage.getItem( "BW::votingproblems" );
	if ( !problems ) problems = "[]";
	var problemsJSON = JSON.parse( problems );
	if ( problemsJSON.length === 0 ) {
		alert( "This is the last problem you have to vote on. Can't Skip" );
		this.showOneSection( "data" );
		return;
	}
	var newProblem = problemsJSON[0];
	problemsJSON.splice( 0, 1, this.currentProblem );
	this.currentProblem = newProblem;
	localStorage.setItem( this.itemName, JSON.stringify( this.currentProblem ) );
	localStorage.setItem( "BW::votingproblems", JSON.stringify( problemsJSON ) );
	this.show();
};

/**
 * Get the next problem from the server
 */
BW.VotingProblem.prototype.get = function() {
	// Do whatever is done to get from server
	// For now from localStorage which is preloaded
	var problems = localStorage.getItem( "BW::votingproblems" );
	if ( !problems ) problems = "[]";
	var problemsJSON = JSON.parse( problems );
	if ( problemsJSON.length === 0 ) {
		// No more problems
		$( "#skip-button" ).addClass( "ui-disabled" );
		this.showOneSection( "empty" );
		//var html = "<p class='center'>Wow, you've answered every single bridge problem on the site!  Thanks for being such an active participant!</p>";
		//$( "#" + this.containerID).empty().append( html );	
		return;		
	}
	this.currentProblem = problemsJSON[0];
	localStorage.setItem( this.itemName, JSON.stringify( this.currentProblem ) );
	problemsJSON.splice( 0, 1 );
	localStorage.setItem( "BW::votingproblems", JSON.stringify( problemsJSON ) );
	this.show();
};

/**
 * Show the VotingProblem
 * @param {string} containerID - the container for the form
 */
BW.VotingProblem.prototype.show = function() {
	this.showOneSection( "data" );
	this.selectedLevel = null;
	this.selectedCall = null;
	this.selectedCard = null;
	var deal = new Bridge.Deal();
	deal.fromJSON( this.currentProblem.deal );
	this.deal = deal;
	
	// Image
	$( "#bw-voting-problem-author-image" ).attr( "src", this.currentProblem.image).attr( "alt", this.currentProblem.name );
	var fields = {
		"author-name": this.currentProblem.name + " asks...",
		"dealer": "Dealer " + Bridge.directions[ deal.getDealer() ].name,
		"scoring": BW.scoringTypes[ deal.getScoring() ],
		"vulnerability": Bridge.vulnerabilities[ deal.getVulnerability() ].name + " Vul",
		"description": deal.getNotes()
	};
	for( var field in fields ) {
		var selector = "#bw-voting-problem-" + field;
		$( selector ).empty().append( fields[ field ] );		
	}
	var question = "What's your " + ( this.currentProblem.type === "bidding" ? "Call" : "Lead" ) + "?";
	$( "#bw-voting-problem-question" ).empty().append( question );
	$( "#bw-voting-problem-public" ).prop( "checked", BW.currentOptions.get( "bw-option-answerPublicly" ) );
	
	$( "#skip-button" ).removeClass( "ui-disabled" );
	$( "#skip-button" ).off( "click" );
	$( "#skip-button" ).click( {problem: this }, function( e ) {
		e.data.problem.skip();
	});
	var auction = deal.getAuction();
	var config = {
		prefix: "bw-auction-diagram",
		show: {
			direction: true
		},
		tags: Bridge.getDivConfig( "bw-auction-diagram" ),
		data: {},
		classes: {},
		idPrefix: "a",
		containerID: "bw-voting-problem-auction",
		registerChangeHandler: false,
		addQuestionMark: true
	};	
	var aID = config.idPrefix + "-" + config.prefix;	
	auction.toHTML( config );
	var hand = deal.getHand( this.currentProblem.direction );
	config = {
		prefix: "bw-hand-diagram",
		show: {
			direction: false,
			name: false
		},
		tags: Bridge.getDivConfig( "bw-hand-diagram" ),
		data: {},
		classes: {},
		idPrefix: "h",
		containerID: "bw-voting-problem-hand",
		registerChangeHandler: false
	};		
	hand.toHTML( config );
	var hID = config.idPrefix + "-" + config.prefix;	
	var aWidth = $( "#" + aID ).width();
	var hWidth = $( "#" + hID ).width();
	var width = ( aWidth > hWidth ? aWidth : hWidth );
	$( "#" + hID ).width( width );
	$( "#" + aID ).width( width );
	if ( this.currentProblem.type === "bidding" ) {
		$( "#bw-voting-problem-button-abstain" ).show();
		$( "#bw-voting-problem-lead" ).hide();
		$( "#bw-voting-problem-call" ).show();

		auction.toBiddingBox( this.bbConfig );
	}
	else {
		$( "#bw-voting-problem-button-abstain" ).hide();
		$( "#bw-voting-problem-lead" ).show();
		$( "#bw-voting-problem-call" ).hide();		
		var prefix = "bw-card-deck";
		config = { 
			prefix: prefix,
			containerID: "bw-voting-problem-lead", 
			idPrefix: "cd",
			show: { suit: false, emptySuit: false, text: false, cards: true, countInContent: false },
			tags: Bridge.getSpanConfig( prefix ),
			alternateSuitColor: true,
			registerChangeHandler: false
		};
		hand.toHTML( config );					
	}
	
};
