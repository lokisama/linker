angular.module('app', [
  'ngMaterial',
  'ui.router',
  'ngMessages',
  'ja.qr',
  'chart.js',
  'angularMoment',
  'ngWebSocket',
  'ngStorage',
  'angular-inview',
  'hc.marked',
  'pascalprecht.translate',
  'oc.lazyLoad',
])
.config(["$mdThemingProvider",$mdThemingProvider => {
  $mdThemingProvider.alwaysWatchTheme(true);
  
  $mdThemingProvider.theme('default');
  //   .dark();
  $mdThemingProvider.theme('pink')
    .primaryPalette('pink')
    .accentPalette('orange');


}]);
