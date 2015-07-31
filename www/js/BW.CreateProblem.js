/** Define a BridgeWinners namespace */
if ( typeof BW === "undefined" ) BW = {};

/**
 * A class to represent a bidding or lead problem to be voted on
 */
BW.CreateProblem = function( containerID, username ) {
	
	this.dealID = "bw-create-problem-id";
	this.stages = [
		{ name: "type", next: "Hand", previous: "Nothing back there" },
		{ name: "hand", next: "Scoring/Vul/Dealer", previous: "Type" },
		{ name: "scoring", next: "Auction", previous: "Hand" },
		{ name: "auction", next: "Extra Info", previous: "Scoring/Vul/Dealer" },
		{ name: "text", next: "Preview", previous: "Auction" },
		{ name: "preview", next: "Publish", previous: "Extra Information" }
	];
	this.containerID = containerID;
	this.itemName = "bw_" + username + "_currentCreateProblem";
	this.previewPrefix = "bw-create-problem-preview";
	
	$( document ).on( "click", "#next-stage-button", { problem: this }, function( e ) {
		e.data.problem.nextStage();
	});
	$( document ).on( "click", "#previous-stage-button", { problem: this }, function( e ) {
		e.data.problem.previousStage();
	});	
	this.stage = BW.CreateProblem.Stages.TYPE;	
	this.setupEventHandlers();
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
	this.deal = new Bridge.Deal( this.dealID );
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
	//$( "#bw-create-problem-loading" ).show();
	$( "div[data-stage]" ).hide();		
	this.loadProblem();
	this.initializeData();				
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
		urlSuffix: "create-problem/",
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
	BW.loadPage( { page: "vote" } );
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
	var prefix = "bw-create-problem-"
	var field = "type";
	var value = this.type;
	var fieldClass = prefix + field
	$( '.' + fieldClass ).prop( "checked", false );	
	$( '#' + fieldClass + '-' + value ).prop( "checked", true );	
	
	// Scoring and Info
	var fields = [ "scoring", "notes" ];
	for( var i = 0; i < fields.length; ++i ) {
		var field = fields[i];
		var fieldClass = prefix + field;
		$( '#' + fieldClass ).val( this.deal.get( field ) );
	}
	$( '#' + prefix + 'scoring' ).selectmenu( "refresh" );
	
	// Dealer and Vul
	var fields = [ "dealer", "vulnerability" ];
	_.each ( fields, function( field ) {
		var value = this.deal.get( field );
		var fieldClass = prefix + field;
		$( '.' + fieldClass ).prop( "checked", false );	
		$( '#' + fieldClass + '-' + value ).prop( "checked", true );
		$( '#' + fieldClass ).trigger( "create" );						
	}, this );
	$( '.' + prefix + "controlgroup" ).controlgroup( "refresh" );		
	
	//hand
	var hand = this.deal.getHand( this.handDirection );
	config = {
		prefix: "bw-create-hand-images",
		alternateSuitColor: true,
		show: {
			direction: false,
			name: false,
			text: false,
			suit: false
		},
		tags: Bridge.getSpanConfig( "bw-create-hand-images" ),
		data: {},
		classes: {},
		//classes: { "bw-hand-diagram": [ "bw-hand-diagram-border-top" ] },
		idPrefix: "create",
		containerID: "bw-create-problem-hand-diagram",
		registerChangeHandler: true
	};		
	hand.toHTML( config );	
	this.deal.setActiveHand( this.handDirection );				
	
	var prefix = "bw-card-deck";
	config = {
		prefix: prefix,
		containerID: "bw-create-problem-card-deck", 
		idPrefix: "cd", 
		show: { reset: true, text:false, title: false, activeHand: false, assignedTo: false }, 
		tags: Bridge.getDivConfig( prefix ),
		registerChangeHandler: true
	};	
	this.deal.toCardDeck( config );	
	
	// Auction
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
};


