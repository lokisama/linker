const app = angular.module('app');

app.controller('AdminSettingsController', ['$scope', '$http', '$timeout', '$state',
  ($scope, $http, $timeout, $state) => {
    $scope.setTitle('设置');
    $scope.toGiftCard = () => {
      $state.go('admin.listGiftCardBatch');
    }
    $scope.toNotice = () => {
      $state.go('admin.notice');
    };
    $scope.toPayment = () => {
      $state.go('admin.paymentList');
    };
    $scope.toAccount = () => {
      $state.go('admin.accountSetting');
    };
    $scope.toBase = () => {
      $state.go('admin.baseSetting');
    };
    $scope.toMail = () => {
      $state.go('admin.mailSetting');
    };
    $scope.toPassword = () => {
      $state.go('admin.passwordSetting');
    };
    $scope.toTelegram = () => {
      $state.go('admin.telegramSetting');
    };
    $scope.empty = () => {};
  }
]).controller('AdminPaymentSettingController', ['$scope', '$http', '$timeout', '$state',
  ($scope, $http, $timeout, $state) => {
    $scope.setTitle('支付设置');
    $scope.setMenuButton('arrow_back', 'admin.settings');
    $scope.time = [{
      id: 'hour',
      name: '小时',
    }, {
      id: 'day',
      name: '天',
    }, {
      id: 'week',
      name: '周',
    }, {
      id: 'month',
      name: '月',
    }, {
      id: 'season',
      name: '季',
    }, {
      id: 'year',
      name: '年',
    }];
    let lastSave = 0;
    let lastSavePromise = null;
    const saveTime = 3500;
    $scope.saveSetting = () => {
      if(Date.now() - lastSave <= saveTime) {
        lastSavePromise && $timeout.cancel(lastSavePromise);
      }
      const timeout = Date.now() - lastSave >= saveTime ? 0 : saveTime - Date.now() + lastSave;
      lastSave = Date.now();
      lastSavePromise = $timeout(() => {
        $http.put('/api/admin/setting/payment', {
          data: $scope.paymentData,
        });
      }, timeout);
    };
    $http.get('/api/admin/setting/payment').then(success => {
      $scope.paymentData = success.data;
      $scope.$watch('paymentData', () => {
        $scope.saveSetting();
      }, true);
    });
  }
]).controller('AdminAccountSettingController', ['$scope', '$http', '$timeout', '$state',
  ($scope, $http, $timeout, $state) => {
    $scope.setTitle('账号设置');
    $scope.setMenuButton('arrow_back', 'admin.settings');
    let lastSave = 0;
    let lastSavePromise = null;
    const saveTime = 3500;
    $scope.saveSetting = () => {
      if(Date.now() - lastSave <= saveTime) {
        lastSavePromise && $timeout.cancel(lastSavePromise);
      }
      const timeout = Date.now() - lastSave >= saveTime ? 0 : saveTime - Date.now() + lastSave;
      lastSave = Date.now();
      lastSavePromise = $timeout(() => {
        if(!$scope.setServerForNewUser) {
          $scope.accountData.accountForNewUser.server = null;
        } else {
          $scope.accountData.accountForNewUser.server = [];
          for(const ele in $scope.accountServerObj) {
            if($scope.accountServerObj[ele]) {
              $scope.accountData.accountForNewUser.server.push(+ele);
            }
          };
        }
        $http.put('/api/admin/setting/account', {
          data: $scope.accountData,
        });
      }, timeout);
    };
    $scope.setServerForNewUser = false;
    $scope.accountServerObj = {};
    $http.get('/api/admin/setting/account').then(success => {
      $scope.accountData = success.data;
      if($scope.accountData.accountForNewUser.server) {
        $scope.setServerForNewUser = true;
        $scope.accountData.accountForNewUser.server.forEach(f => {
          $scope.accountServerObj[f] = true;
        });
      }
      return $http.get('/api/admin/server');
    }).then(success => {
      $scope.servers = success.data;
      $scope.$watch('accountData', () => {
        $scope.saveSetting();
      }, true);
      $scope.$watch('setServerForNewUser', () => {
        $scope.saveSetting();
      }, true);
      $scope.$watch('accountServerObj', () => {
        $scope.saveSetting();
      }, true);
    });
  }
]).controller('AdminBaseSettingController', ['$scope', '$http', '$timeout', '$state', '$q',
  ($scope, $http, $timeout, $state, $q) => {
    $scope.setTitle('基本设置');
    $scope.setMenuButton('arrow_back', 'admin.settings');
    $scope.baseData = {};
    let lastSave = 0;
    let lastSavePromise = null;
    const saveTime = 3500;
    $scope.saveSetting = () => {
      if(Date.now() - lastSave <= saveTime) {
        lastSavePromise && $timeout.cancel(lastSavePromise);
      }
      const timeout = Date.now() - lastSave >= saveTime ? 0 : saveTime - Date.now() + lastSave;
      lastSave = Date.now();
      lastSavePromise = $timeout(() => {
        $http.put('/api/admin/setting/base', {
          data: $scope.baseData,
        });
      }, timeout);
    };
    $http.get('/api/admin/setting/base').then(success => {
      $scope.baseData = success.data;
      $scope.setBorder('primaryStyle', $scope.baseData.themePrimary);
      $scope.setBorder('accentStyle', $scope.baseData.themeAccent);
      $scope.$watch('baseData', () => {
        $scope.saveSetting();
      }, true);
    });
    $scope.colors = [
      { value: 'red', color: '#F44336' },
      { value: 'pink', color: '#E91E63' },
      { value: 'purple', color: '#9C27B0' },
      { value: 'deep-purple', color: '#673AB7' },
      { value: 'indigo', color: '#3F51B5' },
      { value: 'blue', color: '#2196F3' },
      { value: 'light-blue', color: '#03A9F4' },
      { value: 'cyan', color: '#00BCD4' },
      { value: 'teal', color: '#009688' },
      { value: 'green', color: '#4CAF50' },
      { value: 'light-green', color: '#8BC34A' },
      { value: 'lime', color: '#CDDC39' },
      { value: 'yellow', color: '#FFEB3B' },
      { value: 'amber', color: '#FFC107' },
      { value: 'orange', color: '#FF9800' },
      { value: 'deep-orange', color: '#FF5722' },
      { value: 'brown', color: '#795548' },
      { value: 'blue-grey', color: '#607D8B' },
      { value: 'grey', color: '#9E9E9E' },
    ];
    $scope.colors.forEach(color => {
      color.primaryStyle = {
        'background': color.color,
        'border-style': 'solid',
        'border-width': '0px',
      };
      color.accentStyle = {
        'background': color.color,
        'border-style': 'solid',
        'border-width': '0px',
      };
    });
    $scope.setBorder = (type, color) => {
      $scope.colors.forEach(c => {
        if(c.value === color) {
          c[type]['border-width'] = '2px';
        } else {
          c[type]['border-width'] = '0px';
        }
      });
    };
    $scope.setPrimaryColor = color => {
      $scope.baseData.themePrimary = color;
      $scope.setBorder('primaryStyle', color);
    };
    $scope.setAccentColor = color => {
      $scope.baseData.themeAccent = color;
      $scope.setBorder('accentStyle', color);
    };
    $scope.serviceWorkerUpdate = () => {
      $scope.baseData.serviceWorkerTime = Date.now();
    };

    $scope.showBrowserPush = false;
    const getSubscriptionData = () => {
      if(!('serviceWorker' in navigator)) {
        return;
      }
      $scope.showBrowserPush = true;
      navigator.serviceWorker.ready.then(reg => {
        return reg.pushManager.getSubscription();
      }).then(subscription => {
        if (!subscription) {
          $scope.receiveBrowserPush = false;
        } else {
          $scope.receiveBrowserPush = true;
        }
      });
    };
    getSubscriptionData();
    $scope.changeBrowserPush = () => {
      navigator.serviceWorker.ready.then(reg => {
        if($scope.receiveBrowserPush) {
          return reg.pushManager.subscribe({
            userVisibleOnly: true
          }).then(success => {
            $http.post('/api/push/client', { data: success });
          });
        } else {
          let subscription;
          return reg.pushManager.getSubscription()
          .then(success => {
            subscription = success;
            return $http.delete('/api/push/client', {
              params: {
                data: success
              }
            });
          }).then(success => {
            return subscription.unsubscribe();
          });
        }
      });
    };
  }
]).controller('AdminMailSettingController', ['$scope', '$http', '$timeout', '$state', 'setEmailDialog',
  ($scope, $http, $timeout, $state, setEmailDialog) => {
    $scope.setTitle('邮件设置');
    $scope.setMenuButton('arrow_back', 'admin.settings');
    $scope.mails = [
      { type: 'code', name: '注册验证码' },
      { type: 'reset', name: '密码重置' },
      { type: 'order', name: '订单完成' },
    ];
    $scope.setEmail = type => {
      setEmailDialog.show(type);
    };
  }
]).controller('AdminPasswordSettingController', ['$scope', '$http', '$timeout', '$state', 'adminApi', 'alertDialog', '$localStorage',
  ($scope, $http, $timeout, $state, adminApi, alertDialog, $localStorage) => {
    $scope.setTitle('修改密码');
    $scope.setMenuButton('arrow_back', 'admin.settings');
    $scope.data = {
      password: '',
      newPassword: '',
      newPasswordAgain: '',
    };
    $scope.confirm = () => {
      alertDialog.loading();
      adminApi.changePassword($scope.data.password, $scope.data.newPassword).then(success => {
        alertDialog.show('修改密码成功，请重新登录', '确定')
        .then(() => {
          return $http.post('/api/home/logout');
        }).then(() => {
          $localStorage.home = {};
          $localStorage.admin = {};
          $state.go('home.index');
        });
      }).catch(err => {
        alertDialog.show('修改密码失败', '确定');
      });
    };
  }
]).controller('AdminTelegramSettingController', ['$scope', '$http', '$interval', '$state',
  ($scope, $http, $interval, $state) => {
    $scope.setTitle('绑定Telegram');
    $scope.setMenuButton('arrow_back', 'admin.settings');
    $scope.isLoading = true;
    $scope.code = {};
    const getCode = () => {
      $http.get('/api/admin/telegram/code').then(success => {
        $scope.code = success.data;
        $scope.isLoading = false;
      });
    };
    $scope.setInterval($interval(() => {
      getCode();
    }, 5 * 1000));
    getCode();
    $scope.unbind = () => {
      $scope.isLoading = true;
      $http.post('/api/admin/telegram/unbind');
    };
  }
]).controller('AdminPaymentListController', ['$scope', '$http', '$state',
  ($scope, $http, $state) => {
    $scope.setTitle('支付设置');
    $scope.setMenuButton('arrow_back', 'admin.settings');
    $scope.time = [{
      id: 'hour',
      name: '小时',
    }, {
      id: 'day',
      name: '天',
    }, {
      id: 'week',
      name: '周',
    }, {
      id: 'month',
      name: '月',
    }, {
      id: 'season',
      name: '季',
    }, {
      id: 'year',
      name: '年',
    }];
    $scope.editPayment = id => {
      $state.go('admin.editPayment', { paymentType: id });
    };
    $http.get('/api/admin/setting/payment').then(success => {
      $scope.paymentData = success.data;
    });
  }
]).controller('AdminEditPaymentController', ['$scope', '$http', '$timeout', '$interval', '$state', '$stateParams',
  ($scope, $http, $timeout, $interval, $state, $stateParams) => {
    $scope.setTitle('修改支付');
    $scope.setMenuButton('arrow_back', 'admin.paymentList');
    $scope.paymentType = $stateParams.paymentType;
    $scope.paymentTypeName = type => {
      switch(type) {
        case 'hour':
          return '小时'; break;
        case 'day':
          return '天'; break;
        case 'week':
          return '周'; break;
        case 'month':
          return '月'; break;
        case 'season':
          return '季'; break;
        case 'year':
          return '年'; break;
        default:
          return '';
      }
    };
    let lastSave = 0;
    let lastSavePromise = null;
    const saveTime = 3500;
    $scope.saveSetting = () => {
      if(Date.now() - lastSave <= saveTime) {
        lastSavePromise && $timeout.cancel(lastSavePromise);
      }
      const timeout = Date.now() - lastSave >= saveTime ? 0 : saveTime - Date.now() + lastSave;
      lastSave = Date.now();
      lastSavePromise = $timeout(() => {
        if(!$scope.setServerForPayment) {
          $scope.paymentData.server = null;
        } else {
          $scope.paymentData.server = [];
          for(const ele in $scope.accountServerObj) {
            if($scope.accountServerObj[ele]) {
              $scope.paymentData.server.push(+ele);
            }
          };
        }
        $http.put('/api/admin/setting/payment', {
          data: $scope.payment,
        });
      }, timeout);
    };
    $scope.setServerForPayment = false;
    $scope.accountServerObj = {};
    $http.get('/api/admin/setting/payment').then(success => {
      $scope.payment = success.data;
      $scope.paymentData = $scope.payment[$scope.paymentType];
      if($scope.paymentData.server) {
        $scope.setServerForPayment = true;
        $scope.paymentData.server.forEach(f => {
          $scope.accountServerObj[f] = true;
        });
      }
      return $http.get('/api/admin/server');
    }).then(success => {
      $scope.servers = success.data;
      $scope.$watch('paymentData', () => {
        $scope.saveSetting();
      }, true);
      $scope.$watch('setServerForPayment', () => {
        $scope.saveSetting();
      }, true);
      $scope.$watch('accountServerObj', () => {
        $scope.saveSetting();
      }, true);
    });
  }
])
;