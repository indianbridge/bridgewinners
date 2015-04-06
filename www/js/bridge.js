/**
 * Bridge Namespace
 * @namespace
 * @property {object} directions - The compass directions
 * @property {array} directionOrder - directions in order they should be presented
 * @property {object} suits - The suits of cards
 * @property {array} suitOrder - The suits in order of priority
 * @property {object} ranks - The ranks of cards
 * @property {array} rankOrder - The ranks in order of priority
 * @property {object} vulnerabilities - The list of possible vulnerabilities
 */
var Bridge = {
	directions : { 
		'n' : { name : 'North', lho: 'e', rho: 'w', cho: 's', index: 0, html: 'North' },
		'e' : { name : 'East',  lho: 's', rho: 'n', cho: 'w', index: 1, html: 'East' },
		's' : { name : 'South', lho: 'w', rho: 'e', cho: 'n', index: 2, html: 'South' },
		'w' : { name : 'West',  lho: 'n', rho: 's', cho: 'e', index: 3, html: 'West' }
	},
	directionOrder: [],

	suits : {
		's' : { name : 'Spades', index : 0, html : '<font color="000000">&spades;</font>' }, 
		'h' : { name : 'Hearts', index : 1, html : '<font color="CB0000">&hearts;</font>' }, 
		'd' : { name : 'Diamonds', index : 2, html : '<font color="CB0000">&diams;</font>' }, 
		'c' : { name : 'Clubs', index : 3, html : '<font color="000000">&clubs;</font>' }
	},
	suitOrder: [],
	
	calls : {
		'n' : { name : 'No Trump', index : 0, bid: true, html : '<font color="000000">NT</font>' }, 
		's' : { name : 'Spades', index : 1, bid: true, html : '<font color="000000">&spades;</font>' }, 
		'h' : { name : 'Hearts', index : 2, bid: true, html : '<font color="CB0000">&hearts;</font>' }, 
		'd' : { name : 'Diamonds', index : 3, bid: true, html : '<font color="CB0000">&diams;</font>' }, 
		'c' : { name : 'Clubs', index : 4, bid: true, html : '<font color="000000">&clubs;</font>' },	
		'p' : { name : 'Pass', index : 5, bid: false, html : '<font color="green">P</font>' }, 
		'x' : { name : 'Double', index : 6, bid: false, html : '<font color="red">X</font>' }, 
		'r' : { name : 'Redouble', index : 7, bid: false, html : '<font color="blue">XX<font>' }
	},	
	callOrder: [],

	ranks : { 
		'a' : { name : 'Ace',	index : 0, html: 'A' }, 
		'k' : { name : 'King',	index : 1, html: 'K' }, 
		'q' : { name : 'Queen',	index : 2, html: 'Q' }, 
		'j' : { name : 'Jack',	index : 3, html: 'J' }, 
		't' : { name : 'Ten',	index : 4, html: 'T' }, 
		'9' : { name : 'Nine',	index : 5, html: '9' }, 
		'8' : { name : 'Eight',	index : 6, html: '8' }, 
		'7' : { name : 'Seven',	index : 7, html: '7' }, 
		'6' : { name : 'Six',	index : 8, html: '6' }, 
		'5' : { name : 'Five',	index : 9, html: '5' }, 
		'4' : { name : 'Four',	index : 10, html: '4' }, 
		'3' : { name : 'Three',	index : 11, html: '3' }, 
		'2' : { name : 'Two',	index : 12, html: '2' }
	},
	rankOrder: [],
	
	vulnerabilities : {
		'-' : { name: 'None', index: 0, html: 'None' },
		'n' : { name: 'NS', index: 0, html: 'North-South' },
		'e' : { name: 'EW', index: 0, html: 'East-West' },
		'b' : { name: 'Both', index: 0, html: 'Both' }
	}
};

/** Should context be prepended to error message. */
Bridge.useContext = false;

/**
 * Get the LHO of the specified direction.
 * No check is performed since it is assumed caller will check this is a valid direction.
 * @param {string} direction - the direction whose LHO is needed.
 * @return {string} the lho of specified direction
 */
Bridge.getLHO = function( direction ) { return Bridge.directions[ direction ].lho; }

/**
 * Convert to a valid identifier.
 * @param {string} text - the text to make an identifier
 */
Bridge.makeIdentifier = function(text) {
  text = text.trim().replace(/[^a-zA-Z0-9]+/g,'_');
  return text.toLowerCase();
}; 

/**
 * Get the url query string for parsing.
 * @param {string} url - the url that contains query string
 * @param {string} delimiter - the character to identify hash or query
 * @return {string} the part after the ?
 */
Bridge.getQueryString = function( url, delimiter ) {
	if ( typeof delimiter === "undefined" ) delimiter = '?';
	var questionMarkIndex = url.indexOf( delimiter );
	if ( questionMarkIndex === -1 || questionMarkIndex === url.length - 1 ) return null;
	else return url.slice( questionMarkIndex + 1 );
};

/**
 * Parse the query parameters into an associative array
 * @param {string} url - the url that contains query string 
 * @param {string} delimiter - the character to identify hash or query
 * @return {object} an associative array of query parameters
 */
Bridge.readQueryParameters = function( url, delimiter ) {
	var vars = {};
	// Retrieve the part after the ? in url
	var q = Bridge.getQueryString( url, delimiter );
	if( q !== undefined && q !== null && q ){
		// Remove the part after # if it exists
		q = q.split( '#' )[0];
		
		// trim the string
		q = q.trim();
		if ( q ) {		
			// Get all the different components
			q = q.split('&');
			for(var i = 0; i < q.length; i++){
				var hash = q[i].split('=');
				if ( hash.length < 2 ) vars[ hash ] = true;
				else vars[ hash[0] ] = hash[1];
			}
		}
	}
	return vars;
}; 

/**
 * Utilities Namespace
 * @namespace
 * Contains some utility functions not directly related to deal.
 */
Bridge.Utilities = {};

/**
 * Assign a default value to variable if it is not defined.
 * @param {mixed} variable - the variable to check
 * @param {mixed} value - the default value to assign
 * @return the variable value if assigned else the default value
 */
Bridge.Utilities.assignDefault = function( variable, value ) {
	if ( typeof variable === 'undefined' ) return value;
	return variable;
};

/**
 * Check if a suit is a call and a bid (not one of p, x, or r).
 * @param {string} suit - the suit of the bid
 * @return true if it is a call and a bid
 */
Bridge.Utilities.isBid = function( suit ) {
	return ( suit !== 'p' && suit !== 'x' && suit !== 'r' );
};

/**
 * Check if two directions are opponents.
 * @param {string} direction1 - the first direction
 * @param {string} direction2 - the second direction
 * @return true if direction1 and direction2 are opponents, false otherwise
 */
Bridge.Utilities.areOpponents = function( direction1, direction2 ) {
	return direction1 && direction2 && ( direction1 === Bridge.directions[ direction2 ].lho || direction1 === Bridge.directions[ direction2 ].rho );
};

/**
 * Adds a key field to enumeration (stored as an object)
 * @param {string} list - The enumeration
 * @private
 */
Bridge.Utilities.addKey = function( list ) {
	for( var item in list ) {
		list[ item ].key = item;
	}	
};

/**
 * Use the index field to create an array (from keys) in order of index
 * @param {string} list - The list to convert into array
 * @private
 */
Bridge.Utilities.createIndexArray = function( list ) {
	var returnArray = [];
	for( var item in list ) {
		returnArray[ list[ item ].index ] = item;
	}
	return returnArray;
};

/**
 * Check to see if a symbol belongs to a list and throw an exception if not.
 * @param {string} element - The element whose membership is being checked
 * @param {string} list - The list whose membership is checked
 * @param {string} listName - The string name of the list whose membership is checked
 * @param {string} [context] - The context ( for example the method ) of this call
 * @private
 * @throws element does not belong to the list
 */
