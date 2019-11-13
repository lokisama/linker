const log4js = require('log4js');
const logger = log4js.getLogger('mingboPay');
const cron = appRequire('init/cron');
const config = appRequire('services/config').all();
const alipayf2f = require('alipay-ftof');
const fs = require('fs');
const ref = appRequire('plugins/webgui_ref/time');
const orderPlugin = appRequire('plugins/webgui_order');
const groupPlugin = appRequire('plugins/group');
const giftcardPlugin = appRequire('plugins/giftcard');

const path = require('path');
const Alipay = require('alipay-node-sdk');

let outTradeId = Date.now().toString();
let orderExpire = 10;
/**
 *
 * @param {Object} opts
 * @param {String} opts.appId  支付宝的appId
 * @param {String} opts.notifyUrl  支付宝服务器主动通知商户服务器里指定的页面http/https路径
 * @param {String} opts.rsaPrivate  商户私钥pem文件路径
 * @param {String} opts.rsaPublic  支付宝公钥pem文件路径
 * @param {String} opts.signType   签名方式, 'RSA' or 'RSA2'
 * @param {Boolean} [opts.sandbox] 是否是沙盒环境
 * @constructor
 */
var ali = new Alipay({
    appId: '2018062760440205',
    notifyUrl: 'http://cloud.mingbonetwork.com/api/system/alipay',
    rsaPrivate: path.resolve('./pem/app_private_key.pem'),
    rsaPublic: path.resolve('./pem/app_public_merchant.pem'),
    //rsaPrivate: 'MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCrXjKrrqomKe+09NefTk3JFKnQ+2H9sskTEwGCBv36aONX6IVzkSlAIVL8YGwIzqdIyVqzQbZVixGJTB251YFVaDW4Np7wVVdncONB15VaFddd8f6jVRlWP13O7ZtkTlwlIbkmGK6TNR6BJbJqXG4/wGwMyLLl4FsqQkMSWWFInymSytlKWkYAvt03iQ6+hEKFDP1R5MMauR6VeaBiRsiX3SkcMF+CDjg4YWpfLNowfupZ/L+3cZC4f8uXHuM8yCpNRrYEnU8+DQPYJJG+72XjqX9sh8qs510Icguuqw3oJJlum1gvx1OyusDA7C9MK/jYgUkYjQ2w7vATiWphrbwjAgMBAAECggEBAIwG0aKle1Tp6XvUoSgEBN1s7AHel0iFQXY7jnzgF8H42OOpFPrEv48ua6/bXguoSNrZ5SoaZNHra+3ja1rBEghmuZaH00GQinX0sU3IybotpKiYJ7jwvV5TMuT2FIZW3UZeEvsFKgkRW5at5eaxFkkzg1bC3COoOvYB5OpmbG64f3BN+5DLoepMeFRd4INBNrTEnyRUr+3YQy0mj9Bqnp1Oe3uUvahsnQF2Kh9nbUeb2lNldOELfU5ycuGmUBrwGUsUX5PFQuL6aQYY/OC7Rtd47zHPfVKxQb4D7YZsR5Q5Lb6n2g8FuNHmrci3HIRwZ1I/SFKjTrbB+nzz9WjtrYECgYEA529EheonFy4sak/LBgDER3M3ill3jJ1a164UJAcxxGRwASmfPVi3XmwAeocOkENHRTdrh3V4gxvFjlaslYRp2A82C5xLoul8gGHYENrs8rZ+JQDExOuRpD0QbWlQ1pDxk9mZGIdZjHF2x041Dc4cg6/IKuK89BDI8FnKyW8byGMCgYEAvY6/w45JpdaDneRmV2dOPlc+s5pVQugp2qDsd8RBbVCMda7Jv2VRmsH3R86qJy/Hv5p4+Mer/XCr8uVB+pJqR+umq2Q/MEtrArTtkCWEELunJUSVGbe5Kdx+BXX8OhnxegapfZ0ZoM1vyMkeUQvNYgPPYMYtBr9C5o1FBVfYKUECgYAwmiJWySSqbozvSpCFUzXlF2IrkLxVcFo6fxlFs6kU6E7JP7dsR6xCjQXQtXoue6KE+61+RgIn7nYffT5DLAqaUB92cr1DmisGPwYEDCXEluSI2s9310y/o/9GKt7KIKhK92B6UTpSDyX1lwv3OTitwwWTVAiAbOH177Vxdf7spwKBgF0J/reWVDGwu4M5Ar5ttyrEGcN/wc+IMlrb15TlYBOukHKGqwFlUot6HsxA9KUtP4ac5Dl/j7xinBMpUZwSV1YbpP/EwXsL2WdHtL6mm063PE//fItV8O1KCxTVF0rRRwPU10YPYO/bRb2wcU/oUhOEuTnPq3P/Vm/g8PqxZijBAoGANCk62iB7scO/0QUSroylB793lYHowbYwptzF7h0+D8YKby+9xVEElHRpRizUX3JkjHXy7JcL9aYTjIYjJoKKjvNK5HknY5aVcamvHHm0auWp9gI6gH95SZakYkioHlZ9LJhKr7LsCnrnr4cr1K2F+RKSbn9A+3+6WE1BJYmnkSY=',
    //rsaPublic: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAgj3b0d33rhyV6ycMTwd1O4/uVO0zwvU56cpZrBu7/4jrKDU4IL2c5q/dntwKhriMFsAUkxcPGzfF5Ys18BIJfl4kWd2VgLfKfp1VzIuX5ECwlRG46ACkREQHMo8DWnxBAbrQPvkXqxa/3a4klZZEQIZOE+OKy3rp0V1BetMkPwzm2w48LXpChR+OsTjn0tpHj0Ixb2EYpdt694+DrITQPzSUya6SFmzWUCCpykx6jXvIEjABBfbV9KXEf1ICgJq/ph7NJLS7Zg5MzPpBWK3uwrz88JxKqcGT9BWt7MiVKVnEXwgwiPjprNlJkGttbWMGagJnmSNr/dM70vmr184TPwIDAQAB',

    sandbox: false,
    signType: 'RSA'
});


