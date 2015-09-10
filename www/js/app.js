// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
var app = angular.module('starter', ['ionic','ionic.service.core','ionic.service.analytics', 'ngCordova', 'starter.controllers', 'ionic-material', 'monospaced.elastic', 'ngOpenFB'])
  .constant("configuration", {
    "serverUrl": "http://localhost:8888"
    // "serverUrl": "http://128.199.139.107:8888"
  })
  .run(function ($ionicPlatform, $openFB, $ionicPopup, $ionicHistory,$ionicAnalytics) {

    // amMoment.changeLocale('ko');
    $openFB.init({ appId: '1692726940964374' });
    $ionicAnalytics.register();
    $ionicPlatform.ready(function () {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      if (window.cordova && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      }
      if (window.StatusBar) {
        // org.apache.cordova.statusbar required
        StatusBar.styleDefault();
      }
    });

    $ionicPlatform.onHardwareBackButton(function () {
      var currentStateName = $ionicHistory.currentStateName();
      // alert(currentStateName);
      // alert(JSON.stringify($ionicHistory.viewHistory()));
      if (/programlists/.text(currentStateName)) {
        $ionicPopup.confirm({
          title: '알림',
          template: '나가시겠습니까?'
        }).then(function (res) {
          if (res) {
            navigator.app.exitApp();
          }
        })
      } else {
        $ionicHistory.goBack();
      }
    });

  })

  .config(function ($stateProvider, $urlRouterProvider, $ionicConfigProvider) {
    $ionicConfigProvider.navBar.alignTitle('center');
    $stateProvider
      .state('app', {
        url: "/app",
        abstract: true,
        templateUrl: "templates/menu.html",
        controller: 'AppCtrl'
      })

      .state('app.programlist', {
        url: "/programlists",
        views: {
          'menuContent': {
            templateUrl: "templates/programlist.html",
            controller: 'ProgramlistCtrl'
          }
        }
      })
      .state('app.programchat', {
        url: "/programlists/:programId/:programName",
        views: {
          'menuContent': {
            templateUrl: "templates/programchat.html",
            controller: 'ProgramchatCtrl'
          }
        }
      })

      .state('app.settings', {
        url: "/settings",
        views: {
          'menuContent': {
            templateUrl: "templates/settings.html",
            controller: 'SettingsCtrl'
          }
        }
      })

    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/app/programlists');
  });


app.factory('Faye', [
  '$faye', 'configuration', function ($faye, configuration) {
    return $faye(configuration.serverUrl + "/faye");
  }
]);

app// fitlers
  .filter('nl2br', ['$filter',
    function ($filter) {
      return function (data) {
        if (!data) return data;
        return data.replace(/\n\r?/g, '<br />');
      };
    }
  ]);
// directives
  app.directive('autolinker', ['$timeout',
  function ($timeout) {
    return {
      restrict: 'A',
      link: function (scope, element, attrs) {
        $timeout(function () {
          var eleHtml = element.html();

          if (eleHtml === '') {
            return false;
          }

          var text = Autolinker.link(eleHtml, {
            className: 'autolinker',
            newWindow: false
          });

          element.html(text);

          var autolinks = element[0].getElementsByClassName('autolinker');
          var handler = function (e) {
            var href = e.target.href;
            console.log('autolinkClick, href: ' + href);

            if (href) {
              //window.open(href, '_system');
              window.open(href, '_blank');
            }
            e.preventDefault();
            return false;
          };
          for (var i = 0; i < autolinks.length; i++) {
            angular.element(autolinks[i]).bind('click', handler);
          }
        }, 0);
      }
    }
  }
])