Bridge.Utilities.checkListMembership = function( element, list, listName, context ) {
	if ( !_.has( list, element ) ) {
		var message = element + ' is not a valid ' + listName;
		Bridge.Utilities.reportError( message, context );
	}	
};

/**
 * Check to see if a required argument is provided
 * @param {*} value - The reuired argument
 * @param {string} name - The name of the argument for printing
 * @param {string} [context] - The context ( for example the method ) of this call 
 * @throws {Error} required value is not specified
 */
Bridge.Utilities.checkRequiredArgument = function( value, name, context ) {
	if ( !value && value !== '' ) {
		Bridge.Utilities.reportError( 'Required argument ' + name + ' has not been specified', context );
	}
};

/**
 * Parse string to get text between delimiters.
 * @param {string} the text string to parse
 * @param {number} the position of starting delimiter
 * @param {string} the ending delimiter
 * @return associative array with contained text and position after ending delimiter
 */
Bridge.Utilities.parseContainedText = function( text, start, delimiter, context ) {
	var returnValue = {};
	returnValue.position = text.indexOf( delimiter, start );
	if ( returnValue.position === -1 ) {
		Bridge.Utilities.reportError( 'Ending delimiter ' + delimiter + ' not found in ' + text, context );
	}
	returnValue.text = text.slice( start+1, returnValue.position );
	return returnValue;
};

/**
 * What to do when an error is seen?
 * Default if to throw an exception.
 * @param {string} message - The error message
 * @param {string} [context] - The context ( for example the method ) of the Error
 * @throws Error with message context + message
 */
Bridge.Utilities.reportError = function( message, context ) {
	if ( !Bridge.useContext ) throw new Error( message );
	throw new Error( ( context ? context : '' ) + message );
};

Bridge.Utilities.addKey( Bridge.directions );
Bridge.Utilities.addKey( Bridge.suits );
Bridge.Utilities.addKey( Bridge.calls );
Bridge.Utilities.addKey( Bridge.ranks );
Bridge.Utilities.addKey( Bridge.vulnerabilities );

Bridge.directionOrder = Bridge.Utilities.createIndexArray( Bridge.directions );
Bridge.suitOrder = Bridge.Utilities.createIndexArray( Bridge.suits );
Bridge.callOrder = Bridge.Utilities.createIndexArray( Bridge.calls );
Bridge.rankOrder = Bridge.Utilities.createIndexArray( Bridge.ranks );

/**
 * Check to see if direction is a valid direction
 * @param {string} direction - The direction to check
 * @param {string} [context] - The context ( for example the method ) of this call
 * @throws direction is not a valid direction
 */
Bridge.checkDirection = function( direction, context ) {
	Bridge.Utilities.checkListMembership( direction, Bridge.directions, 'Direction', context );
};

/**
 * Check to see if suit is a valid suit
 * @param {string} suit - The suit to check
 * @param {string} [context] - The context ( for example the method ) of this call
 * @throws suit is not a valid suit
 */
Bridge.checkSuit = function( suit, context ) {
	Bridge.Utilities.checkListMembership( suit, Bridge.suits, 'Suit', context );
};

/**
 * Check to see if suit of a call is a valid
 * @param {string} call - The call to check
 * @param {string} [context] - The context ( for example the method ) of this call
 * @throws suit is not a valid call
 */
Bridge.checkCall = function( call, context ) {
	Bridge.Utilities.checkListMembership( call, Bridge.calls, 'Call', context );
};

/**
 * Check to see if level of a call is valid
 * @param {string} level - The level to check
 * @param {string} [context] - The context ( for example the method ) of this call
 * @throws level is not a valid level
 */
Bridge.checkLevel = function( level, context ) {
	var levelNum = parseInt( level );
	if ( isNaN( levelNum ) || String( levelNum ) !== String( level ) || levelNum < 1 || levelNum > 7 ) {
		Bridge.Utilities.reportError( level + ' is not a valid level', context );
	}	
};

/**
 * Check to see if bid is valid
 * @param {string} level - The level of this bid (relevant only if call is a suit)
 * @param {string} suit - the suit of this call (includes p, d, and r)
 * @param {string} [context] - The context ( for example the method ) of this call
 * @throws bid is not a valid bid
 */
Bridge.checkBid = function( level, suit, context ) {
	Bridge.checkCall( suit, context );
	if ( suit === 'p' || suit === 'x' || suit === 'r' ) {
		return;
	}
	Bridge.checkLevel( level, context );
};

/**
 * Check to see if rank is a valid rank
 * @param {string} rank - The rank to check
 * @param {string} [context] - The context ( for example the method ) of this call
 * @throws rank is not a valid rank
 */
Bridge.checkRank = function( rank, context ) {
	Bridge.Utilities.checkListMembership( rank, Bridge.ranks, 'Rank', context );
};

/**
 * Check to see if vulnerability is a valid vulnerability
 * @param {string} vulnerability - The vulnerability to check
 * @param {string} [context] - The context ( for example the method ) of this call
 * @throws vulnerability is not a valid vulnerability
 */
Bridge.checkVulnerability = function( vulnerability, context ) {
	Bridge.Utilities.checkListMembership( vulnerability, Bridge.vulnerabilities, 'Vulnerability', context );
};




/**
 * Creates a new Bridge Deal.
 * @constructor
 * @memberof Bridge
 */
Bridge.Deal = function() {
	/**
	 * Information about the 52 cards.
	 * @member {object}
	 */
	this.cardAssignedTo = {};
	for( var suit in Bridge.suits ) {
		this.cardAssignedTo[ suit ] = {};
		for ( var rank in Bridge.ranks ) {
			this.cardAssignedTo[ suit ][ rank ] = null;
		}
	}	
	
	/**
	 * The 4 hands in this deal
	 * @member {object}
	 */	
	this.hands = {};
	for( var direction in Bridge.directions ) {
		this.hands[ direction ] = new Bridge.Hand( direction );
	}
	
	/**
	 * The board number of this deal.
	 * @member {number}
	 */
	this.board = null;
	
	/**
	 * The vulnerability of this deal.
	 * @member {string}
	 */
	this.vulnerability = null;
	
	/**
	 * The dealer of this deal.
	 * @member {string}
	 */
	this.dealer = null;
	
	/**
	 * The form of scoring for this deal.
	 * @member {string}
	 */
	this.scoring = null;	
	
	/**
	 * Any notes associated with this deal.
	 * @member {string}
	 */
	this.notes = null;	
	
	/**
	 * Any auctions associated with this deal.
	 * @member {object}
	 */
	this.auctions = {};	
	
	/** The currently active auction. */
	this.currentAuction = null;	
};

/**
 * Return the current auction.
 */
Bridge.Deal.prototype.getAuction = function() {
	return this.currentAuction;
};


/**
 * Set a property in this deal.
 * The properties that can be set are as follows<br/>
 * board - number - board number<br/>
 * vulnerability - character [ - n e b ] - the vulnerability<br/>
 * dealer - character [ n e s w ] - the dealer <br/>
 * notes - string - Any notes for this deal <br/>
 * auction - string (second parameter is name of auction) - A new auction <br/>
 * contract - string (second parameter is name of auction) - A new contracct <br/>
 * name - string (needs direction as well) - the name of player in specified direction <br/>
 * hand - string (needs direction as well) - the hand of player in specified direction <br/>
 * @param {string} property - the property to set<br/>
 * @param {string} value - the value to set the property to
 * @param {string} [secondValue] - some properties need an additional parameter
 * @return {boolean} true if property was set, false otherwise
 * @throws unknown property
 */