// let alipay_f2f;
// if(config.plugins.alipay && config.plugins.alipay.use) {
//   try {
//     const privateKey = fs.readFileSync(config.plugins.alipay.merchantPrivateKey, 'utf8').toString();
//     config.plugins.alipay.merchantPrivateKey = privateKey
//     .replace(/-----BEGIN RSA PRIVATE KEY-----/, '')
//     .replace(/-----END RSA PRIVATE KEY-----/, '')
//     .replace(/\n/g, '');
//   } catch (err) {}
//   try {
//     const publicKey = fs.readFileSync(config.plugins.alipay.alipayPublicKey, 'utf8').toString();
//     config.plugins.alipay.alipayPublicKey = publicKey
//     .replace(/-----BEGIN PUBLIC KEY-----/, '')
//     .replace(/-----END PUBLIC KEY-----/, '')
//     .replace(/\n/g, '');
//   } catch (err) {}
//   alipay_f2f = new alipayf2f({
//     appid: config.plugins.alipay.appid,
//     notifyUrl: config.plugins.alipay.notifyUrl,
//     merchantPrivateKey: '-----BEGIN RSA PRIVATE KEY-----\n' + config.plugins.alipay.merchantPrivateKey + '\n-----END RSA PRIVATE KEY-----',
//     alipayPublicKey: '-----BEGIN PUBLIC KEY-----\n' + config.plugins.alipay.alipayPublicKey + '\n-----END PUBLIC KEY-----',
//     gatewayUrl: config.plugins.alipay.gatewayUrl,
//   });
// }

const isTelegram = config.plugins.webgui_telegram && config.plugins.webgui_telegram.use;
let telegram;
if(isTelegram) {
  telegram = appRequire('plugins/webgui_telegram/admin');
}

const knex = appRequire('init/knex').knex;
const account = appRequire('plugins/account/index');
const moment = require('moment');
const push = appRequire('plugins/webgui/server/push');

