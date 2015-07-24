var BW = {};

BW.positionCards = function( parameters ) {
	if ( !parameters.container ) parameters.container = window;
	var screenWidth = $( parameters.container ).width() - 25;
	var cardWidth = (parameters.width ? parameters.width : 158);
	var cardHeight = (parameters.height ? parameters.height : 220);
	var overlap = (parameters.overlap ? parameters.overlap : 0.75);
	var fullWidth = (1-overlap) * 12 * cardWidth + cardWidth;
	var scalingFactor = screenWidth/fullWidth;
	if ( scalingFactor > 1 ) scalingFactor = 1;
	var classPrefixes = (parameters.classPrefixes ? parameters.classPrefixes : [".bw-hand-diagram-cards-field-cards"]);
	for( var j = 0; j < classPrefixes.length; ++j ) {
		var classPrefix = classPrefixes[j];
		if ( $( classPrefix ).length > 0 ) {
			$( classPrefix ).width( cardWidth * scalingFactor );
			$( classPrefix ).height( cardHeight * scalingFactor );
			var overlapWidth = (1 - overlap) * cardWidth * scalingFactor;
			var card = $( classPrefix + "-0" );
			if ( card.length > 0 ) {
				var startPosition = card.position();
				var nextPosition = startPosition;
				for( var i = 1; i <= 12; ++i ) {
					nextPosition.left += overlapWidth;
					var card = $( classPrefix + "-" + i );
					if ( card.length > 0 ) {
						var position = card.position();
						var left = nextPosition.left - position.left;
						var top = nextPosition.top - position.top;
						card.css( {left: left, top: top } );
					}
				}	
			}
		}
	}
};

$(document).ready(function(){
	BW.positionCards( { classPrefixes: ["dsad",".bw-hand-diagram-cards-field-cards"] } );
});


