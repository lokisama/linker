const log4js = require('log4js');
const logger = log4js.getLogger('mingboPay');
const cron = appRequire('init/cron');
const config = appRequire('services/config').all();
const fs = require('fs');
const ref = appRequire('plugins/webgui_ref/time');
const orderPlugin = appRequire('plugins/webgui_order');
const groupPlugin = appRequire('plugins/group');
const giftcardPlugin = appRequire('plugins/giftcard');

const path = require('path');

const ytdl = require('ytdl-core');
// TypeScript: import ytdl from 'ytdl-core'; with --esModuleInterop
// TypeScript: import * as ytdl from 'ytdl-core'; with --allowSyntheticDefaultImports
// TypeScript: import ytdl = require('ytdl-core'); with neither of the above


let outTradeId = Date.now().toString();
let orderExpire = 20;

//const Alipay = require('alipay-node-sdk');
// var ali = new Alipay({
//     appId: '2018062760440205',
//     notifyUrl: 'http://cloud.mingbonetwork.com/api/system/alipay',
//     rsaPrivate: path.resolve('./pem/app_private_key.pem'),
//     rsaPublic: path.resolve('./pem/app_public_merchant.pem'),
//     //rsaPrivate: 'MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCrXjKrrqomKe+09NefTk3JFKnQ+2H9sskTEwGCBv36aONX6IVzkSlAIVL8YGwIzqdIyVqzQbZVixGJTB251YFVaDW4Np7wVVdncONB15VaFddd8f6jVRlWP13O7ZtkTlwlIbkmGK6TNR6BJbJqXG4/wGwMyLLl4FsqQkMSWWFInymSytlKWkYAvt03iQ6+hEKFDP1R5MMauR6VeaBiRsiX3SkcMF+CDjg4YWpfLNowfupZ/L+3cZC4f8uXHuM8yCpNRrYEnU8+DQPYJJG+72XjqX9sh8qs510Icguuqw3oJJlum1gvx1OyusDA7C9MK/jYgUkYjQ2w7vATiWphrbwjAgMBAAECggEBAIwG0aKle1Tp6XvUoSgEBN1s7AHel0iFQXY7jnzgF8H42OOpFPrEv48ua6/bXguoSNrZ5SoaZNHra+3ja1rBEghmuZaH00GQinX0sU3IybotpKiYJ7jwvV5TMuT2FIZW3UZeEvsFKgkRW5at5eaxFkkzg1bC3COoOvYB5OpmbG64f3BN+5DLoepMeFRd4INBNrTEnyRUr+3YQy0mj9Bqnp1Oe3uUvahsnQF2Kh9nbUeb2lNldOELfU5ycuGmUBrwGUsUX5PFQuL6aQYY/OC7Rtd47zHPfVKxQb4D7YZsR5Q5Lb6n2g8FuNHmrci3HIRwZ1I/SFKjTrbB+nzz9WjtrYECgYEA529EheonFy4sak/LBgDER3M3ill3jJ1a164UJAcxxGRwASmfPVi3XmwAeocOkENHRTdrh3V4gxvFjlaslYRp2A82C5xLoul8gGHYENrs8rZ+JQDExOuRpD0QbWlQ1pDxk9mZGIdZjHF2x041Dc4cg6/IKuK89BDI8FnKyW8byGMCgYEAvY6/w45JpdaDneRmV2dOPlc+s5pVQugp2qDsd8RBbVCMda7Jv2VRmsH3R86qJy/Hv5p4+Mer/XCr8uVB+pJqR+umq2Q/MEtrArTtkCWEELunJUSVGbe5Kdx+BXX8OhnxegapfZ0ZoM1vyMkeUQvNYgPPYMYtBr9C5o1FBVfYKUECgYAwmiJWySSqbozvSpCFUzXlF2IrkLxVcFo6fxlFs6kU6E7JP7dsR6xCjQXQtXoue6KE+61+RgIn7nYffT5DLAqaUB92cr1DmisGPwYEDCXEluSI2s9310y/o/9GKt7KIKhK92B6UTpSDyX1lwv3OTitwwWTVAiAbOH177Vxdf7spwKBgF0J/reWVDGwu4M5Ar5ttyrEGcN/wc+IMlrb15TlYBOukHKGqwFlUot6HsxA9KUtP4ac5Dl/j7xinBMpUZwSV1YbpP/EwXsL2WdHtL6mm063PE//fItV8O1KCxTVF0rRRwPU10YPYO/bRb2wcU/oUhOEuTnPq3P/Vm/g8PqxZijBAoGANCk62iB7scO/0QUSroylB793lYHowbYwptzF7h0+D8YKby+9xVEElHRpRizUX3JkjHXy7JcL9aYTjIYjJoKKjvNK5HknY5aVcamvHHm0auWp9gI6gH95SZakYkioHlZ9LJhKr7LsCnrnr4cr1K2F+RKSbn9A+3+6WE1BJYmnkSY=',
//     //rsaPublic: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAgj3b0d33rhyV6ycMTwd1O4/uVO0zwvU56cpZrBu7/4jrKDU4IL2c5q/dntwKhriMFsAUkxcPGzfF5Ys18BIJfl4kWd2VgLfKfp1VzIuX5ECwlRG46ACkREQHMo8DWnxBAbrQPvkXqxa/3a4klZZEQIZOE+OKy3rp0V1BetMkPwzm2w48LXpChR+OsTjn0tpHj0Ixb2EYpdt694+DrITQPzSUya6SFmzWUCCpykx6jXvIEjABBfbV9KXEf1ICgJq/ph7NJLS7Zg5MzPpBWK3uwrz88JxKqcGT9BWt7MiVKVnEXwgwiPjprNlJkGttbWMGagJnmSNr/dM70vmr184TPwIDAQAB',

