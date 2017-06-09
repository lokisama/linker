const app = angular.module('app');

app.config(['$stateProvider', $stateProvider => {
  $stateProvider
    .state('user', {
      url: '/user',
      abstract: true,
      templateUrl: '/public/themes/linker/views/user/user.html',
    })
    .state('user.index', {
      url: '/index',
      controller: 'UserIndexController',
      templateUrl: '/public/themes/linker/views/user/index.html',
    })
    .state('user.account', {
      url: '/account',
      controller: 'UserAccountController',
      templateUrl: '/public/themes/linker/views/user/account.html',
    });
  }])
;
