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
    	$.when( cordovaReady, jQueryMobileReady ).then( this.init.bind(this) );
    }
    else {
      $.when( jQueryMobileReady ).then( this.init.bind(this) );
    }
  };
  this.init = function() {
    if ( navigator && navigator.splashscreen ) {
      navigator.splashscreen.hide();
    }
    // enable fast click
  	var attachFastClick = Origami.fastclick;
  	attachFastClick(document.body);
    this.initDialogs();
    // OAuth.initialize('Vi6x8Syh39JuYgui349ZU-YvwaI')
    BW.utils.init();
    BW.page.init();
    BW.vote.init();
    BW.create.init();
    BW.history.init();
    BW.alerts.init();
    BW.user.init();
    document.addEventListener('backbutton', this.backButtonCallback, false);
  };
  this.backButtonCallback = function() {
    if (!$("#back-button").hasClass("hide")) {
      $("#back-button").tap();
    }
  };
  this.initDialogs = function() {
    BW.loadingDialog = new BW.dialog("loading-popup", true);
    BW.messageDialog = new BW.dialog("message-popup", true);
    BW.confirmationDialog = new BW.dialog("confirmation-popup", true);
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
  this.sitePrefix = "https://www.bridgewinners.com";
  //this.sitePrefix = "https://52.4.5.8";
  //this.sitePrefix = "https://127.0.0.1:8000";
  //this.sitePrefix = "http://localhost";
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
BW.ajax = function(parameters) {
  parameters = parameters || {};
  _.defaults(parameters, {
    method: "GET",
    headers: BW.user.getHeader(),
    timeout: 10000,
    data: {},
    successCallback: null,
    errorCallback: null,
    failedCallback: null,
  });
  if (parameters.loadingMessage) {
    BW.loadingDialog.show(parameters.loadingMessage);
  }
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
    if (parameters.loadingMessage) {
      BW.loadingDialog.hide();
    }
    var hasError = data.hasOwnProperty("error") && data.error;
    if (hasError) {
      if (parameters.errorCallback) {
        parameters.errorCallback(data.message);
      } else {
        BW.messageDialog.show("Error: " + data.message);
      }
    } else {
      if (parameters.successCallback) {
        parameters.successCallback(data);
      }
    }
	});
	request.fail( function(jqXHR, textStatus, errorThrown) {
    if (parameters.loadingMessage) {
      BW.loadingDialog.hide();
    }
    var message = "Error - " + textStatus + ": " + errorThrown;
    if (parameters.failedCallback) {
      parameters.failedCallback(message);
    } else {
      BW.messageDialog.show("Request Failed: " + message);
    }
	});
};

/**
 * A class to manage showing and hiding dialogs.
 */
