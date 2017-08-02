const app = angular.module('app');
const window = require('window');
const cdn = window.cdn || '';
app.factory('alertDialog' , [ '$mdDialog', ($mdDialog) => {
  const publicInfo = {};
  publicInfo.isLoading = false;
  publicInfo.content = '';
  publicInfo.button = '';
  let alertDialogPromise = null;
  const isDialogShow = () => {
    if(alertDialogPromise && !alertDialogPromise.$$state.status) {
      return true;
    }
    return false;
  };
  const close = () => {
    return $mdDialog.hide().then(success => {
      publicInfo.isLoading = false;
      alertDialogPromise = null;
      return;
    }).catch(err => {
      publicInfo.isLoading = false;
      alertDialogPromise = null;
      return;
    });
  };
  publicInfo.close = close;
  const dialog = {
    templateUrl: `${ cdn }/public/views/home/alertDialog.html`,
    escapeToClose: false,
    locals: { bind: publicInfo },
    bindToController: true,
    controller: ['$scope', '$mdDialog', 'bind', function($scope, $mdDialog, bind) {
      $scope.publicInfo = bind;
    }],
    clickOutsideToClose: false,
  };
  const show = (content, button) => {
    publicInfo.content = content;
    publicInfo.button = button;
    if(isDialogShow()) {
      publicInfo.isLoading = false;
      return alertDialogPromise;
    }
    alertDialogPromise = $mdDialog.show(dialog);
    return alertDialogPromise;
  };
  const loading = () => {
    publicInfo.isLoading = true;
    if(!isDialogShow()) {
      show();
    }
  };
  return {
    show,
    loading,
    close,
  };
}]);

app.factory('confirmDialog' , [ '$mdDialog', ($mdDialog) => {
  const publicInfo = { status: 'show' };
  let dialogPromise = null;
  const isDialogShow = () => {
    if(dialogPromise && !dialogPromise.$$state.status) {
      return true;
    }
    return false;
  };
  const show = (options = {}) => {
    publicInfo.status = 'show';
    const { text, cancel, confirm, error, fn } = options;
    publicInfo.text = text;
    publicInfo.cancel = cancel;
    publicInfo.confirm = confirm;
    publicInfo.error = error;
    publicInfo.fn = fn;
    if(isDialogShow()) {
      return dialogPromise;
    }
    dialogPromise = $mdDialog.show(dialog);
    return dialogPromise;
  };
  const cancelFn = () => {
    return $mdDialog.cancel().then(success => {
      dialogPromise = null;
      return;
    }).catch(err => {
      dialogPromise = null;
      return;
    });
  };
  const hideFn = () => {
    return $mdDialog.hide().then(success => {
      dialogPromise = null;
      return;
    }).catch(err => {
      dialogPromise = null;
      return;
    });
  };
  publicInfo.cancelFn = cancelFn;
  const confirmFn = () => {
    publicInfo.status = 'loading';
    publicInfo.fn().then(success => {
      hideFn();
    }).catch(() => {
      publicInfo.status = 'error';
    });
  };
  publicInfo.confirmFn = confirmFn;
  const dialog = {
    templateUrl: `${ cdn }/public/views/home/confirmDialog.html`,
    escapeToClose: false,
    locals: { bind: publicInfo },
    bindToController: true,
    controller: ['$scope', '$mdDialog', 'bind', function($scope, $mdDialog, bind) {
      $scope.publicInfo = bind;
    }],
    clickOutsideToClose: false,
  };
  return {
    show,
  };
}]);

