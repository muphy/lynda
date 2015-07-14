
angular.module('starter.controllers', ['starter.services', 'faye', 'starter.session.service', 'facebook.login.service'])

  .controller('AppCtrl', function ($scope, $ionicModal, $timeout, sessionManager, $window, facebookLoginManager) {
  
    // With the new view caching in Ionic, Controllers are only called
    // when they are recreated or on app start, instead of every page change.
    // To listen for when this page is active (for example, to refresh data),
    // listen for the $ionicView.enter event:
    //$scope.$on('$ionicView.enter', function(e) {
    //});
  
    // Form data for the login modal
    $scope.loginData = {};
    var me = sessionManager.me();
    if (sessionManager.isLogin()) {
      $scope.profileImg = me.imgurl || 'img/logo.png';
      $scope.userName = me.name;
    } else {
      $scope.profileImg = 'img/logo.png';
      $scope.userName = '';
    }
    $scope.$on('profile.update', function (event, data) {
      $scope.profileImg = data.imgurl;
      $scope.userName = data.name;
    });
    facebookLoginManager.attachLogin($scope);

    // Create the login modal that we will use later
    $ionicModal.fromTemplateUrl('templates/login.html', {
      scope: $scope
    }).then(function (modal) {
      $scope.modal = modal;
    });

    // Triggered in the login modal to close it
    $scope.closeLogin = function () {
      $scope.modal.hide();
    };

    // Open the login modal
    $scope.login = function () {
      $scope.modal.show();
    };

    // Perform the login action when the user submits the login form
    $scope.doLogin = function () {
      console.log('Doing login', $scope.loginData);

      // Simulate a login delay. Remove this and replace with your login
      // code if using a login system
      $timeout(function () {
        $scope.closeLogin();
      }, 1000);
    };
  })

  .controller('SettingsCtrl', function ($scope, facebookLoginManager) {
    $scope.settingsList = [
      { text: "Wireless", checked: true },
      { text: "GPS", checked: false },
      { text: "Bluetooth", checked: false }
    ];

    $scope.pushNotificationChange = function () {
      console.log('Push Notification Change', $scope.pushNotification.checked);
    };

    $scope.pushNotification = { checked: true };
    $scope.emailNotification = 'Subscribed';
  })
  .controller('ProgramlistCtrl', function ($scope, ProgramService, ionicMaterialMotion, ionicMaterialInk, Faye, $timeout, $ionicHistory, $interval, $filter) {
    // console.log($ionicHistory.currentStateName());
    // console.log($ionicHistory.viewHistory());
    var reset = function () {
      var inClass = document.querySelectorAll('.in');
      for (var i = 0; i < inClass.length; i++) {
        inClass[i].classList.remove('in');
        inClass[i].removeAttribute('style');
      }
      var done = document.querySelectorAll('.done');
      for (var j = 0; j < done.length; j++) {
        done[j].classList.remove('done');
        done[j].removeAttribute('style');
      }
      var ionList = document.getElementsByTagName('ion-list');
      for (var k = 0; k < ionList.length; k++) {
        var toRemove = ionList[k].className;
        if (/animate-/.test(toRemove)) {
          ionList[k].className = ionList[k].className.replace(/(?:^|\s)animate-\S*(?:$|\s)/, '');
        }
      }
    };
    $scope.ink = function () {
      // console.log('ink');
      ionicMaterialInk.displayEffect();
    };
    var timer;

    var convertProgramList = function (programList) {
      var result = _.each(programList, function (program) {
        program.startHour = $filter('date')(new Date(program.beginTime), 'h:mma');
        program.endHour = $filter('date')(new Date(program.endTime), 'h:mma');
        program.roomName = '#/app/programlists/' + program.scheduleId + '_' + program.beginTime + '/' + program.scheduleName;
        return program;
      });
      return result;
    };
    var handleSuccess = function (data, status) {
      document.getElementsByTagName('ion-list')[0].className += ' animate-ripple';
      $scope.programlist = convertProgramList(data);
      timer = $timeout(function () {
        ionicMaterialMotion.ripple();
      }, 100);
    };
    var refreshProgramList = function () {
      ProgramService.getCurrentProgramList().success(function (data, status) {
        $scope.programlist = convertProgramList(data);
      });
    };
    var stopTime = $interval(refreshProgramList, 1000 * 60);
    ProgramService.getCurrentProgramList().success(handleSuccess);
    $scope.$on(
      "$destroy",
      function (event) {
        $timeout.cancel(timer);
        $interval.cancel(stopTime);
      }
      );
  })
  .controller('ProgramchatCtrl', function ($scope, $rootScope, $stateParams, $ionicActionSheet,
    $timeout, $interval, $ionicScrollDelegate, Faye, sessionManager, facebookLoginManager) {
    // console.log($ionicHistory.viewHistory());
    var channelName = '/' + $stateParams.programId;
    var me = sessionManager.me();
    var userId;
    if (me) {
      userId = me.provider + '_' + me.id;
      $scope.me = me;
      $scope.me.userId = userId;
    }
    $scope.messages = [];
    $scope.programName = $stateParams.programName;
    $scope.isLogin = sessionManager.isLogin();
    // console.log(channelName);
    // mock acquiring data via $stateParams
    var viewScroll = $ionicScrollDelegate.$getByHandle('userMessageScroll');
    var footerBar; // gets set in $ionicView.enter
    var scroller;
    var txtInput; // ^^^

    $scope.$on('$ionicView.enter', function () {
      console.log('UserMessages $ionicView.enter');
      Faye.subscribe(channelName, function (message) {
        if (!message || message.text.length == 0) {
          return;
        }
        if(message)
        console.log('subscribe data:' + message);
        $scope.doneLoading = true;
        // $scope.messages = data.messages;

        $timeout(function () {
          viewScroll.scrollBottom();
        }, 0);

        var lastMessage = _.last($scope.messages);
        if (lastMessage) {
          if (lastMessage.userId == message.userId) {
            message.isSameTalker = true;
          }
        }
        $scope.messages.push(message);
      });

      $timeout(function () {
        footerBar = document.body.querySelector('#userMessagesView .bar-footer');
        scroller = document.body.querySelector('#userMessagesView .scroll-content');
        txtInput = angular.element(footerBar.querySelector('textarea'));
      }, 0);

    });

    $scope.$on('$ionicView.leave', function () {
      console.log('leaving UserMessages view, destroying interval');
      // Make sure that the interval is destroyed
      Faye.unsubscribe(channelName, function (data) {
        console.log('unsubscribe data:' + data);
      });
    });

    $scope.$on('$ionicView.beforeLeave', function () {
      console.log('$ionicView.beforeLeave called');
    });

    // $scope.$watch('input.message', function (newValue, oldValue) {
    //   console.log('input.message $watch, newValue ' + newValue);
    //   if (!newValue) newValue = '';
    //   localStorage['userMessage-' + $scope.toUser._id] = newValue;
    // });
    var me = sessionManager.me();
    $scope.sendMessage = function () {
      var content = $scope.input.message;
      if (!content && content.length == 0) {
        return;
      }
      var message = {
        pic: me.imgurl,
        username: me.name,
        userId: me.userId,
        text: content
      };

      // if you do a web service call this will be needed as well as before the viewScroll calls
      // you can't see the effect of this in the browser it needs to be used on a real device
      // for some reason the one time blur event is not firing in the browser but does on devices
      keepKeyboardOpen();

      message.date = new Date();
      Faye.publish(channelName, message);
      $timeout(function () {
        keepKeyboardOpen();
        viewScroll.scrollBottom(true);
      }, 0);
      $scope.input.message = '';
    };
    
    // this keeps the keyboard open on a device only after sending a message, it is non obtrusive
    function keepKeyboardOpen() {
      console.log('keepKeyboardOpen');
      txtInput.one('blur', function () {
        console.log('textarea blur, focus back on it');
        txtInput[0].focus();
      });
    }

    // $scope.onMessageHold = function (e, itemIndex, message) {
    //   console.log('onMessageHold');
    //   console.log('message: ' + JSON.stringify(message, null, 2));
    //   $ionicActionSheet.show({
    //     buttons: [{
    //       text: 'Copy Text'
    //     }, {
    //         text: 'Delete Message'
    //       }],
    //     buttonClicked: function (index) {
    //       switch (index) {
    //         case 0: // Copy Text
    //           //cordova.plugins.clipboard.copy(message.text);

    //           break;
    //         case 1: // Delete
    //           // no server side secrets here :~)
    //           $scope.messages.splice(itemIndex, 1);
    //           $timeout(function () {
    //             viewScroll.resize();
    //           }, 0);

    //           break;
    //       }

    //       return true;
    //     }
    //   });
    // };

    // this prob seems weird here but I have reasons for this in my app, secret!
    $scope.viewProfile = function (msg) {
      if (msg.userId === $scope.user.userId) {
        // go to your profile
      } else {
        // go to other users profile
      }
    };
    $scope.onHold = function() {
      alert('1111');
    };
    facebookLoginManager.attachLogin($scope, function (profile) {
      $scope.isLogin = true;
      me = sessionManager.me();
    });
    
    // I emit this event from the monospaced.elastic directive, read line 480
    $scope.$on('taResize', function (e, ta) {
      // console.log('taResize');
      if (!ta) return;

      var taHeight = ta[0].offsetHeight;
      // console.log('taHeight: ' + taHeight);

      if (!footerBar) return;

      var newFooterHeight = taHeight + 10;
      newFooterHeight = (newFooterHeight > 44) ? newFooterHeight : 44;

      footerBar.style.height = newFooterHeight + 'px';
      scroller.style.bottom = newFooterHeight + 'px';
      $timeout(function () {
        $ionicScrollDelegate.scrollBottom(true);
      }, 300);
    });

  });