//     sandbox: false,
//     signType: 'RSA'
// });


// const alipayf2f = require('alipay-ftof');
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

const cnPay = require('cn-pay');
const aliConfig = {
  app_id: '2018122462654664', // mingbo 2018122462654664
  // 商户私钥 注意：此处不是文件路径，一定要是文件内容
  private_key: `-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEArb3jWTHhghX22KyL7DrQnlWludqzoyBgdr0SNOGEkV7VD7fA
+6kKAB1z2cD/Dm3ChcGU7gAB1bYlNdnZpALIZ+6nZA6+2/7PaatwuoFAJMLfwLpc
TqhHifCVQ9xzxnQ+p03pVQYd/LueOO0lFqp4uR4SidSdcM1qUjpdMl7hqOdjet9+
FHL/dSpC44tvSW1jXDoAx9IxssLxkw+S8yDaPTb6xzAknOnxbdQbEV8s30RC6pKk
J4wGGjWkg70H5kJsB6BokmBd1NuRjZJSHll4HvBA98t6mRkf2GJANI6Oe3VHoNNq
8nv4+aVBJ7Jki48eXqAZcxAy4icCIzAUJqsZjwIDAQABAoIBAAuckUE40DV9ek3o
2kEjfSXX24ecUj0owMmuwTS/jbiZeevfAArRtVVkooV/HIy+US3XTjjJz1WVIs+C
i8UmWnZ3wMAzLBZP5VTOnG4ajUrnq0SaL+kh3gYeChvK9AHjavyLfHiuO/rUHzL2
xm/JXOAiXmLPzuXnFKACPpBLPxGmqPv6QdHIdOl1FfADzsHnd4TgZKQzys6K2JfT
Bkb42ScyssHAy8eQHevDBRhMKQDai1vgGHb59mc2EC3xndl0pbTAy6rmiAUROICa
7aQPe+LNjezirCsH23YnCs/9tcwo5jY1a431APUXosQexRoe3RBPEhb7pzd+X3z3
oDRrzqECgYEA5FGoDKiaHQMllRje2Mk1MRfOi92FQvCi2BDSHTmijbD0XKm6yVet
UwTR/Jy2fuqwWVXuaxeXzcoDcjofh+mC/dD5TVvO3fnkeGBcCnJsOUHaLXgiUfjn
YV9lhUXyOEgmM/d2yOrFxmLF3oR0tPA8Y3SEGgLJo1qHcnDLhQfy0PsCgYEAws5R
Dg7mSW9Ub8XleHnG9XY43o2xwQhmSYNubtP2dbE1LWblBL9H/N5Q2yoBrW21GSHh
7G728d+3Qi9TZo70UOhrsvXp72WHuPtys0YpkQYmKkR6Gvdlf+7nofkZxwL9lExV
v/3cIpGxzfYliL7ceueHooEBsqXsTc5/2A9J/X0CgYAZGrllmuxHIF9zg2aNY6JL
oZh+XH8YmyjspPzVZc7v0XMs9SSqms9d/3uvUPPoBJobWI18jP2ODRZP6wAoi45x
phajYOLgGWf7rGyyYV5w9UKuGTV82ednF3wsKUK22YgJ0r3m3ZmddKLZEqtaccfS
D6+uxHuzUHLwLGLUX8ldHQKBgDCovFJYomkhZ+PreKAZOvtBJn9gwU/IO1SNgd4p
D9ziALhwhTAkX2ToWyYDXhvl1WCLuBUIuqI8EVh03c42UwyKoaw4BNEJeVdZZ5Mk
KWnSMWJJbH6j4TSNhkpNIIU3WAPc9WZZkM0Ju3II0+NOWWBRyO1sb/Ihw97Df+eG
GiM5AoGBALymjmbNQsl3ZUml2Li6faJkX8KDoLo/BTmj+SYEav1hIUG8qY9f+b8Q
vVW3Ch6r3CSqDsg/WbOSMKDkBgEJiCrlEUWB9lWM0F8R41DKiJ+ZVKEoxSFs0ja4
cynf7Ayl1SBej1oTMQnxejGVUQKGj7aK3jPkguYtITP/VkOmLcVJ
-----END RSA PRIVATE KEY-----
`,
  // 支付宝公钥 注意：此处不是文件路径，一定要是文件内容
  //public_key: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAgj3b0d33rhyV6ycMTwd1O4/uVO0zwvU56cpZrBu7/4jrKDU4IL2c5q/dntwKhriMFsAUkxcPGzfF5Ys18BIJfl4kWd2VgLfKfp1VzIuX5ECwlRG46ACkREQHMo8DWnxBAbrQPvkXqxa/3a4klZZEQIZOE+OKy3rp0V1BetMkPwzm2w48LXpChR+OsTjn0tpHj0Ixb2EYpdt694+DrITQPzSUya6SFmzWUCCpykx6jXvIEjABBfbV9KXEf1ICgJq/ph7NJLS7Zg5MzPpBWK3uwrz88JxKqcGT9BWt7MiVKVnEXwgwiPjprNlJkGttbWMGagJnmSNr/dM70vmr184TPwIDAQAB',
  public_key: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAgLPH+Aggi2TvvVDGg2HjD5c211zFmGiL4gEAv/lC20I8MSeIkSijAEPzhds246LtHadeJ4oj1fVmO7kpwPjJu5H/95rAhSTGOau3JUEJZdu5pL6giKF/o2h/Ul3VYgVItDMtIURNzLlabriQE/p8cpcNrkuvuQm7O/8gq4k9rJOYGFX2RS4eorgwNnzTLCTMMVCiwJlwaj3zFGDP+l9QS2L5iobvNEEjB5yv1bv+KAZCL6ydcbc9LkRoethTUQRnXpqcugBUzGbAECV/dHkzC4OXHw5CEt5CvaIBZ7LIXkY/KP8IeBuM9oO0vr4XP5pDXelhyOyFKaBpxBig2npufwIDAQAB',
  notify_url: 'http://cloud.mingbonetwork.com/api/system/alipay', // 通知地址
  return_url: '', // 跳转地址
  dev: false // 设置为true 将启用开发环境的支付宝网关
};
const alipay = cnPay.alipay(aliConfig);