app.factory('payDialog' , [ '$mdDialog', '$interval', '$http', ($mdDialog, $interval, $http) => {
  const publicInfo = {
    config: JSON.parse(window.ssmgrConfig),
    orderType: 'month',
    time: [{
      type: 'hour', name: '一小时'
    }, {
      type: 'day', name: '一天'
    }, {
      type: 'week', name: '5G/一个月'
    }, {
      type: 'month', name: '无限/一个月'
    }, {
      type: 'season', name: '无限/三个月'
    }, {
      type: 'year', name: '无限/一年'
    }],
  };
  let dialogPromise = null;
  const createOrder = () => {
    publicInfo.status = 'loading';
    if(publicInfo.alipay[publicInfo.orderType]) {
      $http.post('/api/user/order/qrcode', {
        accountId: publicInfo.accountId,
        orderType: publicInfo.orderType,
      }).then(success => {
        publicInfo.orderId = success.data.orderId;
        publicInfo.qrCode = success.data.qrCode;
        publicInfo.status = 'pay';

        interval = $interval(() => {
          $http.post('/api/user/order/status', {
            orderId: publicInfo.orderId,
          }).then(success => {
            const orderStatus = success.data.status;
            if(orderStatus === 'TRADE_SUCCESS' || orderStatus === 'FINISH') {
              publicInfo.status = 'success';
              interval && $interval.cancel(interval);
            }
          });
        }, 5 * 1000);
      }).catch(() => {
        publicInfo.status = 'error';
      });
    } else {
      publicInfo.status = 'pay';
    }
    const env = JSON.parse(window.ssmgrConfig).paypalMode === 'sandbox' ? 'sandbox' : 'production';
      if(publicInfo.paypal[publicInfo.orderType]) {
        paypal.Button.render({
          locale: 'zh_CN',
          style: {
            label: 'checkout', // checkout | credit | pay
            size:  'medium',   // small    | medium | responsive
            shape: 'rect',     // pill     | rect
            color: 'blue'      // gold     | blue   | silver
          },
          env, // production or sandbox
          commit: true,
          payment: function() {
            var CREATE_URL = '/api/user/paypal/create';
            return paypal.request.post(CREATE_URL, {
              accountId: publicInfo.accountId,
              orderType: publicInfo.orderType,
            })
            .then(function(res) {
              return res.paymentID;
            });
          },
          onAuthorize: function(data, actions) {
            var EXECUTE_URL = '/api/user/paypal/execute/';
            var data = {
              paymentID: data.paymentID,
              payerID: data.payerID
            };
            return paypal.request.post(EXECUTE_URL, data)
            .then(function (res) {
              close();
            });
          }
        }, '#paypal-button-container');
      }
  };
  let interval = null;
  const close = () => {
    interval && $interval.cancel(interval);
    $mdDialog.hide();
  };
  publicInfo.createOrder = createOrder;
  publicInfo.close = close;
  const dialog = {
    templateUrl: `${ cdn }/public/views/user/payDialog.html`,
    escapeToClose: false,
    locals: { bind: publicInfo },
    bindToController: true,
    fullscreen: true,
    controller: ['$scope', '$mdDialog', '$mdMedia', 'bind', function($scope, $mdDialog, $mdMedia, bind) {
      $scope.publicInfo = bind;
      $scope.setDialogWidth = () => {
        if($mdMedia('xs') || $mdMedia('sm')) {
          return {};
        }
        return { 'min-width': '400px' };
      };
      $scope.getQrCodeSize = () => {
        if($mdMedia('xs') || $mdMedia('sm')) {
          return 200;
        }
        return 250;
      };
      $scope.qrCode = () => { return $scope.publicInfo.qrCode || 'invalid qrcode'; };
      $scope.pay = () => {
        window.location.href = $scope.publicInfo.qrCode;
      };
    }],
    clickOutsideToClose: false,
  };
  const chooseOrderType = accountId => {
    publicInfo.status = 'loading';
    dialogPromise = $mdDialog.show(dialog);
    $http.get('/api/user/order/price').then(success => {
      publicInfo.alipay = success.data.alipay;
      publicInfo.paypal = success.data.paypal;
      publicInfo.status = 'choose';
      publicInfo.accountId = accountId;
      return dialogPromise;
    }).catch(() => {
      publicInfo.status = 'error';
      return dialogPromise;
    });
  };
  return {
    chooseOrderType,
    createOrder,
  };
}]);

