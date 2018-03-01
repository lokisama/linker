const app = angular.module('app');
const window = require('window');
const cdn = window.cdn || '';

app.config(['$stateProvider', $stateProvider => {
  $stateProvider
    .state('admin.settings', {
      url: '/settings',
      controller: 'AdminSettingsController',
      templateUrl: `${ cdn }/public/views/admin/settings.html`,
    })
    .state('admin.notice', {
      url: '/notice',
      controller: 'AdminNoticeController',
      templateUrl: `${ cdn }/public/views/admin/notice.html`,
    })
    .state('admin.editNotice', {
      url: '/notice/{noticeId:int}',
      controller: 'AdminEditNoticeController',
      templateUrl: `${ cdn }/public/views/admin/editNotice.html`,
    })
    .state('admin.addNotice', {
      url: '/notice/new',
      controller: 'AdminNewNoticeController',
      templateUrl: `${ cdn }/public/views/admin/newNotice.html`,
    })
    .state('admin.paymentSetting', {
      url: '/settings/payment',
      controller: 'AdminPaymentSettingController',
      templateUrl: `${ cdn }/public/views/admin/paymentSetting.html`,
    })
    .state('admin.paymentList', {
      url: '/settings/paymentList',
      controller: 'AdminPaymentListController',
      templateUrl: `${ cdn }/public/views/admin/paymentList.html`,
    })
    .state('admin.editPayment', {
      url: '/settings/editPayment/:paymentType',
      controller: 'AdminEditPaymentController',
      templateUrl: `${ cdn }/public/views/admin/editPayment.html`,
    })
    .state('admin.baseSetting', {
      url: '/settings/base',
      controller: 'AdminBaseSettingController',
      templateUrl: `${ cdn }/public/views/admin/baseSetting.html`,
    })
    .state('admin.accountSetting', {
      url: '/settings/account',
      controller: 'AdminAccountSettingController',
      templateUrl: `${ cdn }/public/views/admin/accountSetting.html`,
    })
    .state('admin.mailSetting', {
      url: '/settings/mail',
      controller: 'AdminMailSettingController',
      templateUrl: `${ cdn }/public/views/admin/mailSetting.html`,
    })
    .state('admin.passwordSetting', {
      url: '/settings/password',
      controller: 'AdminPasswordSettingController',
      templateUrl: `${ cdn }/public/views/admin/changePassword.html`,
    })
    .state('admin.telegramSetting', {
      url: '/settings/telegram',
      controller: 'AdminTelegramSettingController',
      templateUrl: `${ cdn }/public/views/admin/telegramSetting.html`,
    })
    .state('admin.listGiftCardBatch', {
      url: '/settings/giftcard',
      controller: 'AdminGiftCardController',
      templateUrl: `${ cdn }/public/views/admin/giftcardBatchList.html`
    })
    .state('admin.giftcardBatchDetails', {
      url: '/settings/giftcard/batch/:batchNumber',
      controller: 'AdminGiftCardBatchDetailsController',
      templateUrl: `${ cdn }/public/views/admin/giftcardBatchDetails.html`
    });
  }
]);