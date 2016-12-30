/*
 * License Text.
 * Authors: Sriram Narasimhan
 */

/** Define a BridgeWinners namespace */
BW = {};

/**
 * The initialize function. Called only once when the app starts.
 */
BW.app = new function() {
  this.start = function() {
    // Checking for cordova and jQM has to go after BW.initialize because they will call it
    // Wait for cordova
    var cordovaReady = $.Deferred();
    document.addEventListener( "deviceready", cordovaReady.resolve, false );

    // Wait for jQueryMobile
    var jQueryMobileReady = $.Deferred();
    $( document ).bind( "pagecreate", function() {
      // Dont initialize pages
      $.mobile.autoInitialize = false;
      // In order to respect data-enhance=false attributes
    	$.mobile.ignoreContentEnabled = true;
      jQueryMobileReady.resolve();
    });
    var self = this;
    // Both events have fired.
    // Added a hack to check if running in browser and not mobile app
    // This hack is to allow testing on browser where deviceready event will not fire
    if ( this.isCordovaApp() ) {
    	$.when( cordovaReady, jQueryMobileReady ).then( this.init );
    }
    else {
      $.when( jQueryMobileReady ).then( this.init );
    }
  };
  this.init = function() {
    if ( navigator && navigator.splashscreen ) {
      navigator.splashscreen.hide();
    }
    BW.loadingDialog = new BW.dialog("loading-popup", true);
    BW.messageDialog = new BW.dialog("message-popup", true);
    $("#message-popup").on("popupafterclose", function() {
      $("#all-content").removeClass("ui-disabled");
    });
    BW.errorDialog = new BW.dialog("error-popup", true);
    BW.utils.init();
    BW.page.init();
    BW.user.init();
    BW.vote.init();
  };
  /**
   * Utility function to check if running in a browser as oppose to mobile app.
   */
  this.isCordovaApp = function() {
  	return ( window.cordova || window.PhoneGap );
  };
};
// Start the app
BW.app.start();

/**
 * Some utility functions.
 */
BW.utils = new function() {
  this.sitePrefix = "https://52.4.5.8";
  //this.sitePrefix = "https://127.0.0.1:8000";
  this.init = function() {
    // Nothing to do yet.
  };
  this.getAvatarLink = function(avatar) {
    return this.sitePrefix + avatar;
  };
  this.getRestUrl = function(suffix) {
    return this.sitePrefix + "/rest-api/v1/" + suffix;
  };
};


/**
 * A class to perform ajax requests.
 */
BW.ajax = function() {
  this.done = $.Deferred();
  this.requestFailed = false;
  this.hasError = false;
  this.errorMessage = "";
  this.data = null;
  this.send = function(parameters) {
    _.defaults(parameters, {
      method: "POST",
      headers: BW.user.getHeader(),
      timeout: 5000,
      data: {},
    });
    var url = encodeURI(BW.utils.getRestUrl(parameters.urlSuffix));
    var request = $.ajax({
  		method: parameters.method,
  		context: this,
  		url: url,
  		data: parameters.data,
  		headers: parameters.headers,
      timeout: parameters.timeout,
  	});
  	request.done(function(data) {
      this.requestFailed = false;
  		this.hasError = data.hasOwnProperty("error") && data.error;
      this.errorMessage = data.message;
      this.data = data;
      this.done.resolve();
  	});
  	request.fail( function(jqXHR, textStatus, errorThrown) {
  		this.requestFailed = true;
      this.error = true;
      this.jqXHR = jqXHR;
      this.textStatus = textStatus;
      this.errorThrown = errorThrown;
      this.errorMessage = "Error - " + textStatus + ": " + errorThrown;
      this.done.resolve();
  	});
  };
};

/**
 * A class to manage showing and hiding dialogs.
 */
BW.dialog = function(container, disableContent) {
  this.container = container;
  this.disableContent = disableContent;
  this.show = function(text) {
    $("#all-content").addClass("ui-disabled");
    $("#" + this.container + "-content").empty().append(text);
  	$("#" + this.container).popup("open");
  };
  this.hide = function() {
    $("#" + this.container).popup("close");
    $("#all-content").removeClass("ui-disabled");
  }
};

