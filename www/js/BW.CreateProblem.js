/** Define a BridgeWinners namespace */
if ( typeof BW === "undefined" ) BW = {};

/**
 * A class to represent a bidding or lead problem to be voted on
 */
BW.CreateProblem = function( containerID ) {
	this.stages = [ "type", "hand", "scoring", "auction", "text", "preview" ];
	this.containerID = containerID;
	this.itemName = "BW::currentCreateProblem";	
	this.loadProblem();
};

BW.CreateProblem.prototype.loadProblem = function() {
	this.type = "bidding";
	this.stage = BW.CreateProblem.Stages.TYPE;
	this.deal = new Bridge.Deal();
	var problem = localStorage.getItem( this.itemName );
	if ( problem ) {
		problemJSON = JSON.parse( problem );
		this.type = problemJSON.type;
		this.stage = problemJSON.stage;
		this.deal.disableEventTrigger();
		this.deal.fromJSON( problemJSON.deal );	
		this.deal.enableEventTrigger();		
	}	
};

/**
 * Go to the next stage if allowed
 */
BW.CreateProblem.prototype.nextStage = function() {
	if ( this.stage === BW.CreateProblem.Stages.PREVIEW ) return;
	this.stage++;
	this.save();
	this.loadStage();
};

/**
 * Go to the previous stage if allowed
 */
BW.CreateProblem.prototype.previousStage = function() {
	if ( this.stage === BW.CreateProblem.Stages.TYPE ) return;
	this.stage--;
	this.save();
	this.loadStage();
};

/**
 * Enable/Disable previous/next clicks and swipes
 */
BW.CreateProblem.prototype.enableClicksAndSwipes = function() {
	$( '#' + this.containerID ).off( "swipeleft" );
	$( '#' + this.containerID ).off( "swiperight" );
	if ( this.stage === BW.CreateProblem.Stages.TYPE ) $( "#previous-stage-button" ).addClass( "ui-disabled" );
	else {
		$( "#previous-stage-button" ).removeClass( "ui-disabled" );
		$( '#' + this.containerID ).on( "swiperight", { problem: this }, function( e ) {
			e.data.problem.previousStage();
		});			
	}
	if ( this.stage === BW.CreateProblem.Stages.PREVIEW ) $( "#next-stage-button" ).addClass( "ui-disabled" );
	else {
		$( "#next-stage-button" ).removeClass( "ui-disabled" );	
		$( '#' + this.containerID ).on( "swipeleft", { problem: this }, function( e ) {
			e.data.problem.nextStage();
		});		
	}
};


BW.CreateProblem.prototype.setupEventHandlers = function() {
	var selector = ".bw-create-problem-type";
	$( selector ).change( { problem: this }, function ( e ) {
		e.data.problem.type = $( this ).data( "type" );
		e.data.problem.save();
	});	
	$( ".deal-info" ).change( { deal: this.deal }, function( e ) {
		var field = $( this ).attr( "field" );
		var value = $( this ).val();
		// This is for notes
		if ( value === null ) value = '';
		e.data.deal.set( field, value );		
	});	
	var event = "deal:changed.create_problem";
	$( document ).off( event );
	$( document ).on( event, { problem: this }, function( e, deal ) {
		if ( e.data.problem.deal === deal )	e.data.problem.save();
	});	
	
	// Preview
	$( "#bw-create-problem-publish-button" ).click( { problem: this }, function( e ) {
		var problem = e.data.problem;
		alert( "Your problem has been published." );
		localStorage.removeItem( problem.itemName );
		problem.loadProblem();
		problem.initializeData();
		problem.loadStage();
	});	
};
/**
 * Initialize data in all fields,
 * Setup change handlers
 */