app.factory('accountSortTool', [ () => {
  const sort = (accountInfo, method) => {
    accountInfo.account = accountInfo.originalAccount.sort((a, b) => {
      if(method.sort === 'port_asc') {
        return a.port >= b.port ? 1 : -1;
      } else if (method.sort === 'port_desc') {
        return a.port <= b.port ? 1 : -1;
      } else if (method.sort === 'expire_desc') {
        if(!a.data) { return -1; }
        if(!b.data) { return 1; }
        return a.data.expire <= b.data.expire ? 1 : -1;
      } else if (method.sort === 'expire_asc') {
        if(!a.data) { return 1; }
        if(!b.data) { return -1; }
        return a.data.expire >= b.data.expire ? 1 : -1;
      }
    });
    accountInfo.account = accountInfo.account.filter(f => {
      let show = true;
      if(!method.filter.unlimit && f.type === 1) {
        show = false;
      }
      if(!method.filter.expired && f.data && f.data.expire >= Date.now()) {
        show = false;
      }
      if(!method.filter.unexpired && f.data && f.data.expire <= Date.now()) {
        show = false;
      }
      return show;
    });
  };
  return sort;
}]);

app.factory('accountSortDialog' , [ '$mdDialog', ($mdDialog) => {
  const publicInfo = {};
  const hide = () => {
    return $mdDialog.hide()
    .then(success => {
      dialogPromise = null;
      return;
    }).catch(err => {
      dialogPromise = null;
      return;
    });
  };
  publicInfo.hide = hide;
  let dialogPromise = null;
  const isDialogShow = () => {
    if(dialogPromise && !dialogPromise.$$state.status) {
      return true;
    }
    return false;
  };
  const dialog = {
    templateUrl: `${ cdn }/public/views/admin/accountSortAndFilterDialog.html`,
    escapeToClose: false,
    locals: { bind: publicInfo },
    bindToController: true,
    controller: ['$scope', '$mdDialog', '$sessionStorage', 'accountSortTool', 'bind', function($scope, $mdDialog, $sessionStorage, accountSortTool, bind) {
      $scope.publicInfo = bind;
      $scope.sortAndFilter = () => {
        accountSortTool($scope.publicInfo.accountInfo, $scope.publicInfo.accountMethod);
      };
    }],
    clickOutsideToClose: true,
  };
  const show = (accountMethod, accountInfo) => {
    if(isDialogShow()) {
      return dialogPromise;
    }
    publicInfo.accountMethod = accountMethod;
    publicInfo.accountInfo = accountInfo;
    dialogPromise = $mdDialog.show(dialog);
    return dialogPromise;
  };
  return {
    show,
    hide,
  };
}]);

app.factory('userSortDialog' , [ '$mdDialog', ($mdDialog) => {
  const publicInfo = {};
  const hide = () => {
    return $mdDialog.hide()
    .then(success => {
      dialogPromise = null;
      return;
    }).catch(err => {
      dialogPromise = null;
      return;
    });
  };
  publicInfo.hide = hide;
  let dialogPromise = null;
  const isDialogShow = () => {
    if(dialogPromise && !dialogPromise.$$state.status) {
      return true;
    }
    return false;
  };
  const dialog = {
    templateUrl: `${ cdn }/public/views/admin/userSortDialog.html`,
    escapeToClose: false,
    locals: { bind: publicInfo },
    bindToController: true,
    controller: ['$scope', '$mdDialog', '$localStorage', 'bind', function($scope, $mdDialog, $localStorage, bind) {
      $scope.publicInfo = bind;
      $scope.userSort = $localStorage.admin.userSortSettings;
    }],
    clickOutsideToClose: true,
  };
  const show = () => {
    if(isDialogShow()) {
      return dialogPromise;
    }
    dialogPromise = $mdDialog.show(dialog);
    return dialogPromise;
  };
  return {
    show,
    hide,
  };
}]);

