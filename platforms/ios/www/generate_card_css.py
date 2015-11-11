suits = [ 's', 'h', 'd', 'c' ]
ranks = [ 'a', 'k', 'q', 'j', 't', '9', '8', '7', '6', '5', '4', '3', '2', 'x' ]
prefixes = [ '.bw-create-hand-images-field-cards', '.bw-hand-images-field-cards', '.bw-card-deck-field-cards' ]
fo = open( 'css/card_images.css', 'w' )
fo.write( ', '.join(prefixes) )
fo.write( ' {\n' )
fo.write( '\tdisplay: inline-block;\n' )
fo.write( '\tposition: relative;\n' )
fo.write( '\twidth: 0px;\n' )
fo.write( '\theight: 0px;\n' )
fo.write( '\tcursor: pointer;\n' )
fo.write( '}\n' )

for suit in suits:
	for rank in ranks:
		classes = []
		for prefix in prefixes:
			classes.append( prefix + '-' + suit + '-' + rank )
		fo.write( ', '.join(classes) )
		fo.write( ' {\n' )
		fo.write( '\tbackground-image: url(img/cards/' + suit + rank + '.png);\n' )
		fo.write( '\tbackground-size: cover;\n' )
		fo.write( '}\n' )
		
fo.close()
		
		