const wxConfig = {
  app_id: '', // 公众号appid
  appid: 'wx2e9c3933aaea8a64', // app的appid
  miniapp_id: '', // 小程序的appid
  mch_id: '1521349171', // 商户Id
  key: '4F470C885784073025C9B042EC6A1606', // 商户密钥
  notify_url: 'http://cloud.mingbonetwork.com/api/system/wechat', // 通知地址
  return_url: 'http://cloud.mingbonetwork.com/api/system/wechat', // 跳转地址
  //pfx: fs.readFileSync('<location-of-your-apiclient-cert.p12>') // 可选, 退款等情况时需要用到
}
const wechat = cnPay.wechat(wxConfig)


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

const createOrderForMingboUser = async (user, account, sku, limit, card ,platform) => {
  const productInfo = await orderPlugin.getOneBySku(sku);
  if(+productInfo.amount <= 0) { return Promise.reject('amount error'); }

  console.log(Date.now() - orderExpire * 60 * 1000);
  const oldOrder = await knex('paymingbo')
  .where('expireTime', '<', Date.now() - orderExpire * 60 * 1000)
  .where({
    user: user.id,
    sku: sku,
    platform: platform,
    giftcard: card ? card.password : '',
    status: 'CREATE',
  })
  .then(success => {
    return success[0];
  });

  const method = "app";
  
  if(oldOrder) {
    return {
        orderId:oldOrder.orderId,
        amount:oldOrder.amount,
        totalAmount:oldOrder.totalAmount,
        sku: oldOrder.sku,
        plan: productInfo.name,
        user: user.username,
        gitcard: oldOrder.giftcard,
        method: method,
        platform: platform,
        payParams: oldOrder.payParams
      };
  }
  
  const groupInfo = await groupPlugin.getOneGroup(user.group);
  if(groupInfo.order) {
    if(JSON.parse(groupInfo.order).indexOf(productInfo.id) < 0) {
      return Promise.reject('invalid order');
    }
  }

  const result = await createAppOrder(user,account,sku,limit,card,platform);

  return {
    orderId:result.orderId,
    amount:result.amount,
    totalAmount:result.totalAmount,
    sku: result.sku,
    plan: result.plan,
    user: result.user,
    gitcard: result.gitcard,
    method: result.method,
    payParams:result.payParams
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
const createAppOrder = async (user, account, sku, limit, card, platform='alipay' ) =>{

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
  let payParams = '';
  let method = 'app';

  if(totalAmount > 0){
    console.log(totalAmount,platform);
    if(platform == 'alipay'){

      const config = {
        out_trade_no: myOrderId,
        total_amount: totalAmount.toFixed(2),
        subject: product.name,
        body: product.comment,
        timeout: orderExpire+'m',
      };
      payParams = await alipay.app(config);

    }else if(platform == 'wechat'){
      
      const config = {
        out_trade_no: myOrderId,
        body: product.name,//product.name,
        total_fee: 1,//totalAmount.toFixed(2), // 直接以元为单位 //totalAmount.toFixed(2),
        spbill_create_ip: '180.165.231.68' // 客户端ip
      };

      payParams = await wechat.app(config);
      payParams = JSON.stringify(payParams);
    }
  }

  logger.info(`创建订单: [orderId: ${ myOrderId }][amount: ${ totalAmount }][account: ${ account }]`);


  const insert = {
    orderId: myOrderId,
    orderType: product.id,
    method: method,
    platform: platform,
    amount: product.amount.toFixed(2),
    sku: sku,
    limit: limit,
    giftcard: card && card.password ? card.password : '',
    totalAmount: totalAmount.toFixed(2),
    payParams : payParams,
    user: user.id,
    account: account ? account : null,
    status: 'CREATE',
    createTime: Date.now(),
    expireTime: Date.now() + orderExpire * 60 * 1000,
  };
  console.log(insert);

  let order = await knex('paymingbo').insert(insert);

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
    method: method,
    platform: platform,
    payParams : payParams
  };
};

const wechatNotify = async (data) => {
  /**
 * 签名校验
 * @param {Object} response 解析后的支付宝响应报文、支付宝支付结果通知报文
 * returns {boolean}
 */

  /*let ok = wechat.verify(data,data.sign);

  if(!ok){
    return {"success":false,"error":"签名校验失败"};
  }*/

  let orderId = await knex('paymingbo').update({
    status: data.result_code,
    trade_no: data.transaction_id,
    //alipayData: JSON.stringify(data),
    payCallBack: JSON.stringify(data),
  }).where({
     orderId: data.out_trade_no
  }).andWhereNot({
    status: 'FINISH',
  }).then();


  let info = await orderListForMingbo({"orderId":data.out_trade_no}).then();
  
  return {"success": true, "data": info };
  
};

const alipayNotify = async (data) => {
  /**
 * 签名校验
 * @param {Object} response 解析后的支付宝响应报文、支付宝支付结果通知报文
 * returns {boolean}
 */
 /*console.log(data,data.sign);
  let ok = alipay.verify(data,data.sign);
  console.log(ok);*/

  if(0){
    return {"success":false,"error":"签名校验失败"};
  }
  let orderId = await knex('paymingbo').update({
    status: data.trade_status,
    trade_no: data.trade_no,

    //alipayData: JSON.stringify(data),
    payCallBack: JSON.stringify(data),
  }).where({
     orderId: data.out_trade_no
  }).andWhereNot({
    status: 'FINISH',
  }).then();

  let info = await orderListForMingbo({"orderId":data.out_trade_no}).then();
  
  return {"success": true, "data": info };
  
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

const orderListForMingbo = async (options = {}) => {
  const where = {};
  if(options.userId) {
    where['user.id'] = options.userId;
  }

  if(options.orderId) {
    where['paymingbo.orderId'] = options.orderId;
  }

  const orders = await knex('paymingbo').select([
    'paymingbo.orderId',
    'paymingbo.orderType',
    'user.id',
    'user.username as phone',
    'paymingbo.sku as sku',
    'paymingbo.limit as limit',
    'paymingbo.giftcard',
    'giftcard.mingboType as mingboType',
    'paymingbo.amount',
    'paymingbo.totalAmount',
    'paymingbo.method',
    'paymingbo.platform as platform',
    'paymingbo.trade_no as trade_no',
    'paymingbo.status as status',
    'paymingbo.platform as platform',
    //'paymingbo.payCallback as payCallbak',
    'paymingbo.createTime',
    'paymingbo.expireTime',
  ])
  .leftJoin('user', 'user.id', 'paymingbo.user')
  .leftJoin('account_plugin', 'account_plugin.id', 'paymingbo.account')
  .leftJoin('giftcard', 'giftcard.password', 'paymingbo.giftcard')
  .where(where)
  .orderBy('paymingbo.createTime', 'DESC');
  

  /*orders.forEach(f => {
    f.payCallback = JSON.parse(f.payCallback);
  });*/

  return orders;
};

const orderListAndPaging = async (options = {}) => {
  const search = options.search || '';
  const group = options.group;
  const filter = options.filter || [];
  const sort = options.sort || 'paymingbo.createTime_desc';
  const page = options.page || 1;
  const pageSize = options.pageSize || 20;
  const where = options.where || 
  {
    "totalAmount":[">",30]
  };
  const start = options.start ? moment(options.start).hour(0).minute(0).second(0).millisecond(0).toDate().getTime() : moment(0).toDate().getTime();
  const end = options.end ? moment(options.end).hour(23).minute(59).second(59).millisecond(999).toDate().getTime() : moment().toDate().getTime();
  const select  = [
    'paymingbo.orderId',
    'paymingbo.orderType',
    'webgui_order.name as orderName',
    'webgui_order.sku',
    'webgui_order.cycle',
    'webgui_order.shortComment as orderShortName',
    'giftcard.comment as comment',
    'giftcard.cutPrice',
    'giftcard.limit',
    'user.id as userId',
    'user.group as group',
    'user.username',
    'account_plugin.port',
    'paymingbo.amount',
    'paymingbo.totalAmount',
    'paymingbo.method',
    'paymingbo.platform as platform',
    'paymingbo.trade_no as trade_no',
    'paymingbo.status',
    'paymingbo.giftcard',
    'paymingbo.payCallback',
    'paymingbo.payParams',
    'paymingbo.createTime',
    'paymingbo.expireTime',
    'paymingbo.orderStatus as orderStatus',
    'paymingbo.orderMode as orderMode',
    'paymingbo.orderActiveTime as orderActiveTime',
    'paymingbo.limit',
  ];
  let count = knex('paymingbo').select()
  .leftJoin('user', 'user.id', 'paymingbo.user')
  //.leftJoin('account_plugin', 'account_plugin.id', 'paymingbo.account')
  .leftJoin('webgui_order', 'webgui_order.sku', 'paymingbo.sku')
  //.leftJoin('giftcard','giftcard.password','paymingbo.giftcard')
  .whereBetween('paymingbo.createTime', [start, end]);

  let orders = knex('paymingbo').select(select)
  .leftJoin('user', 'user.id', 'paymingbo.user')
  .leftJoin('account_plugin', 'account_plugin.id', 'paymingbo.account')
  .leftJoin('webgui_order', 'webgui_order.sku', 'paymingbo.sku')
  .leftJoin('giftcard','giftcard.password','paymingbo.giftcard')
  .whereBetween('paymingbo.createTime', [start, end]);

  if(filter.length) {
    count = count.whereIn('paymingbo.status', filter);
    orders = orders.whereIn('paymingbo.status', filter);
  }
  if(group >= 0) {
    count = count.leftJoin('user', 'user.id', 'paymingbo.user').where({ 'user.group': group });
    orders = orders.where({ 'user.group': group });
  }
  if(search) {
    count = count.where('paymingbo.orderId', 'like', `%${ search }%`);
    orders = orders.where('paymingbo.orderId', 'like', `%${ search }%`);
  }

  if(where && Object.keys(where).length > 0 ) {
    for(w in Object.keys(where)){
      let key = Object.keys(where)[w];
      let arr = where[key];
      if(Array.isArray(arr)){
        switch(arr[0]){
          case ">":
          case "<":
          case "=":
            count = count.where(key, arr[0], arr[1]);
            orders = orders.where(key, arr[0], arr[1]);
            console.log("after",key, arr[0], arr[1]);
            break;
          case "like":
            count = count.where(key, "like", `%${ arr[1] }%`);
            orders = orders.where(key, "like", `%${ arr[1] }%`);
            console.log("after",key, arr[0], arr[1]);
            break;
          default:
            count = count.where(key, arr);
            orders = orders.where(key, arr);
            break;
        }
      }else{
        console.log(key, arr);
        if(arr != ""){
          count = count.where(key, arr);
          orders = orders.where(key, arr);
        }
      }
    }
  }

  count = await count.count('orderId as count').then(success => success[0].count);
  orders = await orders.orderBy(sort.split('_')[0], sort.split('_')[1]).limit(pageSize).offset((page - 1) * pageSize);
  orders.forEach(f => {
    f.payCallback = JSON.parse(f.payCallback);
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
    //status: 'FINISH',
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


const youtube = async (url) => {
  console.log("url",url);
  let info = await ytdl.getInfo(url);
  let format;
  if(info){
     format = await ytdl.chooseFormat(info.formats,{filter : (format)=> format.container==="mp4" && format.quality ==="hd720" || format.quality ==="medium"});
  }
  console.log("format",format);
  return format;

}

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
exports.alipayNotify = alipayNotify;
exports.wechatNotify = wechatNotify;
exports.youtube = youtube;