BW.dialog = function(container) {
  this.container = container;
  $("#" + this.container).on("popupafterclose", function() {
    $("#all-content").removeClass("ui-disabled");
  });
  $("#" + this.container).on("popupafteropen", function() {
    $("#all-content").addClass("ui-disabled");
  });
  this.showWithConfirmation = function(text, yesCallback, noCallback) {
    var self = this;
    $("#all-content").addClass("ui-disabled");
    $("#" + this.container + "-content").empty().append(text);
    $(document).one("tap", "#" + container + "-yes", function() {
      $(document).off("tap", "#" + container + "-yes");
      $(document).off("tap", "#" + container + "-no");
      self.hide();
      if (yesCallback) yesCallback();
      return false;
    });
    $(document).one("tap", "#" + container + "-no", function() {
      $(document).off("tap", "#" + container + "-yes");
      $(document).off("tap", "#" + container + "-no");
      self.hide();
      if (noCallback) noCallback();
      return false;
    });
  	$("#" + this.container).popup("open");
  };
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

/** Problems loaded so far. */
BW.problems = new function() {
  this.problems = {};
  this.deferredObjects = {};
  this.votingProblem1 = $.Deferred();
  this.votingProblem2 = $.Deferred();
  this.init = function() {
    this.loadVotingProblems();
  };
  this.update = function(problem) {
    this.problems[problem.slug] = problem;
  };
  this.has = function(slug) {
    return slug in this.problems;
  };
  this.get = function(slug) {
    return this.problems[slug];
  };
  this.hasAllResponses = function(slug) {
    var problem = this.problems[slug];
    return (problem.hasOwnProperty('has_all_responses') && problem['has_all_responses']);
  };
  this.clearResponses = function(slug) {
    if (slug in this.deferredObjects) {
      this.deferredObjects[slug] = null;
    }
  };
  this.getResponses = function(slug) {
    var self = this;
    if (slug in this.deferredObjects && this.deferredObjects[slug]) {
      return this.deferredObjects[slug];
    }
    this.deferredObjects[slug] = $.Deferred();
    var ajaxRequest = BW.ajax({
      urlSuffix: "get-voting-problem/",
      data: {
        slug: slug,
      },
      loadingMessage: null,
      // Need longer timeout when getting problems with lots of votes.
      timeout: 20000,
      successCallback: function(data) {
        data["has_all_responses"] = true;
        BW.problems.update(data);
        self.deferredObjects[slug].resolve(data);
      },
      errorCallback: function(message) {
        self.deferredObjects[slug].reject(message);
      },
      failedCallback: function(message) {
        self.deferredObjects[slug].reject(message);
      },
    });
    return this.deferredObjects[slug];
  };
  this.getNewVotingProblem = function() {
    var self = this;
    this.votingProblem1 = this.votingProblem2;
    this.votingProblem2 = $.Deferred();
    var problem2 = this.votingProblem2;
    this.votingProblem1.done(function(problem) {
      if (problem.alldone) {
        problem2.resolve({"alldone": true,});
        return;
      }
      var data2 = {
        "num_responses": 0,
        "exclude": problem.slug,
      };
      BW.ajax({
        urlSuffix: "get-voting-problem/",
        data: data2,
        loadingMessage: null,
        successCallback: function(data) {
          problem2.resolve(data);
        },
        errorCallback: function(message) {
          problem2.reject(message);
        },
        failedCallback: function(message) {
          problem2.reject(message);
        },
      });
    });
  };
  this.refreshVotingProblems = function() {
    this.votingProblem1 = $.Deferred();
    this.votingProblem2 = $.Deferred();
    this.loadVotingProblems();
  };
  this.loadVotingProblems = function() {
    var data1 = {
      "num_responses": 0,
      //"slug": "lead-problem-1010",
    };
    var self = this;
    var problem2 = this.votingProblem2;
    BW.ajax({
      urlSuffix: "get-voting-problem/",
      data: data1,
      loadingMessage: null,
      successCallback: function(problem) {
        self.votingProblem1.resolve(problem);
        // BW.ajax({
        //   urlSuffix: "get-comments/",
        //   data: {"slug": problem["slug"]},
        //   loadingMessage: null,
        //   successCallback: function(data) {
        //     alert(JSON.stringify(data));
        //   },
        //   errorCallback: function(message) {
        //     alert(JSON.stringify(data));
        //   },
        //   failedCallback: function(message) {
        //     alert(JSON.stringify(message));
        //   },
        // });
        //if (true) {
        if (problem.alldone) {
          problem2.resolve({"alldone": true,});
          return;
        }
        var data2 = {
          "num_responses": 0,
          "exclude": problem.slug,
          //"slug": "bidding-problem-1992",
        };
        BW.ajax({
          urlSuffix: "get-voting-problem/",
          data: data2,
          loadingMessage: null,
          successCallback: function(data) {
            problem2.resolve(data);
          },
          errorCallback: function(message) {
            problem2.reject(message);
          },
          failedCallback: function(message) {
            problem2.reject(message);
          },
        });
      },
      errorCallback: function(message) {
        self.votingProblem1.reject(message);
      },
      failedCallback: function(message) {
        self.votingProblem1.reject(message);
      },
    });
  };
};

/**
 * Alerts page.
 */
BW.alerts = new function() {
  this.alertsReady = $.Deferred();
  this.alerts = [];
  this.has_more = true;
  this.init = function() {
    this.setupClickHandlers();
  };
  this.setupClickHandlers = function() {
    var self = this;
    $(document).on("tap", "li.alert[data-slug]", function(e) {
      e.preventDefault();
      var slug = $(this).data("slug");
      if (BW.problems.has(slug)) {
        var data = BW.problems.get(slug);
        if (data.my_answer) {
          BW.page.show("history", {}, /*disableCallbacks=*/true);
          BW.page.showSection("history-results-page", {
            "slug": slug,
            "back": "alerts-page",
            "data": data,
          });
        } else {
          BW.page.show("vote", {"problem": data});
        }
        return;
      }
      var data = {
        "num_responses": 3,
        "exclude_default_avatars": true,
        "slug": slug,
      };
      BW.ajax({
        urlSuffix: "get-voting-problem/",
        data: data,
        loadingMessage: "Getting Problem Details...",
        successCallback: function(data) {
          BW.problems.update(data);
          if (data.my_answer) {
            BW.page.show("history", {}, /*disableCallbacks=*/true);
            BW.page.showSection("history-results-page", {
              "slug": slug,
              "back": "alerts-page",
              "data": data,
            });
          } else {
            BW.page.show("vote", {"problem": data});
          }
        },
        errorCallback: function(message) {
          BW.messageDialog.show("Request Failed: " + message);
        },
        failedCallback: function(message) {
          BW.messageDialog.show("Request Failed: " + message);
        },
      });
    });
    $(document).on("iscroll_onpulldown", "#alerts-wrapper", function() {
      self.loadInBackground();
      self.reload(/*disableLoadingMessage=*/true);
    });
    $(document).on("iscroll_onpullup", "#alerts-wrapper", function() {
      self.loadInBackground(/*addMore=*/true);
      self.reload(/*disableLoadingMessage=*/true);
    });
  };
  this.loadInBackground = function(addMore) {
    if (!addMore) {
      this.alerts = [];
    }
    var start = this.alerts.length;
    var end = start + 9;
    this.alertsReady = $.Deferred();
    var deferredObject = this.alertsReady;
    var ajaxRequest = BW.ajax({
      urlSuffix: "get-alerts/",
      data: {
    		start:start,
    		end: end
      },
      loadingMessage: null,
      successCallback: function(data) {
        deferredObject.resolve(data);
      },
      errorCallback: function(message) {
        deferredObject.reject(message);
      },
      failedCallback: function(message) {
        deferredObject.reject(message);
      },
    });

  	return false;
  };
  this.reload = function(disableLoadingMessage) {
    disableLoadingMessage = disableLoadingMessage || false;
    var self = this;
    $("#header-text").empty().append("Alerts");
    $("#back-button").addClass("hide")
    var deferredObject = this.alertsReady;
    if (!deferredObject) {
      if (self.has_more) {
        $("#alerts-more-button").removeClass("disabled").addClass("enabled");
      } else {
        $("#alerts-more-button").removeClass("enabled").addClass("disabled");
      }
      self.show();
      return false;
    }
    if (!disableLoadingMessage) {
      BW.loadingDialog.show("Getting Alerts...")
    }
    deferredObject.done(function(data) {
      $.merge(self.alerts, data.alerts);
      self.has_more = data.has_more;
      if (data.has_more) {
        $("#alerts-more-button").removeClass("disabled").addClass("enabled");
      } else {
        $("#alerts-more-button").removeClass("enabled").addClass("disabled");
      }
      if (!disableLoadingMessage) {
        BW.loadingDialog.hide();
      }
      self.alertsReady = null;
      self.show();
    });
    deferredObject.fail(function(message) {
      if (!disableLoadingMessage) {
        BW.loadingDialog.hide();
      }
      BW.messageDialog.show("Error: " + message);
    });
  	return false;
  };
  this.load = function(disableLoadingMessage) {
    disableLoadingMessage = disableLoadingMessage || false;
    $("#alerts-list").listview();
    $("#alerts-wrapper").iscrollview({
      preventPageScroll: false,
      hScroll: false,
      vScroll: true,
    });
    this.reload(disableLoadingMessage);
  	return false;
  };
  this.show = function(data) {
    var html = "";
    var alerts = this.alerts;
    if (alerts.length > 0) {
      _.each(alerts, function(alert) {
        if (alert.slug) {
          html += "<li class='alert clickable' data-slug='" + alert.slug + "' data-icon='false'><a href='#'>";
        } else {
          html += "<li class='alert clickable' data-icon='false'><a href='#'>";
        }
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
      html += "<li class='alert'>You have no poll related alerts.</li>";
    }
    $("#alerts-list").empty().append(html);
    $("#alerts-list").listview("refresh");
    $("#alerts-wrapper").iscrollview("refresh");
  };
};

/**
 * History page.
 */
BW.history = new function() {
  this.currentSection = null;
  this.has_more = {
    "published": true,
    "voted": true,
  };
  this.problems = {
    "published": [],
    "voted": [],
  };
  this.locallyAddedProblems = {
    "published": [],
    "voted": [],
  };
  this.problemsReady = {
    "published": null,
    "voted": null,
  };
  this.scrollers = {
    "published": null,
    "voted": null,
  };
  this.init = function() {
    var self = this;
    this.setupClickHandlers();
  };
  this.addProblem = function(pollType, problem) {
    this.locallyAddedProblems[pollType].unshift(problem);
    BW.problems.update(problem);
  };
  this.setupClickHandlers = function() {
    var self = this;
    $(document).on("tap", "#history-next-button.enabled", function(e) {
      e.preventDefault();
      BW.page.show("vote");
    });
    $(document).on("tap", "#history-revote-button.enabled", function(e) {
      e.preventDefault();
      BW.page.show("vote", {"problem": self.problemShown});
    });
    $(document).on("swipeleft", "#history-responses-voters", function() {
      if (self.currentResponseSection < self.numResponseSections-1) {
        self.currentResponseSection++;
        $("[data-section-number='" + self.currentResponseSection + "']").tap();
      }
    });
    $(document).on("swiperight", "#history-responses-voters", function() {
      if (self.currentResponseSection > 0) {
        self.currentResponseSection--;
        $("[data-section-number='" + self.currentResponseSection + "']").tap();
      }
    });
    _.each(["voted", "published"], function(pollType) {
      $(document).on("iscroll_onpulldown", "#history-" + pollType + "-wrapper", function() {
        self.getRecentInBackground(pollType);
        self.getRecent(pollType, /*disableLoadingMessage=*/true);
      });
      $(document).on("iscroll_onpullup", "#history-" + pollType + "-wrapper", function() {
        self.getRecentInBackground(pollType, /*addMore=*/true);
        self.getRecent(pollType, /*disableLoadingMessage=*/true);
      });
    });

    // section changed
    _.each(["history-voted-page", "history-published-page", "history-drafts-page"], function(sectionName) {
      BW.page.registerSectionChangeCallback(sectionName, function(section) {
        $("#back-button").addClass("hide");
        $("#history-menu").removeClass("hide");
        self.currentSection = section;
        $(".history-menu-item").removeClass("selected");
        $("[data-section='" + section + "']").addClass("selected");
        switch(section) {
          case "history-drafts-page":
            self.loadDrafts();
            break;
          case "history-voted-page":
            self.enableScrollers();
            self.loadRecentlyVoted();
            break;
          case "history-published-page":
            self.enableScrollers();
            self.loadRecentlyPublished();
            break;
          default:
            break;
        }
      });
    });
    BW.page.registerSectionChangeCallback("history-results-page", function(section, parameters) {
      $("#header-text").empty().append("Results");
      BW.problems.getResponses(parameters.slug);
      self.loadProblem(parameters.slug, parameters.back, parameters.data, parameters.pollType);
      if (parameters.back !== "vote-page" && parameters.back !== "alerts-page") {
        self.disableScrollers();
      }
    });
    BW.page.registerSectionChangeCallback("history-responses-page", function(section, parameters) {
      $("#header-text").empty().append("Voters");
      self.loadResponses(parameters.slug, parameters.back, parameters.pollType);
    });
  };
  this.showResponses = function(slug, backPage, pollType) {
    $("#back-button").removeClass("hide");
    BW.utils.setAttribute($("#back-button"), "section", "history-results-page");
    BW.utils.setAttribute($("#back-button"), "slug", slug);
    BW.utils.setAttribute($("#back-button"), "poll-type", pollType);
    BW.utils.setAttribute($("#back-button"), "back", backPage);
    $("#history-menu").addClass("hide");
    //var poll = this.polls[pollType][slug];
    var poll = BW.problems.get(slug);
    var html = "";
    if (poll.all_answers.length > 0) {
      this.numResponseSections = poll.all_answers.length;
      this.currentResponseSection = 0;
      _.each(poll.all_answers, function(answer, index) {
        var answerClass = "";
        if (poll.my_answer && poll.my_answer.answer === answer.text) {
          answerClass = "my_answer";
        }
        html += "<div class='history-response-item enabled " + answerClass + "' data-section-number='" + index + "' data-role='sub-section-change' data-section='history-response-page-" + answer.text + "'>";
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
        html += "<ul class='history-response-voters scrollable'>";
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
      var shownSectionName = "history-response-page-" + poll.all_answers[this.currentResponseSection].text;
    } else {
      var shownSectionName = "history-response-page-empty";
      var html = ""
      html += "<div class='history-no-responses'>No votes have been submitted yet.</div>";
      $("#history-responses-menu").empty().append(html);
    }
    BW.page.showSubSection(shownSectionName);
  };
  this.loadResponses = function(slug, backPage, pollType) {
    var self = this;
    BW.loadingDialog.show("Getting Responses...");
    var deferredObject = BW.problems.getResponses(slug);
    deferredObject.done(function(data) {
      pollType = pollType || "voted";
      self.showResponses(slug, backPage, pollType);
      BW.loadingDialog.hide();
    });
    deferredObject.fail(function(message) {
      BW.loadingDialog.hide();
      BW.messageDialog.show("Error: " + message);
    });
    return false;

  };
  this.loadProblem = function(slug, backPage, data, pollType) {
    $("#back-button").removeClass("hide");
    BW.utils.setAttribute($("#back-button"), "section", backPage);
    if (backPage === "vote-page") {
      $("#history-next-button").removeClass("hide");
    } else {
      $("#history-next-button").addClass("hide");
    }
    $("#history-menu").addClass("hide");
    this.slug = slug;
    if (data) {
      this.showProblem(data, pollType);
    } else {
      var problem = BW.problems.get(slug);
      this.showProblem(problem, pollType);
    }
  	return false;
  };
  this.showProblem = function(data, pollType) {
    BW.loadingDialog.show("Displaying Problem...");
    this.problemShown = data;
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
    $("user").empty().append(data.author.name);
    $("votes").empty().append(data.num_answers);
    //$("comments").empty().append(data.num_comments);
    //$("likes").empty().append(data.num_likes);
    var auction = deal.getAuction();
    auction.showAuction("auctioncontainer");
    var d = $('auctioncontainer content');
    d.scrollTop(d.prop("scrollHeight"));
    for(var direction in Bridge.directions) {
      var value = deal.isVulnerable(direction) ? "yes" : "no";
      var element = $("vulnerability[data-direction='"+ direction + "']");
      BW.utils.setAttribute(element, "vulnerable", value);
      element.empty();
    }
    $("vulnerability[data-direction='"+ deal.getDealer() + "']").empty().append("D");
    $("scoring").empty().append(BW.options.getScoringMapping(data.scoring));
    hand.showHand("handcontainer", {
      registerClickHandlers: false,
      registerChangeHandlers: false,
    });
    $("description").empty().append(Bridge.replaceSuitSymbolsHTML(data.description));
    var html = "";
    if (data.all_answers.length > 0) {
      _.each(data.all_answers, function(answer){
        var answerClass = "";
        if (data.my_answer && data.my_answer.answer === answer.text) {
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
        html += answer.percent + "%";
        html += "</div>";
        html += "<div class='answer-result-column answer-result-avatar'>";
        html += "<div class='answer-result-avatar-imgs'>";
        var count =  0;
        var index = 0;
        while(count < 3 && index < answer.public_responses.length) {
          response = answer.public_responses[index++];
          if (response.has_avatar) {
            count ++;
            html += "<div class='answer-result-avatar-img'><img class='avatar-result' src='" + BW.utils.getAvatarLink(response.avatar) + "'/></div>";
          }
        }
        while (count < 3) {
          count ++;
          html += "<div class='answer-result-avatar-img'></div>";
        }
        html += "</div>";
        html += "</div>";
        html += "</div>";
      });
    } else {
      var html = "<div class='answers-no-responses'>No votes have been submitted yet.</div>";
    }
    $("#answers-results").empty().append(html);
    BW.utils.setAttribute($("#history-revote-button"), "slug", data.slug);
    BW.utils.setAttribute($("#history-voters-button"), "slug", data.slug);
    BW.utils.setAttribute($("#history-voters-button"), "poll-type", pollType);
    BW.utils.setAttribute($("#history-voters-button"), "back", $("#back-button").data("section"));
    BW.loadingDialog.hide();
  };
  this.getHTML = function(polls, sectionName, showAuthor, showAnswer, pollType) {
    var html = "";
    _.each(polls, function(item) {
      var hand = new Bridge.Hand('s');
      hand.fromString(item.lin_str);
      var handHtml = hand.toHTML({
        template: "hand.concise",
        registerClickHandlers: false,
        registerChangeHandlers: false
      });
      html += "<li class='enabled' data-icon='false' data-role='section-change' data-section='history-results-page' ";
      html += "data-poll-type='" + pollType + "' data-back='" + sectionName + "' data-slug='" + item.slug + "'><a href='#'>";
      html += "<div class='history-list-row'>";
      if (showAuthor) {
        html += "<div class='history-list-cell avatar-container'>";
        html += "<img class='avatar' src='" + BW.utils.getAvatarLink(item.author.avatar) + "'/>";
        html += "</div>";
        html += "<div class='history-list-cell'>";
        html += "<p>";
        html += "<span class='name'>" + item.author.name + "</span>";
        html += "</p>";
      } else {
        html += "<div class='history-list-cell'>";
      }
      html += "<p>";
      html += "<div class='history-list-row'>";
      html += "<div class='history-list-cell'>";
      html += handHtml;
      html += "</div>";
      if (showAnswer) {
        var answer = "-";
        var percentage = "-";
        if (item.my_answer) {
          if (item.my_answer.answer !== "Abstain") {
            percentage = "" + item.my_answer.percent + "%";
            if (item.type === "Bidding") {
              answer = Bridge.getBidHTML(item.my_answer.answer);
            } else {
              answer = Bridge.getCardHTML(item.my_answer.answer);
            }
          } else {
            answer = "Ab";
          }
        }
        html += "<div class='answer history-list-cell'>" + answer + "</div>";
      }
      html += "</div>";
      html += "</p>";
      html += "<p>";
      html += "<div class='history-list-row'>";
      html += "<div class='history-list-cell'>";
      //html += "<img class='icon' src='css/img/comments_black.png'><span class='stats num_comments'>" + item.num_comments + "</span>"
      //html += "<img class='icon' src='css/img/likes_black.png'><span class='stats num_likes'>" + item.num_likes + "</span>"
      html += "<img class='icon' src='css/img/answers_black.png'><span class='stats num_answers'>" + item.num_answers + "</span>"
      html += "</div>";
      if (showAnswer) {
        html += "<div class='percentage history-list-cell'>" + percentage + "</div>";
      }
      html += "</div>";
      html += "</p>";
      html += "</div>";
      html += "</div>";
      html += "</a></li>";
    });
    return html;
  };
  this.getRecentInBackground = function(pollType, addMore) {
    var self = this;
    if (!addMore) {
      self.problems[pollType] = [];
    }
    var start = self.problems[pollType].length;
    var end = start + 9;
    this.problemsReady[pollType] = $.Deferred();
    var deferredObject = this.problemsReady[pollType];
    if (pollType === "voted") {
      var url = "get-recent-answers/";
    } else {
      var url = "get-recent-published/";
    }
    var self = this;
    BW.ajax({
      urlSuffix: url,
      data: {
    		start:start,
    		end: end,
        num_responses: 3,
        exclude_default_avatars: true,
      },
      loadingMessage: null,
      successCallback: function(data) {
        deferredObject.resolve(data);
      },
      errorCallback: function(message) {
        deferredObject.reject(message);
      },
      failedCallback: function(message) {
        deferredObject.reject(message);
      },
    });
  	return false;
  };
  this.updateProblems = function(pollType) {
    var self = this;
    var newSlugs = {};
    var existingProblems = [];
    if (pollType === "voted") {
      // When revoting remove the problem if it already exists in problem list.
      _.each(self.locallyAddedProblems[pollType], function(problem) {
        newSlugs[problem.slug] = true;
      });
      _.each(self.problems[pollType], function(problem) {
        if (!(problem.slug in newSlugs)) {
          existingProblems.push(problem);
        }
      });
    } else {
      existingProblems = self.problems[pollType];
    }
    self.problems[pollType] = self.locallyAddedProblems[pollType].concat(existingProblems);
    self.locallyAddedProblems[pollType] = [];
  };
  this.getRecent = function(pollType, disableLoadingMessage) {
    disableLoadingMessage = disableLoadingMessage || false;
    var self = this;
    if (pollType === "voted") {
      var message = "Getting Recently Voted Problems...";
    } else {
      var message = "Getting Recently Published Problems...";
    }
    var deferredObject = self.problemsReady[pollType];
    if (!deferredObject) {
      self.updateProblems(pollType);
      self.show(pollType);
      return false;
    }
    if (!disableLoadingMessage) {
      BW.loadingDialog.show(message);
    }
    deferredObject.done(function(data) {
      _.each(data.polls, function(poll) {
        BW.problems.update(poll);
      });
      self.has_more[pollType] = data.has_more;
      self.updateProblems(pollType);
      $.merge(self.problems[pollType], data.polls);
      self.show(pollType);
      self.problemsReady[pollType] = null;
      if (!disableLoadingMessage) {
        BW.loadingDialog.hide();
      }
    });
    deferredObject.fail(function(message) {
      if (!disableLoadingMessage) {
        BW.loadingDialog.hide();
      }
      BW.messageDialog.show("Error: " + message);
    });
  	return false;
  };
  this.show = function(pollType) {
    var self = this;
    if (pollType === "voted") {
      var sectionName = "history-voted-page";
      var showAuthor = true;
      var showAnswer = true;
      var emptyText = "You have not voted on any problems yet.";
    } else {
      var sectionName = "history-published-page";
      var showAuthor = false;
      var showAnswer = false;
      var emptyText = "You have not published any problems yet.";
    }
    var container = $("#history-" + pollType + "-list");
    var polls = this.problems[pollType];
    if (polls.length > 0) {
      var html = self.getHTML(polls, sectionName, showAuthor, showAnswer, pollType);
    } else {
      var html = "<li>" + emptyText + "</li>";
    }
    container.empty().append(html);
    container.listview("refresh");
    $("#history-" + pollType + "-wrapper").iscrollview("refresh");
  };
  this.loadRecentlyVoted = function() {
    return this.getRecent("voted");
  };
  this.loadRecentlyPublished = function() {
    return this.getRecent("published");
  };
  this.createScrollers = function() {
    var self = this;
    _.each(["voted", "published"], function(pollType) {
      self.scrollers[pollType] = $("#history-" + pollType + "-wrapper").iscrollview({
        preventPageScroll: false,
        hScroll: false,
        vScroll: true,
      });
    });
  };
  this.enableScrollers = function() {
    var self = this;
    _.each(["voted", "published"], function(pollType) {
      $("#history-" + pollType + "-wrapper").iscrollview("enable");
    });
  };
  this.disableScrollers = function() {
    var self = this;
    _.each(["voted", "published"], function(pollType) {
      $("#history-" + pollType + "-wrapper").iscrollview("disable");
    });
  };

  this.load = function(parameters) {
    $("#header-text").empty().append("History");
    $(".history-list").listview();
    this.createScrollers();
    if (parameters && parameters.section) {
      BW.page.showSection(parameters.section);
    } else {
      BW.page.showSection("history-voted-page");
    }
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
      e.preventDefault();
      var message = "This will clear all the information including hands and auction. Are you sure?"
      BW.confirmationDialog.showWithConfirmation(message, function(){
        self.reset();
      }, function() {
        // No was pressed, do nothing.
      });
      return false;
    });
    $(document).on("tap", "#create-continue-button.disabled", function(e) {
      e.preventDefault();
      var message = $(this).data("message");
      BW.messageDialog.show(message);
    });

    // Description changed
    $(document).on("input", "#create-description-page #description", function(e) {
      self.deal.setNotes($("#create-description-page #description").val());
      return false;
    });
    // publish clicked
    $(document).on("tap", "#create-publish-button.enabled", function(e) {
      self.publish();
      return false;
    });
    // section changed
    for (var sectionName in this.sections) {
      BW.page.registerSectionChangeCallback(sectionName, function(section) {
        self.setSection(section);
        var sectionConfig = self.sections[section];
        if (sectionConfig["back"]) {
          $("#back-button").removeClass("hide");
          BW.utils.setAttribute($("#back-button"), "section", sectionConfig["back"]);
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
    var self = this;
  	var deal = this.deal;
  	var data = {};
    data[ "type" ] = deal.getProblemType();
    var scoringMapping = {
      "MPs": "Matchpoints",
      "IMPs": "KO",
      "BAM": "BAM",
      "Total Points": "TP",
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
    BW.ajax({
      urlSuffix: "create-problem/",
      method: "POST",
      data: data,
      loadingMessage: "Submitting New Problem...",
      successCallback: function(data) {
        self.reset();
        BW.history.addProblem("published", data);
        BW.page.show("history", {"section": "history-published-page"});
      },
    });
  	return false;
  };
  this.updateStatus = function() {
    if (!this.deal) return;
    $("#hand-header").show();
    if (this.getSection() === "create-hand-page") {
      this.deal.getHand(this.handDirection).showHand("#hand");
    } else {
      this.deal.getHand(this.handDirection).showHand("#hand", {
        registerClickHandlers: false,
        registerChangeHandlers: false,
      });
    }
    $("#hand").show();
    $("#create-buttons").show();
    var section = this.getSection();
    $("#header-text").empty().append("Create");
    $("#create-continue-button").removeClass("hide");
    if (section == "create-hand-page") {
      $("#header-text").empty().append("Enter Hand");
      var currentHand = this.deal.getHand(this.handDirection);
      var count = currentHand.getCount();
      if (count == 13) {
        $("#create-continue-button").removeClass("disabled").addClass("enabled");
      } else {
        $("#create-continue-button").removeClass("enabled").addClass("disabled");
        BW.utils.setAttribute($("#create-continue-button"), "message", "Select 13 cards first");
      }
    } else if (section == "create-info-page") {
      $("#header-text").empty().append("Enter Info");
      $("#create-continue-button").removeClass("disabled").addClass("enabled");
    } else if (section == "create-auction-page") {
      $("#header-text").empty().append("Enter Auction");
      var auction = this.deal.getAuction();
      var problemType = this.deal.getProblemType();
      if (problemType.toLowerCase() === "bidding") {
        if (auction.getContract().isComplete || auction.getNextToCall() !== this.handDirection) {
          $("#create-continue-button").removeClass("enabled").addClass("disabled");
          BW.utils.setAttribute($("#create-continue-button"), "message", "It is not your turn to bid");
        }
        else {
          $("#create-continue-button").removeClass("disabled").addClass("enabled");
        }
      }
      else {
        // Lead problem
        var contract = auction.getContract();
        if (contract.isComplete && contract.getLeader() === this.handDirection) {
          $("#create-continue-button").removeClass("disabled").addClass("enabled");
        }
        else {
          $("#create-continue-button").removeClass("enabled").addClass("disabled");
          var message = contract.isComplete ? "It is not your lead" : "Auction is not complete";
          BW.utils.setAttribute($("#create-continue-button"), "message", message);
        }
      }
      var d = $('#auction content');
      d.scrollTop(d.prop("scrollHeight"));
    } else if (section == "create-description-page") {
      $("#header-text").empty().append("Enter Problem Description");
      $("#create-continue-button").removeClass("disabled").addClass("enabled");
    } else if (section == "create-review-page") {
      $("#header-text").empty().append("Final Review");
      if (!BW.user.getPreference("auction_above_hands")) {
        $("#create-review-page").addClass("show-hand-first");
      } else {
        $("#create-review-page").removeClass("show-hand-first");
      }
      $("#hand-header").hide();
      $("#hand").hide();
      $("#create-continue-button").addClass("hide");
      var d = $('auctioncontainer content');
      d.scrollTop(d.prop("scrollHeight"));
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
    if (this.getSection() === "create-hand-page") {
      deal.getHand(this.handDirection).showHand("#hand");
    } else {
      deal.getHand(this.handDirection).showHand("#hand", {
        registerClickHandlers: false,
        registerChangeHandlers: false,
      });
    }
    deal.showCardDeck("#deck");
    deal.showProblemType("#problem");
    deal.showScoring("#scoring", {
      scoringTypes: [
        "MPs",
        "IMPs",
        "BAM",
        "Total Points",
      ],
    });
    deal.showVulnerability("#vulnerability");
    deal.showDealer("#dealer");
    var auction = deal.getAuction();
    auction.showAuction("#auction");
    auction.toHTML({
      container: "#special_calls",
      template: "auction.bidding-box.special_calls",
    });
    auction.toHTML({
      container: "#bidding-box",
      template: "auction.bidding-box.full",
    });
    $("#create-description-page #description").val(deal.getNotes());
    deal.getHand(this.handDirection).showHand("handcontainer", {
      registerClickHandlers: false,
    });
    var auction = deal.getAuction();
    auction.showAuction("auctioncontainer");
    for(var direction in Bridge.directions) {
      var value = deal.isVulnerable(direction) ? "yes" : "no";
      var element = $("vulnerability[data-direction='" + direction + "']");
      BW.utils.setAttribute(element, "vulnerable", value);
      element.empty();
    }
    $("vulnerability[data-direction='" + deal.getDealer() + "']").empty().append("D");
    $("scoring").empty().append(BW.options.getScoringMapping(deal.getScoring()));
    $("#avatar-review").css("background-image", "url(" + BW.utils.getAvatarLink(BW.user.userInfo.avatar) + ")");
    $("user").empty().append(BW.user.getName());
    $("description").empty().append(Bridge.replaceSuitSymbolsHTML(deal.getNotes()));
    this.deal = deal;
    this.updateStatus();
    deal.registerCallback(function() {
      self.saveDrafts();
      for(var direction in Bridge.directions) {
        var value = deal.isVulnerable(direction) ? "yes" : "no";
        var element = $("vulnerability[data-direction='" + direction + "']");
        BW.utils.setAttribute(element, "vulnerable", value);
        element.empty();
      }
      $("vulnerability[data-direction='" + deal.getDealer() + "']").empty().append("D");
      $("scoring").empty().append(BW.options.getScoringMapping(deal.getScoring()));
      $("description").empty().append(Bridge.replaceSuitSymbolsHTML(deal.getNotes()));
      self.updateStatus();
    });
  };
};

/**
 * Vote is used to load the voting problem.
 */
BW.vote = new function() {
  this.parameters = {};
  this.problemReady = $.Deferred();
  this.problem = null;
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
      var slug = $(this).data("slug");
      if (self.problem && self.problem.slug === slug) {
        BW.problems.getNewVotingProblem();
      }
      self.load();
      return false;
    });
    // Abstain clicked
    $(document).on("tap", "#abstain-submit-button.enabled", function() {
      self.vote(/*abstain=*/true);
      return false;
    });
    // Vote clicked
    $(document).on("tap", "#vote-submit-button.enabled", function() {
      self.vote(/*abstain=*/false);
      return false;
    });
    // Check for new problems clicked
    $(document).on("tap", "#refresh-problem-button.enabled", function() {
      BW.problems.refreshVotingProblems();
      self.load();
      return false;
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
      "num_responses": 3,
      "exclude_default_avatars": true,
    };
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
    var self = this;
    BW.ajax({
      urlSuffix: "poll-answer/",
      method: "POST",
      data: data,
      loadingMessage: "Submitting Vote...",
      successCallback: function(data) {
        var option = BW.options.get("after-voting");
        self.problem = null;
        BW.history.addProblem("voted", data);
        BW.problems.clearResponses(data.slug);
        BW.problems.getNewVotingProblem();
        if (option === "next") {
          self.load();
        } else {
          BW.page.show("history", {}, /*disableCallbacks=*/true);
          BW.page.showSection("history-results-page", {
            "slug": this.slug,
            "back": "vote-page",
            "data": data,
          });
          return false;
        }
      },
    });
  	return false;
  };
  // this.loadInBackground = function(data, deferredObject) {
  //   data = data || {};
  //   _.defaults(data, {
  //     "num_responses": 0,
  //     //"slug": "lead-problem-2-64gkumhu26",
  //     //"slug": "lead-problem-1010",
  //   });
  //   if (!deferredObject) {
  //     this.problemReady = $.Deferred();
  //     deferredObject = this.problemReady;
  //   }
  //   var self = this;
  //   BW.ajax({
  //     urlSuffix: "get-voting-problem/",
  //     data: data,
  //     loadingMessage: null,
  //     successCallback: function(data) {
  //       deferredObject.resolve(data);
  //     },
  //     errorCallback: function(message) {
  //       deferredObject.reject(message);
  //     },
  //     failedCallback: function(message) {
  //       deferredObject.reject(message);
  //     },
  //   });
  //
  // 	return false;
  // };
  this.load = function(data) {
    data = data || {};
    $("#back-button").addClass("hide");
    BW.loadingDialog.show("Getting Voting Problem...")
    var self = this;
    if (data.problem) {
      self.show(data.problem);
      return false;
    }
    BW.problems.votingProblem1.done(function(problem) {
      BW.loadingDialog.hide();
      self.problem = problem;
      self.show(problem);
    });
    BW.problems.votingProblem1.fail(function(message) {
      BW.loadingDialog.hide();
      BW.messageDialog.show("Error: " + message);
    });
  };
  this.show = function(problem) {
    //if (true) {
    if (problem.alldone) {
      $("#header-text").empty().append("Wow");
      $(".no-more-voting-problems").removeClass("hide");
      $(".has-voting-problems").addClass("hide");
      return;
    }
    $(".no-more-voting-problems").addClass("hide");
    $(".has-voting-problems").removeClass("hide");
    BW.loadingDialog.show("Loading Problem...");
    var data = problem;
    BW.utils.setAttribute($("#skip-submit-button"), "slug", data.slug);
    this.data = data;
    this.type = data.type.toLowerCase();
    var pageID = "";
    $("#vote-page").removeClass("lead bidding").addClass(this.type);
    if (this.type == "bidding" && !BW.user.getPreference("auction_above_hands")) {
      $("#vote-page").addClass("show-hand-first");
    } else {
      $("#vote-page").removeClass("show-hand-first");
    }
  	this.selectedLevel = null;
    this.selectedCall = null;
  	this.selectedCard = null;
  	var deal = new Bridge.Deal();
  	deal.setDealer(data.dealer);
  	deal.setVulnerability(data.vulnerability);
  	deal.getAuction().fromString(data.auction);
    if (this.type == "bidding") {
    	while(deal.getAuction().getNextToCall() != 's') {
        deal.rotateClockwise();
      }
    } else {
      while(deal.getAuction().getContract().getDeclarer() != 'e') {
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
    if (this.type == "bidding") {
      $("handcontainer").show();
      hand.showHand("handcontainer", {
        registerClickHandlers: false,
        registerChangeHandlers: false,
      });
    }
    else {
      $("handcontainer").empty().hide();
    }
    var auction = deal.getAuction();
    auction.showAuction("auctioncontainer", {
      registerClickHandlers: false,
      registerChangeHandlers: false,
    });
    var d = $('auctioncontainer content');
    d.scrollTop(d.prop("scrollHeight"));
  	this.slug = data.slug;
    if (this.type == "bidding") {
      $("bidding-box").show();
      auction.showBiddingBox("biddingbox");
      deal.registerCallback(function() {
        $("#vote-submit-button").removeClass("disabled").addClass("enabled");
      }, "setSelectedCall");
      deal.registerCallback(function() {
        $("#vote-submit-button").addClass("disabled").removeClass("enabled");
      }, "setSelectedLevel");
      $("leadbox").empty().hide();
    } else {
      $("leadbox").show();
      hand.showLead("leadbox");
      deal.registerCallback(function() {
        $("#vote-submit-button").removeClass("disabled").addClass("enabled");
      }, "setSelectedCard");
      $("bidding-box").empty().hide();
    }
    this.deal = deal;
    if (this.type === "bidding") {
      $("#header-text").empty().append("What's Your Call?");
    } else {
      $("#header-text").empty().append("What's Your Lead?");
    }
    for(var direction in Bridge.directions) {
      var value = deal.isVulnerable(direction) ? "yes" : "no";
      var element = $("vulnerability[data-direction='" + direction + "']");
      BW.utils.setAttribute(element, "vulnerable", value);
      element.empty();
    }
    $("vulnerability[data-direction='" + deal.getDealer() + "']").empty().append("D");
    $("scoring").empty().append(BW.options.getScoringMapping(data.scoring));
    $("#avatar-vote").css("background-image", "url(" + BW.utils.getAvatarLink(data.author.avatar) + ")");
    //$("comments").empty().append(data.num_comments);
    //$("likes").empty().append(data.num_likes);
    $("user").empty().append(data.author.name);
    $("description").empty().append(Bridge.replaceSuitSymbolsHTML(data.description));
    BW.loadingDialog.hide();
  };
};

/*
 * Page is used to load html pages into a cache to be retrieved as and
 * when users browse to different sections of the app.
 */
BW.page = new function() {
  this.lastPage = null;
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
    // open in external page
    $(document).on("tap", "a[target='_blank']", function(e) {
      if ( BW.app.isCordovaApp() ) {
        e.preventDefault();
        var url = $(this).attr("href");
        SafariViewController.isAvailable(function (available) {
          if (available) {
            SafariViewController.show({
                  url: url,
                  hidden: false, // default false. You can use this to load cookies etc in the background (see issue #1 for details).
                  animated: true, // default true, note that 'hide' will reuse this preference (the 'Done' button will always animate though)
                  transition: 'curl', // (this only works in iOS 9.1/9.2 and lower) unless animated is false you can choose from: curl, flip, fade, slide (default)
                  enterReaderModeIfAvailable: true, // default false
                  tintColor: "#2a5461", // default is ios blue
                  barColor: "#2a5461", // on iOS 10+ you can change the background color as well
                  controlTintColor: "#ffffff" // on iOS 10+ you can override the default tintColor
                },
                function(result) {},
                function(msg) {});
          } else {
            // potentially powered by InAppBrowser because that (currently) clobbers window.open
            cordova.InAppBrowser.open(url, "_blank");
          }
        })
      }
    });
    $(document).on("click", "a[target='_blank']", function(e) {
      if ( BW.app.isCordovaApp() ) {
        e.preventDefault();
      }
    });
    // Menu item change
    $(document).on("tap", ".footer-outer-container .menu-item", function() {
      var item = $(this).data("item");
      if (self.activeTab != item) {
        BW.page.show(item);
      }
      return false;
    });
    // Section change
    $(document).on("tap", "[data-role='section-change'].enabled", function(e) {
      var section = $(this).data("section");
      if (section && section != "") {
        if (section === "vote-page") {
          BW.page.show("vote");
        } else if (section === "alerts-page") {
          BW.page.show("alerts");
        } else {
          self.showSection(section, $(this).data());
        }
      }
      return false;
    });
    // Sub section change
    $(document).on("tap", "[data-role='sub-section-change'].enabled", function(e) {
      var section = $(this).data("section");
      if (section && section != "") {
        self.showSubSection(section, $(this).data());
      }
      return false;
    });
  };
  this.getSavedLastPageName = function () {
    return BW.user.getUserName() + "-last-page";
  };
  this.init = function() {
    $("#back-button").addClass("hide");
    this.setupClickHandlers();
    this.registerCallbacks();
  };
  this.registerCallbacks = function() {
    this.pageLoadedCallbacks["vote"] = BW.vote.load.bind(BW.vote);
    this.pageLoadedCallbacks["create"] = BW.create.load.bind(BW.create);
    this.pageLoadedCallbacks["history"] = BW.history.load.bind(BW.history);
    this.pageLoadedCallbacks["alerts"] = BW.alerts.load.bind(BW.alerts);
    this.pageLoadedCallbacks["account"] = BW.user.loadAccount.bind(BW.user);
  };

  /**
   * Set active tab.
   */
  this.setActiveTab = function(item) {
    if (item == "login") return;
    this.activeTab = item;
    this.lastPage = item;
    localStorage.setItem(this.getSavedLastPageName(), item);
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
  this.show = function(pageName, parameters, disableCallbacks) {
    if (!pageName) {
      this.lastPage = localStorage.getItem(this.getSavedLastPageName(), "vote");
      if (!this.lastPage || this.lastPage == "login") {
        this.lastPage = "vote";
      }
      pageName = this.lastPage;
    }
    $("#content").empty().append($("#" + pageName +"-template").html());
    this.setActiveTab(pageName);
    if (disableCallbacks) return;
    if (pageName in this.pageLoadedCallbacks) {
      this.pageLoadedCallbacks[pageName](parameters);
    }
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

BW.options = new function() {
  this.init = function() {
    this.setupClickHandlers();
    this.optionValues = {
      "after-voting": {
        "results": "Results",
        "next": "Next Problem",
      },
    };
    var optionsString = localStorage.getItem(BW.user.getLocalStorageName("options"), "{}");
    var options = JSON.parse(optionsString);
    options = options || {};
    _.defaults(options, {
      "after-voting": "results",
    });
    this.options = options;
  };

  this.getScoringMapping = function(scoring) {
    mapping = {
      "KO": "IMPs (KO)",
      "Matchpoints": "MPs",
      "20VP": "IMPs (20 VP)",
      "30VP": "IMPs (30 VP)",
      "WL": "IMPs (Swiss)",
      "CrossImps": "IMPs",
      "BAM": "BAM",
      "TP": "Total Points",
      "Money": "Money",
      "Any": "Any",
    };
    if(mapping[scoring]) return mapping[scoring];
    return scoring;
  }

  this.setupClickHandlers = function() {
    var self = this;
    $(document).on("tap", "[data-option].enabled", function() {
      var optionName = $(this).data("option");
      var optionValue = $(this).data("value");
      self.options[optionName] = optionValue;
      self.saveOptions();
      self.loadOptionHTML(optionName);
    });
  };
  this.saveOptions = function() {
    localStorage.setItem(BW.user.getLocalStorageName("options"), JSON.stringify(this.options));
  };
  this.get = function(optionName) {
    return this.options[optionName];
  };
  this.loadOptionHTML = function(optionName) {
    var options = this.options;
    var outerContainer = "settings";
    var innerContainer = "setting";
    var html = "<" + outerContainer + ">";
    _.each(this.optionValues[optionName], function(value, key) {
      html += "<" + innerContainer + " class='";
      if (options[optionName] === key) {
        html += "current";
      } else {
        html += "enabled";
      }
      html += "' data-option='" + optionName + "' data-value='";
      html += key;
      html += "'>";
      html += value;
      html += "</" + innerContainer + ">";
    });
    html += "</" + outerContainer + ">";
    $("#" + optionName).empty().append(html);
  };
  this.load = function() {
    _.each(this.optionValues, function(values, optionName) {
      this.loadOptionHTML(optionName);
    }, this);
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
  this.getName = function() {
    return this.userInfo.name;
  };
  this.getUserName = function() {
    return this.userInfo.username;
  };
  this.getPreference = function(fieldName) {
    return this.userInfo[fieldName];
  };
  this.getLocalStorageName = function(variableName) {
    return this.getUserName() + '-' + variableName;
  };
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
        } else {
          $("#back-button").addClass("hide");
        }
        if (section === "account-options-page") {
          $("#header-text").empty().append("Settings");
          BW.options.load();
        } else if (section === "account-about-page") {
          $("#header-text").empty().append("About the App");
        } else if (section === "account-main-page") {
          $("#header-text").empty().append("Account");
        }
      });
    }
    BW.page.hideHeaderFooter();
    BW.page.show("login");
    if (this.accessToken) {
      self.authenticateAccessToken();
    }
  };
  this.setupClickHandlers = function() {
    var self = this;
    $(document).on( "tap", "#login-submit-button", function() {
      return self.login($( "#username" ).val(), $( "#password" ).val());
  	});
    $(document).on( "tap", "#logout-submit-button", function() {
  		return self.logout();
  	});
    $( document ).on( "tap", "#google-login-button", function() {
      window.plugins.googleplus.login(
          {
            'webClientId': '527397812706-2j14fdjbvsveftvongh6eo96kq6i65gb.apps.googleusercontent.com',
          },
          function (response) {
            BW.ajax({
              urlSuffix: "social-login/",
              method: "POST",
          		data: { uid: response.email, provider: 'google-oauth2' },
          		headers: {},
              loadingMessage: "Logging In...",
              successCallback: self.loginSuccessCallback.bind(self),
              errorCallback: function(message) {
                BW.messageDialog.show("Request Failed: " + message);
                window.plugins.googleplus.logout(function() {});
              },
              failedCallback: function(message) {
                BW.messageDialog.show("Request Failed: " + message);
                window.plugins.googleplus.logout(function() {});
              },
            });
          },
          function (err) {
            window.plugins.googleplus.logout(function() {});
            BW.messageDialog.show("Failed to connect to Google account. " + err);
          }
      );
      // alert("Google login is not supported yet.")
      // OAuth.popup('google')
      // .done(function(result) {
      //   result.get('/oauth2/v1/userinfo').done(function (response) {
      //     BW.ajax({
      //       urlSuffix: "social-login/",
      //       method: "POST",
      //   		data: { uid: response.email, provider: 'google-oauth2' },
      //   		headers: {},
      //       loadingMessage: "Logging In...",
      //       successCallback: self.loginSuccessCallback.bind(self),
      //     });
      //   })
      //   .fail(function (err) {
      //     BW.messageDialog.show("Unable to get userinfo for Google user. " + err);
      //   });
      // })
      // .fail(function (err) {
      //   BW.messageDialog.show("Unable to connect to Google account. " + err);
      // });
  	});
    $(document).on("keypress", "#username", function(e) {
      if (e.which === 13) {
        $("#password").focus();
        e.preventDefault();
      }
    });
    $(document).on("keypress", "#password", function(e) {
      if (e.which === 13) {
        return self.login($( "#username" ).val(), $( "#password" ).val());
        e.preventDefault();
      }
    });
  };
  /**
   * Load user info into account page.
   */
  this.loadAccount = function() {
    $("[data-role='section']").hide();
    $("#header-text").empty().append("Account");
    $("#account-list").listview();
    $("#name").empty().append(this.getName());
    $("#avatar-profile").css("background-image", "url(" + BW.utils.getAvatarLink(this.userInfo.avatar) + ")");
    var url = "https://docs.google.com/forms/d/e/1FAIpQLSd72nAy1FOLYA6WDjgqP639yL3Xr5pbbeRAKPmYzdT2KMYGlA/viewform?entry.1450677738=";
    url += this.getUserName();
    if ( BW.app.isCordovaApp() ) {
      url += "&entry.1485524054=";
      url += device.platform;
      url += "&entry.1317617110=";
      url += device.model;
    }
    $("#app-feedback").attr("href",  url);
    BW.page.showSection("account-main-page");
  };

  /**
   * Try to login to BW server.
   * @param {string} username the username to use to login
   * @param {string} password the password to use to login
   */
  this.login = function( username, password ) {
    BW.ajax({
      urlSuffix: "get-auth-token/",
      method: "POST",
  		data: { username: username, password: password },
  		headers: {},
      loadingMessage: "Logging In...",
      successCallback: this.loginSuccessCallback.bind(this),
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
    BW.messageDialog.show(message);
  };

  /**
   * Authenticate the access token with the BW server
   */
  this.authenticateAccessToken = function() {
  	// Connect to BW server to check if access token is still ok
    BW.ajax({
      urlSuffix: "get-profile/",
      loadingMessage: "Authenticating Access...",
      successCallback: this.authenticationSuccessCallback.bind(this),
    });
  	return false;
  };
  /**
   * Authentication Ajax sucess call back
   */
  this.authenticationSuccessCallback = function(data) {
    this.userInfo = data;
    BW.options.init();
    $("#account-avatar-inner").css("background-image", "url(" + BW.utils.getAvatarLink(this.userInfo.avatar) + ")");
    $("#account-avatar-outer").css("background-image", "url(" + BW.utils.getAvatarLink(this.userInfo.avatar) + ")");
    BW.page.showHeaderFooter();
    BW.problems.init();
    BW.alerts.loadInBackground();
    BW.history.getRecentInBackground("voted");
    BW.history.getRecentInBackground("published");
    BW.page.show();
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
    window.plugins.googleplus.logout(function() {});
    BW.page.hideHeaderFooter();
    BW.page.show("login");
    return false;
  };
};
