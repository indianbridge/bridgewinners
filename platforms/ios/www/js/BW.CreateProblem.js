/** Define a BridgeWinners namespace */
if ( typeof BW === "undefined" ) BW = {};

/**
 * A class to represent a bidding or lead problem to be voted on
 */
BW.CreateProblem = function( containerID ) {
	this.stages = [
		{ name: "type", next: "Hand", previous: "Nothing back there" },
		{ name: "hand", next: "Scoring/Vul/Dealer", previous: "Type" },
		{ name: "scoring", next: "Auction", previous: "Hand" },
		{ name: "auction", next: "Extra Info", previous: "Scoring/Vul/Dealer" },
		{ name: "text", next: "Preview", previous: "Auction" },
		{ name: "preview", next: "Publish", previous: "Extra Information" }
	];
	this.containerID = containerID;
	this.itemName = BW.currentUser.getLocalStorageVariableName( "currentCreateProblem" );
	this.loadProblem();
};

/** 
 * Clear the partially saved problem since it is published
 */
BW.CreateProblem.prototype.clearLocalStorage = function() {
	localStorage.removeItem( this.itemName );
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

/**
 * Load the problem saved in local storage.
 */
BW.CreateProblem.prototype.loadProblem = function() {
	this.handDirection = 's';
	this.type = "bidding";
	this.stage = BW.CreateProblem.Stages.TYPE;
	this.deal = new Bridge.Deal();
	this.deal.disableEventTrigger();
	this.deal.setScoring( "Matchpoints" );
	this.deal.enableEventTrigger();	
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
 * Publish this problem on the BW Server
 */
BW.CreateProblem.prototype.publish = function() {
	var problem = this;
	var data = {};
	if ( this.type === "bidding" ) data[ "type" ] = "Bidding";
	else data[ "type" ] = "Lead";
	var deal = problem.deal;
	data[ "scoring" ] = deal.getScoring();
	data[ "vul" ] = deal.getVulnerability();
	if ( data[ "vul" ] === '-' ) data[ "vul" ] = 0;
	data[ "dealer" ] = deal.getDealer().toUpperCase();
	data[ "auction" ] = deal.getAuction().toString().toUpperCase();
	data[ "description" ] = deal.getNotes();
	var hand = problem.deal.getHand( problem.handDirection );
	for( var i = 0; i < Bridge.suitOrder.length; ++i ) {
		var field = "hand_" + i;
		data[ field ] = hand.getCards( Bridge.suitOrder[i] );
	}
	var parameters = {
		urlSuffix: "rest-api/v1/create-problem/",
		loadingMessage: "Submitting New Problem",
		method: "POST",
		context: this,
		data: data,
		successCallback: this.submitSuccessCallback,
		failCallback: function( message ) { alert( message ); }
	};
	BW.ajax( parameters );
	return false;		
};

/**
 * Submit Ajax done call back
 */
BW.CreateProblem.prototype.submitSuccessCallback = function( data ) {
	var problem = this.context;
	BW.createProblem.clearLocalStorage();
	alert( "Your problem has been published." );
	BW.loadPage( "vote.html" );
};

/**
 * Submit Ajax fail call back
 */
BW.CreateProblem.prototype.submitFailCallback = function( message ) {
	alert( message ); 
};

/**
 * Go to the next stage if allowed
 */
BW.CreateProblem.prototype.nextStage = function() {
	if ( this.stage === BW.CreateProblem.Stages.PREVIEW ) {
		this.publish();
		return;
	}
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
 * Initialize data in all fields,
 * Setup change handlers
 */
BW.CreateProblem.prototype.initializeData = function() {
	// type
	var field = "type";
	var value = this.type;
	var fieldClass = "bw-create-problem-" + field
	$( '.' + fieldClass ).prop( "checked", false );	
	$( '#' + fieldClass + '-' + value ).prop( "checked", true );
	$( '#' + fieldClass ).trigger( "create" );			
	
	//hand
	var hand = this.deal.getHand( this.handDirection );
	config = {
		prefix: "bw-hand-diagram",
		show: {
			direction: true,
			name: true,
			countInHeader: true
		},
		tags: Bridge.getDivConfig( "bw-hand-diagram" ),
		data: {},
		classes: { "bw-hand-diagram": [ "bw-hand-diagram-border-top" ] },
		idPrefix: "h",
		containerID: "bw-create-problem-hand-diagram",
		registerChangeHandler: true
	};		
	hand.toHTML( config );	
	this.deal.setActiveHand( this.handDirection );
	// Card Deck
	/*var width = $( window ).width();
	var height = $( window ).height();
	if ( width < 500 || height < 500 ) {
		var useText = true;
		var prefix = "bw-card-deck-text";
	}
	else {*/
	var useText = false;
	var prefix = "bw-card-deck";				
	//}
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
	var fields = [ "scoring", "notes" ];
	for( var i = 0; i < fields.length; ++i ) {
		var field = fields[i];
		var fieldClass = "bw-create-problem-" + field;
		$( '#' + fieldClass ).val( this.deal.get( field ) );
	}
	
	// Dealer and Vul
	var fields = [ "dealer", "vulnerability" ];
	_.each ( fields, function( field ) {
		var value = this.deal.get( field );
		var fieldClass = "bw-create-problem-" + field;
		$( '.' + fieldClass ).prop( "checked", false );	
		$( '#' + fieldClass + '-' + value ).prop( "checked", true );
		$( '#' + fieldClass ).trigger( "create" );						
	}, this );
	
	
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


BW.CreateProblem.prototype.setupEventHandlers = function() {
	var selector = ".bw-create-problem-type";
	$( selector ).change( { problem: this }, function ( e ) {
		e.data.problem.type = $( this ).data( "type" );
		e.data.problem.save();
	});	
	$( ".bw-create-problem-field" ).change( { deal: this.deal }, function( e ) {
		var field = $( this ).data( "field" );
		if ( field === "notes" || field === "scoring" ) {
			var value = $( this ).val();
			// This is for notes
			if ( value === null ) value = '';
		}
		else if ( field === "dealer" || field === "vulnerability" ) {
			var value = $( this ).data( field );
		}
		e.data.deal.set( field, value );		
	});	
	var event = "deal:changed.create_problem";
	$( document ).off( event );
	$( document ).on( event, { problem: this }, function( e, deal ) {
		if ( e.data.problem.deal === deal )	{
			e.data.problem.enableClicksAndSwipes();
			e.data.problem.save();
		}
	});	
};

/**
 * Load current stage
 */
BW.CreateProblem.prototype.loadStage = function() {
	$( "div[data-stage]" ).hide();
	var selector = "div[data-stage='" + this.stages[ this.stage].name + "']";
	$( selector ).show();	
	if ( this.stage === BW.CreateProblem.Stages.TYPE || this.stage === BW.CreateProblem.Stages.PREVIEW ) $( "#bw-create-problem-hand-diagram-container" ).hide();
	else $( "#bw-create-problem-hand-diagram-container" ).show();
	if ( this.stage === BW.CreateProblem.Stages.PREVIEW ) this.loadPreview();
	$( "#bw-create-problem-loading" ).hide();	
	this.enableClicksAndSwipes();			
};

BW.CreateProblem.prototype.updateButton = function( id, text, disabled ) {
	var selector = '#' + id;
	$( selector ).empty().append( text );
	if ( disabled ) $( selector ).addClass( "ui-disabled" );
	else $( selector ).removeClass( "ui-disabled" );
};

/**
 * Load data into preview
 */
BW.CreateProblem.prototype.loadPreview = function() {
	var deal = this.deal;
	$( "#bw-voting-problem-author-image" ).attr( "src", BW.currentUser.getAvatarLink() ).attr( "alt", BW.currentUser.getName() );
	var fields = {
		"author-name": BW.currentUser.getName() + " asks...",
		"dealer": "Dealer " + Bridge.directions[ deal.getDealer() ].name,
		"scoring": BW.scoringTypes[ deal.getScoring() ],
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
	var hand = deal.getHand( this.handDirection );
	config = {
		prefix: "bw-hand-diagram",
		show: {
			direction: true,
			name: true
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
};

/**
 * Enable/Disable previous/next clicks and swipes
 */
BW.CreateProblem.prototype.enableClicksAndSwipes = function() {
	// Turn off Swipes to be updated based on state
	$( '#' + this.containerID ).off( "swipeleft" );
	$( '#' + this.containerID ).off( "swiperight" );	
	
	// Clicks
	// Previous
	var text = this.stages[ this.stage].previous;
	var disabled = ( this.stage === BW.CreateProblem.Stages.TYPE );
	var id = "previous-stage-button";
	text = "Back";
	this.updateButton( id, text, disabled );
	if ( disabled ) $( '#' + id ).hide();
	else $( '#' + id ).show();
	if ( !disabled ) {
		$( '#' + this.containerID ).on( "swiperight", { problem: this }, function( e ) {
			e.data.problem.previousStage();
		});			
	}
	
	// Next
	text = this.stages[ this.stage].next;
	disabled = false;
	id = "next-stage-button";
	if ( this.stage === BW.CreateProblem.Stages.HANDS && this.deal.getHand( this.handDirection ).getCount() !== 13 ) {
		disabled = true;
		text = "Not enough cards!";
	}
	else if ( this.stage === BW.CreateProblem.Stages.AUCTION ) {
		if ( this.type === "bidding" ) {
			var auction = this.deal.getAuction();
			if ( auction.getContract().isComplete ) {
				disabled = true;
				text = "Auction complete!";		
			}
			else if ( auction.getNextToCall() !== this.handDirection ) {
				disabled = true;
				text = Bridge.directions[ this.handDirection ].name + " is not next to call";						
			}
		}
		else if ( this.type === "lead" ) {
			var contract = this.deal.getAuction().getContract();
			if ( !contract.isComplete ) {
				disabled = true;
				text = "Auction incomplete!";		
			}
			else if ( contract.getLeader() !== this.handDirection ) {
				disabled = true;
				text = Bridge.directions[ this.handDirection ].name + " is not on lead";					
			}				
		}		
	}
	if ( this.stage !== BW.CreateProblem.Stages.PREVIEW ) text = "Continue";
	this.updateButton( id, text, disabled );
	if ( !disabled ) {
		$( '#' + this.containerID ).on( "swipeleft", { problem: this }, function( e ) {
			e.data.problem.nextStage();
		});			
	}
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
