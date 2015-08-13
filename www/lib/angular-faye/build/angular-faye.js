(function () {
  angular.module("faye", ['starter.session.service']);

  angular.module("faye").factory("$faye", [
    "$q", "$rootScope", "sessionManager", function ($q, $rootScope, sessionManager) {
      return function (url, fun) {
        var client = new Faye.Client(url);
        var scope = $rootScope;
        if (typeof fun === "function") {
          fun(client);
        }
        var authExtension = {
          incoming: function (message, callback) {
            // var channel = message.channel;
            // if (channel === "/meta/unsubscribe") {
            //   console.log('incoming-unsubscribe', message);
            // }
            callback(message);
          },
          outgoing: function (message, callback) {
            // console.log('outgoing', message);
            // outgoing Object {channel: "/meta/subscribe", clientId: "1gyybponr8ufx2s1emrtlmobrav5hxk", subscription: "/C633308504_1436759400000", id: "3"}
            callback(message);
          }
        };
        client.addExtension(authExtension);
        return {
          channels: {},
          client: client,
          publish: function (channel, data) {
            console.log('pub:');
            return this.client.publish(channel, data);
          },
          subscribe: function (channel, callback) {
            var sub = this.client.subscribe(channel, function (data) {
              console.log('sub:'+JSON.stringify(data));
              return scope.$apply(function () {
                return callback(data);
              });
            });
            this.channels[channel] = sub;
            return sub;
          },
          unsubscribe: function (channel, callback) {
            this.channels[channel].cancel();
            return this.client.unsubscribe(channel, function (data) {
              console.log('unsub:'+JSON.stringify(data));
              return scope.$apply(function () {
                return callback(data);
              });
            });
          },
          get: function (channel) {
            var deferred = $q.defer();
            var sub = this.client.subscribe(channel, function (data) {
              scope.$apply(function () {
                return deferred.resolve(data);
              });
              return sub.cancel();
            });
            return deferred.promise;
          }
        };
      };
    }
  ]);

}).call(this);