const createOrder = async (user, account, orderId) => {
  const oldOrder = await knex('paymingbo').where({
    user,
    account: account ? account : null,
    orderType: orderId
  }).where('expireTime', '>', Date.now() + 15 * 60 * 1000).where({
    status: 'CREATE',
  }).then(success => {
    return success[0];
  });
  if(oldOrder) {
    return {
      orderId: oldOrder.orderId,
      qrCode: oldOrder.qrcode,
    };
  }
  const orderInfo = await orderPlugin.getOneOrder(orderId);
  if(+orderInfo.alipay <= 0) { return Promise.reject('amount error'); }
  const userInfo = await knex('user').where({ id: user }).then(s => s[0]);
  const groupInfo = await groupPlugin.getOneGroup(userInfo.group);
  if(groupInfo.order) {
    if(JSON.parse(groupInfo.order).indexOf(orderInfo.id) < 0) {
      return Promise.reject('invalid order');
    }
  }
  const myOrderId = moment().format('YYYYMMDDHHmmss') + Math.random().toString().substr(2, 6);
  const time = 60;
  // const qrCode = await alipay_f2f.createQRPay({
  //   tradeNo: myOrderId,
  //   subject: orderInfo.name || 'ss续费',
  //   totalAmount: +orderInfo.alipay,
  //   body: orderInfo.name || 'ss续费',
  //   timeExpress: 10,
  // });
  await knex('paymingbo').insert({
    orderId: myOrderId,
    orderType: orderId,
    //qrcode: qrCode.qr_code,
    amount: orderInfo.alipay + '',
    user,
    account: account ? account : null,
    status: 'CREATE',
    createTime: Date.now(),
    expireTime: Date.now() + time * 60 * 1000,
  });
  logger.info(`创建订单: [${ myOrderId }][${ orderInfo.alipay }][account: ${ account }]`);
  return {
    orderId: myOrderId,
    //qrCode: qrCode.qr_code,
  };
};

const createOrderForMingboUser = async (user, account, sku, limit, card ) => {
  const productInfo = await orderPlugin.getOneBySku(sku);
  if(+productInfo.alipay <= 0) { return Promise.reject('amount error'); }

  const oldOrder = await knex('paymingbo')
  .where('expireTime', '>', Date.now() - orderExpire * 600 * 1000)
  .where({
    user: user.id,
    sku: sku,
    giftcard: card ? card.password : '',
    status: 'CREATE',
  })
  .then(success => {
    return success[0];
  });
  
  if(oldOrder) {
    return {
      orderId:oldOrder.orderId,
      amount:oldOrder.amount,
      totalAmount:oldOrder.totalAmount,
      sku: oldOrder.sku,
      plan: productInfo.name,
      user: user.username,
      gitcard: oldOrder.giftcard,
      alipayParams: oldOrder.alipayParams
    };
  }
  
  
  const groupInfo = await groupPlugin.getOneGroup(user.group);
  if(groupInfo.order) {
    if(JSON.parse(groupInfo.order).indexOf(productInfo.id) < 0) {
      return Promise.reject('invalid order');
    }
  }

  const result = await createAppOrder(user,account,sku,limit,card);

  return {
    orderId:result.orderId,
    amount:result.amount,
    totalAmount:result.totalAmount,
    sku: result.sku,
    plan: result.plan,
    user: result.user,
    gitcard: result.gitcard,
    alipayParams: result.alipayParams
  };
};

const sendSuccessMail = async userId => {
  const emailPlugin = appRequire('plugins/email/index');
  const user = await knex('user').select().where({
    type: 'normal',
    id: userId,
  }).then(success => {
    if(success.length) {
      return success[0];
    }
    return Promise.reject('user not found');
  });
  const orderMail = await knex('webguiSetting').select().where({
    key: 'mail',
  }).then(success => {
    if(!success.length) {
      return Promise.reject('settings not found');
    }
    success[0].value = JSON.parse(success[0].value);
    return success[0].value.order;
  });
  await emailPlugin.sendMail(user.email, orderMail.title, orderMail.content);
};

