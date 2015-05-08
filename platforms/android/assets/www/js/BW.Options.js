/** Define a BridgeWinners namespace */
if ( typeof BW === "undefined" ) BW = {};

/** 
 * Class to handle options setting, loading, saving etc. 
 */
BW.Options = function() {
	this.localStorageVariableName = "bw_options";
	var options = localStorage.getItem( this.localStorageVariableName );
	this.values = ( options ? JSON.parse( options ) : {} );
	_.defaults( this.values, {
		"theme" : "css/themes/bootstrap/jquery.mobile.bootstrap.min.css",
		"enableDebug": false
	});
	this.loadAll();	
};

/**
 * Get the value of an option.
 * @param {string} name the name of the option whose value is requested.
 * @return {mixed} the value of the requested option
 */
BW.Options.prototype.get = function( name ) {
	if ( ! _.has( this.values, name ) ) {
		alert( "Cannot find " + name + " in options" );
		return null;
	}	
	return this.values[ name ];
};

/**
 * Load/Propagate the value for the specified option.
 * @param {string} name the name of the option whose value is propagated.
 */
BW.Options.prototype.load = function ( name ) {
	if ( ! _.has( this.values, name ) ) {
		alert( "Cannot find " + name + " in options" );
		return;
	}
	// only one option for now
	switch ( name ) {
		case "theme" :
			// Load the stylesheet
			$( "#jqm-stylesheet" ).attr( "href", this.values[ name ] );		
			break;
		default :
			break;
	}	
};

/**
 * Load/Propagate all the options.
 */
BW.Options.prototype.loadAll = function() {
	for( var option in this.values ) {
		this.load( option );
	}
};

/**
 * Initialize the field value that the user will be using to change the options.
 * @param {string} name the name of the option whose value is initialized.
 */
BW.Options.prototype.initialize = function( name ) {
	if ( ! _.has( this.values, name ) ) {
		alert( "Cannot find " + name + " in options" );
		return;
	}	
	// Only one option for now
	switch ( name ) {
		case "theme" :
			$( "#theme" ).val( this.values[ name ] );	
			break;
		default :
			break;
	}	
};

/**
 * Initialize all the field values that the user will be using to change the options.
 */
BW.Options.prototype.initializeAll = function( options ) {
	for( var option in this.values ) {
		this.initialize( option );
	}
};

/**
 * Save all the options to local storage.
 */
BW.Options.prototype.save = function( options ) {
	localStorage.setItem( this.localStorageVariableName, JSON.stringify( this.values ) );
};

/**
 * The callback handler function whenever an option value is changed by the user.
 * @param {string} name the name of the option that has changed
 * @param {mixed} value the new value of the changed option
 */
BW.Options.prototype.change = function( name, value ) {
	this.values[ name ] = value;
	this.save();
	this.load( name );
};