app.factory('orderFilterDialog' , [ '$mdDialog', ($mdDialog) => {
  const publicInfo = {};
  const hide = () => {
    return $mdDialog.hide()
    .then(success => {
      dialogPromise = null;
      return;
    }).catch(err => {
      dialogPromise = null;
      return;
    });
  };
  publicInfo.hide = hide;
  let dialogPromise = null;
  const isDialogShow = () => {
    if(dialogPromise && !dialogPromise.$$state.status) {
      return true;
    }
    return false;
  };
  const dialog = {
    templateUrl: `${ cdn }/public/views/admin/orderFilterDialog.html`,
    escapeToClose: false,
    locals: { bind: publicInfo },
    bindToController: true,
    controller: ['$scope', '$mdDialog', '$localStorage', 'bind', function($scope, $mdDialog, $localStorage, bind) {
      $scope.publicInfo = bind;
      $scope.orderFilter = $localStorage.admin.orderFilterSettings;
    }],
    clickOutsideToClose: true,
  };
  const show = () => {
    if(isDialogShow()) {
      return dialogPromise;
    }
    dialogPromise = $mdDialog.show(dialog);
    return dialogPromise;
  };
  return {
    show,
    hide,
  };
}]);

app.factory('orderDialog', [ '$mdDialog', '$state', ($mdDialog, $state) => {
  const publicInfo = {};
  const hide = () => {
    return $mdDialog.hide()
    .then(success => {
      dialogPromise = null;
      return;
    }).catch(err => {
      dialogPromise = null;
      return;
    });
  };
  publicInfo.hide = hide;
  const toUserPage = userId => {
    hide();
    $state.go('admin.userPage', { userId });
  };
  publicInfo.toUserPage = toUserPage;
  let dialogPromise = null;
  const isDialogShow = () => {
    if(dialogPromise && !dialogPromise.$$state.status) {
      return true;
    }
    return false;
  };
  const dialog = {
    templateUrl: `${ cdn }/public/views/admin/orderDialog.html`,
    escapeToClose: false,
    locals: { bind: publicInfo },
    bindToController: true,
    controller: ['$scope', '$mdMedia', '$mdDialog', 'bind', function($scope, $mdMedia, $mdDialog, bind) {
      $scope.publicInfo = bind;
      $scope.setDialogWidth = () => {
        if($mdMedia('xs') || $mdMedia('sm')) {
          return {};
        }
        return { 'min-width': '400px' };
      };
    }],
    fullscreen: true,
    clickOutsideToClose: true,
  };
  const show = (order) => {
    if(isDialogShow()) {
      return dialogPromise;
    }
    publicInfo.order = order;
    dialogPromise = $mdDialog.show(dialog);
    return dialogPromise;
  };
  return {
    show,
  };
}]);

app.factory('markdownDialog', [ '$mdDialog', ($mdDialog) => {
  const publicInfo = {};
  const hide = () => {
    return $mdDialog.hide()
    .then(success => {
      dialogPromise = null;
      return;
    }).catch(err => {
      dialogPromise = null;
      return;
    });
  };
  publicInfo.hide = hide;
  let dialogPromise = null;
  const isDialogShow = () => {
    if(dialogPromise && !dialogPromise.$$state.status) {
      return true;
    }
    return false;
  };
  const dialog = {
    templateUrl: `${ cdn }/public/views/admin/previewNotice.html`,
    escapeToClose: false,
    locals: { bind: publicInfo },
    bindToController: true,
    controller: ['$scope', '$mdDialog', 'bind', function($scope, $mdDialog, bind) {
      $scope.publicInfo = bind;
      $scope.setDialogWidth = () => {
        if($mdMedia('xs') || $mdMedia('sm')) {
          return {};
        }
        return { 'min-width': '400px' };
      };
    }],
    fullscreen: true,
    clickOutsideToClose: true,
  };
  const show = (title, markdown) => {
    if(isDialogShow()) {
      return dialogPromise;
    }
    publicInfo.title = title;
    publicInfo.markdown = markdown;
    dialogPromise = $mdDialog.show(dialog);
    return dialogPromise;
  };
  return {
    show,
  };
}]);