Bridge.Deal.prototype.set = function( property, value, secondValue ) {
	var prefix = 'In Bridge.Deal.prototype.set - ';
	Bridge.Utilities.checkRequiredArgument( property, 'Property', prefix );
	Bridge.Utilities.checkRequiredArgument( value, 'Value for Property ' + property, prefix );
	switch ( property ) {
		case 'board' :
			var boardNum = parseInt( value );
			if ( isNaN( boardNum ) || String( boardNum ) !== String( value ) || boardNum < 1 ) {
				Bridge.Utilities.reportError( value + ' is not a valid board number', prefix );
			}
			this.board = boardNum;
			break;
		case 'vulnerability' :
			var vul = value.toLowerCase();
			if ( vul === '0' ) vul = '-';
			Bridge.checkVulnerability( vul );
			this.vulnerability = vul;
			break;
		case 'dealer' :
			var direction = value.toLowerCase();
			Bridge.checkDirection( direction );
			this.dealer = direction;
			for( var auctionName in this.auctions ) {
				this.auctions[ auctionName ].updateDealer( direction );
			}
			break;
		case 'scoring' :
			this.scoring = value;
			break;
		case 'notes' :
			this.notes = value;
			break;
		case 'auction' :
			var name = secondValue;
			if ( !_.has( this.auctions, name ) ) {
				Bridge.Utilities.reportError( 'There is no auction with name : ' + name + '. An auction has to added using addAuction before calls can be set', prefix );
			}
			this.currentAuction = this.auctions[ name ];
			this.currentAuction.set( 'auction', value );
			break;
		case 'contract' :
			var name = secondValue;
			if ( !_.has( this.auctions, name ) ) {
				Bridge.Utilities.reportError( 'There is no auction with name : ' + name + '. An auction has to added using addAuction before contract can be set', prefix );
			}
			this.currentAuction = this.auctions[ name ];
			this.currentAuction.set( 'contract', value );
			break;		
		case 'name' :
			var direction = secondValue;
			Bridge.checkDirection( direction, prefix );
			this.hands[ direction ].set( property, value );
			break;
		case 'hand' :
			var direction = secondValue;
			Bridge.checkDirection( direction, prefix );
			this._parseBBOHand( value, direction );
			break;			
		default :
			Bridge.Utilities.reportError( 'Unknown deal property ' + property, prefix );
	}
};

/**
 * Get value of a property .
 * See {@link Bridge.Deal#set} for list of properties
 * @param {string} property - the property to get
 * @param {string} [value] - some properties need an additional parameter
 * @return {*} the value of requested property
 * @throws unknown property
 */
Bridge.Deal.prototype.get = function( property, value ) {
	var prefix = 'In Bridge.Deal.prototype.get - '
	Bridge.Utilities.checkRequiredArgument( property, 'Property', prefix );
	switch ( property ) {
		case 'board' :
		case 'vulnerability' :
		case 'dealer' :
		case 'scoring' :
		case 'notes' :
			return this[ property ];
			break;
		case 'auction':
		case 'contract':
			var name = value;
			if ( name &&  !_.has( this.auctions, name ) ) {
				Bridge.Utilities.reportError( 'There is no auction with name ' + name, prefix );
			}
			if ( !name && !this.currentAuction ) {
				Bridge.Utilities.reportError( 'There is no current auction to return!' , prefix );
			}
			return name ? this.auctions[ name ].get( property ) : this.currentAuction.get( property );
			break;
		case 'name' :
		case 'count' :
		case 'hand' :
			var direction = value;
			Bridge.checkDirection( direction, prefix );
			return this.hands[ direction ].get( property );
			break;
		default :
			Bridge.Utilities.reportError( 'Unknown deal property ' + property, prefix );
	}
};

/**
 * Get value of a property in html form.
 * See {@link Bridge.Deal#set} for list of properties
 * @param {string} property - the property to get
 * @param {string} [value] - some properties need an additional parameter
 * @return {*} the value of requested property
 * @throws unknown property
 */
Bridge.Deal.prototype.getHTML = function( property, value ) {
	var prefix = 'In Bridge.Deal.prototype.getHTML - '
	Bridge.Utilities.checkRequiredArgument( property, 'Property', prefix );	
	switch ( property ) {
		case 'board' :
		case 'scoring' :
		case 'notes' :
			return this[ property ] ? this[ property ] : 'Not Specified';
			break;
		case 'vulnerability' :
			return this.vulnerability ? Bridge.vulnerabilities[ this.vulnerability ].html : 'Not Specified';
			break;
		case 'dealer' :
			return this.dealer ? Bridge.directions[ this.dealer ].html : 'Not Specified';
			break;
		case 'auction':
		case 'contract':
			var name = value;
			if ( name &&  _.has( this.auctions, name ) ) {
				Bridge.Utilities.reportError( 'There is no auction with name ' + name, prefix );
			}
			if ( !name && !this.currentAuction ) {
				Bridge.Utilities.reportError( 'There is no current auction to return!' , prefix );
			}
			return name ? this.auctions[ name ].getHTML( property ) : this.currentAuction.getHTML( property );
			break;			
		case 'hand' :
			var direction = value;
			Bridge.checkDirection( direction, prefix );
			return this.hands[ direction ].getHTML( property );
			break;
		default :
			Bridge.Utilities.reportError( 'Unknown deal property ' + property, prefix );
	}
};

/**
 * Get the auction as a table.
 * @param {string} name - the name of auction to get
 * if no name is specified get current auction.
 * @return {string} the auction as html table
 */
Bridge.Deal.prototype.getAuctionTable = function( name ) {
	var auction = ( typeof name === "undefined" ? this.currentAuction : this.auctions[ name ] );
	if ( !auction ) return "";
	else return auction.toHTMLTable(); 
};

/**
 * Add an auction to this deal.
 * @param {string} name - A string name for this auction
 * @param {string} [dealer] - Optional dealer for this auction. If not specified the dealer for the deal will be used
 * @return {boolean} Was the auction added?
 * @throws name not specified
 * @throws name is duplicate
 * @throws dealer is not a valid direction
 */
Bridge.Deal.prototype.addAuction = function( name, dealer ) {
	dealer = Bridge.Utilities.assignDefault( dealer, this.dealer );
	var prefix = 'In Bridge.Deal.prototype.addAuction - ';
	Bridge.Utilities.checkRequiredArgument( name, 'Name', prefix );
	Bridge.checkDirection( dealer, prefix );
	if ( _.has( this.auctions, name ) ) {
		Bridge.Utilities.reportError( 'An auction with ' + name + ' already exists! Cannot create another with same name.', prefix );
	}
	this.auctions[ name ] = new Bridge.Auction( name, dealer );
	this.currentAuction = this.auctions[ name ];
	return true;
};

/**
 * Load an existing auction. Sets the names auction as current auction
 * @param {string} name - A string name for this auction
 */
Bridge.Deal.prototype.loadAuction = function( name ) {
	if ( !_.has( this.auctions, name ) ) {
		Bridge.Utilities.reportError( 'An auction with ' + name + ' does not exist! So it cannot be loaded.', prefix );
	}
	this.currentAuction = this.auctions[ name ];
};

/**
 * Add a call to the current auction.
 * @param {string} call - The call as a single character (p, x, r) or as two characters
 * representing level and suit.
 * @param {string} [explanation] - optional explanation for this call
 * @param {string} [annotation] - optional annotation for this call
 */
Bridge.Deal.prototype.addCall = function( call, explanation, annotation ) {
	var prefix = 'In Bridge.Auction.addCall - ';
	if ( !this.currentAuction ) {
		Bridge.Utilities.reportError( 'There is no currrent auction, so a call cannot be added.', prefix );
	}
	this.currentAuction.addCall( call, explanation, annotation );
};

/**
 * Removes the last call from the current auction.
 */
Bridge.Deal.prototype.removeCall = function() {
	var prefix = 'In Bridge.Deal.prototype.removeCall - ';
	if ( !this.currentAuction ) {
		Bridge.Utilities.reportError( 'There is no currrent auction, so a call cannot be removed.', prefix );
	}
	this.currentAuction.removeCall();
}; 
 

