require(["webjars!knockout.js", 'webjars!jquery.js', "/routes.js", "webjars!bootstrap.js"], function(ko) {


  var MessagesModel, events, messagesPerPage, model;
  messagesPerPage = 10;
  MessagesModel = (function() {
    function MessagesModel() {
      var self;
      self = this;
      this.messages = ko.observableArray();
      this.messageField = ko.observable();
      this.nextMessagesUrl = ko.observable();
      this.prevMessagesUrl = ko.observable();
      this.saveMessage = function() {
        return this.ajax(routes.controllers.MessageController.saveMessage(), {
          data: JSON.stringify({
            message: this.messageField()
          }),
          contentType: "application/json"
        }).done(function() {
          $("#addMessageModal").modal("hide");
          return self.messageField(null);
        });
      };
      this.getMessages = function() {
        return this.ajax(routes.controllers.MessageController.getMessages(0, messagesPerPage)).done(function(data, status, xhr) {
          return self.loadMessages(data, status, xhr);
        });
      };
      this.nextMessages = function() {
        if (this.nextMessagesUrl()) {
          return $.ajax({
            url: this.nextMessagesUrl()
          }).done(function(data, status, xhr) {
            return self.loadMessages(data, status, xhr);
          });
        }
      };
      this.prevMessages = function() {
        if (this.prevMessagesUrl()) {
          return $.ajax({
            url: this.prevMessagesUrl()
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
      this.messages(data);
      link = xhr.getResponseHeader("Link");
      if (link) {
        next = /.*<([^>]*)>; rel="next".*/.exec(link);
        if (next) {
          this.nextMessagesUrl(next[1]);
        } else {
          this.nextMessagesUrl(null);
        }
        prev = /.*<([^>]*)>; rel="prev".*/.exec(link);
        if (prev) {
          return this.prevMessagesUrl(prev[1]);
        } else {
          return this.prevMessagesUrl(null);
        }
      } else {
        this.nextMessagesUrl(null);
        return this.prevMessagesUrl(null);
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