BW.CreateProblem.prototype.initializeData = function() {
	// type
	var selector = ".bw-create-problem-type";
	$( selector ).prop( "checked", false );	
	selector = "#bw-create-problem-type-" + this.type;
	$( selector ).prop( "checked", true );
	$( "#bw-create-problem-type" ).trigger( "create" );	
	
	//hand
	var hand = this.deal.getHand( BW.handDirection );
	config = {
		prefix: "bw-hand-diagram",
		show: {
			direction: false,
			name: false
		},
		tags: Bridge.getDivConfig( "bw-hand-diagram" ),
		data: {},
		classes: { "bw-hand-diagram": [ "bw-hand-diagram-border-top" ] },
		idPrefix: "h",
		containerID: "bw-create-problem-hand-diagram",
		registerChangeHandler: true
	};		
	hand.toHTML( config );	
	this.deal.setActiveHand( BW.handDirection );
	// Card Deck
	var width = $( window ).width();
	var height = $( window ).height();
	if ( width < 500 || height < 500 ) {
		var useText = true;
		var prefix = "bw-card-deck-text";
	}
	else {
		var useText = false;
		var prefix = "bw-card-deck";				
	}
	config = {
		prefix: prefix,
		containerID: "bw-create-problem-card-deck", 
		idPrefix: "cd", 
		show: { reset: true, text:useText, title: false, activeHand: false, assignedTo: false }, 
		tags: Bridge.getDivConfig( prefix ),
		registerChangeHandler: true
	};	
	this.deal.toCardDeck( config );		
	
	// Scoring and Info
	var fields = [ "scoring", "dealer", "vulnerability" ];
	for( var i = 0; i < fields.length; ++i ) {
		var field = fields[i];
		$( '#' + field ).val( this.deal.get( field ) );
	}
	
	
	// Auction
	// Get the auction
	var auction = this.deal.getAuction();
	config = {
		prefix: "bw-auction-diagram",
		tags: Bridge.getDivConfig( "bw-auction-diagram" ),
		idPrefix: "a",
		show: {
			direction: true
		},
		containerID: "bw-create-problem-auction-diagram",
		registerChangeHandler: true,
		addQuestionMark: true
	};	
	auction.toHTML( config );
	
	// Setup bidding box
	config = {
		layout: "full",
		prefix: "bw-bidding-box-full",
		tags: Bridge.getDivConfig( "bw-bidding-box-full" ),
		idPrefix: "bb",
		containerID: "bw-create-problem-bidding-box",
		registerChangeHandler: true
	};		
	auction.toBiddingBox( config );
	
	// Text
	var field = "notes";
	$( '#' + field ).val( this.deal.get( field ) );
	

		
};

/**
 * Load data into preview
 */
BW.CreateProblem.prototype.loadPreview = function() {
	var deal = this.deal;
	$( "#bw-voting-problem-author-image" ).attr( "src", BW.currentUser.getImage() ).attr( "alt", BW.currentUser.getName() );
	var fields = {
		"author-name": BW.currentUser.getName() + " asks...",
		"dealer": "Dealer " + Bridge.directions[ deal.getDealer() ].name,
		"scoring": deal.getScoring(),
		"vulnerability": Bridge.vulnerabilities[ deal.getVulnerability() ].name + " Vul",
		"description": deal.getNotes()
	};
	for( var field in fields ) {
		var selector = "#bw-voting-problem-" + field;
		$( selector ).empty().append( fields[ field ] );		
	}
	
	var question = "What's your " + ( this.type === "bidding" ? "Call" : "Lead" ) + "?";
	$( "#bw-voting-problem-question" ).empty().append( question );	
	
	var auction = this.deal.getAuction();
	var config = {
		prefix: "bw-auction-diagram",
		show: {
			direction: true
		},
		tags: Bridge.getDivConfig( "bw-auction-diagram" ),
		data: {},
		classes: {},
		idPrefix: "ap",
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
		idPrefix: "hp",
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
	
	var publishButtonDisabled = true;
	var publishButtonText = "Publish";
	if ( hand.getCount() !== 13 ) {
		publishButtonText = "Hand does not have 13 cards";
	}
	else {
		if ( this.type === "bidding" && auction.getContract().isComplete ) {
			publishButtonText = "Auction cannot be complete for bidding problem";
		}
		else if ( this.type === "lead" && !auction.getContract().isComplete ) {
			publishButtonText = "Auction has to be complete for lead problem";
		}
		else publishButtonDisabled = false;
	}
	$( "#bw-create-problem-publish-button" ).prop( "disabled", publishButtonDisabled );
	$( "#bw-create-problem-publish-button" ).empty().append( publishButtonText );
};

/**
 * Initializing create page
 */
BW.CreateProblem.prototype.initialize = function() {
	$( "#bw-create-problem-loading" ).show();
	$( "div[data-stage]" ).hide();
	$( "#next-stage-button" ).click( { problem: this }, function( e ) {
		e.data.problem.nextStage();
	});
	$( "#previous-stage-button" ).click( { problem: this }, function( e ) {
		e.data.problem.previousStage();
	});					
	this.initializeData();
	this.setupEventHandlers();
	this.loadStage();
};

/**
 * Load current stage
 */
BW.CreateProblem.prototype.loadStage = function() {
	$( "div[data-stage]" ).hide();
	var selector = "div[data-stage='" + this.stages[ this.stage] + "']";
	$( selector ).show();	
	if ( this.stage === BW.CreateProblem.Stages.PREVIEW ) this.loadPreview();
	$( "#bw-create-problem-loading" ).hide();	
	this.enableClicksAndSwipes();			
};

/**
 * Save a problem
 */
BW.CreateProblem.prototype.save = function() {
	var problemJSON = {
		type: this.type,
		stage: this.stage,
		deal: this.deal.toJSON()
	};
	localStorage.setItem( this.itemName, JSON.stringify( problemJSON ) );
};

/**
 * Mimicking an enum for stages
 */
BW.CreateProblem.Stages = {
	TYPE: 0,
	HANDS: 1,
	SCORING: 2,
	AUCTION: 3,
	TEXT: 4,
	PREVIEW: 5
};