app.factory('changePasswordDialog', [ '$mdDialog', 'userApi', ($mdDialog, userApi) => {
  const publicInfo = {
    status: 'show',
  };
  let dialogPromise = null;
  const isDialogShow = () => {
    if(dialogPromise && !dialogPromise.$$state.status) {
      return true;
    }
    return false;
  };
  const show = (accountId, password) => {
    if(isDialogShow()) {
      return dialogPromise;
    }
    publicInfo.status = 'show';
    publicInfo.accountId = accountId;
    publicInfo.password = password;
    dialogPromise = $mdDialog.show(dialog);
    return dialogPromise;
  };
  const close = () => {
    return $mdDialog.hide()
    .then(success => {
      dialogPromise = null;
      return;
    }).catch(err => {
      dialogPromise = null;
      return;
    });
  };
  const changePassword = () => {
    if(!publicInfo.password) { return; }
    publicInfo.status = 'loading';
    userApi.changePassword(publicInfo.accountId, publicInfo.password)
    .then(() => {
      publicInfo.status = 'success';
    })
    .catch(() => {
      publicInfo.status = 'error';
    });
  };
  publicInfo.close = close;
  publicInfo.changePassword = changePassword;
  const dialog = {
    templateUrl: `${ cdn }/public/views/user/changePassword.html`,
    escapeToClose: false,
    locals: { bind: publicInfo },
    bindToController: true,
    controller: ['$scope', 'bind', ($scope, bind) => {
      $scope.publicInfo = bind;
    }],
    clickOutsideToClose: false,
  };
  return {
    show,
  };
}]);

app.factory('qrcodeDialog', [ '$mdDialog', ($mdDialog) => {
  const publicInfo = {};
  const hide = () => {
    return $mdDialog.hide()
    .then(success => {
      dialogPromise = null;
      return;
    }).catch(err => {
      dialogPromise = null;
      return;
    });
  };
  publicInfo.hide = hide;
  let dialogPromise = null;
  const isDialogShow = () => {
    if(dialogPromise && !dialogPromise.$$state.status) {
      return true;
    }
    return false;
  };
  const dialog = {
    templateUrl: `${ cdn }/public/views/user/qrcodeDialog.html`,
    escapeToClose: false,
    locals: { bind: publicInfo },
    bindToController: true,
    controller: ['$scope', '$mdDialog', '$mdMedia', 'bind', function($scope, $mdDialog, $mdMedia, bind) {
      $scope.publicInfo = bind;
      $scope.setDialogWidth = () => {
        if($mdMedia('xs') || $mdMedia('sm')) {
          return {};
        }
        return { 'min-width': '400px' };
      };
    }],
    fullscreen: true,
    clickOutsideToClose: true,
  };
  const show = (serverName, ssAddress) => {
    if(isDialogShow()) {
      return dialogPromise;
    }
    publicInfo.serverName = serverName;
    publicInfo.ssAddress = ssAddress;
    dialogPromise = $mdDialog.show(dialog);
    return dialogPromise;
  };
  return {
    show,
  };
}]);

