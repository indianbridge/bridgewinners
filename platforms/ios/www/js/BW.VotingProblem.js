/** Define a BridgeWinners namespace */
if ( typeof BW === "undefined" ) BW = {};

/**
 * A class to represent a bidding or lead problem to be voted on
 */
BW.VotingProblem = function( containerID ) {
	this.containerID = containerID;
	this.containerPrefix = "bw-voting-problem";
	
	// used by bidding box
	this.selectedLevel = null;
	this.selectedCall = null;
	// set by card deck
	this.selectedCard = null;
	this.selectedCardOrder = null;
	
	this.parameters = {};
	this.data = null;
	this.type = null;
	this.deal = null;
	this.slug = null;
	this.backButtonParameters = null;
	
	
	/** All clicks and event handlers */	
	this.enableClicksAndSwipes();
};

/**
 * Construct the id based on prefix and passed name
 */
BW.VotingProblem.prototype.getID = function( name, addHash ) {
	if ( typeof addHash === "undefined" ) addHash = true;
	var id = ( addHash ? '#' : '' ) + this.containerPrefix + '-' + name;
	return id;
};

/**
 * Load a problem
 */
BW.VotingProblem.prototype.load = function( parameters) {
	if ( typeof parameters === "undefined" ) parameters = {};
	this.parameters = parameters;
	data = {};
	if ( parameters.hasOwnProperty( "exclude" ) ) data[ "exclude" ] = parameters.exclude;
	if ( parameters.hasOwnProperty( "slug") ) {
		var urlSuffix = "get-problem/" + parameters.slug + '/';
		var method = "GET";
	}
	else {
		var urlSuffix = "get-voting-problem/";
		var method = "POST";
	}
	
	var restParameters = {
		urlSuffix: urlSuffix,
		loadingMessage: "Getting Problem",
		method: method,
		context: this,
		data: data,
		successCallback: function( data ) {
			if ( data.hasOwnProperty( "alldone" ) && data.alldone ) {
				BW.showOneSection( "bw_voting_problem_empty" );
			}
			else {
				BW.showOneSection( "bw_voting_problem" );
				this.context.show( data );
			}			
		},
		failCallback: function( message ) { 
			$( "#bw-error-message" ).empty().append( message );
			BW.showOneSection( "bw_error" );
		}
	};
	BW.ajax( restParameters );
	return false;		
};

/**
 * Show the problem info
 */
BW.VotingProblem.prototype.showInfo = function() {
	var deal = this.deal;
	var next = deal.getAuction().getNextToCall();
	// Image
	$( this.getID( "author-image" ) ).attr( "src", this.avatarLink).attr( "alt", this.author );
	
	var seats = [ "1st", "2nd", "3rd", "4th" ];
	var position = 0;
	var dealer = deal.getDealer();
	while( dealer !== next ) {
		position++;
		dealer = Bridge.getLHO( dealer );
	}
	var fields = {
		"author-name": this.author + " asks...",
		"dealer": seats[ position ] + " Seat",
		"scoring": BW.scoringTypes[ deal.getScoring() ],
		"vulnerability": Bridge.vulnerabilities[ deal.getVulnerability() ].name + " Vul",
		"description": deal.getNotes()
	};
	for( var field in fields ) {
		var selector = this.getID( field );
		$( selector ).empty().append( fields[ field ] );		
	}	
};


/**
 * Show the problem hand
 */
BW.VotingProblem.prototype.showHand = function() {
	var deal = this.deal;
	var hand = deal.getHand( this.direction );
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
		idPrefix: "h",
		containerID: this.getID( "hand", false ),
		registerChangeHandler: false
	};		
	hand.toHTML( config );
};


/**
 * Show the problem auction
 */
BW.VotingProblem.prototype.showAuction = function() {
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
		idPrefix: "a",
		containerID: this.getID( "auction", false ),
		registerChangeHandler: false,
		addQuestionMark: true
	};	
	var aID = config.idPrefix + "-" + config.prefix;	
	auction.toHTML( config );	
};

/**
 * Show bidding box
 */