/**
 * Vote is used to load the voting problem.
 */
BW.vote = new function() {
  this.parameters = {};
  this.init = function() {
    var bidding_answers = [
     '1c','1d','1h','1s','1n',
     '2c','2d','2h','2s','2n',
     '3c','3d','3h','3s','3n',
     '4c','4d','4h','4s','4n',
     '5c','5d','5h','5s','5n',
     '6c','6d','6h','6s','6n',
     '7c','7d','7h','7s','7n',
     'x','r','p'
    ];
    this.bidding_answers_idx = {};
    _.each(bidding_answers, function(answer, index) {
      this.bidding_answers_idx[answer] = index;
    }, this);

    var lead_answers = [
     "c2", "c3", "c4", "c5", "c6", "c7", "c8", "c9", "ct", "cj", "cq", "ck", "ca", "cx",
     "d2", "d3", "d4", "d5", "d6", "d7", "d8", "d9", "dt", "dj", "dq", "dk", "da", "dx",
     "h2", "h3", "h4", "h5", "h6", "h7", "h8", "h9", "ht", "hj", "hq", "hk", "ha", "hx",
     "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9", "st", "sj", "sq", "sk", "sa", "sx",
    ];
    this.lead_answers_idx = {};
    _.each(lead_answers, function(answer, index) {
      this.lead_answers_idx[answer] = index;
    }, this);
    this.setupClickHandlers();
  };
  this.setupClickHandlers = function() {
    // Skip clicked
    $(document).on("tap", "#skip-submit-button.enabled", {self: this}, function(e) {
      e.data.self.load({"exclude": e.data.self.slug});
    });
    // Abstain clicked
    $(document).on("tap", "#abstain-submit-button.enabled", {self: this}, function(e) {
      e.data.self.vote(/*abstain=*/true);
    });
    // Vote clicked
    $(document).on("tap", "#vote-submit-button.enabled", {self: this}, function(e) {
      e.data.self.vote(/*abstain=*/false);
    });
    // Description clicked
    $(document).on("tap", "#description", {self: this}, function(e) {
      BW.messageDialog.show($("#description").html());
    });
    // level clicked
    $(document).on("tap", "#bidding-box level.enabled", {self: this}, function(e) {
      var level = _.parseInt($(this).data("level"));
      e.data.self.setLevel(level);
    });
    // call clicked
    $(document).on("tap", "#bidding-box call.enabled", {self: this}, function(e) {
      $("#bidding-box call").removeClass("selected");
      $(this).addClass("selected");
      e.data.self.setCall($(this).data("suit"), $(this).data("call"));
    });
    // card clicked
    $(document).on("tap", "#lead-box card", {self: this}, function(e) {
      $("#lead-box card").removeClass("selected");
      $(this).addClass("selected");
      e.data.self.setCard($(this).data("suit"), $(this).data("rank"));
    });
  };
  this.getLeadAnswer = function() {
    return this.lead_answers_idx[this.selectedCard];
  };
  this.getBiddingAnswer = function() {
    return this.bidding_answers_idx[this.selectedCall];
  };
  /** Set the call */
  this.setCard = function(suit, rank) {
    var card = suit + rank;
    if (this.selectedCard == card) return;
    this.selectedCard = card;
    $("#vote-submit-button").removeClass("disabled").addClass("enabled");
  };
  /** Set the call */
  this.setCall = function(suit, call) {
    if (this.selectedSuit == suit) return;
    this.selectedSuit = suit;
    this.selectedCall = call;
    $("#vote-submit-button").removeClass("disabled").addClass("enabled");
  };
  /** Set the level **/
  this.setLevel = function(level) {
    if (this.selectedLevel == level) return;
    this.selectedLevel = level;
    var auction = this.deal.getAuction();
    auction.setSelectedLevel(level);
    auction.showBiddingBox({
      "template": "concise",
      "containerID": "bidding-box",
    });
    $("#vote-submit-button").removeClass("enabled").addClass("disabled");
  };

  /**
   * Send abstain as vote for this problem to BW server
   */
  this.vote = function(abstain) {
    var data = {"public": true};
    BW.loadingDialog.show("Submitting vote...");
    if (abstain) {
      data["Abstain"] = true;
    }
    else {
      data["Answer"] = true;
      if (this.type == "bidding") {
        data["answer"] = this.getBiddingAnswer();
      }
      else {
        data["answer"] = this.getLeadAnswer();
      }
    }
    var ajaxRequest = new BW.ajax();
    var self = this;
    $.when(ajaxRequest.done).then(function() {
      BW.loadingDialog.hide();
      if (ajaxRequest.requestFailed || ajaxRequest.hasError) {
        alert("Error " + ajaxRequest.errorMessage);
      }
      else {
        self.load();
      }
    });
    ajaxRequest.send({
  		urlSuffix: "poll-answer/" + this.slug + "/",
      data: data,
  	});
  	return false;
  };
  this.load = function(data) {
    BW.loadingDialog.show("Getting voting problem...");
  	var ajaxRequest = new BW.ajax();
    var self = this;
    $.when(ajaxRequest.done).then(function() {
      BW.loadingDialog.hide();
      if (ajaxRequest.requestFailed || ajaxRequest.hasError) {
        alert("Error " + ajaxRequest.errorMessage);
      }
      else {
        self.show(ajaxRequest.data);
      }
    });
    ajaxRequest.send({
  		urlSuffix: "get-voting-problem/",
      data: data || {"slug": "lead-problem-529"},
  	});
  	return false;
  };
  this.show = function(data) {
    BW.loadingDialog.show("Loading Problem...");
    this.data = data;
    this.type = data.type.toLowerCase();
    var pageID = "";
    $("#vote-page").removeClass("lead bidding").addClass(this.type);
  	this.selectedLevel = null;
    this.selectedCall = null;
  	this.selectedCard = null;
  	var deal = new Bridge.Deal();
    Bridge.disableAllEventTriggers();
  	deal.setDealer(data.dealer);
  	deal.setVulnerability(data.vulnerability);
  	deal.getAuction().fromString(data.auction);
  	while(deal.getAuction().getNextToCall() != 's') {
      deal.rotateClockwise();
    }
    var next = deal.getAuction().getNextToCall();
  	this.direction = next;
  	deal.getHand(next).setHand( data.lin_str );
  	deal.setScoring(data.scoring);
    deal.getHand('n').setName("Pard");
    deal.getHand('e').setName("RHO");
    deal.getHand('s').setName("You");
    deal.getHand('w').setName("LHO");
    if (this.type == "bidding") {
      $("#hand").show();
      deal.getHand(next).toHTML({
  			"template": "concise",
  			"wrapperClass": "images",
  			"alternateSuitColor": true,
  			"containerID": "hand",
  		});
    }
    else {
      $("#hand").empty().hide();
    }
    var auction = deal.getAuction();
    auction.toHTML({
			"template": "full",
			"addQuestionMark": true,
			"containerID": "auction",
		});
  	this.slug = data.slug;
    if (this.type == "bidding") {
      $("bidding-box").show();
      auction.showBiddingBox({
  			"template": "concise",
  			"containerID": "bidding-box",
  		});
      $("#lead-box").empty().hide();
    } else {
      $("#lead-box").show();
      deal.getHand(next).toHTML({
  			"template": "concise",
  			"wrapperClass": "images",
  			"alternateSuitColor": true,
  			"containerID": "lead-box",
  		});
      $("bidding-box").empty().hide();
    }
    this.deal = deal;
    $("#header-text").empty().append(this.type + " problem");
    for(var direction in Bridge.directions) {
      var value = deal.isVulnerable(direction) ? "yes" : "no";
      $("#vul-" + direction).attr("data-vulnerable", value);
    }
    $("#vul-" + deal.getDealer()).empty().append("D");
    $("#scoring").empty().append(data.scoring);
    $("#avatar").css("background-image", "url(" + BW.utils.getAvatarLink(data.avatar) + ")");
    $("#comments").empty().append(data.num_comments);
    $("#likes").empty().append(data.num_likes);
    $("#user").empty().append(data.author);
    $("#description").empty().append(data.description);
    BW.loadingDialog.hide();
  };
};