/**
 * Add a card to a specific hand or first possible hand.
 * @param {string} suit - The suit of this card
 * @param {string} rank - The rank of this card
 * @param {string} direction - The direction to assign this card to. If not specified add to first hand without 13 cards
 * @return {boolean} Was the card added? Returns false if the card was already in some hand or in case of any errors.
 * @throws suit is not a valid suit
 * @throws rank is not a valid rank 
 * @throws cannot find direction to add card to
 */
Bridge.Deal.prototype.addCard = function( suit, rank, direction ) {
	var prefix = 'In Bridge.Deal.prototype.addCard - '
	// Validate inputs
	Bridge.checkSuit( suit, prefix );
	Bridge.checkRank( rank, prefix );
	
	if ( this.cardAssignedTo[ suit ][ rank ] ) {
		Bridge.Utilities.reportError( 'Card ' + suit + rank + ' is already assigned to ' + direction, prefix );
	}

	if ( _.isUndefined( direction ) ) {
		// No direction specified so assign to first hand with less than 13 cards
		// @todo how to do this with underscore
		for( var d in Bridge.directions ) {
			if ( this.hands[ d ].numCards < 13 ) {
				direction = d;
				break;
			}
		}
		// Should not get here
		if ( _.isUndefined( direction ) ) {
			Bridge.Utilities.reportError( 'All hands have 13 cards and so cannot find direction to assign ' + suit + rank + ' to!', prefix );
		}
	}
	else {
		// direction is specified. Check if it is valid.
		Bridge.checkDirection( direction, prefix );
	}
	
	
	if ( this.hands[ direction ].addCard( suit, rank ) ) {
		this.cardAssignedTo[ suit ][ rank ] = direction;
		return true;
	}
	else {
		return false;
	}
};


/**
 * Remove a card from a specific hand or from the hand that holds it.
 * @param {string} suit - The suit of this card
 * @param {string} rank - The rank of this card
 * @param {string} direction - The direction to remove this card from. If not specified remove it from hand that has it
 * @return {boolean} Was the card removed? Returns false if the card was not in any hand or does not belong to hand that was specified.
 */
Bridge.Deal.prototype.removeCard = function( suit, rank, direction ) {
	var prefix = 'In Bridge.Deal.prototype.removeCard - '
	Bridge.checkSuit( suit, prefix );
	Bridge.checkRank( rank, prefix );
	if ( _.isUndefined( direction ) ) {
		direction = this.cardAssignedTo[ suit ][ rank ];
	}
	if ( !direction || !( direction === this.cardAssignedTo[ suit ][ rank] ) ) {
		Bridge.Utilities.reportError( 'Card ' + suit + rank + ' does not belong to ' + direction, prefix );
	}
	
	if ( this.hands[ direction ].removeCard( suit, rank ) ) {
		this.cardAssignedTo[ suit ][ rank ] = null;
		return true;
	}
	else {
		return false;
	}
};

/**
 * Check if a hand has a card.
 * @param {string} suit - The suit of this card
 * @param {string} rank - The rank of this card
 * @param {string} direction - The direction to check for this card
 * @return {boolean} Does the specified hand have the specified card?
 * @private
 */
Bridge.Deal.prototype._hasCard = function( suit, rank, direction ) {
	var prefix = 'In Bridge.Deal.prototype._hasCard - '
	Bridge.checkSuit( suit, prefix );
	Bridge.checkRank( rank, prefix );
	Bridge.checkDirection( direction, prefix );
	
	return this.cardAssignedTo[ suit ][ rank ] === direction && this.hands[ direction ]._hasCard( suit, rank );
};

/**
 * Assign the rest of the unassigned cards.
 * @return {number} the number of cards assigned.
 */
Bridge.Deal.prototype.assignRest = function() {
	/** Get the unassigned cards and shuffle them. */
	var unassigned = [];
	for( var suit in Bridge.suits ) {
		for ( var rank in Bridge.ranks ) {
			if ( !this.cardAssignedTo[ suit ][ rank ] ) {
				unassigned.push( suit + rank );
			}
		}
	}		
	unassigned = _.shuffle( unassigned );
	
	var assignedCardCount = 0;
	_.each( unassigned, function( card ) {
		if ( this.addCard( card.charAt(0), card.charAt(1) ) ) assignedCardCount++;
	}, this);
	return assignedCardCount;
};

/**
 * Load information from json object
 * @param {object} json representation of this deal.
 */
Bridge.Deal.prototype.fromJSON = function( json ) {
	var prefix = "In Bridge.Deal.prototype.fromJSON - ";
	for( var property in json ) {
		switch ( property ) {
			case 'board' :
			case 'vulnerability' :
			case 'dealer' :
			case 'scoring' :
			case 'notes' :
				this.set( property, json[ property ] );
				break;
			case 'name' :
			case 'hand' :
				for( var direction in json[ property ] ) {
					this.set( property, json[ property ][ direction ], direction );
				}
				break;
			case "auction" :
				// Dealt with later.
				break;
			default :
				Bridge.Utilities.reportError( 'Unknown deal property ' + property, prefix );		
		}
	}
	// Auction handled later because dealer has to be set first
	var property = "auction";
	for( var auctionName in json[ property ] ) {
		this.addAuction( auctionName );
		this.set( property, json[ property ][ auctionName ], auctionName );
	}	
};

/**
 * Generate a json representation of this deal.
 * @return {object} json representation of this deal.
 */
Bridge.Deal.prototype.toJSON = function() {
	var json = {};
	var fields = [ "board", "vulnerability", "dealer", "scoring", "notes" ];
	for( var i = 0; i < fields.length; ++i ) {
		var field = fields[i];
		var value = this.get( field );
		if ( value ) json[ field] = value;
	}
	var field = "auction";
	json[ field ] = {};
	for( var auctionName in this.auctions ) {
		var value = this.get( field, auctionName );
		json[ field][ auctionName ] = value;
	}
	var field = "name";
	json[ field ] = {};
	for( var direction in Bridge.directions ) {
		var value = this.get( field, direction );
		if ( value ) json[ field ][ direction ] = value;	
	}	
	var field = "hand";
	json[ field ] = {};
	for( var direction in Bridge.directions ) {
		var value = this.get( field, direction );
		if ( value ) json[ field ][ direction ] = value;	
	}		
	return json;
};

/**
 * Generate a string display of this deal.
 * @return {string} string representation of this deal.
 */
Bridge.Deal.prototype.toString = function() {
	var html = "";
	var items = [];
	if ( this.board ) items.push( "b=" + this.board );
	if ( this.dealer ) items.push( "d=" + this.dealer );
	if ( this.vulnerability ) items.push( "v=" + this.vulnerability );
	for(var direction in Bridge.directions) {
		var hand = this.hands[ direction ].toString();
		if ( hand ) items.push( hand );
	};
	for( var auctionName in this.auctions ) {
		var auction = this.auctions[ auctionName ].toHTML( true );
		if ( auction ) items.push ( "a=" + auction );	
	};
	return items.join( "&" );
};

/**
 * Generate a html display of this deal.
 * @return {string} HTML representation of this deal.
 */
Bridge.Deal.prototype.toHTML = function() {
	var html = '';
	html += '<h3>Deal Information</h3>';
	var fields = [ 'Board', 'Dealer', 'Vulnerability', 'Scoring', 'Notes' ];
	for( var i = 0; i < fields.length; ++i ) {
		var field = fields[i];
		html += field + ' : ' + this.getHTML( field.toLowerCase() ) + '<br/>';
	}
	/*html += 'Board : ' + this.getHTML( 'board' ) + '<br/>';
	html += 'Dealer : ' + this.getHTML( 'dealer') + '<br/>';
	html += 'Vulnerability : ' + this.getHTML( 'vulnerability' ) + '<br/>';
	html += 'Notes : ' + this.getHTML( 'notes' ) + '<br/>';*/
	html += '<h3>Hands</h3>';
	for(var direction in Bridge.directions) {
		html += this.hands[ direction ].toHTML() + '<br/>';
	};
	html += '<h3>Auctions</h3>';
	for( var auctionName in this.auctions ) {
		html += this.auctions[ auctionName ].toHTML();	
	};
	/*outputString += '<h3>Plays</h3>';
	for( var playName in this.plays ) {
		outputString += '<h4>' + playName + '</h4>';
		outputString += this.plays[ playName ].toString();	
	};	*/
	return html;	
};

