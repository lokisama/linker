const app = angular.module('app');

app.controller('AdminController', ['$scope', '$mdMedia', '$mdSidenav', '$state', '$http', '$document', '$interval', '$timeout', '$localStorage', 'configManager',
  ($scope, $mdMedia, $mdSidenav, $state, $http, $document, $interval, $timeout, $localStorage, configManager) => {
    const config = configManager.getConfig();
    if(config.status === 'normal') {
      return $state.go('user.index');
    } else if(!config.status) {
      return $state.go('home.index');
    } else {
      $scope.setMainLoading(false);
    }
    $scope.setConfig(config);
    $scope.setId(config.id);

    $scope.innerSideNav = true;
    $scope.sideNavWidth = () => {
      if($scope.innerSideNav) {
        return {
          width: '200px',
        };
      } else {
        return {
          width: '60px',
        };
      }
    };
    $scope.menus = [{
    //   name: '首页概览',
    //   icon: 'home',
    //   click: 'admin.index',
    // },{
    //   name: '用户管理',
    //   icon: 'people',
    //   click: 'admin.user',
    // },{
    //   name: 'VPN线路',
    //   icon: 'cloud',
    //   click: 'admin.server',
    //   hide: !!($scope.id !== 1),
    // }, {
    //   name: 'VPN端口',
    //   icon: 'account_circle',
    //   click: 'admin.account',
    // }, {
      name: '支付记录',
      icon: 'payment',
      click: 'admin.pay',
      //hide: !($scope.config.paypal || $scope.config.giftcard || $scope.config.refCode || $scope.config.alipay),
    // }, {
    //   name: '优惠券',
    //   icon: 'local_play',
    //   click: 'admin.pay',
    //   hide: !($scope.config.paypal || $scope.config.giftcard || $scope.config.refCode || $scope.config.alipay),
    // }, {
    //   name: '体验券',
    //   icon: 'local_play',
    //   click: 'admin.pay',
    //   hide: !($scope.config.paypal || $scope.config.giftcard || $scope.config.refCode || $scope.config.alipay),
    }, {
      name: '统计',
      icon: 'cloud',
      click: 'admin.analysis'
    }, {
      name: '查询-Tap游戏',
      icon: 'people',
      click: 'admin.tap',
    }, {
      name: '配置-套餐',
      icon: 'account_circle',
      click: 'admin.order',
    }, {
      name: '配置-优惠券',
      icon: 'settings',
      click: 'admin.listGiftCardBatch',
    },{
      name: 'divider',
    }, {
      name: '安全退出',
      icon: 'exit_to_app',
      click: function() {
        $http.post('/api/home/logout').then(() => {
          $localStorage.home = {};
          $localStorage.admin = {};
          configManager.deleteConfig();
          $state.go('home.index');
        });
      },
    }];
    $scope.menuButton = function() {
      if($scope.menuButtonIcon) {
        return $scope.menuButtonClick();
      }
      if ($mdMedia('gt-sm')) {
        $scope.innerSideNav = !$scope.innerSideNav;
      } else {
        $mdSidenav('left').toggle();
      }
    };
    $scope.menuClick = (index) => {
      $mdSidenav('left').close();
      if(typeof $scope.menus[index].click === 'function') {
        $scope.menus[index].click();
      } else {
        $state.go($scope.menus[index].click);
      }
    };
    $scope.title = '';
    $scope.setTitle = str => { $scope.title = str; };
    $scope.fabButton = false;
    $scope.fabNumber = null;
    $scope.fabButtonIcon = '';
    $scope.fabButtonClick = () => {};
    $scope.setFabButton = (fn, icon = '') => {
      $scope.fabButtonIcon = icon;
      if(!fn) {
        $scope.fabButton = false;
        $scope.fabButtonClick = () => {};
        return;
      }
      $scope.fabButton = true;
      $scope.fabButtonClick = fn;
    };
    $scope.setFabNumber = number => {
      $scope.fabNumber = number;
    };
    $scope.menuButtonIcon = '';
    $scope.menuButtonClick = () => {};

    let isHistoryBackClick = false;
    let menuButtonHistoryBackState = '';
    let menuButtonHistoryBackStateParams = {};
    const menuButtonBackFn = (to, toParams = {}) => {
      if(menuButtonHistoryBackState) {
        return function () {
          isHistoryBackClick = true;
          $state.go(menuButtonHistoryBackState, menuButtonHistoryBackStateParams);
        };
      } else {
        return function () {
          isHistoryBackClick = false;
          $state.go(to, toParams);
        };
      }
    };
    $scope.setMenuButton = (icon, to, toParams = {}) => {
      $scope.menuButtonIcon = icon;
      if(typeof to === 'string') {
        $scope.menuButtonClick = menuButtonBackFn(to, toParams);
      } else {
        isHistoryBackClick = true;
        $scope.menuButtonClick = to;
      }
    };
    $scope.menuRightButtonIcon = '';
    $scope.menuRightButtonClick = () => {
      $scope.$broadcast('RightButtonClick', 'click');
    };
    $scope.setMenuRightButton = (icon) => {
      $scope.menuRightButtonIcon = icon;
    };
    $scope.menuSearchButtonIcon = '';
    $scope.menuSearch = {
      input: false,
      text: '',
    };
    $scope.menuSearchButtonClick = () => {
      $scope.menuSearch.input = true;
    };
    $scope.setMenuSearchButton = (icon) => {
      $scope.menuSearchButtonIcon = icon;
    };
    $scope.cancelSearch = () => {
      $scope.menuSearch.text = '';
      $scope.menuSearch.input = false;
      $scope.$broadcast('cancelSearch', 'cancel');
    };
    $scope.interval = null;
    $scope.setInterval = interval => {
      $scope.interval = interval;
    };
    $scope.$on('$stateChangeStart', function(event, toUrl, fromUrl) {
      $scope.fabButton = false;
      $scope.fabNumber = null;
      $scope.fabButtonIcon = '';
      $scope.title = '';
      $scope.menuButtonIcon = '';
      $scope.menuRightButtonIcon = '';
      $scope.menuSearchButtonIcon = '';
      $scope.menuSearch.text = '';
      $scope.menuSearch.input = false;
      $scope.interval && $interval.cancel($scope.interval);
      if(!isHistoryBackClick) {
        const str = angular.copy($state.current.name);
        const obj = angular.copy($state.params);
        menuButtonHistoryBackState = str;
        menuButtonHistoryBackStateParams = obj;
      } else {
        isHistoryBackClick = false;
        menuButtonHistoryBackState = '';
        menuButtonHistoryBackStateParams = {};
      }
    });
  }
])
.controller('AdminIndexController', ['$scope', '$state', 'adminApi', '$localStorage', '$interval', 'orderDialog',
  ($scope, $state, adminApi, $localStorage, $interval, orderDialog) => {
    $scope.setTitle('首页概览');
    if($localStorage.admin.indexInfo) {
      $scope.signupUsers = $localStorage.admin.indexInfo.data.signup;
      $scope.loginUsers = $localStorage.admin.indexInfo.data.login;
      $scope.orders = $localStorage.admin.indexInfo.data.order;
      $scope.paypalOrders = $localStorage.admin.indexInfo.data.paypalOrder;
      $scope.topFlow = $localStorage.admin.indexInfo.data.topFlow;
    }
    $scope.toUser = id => {
      $state.go('admin.userPage', { userId: id });
    };
    const updateIndexInfo = () => {
      adminApi.getIndexInfo().then(success => {
        $localStorage.admin.indexInfo = {
          time: Date.now(),
          data: success,
        };
        $scope.signupUsers = success.signup;
        $scope.loginUsers = success.login;
        $scope.orders = success.order;
        $scope.paypalOrders = success.paypalOrder;
        $scope.topFlow = success.topFlow;
      });
    };
    updateIndexInfo();
    $scope.$on('visibilitychange', (event, status) => {
      if(status === 'visible') {
        if($localStorage.admin.indexInfo && Date.now() - $localStorage.admin.indexInfo.time >= 15 * 1000) {
          updateIndexInfo();
        }
      }
    });
    $scope.setInterval($interval(() => {
      if($localStorage.admin.indexInfo && Date.now() - $localStorage.admin.indexInfo.time >= 90 * 1000) {
        updateIndexInfo();
      }
    }, 15 * 1000));
    $scope.showOrderInfo = order => {
      orderDialog.show(order);
    };
    $scope.toTopUser = top => {
      if(top.email) {
        $state.go('admin.userPage', { userId: top.userId });
      } else {
        $state.go('admin.accountPage', { accountId: top.accountId });
      }
    };
  }
])
.controller('AdminPayController', ['$scope', 'adminApi', 'orderDialog', '$mdMedia', '$localStorage', 'orderFilterDialog', '$timeout', '$state',
  ($scope, adminApi, orderDialog, $mdMedia, $localStorage, orderFilterDialog, $timeout, $state) => {
    $scope.setTitle('订单管理');
    $scope.setMenuSearchButton('search');
    $scope.showOrderInfo = order => {
      orderDialog.show(order);
    };
    $scope.myPayType = '';
    let tabSwitchTime = 0;
    $scope.payTypes = [];
    if($scope.config.alipay) { $scope.payTypes.push({ name: '支付宝' }); }
    if($scope.config.paypal) { $scope.payTypes.push({ name: 'Paypal' }); }
    if($scope.config.giftcard) { $scope.payTypes.push({ name: '优惠券' }); }
    if($scope.config.refCode) { $scope.payTypes.push({ name: '邀请码' }); }
    if($scope.payTypes.length) { $scope.myPayType = $scope.payTypes[0].name; }
    $scope.selectPayType = type => {
      console.log(type);
      tabSwitchTime = Date.now();
      $scope.myPayType = type;
      $scope.orders = [];
      $scope.currentPage = 1;
      $scope.isOrderPageFinish = false;
      $scope.getOrders();
    };
    //$scope.selectPayType('支付宝');
    if(!$localStorage.admin.orderFilterSettings) {
      $localStorage.admin.orderFilterSettings = {
        filter: ["CREATE","WAIT_BUYER_PAY","TRADE_SUCCESS","FINISH","TRADE_CLOSED"],
        start:new Date(Date.now() - 3600000 * 24 * 7),
        end: new Date(Date.now()),
        where:{
        },
        group: -1,
      };
    }

    $scope.orderStatusEnum = {
      "0":"已冻结",
      "1":"生效中",
      "2":"已到期",
      "-1":"异常"
    };

    $scope.orderModeEnum = {
      "charge":"充值",
      "recharge":"续费",
      "update":"升级",
      "free":"体验"
    };

    $scope.payStatusEnum = {
      "CREATE":"创建",
      "WAIT_BUYER_PAY":"等待",
      "TRADE_SUCCESS":"成功",
      "FINISH":"完成",
      "TRADE_CLOSED":"关闭"
    };

    $scope.platformEnum = {
      "wechat":"微信",
      "alipay":"支付宝",
      "giftcard":"体验券",
    };

    $scope.orderFilter = $localStorage.admin.orderFilterSettings;

    $scope.filterPhone = $scope.orderFilter.where.hasOwnProperty("username")? $scope.orderFilter.where["username"] : "";
    $scope.filterOrderId = $scope.orderFilter.where.hasOwnProperty("pay.orderId")? $scope.orderFilter.where["pay.orderId"] : "";
    $scope.filterTradeNo = $scope.orderFilter.where.hasOwnProperty("trade_no")? $scope.orderFilter.where["trade_no"] : "";

    $scope.selectOrderMode = $scope.orderFilter.where.hasOwnProperty("orderMode")? $scope.orderFilter.where["orderMode"] : "";;
    $scope.orderModeGroup = Object.keys($scope.orderModeEnum);

    $scope.selectOrderStatus = $scope.orderFilter.where.hasOwnProperty("orderStatus")? $scope.orderFilter.where["orderStatus"] : "";;
    $scope.orderStatusGroup = Object.keys($scope.orderStatusEnum);

    $scope.selectStatus = [];
    $scope.statusGroup = Object.keys($scope.payStatusEnum);
    
    $scope.filterPlatform = $scope.orderFilter.where.hasOwnProperty("platform")? $scope.orderFilter.where["platform"] : "";
    $scope.platformGroup = Object.keys($scope.platformEnum);

    $scope.selectPlan = $scope.orderFilter.where.hasOwnProperty("sku")? $scope.orderFilter.where["sku"] : "";
    $scope.planGroup = [];
    adminApi.getPlans().then(success=>{
      console.log(success);
      $scope.planGroup = success;
    })

    $scope.currentPage = 1;
    $scope.isOrderLoading = false;
    $scope.isOrderPageFinish = false;
    $scope.orders = [];
    const getPageSize = () => {
      if($mdMedia('xs')) { return 30; }
      if($mdMedia('sm')) { return 30; }
      if($mdMedia('md')) { return 40; }
      if($mdMedia('gt-md')) { return 50; }
    };

    $scope.searchByUsername = username =>{
      $scope.filterPhone = username;
      $scope.getOrders();
    }

    $scope.resetSearch = ()=>{

      $localStorage.admin.orderFilterSettings = {
        filter: ["CREATE","WAIT_BUYER_PAY","TRADE_SUCCESS","FINISH","TRADE_CLOSED"],
        start:new Date(Date.now() - 3600000 * 24 * 7),
        end: new Date(Date.now()),
        where:{},
        group: -1,
      };

      $scope.orderFilter = $localStorage.admin.orderFilterSettings;

      $scope.filterPhone = "";
      $scope.filterPlatform = "";
      $scope.selectPlan  ="";
      $scope.selectOrderMode = "";
      $scope.selectOrderStatus = "";

      $scope.getOrders();
    }

    $scope.getOrders = search => {

      $scope.orderFilter.where["username"] = $scope.filterPhone?$scope.filterPhone:"";
      $scope.orderFilter.where["platform"] = $scope.filterPlatform?$scope.filterPlatform:"";
      $scope.orderFilter.where["sku"] = $scope.selectPlan?$scope.selectPlan:"";
      $scope.orderFilter.where["orderMode"] = $scope.selectOrderMode?$scope.selectOrderMode:"";
      $scope.orderFilter.where["orderStatus"] = $scope.selectOrderStatus?$scope.selectOrderStatus:"";
      $scope.orderFilter.where["pay.orderId"] = $scope.filterOrderId?$scope.filterOrderId:"";
      $scope.orderFilter.where["trade_no"] = $scope.filterTradeNo?$scope.filterTradeNo:"";

      if(!$scope.payTypes.length) { return; }
      const oldTabSwitchTime = tabSwitchTime;
      $scope.isOrderLoading = true;
      const params = {
        start: $scope.orderFilter.start,
        end: $scope.orderFilter.end,
        page: $scope.currentPage,
        pageSize: getPageSize(),
        search,
        where: $scope.orderFilter.where,
        // sort: $scope.userSort.sort,
        group: $scope.orderFilter.group,
        filter: $scope.selectStatus,
      };

      console.log(params);

      adminApi.getOrder($scope.myPayType, params).then(success => {
        $scope.setFabNumber(success.total);
        if(oldTabSwitchTime !== tabSwitchTime) { return; }
        if(!search && $scope.menuSearch.text) { return; }
        if(search && search !== $scope.menuSearch.text) { return; }
        //$scope.orders = [];
        success.orders.forEach(f => {
          $scope.orders.push(f);
        });

        if($scope.filterPhone != "" && success.orders.length > 0){
          $scope.expireGroup = {};
          $scope.expire = 0;
          let count = $scope.orders.filter(o=> o.status == "TRADE_SUCCESS" || o.status == "FINISH").map(o=>{
            if(!$scope.expireGroup[o.sku]) $scope.expireGroup[o.sku] = 0;
            if(o.orderActiveTime) $scope.expire = o.orderActiveTime;
            $scope.expireGroup[o.sku] +=  o.cycle;
          })

          console.log("$scope.expireGroup",$scope.expireGroup);

          Object.keys($scope.expireGroup).map(o=>{
            
            if(o.indexOf("monthly")){

              var dt = new Date();
              var newDt = dt.setMonth( dt.getMonth()+ $scope.expireGroup[o] );//.getTime();
              console.log(newDt - new Date().getTime());
              $scope.expire += (newDt - new Date().getTime());
            }
          })

          console.log("$scope.expire",$scope.expire);
        }
        if(success.maxPage > $scope.currentPage) {
          $scope.currentPage++;
        } else {
          $scope.isOrderPageFinish = true;
        }
        $scope.isOrderLoading = false;
      }).catch(() => {
        if($state.current.name !== 'admin.pay') { return; }
        $timeout(() => {
          $scope.getOrders(search);
        }, 5000);
      });
    };
    $scope.$on('cancelSearch', () => {
      $scope.orders = [];
      $scope.currentPage = 1;
      $scope.isOrderPageFinish = false;
      $scope.getOrders();
    });
    let timeoutPromise;
    const orderFilter = () => {
      $scope.orders = [];
      $scope.currentPage = 1;
      $scope.isOrderPageFinish = false;
      $scope.getOrders($scope.menuSearch.text);
    };
    $scope.$watch('menuSearch.text', () => {
      if(!$scope.menuSearch.text) { return; }
      timeoutPromise && $timeout.cancel(timeoutPromise);
      timeoutPromise = $timeout(() => {
        orderFilter();
      }, 500);
    });
    $scope.view = (inview) => {
      if(!inview || $scope.isOrderLoading || $scope.isOrderPageFinish) { return; }
      $scope.getOrders();
    };
    $scope.setMenuRightButton('sort_by_alpha');
    $scope.orderFilterDialog = () => {
      orderFilterDialog.show($scope.id).then(() => {
        $scope.orders = [];
        $scope.currentPage = 1;
        $scope.isOrderPageFinish = false;
        $scope.getOrders();
      });
    };
    $scope.$on('RightButtonClick', () => {
      $scope.orderFilterDialog();
    });
    $scope.setFabButton(() => {
      adminApi.getCsvOrder($scope.myPayType, {
        start: $scope.orderFilter.start,
        end: $scope.orderFilter.end,
        group: $scope.orderFilter.group,
        filter: Object.keys($scope.orderFilter.filter).filter(f => $scope.orderFilter.filter[f]),
      });
    }, 'get_app');
  }
])
.controller('AdminAnalysisController', ['$scope', 'adminApi', 'orderDialog', '$mdMedia', '$localStorage', 'orderFilterDialog', '$timeout', '$state',
  ($scope, adminApi, orderDialog, $mdMedia, $localStorage, orderFilterDialog, $timeout, $state) => {
    $scope.setTitle('统计管理');
    
    const getPageSize = () => {
      if($mdMedia('xs')) { return 30; }
      if($mdMedia('sm')) { return 30; }
      if($mdMedia('md')) { return 40; }
      if($mdMedia('gt-md')) { return 50; }
    };

    $scope.orderFilter = {
      start:new Date(new Date().setMonth(new Date().getMonth() -1)),
      end: new Date(Date.now()),
    }


    $scope.totalPay = 0;
    $scope.totalFinish = 0;
    $scope.PaidUsers = 0;
    $scope.PaidTimes = 0;

    adminApi.getReport().then(success=>{
      console.log(success);
      $scope.totalPay = success.totalPay;
      $scope.totalFinish = success.totalFinish;
      $scope.PaidUsers = success.PaidUsers;
      $scope.PaidTimes = success.PaidTimes;
    })
  
  }
]).controller('AdminTapController', ['$scope', '$http', 'orderDialog', '$mdMedia', '$localStorage', 'orderFilterDialog', '$timeout', '$state',
  ($scope, $http, orderDialog, $mdMedia, $localStorage, orderFilterDialog, $timeout, $state) => {
    $scope.setTitle('Tap查询');
    
    const getPageSize = () => {
      if($mdMedia('xs')) { return 30; }
      if($mdMedia('sm')) { return 30; }
      if($mdMedia('md')) { return 40; }
      if($mdMedia('gt-md')) { return 50; }
    };

    $scope.taptap = $localStorage.taptap?$localStorage.taptap:{list:[],page:0,totalCount:0};


    $scope.statusGroup = ["试玩","下载","敬请期待","预约","暂不售卖","停止研发","关闭注册","已停服","暂不开放","下架"];
    $scope.selectStatus = [];

    $scope.filterGameType = "";
    $scope.filterGameName = "";
    $scope.filterTapId = "";
    $scope.sortByUpdateTime = false;

    $scope.filter = [];
    $scope.origin = $localStorage.taptap ? $localStorage.taptap.list : [];
    $scope.currentPage = $localStorage.taptap ? $localStorage.taptap.page : 0;
    $scope.totalCount = $localStorage.taptap ? $localStorage.taptap.totalCount : 0;
    $scope.page = 1;
    $scope.size = 30;
    $scope.totalPage = 0;
    $scope.isFinished = false;
    $scope.isPause = false;


    $scope.init = () =>{

    }


    $scope.setPage = (page) => {

      $scope.filter = angular.copy($scope.origin);

      if($scope.selectStatus.length > 0){

        $scope.filter = $scope.filter.filter(o=>{
          return $scope.selectStatus.indexOf(o.androidStatus) >=0 
        });

      }

      if($scope.filterGameType != ""){

        $scope.filter = $scope.filter.filter(o=>{
          return o.gameType == $scope.filterGameType;
        });

      }

      if($scope.filterGameName != ""){

        $scope.filter = $scope.filter.filter(o=>{
          return o.gameName.indexOf($scope.filterGameName) >= 0;
        });

      }

      if($scope.filterTapId != ""){

        $scope.filter = $scope.filter.filter(o=>{
          return o.tapId == $scope.filterTapId;
        });

      }

      if($scope.sortByUpdateTime == true){

        $scope.filter = $scope.filter.sort( (o1,o2)=>{
          let t1 = o1.updateTime.replace('年','-').replace('月','-').replace('日','');
          let t2 = o2.updateTime.replace('年','-').replace('月','-').replace('日','');

          o1.sortTime = new Date(t1).getTime();
          o2.sortTime = new Date(t2).getTime();

          console.log(o1.sortTime,o2.sortTime);

          return o2.sortTime - o1.sortTime;
        });

      }


      $scope.totalCount = $scope.filter.length;
      $scope.totalPage = parseInt($scope.filter.length / $scope.size);
      console.log("$scope.filter",$scope.filter.length);

      $scope.page = page;
      $scope.games = $scope.filter.slice( (page-1)*$scope.size, page*$scope.size);
      
    }

    $scope.sortByUpdateTimeDesc = ()=>{
      $scope.sortByUpdateTime = true;
      $scope.setPage(1);
    }

    $scope.nextPage = ()=>{
      $scope.page = $scope.page+1;
      $scope.setPage($scope.page);
    }

    $scope.prevPage = ()=>{
      $scope.page = $scope.page-1;
      $scope.setPage($scope.page);
    }

    $scope.pause = () =>{
      $scope.isPause = !$scope.isPause;
      $scope.getAllGames($localStorage.taptap.page+1);
    }


    $scope.getAllGames = (page)=>{
        if($scope.isPause) {
          $localStorage.taptap.list = angular.copy($scope.origin);
          return;
        }

        if(page==0) {
          $localStorage.taptap = {list:[],page:0,totalCount:0};
          $scope.origin = [];
        } 

        $scope.isFinished = true;
        $http.post("/api/mingbo/taptap/filter",{
          page: page,
          size: 20,
          key: "androidStatus",
          filter:["下载","试玩","预约","敬请期待"]
        }).then(res => {
          try{

            const data = res.data;

            $scope.currentPage = page;
            $scope.size = data.limit;
            $scope.next = data.nextPageToken;
            $scope.totalPage = page;
            $localStorage.taptap.page = page;
            $localStorage.taptap.totalCount = data.totalCount;
            $scope.taptap = $localStorage.taptap;

          }catch(e){
            console.log(e);
          }
      })
    }

    
  }
]);



