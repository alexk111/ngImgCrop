'use strict';

crop.factory('cropPubSub', [function() {
  return function() {
    var events = {};
    // Subscribe
    this.on = function(names, handler) {
      names.split(' ').forEach(function(name) {
        if (!events[name]) {
          events[name] = [];
        }
        events[name].push(handler);
      });
      return this;
    };
    // Publish
    this.trigger = function() {
      var args = Array.prototype.slice.call(arguments);
      var name = args.shift();
      angular.forEach(events[name], function(handler) {
        handler.apply(null, args);
      });
      return this;
    };
  };
}]);