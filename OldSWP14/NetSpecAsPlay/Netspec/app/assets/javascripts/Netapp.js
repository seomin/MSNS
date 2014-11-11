require(["webjars!knockout.js", 'webjars!jquery.js', "/routes.js", "webjars!bootstrap.js"], function(ko) {


  var MessagesModel, events, messagesPerPage, model;
  messagesPerPage = 10;
  MessagesModel = (function() {
    function MessagesModel() {
      var self = this;
      self.messages = ko.observableArray();
      self.messageField = ko.observable();
      self.nextMessagesUrl = ko.observable();
      self.prevMessagesUrl = ko.observable();
	  self.Topbartext = ko.observable("NetSpec");
      self.saveMessage = function() {
        return self.ajax(routes.controllers.MessageController.saveMessage(), {
          data: JSON.stringify({
            message: self.messageField()
          }),
          contentType: "application/json"
        }).done(function() {
          $("#addMessageModal").modal("hide");
          return self.messageField(null);
        });
      };
      self.getMessages = function() {
        return self.ajax(routes.controllers.MessageController.getMessages(0, messagesPerPage)).done(function(data, status, xhr) {
          return self.loadMessages(data, status, xhr);
        });
      };
      self.nextMessages = function() {
        if (self.nextMessagesUrl()) {
          return $.ajax({
            url: self.nextMessagesUrl()
          }).done(function(data, status, xhr) {
            return self.loadMessages(data, status, xhr);
          });
        }
      };
      self.prevMessages = function() {
        if (self.prevMessagesUrl()) {
          return $.ajax({
            url: self.prevMessagesUrl()
          }).done(function(data, status, xhr) {
            return self.loadMessages(data, status, xhr);
          });
        }
      };
    }

    MessagesModel.prototype.ajax = function(route, params) {
      return $.ajax($.extend(params, route));
    };

    MessagesModel.prototype.loadMessages = function(data, status, xhr) {
      var link, next, prev;
      self.messages(data);
      link = xhr.getResponseHeader("Link");
      if (link) {
        next = /.*<([^>]*)>; rel="next".*/.exec(link);
        if (next) {
          self.nextMessagesUrl(next[1]);
        } else {
          self.nextMessagesUrl(null);
        }
        prev = /.*<([^>]*)>; rel="prev".*/.exec(link);
        if (prev) {
          return self.prevMessagesUrl(prev[1]);
        } else {
          return self.prevMessagesUrl(null);
        }
      } else {
        self.nextMessagesUrl(null);
        return self.prevMessagesUrl(null);
      }
    };

    return MessagesModel;

  })();
  model = new MessagesModel;
  ko.applyBindings(model);
  model.getMessages();
  events = new EventSource(routes.controllers.MainController.events().url);
  return events.addEventListener("message", function(e) {
    var message;
    if (model.prevMessagesUrl() === null) {
      message = JSON.parse(e.data);
      model.messages.unshift(message);
      if (model.messages().length > messagesPerPage) {
        return model.messages.pop();
      }
    }
  }, false);
});