BW.CreateProblem.prototype.setupEventHandlers = function() {
	var selector = ".bw-create-problem-type";
	$( document ).on( "change", selector, { problem: this }, function ( e ) {
		e.data.problem.type = $( this ).data( "type" );
		e.data.problem.save();
	});	
	$( document ).on( "change", ".bw-create-problem-field", { problem: this }, function( e ) {
		var field = $( this ).data( "field" );
		if ( field === "notes" || field === "scoring" ) {
			var value = $( this ).val();
			// This is for notes
			if ( value === null ) value = '';
		}
		else if ( field === "dealer" || field === "vulnerability" ) {
			var value = $( this ).data( field );
		}
		e.data.problem.deal.set( field, value );		
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
	var selector = "div[data-stage='" + this.stages[ this.stage ].name + "']";
	$( selector ).show();	
	if ( this.stage === BW.CreateProblem.Stages.TYPE || this.stage === BW.CreateProblem.Stages.PREVIEW ) $( "#bw-create-problem-hand-diagram-container" ).hide();
	else $( "#bw-create-problem-hand-diagram-container" ).show();
	if ( this.stage === BW.CreateProblem.Stages.PREVIEW ) this.loadPreview();
	//$( "#bw-create-problem-loading" ).hide();	
	this.enableClicksAndSwipes();
	this.resize();			
};

/**
 * Resize the current page based on height and width calculations
 */
BW.CreateProblem.prototype.resize = function() {
	var totalContentHeight = $(window).height() - ( $("#myheader").height() + $("#myfooter").height() + 5);
	var ids = [ "bw-create-problem-previous-next-buttons" ];
	if ( this.stage !== BW.CreateProblem.Stages.TYPE && this.stage !== BW.CreateProblem.Stages.PREVIEW ) {
		this.resizeHandImages();
		ids.push( "bw-create-problem-hand-diagram-container" );
	}
	var fixedHeight = 0;
	_.each( ids, function( id ) {
		fixedHeight += $( "#" + id ).height();
	}, this );
	var fluidHeight = totalContentHeight - fixedHeight;	
	switch ( this.stage ) {
		case BW.CreateProblem.Stages.TYPE:
			$( "#bw-create-problem-type" ).height( fluidHeight );
			break;
		case BW.CreateProblem.Stages.HANDS:
			this.resizeCardDeck( fluidHeight );
			$( "#bw-create-problem-hand" ).height( fluidHeight );
			break;
		case BW.CreateProblem.Stages.SCORING:
			$( "#bw-create-problem-scoring-container" ).height( fluidHeight );
			break;
		case BW.CreateProblem.Stages.AUCTION:
			this.resizeFullBiddingBox( fluidHeight -35 );
			$( "#bw-create-problem-auction" ).height( fluidHeight );
			break;
		case BW.CreateProblem.Stages.TEXT:
			$( "#bw-create-problem-text" ).height( fluidHeight );
			$( "#bw-create-problem-notes" ).height( fluidHeight - 60 );
			break;
		case BW.CreateProblem.Stages.PREVIEW:
			break;
		default:
			break;
	}
};


BW.CreateProblem.prototype.resizeCardDeck = function( height ) {
	var fluidHeight = height - ( $( "#cd-bw-card-deck-footer" ).height() + $( "#bw-create-problem-card-deck-text" ).height() );
	var screenWidth = $( window ).width();
	var cardWidth = 158;
	var cardHeight = 220;	
	// Card Deck
	var styleElement = $( "#bw-create-card-deck-computed-styles" );
	var style = "";		
	var fullWidth = 13 * cardWidth;
	var scalingFactor = screenWidth/fullWidth;
	if ( scalingFactor > 1 ) scalingFactor = 1;
	var newWidth = cardWidth * scalingFactor;
	var maxHeight = cardHeight * 4;
	var newHeight = ( fluidHeight - 20 ) / 4;
	if ( newHeight > cardHeight ) {
		newHeight = cardHeight;
		varleftOverHeight = fluidHeight - maxHeight;
	}
	else {
		var leftOverHeight = 0;
	}
	style += "\t.bw-card-deck-field-cards {\n";
	style += "\t\twidth:" + newWidth + "px;\n";
	style += "\t\theight:" + newHeight + "px;\n";
	style += "\t}\n";	
	styleElement.empty().append( style );	
	
};

BW.CreateProblem.prototype.resizeHandImages = function( height ) {
	var screenWidth = $( window ).width();
	var cardWidth = 158;
	var cardHeight = 220;	
	// Hand display
	var styleElement = $( "#bw-create-hand-images-computed-styles" );
	var style = "";	
	var overlap = 0.75;
	var fullWidth = (1-overlap) * 12 * cardWidth + cardWidth;
	var scalingFactor = screenWidth/fullWidth;
	if ( scalingFactor > 1 ) scalingFactor = 1;
	var classPrefix = ".bw-create-hand-images-field-cards";
	style += "\t" + classPrefix + " {\n";
	style += "\t\twidth: " + ( cardWidth * scalingFactor ) + "px;\n";
	style += "\t\theight: " + ( cardHeight * scalingFactor ) + "px;\n";
	style += "\t}\n";
	var overlapWidth = overlap * cardWidth * scalingFactor;
	var left = 0;
	for( var i = 1; i <= 12; ++i ) {
		left += overlapWidth;
		style += "\t" + classPrefix + "-" + i + " {\n";
		style += "\t\tleft: -" + left + "px;\n";
		style += "\t}\n";
	}	
	style += "\n";		
	styleElement.empty().append( style );	
};

BW.CreateProblem.prototype.resizeFullBiddingBox = function( height ) {
	var fluidHeight = height - $( "#bw-create-problem-auction-diagram" ).height();
	var screenWidth = $( window ).width();
	var maxWidth = 394;
	if ( screenWidth > maxWidth ) screenWidth = maxWidth;	
	// Full bidding box	
	var styleElement = $( "#bw-full-bidding-box-computed-styles" );
	var style = "";
	classPrefix = ".bw-bidding-box-full-field";
	var heightRatio = 35/50;
	var width = screenWidth/5;	
	var height = fluidHeight/9;
	var fontSize = height/2;
	style += "\t" + classPrefix + " {\n";
	style += "\t\twidth: " + width + "px;\n";
	style += "\t\theight: " + height + "px;\n"
	style += "\t\tline-height: " + height + "px;\n";
	style += "\t\tfont-size: " + fontSize + "px;\n";
	style += "\t}\n";	
	
	width = screenWidth/3;
	var suffixes = [ 'p', 'x', 'r', 'allpass', 'reset', 'undo' ];
	for( var i = 0; i < suffixes.length; ++i ) {
		suffixes[i] = classPrefix + '-calls-' + suffixes[i];
	}
	style += "\t" + suffixes.join( ',' ) + " {\n";
	style += "\t\twidth: " + width + "px;\n";
	style += "\t\theight: " + height + "px;\n"
	style += "\t\tline-height: " + height + "px;\n";
	style += "\t\tfont-size: " + fontSize + "px;\n";
	style += "\t}\n";
		
	styleElement.empty().append( style );	
};

/**
 * Update the text and status of the back and forward buttons.
 * @param {string} id - the id of the button to update
 * @param {string} text - the text to set on the button
 * @param {boolean} disabled - should the button be disabled or not
 */ 
BW.CreateProblem.prototype.updateButton = function( id, text, disabled ) {
	var selector = '#' + id;
	$( selector ).empty().append( text );
	if ( disabled ) $( selector ).addClass( "ui-disabled" );
	else $( selector ).removeClass( "ui-disabled" );
};

/**
 * Construct the id based on prefix and passed name
 */
BW.CreateProblem.prototype.getID = function( name, addHash ) {
	if ( typeof addHash === "undefined" ) addHash = true;
	var id = ( addHash ? '#' : '' ) + this.previewPrefix + '-' + name;
	return id;
};

/**
 * Load data into preview
 */
BW.CreateProblem.prototype.loadPreview = function() {
	var deal = this.deal;
	var next = deal.getAuction().getNextToCall();
	// Image
	$( this.getID( "author-image" ) ).attr( "src", BW.currentUser.getAvatarLink()).attr( "alt", BW.currentUser.getName() );
	
	var seats = [ "1st", "2nd", "3rd", "4th" ];
	var position = 0;
	var dealer = deal.getDealer();
	while( dealer !== next ) {
		position++;
		dealer = Bridge.getLHO( dealer );
	}
	var fields = {
		"author-name": BW.currentUser.getName() + " asks...",
		"dealer": seats[ position ] + " Seat",
		"scoring": BW.scoringTypes[ deal.getScoring() ],
		"vulnerability": Bridge.vulnerabilities[ deal.getVulnerability() ].name + " Vul",
		"description": deal.getNotes()
	};
	for( var field in fields ) {
		var selector = this.getID( field );
		$( selector ).empty().append( fields[ field ] );		
	}	
	var deal = this.deal;
	var auction = deal.getAuction();	
	var config = {
		prefix: "bw-auction-diagram",
		show: {
			direction: true
		},
		tags: Bridge.getDivConfig( "bw-auction-diagram" ),
		data: {},
		classes: {},
		idPrefix: "pa",
		containerID: this.getID( "auction", false ),
		registerChangeHandler: false,
		addQuestionMark: true
	};	
	auction.toHTML( config );
	
	var deal = this.deal;
	var hand = deal.getHand( 's' );
	var config = {
		prefix: "bw-hand-images",
		alternateSuitColor: true,
		show: {
			direction: false,
			name: false,
			text: false,
			suit: false
		},
		tags: Bridge.getSpanConfig( "bw-hand-images" ),
		data: {},
		classes: {},
		idPrefix: "ph",
		containerID: this.getID( "hand", false ),
		registerChangeHandler: false
	};		
	hand.toHTML( config );
	
	if ( this.type === "lead" ) {
		$( this.getID( "bidding-box-level", false ) ).empty();
		$( this.getID( "bidding-box-strain", false ) ).empty();
	}
	else {
		var deal = this.deal;
		var auction = deal.getAuction();
		var prefix = "bw-bidding-box";
		var config = { 
			prefix: prefix,
			layout: "concise-level", 
			containerID: this.getID( "bidding-box-level", false ), 
			idPrefix: "l",
			show: { allpass: false, undo: false, reset: false },
			tags: Bridge.getSpanConfig( prefix ),
			registerChangeHandler: false
		};		
		auction.toBiddingBox( config );
		config = { 
			prefix: prefix,
			layout: "concise-calls", 
			containerID: this.getID( "bidding-box-strain", false ), 
			idPrefix: "s",
			show: { allpass: false, undo: false, reset: false },
			tags: Bridge.getSpanConfig( prefix ),
			registerChangeHandler: false
		};		
		auction.toBiddingBox( config );		
	}
	BW.votingProblem.resizeBiddingBox();
	var totalContentHeight = $(window).height() - ( $("#myheader").height() + $("#myfooter").height() + 7);
	var ids = [ "bw-create-problem-preview-info", "bw-create-problem-previous-next-buttons", "bw-create-problem-preview-text" ];
	if ( this.type === "bidding" ) ids.push( "bw-create-problem-preview-call" );
	var fixedHeight = 0;
	_.each( ids, function( id ) {
		console.log( id + " = " + $( "#" + id ).height() );
		fixedHeight += $( "#" + id ).height();
	}, this );
	var fluidHeight = totalContentHeight - fixedHeight;
	console.log( "total = " + totalContentHeight );
	console.log( "fixed = " + fixedHeight );
	console.log( "fluid = " + fluidHeight );	
	$( "#bw-create-problem-preview-hand" ).height( fluidHeight/2 );
	BW.votingProblem.resizeHandImages( fluidHeight/2 );
	$( "#bw-create-problem-preview-auction-description" ).height( fluidHeight/2 );	
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
			else if ( !contract.declarer || contract.getLeader() !== this.handDirection ) {
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