BW.VotingProblem.prototype.showBiddingBox = function() {
	
	if ( this.type === "lead" ) {
		$( this.getID( "call" ) ).hide();
		return;
	}
	else $( this.getID( "call" ) ).show();
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
};

/**
 * Show the problem auction
 */
BW.VotingProblem.prototype.showQuestion = function( show ) {
	if ( typeof show === "undefined" ) show = true;
	var id = this.getID( "question" );
	if ( !show ) $( id ).hide();
	else {
		var question = '';
		var changeVote = ( this.data.hasOwnProperty( "my_answer" ) && this.data[ "my_answer" ] );
		question += ( changeVote ? "Change" : "What is");
		question += " your " + ( this.data.type.toLowerCase() === "bidding" ? "Call" : "Lead" ) + "?";
		$( id ).empty().append( question ).show();	
	}
};

/**
 * Show the problem auction
 */
BW.VotingProblem.prototype.showAnswerPublicly = function( show ) {
	var id = this.getID( "answer-publicly-checkbox" );
	if ( typeof show === "undefined" ) show = true;
	var answerPublicly = BW.currentOptions.get( "bw-option-answerPublicly" );
	$( id ).prop( "checked", answerPublicly );
	id = this.getID( "answer-publicly" );
	if ( show ) $( id ).show();
	else $( id ).hide();
};

/**
 * Show buttons
 */
BW.VotingProblem.prototype.showButtons = function() {
	var voteButton = $( this.getID( "button-vote" ) );
	var abstainButton = $( this.getID( "button-abstain" ) );
	var skipButton = $( this.getID( "button-skip" ) );
	
	voteButton.addClass( "ui-disabled" ).show();
	
	if ( this.type === "bidding" ) abstainButton.show();
	else abstainButton.hide();
	
	if ( this.parameters.hasOwnProperty( "slug") ) skipButton.hide();
	else skipButton.show();
};

/**
 * Show back button or not
 */
BW.VotingProblem.prototype.showBackButton = function() {
	var id = $( this.getID( "button-back" ) );
	if ( this.parameters.hasOwnProperty( "source" ) ) {
		id.data( "page", this.parameters[ "source" ] ).empty().append( this.parameters[ "back-button-html" ] ).show();
	}
	else {
		id.hide();
	}
};

/**
 * Show the votes
 */
BW.VotingProblem.prototype.showVotes = function() {
	$( this.getID( "votes-container" ) ).show();
	var votesTable = BW.VotingProblem.getVotesTable( this.data );
	$( this.getID( "votes" ) ).empty().html( votesTable );
	$( this.getID( "answer-publicly-checkbox" ) ).prop( "checked", this.data.my_answer.public ).checkboxradio('refresh');
	var showResponsesButton = $( this.getID( "votes-button" ) );
	if ( this.data.my_answer.public ) {
		showResponsesButton .show();
	}
	else {
		showResponsesButton.hide();
	}	
};

/**
 * Show the VotingProblem
 * @param {string} data - the data returned for voting problem
 */
BW.VotingProblem.prototype.show = function( data ) {
	this.data = data;
	this.selectedLevel = null;
	this.selectedCall = null;
	this.selectedCard = null;
	this.selectedCardOrder = null;
	var deal = new Bridge.Deal();
	deal.disableEventTrigger();
	deal.setDealer( data.dealer );
	deal.setVulnerability( data.vulnerability );
	deal.getAuction().fromString( data.auction );
	var next = deal.getAuction().getNextToCall();
	this.direction = next;
	deal.getHand( next ).setHand( data.lin_str );
	deal.setNotes( data.description );
	deal.setScoring( data.scoring );
	this.slug = data.slug;
	this.type = data.type.toLowerCase();
	this.author = data.author;
	this.avatarLink = BW.getAvatarLink( data.avatar );
	this.deal = deal;
	
	//this.showBackButton();
	this.showInfo();
	this.showAuction();
	this.showHand();
	this.showQuestion( false );
	this.showBiddingBox();
	this.showAnswerPublicly( false );
	this.showButtons();
	var alreadyVoted = ( this.data.hasOwnProperty( "my_answer" ) && this.data[ "my_answer" ] );	
	if ( !alreadyVoted ) {
		$( this.getID( "votes-container" ) ).hide();
		
	}
	else {
		this.showVotes();
	}
	this.resize();
};