cron.minute(async () => {
  logger.info('check alipay order');
 //if(!alipay_f2f) { return; }
  const orders = await knex('paymingbo').select().whereNotBetween('expireTime', [0, Date.now()]);
  const scanOrder = order => {
    logger.info(`order: [${ order.orderId }]`);
    // if(order.status !== 'TRADE_SUCCESS' && order.status !== 'FINISH') {
    //   return alipay_f2f.checkInvoiceStatus(order.orderId).then(success => {
    //     if(success.code === '10000') {
    //       return knex('paymingbo').update({
    //         status: success.trade_status
    //       }).where({
    //         orderId: order.orderId,
    //       });
    //     }
    //   });
    // } else if(order.status === 'TRADE_SUCCESS') {
    //   const accountId = order.account;
    //   const userId = order.user;
    //   push.pushMessage('支付成功', {
    //     body: `订单[ ${ order.orderId } ][ ${ order.amount } ]支付成功`,
    //   });
    //   isTelegram && telegram.push(`订单[ ${ order.orderId } ][ ${ order.amount } ]支付成功`);
    //   return account.setAccountLimit(userId, accountId, order.orderType)
    //   .then(() => {
    //     return knex('paymingbo').update({
    //       status: 'FINISH',
    //     }).where({
    //       orderId: order.orderId,
    //     });
    //   }).then(() => {
    //     logger.info(`订单支付成功: [${ order.orderId }][${ order.amount }][account: ${ accountId }]`);
    //     ref.payWithRef(userId, order.orderType);
    //     sendSuccessMail(userId);
    //   }).catch(err => {
    //     logger.error(`订单支付失败: [${ order.orderId }]`, err);
    //   });
    // };
  };
  // for(const order of orders) {
  //   await scanOrder(order);
  // }
}, 'CheckPayMingboOrder', 1);

const checkOrder = async (orderId) => {
  const order = await knex('paymingbo').select().where({
    orderId,
  }).then(success => {
    if(success.length) {
      return success[0];
    }
    return Promise.reject('order not found');
  });
  return order.status;
};

//options = {user,card,server}
const createAppOrder = async (user, account, sku, limit, card ) =>{

    /**
   * 生成支付参数供客户端使用
   * @param {Object} opts
   * @param {String} opts.subject              商品的标题/交易标题/订单标题/订单关键字等
   * @param {String} [opts.body]               对一笔交易的具体描述信息。如果是多种商品，请将商品描述字符串累加传给body
   * @param {String} opts.outTradeId           商户网站唯一订单号
   * @param {String} [opts.timeout]            设置未付款支付宝交易的超时时间，一旦超时，该笔交易就会自动被关闭。
                                                当用户进入支付宝收银台页面（不包括登录页面），会触发即刻创建支付宝交易，此时开始计时。
                                                取值范围：1m～15d。m-分钟，h-小时，d-天，1c-当天（1c-当天的情况下，无论交易何时创建，都在0点关闭）。
                                                该参数数值不接受小数点， 如 1.5h，可转换为 90m。
   * @param {String} opts.amount               订单总金额，单位为元，精确到小数点后两位，取值范围[0.01,100000000]
   * @param {String} [opts.sellerId]           收款支付宝用户ID。 如果该值为空，则默认为商户签约账号对应的支付宝用户ID
   * @param {String} opts.goodsType            商品主类型：0—虚拟类商品，1—实物类商品 注：虚拟类商品不支持使用花呗渠道
   * @param {String} [opts.passbackParams]     公用回传参数，如果请求时传递了该参数，则返回给商户时会回传该参数。支付宝会在异步通知时将该参数原样返回。本参数必须进行UrlEncode之后才可以发送给支付宝
   * @param {String} [opts.promoParams]        优惠参数(仅与支付宝协商后可用)
   * @param {String} [opts.extendParams]       业务扩展参数 https://doc.open.alipay.com/docs/doc.htm?spm=a219a.7629140.0.0.3oJPAi&treeId=193&articleId=105465&docType=1#kzcs
   * @param {String} [opts.enablePayChannels]  可用渠道，用户只能在指定渠道范围内支付。当有多个渠道时用“,”分隔。注：与disable_pay_channels互斥
   * @param {String} [opts.disablePayChannels] 禁用渠道，用户不可用指定渠道支付。当有多个渠道时用“,”分隔。 注：与enable_pay_channels互斥
   * @param {String} [opts.storeId]            商户门店编号
   */
  let product = await orderPlugin.getOneBySku(sku);
  
  let totalAmount = 0;
  if(card){
    if(card.cutPrice === 0){
      totalAmount = 0;
    }else{
      totalAmount = product.amount* card.cutPrice/100;
    }
  }else{
    totalAmount = product.amount;
  }
  
  let myOrderId = moment().format('YYYYMMDDHHmmss') + Math.random().toString().substr(2, 6);
  
  let appPayParams = {
    subject: product.name,
    body: product.comment,
    outTradeId: myOrderId,
    timeout: orderExpire+'m',
    amount: totalAmount.toFixed(2).toString(),
    goodsType: '0'
}
  let returnToApp = '';
  if(totalAmount > 0){
    returnToApp = ali.appPay(appPayParams);
  }

  let order = await knex('paymingbo').insert({
    orderId: myOrderId,
    orderType: product.id,
    amount: product.amount.toFixed(2),
    sku: sku,
    limit: limit,
    giftcard: card && card.password ? card.password : '',
    totalAmount: totalAmount.toFixed(2),
    alipayParams : returnToApp,
    user: user.id,
    account: account ? account : null,
    status: 'CREATE',
    createTime: Date.now(),
    expireTime: Date.now() + orderExpire * 60 * 1000,
  });
  logger.info(`创建订单: [orderId: ${ myOrderId }][amount: ${ totalAmount }][account: ${ account }]`);

  if(card){
    await knex('giftcard').update({orderId: myOrderId}).where({password:card.password});
  }
  
  return {
    orderId:myOrderId,
    amount: product.amount.toFixed(2).toString(),
    totalAmount:totalAmount.toFixed(2).toString(),
    sku: sku,
    limit: limit,
    plan: card ? ( product.isShow === 1 ?card.comment+'_'+product.name: card.comment) : ( product.isShow === 1 ? product.name: '内部套餐'),
    user: user.username,
    gitcard:card ? card.password : '',
    alipayParams : returnToApp
  };
};

