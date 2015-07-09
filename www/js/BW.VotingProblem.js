/** Define a BridgeWinners namespace */
if ( typeof BW === "undefined" ) BW = {};

/**
 * A class to represent a bidding or lead problem to be voted on
 */
BW.VotingProblem = function( containerID ) {
	this.containerID = containerID;
	
	// used by bidding box
	this.selectedLevel = null;
	this.selectedCall = null;
	// set by card deck
	this.selectedCard = null;
	this.selectedCardOrder = null;
	this.setProblemType( "new" );
	
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
	this.type = null;
	this.deal = null;
	this.slug = null;
};

/**
 * Select the type of problem new voting or already voted problem
 */
BW.VotingProblem.prototype.setProblemType = function( type ) {
	if ( type === "new" ) {
		this.showSkip = true;
		this.showVotes = false;	
	}
	else {
		this.showSkip = false;
		this.showVotes = true;			
	}
};	

BW.VotingProblem.prototype.showRecentProblem = function() {
	var html = "Loading Recent Answer";
	$( "#bw-voting-problem-recent" ).empty().append( html ).show();
	var url = encodeURI(BW.sitePrefix + 'rest-api/v1/get-recent-answers/');
	var request = $.ajax({
	  method: "POST",
	  context: this,
	  url: url,
	  headers: {'Authorization': 'Token ' + BW.currentUser.getAccessToken() },
	  data: { start:0, end:0 }
	});	
	request.done(function( data ) {
		var answers = data.recent_answers;
		if ( answers.length === 0 ) {
			html = "You have not voted on any problems yet!";
			$( "#bw-voting-problem-recent" ).empty().append( html );
		}
		else {
			var hand = new Bridge.Hand( 'n' );
			hand.setHand(answers[0].lin_str);
			html = hand.toHTML();
			if ( answers[0].answer !== "Abstain" ) {
				if ( answers[0].type === "Bidding" ) html += ' ' + Bridge.getCallHTML(answers[0].answer);
				else if ( answers[0].type === "Lead" ) html += ' ' + Bridge.getCardHTML(answers[0].answer);
				html += ' ' + answers[0].percent + '%';
			}
			else html +=  ' ' + answers[0].answer;
			html = '<a class="ui-btn" role="page" data-name="view" data-page="view.html" data-slug="' + answers[0].slug + '">' + html + '</a>';
			$( "#bw-voting-problem-recent" ).empty().append( html );
		}
	});
	request.fail(function(jqXHR, textStatus, errorThrown){ 
		html = "Unable to load Recent Answer";
		$( "#bw-voting-problem-recent" ).empty().append( html );
	});		
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
BW.VotingProblem.prototype.initialize = function( slug ) {
	if ( slug ) {
		this.setProblemType( "old" );	
	}
	else {
		this.setProblemType( "new" );	
	}
	this.enableClicksAndSwipes();
	if ( slug ) {
		this.loadSpecificProblem( slug );
	}
	else {
		this.load();
	}
};

/**
 * Load a problem
 */
BW.VotingProblem.prototype.load = function( exclude ) {
	if ( typeof exclude === "undefined" ) exclude = false;
	this.showOneSection( "loading" );	
	this.showRecentProblem();
	/*$.mobile.loading( "show", {
	  text: "Getting Voting Problem",
	  textVisible: true
	});	*/
	BW.showLoadingDialog( "Getting Voting Problem" );
	data = {};
	if ( exclude && this.slug ) data[ "exclude" ] = this.slug
	var url = encodeURI(BW.sitePrefix + 'rest-api/v1/get-voting-problem/');
	var request = $.ajax({
	  method: "POST",
	  context: this,
	  url: url,
	  headers: {'Authorization': 'Token ' + BW.currentUser.getAccessToken() },
	  data: data
	});	
	request.done(function( data ) {
		if ( data.alldone ) {
			this.showOneSection( "empty" );
			BW.hideLoadingDialog();
			//$.mobile.loading( "hide" );
		}
		else {
			this.show( data );
			BW.hideLoadingDialog();
			//$.mobile.loading( "hide" );
		}
	});
	request.fail(function(jqXHR, textStatus, errorThrown){ 
		this.showOneSection( "error" );
		BW.hideLoadingDialog();
		//$.mobile.loading( "hide" );
	});	
};


/**
 * Load a problem
 */
BW.VotingProblem.prototype.loadSpecificProblem = function( slug ) {	
	this.showOneSection( "loading" );	
	/*$.mobile.loading( "show", {
	  text: "Getting Problem",
	  textVisible: true
	});*/	
	BW.showLoadingDialog( "Getting Problem" );
	data = {};
	var url = encodeURI(BW.sitePrefix + 'rest-api/v1/get-problem/' + slug + '/');
	var request = $.ajax({
	  method: "GET",
	  context: this,
	  url: url,
	  headers: {'Authorization': 'Token ' + BW.currentUser.getAccessToken() }
	});	
	request.done(function( data ) {
		this.show( data );
		BW.hideLoadingDialog();
		//$.mobile.loading( "hide" );
	});
	request.fail(function(jqXHR, textStatus, errorThrown){ 
		this.showOneSection( "error" );
		BW.hideLoadingDialog();
		//$.mobile.loading( "hide" );
	});	
};


/**
 * Show the list of problems
 */
BW.VotingProblem.prototype.showList = function() {
	this.showOneSection( "loading" );
	/*$.mobile.loading( "show", {
	  text: "Getting Problem List",
	  textVisible: true
	});	*/
	BW.showLoadingDialog( "Getting Recent Problem List" );
	data = {
		start:0,
		end: 9
	};
	var url = encodeURI(BW.sitePrefix + 'rest-api/v1/get-recent-answers/' );
	var request = $.ajax({
	  method: "POST",
	  context: this,
	  url: url,
	  data: data,
	  headers: {'Authorization': 'Token ' + BW.currentUser.getAccessToken() }
	});	
	request.done(function( data ) {
		var answers = data.recent_answers;
		var html = "";
		if ( answers.length <= 0 ) {
			html += "<h4>You have not voted on any problems yet!</h4>";
		}
		else {
			html += "<ul data-role='listview' data-inset='false'>";
			_.each( answers, function( answer ) {
				html += "<li data-icon='false'><a role='page' data-page='view.html' data-slug='" + answer.slug + "'>";
				var icon = ( answer.type.toLowerCase() === "bidding" ? "img/Box-Red.png" : "img/cardback.png" );	
				var avatarLink = BW.sitePrefix + answer.avatar;
				html += '<img src="' + icon + '" class="ui-li-icon"/>';
				html += '<div>';
				var hand = new Bridge.Hand( 'n' );
				hand.setHand(answer.lin_str);
				html += hand.toHTML();
				html += '</div>';
				html += '<div>';
				html += '<img src="' + avatarLink + '"/> ';
				html += answer.author + '</div>';
				var suffix = ( answer.num_answers === 1 ? "vote" : "votes" );
				html += '<span class="ui-li-count">' + answer.num_answers + ' ' + suffix + '</span>';	
				html += '</a></li>';			
			}, this );			
			html += "</ul>";			
		}
		$( "#bw-voting-problem-list-contents" ).empty().append( html );	
		$( "#bw-voting-problem-list-contents" ).trigger( "create" );
		this.showOneSection( "list" );
		BW.hideLoadingDialog();
		//$.mobile.loading( "hide" );
	});
	request.fail(function(jqXHR, textStatus, errorThrown){ 
		this.showOneSection( "error" );
		BW.hideLoadingDialog();
		//$.mobile.loading( "hide" );
	});		
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
		var answerPublic = $( "#bw-voting-problem-public" ).prop( "checked" );
		e.data.problem.abstain( answerPublic );
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
		problem.selectedCardOrder = $( this ).data( "card-order" );
		$( "[data-card='" + problem.selectedCard + "']" ).addClass( "bw-card-deck-selected" );
		$( "#bw-voting-problem-button-vote" ).removeClass( "ui-disabled" );
	});
	$( "#bw-voting-problem-button-vote" ).click( { problem: this }, function( e ) {
		var answerPublic = $( "#bw-voting-problem-public" ).prop( "checked" );
		var problem = e.data.problem;
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
			var answerPublic = $( "#bw-voting-problem-public" ).prop( "checked" );
			e.data.problem.vote( answer, answerPublic );
		}
	});	
	
};

