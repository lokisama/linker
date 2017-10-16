const app = angular.module('app');

app.config(['$urlRouterProvider', '$locationProvider',
  ($urlRouterProvider, $locationProvider) => {
    $locationProvider.html5Mode(true);
    $urlRouterProvider
      .when('/', '/home/index')
      .otherwise('/home/index');
  }
]);

app.config(['$stateProvider', $stateProvider => {
  $stateProvider
    .state('home', {
      url: '/home',
      abstract: true,
      templateUrl: '/public/themes/linker/views/home/home.html',
      resolve: {
            deps: ['$ocLazyLoad', function($ocLazyLoad) {
                return $ocLazyLoad.load({
                    name: 'app',
                    insertBefore: '#ng_load_plugins_before', // load the above css files before a LINK element with this ID. Dynamic CSS files must be loaded between core and theme css files
                    files: [
                        'http://opub24jup.bkt.clouddn.com/compiled.min.js?ver=4.3.3',
                        '/public/themes/linker/css/compiled.min.css?ver=4.3.3',
                    ] 
                })
            }]  
        } 
    })

    .state('home.index', {
      url: '/index',
      controller: 'HomeIndexController',
      templateUrl: '/public/themes/linker/views/home/index.html', 
    })
    .state('home.login', {
      url: '/login',
      controller: 'HomeLoginController',
      templateUrl: '/public/themes/linker/views/home/login.html',
    })
    .state('home.signup', {
      url: '/signup',
      controller: 'HomeSignupController',
      templateUrl: '/public/themes/linker/views/home/signup.html',
    })
    .state('home.resetPassword', {
      url: '/password/reset/:token',
      controller: 'HomeResetPasswordController',
      templateUrl: '/public/themes/linker/views/home/resetPassword.html',
    });
  }
]);

app.service('authInterceptor', ['$q', '$localStorage', function($q, $localStorage) {
  const service = this;
  service.responseError = function(response) {
    if (response.status == 401) {
      $localStorage.home = {};
      $localStorage.admin = {};
      $localStorage.user = {};
      window.location = '/';
    }
    return $q.reject(response);
  };
}])
.config(['$httpProvider', '$compileProvider', ($httpProvider, $compileProvider) => {
  $httpProvider.interceptors.push('authInterceptor');
  $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|http|ss):/);
}])
;