/**
 * Parse a deal given as BBO handviewer string format.
 * @param {string} handString - the hand in string format
 * @return {boolean} true if handstring is correct and information was parsed, false otherwise
 * @throws invalid character in hand String
 */
Bridge.Deal.prototype.loadBBOHandviewerString = function( handString ) {
	var parameters = {};
	_.each( handString.split( '&' ), function( pairs ) {
		var values = pairs.split( '=' );
		parameters[ values[0] ] = decodeURIComponent( values[1] );
	});	
	var numHandsSpecified = 0;
	_.each( parameters, function( value, key ) {
		switch ( key ) {
			case 'b' :
				this.set( 'board', value );
				break;
			case 'd' :
				this.set( 'dealer', value );
				break;
			case 'v' :
				this.set( 'vulnerability', value );
				break;		
			case 't' :
				this.set( 'notes', value );
				break;	
			case 'a' :
				this.set( 'auction', value, 'Default' );
				break;
			case 'n' :
			case 'e' :
			case 's' :
			case 'w' :
				this.set( 'hand' , value, key );
				if ( this.get( 'count', key )  === 13 ) {
					numHandsSpecified++;
				}	
				break;	
			case 'nn' :
			case 'en' :
			case 'sn' :
			case 'wn' :
				this.set( 'name' , value, key.charAt(0) );	
				break;									
			default :
				break;
		}
	}, this);
	if ( numHandsSpecified === 3 ) {
		this.assignRest();
	}
};

/**
 * Parse a deal given as BBO lin string format.
 * @param {string} linString - the hand in lin string format
 * @return {boolean} true if linstring is correct and information was parsed, false otherwise
 * @throws invalid character in lin String
 */
Bridge.Deal.prototype.loadBBOLinString = function( linString ) {
	var prefix = 'In Bridge.Deal.prototype.loadBBOLinString - '
	var parameters = linString.split( '|' );
	_.each( parameters, function( value, index ) {
		switch ( value ) {
			case 'pn' :
				var i = index + 1;
				var names = parameters[ i ].split( ',' );
				_.each( names, function( name, index ) {
					var direction = Bridge.directionOrder[ ( index + 2 ) % 4 ];
					this.set( 'name', name, direction );
				}, this);
				break;
			case 'md' :
				var i = index + 1;
				var dealerNumber = parseInt( parameters[ i ].charAt(0) );
				if ( dealerNumber < 1 || dealerNumber > 4 ) {
					Bridge.Utilities.reportError( '' + dealerNumber + ' is not a valid dealer position!', prefix );
				}
				this.set( 'dealer', Bridge.directionOrder[ ( dealerNumber + 1 )%4 ] );
				var numHandsSpecified = 0;
				_.each( parameters[ i ].slice(1).split( ',' ), function( hand, index ) {
					if ( hand.trim() ) {
						var direction = Bridge.directionOrder[ ( index + 2 ) % 4 ];
						this.set( 'hand' , hand, direction );
						if ( this.get( 'count', direction )  === 13 ) {
							numHandsSpecified++;
						}	
					}		
				}, this);	
				if ( numHandsSpecified === 3 ) {
					this.assignRest();
				}
				break;		
			case 'sv' :
				var i = index + 1;
				if ( parameters[ i ] === 'o' ) parameters[ i ] = '-';
				this.set( 'vulnerability', parameters[ i ] );	
			default:
				if ( value.indexOf( 'Board' ) === 0 ) {
					this.set( 'board', value.slice(6).trim() );
				}
				break; 
		}
		
	}, this);
};


/**
 * Parse a hand given as BBO handviewer string format.
 * @param {string} handString - the hand in string format
 * @param {string} direction - the direction to assign this hand
 * @return {boolean} true if handstring is correct and all cards are assigned, false otherwise
 * @throws invalid character in hand String
 * @private
 */
Bridge.Deal.prototype._parseBBOHand = function( handString, direction ) {
 	var seenSuits = {};
 	for( var d in Bridge.directions ) {
		seenSuits[ d ] = false;
	}
 	handString = handString.toLowerCase();
	var currentSuit = '';
	var currentRank = '';
	var directionName = Bridge.directions[ direction ].html;
	for( var i = 0; i < handString.length; ++i ) {
		var prefix = 'In hand for ' + directionName + ' at position ' + (i+1) + ' - ';
		// Read the next character specified in hand
		var currentChar = handString.charAt( i );
		switch( currentChar ) {
			// Check if it specifies suit
			case 'c' :				
			case 'd' :
			case 'h' :
			case 's' :	
				currentSuit = currentChar;
				if ( seenSuits[ currentSuit ] ) {
					Bridge.Utilities.reportError( ' suit ' + currentSuit + ' has already been seen before!', prefix );
				}
				seenSuits[ currentSuit ] = true;
				break;	
			
			// Special handing for numeric 10
			case '1' :
				if ( currentSuit === '' ) {
					Bridge.Utilities.reportError( currentChar + ' was found when a suit was expected!', prefix );
				}			
				if ( i < handString.length - 1 && handString.charAt( i+1 ) === '0') {
					currentRank = 't';
					i++;
				}
				else {
					Bridge.Utilities.reportError( 'a 1 is present without a subsequent 0. Use 10 or t to reprensent the ten.', prefix );
					continue;
				}
				break;
			// All other characters
			default :
				if ( currentSuit === '' ) {
					Bridge.Utilities.reportError( currentChar + ' was found when a suit was expected!', prefix );
					continue;
				}
				currentRank = currentChar;
				Bridge.checkRank( currentRank, prefix );
				this.addCard( currentSuit, currentRank, direction );
				break;											
		}	
	}	
 };



/**
 * Creates a new Bridge Hand.
 * @constructor
 * @memberof Bridge
 * @param {string} direction - The direction this hand is sitting
 */
Bridge.Hand = function( direction ) {
	Bridge.checkDirection( direction );
	/**
	 * The direction of this hand
	 * @member {string}
	 */
	 this.direction = direction;
	 
	/**
	 * The name of person holding this hand
	 * @member {string}
	 */	 
	 this.name = Bridge.directions[ direction ].name;
	 
	/**
	 * The actual cards in this hand
	 * @member {object}
	 */
	 this.cards = {};
	 for( var suit in Bridge.suits ) {
	 	this.cards[ suit ] = {};
	 }
	 
	/**
	 * The number of cards this hand has
	 * @member {number}
	 */	 	 
	 this.numCards = 0;
};

/**
 * Set a property in this hand.
 * The properties that can be set are as follows<br/>
 * name - string - name of player holding this hand<br/>
 * @param {string} property - the property to set<br/>
 * @param {string} value - the value to set the property to
 * @return {boolean} true if property was set, false otherwise
 * @throws unknown property
 */
Bridge.Hand.prototype.set = function( property, value ) {
	var prefix = 'In Bridge.Hand.prototype.set - ';
	Bridge.Utilities.checkRequiredArgument( property, 'Property', prefix );
	Bridge.Utilities.checkRequiredArgument( value, 'Value for Property ' + property, prefix );	
	switch ( property ) {
		case 'name' :
			this.name = value;
			break;
		default :
			Bridge.Utilities.reportError( 'Unknown property ' + property, prefix );
	}
};

/**
 * Get value of a property .
 * See {@link Bridge.Hand#set} for list of properties
 * @param {string} property - the property to get
 * @return {*} the value of requested property
 * @throws unknown property
 */
