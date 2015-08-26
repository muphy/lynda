
angular.module('starter.controllers', ['starter.services', 'faye', 'starter.session.service', 'facebook.login.service', 'IDService'])

  .controller('AppCtrl', function ($scope, $ionicModal, $timeout, sessionManager, $window, facebookLoginManager, $ionicPlatform, $cordovaInAppBrowser) {
    var webbrowser_option = {
      location: 'no',
      clearcache: 'no',
      toolbar: 'no'
    };
    // Form data for the login modal
    $scope.doAppRate = function () {
      $cordovaInAppBrowser.open('https://play.google.com/store/apps/details?id=com.ionicframework.lynda949552', '_blank', webbrowser_option);
    };
    $scope.goToFanPage = function () {
      $cordovaInAppBrowser.open('https://www.facebook.com/alonetv0', '_blank', webbrowser_option);
    };
    $scope.loginData = {};
    var me = sessionManager.me();
    if (sessionManager.isLogin()) {
      $scope.profileImg = me.imgurl || 'img/logo.png';
      $scope.username = me.name;
    } else {
      $scope.profileImg = 'img/logo.png';
      $scope.username = '';
    }
    $scope.$on('profile.update', function (event, data) {
      $scope.profileImg = data.imgurl;
      $scope.username = data.name;
    });
    facebookLoginManager.attachLogin($scope);
  })

  .controller('SettingsCtrl', function ($scope, sessionManager, facebookLoginManager) {
    var isLogin = sessionManager.isLogin();
    $scope.session = { checked: isLogin };
    $scope.sessionChanged = function () {
      var status = $scope.session.checked;
      if (status) {

      } else {

      }
      console.log('Push Notification Change', $scope.session.checked);
    };

  })

  .controller('ProgramlistCtrl', function ($rootScope, $scope, ProgramService, ionicMaterialMotion, ionicMaterialInk, Faye, $timeout, $ionicHistory, $interval, $filter) {
    // console.log($ionicHistory.currentStateName());
    // console.log($ionicHistory.viewHistory());
    $rootScope.rightButton = '<button class="button button-icon button-clear ion-navicon" menu-toggle="left"></button>';
    $scope.programlist = [];
    Faye.subscribe('/lobby', function (message) {
      console.log('in the lobby', message);
      var updatedProgram = JSON.parse(message).program;
      var scheduleId = updatedProgram.scheduleId;
      var idx = _.findIndex($scope.programlist, { scheduleId: updatedProgram.scheduleId });
      if (idx > -1) {
        timer = $timeout(function () {
          $scope.programlist[idx].members = updatedProgram.members;
        }, 200);
      }
      timer = $timeout(function () {
        console.log(updatedProgram);
        $rootScope.$broadcast('members.count.update', updatedProgram)
      }, 200);

    });

    $scope.$on('$ionicView.enter', function () {
      console.log('UserMessages $ionicView.enter');
      refreshProgramList();
    });
    $scope.doRefresh = function () {
      console.log('refreshed');
      refreshProgramList();
    };
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
    var refreshProgramList = function () {
      ProgramService.getCurrentProgramList().success(function (data, status) {
        document.getElementsByTagName('ion-list')[0].className += ' animate-ripple';
        $scope.programlist = convertProgramList(data);
        timer = $timeout(function () {
          ionicMaterialMotion.ripple();
        }, 100);
      })
        .finally(function () {
          // Stop the ion-refresher from spinning
          $scope.$broadcast('scroll.refreshComplete');
        });
    };
    refreshProgramList();
    // var stopTime = $interval(refreshProgramList, 1000 * 60);
    // ProgramService.getCurrentProgramList().success(handleSuccess);
    
    $scope.$on(
      "$destroy",
      function (event) {
        $timeout.cancel(timer);
        // $interval.cancel(stopTime);
      });
  })
  .controller('ProgramchatCtrl', function ($scope, $rootScope, $ionicModal, $http, configuration, $stateParams,
    $timeout, $interval, $ionicScrollDelegate, Faye, sessionManager, facebookLoginManager, IDService) {
    // console.log($ionicHistory.viewHistory());
    var channelName = '/' + $stateParams.programId;
    var scheduleId = $stateParams.programId.split('_')[0]
    var me = sessionManager.me();
    if (me) {
      var userId = me.provider + '_' + me.id;
      me.userId = me.userId||me.provider + '_' + me.id;
    } else {
      me.userId = IDService.getId();
    }
    $scope.me = me;
    $scope.members = 0;
    $scope.messages = [];
    $scope.programName = $stateParams.programName;
    $scope.isLogin = sessionManager.isLogin();
    // $scope.$on('profile.update', function (event, data) {
    //   me = sessionManager.me();
    // });
    var viewScroll = $ionicScrollDelegate.$getByHandle('userMessageScroll');
    var footerBar; // gets set in $ionicView.enter
    var scroller;
    var txtInput; // ^^^
    
    $scope.$on('members.count.update', function (event, updatedProgram) {
      console.log('members', updatedProgram);
      if (scheduleId === updatedProgram.scheduleId) {
        $scope.members = updatedProgram.members;
      }
    });
    $scope.$on('$ionicView.beforeEnter', function () {
      console.log('UserMessages $ionicView.enter');
      $http.get(configuration.serverUrl + '/messages/' + scheduleId)
        .success(function (res) {
          $scope.messages = res || [];
          Faye.subscribe(channelName, function (message) {
            if (message.type === 'chat' && message.text.length == 0) {
              return;
            }
            message.isChat = message.type === 'chat';
            $timeout(function () {
              viewScroll.scrollBottom();
            }, 0);
            $scope.messages.push(message);
          });
        });

      var initModal = function () {
        $ionicModal.fromTemplateUrl('templates/memberlist.html', {
          scope: $scope,
          animation: 'slide-in-up'
        }).then(function (modal) {
          $scope.modal = modal;
          $scope.participants = [];
        });
        $scope.showMembers = function () {
          $scope.modal.show();
        };
        $scope.closeModal = function () {
          $scope.modal.hide();
        };
        //Cleanup the modal when we're done with it!
        $scope.$on('$destroy', function () {
          $scope.modal.remove();
        });
        // Execute action on hide modal
        $scope.$on('modal.hidden', function () {
          // Execute action
        });
        $scope.$on('modal.shown', function () {
          $http.get(configuration.serverUrl + '/participants/' + scheduleId)
            .success(function (res) {
              $scope.participants = res;
            });
        });
        // Execute action on remove modal
        $scope.$on('modal.removed', function () {
          // Execute action
        });
      };
      initModal();

      $timeout(function () {
        footerBar = document.body.querySelector('#userMessagesView .bar-footer');
        scroller = document.body.querySelector('#userMessagesView .scroll-content');
        txtInput = angular.element(footerBar.querySelector('textarea'));
      }, 0);
    });

    $scope.$on('$ionicView.enter', function () {
      console.log('$ionicView.enter fired!!!!!!!!!!!!!!!!!!!!');
      var message = {
        type: 'join',
        channel: {
          name: $stateParams.programName,
          id: channelName,
          scheduleId: scheduleId
        }
      };
      if (sessionManager.isLogin()) {
        message = _.extend(message, {
          pic: me.imgurl,
          username: me.name,
          link: me.link,
          userId: me.userId,
          text: me.name + " 님께서 들어오셨습니다."
        });
      } else {
        message = _.extend(message, {
          userId: IDService.getId(),
          username: 'guest',
          text: 'Guest 님께서 들어오셨습니다.'
        });
      }
      Faye.publish(channelName, message);
    });

    $scope.$on('$ionicView.leave', function () {
      console.log('leaving UserMessages view, destroying interval');
      // Make sure that the interval is destroyed
      console.log('$ionicView.beforeLeave called');
      Faye.unsubscribe(channelName, function (data) {
        console.log('unsubscribe data:' + data);
      });

    });

    $scope.$on('$ionicView.beforeLeave', function () {
      var message = {
        type: 'exit',
        channel: {
          name: $stateParams.programName,
          id: channelName,
          scheduleId: scheduleId
        }
      };
      if (sessionManager.isLogin()) {
        message = _.extend(message, {
          pic: me.imgurl,
          username: me.name,
          userId: me.userId,
          text: me.name + " 님께서 나가셨습니다."
        });
      } else {
        message = _.extend(message, {
          userId: IDService.getId(),
          username: 'guest',
          text: 'Guest 님께서 나가셨습니다.'
        });
      }
      Faye.publish(channelName, message);
    });

    $scope.sendMessage = function () {
      var content = $scope.input.message;
      if (!content && content.length == 0) {
        return;
      }

      var message = {
        pic: me.imgurl,
        username: me.name,
        userId: me.userId,
        text: content,
        type: 'chat',
        isChat: true,
        date: new Date(),
        channel: {
          name: $stateParams.programName,
          id: channelName,
          scheduleId: scheduleId
        }
      };

      // if you do a web service call this will be needed as well as before the viewScroll calls
      // you can't see the effect of this in the browser it needs to be used on a real device
      // for some reason the one time blur event is not firing in the browser but does on devices
      keepKeyboardOpen();
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
    $scope.onHold = function () {
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

