var colorPalette = [ "#5158AB", "#41AE32", "#E74224", "#E73390", "#2F8E9A", "#D056F2", "#855D1B",
"#3A7140", "#AD4346", "#C277AF", "#E07B39", "#A89829", "#436790", "#2D9B80", "#D446B7", "#E06A84",
"#B97AD8", "#697224", "#756CE2", "#9487C2", "#A53381", "#589FCE", "#4DA65F", "#7CA637", "#7D5780",
"#E5494C", "#D93366", "#6088E1", "#864A9D", "#DC765A", "#3D7A21", "#995231", "#9F4361", "#C5872E",
"#E267AB", "#AC4B14", "#E43AD6", "#B359D7", "#B53625", "#E9721E"];

var problem = 	{
	number: 5816,
	type: "bidding",
	name: "Greg Humphreys",
	image: "http://media.bridgewinners.com/cache/47/a8/47a8a90973610fdf86881ccacdbe3cd1.png",
	direction: 's',
	deal: {
		dealer: 'n',
		vulnerability: 'e',
		scoring: "20VP",
		hands : {
			s: {
				direction:"s",
				name:"South",
				hand:"sKJT32hJ32dKcAKQJ"
			}				
		},
		auction: "p2dp2sp3dp",
		notes: "Pd is very sound in 2nd seat red."
	},
	myVote: "5d",
	votes: {
		"total": 25,
		"3d": 2,
		"4c": 6,
		"4d": 3,
		"4n": 1,
		"5d": 6,
		"5h": 2,
		"6s": 4,
		"abstain": 1
	}
};

/** Define a BridgeWinners namespace */
if ( typeof BW === "undefined" ) BW = {};

/**
 * A class to represent a view of bidding/lead problem
 */
BW.ViewProblem = function( containerID, listName, variableName ) {
	this.containerID = containerID;	
	this.listName = listName;
	this.variableName = variableName;
};

/**
 * Show the list of problems
 */
BW.ViewProblem.prototype.showList = function() {
	var publishedItemsName = "BW::" + this.variableName;
	var publishedProblems = localStorage.getItem( publishedItemsName );	
	if ( !publishedProblems ) this.problemList = [];
	else this.problemList = JSON.parse( publishedProblems );
	var html = "";
	if ( this.problemList.length <= 0 ) {
		html += "<h4>There are no problems in the " + this.listName + "list</h4>";	
	}
	else {
		html += "<ul data-role='listview' data-inset='false'>";
		_.each( this.problemList, function( problem, index ) {
			var deal = new Bridge.Deal();
			deal.fromJSON( problem.deal );
			var type = problem.type;
			var hand = deal.getHand( problem.handDirection );
			var icon = ( type === "bidding" ? "img/Box-Red.png" : "img/cardback.png" );	
			html += "<li><a role='page' data-page='view.html' data-problem-index='" + index + "'>";
			html += "<img src='" + icon + "' alt='" + type + "' class='ui-li-icon'>"
			html += "<div>" + hand.toHTML( { registerChangeHandler: false } ) + "</div>";
			var spanClass = "bw-published-problem-information";
			var secondLine = "<span class='" + spanClass + "'>" + BW.scoringTypes[ deal.get( "scoring" ) ] + "</span>, <span class='" + spanClass + "'>" + " Dealer: " + Bridge.directions[ deal.get( "dealer" ) ].name + "</span>, <span class='" + spanClass + "'>" + " Vul: " + Bridge.vulnerabilities[ deal.get( "vulnerability" ) ].name + "</span>";	
			html += "<div>" + secondLine + "</div></a></li>";					
		}, this );			
		html += "</ul>";
	}		
	$( "#" + this.containerID ).empty().append( html );	
};

/**
 * Show one problem
 */
BW.ViewProblem.prototype.showProblem = function( index ) {
	var html = "";
	if ( index < 0 || index >= this.problemList.length ) {
		html += "<h4>" + index + " is not valid problem index in " + this.listName + "</h4>";	
	}
	else {
		var problem = this.problemList[ index ];
	}
};