const getNotifyFromMingbo = async (response) => {
  /**
 * 签名校验
 * @param {Object} response 解析后的支付宝响应报文、支付宝支付结果通知报文
 * returns {boolean}
 */
 
  let ok = true;//ali.signVerify(response);
  await knex('paymingbo').update({
    status: data.trade_status,
    alipayData: JSON.stringify(data),
  }).where({
     orderId: data.out_trade_no
  }).andWhereNot({
    status: 'FINISH',
  }).then();

  return ok;
};

const verifyCallback = (data) => {
  // const signStatus = alipay_f2f.verifyCallback(data);
  // if(signStatus) {
  //   knex('paymingbo').update({
  //     status: data.trade_status,
  //     alipayData: JSON.stringify(data),
  //   }).where({
  //     orderId: data.out_trade_no,
  //   }).andWhereNot({
  //     status: 'FINISH',
  //   }).then();
  // }
  return signStatus;
};

const orderList = async (options = {}) => {
  const where = {};
  if(options.userId) {
    where['user.id'] = options.userId;
  }
  const orders = await knex('paymingbo').select([
    'alipay.orderId',
    'alipay.orderType',
    'user.id as userId',
    'user.username',
    'account_plugin.port',
    'alipay.amount',
    'alipay.status',
    'alipay.alipayData',
    'alipay.createTime',
    'alipay.expireTime',
  ])
  .leftJoin('user', 'user.id', 'alipay.user')
  .leftJoin('account_plugin', 'account_plugin.id', 'alipay.account')
  .where(where)
  .orderBy('alipay.createTime', 'DESC');
  orders.forEach(f => {
    f.alipayData = JSON.parse(f.alipayData);
  });
  return orders;
};

const orderListAndPaging = async (options = {}) => {
  const search = options.search || '';
  const group = options.group;
  const filter = options.filter || [];
  const sort = options.sort || 'alipay.createTime_desc';
  const page = options.page || 1;
  const pageSize = options.pageSize || 20;
  const start = options.start ? moment(options.start).hour(0).minute(0).second(0).millisecond(0).toDate().getTime() : moment(0).toDate().getTime();
  const end = options.end ? moment(options.end).hour(23).minute(59).second(59).millisecond(999).toDate().getTime() : moment().toDate().getTime();

  let count = knex('paymingbo').select().whereBetween('alipay.createTime', [start, end]);
  let orders = knex('paymingbo').select([
    'alipay.orderId',
    'alipay.orderType',
    'webgui_order.name as orderName',
    'user.id as userId',
    'user.group as group',
    'user.username',
    'account_plugin.port',
    'alipay.amount',
    'alipay.status',
    'alipay.alipayData',
    'alipay.createTime',
    'alipay.expireTime',
  ])
  .leftJoin('user', 'user.id', 'alipay.user')
  .leftJoin('account_plugin', 'account_plugin.id', 'alipay.account')
  .leftJoin('webgui_order', 'webgui_order.id', 'alipay.orderType')
  .whereBetween('alipay.createTime', [start, end]);

  if(filter.length) {
    count = count.whereIn('alipay.status', filter);
    orders = orders.whereIn('alipay.status', filter);
  }
  if(group >= 0) {
    count = count.leftJoin('user', 'user.id', 'alipay.user').where({ 'user.group': group });
    orders = orders.where({ 'user.group': group });
  }
  if(search) {
    count = count.where('alipay.orderId', 'like', `%${ search }%`);
    orders = orders.where('alipay.orderId', 'like', `%${ search }%`);
  }

  count = await count.count('orderId as count').then(success => success[0].count);
  orders = await orders.orderBy(sort.split('_')[0], sort.split('_')[1]).limit(pageSize).offset((page - 1) * pageSize);
  orders.forEach(f => {
    f.alipayData = JSON.parse(f.alipayData);
  });
  const maxPage = Math.ceil(count / pageSize);
  return {
    total: count,
    page,
    maxPage,
    pageSize,
    orders,
  };
};