Bridge.Hand.prototype.get = function( property ) {
	var prefix = 'In Bridge.Hand.prototype.get - ';
	Bridge.Utilities.checkRequiredArgument( property, 'Property', prefix );
	switch ( property ) {
		case 'name' :
			return this.name;
			break;
		case 'count' :
			return this.numCards;
			break;
		case 'hand' :
			return this.toString();
			break;
		default :
			Bridge.Utilities.reportError( 'Unknown property ' + property, prefix );
	}
};

/**
 * Add a card to this hand.
 * This is meant to be used by Bridge.Deal.addCard and so does not perform any sanity checks on the inputs.
 * @param {string} suit - The suit of this card
 * @param {string} rank - The rank of this card
 * @return {boolean} Was the card added? Returns false if the card was already int this hand or in case of any errors.
 */
Bridge.Hand.prototype.addCard = function( suit, rank ) {
	var prefix = 'In Bridge.Hand.prototype.addCard - ';
	Bridge.checkSuit( suit, prefix );
	Bridge.checkRank( rank, prefix );
	if ( this.numCards === 13 ) {
		Bridge.Utilities.reportError( 'Hand with direction : ' + this.direction + ' already has 13 cards. Cannot add ' + suit + rank, prefix );
	}
	if ( !this.cards[ suit ][ rank ] ) {
		this.cards[ suit ][ rank ] = true;
		this.numCards++;
		return true;
	}
	return false;
};

/**
 * Remove a card from this hand.
 * This is meant to be used by Bridge.Deal.removeCard and so does not perform any sanity checks on the inputs.
 * @param {string} suit - The suit of this card
 * @param {string} rank - The rank of this card
 * @return {boolean} Was the card removed? Returns false if the card did not belong to this hand or in case of any errors.
 */
Bridge.Hand.prototype.removeCard = function( suit, rank ) {
	var prefix = 'In Bridge.Hand.prototype.removeCard - ';
	Bridge.checkSuit( suit, prefix );
	Bridge.checkRank( rank, prefix );	
	if ( this.cards[ suit ][ rank ] ) {
		this.cards[ suit ][ rank ] = false;
		this.numCards--;
		return true;
	}
	return false;
};

/**
 * Check if this hand has a card.
 * @param {string} suit - The suit of this card
 * @param {string} rank - The rank of this card
 * @return {boolean} Does this hand have the specified card?
 * @private
 */
Bridge.Hand.prototype._hasCard = function( suit, rank ) {
	var prefix = 'In Bridge.Hand.prototype._hasCard - '
	Bridge.checkSuit( suit, prefix );
	Bridge.checkRank( rank, prefix );
	
	return this.cards[ suit ][ rank ];
};

/**
 * Generate a html/string display of this hand.
 * @param {boolean} inStringFormat - if true then return string format else html format
 * @return {string} HTML representation of this deal.
 */
Bridge.Hand.prototype.toHTML = function( inStringFormat ) {
	inStringFormat = Bridge.Utilities.assignDefault( inStringFormat, false );
	if ( inStringFormat ) return this.toString();
	var html = '';
	html += 'Direction : ' + Bridge.directions[ this. direction ].html;
	html += ', Name : ' + this.name + ' - ';
	_.each( Bridge.suitOrder, function( suit ) {
		if ( _.isEmpty( this.cards[ suit ] ) ) {
			html += Bridge.suits[ suit ].html + ' ';
			html += '-';
		}
		else {
			html += Bridge.suits[ suit ].html + ' ';
			_.each( Bridge.rankOrder, function( rank ) {
				if ( this.cards[ suit ][ rank ] ) {
					html += Bridge.ranks[ rank ].html;
				}
			}, this);
		}
		html += ' ';
	}, this);
	return html;
};

/**
 * Generate a string display of this hand.
 * @param {boolean} useHTML - if true then return use suit symbols and add space between suits 
 * @return {string} string representation of this deal.
 */
Bridge.Hand.prototype.toString = function( useHTML ) {
	var html = "";
	_.each( Bridge.suitOrder, function( suit ) {
		var item = "";
		if ( useHTML ) html += " " + Bridge.suits[ suit ].html + " ";
		_.each( Bridge.rankOrder, function( rank ) {
			if ( this.cards[ suit ][ rank ] ) {
				if ( useHTML ) html += Bridge.ranks[ rank ].html;
				else item += rank;
			}
		}, this);	
		if ( !useHTML && item ) html += suit + item;	
	}, this);
	return html;
};

/**
 * Creates a new Bridge Contract.
 * @constructor
 * @memberof Bridge
 * @param {number} level - The level of the contract
 * @param {string} suit - the suit of the contract
 * @param {string} direction - the direction making this bid
 */
Bridge.Contract = function() {
	this.level = null;
	this.suit = null;
	this.doubled = false;
	this.redoubled = false;
	this.declarer = null;
	this.firstToBid =  {};
	for( var call in Bridge.calls ) {
		this.firstToBid[ call ] = {};
		for ( var direction in Bridge.directions) {
			if ( Bridge.Utilities.isBid( call ) ) {
				this.firstToBid[ call ][ direction ] = null;
			}			
		}
	}
	this.numPasses = 0;
	this.isComplete = false;
};

/**
 * Determine what bids are allowed next for specified direction.
 * @param {string} direction the direction whose bids are being checked
 * @return {object} parameters indicating what bids are allowed
 */
Bridge.Contract.prototype.possibleCalls = function( direction ) {
	Bridge.checkDirection( direction );
	var out = { level: 8, suit: 'c', double: false, redouble: false, pass: false };
	if ( this.isComplete ) return out;
	out.level = this.level;
	out.suit = this.suit;
	out.pass = true;
	out.double = !this.doubled && !this.redoubled && Bridge.Utilities.areOpponents( direction, this.declarer );
	out.redouble = this.doubled && !this.redoubled && !Bridge.Utilities.areOpponents( direction, this.declarer );
	return out;
};

/**
 * Generate a html/string display of this contract.
 * @param {boolean} inStringFormat - if true then return string format else html format
 * @return {string} HTML representation of this contract.
 */
Bridge.Contract.prototype.toHTML = function( inStringFormat ) {
	inStringFormat = Bridge.Utilities.assignDefault( inStringFormat, false );
	var html = '';
	if ( this.level ) {
		html += this.level;
		html += ( inStringFormat ? this.suit : Bridge.calls[ this.suit ].html );
		if ( this.redoubled ) {
			var call = 'r';
			html += ( inStringFormat ? 'xx' : Bridge.calls[ call ].html );
		}
		else if ( this.doubled ) {
			var call = 'x';
			html += ( inStringFormat ? call : Bridge.calls[ call ].html );			
		}
		html += ( inStringFormat ? this.declarer : ' by ' + Bridge.directions[ this.declarer ].html );		
		
	}
	return html;
};

/**
 * Make a clone of this contract.
 * @return a clone of the contract.
 */
Bridge.Contract.prototype.clone = function() {
	var contract = new Bridge.Contract();
	var fields = [ 'level', 'suit', 'doubled', 'redoubled', 'declarer', 'numPasses', 'isComplete' ];
	_.each( fields, function( field ) {
		contract[ field ] = this[ field ];
	}, this);
	contract.firstToBid = _.cloneDeep( this.firstToBid );	
	return contract;
};

/**
 * Parse a contract specified as a string.
 * @param {string} the contract as a string
 */
Bridge.Contract.prototype.parseContractString = function( contract ) {
	var prefix = 'In Bridge.Contract.parseContractString - ';
	var index = 0; 
	if ( contract.length < index + 1 ) {
		Bridge.Utilities.reportError( 'Contract string ' + contract + ' does not specify level!', prefix );
	}
	this.level = _.parseInt( contract[ index++ ] );
	Bridge.checkLevel( this.level );
	if ( contract.length < index + 1 ) {
		Bridge.Utilities.reportError( 'Contract string ' + contract + ' does not specify suit!', prefix );
	}	
	this.suit = contract[ index++ ].toLowerCase();
	Bridge.checkSuit( this.suit );
	if ( contract.length > index && contract[ index ].toLowerCase === 'x' ) {
		this.doubled = true;
		index++;
		if ( contract.length > index && contract[ index ].toLowerCase === 'x' ) {
			this.redoubled = true;
			index++;
		}
	}
	if ( contract.length < index + 1 ) {
		Bridge.Utilities.reportError( 'Contract string ' + contract + ' does not specify declarer!', prefix );
	}	
	this.declarer = contract[ index ].toLowerCase();
	Bridge.checkDirection( this.declarer );	
};