/**
 * Send a vote for this problem to BW server
 */
BW.VotingProblem.prototype.vote = function( answer, answerPublic ) {
	
	/*$.mobile.loading( "show", {
	  text: "Submitting Vote",
	  textVisible: true
	});*/
	BW.showLoadingDialog( "Submitting Vote" );
	data = {
		Answer: true,
		answer: answer	
	};
	if ( answerPublic ) data[ "public" ] = answerPublic;
	var url = encodeURI(BW.sitePrefix + 'rest-api/v1/poll-answer/' + this.slug + '/');
	var request = $.ajax({
	  method: "POST",
	  context: this,
	  url: url,
	  headers: {'Authorization': 'Token ' + BW.currentUser.getAccessToken() },
	  data: data
	});	
	request.done(function( data ) {
		BW.hideLoadingDialog();
		//$.mobile.loading( "hide" );
		parameters = {
			"slug": this.slug
		};
		BW.loadPage( "view.html", parameters );
	});
	request.fail(function(jqXHR, textStatus, errorThrown) {
		BW.hideLoadingDialog(); 
		alert( "There is error when submitting Vote." );
		//$.mobile.loading( "hide" );
		this.load();
	});		
};

/**
 * Send an abstain vote for this problem to BW server
 */
BW.VotingProblem.prototype.abstain = function( answerPublic ) {
	if ( this.type !== "bidding" ) {
		alert( "Cannot abstain on lead problem." );
		return;
	}
	/*$.mobile.loading( "show", {
	  text: "Submitting Abstain Vote",
	  textVisible: true
	});	*/
	BW.showLoadingDialog( "Submitting Abstain Vote" );
	data = {
		Abstain: true	
	};
	if ( answerPublic ) data[ "public" ] = answerPublic;
	var url = encodeURI(BW.sitePrefix + 'rest-api/v1/poll-answer/' + this.slug + '/');
	var request = $.ajax({
	  method: "POST",
	  context: this,
	  url: url,
	  headers: {'Authorization': 'Token ' + BW.currentUser.getAccessToken() },
	  data: data
	});	
	request.done(function( data ) {
		BW.hideLoadingDialog();
		//$.mobile.loading( "hide" );
		this.load();
	});
	request.fail(function(jqXHR, textStatus, errorThrown) { 
		BW.hideLoadingDialog();
		alert( "There is error when submitting Abstain Vote." );
		//$.mobile.loading( "hide" );
		this.load();
	});	
};