/*
 * Page is used to load html pages into a cache to be retrieved as and
 * when users browse to different sections of the app.
 */
BW.page = new function() {
  // The pages that need to be cached.
  this.pages = {
    "login.html": true,
    "account.html": true,
    "vote.html": true,
    "create.html": true,
    "history.html": true,
    "alerts.html": true,
  };
  // jquery deferred for each objects that need to be fired when page has
  // been retrieved.
  this.resolvers = {};
  // The actual page contents for each retrieved page.
  this.pageContents = {};
  // Callbacks when specific pages are loaded.
  this.pageLoadedCallbacks = {};
  this.setupClickHandlers = function() {
    // Menu item change
    $(document).on("tap", ".footer-outer-container .menu-item", {self: this}, function(e) {
      var item = $(this).data("item");
      BW.page.load(item + ".html", function() {
        e.data.self.setActiveTab(item);
      });
    });
    // Section change
    $(document).on("tap", "[data-role='section-change']", function(e) {
      $("[data-role='section']").hide();
      var section = $(this).data("section");
      $("[data-role='section'][data-name='" + section + "']").show();
    });
  };
  this.init = function() {
    this.setupClickHandlers();
    this.registerCallbacks();
    for(var page in this.pages) {
      this.resolvers[page] = $.Deferred();
      this.pageContents[page] = null;
      var request = $.ajax( {
        url: page,
        self: this,
        timeout: 5000,
      });
      request.done(function(html) {
        this.self.pageContents[this.url] = html;
        this.self.resolvers[this.url].resolve();
      });
      request.fail( function() {
    		this.self.pageContents[this.url] = null;
    	});
    };
  };
  this.get = function(page, callback) {
    var self = this;
    if (page in this.pages) {
      return $.when(self.resolvers[page]).then(function() {
        callback(self.pageContents[page]);
      });
    }
    return null;
  };
  this.registerCallbacks = function() {
    this.pageLoadedCallbacks["account.html"] = BW.user.loadAccount.bind(BW.user);
    this.pageLoadedCallbacks["vote.html"] = BW.vote.load.bind(BW.vote);
  };

  /**
   * Set active tab.
   */
  this.setActiveTab = function(item) {
    $(".footer-outer-container .menu-item").removeClass("selected").addClass("not-selected");
    $(".footer-outer-container [data-item='" + item + "']").removeClass("not-selected").addClass("selected");
    $(".footer-inner-container .menu-item").removeClass("selected").addClass("not-selected");
    $(".footer-inner-container [data-item='" + item + "']").removeClass("not-selected").addClass("selected");
  };

  this.load = function(pageName, callback) {
    BW.loadingDialog.show("Loading Page...");
    var self = this;
    var promise = this.get(pageName, function(html) {
      $("#content").empty().append(html);
      BW.loadingDialog.hide();
      if (pageName in self.pageLoadedCallbacks) {
        self.pageLoadedCallbacks[pageName]();
      }
      if (callback) {
        callback();
      }

    });
    if (!promise) {
      BW.loadingDialog.hide();
      BW.loadingDialog.show("Something went terribly wrong. Try restarting the app!");
    }
    return;
  };

  this.hideHeaderFooter = function() {
    $("#footer").hide();
    $("#header").hide();
  };
  this.showHeaderFooter = function() {
    $("#header").show();
    $("#footer").show();
  };
};