/**
 * Update contract after a call.
 * @param {string} call - the call to use to update contract
 */
Bridge.Contract.prototype.update = function( call ) {
	if ( this.isComplete ) {
		Bridge.Utilities.reportError( 'Auction is already complete. Cannot make another call' );
	}
	switch ( call.suit ) {
		case 'p':
			this.numPasses++;
			if ( ( this.declarer && this.numPasses === 3 ) || this.numPasses === 4 ) {
				this.isComplete = true;
			}
			break;
		case 'x':
			if ( !this.declarer || !Bridge.Utilities.areOpponents( this.declarer, call.direction ) || this.redoubled || this.doubled ) {
				Bridge.Utilities.reportError( 'Double is not allowed at this point in the auction' );
			}
			this.doubled = true;
			this.numPasses = 0;
			break;
		case 'r':
			if ( !this.doubled || Bridge.Utilities.areOpponents( this.declarer, call.direction ) || this.redoubled ) {
				Bridge.Utilities.reportError( 'ReDouble is not allowed at this point in the auction' );
			}
			this.redoubled = true;
			this.numPasses = 0;	
			break;	
		default:
			if ( call.level < this.level || ( call.level === this.level && Bridge.calls[ call.suit ].index >= Bridge.calls[ this.suit ].index ) ) {
				Bridge.Utilities.reportError( call.toHTML( true ) + ' is not allowed at this point in the auction' );
			}
			this.doubled = false;
			this.redoubled = false;
			this.numPasses = 0;
			if ( !this.firstToBid[ call.suit ][ call.direction ] ) {
				this.firstToBid[ call.suit ][ call.direction ] = call.direction;
				this.firstToBid[ call.suit ][ Bridge.directions[ call.direction ].cho ] = call.direction;
			}
			this.declarer = this.firstToBid[ call.suit ][ call.direction ];
			this.suit = call.suit;
			this.level = call.level;
			break;
	}

};

/**
 * Creates a new Bridge Call.
 * @constructor
 * @memberof Bridge
 * @param {string} [level] - The optional (if a suit called) of this bid
 * @param {string} suit - the suit (includes pass, double, and redouble) of this bid
 * @param {string} direction - the direction making this bid
 */
Bridge.Call = function( level, suit, direction, explanation, annotation ) {
	if ( _.isUndefined( direction ) ) {
		direction = suit;
		suit = level;
	}
	level = _.parseInt( level );
	suit = suit.toLowerCase();
	direction = direction.toLowerCase();
	var prefix = 'In Bridge.Bid constructor - ';
	Bridge.checkBid( level, suit, prefix );	
	Bridge.checkDirection( direction, prefix );
	this.level = level;
	this.suit = suit;
	this.direction = direction;
	this.annotation = annotation;
	this.explanation = explanation;
};

/**
 * Update the contract based on this latest call.
 * @param {object} the contract so far
 * @return the updated contract.
 */
Bridge.Call.prototype.setContract = function( contract ) {
	this.contract = contract.clone();
	this.contract.update( this );
	return this.contract;
};
/**
 * Generate a string display of this call.
 * @return {string} string representation of this bid.
 */
Bridge.Call.prototype.toString = function() {
	var html = "";
	if ( !Bridge.Utilities.isBid( this.suit ) ) {
		html += "";
	}
	else {
		html = this.level;
	}
	html += this.suit;
	if ( this.explanation ) {
		html += '{' + this.explanation + '}';
	}
	if ( this.annotation ) {
		html += '{' + this.annotation + '}';
	}		
	return html;
};

/**
 * Generate a html/string display of this call.
 * @param {boolean} inStringFormat - if true then return string format else html format
 * @return {string} HTML representation of this bid.
 */
Bridge.Call.prototype.toHTML = function( inStringFormat ) {
	inStringFormat = Bridge.Utilities.assignDefault( inStringFormat, false );
	var html = "";
	if ( !Bridge.Utilities.isBid( this.suit ) ) {
		html = '';
	}
	else {
		html = this.level;
	}
	if ( !inStringFormat ) {
		var call = Bridge.calls[ this.suit ].html;
		if ( this.explanation ) {
			html += '<span title="' + this.explanation + '">' + call + '</span>';
		}
		else {
			html += call;
		}
	}
	else {
		html += this.suit;
		if ( this.explanation ) {
			html += '{' + this.explanation + '}';
		}
		if ( this.annotation ) {
			html += '{' + this.annotation + '}';
		}		
	}

	return html;
};

/**
 * Creates a new Bridge Auction.
 * @constructor
 * @memberof Bridge
 * @param {string} dealer - The direction indication who is dealer and will be first to call
 */
Bridge.Auction = function( name, dealer ) {
	var prefix = 'In Bridge.Auction constructor - ';
	Bridge.Utilities.checkRequiredArgument( name, 'Name', prefix );
	Bridge.checkDirection( dealer );
	this.name = name;
	this.dealer = dealer;
	this.clear();
};

/**
 * Return the possible calls for the auction at this point.
 */
Bridge.Auction.prototype.possibleCalls = function() {
	if ( this.contract ) {
		var out = this.contract.possibleCalls( this.nextToCall );
	}
	else {
		var out = {
			level: 0,
			suit: 'c',
			double: true,
			redouble: true,
			pass: true
		};
	}
	out.undo = this.calls.length > 0;
	return out;
};

/**
 * Get a property in this auction.
 * The properties that can be got are as follows<br/>
 * name - string - a name for this auction<br/>
 * dealer - character [ n e s w ] - the dealer for this auction <br/>
 * contract - string - a prespecified contract <br/>
 * auction - string - the auction as a string <br/>
 * @param {string} property - the property to set<br/>
 * @return {mixed} the value of requested property
 * @throws unknown property
 */
Bridge.Auction.prototype.get = function( property ) {
	var prefix = 'In Bridge.Auction.prototype.get - ';
	Bridge.Utilities.checkRequiredArgument( property, 'Property', prefix );
	switch ( property ) {
		case 'name' :
		case 'dealer' :
			return this[ property ];
			break;
		case 'contract' :
			return this.contract.toString();
			break;
		case 'auction' :
			return this.toString();
			break;			
		default :
			Bridge.Utilities.reportError( 'Unknown deal property ' + property, prefix );
	}
};

/**
 * Set a property in this auction.
 * The properties that can be set are as follows<br/>
 * name - string - a name for this auction<br/>
 * dealer - character [ n e s w ] - the dealer for this auction <br/>
 * contract - string - a prespecified contract <br/>
 * auction - string - the auction as a string <br/>
 * @param {string} property - the property to set<br/>
 * @param {string} value - the value to set the property to
 * @return {boolean} true if property was set, false otherwise
 * @throws unknown property
 */
Bridge.Auction.prototype.set = function( property, value ) {
	var prefix = 'In Bridge.Auction.prototype.set - ';
	Bridge.Utilities.checkRequiredArgument( property, 'Property', prefix );
	Bridge.Utilities.checkRequiredArgument( value, 'Value for Property ' + property, prefix );
	switch ( property ) {
		case 'name' :
			this.name = value;
			break;
		case 'dealer' :
			Bridge.checkDirection( value );
			this.dealer = value;
			break;
		case 'contract' :
			this._setContract( value );
			break;
		case 'auction' :
			this._setAuction( value );
			break;			
		default :
			Bridge.Utilities.reportError( 'Unknown deal property ' + property, prefix );
	}
};

/**
 * Set the auction from auction string.
 * @param {string} the auction string
 */
