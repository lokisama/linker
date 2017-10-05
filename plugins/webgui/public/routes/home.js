const app = angular.module('app');
const window = require('window');
const cdn = window.cdn || '';

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
    .state('home.macLogin', {
      url: '/login/:mac',
      controller: 'HomeMacLoginController',
      templateUrl: `${ cdn }/public/views/home/macLogin.html`,
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