app.factory('emailDialog', [ '$mdDialog', '$state', '$http', ($mdDialog, $state, $http) => {
  const publicInfo = {};
  const hide = () => {
    return $mdDialog.hide()
    .then(success => {
      dialogPromise = null;
      return;
    }).catch(err => {
      dialogPromise = null;
      return;
    });
  };
  publicInfo.hide = hide;
  const send = (title, content) => {
    load();
    $http.post(`/api/admin/user/${ publicInfo.userId }/sendEmail`, {
      title,
      content,
    }).then(success => {
      hide();
    }).catch(() => {
      publicInfo.isLoading = false;
    });
  };
  publicInfo.send = send;
  let dialogPromise = null;
  const isDialogShow = () => {
    if(dialogPromise && !dialogPromise.$$state.status) {
      return true;
    }
    return false;
  };
  const dialog = {
    templateUrl: `${ cdn }/public/views/admin/emailDialog.html`,
    escapeToClose: false,
    locals: { bind: publicInfo },
    bindToController: true,
    controller: ['$scope', '$mdMedia', '$mdDialog', '$http', '$localStorage', 'bind', function($scope, $mdMedia, $mdDialog, $http, $localStorage, bind) {
      $scope.publicInfo = bind;
      if(!$localStorage.admin.email) {
        $localStorage.admin.email = {
          title: '', content: '',
        };
      }
      $scope.publicInfo.email = $localStorage.admin.email;
      $scope.setDialogWidth = () => {
        if($mdMedia('xs') || $mdMedia('sm')) {
          return {};
        }
        return { 'min-width': '400px' };
      };
    }],
    fullscreen: true,
    clickOutsideToClose: false,
  };
  const load = () => {
    publicInfo.isLoading = true;
  };
  const show = userId => {
    publicInfo.isLoading = false;
    if(isDialogShow()) {
      return dialogPromise;
    }
    publicInfo.userId = userId;
    dialogPromise = $mdDialog.show(dialog);
    return dialogPromise;
  };
  return {
    show,
  };
}]);

app.factory('ipDialog', [ '$mdDialog', ($mdDialog) => {
  const publicInfo = {};
  const hide = () => {
    return $mdDialog.hide()
    .then(success => {
      dialogPromise = null;
      return;
    }).catch(err => {
      dialogPromise = null;
      return;
    });
  };
  publicInfo.hide = hide;
  let dialogPromise = null;
  const isDialogShow = () => {
    if(dialogPromise && !dialogPromise.$$state.status) {
      return true;
    }
    return false;
  };
  const dialog = {
    templateUrl: `${ cdn }/public/views/admin/ip.html`,
    escapeToClose: false,
    locals: { bind: publicInfo },
    bindToController: true,
    controller: ['$scope', '$state', '$http', '$mdDialog', '$mdMedia', '$q', 'bind', function($scope, $state, $http, $mdDialog, $mdMedia, $q, bind) {
      $scope.publicInfo = bind;
      $scope.setDialogWidth = () => {
        if($mdMedia('xs') || $mdMedia('sm')) {
          return {};
        }
        return { 'min-width': '400px' };
      };
      $q.all([
        $http.get(`/api/admin/account/${ $scope.publicInfo.serverId }/${ $scope.publicInfo.accountId }/ip`),
        $http.get(`/api/admin/account/${ $scope.publicInfo.accountId }/ip`),
      ]).then(success => {
        $scope.ip = success[0].data.ip.map(i => {
          return { ip: i };
        });
        $scope.allIp = success[1].data.ip.map(i => {
          return { ip: i };
        });
        $scope.ip.forEach(ip => {
          getIpInfo(ip.ip).then(success => {
            ip.info = success;
          });
        });
        $scope.allIp.forEach(ip => {
          getIpInfo(ip.ip).then(success => {
            ip.info = success;
          });
        });
      });
      const getIpInfo = ip => {
        const url = `/api/admin/account/ip/${ ip }`;
        return $http.get(url).then(success => success.data);
      };
      $scope.checkIp = ip => {
        const url = `http://www.ip138.com/ips138.asp?ip=${ ip }&action=2`;
        window.open(url, '_blank');
      };
    }],
    fullscreen: true,
    clickOutsideToClose: true,
  };
  const show = (serverId, accountId) => {
    if(isDialogShow()) {
      return dialogPromise;
    }
    publicInfo.serverId = serverId;
    publicInfo.accountId = accountId;
    dialogPromise = $mdDialog.show(dialog);
    return dialogPromise;
  };
  return {
    show,
  };
}]);