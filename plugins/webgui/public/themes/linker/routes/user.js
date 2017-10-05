const app = angular.module('app');

app.config(['$stateProvider', $stateProvider => {
  $stateProvider
    .state('user', {
      url: '/user',
      abstract: true,
      templateUrl: '/public/themes/linker/views/user/user.html',
      resolve: {
            deps: ['$ocLazyLoad', function($ocLazyLoad) {
                return $ocLazyLoad.load({
                    name: 'app',
                    insertBefore: '#ng_load_plugins_before', // load the above css files before a LINK element with this ID. Dynamic CSS files must be loaded between core and theme css files
                    files: [
                        // 'http://opub24jup.bkt.clouddn.com/compiled.min.css?ver=4.3.3',
                        'http://opub24jup.bkt.clouddn.com/compiled.min.js?ver=4.3.3',
                        '/public/themes/linker/css/compiled.min.css?ver=4.3.3',
                        // '/public/themes/linker/css/compiled.min.js?ver=4.3.3'
                    ] 
                })
            }]  
        } 
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
