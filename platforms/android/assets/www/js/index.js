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
    if (navigator.userAgent.match(/iPhone|iPad|iPod/i)) {
      $(".footer-inner-container").addClass("ios");
      $(".footer-outer-container").addClass("ios");
    }
    BW.loadingDialog = new BW.dialog("loading-popup", true);
    BW.messageDialog = new BW.dialog("message-popup", true);
    $("#message-popup").on("popupafterclose", function() {
      $("#all-content").removeClass("ui-disabled");
    });
    BW.errorDialog = new BW.dialog("error-popup", true);
    BW.utils.init();
    BW.page.init();
    BW.vote.init();
    BW.create.init();
    BW.history.init();
    BW.alerts.init();
    BW.user.init();
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
  this.capitalize = function(str) {
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
  };
  this.getAvatarLink = function(avatar) {
    return this.sitePrefix + avatar;
  };
  this.getRestUrl = function(suffix) {
    return this.sitePrefix + "/rest-api/v1/" + suffix;
  };
  this.setAttribute = function(element, attributeName, attributeValue) {
    element.data(attributeName, attributeValue).attr("data-" + attributeName, attributeValue);
  };
  this.setSectionValue = function(element, sectionName) {
    this.setAttribute(element, "section", sectionName);
  };
  this.setBackValue = function(element, value) {
    this.setAttribute(element, "back", value);
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
      method: "GET",
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
 * Alerts page.
 */
BW.alerts = new function() {
  this.init = function() {
    this.setupClickHandlers();
  };
  this.setupClickHandlers = function() {};
  this.load = function() {
    $("#header-text").empty().append("Alerts");
    BW.loadingDialog.show("Getting Alerts...");
    var ajaxRequest = new BW.ajax();
    var self = this;
    $.when(ajaxRequest.done).then(function() {
      BW.loadingDialog.hide();
      if (ajaxRequest.requestFailed || ajaxRequest.hasError) {
        BW.messageDialog.show("Error " + ajaxRequest.errorMessage);
      }
      else {
        var html = "";
        if (ajaxRequest.data.alerts.length > 0) {
          _.each(ajaxRequest.data.alerts, function(alert) {
            html += "<li data-icon='false'><a href='#'>";
            html += "<p class='alert'>";
            html += "<img class='avatar-alert' src='" + BW.utils.getAvatarLink(alert.instigator_avatar) + "'/>";
            var text = alert.blurb.replace("a href", "a1 href");
            text = text.replace("</a>", "</a1>");
            text = text.replace("<strong>", "<span class='name-alert'>");
            text = text.replace("</strong>", "</span>");
            html += "<span class='text-alert'>" + text + "</span>";
            html += "</p>";
            html += "</a></li>";
          });
        } else {
          html += "You have no alerts.";
        }
        $("#alerts-list").empty().append(html);
        $("#alerts-list").listview();
      }
    });
    ajaxRequest.send({
  		urlSuffix: "get-alerts/",
      data: {
    		start:0,
    		end: 4
      },
  	});
  	return false;
  };
};

/**
 * History page.
 */
BW.history = new function() {
  this.currentSection = null;
  this.init = function() {
    var self = this;
    this.setupClickHandlers();
  };
  this.setupClickHandlers = function() {
    var self = this;
    $(document).on("tap", "#history-revote-button.enabled", function() {
      BW.page.load("vote.html", function() {
        BW.page.setActiveTab("vote");
      }, {"slug": self.slug});
    });
    // section changed
    _.each(["history-voted-page", "history-published-page", "history-drafts-page"], function(sectionName) {
      BW.page.registerSectionChangeCallback(sectionName, function(section) {
        $("#back-button").addClass("hide");
        $("#history-menu").removeClass("hide");
        self.currentSection = section;
        $(".history-menu-item").removeClass("selected");
        $("[data-section='" + section + "'").addClass("selected");
        switch(section) {
          case "history-drafts-page":
            self.loadDrafts();
            break;
          case "history-voted-page":
            self.loadRecentlyVoted();
            break;
          case "history-published-page":
            self.loadRecentlyPublished();
            break;
          default:
            break;
        }
      });
    });
    BW.page.registerSectionChangeCallback("history-results-page", function(section, parameters) {
      self.loadProblem(parameters.slug, parameters.back);
    });
    BW.page.registerSectionChangeCallback("history-responses-page", function(section, parameters) {
      self.loadResponses(parameters.slug, parameters.back);
    });
  };
  this.showResponses = function(slug, backPage) {
    $("#back-button").removeClass("hide");
    BW.utils.setAttribute($("#back-button"), "section", "history-results-page");
    BW.utils.setAttribute($("#back-button"), "slug", slug);
    BW.utils.setAttribute($("#back-button"), "back", backPage);
    $("#history-menu").addClass("hide");
    var poll = this.polls[slug];
    var html = "";
    if (poll.all_answers.length > 0) {
      _.each(poll.all_answers, function(answer){
        var answerClass = "";
        if (poll.my_answer.answer === answer.text) {
          answerClass = "my_answer";
        }
        html += "<div class='history-response-item enabled " + answerClass + "' data-role='sub-section-change' data-section='history-response-page-" + answer.text + "'>";
        if (poll.type.toLowerCase() === "bidding") {
          html += Bridge.getBidHTML(answer.text);
        } else {
          html += Bridge.getCardHTML(answer.text);
        }
        html += "</div>";
      });
      $("#history-responses-menu").empty().append(html);
      html = "";
      _.each(poll.all_answers, function(answer){
        var sectionName = "history-response-page-" + answer.text;
        html += "<div id='" + sectionName + "' data-name='" + sectionName + "' data-role='sub-section'>";
        html += "<div class='history-response-summary'>";
        html += answer.count + " Votes (" + answer.percent + "%)";
        html += "</div>";
        html += "<div class='history-response-voters'>";
        html += "</div>";
        html += "<ul class='history-response-voters'>";
        _.each(answer.public_responses, function(response) {
          html += "<li data-icon='false'><a href='#'>";
          html += "<p>";
          html += "<img class='avatar-response' src='" + BW.utils.getAvatarLink(response.avatar) + "'/>";
          html += "<span class='name-response'>" + response.name + "</span>";
          html += "</p>";
          html += "</a></li>";
        });
        html += "</ul>";
        html += "</div>";
      });
      $("#history-responses-sections").empty().append(html);
      $(".history-response-voters").listview();
      var shownSectionName = "history-response-page-" + poll.all_answers[0].text;
    } else {
      var shownSectionName = "history-response-page-empty";
      var html = ""
      html += "<div class='history-no-responses'>No responses have been submitted yet.</div>";
      $("#history-responses-menu").empty().append(html);
    }
    BW.page.showSubSection(shownSectionName);
  };
  this.loadResponses = function(slug, backPage) {
    BW.loadingDialog.show("Getting Responses...");
    var ajaxRequest = new BW.ajax();
    var self = this;
    $.when(ajaxRequest.done).then(function() {
      BW.loadingDialog.hide();
      if (ajaxRequest.requestFailed || ajaxRequest.hasError) {
        BW.messageDialog.show("Error " + ajaxRequest.errorMessage);
      }
      else {
        self.polls[ajaxRequest.data.slug] = ajaxRequest.data;
        self.polls[ajaxRequest.data.slug].all_answers.sort(function(a,b) {
          return b.percent - a.percent;
        });
        self.showResponses(slug, backPage);
      }
    });
    ajaxRequest.send({
      urlSuffix: "get-voting-problem/",
      data: {
        slug: slug,
      },
    });
    return false;

  };
  this.loadProblem = function(slug, backPage) {
    $("#back-button").removeClass("hide");
    BW.utils.setAttribute($("#back-button"), "section", backPage);
    $("#history-menu").addClass("hide");
    this.slug = slug;
    this.showProblem(this.polls[slug]);
  	return false;
  };
  this.showProblem = function(data) {
    BW.loadingDialog.show("Displaying Problem...");
    var type = data.type.toLowerCase();
  	var deal = new Bridge.Deal();
  	deal.setDealer(data.dealer);
  	deal.setVulnerability(data.vulnerability);
  	deal.getAuction().fromString(data.auction);
    if (type === "bidding") {
    	while(deal.getAuction().getNextToCall() != 's') {
        deal.rotateClockwise();
      }
    }
    var hand = deal.getHand(deal.getAuction().getNextToCall());
  	hand.setHand( data.lin_str );
  	deal.setScoring(data.scoring);
    deal.getHand('n').setName("Pard");
    deal.getHand('e').setName("RHO");
    deal.getHand('s').setName("You");
    deal.getHand('w').setName("LHO");
    $("#avatar-results").css("background-image", "url(" + BW.utils.getAvatarLink(data.author.avatar) + ")");
    $("#user-results").empty().append(data.author.name);
    $("#comments-results").empty().append(data.num_comments);
    $("#likes-results").empty().append(data.num_likes);
    var auction = deal.getAuction();
    auction.showAuction("auction-results");
    for(var direction in Bridge.directions) {
      var value = deal.isVulnerable(direction) ? "yes" : "no";
      BW.utils.setAttribute($("#vul-" + direction + "-results"), "vulnerable", value);
      //$("#vul-" + direction + "-results").attr("data-vulnerable", value).data("vulnerable", value).empty();
    }
    $("#vul-" + deal.getDealer() + "-results").empty().append("D");
    $("#scoring-results").empty().append(data.scoring);
    hand.showHand("hand-results", {
      registerClickHandlers: false,
    });
    $("#description-results").empty().append(data.description);
    var html = "";
    _.each(data.all_answers, function(answer){
      var answerClass = "";
      if (data.my_answer.answer === answer.text) {
        answerClass = "my_answer";
      }
      html += "<div class='answer-result'>";
      html += "<div class='answer-result-column " + answerClass + "'>";
      if (data.type.toLowerCase() === "bidding") {
        html += Bridge.getBidHTML(answer.text);
      } else {
        html += Bridge.getCardHTML(answer.text);
      }
      html += "</div>";
      html += "<div class='answer-result-column " + answerClass + "'>";
      html += answer.count;
      html += "</div>";
      html += "<div class='answer-result-column'>";
      html += "(" + answer.percent + "%)";
      html += "</div>";
      html += "<div class='answer-result-column answer-result-avatar'>";
      _.each(answer.public_responses.slice(0,3), function(response) {
        html += "<img class='avatar-result' src='" + BW.utils.getAvatarLink(response.avatar) + "'/>";
      });
      html += "</div>";
      html += "</div>";
    });
    $("#answers-results").empty().append(html);
    BW.utils.setAttribute($("#history-voters-button"), "slug", data.slug);
    BW.utils.setAttribute($("#history-voters-button"), "back", $("#back-button").data("section"));
    BW.loadingDialog.hide();
  };
  this.loadDrafts = function() {
  };
  this.getHTML = function(data, sectionName, showAuthor, showAnswer, showStats) {
    var html = "";
    _.each(data.polls, function(item) {
      var hand = new Bridge.Hand('s');
      hand.fromString(item.lin_str);
      var handHtml = hand.toHTML({
        template: "hand.concise",
        registerClickHandlers: false,
        registerChangeHandlers: false
      });
      html += "<li class='enabled' data-role='section-change' data-section='history-results-page' ";
      html += "data-back='" + sectionName + "' data-slug='" + item.slug + "'><a href='#'>";
      html += "<img class='ui-li-icon problem-type' src='";
      if (item.type === "Bidding") {
        html += "css/img/bidding.png";
      } else {
        html += "css/img/lead.png";
      }
      html += "'/>";
      if (showAuthor) {
        html += "<p>";
        html += "<img class='avatar' src='" + BW.utils.getAvatarLink(item.author.avatar) + "'/>";
        html += "<span class='name'>" + item.author.name + "</span>";
        html += "</p>";
      }
      html += handHtml;
      if (showAnswer) {
        if (item.my_answer) {
          if (item.my_answer.answer !== "Abstain") {
            html += "<span class='percentage'>" + item.my_answer.percent + "%</span>";
            if (item.type === "Bidding") {
              html += "<span class='answer'>" + Bridge.getBidHTML(item.my_answer.answer) + "</span>";
            } else {
              html += "<span class='answer'>" + Bridge.getCardHTML(item.my_answer.answer) + "</span>";
            }
          } else {
            html += "<span class='percentage'>-</span>";
            html += "<span class='answer'>" + item.my_answer.answer + "</span>";
          }
        } else {
          html += "<span class='percentage'>-</span>";
          html += "<span class='answer'>-</span>";
        }
      }
      html += "<p>";
      html += "<img class='icon' src='css/img/comments_black.png'><span class='stats num_comments'>" + item.num_comments + "</span>"
      html += "<img class='icon' src='css/img/likes_black.png'><span class='stats num_likes'>" + item.num_likes + "</span>"
      html += "<img class='icon' src='css/img/answers_black.png'><span class='stats num_answers'>" + item.num_answers + "</span>"
      html += "</p>";
      html += "</a></li>";
    });
    return html;
  };
  this.getRecent = function(pollType) {
    if (pollType === "voted") {
      var url = "get-recent-answers/";
      var sectionName = "history-voted-page";
      var message = "Getting Recently Voted Problems...";
      var showAuthor = true;
      var showAnswer = true;
      var emptyText = "You have not voted on any problems yet.";
    } else {
      var url = "get-recent-published/";
      var sectionName = "history-published-page";
      var message = "Getting Recently Published Problems...";
      var showAuthor = false;
      var showAnswer = false;
      var emptyText = "You have not published any problems yet.";
    }
    var container = $("#history-" + pollType + "-list");
    BW.loadingDialog.show(message);
    var ajaxRequest = new BW.ajax();
    var self = this;
    $.when(ajaxRequest.done).then(function() {
      BW.loadingDialog.hide();
      if (ajaxRequest.requestFailed || ajaxRequest.hasError) {
        BW.messageDialog.show("Error " + ajaxRequest.errorMessage);
      }
      else {
        self.polls = {};
        if (ajaxRequest.data.polls.length > 0) {
          _.each(ajaxRequest.data.polls, function(poll) {
            poll.all_answers.sort(function(a,b) {
              return b.percent - a.percent;
            });
            self.polls[poll.slug] = poll;
          });
          var html = self.getHTML(ajaxRequest.data, sectionName, showAuthor, showAnswer);
        } else {
          var html = "<li>" + emptyText + "</li>";
        }
        container.empty().append(html);
        container.listview("refresh");
      }
    });
    ajaxRequest.send({
  		urlSuffix: url,
      data: {
    		start:0,
    		end: 4,
        num_responses: 3,
      },
  	});
  	return false;
  };
  this.loadRecentlyVoted = function() {
    return this.getRecent("voted");
  };
  this.loadRecentlyPublished = function() {
    return this.getRecent("published");
  };

  this.load = function() {
    $("#header-text").empty().append("History");
    $(".history-list").listview();
    BW.page.showSection("history-published-page");
  };
};

/**
 * Create is used to create a voting problem.
 */
BW.create = new function() {
  this.deal = null;
  this.handDirection = 's';
  this.drafts = [];
  this.init = function() {
    this.setupClickHandlers();
  };
  this.getSavedDraftsName = function() {
    return BW.user.getUserName() + "-create-drafts-saved-name";
  };
  this.loadDrafts = function() {
    var savedDrafts = localStorage.getItem(this.getSavedDraftsName());
    if (savedDrafts) {
      this.drafts = [];
      var drafts = JSON.parse(savedDrafts);
      _.each(drafts, function(draft){
        var deal = new Bridge.Deal();
        deal.fromJSON(draft.deal);
        this.drafts.push({
          "section": draft.section,
          "deal": deal,
        });
      }, this);
    } else {
      this.drafts = [
        {
          "section": "create-hand-page",
          "deal": this.createNewDeal(),
        }
      ];
      this.saveDrafts();
    }
  };
  this.createNewDeal = function() {
    var deal = new Bridge.Deal();
    deal.setScoring("MPs");
    deal.getHand('n').setName("Pard");
    deal.getHand('e').setName("RHO");
    deal.getHand('s').setName("You");
    deal.getHand('w').setName("LHO");
    return deal;
  };
  this.saveDrafts = function() {
    var drafts = [];
    _.each(this.drafts, function(draft){
      drafts.push({
        "section": draft.section,
        "deal": draft.deal.toJSON(),
      });
    }, this);
    localStorage.setItem(this.getSavedDraftsName(), JSON.stringify(drafts));
  };
  this.sections = {
    "create-hand-page": {
      back: "",
      forward: "create-info-page",
    },
    "create-info-page": {
      back: "create-hand-page",
      forward: "create-auction-page",
    },
    "create-auction-page": {
      back: "create-info-page",
      forward: "create-description-page",
    },
    "create-description-page": {
      back: "create-auction-page",
      forward: "create-review-page",
    },
    "create-review-page": {
      back: "create-description-page",
      forward: "",
    },
  };
  this.getSection = function() {
    return this.currentDraft.section;
  };
  this.setSection = function(section) {
    this.currentDraft.section = section;
    this.saveDrafts();
  };
  this.setupClickHandlers = function() {
    var self = this;
    // reset clicked
    $(document).on("tap", "#create-reset-button.enabled", function(e) {
      self.reset();
    });
    // Description changed
    $(document).on("input", "#create-description-page #description", function(e) {
      self.deal.setNotes($("#create-description-page #description").val());
    });
    // publish clicked
    $(document).on("tap", "#create-publish-button.enabled", function(e) {
      self.publish();
    });
    // section changed
    for (var sectionName in this.sections) {
      BW.page.registerSectionChangeCallback(sectionName, function(section) {
        self.setSection(section);
        var sectionConfig = self.sections[section];
        if (sectionConfig["back"]) {
          $("#back-button").removeClass("hide");
          BW.utils.setAttribute($("#back-button"), "section", sectionConfig["back"]);
          //.data("section", sectionConfig["back"]);
        } else {
          $("#back-button").addClass("hide");
        }
        if (sectionConfig["forward"]) {
          var backSection = sectionConfig["forward"];
        } else {
          var backSection = "";
        }
        BW.utils.setAttribute($("#create-continue-button"), "section", backSection);
        self.updateStatus();
      });
    }
  };
  this.reset = function() {
    this.currentDraft.section = "create-hand-page";
    this.currentDraft.deal = this.createNewDeal();
    this.saveDrafts();
    this.load();
  };
  /**
   * Publish this problem on the BW Server
   */
  this.publish = function() {
  	var deal = this.deal;
  	var data = {};
    data[ "type" ] = "Bidding";
  	// if ( this.type === "bidding" ) data[ "type" ] = "Bidding";
  	// else data[ "type" ] = "Lead";
    var scoringMapping = {
      "MPs": "Matchpoints",
      "IMPs": "KO",
      "BAM": "BAM",
      "Total": "TP",
    };
  	data[ "scoring" ] = scoringMapping[deal.getScoring()];
  	data[ "vul" ] = deal.getVulnerability();
  	if ( data[ "vul" ] === '-' ) data[ "vul" ] = 0;
  	data[ "dealer" ] = deal.getDealer().toUpperCase();
  	data[ "auction" ] = deal.getAuction().toString().toUpperCase();
  	data[ "description" ] = deal.getNotes();
  	var hand = deal.getHand( this.handDirection );
  	for( var i = 0; i < Bridge.suitOrder.length; ++i ) {
  		var field = "hand_" + i;
  		data[ field ] = hand.getCardsInSuit( Bridge.suitOrder[i] );
  	}
    BW.loadingDialog.show("Submitting New Problem...");
    var ajaxRequest = new BW.ajax();
    var self = this;
    $.when(ajaxRequest.done).then(function() {
      BW.loadingDialog.hide();
      if (ajaxRequest.requestFailed || ajaxRequest.hasError) {
        alert("Error " + ajaxRequest.errorMessage);
      }
      else {
        BW.messageDialog.show("Problem Published");
        self.reset();
      }
    });
    ajaxRequest.send({
  		urlSuffix: "create-problem/",
      method: "POST",
      data: data,
  	});
  	return false;
  };
  this.updateStatus = function() {
    if (!this.deal) return;
    $("#hand-header").show();
    $("#hand").show();
    $("#create-buttons").show();
    var section = this.getSection();
    if (section == "create-hand-page") {
      $("#header-text").empty().append("Create");
      var currentHand = this.deal.getHand(this.handDirection);
      var count = currentHand.getCount();
      if (count == 13) {
        $("#create-continue-button").removeClass("disabled").addClass("enabled");
      } else {
        $("#create-continue-button").removeClass("enabled").addClass("disabled");
      }
    } else if (section == "create-info-page") {
      $("#header-text").empty().append("Create");
      $("#create-continue-button").removeClass("disabled").addClass("enabled");
    } else if (section == "create-auction-page") {
      $("#header-text").empty().append("Create");
      var auction = this.deal.getAuction();
      if (auction.getContract().isComplete || auction.getNextToCall() !== this.handDirection) {
        $("#create-continue-button").removeClass("enabled").addClass("disabled");
      }
      else {
        $("#create-continue-button").removeClass("disabled").addClass("enabled");
      }
    } else if (section == "create-description-page") {
      $("#header-text").empty().append("Add Problem Description");
      $("#create-continue-button").removeClass("disabled").addClass("enabled");
    } else if (section == "create-review-page") {
      $("#header-text").empty().append("Final Review");
      $("#hand-header").hide();
      $("#hand").hide();
      $("#create-buttons").hide();
    }
    else {
    }
  };
  this.load = function(draftNumber) {
    this.loadDrafts();
    draftNumber = draftNumber || 0;
    this.currentDraftNumber = draftNumber;
    this.currentDraft = this.drafts[draftNumber];
    BW.page.showSection(this.currentDraft.section);
    var self = this;
    $("#header-text").empty().append("Create");
    var deal = this.currentDraft.deal;
    deal.setActiveHand(this.handDirection);
    deal.getHand(this.handDirection).showHand("hand", {
      registerClickHandlers: false,
    });
    deal.showCardDeck("deck");
    deal.showScoring("scoring");
    deal.showVulnerability("vulnerability");
    deal.showDealer("dealer");
    var auction = deal.getAuction();
    auction.showAuction("auction");
    auction.toHTML({
      containerID: "special_calls",
      template: "auction.bidding-box.special_calls",
    });
    auction.toHTML({
      containerID: "bidding-box",
      template: "auction.bidding-box.full",
    });
    $("#create-description-page #description").val(deal.getNotes());
    deal.getHand(this.handDirection).showHand("hand-review", {
      registerClickHandlers: false,
    });
    var auction = deal.getAuction();
    auction.showAuction("auction-review");
    for(var direction in Bridge.directions) {
      var value = deal.isVulnerable(direction) ? "yes" : "no";
      BW.utils.setAttribute($("#vul-" + direction), "vulnerable", value);
      //$("#vul-" + direction).attr("data-vulnerable", value).data("vulnerable", value);
      $("#vul-" + direction).empty();
    }
    $("#vul-" + deal.getDealer()).empty().append("D");
    $("#scoring-review").empty().append(deal.getScoring());
    $("#avatar-review").css("background-image", "url(" + BW.utils.getAvatarLink(BW.user.userInfo.avatar) + ")");
    $("#description-review").empty().append(deal.getNotes());
    this.deal = deal;
    this.updateStatus();
    deal.registerCallback(function() {
      self.saveDrafts();
      for(var direction in Bridge.directions) {
        var value = deal.isVulnerable(direction) ? "yes" : "no";
        BW.utils.setAttribute($("#vul-" + direction), "vulnerable", value);
        $("#vul-" + direction).empty();
      }
      $("#vul-" + deal.getDealer()).empty().append("D");
      $("#scoring-review").empty().append(deal.getScoring());
      $("#description-review").empty().append(deal.getNotes());
      self.updateStatus();
    });
  };
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
    var self = this
    // Skip clicked
    $(document).on("tap", "#skip-submit-button.enabled", function() {
      self.load({"exclude": self.slug});
    });
    // Abstain clicked
    $(document).on("tap", "#abstain-submit-button.enabled", function() {
      self.vote(/*abstain=*/true);
    });
    // Vote clicked
    $(document).on("tap", "#vote-submit-button.enabled", function() {
      self.vote(/*abstain=*/false);
    });
  };
  this.getLeadAnswer = function() {
    var next = this.deal.getAuction().getNextToCall();
    return this.lead_answers_idx[this.deal.getHand(next).getSelectedCard()];
  };
  this.getBiddingAnswer = function() {
    return this.bidding_answers_idx[this.deal.getAuction().getSelectedBid()];
  };

  /**
   * Send abstain as vote for this problem to BW server
   */
  this.vote = function(abstain) {
    var data = {
      "public": true,
      "slug": this.slug,
    };
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
  		urlSuffix: "poll-answer/",
      method: "POST",
      data: data,
  	});
  	return false;
  };
  this.load = function(data) {
    data = data || {};
    _.defaults(data, {
      "num_responses": 0,
      //"slug": "lead-problem-529",
    });
    $("#back-button").addClass("hide");
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
      data: data,
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
  	deal.setDealer(data.dealer);
  	deal.setVulnerability(data.vulnerability);
  	deal.getAuction().fromString(data.auction);
  	while(deal.getAuction().getNextToCall() != 's') {
      deal.rotateClockwise();
    }
    var hand = deal.getHand(deal.getAuction().getNextToCall());
  	hand.setHand( data.lin_str );
  	deal.setScoring(data.scoring);
    deal.getHand('n').setName("Pard");
    deal.getHand('e').setName("RHO");
    deal.getHand('s').setName("You");
    deal.getHand('w').setName("LHO");
    if (this.type == "bidding") {
      $("#hand").show();
      hand.showHand("hand");
    }
    else {
      $("#hand").empty().hide();
    }
    var auction = deal.getAuction();
    auction.showAuction("auction");
  	this.slug = data.slug;
    if (this.type == "bidding") {
      $("bidding-box").show();
      auction.showBiddingBox("bidding-box");
      deal.registerCallback(function() {
        $("#vote-submit-button").removeClass("disabled").addClass("enabled");
      }, "setSelectedCall");
      deal.registerCallback(function() {
        $("#vote-submit-button").addClass("disabled").removeClass("enabled");
      }, "setSelectedLevel");
      $("#lead-box").empty().hide();
    } else {
      $("#lead-box").show();
      hand.showLead("lead-box");
      deal.registerCallback(function() {
        $("#vote-submit-button").removeClass("disabled").addClass("enabled");
      }, "setSelectedCard");
      $("bidding-box").empty().hide();
    }
    this.deal = deal;
    $("#header-text").empty().append(BW.utils.capitalize(this.type + " problem"));
    for(var direction in Bridge.directions) {
      var value = deal.isVulnerable(direction) ? "yes" : "no";
      BW.utils.setAttribute($("#vul-" + direction), "vulnerable", value);
      //$("#vul-" + direction).attr("data-vulnerable", value).data("vulnerable", value);
    }
    $("#vul-" + deal.getDealer()).empty().append("D");
    $("#scoring").empty().append(data.scoring);
    $("#avatar").css("background-image", "url(" + BW.utils.getAvatarLink(data.author.avatar) + ")");
    $("#comments").empty().append(data.num_comments);
    $("#likes").empty().append(data.num_likes);
    $("#user").empty().append(data.author.name);
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
  // Callbacks when section changes.
  this.sectionChangeCallbacks = {};
  this.registerSectionChangeCallback = function(section, callback) {
    this.sectionChangeCallbacks[section] = callback;
  };
  this.showSection = function(section, parameters) {
    $("[data-role='section']").hide();
    $("[data-role='section'][data-name='" + section + "']").show();
    if (section in this.sectionChangeCallbacks) {
      this.sectionChangeCallbacks[section](section, parameters);
    }
  };
  this.showSubSection = function(section, parameters) {
    $("[data-role='sub-section']").hide();
    $("[data-role='sub-section'][data-name='" + section + "']").show();
    $("[data-role='sub-section-change']").removeClass("selected");
    $("[data-role='sub-section-change'][data-section='" + section + "']").addClass("selected");
    if (section in this.sectionChangeCallbacks) {
      this.sectionChangeCallbacks[section](section, parameters);
    }
  };
  this.setupClickHandlers = function() {
    var self = this;
    // Menu item change
    $(document).on("tap", ".footer-outer-container .menu-item", function() {
      var item = $(this).data("item");
      if (self.activeTab != item) {
        BW.page.load(item + ".html", function() {
          self.setActiveTab(item);
        });
      }
    });
    // Section change
    $(document).on("tap", "[data-role='section-change'].enabled", function(e) {
      var section = $(this).data("section");
      if (section && section != "") {
        self.showSection(section, $(this).data());
      }
    });
    // Sub section change
    $(document).on("tap", "[data-role='sub-section-change'].enabled", function(e) {
      var section = $(this).data("section");
      if (section && section != "") {
        self.showSubSection(section, $(this).data());
      }
    });
  };
  this.init = function() {
    $("#back-button").addClass("hide");
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
    this.pageLoadedCallbacks["create.html"] = BW.create.load.bind(BW.create);
    this.pageLoadedCallbacks["history.html"] = BW.history.load.bind(BW.history);
    this.pageLoadedCallbacks["alerts.html"] = BW.alerts.load.bind(BW.alerts);
  };

  /**
   * Set active tab.
   */
  this.setActiveTab = function(item) {
    this.activeTab = item;
    if (item === "account") {
      $("#account-avatar-outer").show();
      $("#account-avatar-inner").hide();
    } else {
      $("#account-avatar-inner").show();
      $("#account-avatar-outer").hide();
    }
    $(".footer-outer-container .menu-item").removeClass("selected").addClass("not-selected");
    $(".footer-outer-container [data-item='" + item + "']").removeClass("not-selected").addClass("selected");
    $(".footer-inner-container .menu-item").removeClass("selected").addClass("not-selected");
    $(".footer-inner-container [data-item='" + item + "']").removeClass("not-selected").addClass("selected");
  };

  this.load = function(pageName, callback, parameters) {
    BW.loadingDialog.show("Loading Page...");
    var self = this;
    var promise = this.get(pageName, function(html) {
      $("#content").empty().append(html);
      BW.loadingDialog.hide();
      if (pageName in self.pageLoadedCallbacks) {
        self.pageLoadedCallbacks[pageName](parameters);
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
  this.sections = {
    "account-main-page": {
      back: "",
    },
    "account-friends-page": {
      back: "account-main-page",
    },
    "account-options-page": {
      back: "account-main-page",
    },
    "account-about-page": {
      back: "account-main-page",
    },
  };
  this.getUserName = function() {
    return this.userInfo.username;
  }
  /**
   * Load a user if there is an accessToken, else show login page.
   */
  this.init = function() {
    var self = this;
    this.setupClickHandlers();
    // section changed
    for (var sectionName in this.sections) {
      BW.page.registerSectionChangeCallback(sectionName, function(section) {
        var sectionConfig = self.sections[section];
        if (sectionConfig["back"]) {
          $("#back-button").removeClass("hide");
          BW.utils.setAttribute($("#back-button"), "section", sectionConfig["back"]);
          //.data("section", sectionConfig["back"]);
        } else {
          $("#back-button").addClass("hide");
        }
      });
    }
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
    $("#header-text").empty().append("Account");
    $("#account-list").listview();
    $("#name").empty().append(this.userInfo.name);
    $("#avatar").css("background-image", "url(" + BW.utils.getAvatarLink(this.userInfo.avatar) + ")");
    BW.page.showSection("account-main-page");
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
      method: "POST",
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
  	});
  	return false;
  };
  /**
   * Authentication Ajax sucess call back
   */
  this.authenticationSuccessCallback = function(data) {
    this.userInfo = data;
    $("#account-avatar-inner").css("background-image", "url(" + BW.utils.getAvatarLink(this.userInfo.avatar) + ")");
    $("#account-avatar-outer").css("background-image", "url(" + BW.utils.getAvatarLink(this.userInfo.avatar) + ")");
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
