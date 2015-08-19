/* global $window */
/// <reference path="../../typings/angularjs/angular.d.ts"/>
angular.module('underscore', ['$window'])
  .factory('_', ['$window', function () {
    return $window._; // assumes underscore has already been loaded on the page
  }]);
angular.module('starter.services', [])

  .factory('ProgramService', ['$http', 'configuration', function ($http, configuration) {

    var factory = {};
    factory.getProgramList = function () {

    };
    factory.getCurrentProgramList = function () {
      // console.log(configuraion);
      return $http.get(configuration.serverUrl + '/programs/current?d=' + Date.now());
    }
    return factory;
  }]);


angular.module('starter.localstorage.service', [])
  .factory('$localstorage', ['$window', function ($window) {
    return {
      set: function (key, value) {
        $window.localStorage[key] = value;
      },
      get: function (key, defaultValue) {
        return $window.localStorage[key] || defaultValue;
      },
      setObject: function (key, value) {
        $window.localStorage[key] = JSON.stringify(value);
      },
      getObject: function (key) {
        return JSON.parse($window.localStorage[key] || null);
      }
    }
  }]);
angular.module('CacheService', ['ng'])
  .factory('CacheService', function ($cacheFactory) {
    return $cacheFactory('CacheService');
  });

angular.module('starter.session.service', ['starter.localstorage.service', 'CacheService'])
  .factory('sessionManager', ['$localstorage', 'CacheService', function ($localstorage, CacheService) {
    return {
      saveSession: function (profile) {
        $localstorage.setObject('me', profile);
        CacheService.put('me', profile);
      },
      removeSession: function () {
        $localstorage.setObject('me', null);
        CacheService.remove('me');
      },
      me: function () {
        if (CacheService.get('me')) {
          return CacheService.get('me');
        } else {
          var profile = $localstorage.getObject('me');
          if (profile) {
            CacheService.put('me', profile);
            return profile;
          } else {
            return null;
          }
        }
      },
      isLogin: function () {
        return this.me() != null;
      }
    }
  }]);

angular.module('IDService', ['ionic'])
  .factory('IDService', function ($cordovaDevice) {
    var deviceModel;
    var deviceUUID;
    if (ionic.Platform.isAndroid()) {
      deviceModel = $cordovaDevice.getModel();
      deviceUUID = $cordovaDevice.getUUID();
    } else {
      console.log("Is not Android");
      deviceModel = "windows";
      deviceUUID = "testUUID";
    }
    return {
      getId: function () {
        return deviceUUID;
      }
    }
  });


angular.module('facebook.login.service', ['starter.session.service'])
  .factory('facebookLoginManager', ['$openFB', '$http', 'sessionManager', '$window', 'configuration', '$cordovaToast', '$rootScope',
    function ($openFB, $http, sessionManager, $window, configuration, $cordovaToast, $rootScope) {
      var facebookLoginManager = {};
      facebookLoginManager.attachLogin = function ($scope, cb) {
        $scope.facebooklogin = function () {
          // $scope.modal.show();
          $openFB.login({ scope: 'public_profile,email,user_friends' })
            .then(function (token) {
              return $openFB.api({ path: '/me' });
            }).catch(function (err) {
              $cordovaToast.show('facebook login fail:' + err, 'show', 'center').then(function (success) { }, function (err) { });
            }).then(function (profile) {
              return profile;
            }).then(function (profile) {
              profile.provider = 'facebook';
              return $http.post(configuration.serverUrl + '/users', profile);
            }).then(function (data, status, headers, config) {
              var profile = data.data;
              profile.imgurl = 'http://graph.facebook.com/' + profile.id + '/picture?type=square';
              sessionManager.saveSession(profile);
              $rootScope.$broadcast('profile.update', profile);
              console.log('success for saving user to db' + profile);
              if (cb) {
                cb.call(null, profile);
              }
            }).catch(function (data, status, headers, config) {
              console.log("failure message: " + JSON.stringify({ data: data }));
            }).catch(function (err) {
              console.log('get me error');
            });
        };
      };
      facebookLoginManager.detachLogin = function (cb) {
        $openFB.revokePermissions(cb).then(function () {
          console.log('facebook logout');
          //TODO
          //remove session from sessionManager
          //$rootScope.$broadcast('profile.remove', null);
        });
      };
      return facebookLoginManager;
    }]);