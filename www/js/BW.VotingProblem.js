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
	if ( problem ) this.currentProblem = JSON.parse( problem );
	else this.currentProblem = null;
	
	// used by bidding box
	this.selectedLevel = null;
	this.selectedCall = null;
	// set by card deck
	this.selectedCard = null;
};

/**
 * Load a problem
 */
BW.VotingProblem.prototype.load = function() {
	var html = "<img class='center' src='img/ajax-loader.gif'/>";
	$( "#" + this.containerID).empty().append( html );	
	if ( this.currentProblem ) {
		this.show();
	}
	else {
		this.get();
	}
	$( '#' + BW.contentID ).trigger( "create" );
};

/**
 * Send a vote for this problem to BW server
 */
BW.VotingProblem.prototype.vote = function() {
	// Do whatever is necesary to vote
	this.currentProblem = null;		
	this.load();
};

/**
 * Skip a problem
 */
BW.VotingProblem.prototype.skip = function() {
	var problems = localStorage.getItem( "BW::votingproblems" );
	if ( !problems ) problems = "[]";
	var problemsJSON = JSON.parse( problems );
	if ( problemsJSON.length === 0 ) {
		alert( "This is the last problem you have to vote on. Can't Skip" );
		return;
	}
	var html = "<img class='center' src='img/ajax-loader.gif'/>";
	$( "#" + this.containerID).empty().append( html );	
	var newProblem = problemsJSON[0];
	problemsJSON.splice( 0, 1, this.currentProblem );
	this.currentProblem = newProblem;
	localStorage.setItem( this.itemName, JSON.stringify( this.currentProblem ) );
	localStorage.setItem( "BW::votingproblems", JSON.stringify( problemsJSON ) );
	this.show();
	$( '#' + BW.contentID ).trigger( "create" );
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
		var html = "<p class='center'>Wow, you've answered every single bridge problem on the site!  Thanks for being such an active participant!</p>";
		$( "#" + this.containerID).empty().append( html );	
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
	this.selectedLevel = null;
	this.selectedCall = null;
	this.selectedCard = null;
	var html = "";
	var deal = new Bridge.Deal();
	deal.fromJSON( this.currentProblem.deal );
    html += '<ul class="bw-voting-problem" data-role="listview" data-inset="true">';
    
    // Title - image, name, dealer, scoring, vul 
    html += '<li>';
    html += '<img class="bw-voting-problem-author-image" src="' + this.currentProblem.image + '" alt="' + this.currentProblem.name + '">';
	html += '<div class="bw-voting-problem-row bw-voting-problem-author">';
	html += '' + this.currentProblem.name + ' asks...';
	html += '</div>';
	html += '<div class="bw-voting-problem-row bw-voting-problem-information">';
	var fields = [];
	fields.push( 'Dealer ' + Bridge.directions[ deal.getDealer() ].name );
	fields.push( deal.getScoring() );
	fields.push( Bridge.vulnerabilities[ deal.getVulnerability() ].name + ' Vul' );
	_.each( fields, function( field ) {
		html += '<span class="bw-voting-problem-row bw-voting-problem-information-field ui-btn ui-mini ui-btn-inline">';
		html += field;
		html += '</span>';
	}, this );
	html += '</div>';
	//html += '</div>';    
	html += '</li>';

	// Diagrams
	html += '<li>';
	html += '<div id="bw-voting-problem-auction" class="bw-voting-problem-auction"></div>';
	html += '<div id="bw-voting-problem-hand" class="bw-voting-problem-hand"></div>';		
	html += '</li>';
	
	// Description
	html += '<li>';
	html += '<div class="bw-voting-problem-row bw-voting-problem-description">' + deal.getNotes() + '</div>';
	html += '</li>';
	
	// Voting
	html += '<li>';
	var question = "What's your " + ( this.currentProblem.type === "lead" ? "lead?" : "call?" );
	html += '<div class="bw-voting-problem-question">' + question + "</div>";
	if ( this.currentProblem.type === "lead" ) {	
		html += '<div id="bw-voting-problem-lead" class="bw-voting-problem-lead"></div>';	
	}
	else {
		html += '<div id="bw-voting-problem-call" class="bw-voting-problem-row bw-voting-problem-call"></div>';
		html += '<div class="bw-voting-problem-buttons">';
		html += '<a id="bw-voting-problem-button-abstain" class="ui-btn ui-shadow ui-corner-all ui-btn-inline">Abstain</a>';
		html += '<a id="bw-voting-problem-button-vote" class="ui-btn ui-shadow ui-corner-all ui-btn-inline ui-disabled">Vote</a>';	
		html += '</div>';		
	}
	html += '<div class="bw-voting-problem-public">';
	html += '<fieldset>';
	html += '<input type="checkbox" name="bw-voting-problem-public" id="bw-voting-problem-public" checked>';	
	html += '<label for="bw-voting-problem-public">Answer publicly</label>';
	html += '</fieldset>';	
	html += '</div>'	
	html += '</li>';
	html += '</div>';
	
	$( "#" + this.containerID).empty().append( html );	
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
	var hand = deal.getHand( BW.handDirection );
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
	/*if ( this.currentProblem.type === "lead" ) {	

	}
	else {
		
	}*/
	var aWidth = $( "#" + aID ).width();
	var hWidth = $( "#" + hID ).width();
	var width = ( aWidth > hWidth ? aWidth : hWidth );
	$( "#" + hID ).width( width );
	$( "#" + aID ).width( width );
	var predfix 
	if ( this.currentProblem.type === "bidding" ) {
		var prefix = "bw-bidding-box";
		config = { 
			prefix: prefix,
			layout: "concise", 
			containerID: "bw-voting-problem-call", 
			idPrefix: "bb",
			show: { allpass: false, undo: false, reset: false },
			tags: Bridge.getDivConfig( prefix )
		}
		auction.toBiddingBox( config );
		$( "#bw-voting-problem-call" ).on( "click", ".bw-bidding-box-field-level.enabled", { auction: auction, config: config, problem: this }, function( e ) {
			var level = _.parseInt( $( this ).data( "level" ) );
			if ( e.data.problem.selectedLevel === level ) return;
			$( "#bw-voting-problem-button-vote" ).addClass( "ui-disabled" );	
			e.data.auction.setSelectedLevel( level );
			e.data.problem.selectedCall = null;
			e.data.problem.selectedLevel = level;
			e.data.auction.toBiddingBox( e.data.config );		
			
		});
		$( "#bw-voting-problem-button-abstain" ).click( { problem: this }, function( e ) {
			var answerPublic = $( "#bw-voting-problem-public" ).prop( "checked" );
			alert( "Thanks for you vote. Abstain selected. Answer is " + ( answerPublic ? "Public" : "Not Public" ) );
			e.data.problem.vote();
		});	
		$( "#bw-voting-problem-button-vote" ).click( { problem: this }, function( e ) {
			var problem = e.data.problem;
			var call = "";
			call += ( problem.selectedLevel ? problem.selectedLevel : "" );
			call += ( problem.selectedCall ? problem.selectedCall : "" );
			if ( !Bridge.isBid( call ) ) {
				alert( "A valid call has not been selected. Please try again!" );
				return;
			}
			var answerPublic = $( "#bw-voting-problem-public" ).prop( "checked" );
			alert( "Thanks for Voting for " + call + ". Answer is " + ( answerPublic ? "Public" : "Not Public" ) );
			e.data.problem.vote();
		});
		$( "#bw-voting-problem-call" ).on( "click", ".bw-bidding-box-field-calls.enabled", { auction: auction, config: config, problem: this }, function( e ) {
			var call = $( this ).data( "suit" );
			if ( e.data.problem.selectedCall ) {
				var selector = ".bw-bidding-box-field-calls-" + e.data.problem.selectedCall;
				$( selector ).removeClass( "selected" );
			}
			e.data.problem.selectedCall = call;
			if ( !Bridge.isStrain( call ) ) {
				e.data.problem.selectedLevel = null;
				e.data.auction.unsetSelectedLevel();
				e.data.auction.toBiddingBox( e.data.config );	
			}
			var selector = ".bw-bidding-box-field-calls-" + call;
			$( selector ).addClass( "selected" );
			$( "#bw-voting-problem-button-vote" ).removeClass( "ui-disabled" );	
		});		
	}
	else {
		var prefix = "bw-card-deck";
		config = { 
			prefix: prefix,
			containerID: "bw-voting-problem-lead", 
			idPrefix: "cd",
			show: { suit: false, emptySuit: false, text: false, cards: true, countInContent: false },
			tags: Bridge.getSpanConfig( prefix ),
			registerChangeHandler: false
		};
		hand.toHTML( config );			
		var selector = ".bw-card-deck-field-cards";
		$( selector ).click( { problem: this }, function( e ) {
			var selectedCard = $( this ).data( "card" );
			var answerPublic = $( "#bw-voting-problem-public" ).prop( "checked" );
			alert( "Thanks for Voting for " + selectedCard + ". Answer is " + ( answerPublic ? "Public" : "Not Public" ) );
			e.data.problem.vote();
			
		});
	}
	
};