/**
 * BW.user represents the currently active user and also includes
 * utilities to login and authenticate on the bridgewinners server to load
 * the current user.
 */
BW.user = new function() {
  this.accessTokenName = "BW.accessToken";
  this.accessToken = localStorage.getItem(this.accessTokenName);
  this.userInfo = null;
  /**
   * Load a user if there is an accessToken, else show login page.
   */
  this.init = function() {
    this.setupClickHandlers();
    if (!this.accessToken) {
      BW.page.hideHeaderFooter();
      BW.page.load("login.html");
    }
    else {
      return this.authenticateAccessToken();
    }
  };
  this.setupClickHandlers = function() {
    $(document).on( "tap", "#login-submit-button", {self: this}, function( e ) {
      return e.data.self.login($( "#username" ).val(), $( "#password" ).val());
  	});
    $(document).on( "tap", "#logout-submit-button", {self: this}, function( e ) {
  		return e.data.self.logout();
  	});
  };
  /**
   * Load user info into account page.
   */
  this.loadAccount = function() {
    $("[data-role='section']").hide();
    $("#header-text").empty().append("account");
    $("#name").empty().append(this.userInfo.name);
    $("#avatar").css("background-image", "url(" + BW.utils.getAvatarLink(this.userInfo.avatar) + ")");
    $("[data-role='section'][data-name='account-main-page']").show();
  };

  /**
   * Try to login to BW server.
   * @param {string} username the username to use to login
   * @param {string} password the password to use to login
   */
  this.login = function( username, password ) {
    BW.loadingDialog.show("Logging In...");
  	var ajaxRequest = new BW.ajax();
    var self = this;
    $.when(ajaxRequest.done).then(function() {
      BW.loadingDialog.hide();
      if (ajaxRequest.requestFailed || ajaxRequest.hasError) {
        self.loginFailCallback(ajaxRequest.errorMessage);
      }
      else {
        self.loginSuccessCallback(ajaxRequest.data);
      }
    });
    ajaxRequest.send({
  		urlSuffix: "get-auth-token/",
  		data: { username: username, password: password },
  		headers: {},
  	});
  	return false;
  };

  /**
   * getHeader gets the authentication access token header.
   */
  this.getHeader = function() {
    return { 'Authorization': 'Token ' + this.accessToken };
  }
  /**
   * Login Ajax done call back
   */
  this.loginSuccessCallback = function(data) {
  	this.accessToken = data[ "token" ];
  	localStorage.setItem(this.accessTokenName, this.accessToken );
    this.authenticateAccessToken();
    return false;
  };


  /**
   * Login Ajax fail call back
   */
  this.loginFailCallback = function(message) {
    this.accessToken = null;
    localStorage.removeItem(this.accessTokenName);
    BW.loadingDialog.show("Unable to Login: " + message);
  };

  /**
   * Authenticate the access token with the BW server
   */
  this.authenticateAccessToken = function() {
  	// Connect to BW server to check if access token is still ok
    BW.loadingDialog.show("Authenticating Access...");
  	var ajaxRequest = new BW.ajax();
    var self = this;
    $.when(ajaxRequest.done).then(function() {
      BW.loadingDialog.hide();
      if (ajaxRequest.requestFailed || ajaxRequest.hasError) {
        self.authenticationFailCallback(ajaxRequest.errorMessage);
      }
      else {
        self.authenticationSuccessCallback(ajaxRequest.data);
      }
    });
    ajaxRequest.send({
  		urlSuffix: "get-profile/",
  		method: "GET",
  	});
  	return false;
  };
  /**
   * Authentication Ajax sucess call back
   */
  this.authenticationSuccessCallback = function(data) {
    this.userInfo = data;
    BW.page.showHeaderFooter();
    BW.page.load("vote.html", function() {
      BW.page.setActiveTab("vote");
    });
  };

  /**
   * Authentication Ajax fail call back
   */
  this.authenticationFailCallback = function(message) {
    BW.loadingDialog.show("Unable to Authenticate: " + message);
  };
  /**
   * Logout from bridgewinner server.
   */
  this.logout = function() {
    this.accessToken = null;
    localStorage.removeItem(this.accessTokenName);
    BW.page.hideHeaderFooter();
    BW.page.load("login.html");
    return false;
  };
};
