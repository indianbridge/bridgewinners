$(function() {
  try {
    // Bridge.disableAllEventTriggers();
    var deal = new Bridge.Deal();
    deal.fromString("s=S7HDQT8742CAT8543");
    deal.getHand('s').showHand("hand");
    // deal.getHand('s').toHTML({
		// 	"template": "concise",
		// 	"wrapperClass": "images",
		// 	"alternateSuitColor": true,
		// 	"containerID": "hand",
		// });
    // Bridge.enableAllEventTriggers();
    // deal.toHTML("vulnerability", {"deal": deal, "container": "#vulnerability"});
    deal.showVulnerability("vulnerability");
    // deal.toHTML({
    //   "template": "deal.vulnerability",
		// 	"containerID": "vulnerability",
    //   "registerChangeHandlers": true,
    //   "registerClickHandlers": true
		// });
    deal.setVulnerability('b');
    deal.showDealer("dealer");
    // deal.toHTML({
    //   "template": "deal.dealer",
		// 	"containerID": "dealer",
    //   "registerChangeHandlers": true,
    //   "registerClickHandlers": true
		// });
    deal.setDealer('e');
  }
  catch ( err ) {
    alert(err.message);
  }
});
