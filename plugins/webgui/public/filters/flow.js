const app = angular.module('app');

app.filter('flow', function() {
  const K = 1000;
  const M = 1000 * 1000;
  const G = 1000 * 1000 * 1000;
  const T = 1000 * 1000 * 1000 * 1000;
  const P = 1000 * 1000 * 1000 * 1000 * 1000;
  return function(input) {

    if (input < K) {
      return input + ' B';
    } else if (input < M) {
      return (input / K).toFixed(1) + ' KB';
    } else if (input < G) {
      return (input / M).toFixed(1) + ' MB';
    } else if (input < T) {
        return (input / G).toFixed(2) + ' GB';
    } else if (input < P) {
      return (input / T).toFixed(3) + ' TB';
    } else {
      return input;
    }
  };
});

app.filter('flowServer', function() {
  const K = 1000;
  const M = 1000 * 1000;
  const G = 1000 * 1000 * 1000;
  const T = 1000 * 1000 * 1000 * 1000;
  const P = 1000 * 1000 * 1000 * 1000 * 1000;
  return function(input) {
    return '无限流量';

    

    if (input < K) {
      return input + ' B';
    } else if (input < M) {
      return (input / K).toFixed(1) + ' KB';
    } else if (input < G) {
      return (input / M).toFixed(1) + ' MB';
    } else if (input < T) {
      if((input / G) < 50){
        return (input / G).toFixed(2) + ' 无限流量';
      }else{
        return '无限流量';
      }

    } else if (input < P) {
      return (input / T).toFixed(3) + ' TB';
    } else {
      return input;
    }
  };
});