BW.VotingProblem.prototype.resizeBiddingBox = function() {
	var styleElement = $( "#bw-voting-bidding-box-computed-styles" );
	var style = "\n";
	var screenWidth = $( window ).width();
	var cardWidth = 158;
	var cardHeight = 220;
	screenWidth = screenWidth - 20;
	var maxWidth = 394;
	if ( screenWidth > maxWidth ) screenWidth = maxWidth;
	// Concise bidding box
	classPrefix = ".bw-bidding-box-field";
	var heightRatio = 40/40;
	var fontRatio = 28/40;
	var width = screenWidth/8;
	var height = width * heightRatio;
	var fontSize = width * fontRatio;
	style += "\t" + classPrefix + " {\n";
	style += "\t\twidth: " + width + "px;\n";
	style += "\t\theight: " + height + "px;\n"
	style += "\t\tline-height: " + height + "px;\n";
	style += "\t\tfont-size: " + fontSize + "px;\n";
	style += "\t}\n";
	styleElement.empty().append( style );	
};

BW.VotingProblem.prototype.resizeHandImages = function( height ) {
	var styleElement = $( "#bw-voting-hand-images-computed-styles" );
	var style = "\n";
	var screenWidth = $( window ).width();
	var cardWidth = 158;
	var cardHeight = 220;	
	var overlap = 0.75;
	var fullWidth = (1-overlap) * 12 * cardWidth + cardWidth;
	var scalingFactor = screenWidth/fullWidth;
	if ( scalingFactor > 1 ) scalingFactor = 1;
	var newWidth = cardWidth * scalingFactor;
	var newHeight = height;
	if ( newHeight > cardHeight ) newHeight = cardHeight;
	var classPrefix = ".bw-hand-images-field-cards";
	style += "\t" + classPrefix + " {\n";
	style += "\t\twidth: " + newWidth + "px;\n";
	style += "\t\theight: " + newHeight + "px;\n";
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

BW.VotingProblem.prototype.resize = function() {
	this.resizeBiddingBox();
	var alreadyVoted = ( this.data.hasOwnProperty( "my_answer" ) && this.data[ "my_answer" ] );	
	var totalContentHeight = $(window).height() - ( $("#myheader").height() + $("#myfooter").height() + 7);
	var ids = [ "bw-voting-problem-info", "bw-voting-problem-buttons"];
	if ( this.type === "bidding" ) ids.push( "bw-voting-problem-call" );
	if ( !this.parameters.hasOwnProperty( "slug") ) ids.push( "bw-recent-vote-container" );
	if ( alreadyVoted ) ids.push( "bw-voting-problem-votes-container" );
	var fixedHeight = 0;
	_.each( ids, function( id ) {
		fixedHeight += $( "#" + id ).height();
	}, this );
	var fluidHeight = totalContentHeight - fixedHeight;
	$( "#bw-voting-problem-hand" ).height( fluidHeight/2 );
	this.resizeHandImages( fluidHeight/2 );
	$( "#bw-voting-problem-auction-description" ).height( fluidHeight/2 );
};

/**
 * Get the auction for this problem.
 */
BW.VotingProblem.prototype.getAuction = function() {
	return this.deal.getAuction();
};


/**
 * Enable/Disable previous/next clicks and swipes
 */
BW.VotingProblem.prototype.enableClicksAndSwipes = function() {
	// Show public responses.
	$( document ).on( "click", "#bw-voting-problem-public-votes-button", { problem: this }, function( e ) {
		data = {};
		var problem = e.data.problem;
		var slug = problem.slug;
		var parameters = {
			urlSuffix: "get-responses/" + slug + '/',
			loadingMessage: "Getting Responses",
			method: "GET",
			context: this,
			data: data,
			successCallback: function( data ) {
				var html = "";
				var type = data.type.toLowerCase();
				for( var i = 0; i < data.responses.length; ++i ) {
					var response = data.responses[i];
					html += "<h4>";
					if ( type === "bidding" ) {
						html += Bridge.getCallHTML( response.answer_text.toLowerCase() );
					}
					else {
						html += Bridge.getCardHTML( response.answer_text.toLowerCase() );
					}
					html += "</h4>";
					for( var j = 0; j < response.public_responses.length; ++j ) {
						html += "<span class='bw-public-response'>" + response.public_responses[j] + "</span> ";
					}
					if ( response.num_private_responses >  0 ) {
						html += "<span class='bw-private-response'>" + response.num_private_responses + " private</span>";
					}
				}
				$( "#bw-poll-responses-content" ).empty().append(html);
				$( "#bw-poll-responses" ).popup( "open" );			
			},
			failCallback: function( message ) {
				var html = "";
				html += "Unable to retreive responses";
				$( "#bw-poll-responses-content" ).empty().append(html);
				$( "#bw-poll-responses" ).popup( "open" );							
			}
		};
		BW.ajax( parameters );
		return false;									
	});		
	
	// skip button clicked
	var id = this.getID( "button-skip" );
	$( document ).on( "click", id, { problem: this }, function( e ) {
		var parameters = {
			"exclude": e.data.problem.slug
		};
		e.data.problem.load( parameters );
	});
	
	// Bidding level selected
	$( document ).on( "click", ".bw-bidding-box-field-level.enabled", { problem: this }, function( e ) {
		var problem = e.data.problem;
		var level = _.parseInt( $( this ).data( "level" ) );
		if ( problem.selectedLevel === level ) return;
		var auction = problem.getAuction();
		$( problem.getID( "button-vote" ) ).addClass( "ui-disabled" );	
		auction.setSelectedLevel( level );
		problem.selectedCall = null;
		problem.selectedLevel = level;
		problem.showBiddingBox();
		//auction.toBiddingBox( e.data.problem.bbConfig );		
		
	});
	
	// Click on call
	$( document ).on( "click", ".bw-bidding-box-field-calls.enabled", { problem: this }, function( e ) {
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
			e.data.problem.showBiddingBox();	
		}
		var selector = ".bw-bidding-box-field-calls-" + call;
		$( selector ).addClass( "selected" );
		$( "#bw-voting-problem-button-vote" ).removeClass( "ui-disabled" );	
	});	
	
	// Abstain vote	
	$( document ).on( "click", "#bw-voting-problem-button-abstain", { problem: this }, function( e ) {
		var problem = e.data.problem;
		//var answerPublic = $( problem.getID( "answer-publicly-checkbox" ) ).prop( "checked" );
		var answerPublic = BW.currentOptions.get( "bw-option-answerPublicly" );
		problem.vote( null, answerPublic );
	});	
	
	// Actual vote
	$( document ).on( "click", "#bw-voting-problem-button-vote", { problem: this }, function( e ) {
		var problem = e.data.problem;
		//var answerPublic = $( problem.getID( "answer-publicly-checkbox" ) ).prop( "checked" );
		var answerPublic = BW.currentOptions.get( "bw-option-answerPublicly" );
		if ( problem.type === "bidding" ) {
			var answer = 0;
			var strain = problem.selectedCall;
			if ( strain === 'p' ) answer = 37;
			else if ( strain === 'x' ) answer = 35;
			else if ( strain === 'r' ) answer = 36;
			else {
				answer = (problem.selectedLevel - 1) * 5;
				switch ( strain ) {
					case 'n' : 
						answer++;
					case 's' : 
						answer++;			
					case 'h' : 
						answer++;			
					case 'd' : 
						answer++;	
					default:
						break;
				}
			}
			e.data.problem.vote( answer, answerPublic );
		}
		else {
			var answer = e.data.problem.selectedCardOrder;
			//var answerPublic = $( "#bw-voting-problem-public" ).prop( "checked" );
			var answerPublic = BW.currentOptions.get( "bw-option-answerPublicly" );
			e.data.problem.vote( answer, answerPublic );
		}
	});	
	
	// Lead vote
	$( document ).on( "click",  "#bw-voting-problem-hand .bw-hand-images-field-cards", { problem: this }, function( e ) {
		if ( e.data.problem.type === "lead" ) {
			var problem = e.data.problem;
			if ( problem.selectedCard ) {
				var card = $( "[data-card='" + problem.selectedCard + "']" );
				card.removeClass( "bw-card-selected" );
			}
			problem.selectedCard = $( this ).data( "card" );
			problem.selectedCardOrder = $( this ).data( "card-order" );
			var card = $( "[data-card='" + problem.selectedCard + "']" );
			card.addClass( "bw-card-selected" );
			$( "#bw-voting-problem-button-vote" ).removeClass( "ui-disabled" );
		}
	});		
	
};