/**
 * Skip a problem
 */
BW.VotingProblem.prototype.skip = function() {
	this.load( true );
};

/**
 * Show all the votes
 */
BW.VotingProblem.prototype.showAllVotes = function( data ) {
	if ( data.my_answer ) {
		var html = '';
		html += '<table data-role="table" class="ui-responsive">';
		html += '<thead><tr><td></td><td></td><td></td><td></td></tr></thead>';
		html += '<tbody>';
		var my_answer = data.my_answer.answer.toLowerCase();
		var total = data.num_answers - data.abstentions;
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
		if ( data.abstentions > 0 ) {
			var answer = "abstain";
			var myAnswerClass = ( answer === my_answer ? "bw-problem-my-answer" : "" );
			html += '<tr>';
			html += '<td class="bw-problem-answer ' + myAnswerClass + '">Abstentions:</td>';
			html += '<td class="' + myAnswerClass + '">' + data.abstentions + '</td>';
			html += '<td></td>';
			html += '<td></td>';
			html += '</tr>';		
		}
		html += '</tbody>';
		html += '</table>';
		$( "#bw-voting-problem-votes" ).empty().append( html );
		$( "#bw-problem-vote-title" ).show();
		$( "#bw-voting-problem-public" ).prop( "checked", data.my_answer.public ).checkboxradio('refresh');
		if ( data.my_answer.public ) {
			$( "#bw-public-votes-button" ).show();
			$( "#bw-public-votes-button" ).click( { slug: data.slug }, function( e ) {
				/*$.mobile.loading( "show", {
				  text: "Getting Responses",
				  textVisible: true
				});*/
				BW.showLoadingDialog( "Getting Responses" );
				data = {};
				var url = encodeURI(BW.sitePrefix + 'rest-api/v1/get-responses/' + e.data.slug + '/');
				var request = $.ajax({
					method: "GET",
					context: this,
					url: url,
					headers: {'Authorization': 'Token ' + BW.currentUser.getAccessToken() }
				});	
				request.done(function( data ) {
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
					BW.hideLoadingDialog();
					$( "#poll-responses-content" ).empty().append(html);
					$( "#poll-responses" ).popup( "open" );						
					//$.mobile.loading( "hide" );
				});
				request.fail(function(jqXHR, textStatus, errorThrown){ 
					var html = "";
					html += "Unable to retreive responses";
					$( "#poll-responses-content" ).empty().append(html);
					$( "#poll-responses" ).popup( "open" );	
					BW.hideLoadingDialog();				
					//$.mobile.loading( "hide" );
				});					
			});	
		}
		else {
			$( "#bw-public-votes-button" ).hide();
		}
	}
	else {
		$( "#bw-public-votes-button" ).hide();
		$( "#bw-problem-vote-title" ).hide();
	}
};


/**
 * Show the VotingProblem
 * @param {string} data - the data returned for voting problem
 */
BW.VotingProblem.prototype.show = function( data ) {
	this.showOneSection( "data" );
	this.selectedLevel = null;
	this.selectedCall = null;
	this.selectedCard = null;
	this.selectedCardOrder = null;
	var deal = new Bridge.Deal();
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
	this.avatarLink = BW.sitePrefix + data.avatar;
	this.deal = deal;
	
	// Image
	$( "#bw-voting-problem-author-image" ).attr( "src", this.avatarLink).attr( "alt", this.author );
	
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
		var selector = "#bw-voting-problem-" + field;
		$( selector ).empty().append( fields[ field ] );		
	}
	var question = '';
	question += (this.showVotes ? "Change" : "What's");
	question += " your " + ( this.type === "bidding" ? "Call" : "Lead" ) + "?";
	$( "#bw-voting-problem-question" ).empty().append( question );
	$( "#bw-voting-problem-public" ).prop( "checked", BW.currentOptions.get( "bw-option-answerPublicly" ) );
	
	if ( this.showSkip ) {
		$( "#skip-button" ).show().removeClass( "ui-disabled" );
		$( "#skip-button" ).off( "click" );
		$( "#skip-button" ).click( {problem: this }, function( e ) {
			e.data.problem.skip();
		});
	}
	else {
		$( "#skip-button" ).hide();
	}
	if ( this.showVotes ) {
		this.showAllVotes( data );
	}
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
	var hand = deal.getHand( this.direction );
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
	if ( this.type === "bidding" ) {
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