Bridge.Auction.prototype._setAuction = function ( auction ) {
	var prefix = 'In Bridge.Auction._setAuction - ';
	var index = 0;
	while( index < auction.length ) {
		var char = auction[ index++ ].toLowerCase();
		if ( _.has( Bridge.calls, char ) && !Bridge.Utilities.isBid( char ) ) {
			var call = char;
		}
		else {
			var call = char + auction[ index++ ].toLowerCase();
		}
		var explanation = null;
		var annotation = null;
		while( index < auction.length && ( auction[ index ] === '(' || auction[ index ] === '{' ) ) {
			if ( auction[ index ] === '(' ) {
				var endChar = ')';
				var returnValue = Bridge.Utilities.parseContainedText( auction, index, endChar, prefix );
				annotation = returnValue.text;
			}
			else {
				var endChar = '}';
				var returnValue = Bridge.Utilities.parseContainedText( auction, index, endChar, prefix );		
				explanation = returnValue.text;
			}
			index = returnValue.position + 1;
		}
		this.addCall( call, explanation, annotation );
	}
};

/**
 * Set the contract (instead of providing bids) for this auction.
 * Appropriate bids are automatically created
 * @param {string} the contract string
 */
Bridge.Auction.prototype._setContract = function ( contract ) {
	var prefix = 'In Bridge.Auction._setContract - ';
	var index = 0; 
	if ( contract.length < index + 1 ) {
		Bridge.Utilities.reportError( 'Contract string ' + contract + ' does not specify level!', prefix );
	}
	var level = _.parseInt( contract[ index++ ] );
	if ( contract.length < index + 1 ) {
		Bridge.Utilities.reportError( 'Contract string ' + contract + ' does not specify suit!', prefix );
	}	
	var suit = contract[ index++ ].toLowerCase();
	Bridge.checkBid( level, suit, prefix );
	if ( !Bridge.Utilities.isBid( suit ) ) {
		Bridge.Utilities.reportError( 'Contract string ' + contract + ' does not specify a valid suit!', prefix );			
	}
	var doubled = false;
	var redoubled = false;
	if ( contract.length > index && contract[ index ].toLowerCase() === 'x' ) {
		doubled = true;
		index++;
		if ( contract.length > index && contract[ index ].toLowerCase() === 'x' ) {
			redoubled = true;
			index++;
		}
	}
	if ( contract.length < index + 1 ) {
		Bridge.Utilities.reportError( 'Contract string ' + contract + ' does not specify declarer!', prefix );
	}	
	var declarer = contract[ index ].toLowerCase();
	Bridge.checkDirection( declarer );
	this.clear();
	while( this.nextToCall !== declarer ) {
		this.addCall( 'p' );
	}
	this.addCall( level + suit );
	if ( doubled ) this.addCall( 'x' );
	if ( redoubled ) this.addCall( 'r' );
	this.addCall( 'p' );
	this.addCall( 'p' );
	this.addCall( 'p' );
};

/**
 * Add passes to complete the auction
 */
Bridge.Auction.prototype.addAllPass = function() {
	while( !this.contract.isComplete ) {
		this.addCall( 'p' );
	}
};

/**
 * Add a call to the auction.
 * @param {string} call - The call as a single character (p, x, r) or as two characters
 * representing level and suit.
 * @param {string} [explanation] - optional explanation for this call
 * @param {string} [annotation] - optional annotation for this call
 */
Bridge.Auction.prototype.addCall = function( call, explanation, annotation ) {
	var prefix = 'In Bridge.Auction.addCall - ';
	if ( call.length === 1 ) {
		level = 1;
		suit = call[0];
	}
	else if ( call.length === 2 ) {
		level = call[0];
		suit = call[1];
	}
	else {
		Bridge.Utilities.reportError( 'A call has to be single character or two characters but ' + call + ' has ' + call.length + ' which is invalid!', prefix);
	}
	var call = new Bridge.Call( level, suit, this.nextToCall, explanation, annotation );
	var contract = ( this.calls.length === 0 ? new Bridge.Contract() : this.calls[ this.calls.length-1 ].contract );
	this.contract = call.setContract( contract );
	this.calls.push( call );
	this.nextToCall = Bridge.directions[ this.nextToCall ].lho;
};

/**
 * Removes the last call from the auction.
 */
Bridge.Auction.prototype.removeCall = function() {
	if ( this.calls.length > 0 ) {
		this.calls.pop();
		this.nextToCall = Bridge.directions[ this.nextToCall ].rho;
		if ( this.calls.length > 0 ) {
			this.contract = this.calls[ this.calls.length-1 ].contract;
		}
		else {
			this.contract = null;
		}
	}
};

/**
 * Clears the calls in this auction.
 */
Bridge.Auction.prototype.clear = function() {
	this.nextToCall = this.dealer;
	this.calls = [];
	this.contract = null;
};

/**
 * Update the dealer for this deal.
 * This includes updating all calls.
 * @param {string} dealer - the new dealer
 */
Bridge.Auction.prototype.updateDealer = function( dealer ) {
	Bridge.checkDirection( dealer );
	this.dealer = dealer;
	var direction = dealer;
	for( var i = 0;i < this.calls.length; ++i ) {
		this.calls[i].direction = direction;
		direction = Bridge.getLHO( direction );
	}
};

/**
 * Generate a html table display of this auction.
 * No styling is added
 * @return {string} HTML table representation of this auction.
 */
Bridge.Auction.prototype.toHTMLTable = function( tableID ) {
	tableID = Bridge.Utilities.assignDefault( tableID, "auction-table" );
	var html = "<table id='" + tableID + "'>";
	html += "<thead id='auction-table-header'><tr><th>W</th><th>N</th><th>E</th><th>S</th></tr></thead>";
	html += "<tbody id='auction-table-body'><tr>";
	var direction = 'w';
	var firstTime = true;
	while( this.dealer !== direction ) {
		firstTime = false;
		direction = Bridge.getLHO( direction );
		html += "<td>-</td>";
	}
	for( var i = 0; i < this.calls.length; ++i ) {
		var call = this.calls[i];
		direction = call.direction;
		if ( direction === 'w' ) {
			if ( !firstTime ) {
				html += "</tr><tr>";
			}
		}
		html += "<td>" + call.toHTML() + "</td>";
		firstTime = false;
	}
	if ( this.calls.length > 0 ) direction = Bridge.getLHO( direction );
	var isComplete = ( this.contract ? this.contract.isComplete : false );
	if ( !isComplete ) {
		if ( direction === 'w' ) {
			html += "</tr><tr>";
		}
		html += "<td>?</td>";
		direction = Bridge.getLHO( direction );
	}
	while( direction !== 'w' ) {
		html += "<td></td>";
		direction = Bridge.getLHO( direction );
	}
	html += "</tr></tbody></table>";
	return html
};

/**
 * Generate a string display of this auction.
 * @return {string} string representation of this auction.
 */
Bridge.Auction.prototype.toString = function( ) {
	var html = '';
	for( var i = 0; i < this.calls.length; ++i ) {
		html += this.calls[i].toString();
	}
	return html
};

/**
 * Generate a html/string display of this auction.
 * @param {boolean} inStringFormat - if true then return string format else html format
 * @return {string} HTML representation of this auction.
 */
Bridge.Auction.prototype.toHTML = function( inStringFormat ) {
	var html = '';
	if ( !inStringFormat ) {
		html += this.name + ' (Dealer - ' + Bridge.directions[ this.dealer ].html + ') : ';
	}
	for( var i = 0; i < this.calls.length; ++i ) {
		html += this.calls[i].toHTML( inStringFormat );
		if ( !inStringFormat ) {
			html += ' ';
		}
	}
	if ( !inStringFormat ) {
		if ( this.calls.length > 0 ) {
			html += ' Contract : ' + this.calls[ this.calls.length-1 ].contract.toHTML( inStringFormat );
		}
		else {
			html += ' Contract : No calls added';
		}
	}
	return html
};