/**
 * Send a vote for this problem to BW server
 */
BW.VotingProblem.prototype.vote = function( answer, answerPublic ) {
	if ( answer ) {
		var data = {
			Answer: true,
			answer: answer	
		};
	}
	else {
		if ( this.type !== "bidding" ) {
			alert( "Cannot abstain on lead problem." );
			return;
		}		
		var data = {
			Abstain: true	
		};		
	}
	if ( answerPublic ) data[ "public" ] = answerPublic;
	var parameters = {
		urlSuffix: "poll-answer/" + this.slug + '/',
		loadingMessage: "Submitting Vote",
		method: "POST",
		context: this,
		data: data,
		successCallback: function( data ) {
			parameters = {
				source: this.context.parameters.source,
				page: "view",
				slug: this.context.slug
			};
			BW.loadPage( parameters );			
		},
		failCallback: function( message ) { 
			alert( "Error : " + message ); 
			this.context.load(); 
		}
	};
	BW.ajax( parameters );
	return false;		
	
};

/**
 * Show votes
 */
BW.VotingProblem.getVotesTable = function( data ) {
	var html = '';
	html += '<table data-role="table" class="ui-responsive">';
	html += '<thead><tr><td></td><td></td><td></td><td></td></tr></thead>';
	html += '<tbody>';
	var my_answer = ( data.my_answer ? data.my_answer.answer.toLowerCase() : "" );
	var total = data.num_answers - data.num_abstentions;
	if ( data.answers.length === 0 ) {
		html += '<tr><td>No Votes</td></tr>';
	}
	for( var i = 0; i < data.answers.length; ++i ) {
		var percent = Math.round(((data.answers[i].count/total)*100));
		var answer = data.answers[i].text.toLowerCase();
		var myAnswerClass = ( answer === my_answer ? "bw-problem-my-answer" : "" );
		html += '<tr>';
		var myAnswerHTML = ( data.type.toLowerCase() === "bidding" ? Bridge.getCallHTML(answer) : Bridge.getCardHTML(answer) );
		html += '<td style="white-space: nowrap;" class="bw-problem-answer ' + myAnswerClass + '">' + myAnswerHTML + ':</td>';
		html += '<td style="white-space: nowrap;" class="' + myAnswerClass + '">' + data.answers[i].count;
		html += (data.answers[i].count > 1 ? " votes" : " vote") + '</td>';
		html += '<td style="white-space: nowrap;" class="' + myAnswerClass + '">(' + percent + '%)</td>';
		html += '<td class="bw-problem-vote-container"><span style="background-color: ' + BW.colorPalette[i] + '; width:' + percent + '%;" class="bw-problem-vote"></span></td>';
		html += '</tr>';
	}
	// Abstains
	if ( data.num_abstentions > 0 ) {
		var answer = "abstain";
		var myAnswerClass = ( answer === my_answer ? "bw-problem-my-answer" : "" );
		html += '<tr>';
		html += '<td class="bw-problem-answer ' + myAnswerClass + '">Abstentions:</td>';
		html += '<td class="' + myAnswerClass + '">' + data.num_abstentions + '</td>';
		html += '<td></td>';
		html += '<td></td>';
		html += '</tr>';		
	}
	html += '</tbody>';
	html += '</table>';	
	return html;
};