const getCsvOrder = async (options = {}) => {
  const search = options.search || '';
  const group = options.group;
  const filter = options.filter || [];
  const sort = options.sort || 'alipay.createTime_desc';
  const start = options.start ? moment(options.start).hour(0).minute(0).second(0).millisecond(0).toDate().getTime() : moment(0).toDate().getTime();
  const end = options.end ? moment(options.end).hour(23).minute(59).second(59).millisecond(999).toDate().getTime() : moment().toDate().getTime();

  let orders = knex('paymingbo').select([
    'alipay.orderId',
    'alipay.orderType',
    'user.id as userId',
    'user.group as group',
    'user.username',
    'account_plugin.port',
    'alipay.amount',
    'alipay.status',
    'alipay.alipayData',
    'alipay.createTime',
    'alipay.expireTime',
  ])
  .leftJoin('user', 'user.id', 'alipay.user')
  .leftJoin('account_plugin', 'account_plugin.id', 'alipay.account')
  .whereBetween('alipay.createTime', [start, end]);

  if(filter.length) {
    orders = orders.whereIn('alipay.status', filter);
  }
  if(group >= 0) {
    orders = orders.where({ 'user.group': group });
  }
  if(search) {
    orders = orders.where('alipay.orderId', 'like', `%${ search }%`);
  }

  orders = await orders.orderBy(sort.split('_')[0], sort.split('_')[1]);
  orders.forEach(f => {
    f.alipayData = JSON.parse(f.alipayData);
  });
  return orders;
};

const getUserFinishOrder = async userId => {
  let orders = await knex('paymingbo').select([
    'orderId',
    'amount',
    'createTime',
  ]).where({
    user: userId,
    status: 'FINISH',
  }).orderBy('createTime', 'DESC');
  orders = orders.map(order => {
    return {
      orderId: order.orderId,
      type: '支付宝',
      amount: order.amount,
      createTime: order.createTime,
    };
  });
  return orders;
};

const refund = async (orderId, amount) => {
  const order = await knex('paymingbo').where({ orderId }).then(s => s[0]);
  if(!order) { return Promise.reject('order not found'); }
  let refundAmount = order.amount;
  if(amount) { refundAmount = amount; }
  // const result = await alipay_f2f.refund(order.orderId, {
  //   refundNo: moment().format('YYYYMMDDHHmmss') + Math.random().toString().substr(2, 6),
  //   refundAmount,
  // });
  const result = {};
  return result;
};

// cron.minute(async () => {
//   if(!alipay_f2f) { return; }
//   await knex('paymingbo').delete().where({ status: 'CREATE' }).whereBetween('createTime', [0, Date.now() - 1 * 24 * 3600 * 1000]);
// }, 'DeleteAlipayOrder', 53);

exports.orderListAndPaging = orderListAndPaging;
exports.orderList = orderList;
exports.createOrder = createOrder;
exports.checkOrder = checkOrder;
exports.verifyCallback = verifyCallback;
exports.getCsvOrder = getCsvOrder;
exports.getUserFinishOrder = getUserFinishOrder;
exports.refund = refund;

exports.createOrderForMingboUser = createOrderForMingboUser;
exports.createAppOrder = createAppOrder;
exports.getNotifyFromMingbo = getNotifyFromMingbo;