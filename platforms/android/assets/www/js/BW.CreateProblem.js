/** Define a BridgeWinners namespace */
if ( typeof BW === "undefined" ) BW = {};

/**
 * A class to represent a bidding or lead problem to be voted on
 */
BW.CreateProblem = function( containerID ) {
	this.containerID = containerID;
	this.type = "bidding";
	this.stage = BW.CreateProblem.Stages.TYPE;
	this.deal = new Bridge.Deal();
	this.itemName = "BW::currentCreateProblem";
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
 * Show a problem
 */
BW.CreateProblem.prototype.show = function() {
	var html = "<img class='center' src='img/ajax-loader.gif'/>";
	$( "#" + this.containerID).empty().append( html );	
	this.loadStage();
	$( "#next-stage-button" ).click( { problem: this }, function( e ) {
		var problem = e.data.problem;
		problem.stage++;
		problem.save();
		problem.loadStage();
	});
	$( "#previous-stage-button" ).click( { problem: this }, function( e ) {
		var problem = e.data.problem;
		problem.stage--;
		this.save();
		this.loadStage();
	});	
	$( '#' + BW.contentID ).trigger( "create" );
};

/**
 * Load current stage
 */
BW.CreateProblem.prototype.loadStage = function() {
	switch ( this.stage ) {
		case BW.CreateProblem.Stages.TYPE:
			this.loadProblemTypeStage();
			break;
		default:
			alert( "Unknown Stage for problem" );
			break;
	}
	$( '#' + this.containerID ).trigger( "create" );
		
};

/**
 * Show problem type stage
 */
BW.CreateProblem.prototype.loadProblemTypeStage = function() {
	var html = "";
	html += '<div class="ui-field-contain">';
	html += '<fieldset data-role="controlgroup" data-type="horizontal">';
	html += '<legend>Choose Problem Type:</legend>';
	html += '<label for="bw-problem-type-bidding">Bidding</label>';
	html += '<input data-type="bidding" class="bw-problem-type" type="radio" name="bw-problem-type" id="bw-problem-type-bidding" value="bw-problem-type-bidding">';
	html += '<label for="bw-problem-type-lead">Lead</label>';
	html += '<input data-type="lead" class="bw-problem-type" type="radio" name="bw-problem-type" id="bw-problem-type-lead" value="bw-problem-type-lead">';	
	html += '</fieldset>';
	html += '</div>';
	$( '#' + this.containerID ).empty().append( html );
	var selector = "#bw-problem-type-" + this.type;
	$( selector ).prop( "checked", true );
	selector = ".bw-problem-type";
	$( selector ).change( { problem: this }, function ( e ) {
		e.data.problem.type = $( this ).data( "type" );
		e.data.problem.save();
	});
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
