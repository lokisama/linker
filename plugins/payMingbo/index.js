const log4js = require('log4js');
const logger = log4js.getLogger('pay');
const cron = appRequire('init/cron');
const config = appRequire('services/config').all();
const fs = require('fs');
const ref = appRequire('plugins/webgui_ref/time');
const orderPlugin = appRequire('plugins/webgui_order');
const groupPlugin = appRequire('plugins/group');
const giftcardPlugin = appRequire('plugins/giftcard');
const knex = appRequire('init/knex').knex;
const account = appRequire('plugins/account/index');
const moment = require('moment');
const push = appRequire('plugins/webgui/server/push');
const path = require('path');
const ytdl = require('ytdl-core');

const { request } = require('http');
const { parse } = require('url');
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
const wechat = cnPay.wechat(wxConfig);

const isTelegram = config.plugins.webgui_telegram && config.plugins.webgui_telegram.use;
let telegram;
if(isTelegram) {
  telegram = appRequire('plugins/webgui_telegram/admin');
}



const createOrder = async (user, account, orderId) => {
  const oldOrder = await knex('pay').where({
    user,
    account: account ? account : null,
    orderType: orderId
  }).where('expireTime', '>', Date.now() + 15 * 60 * 1000)
  .where({
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
  await knex('pay').insert({
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

  const oldOrder = await knex('pay')
  .where('expireTime', '>', Date.now() + orderExpire * 60 * 1000)
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
        method: oldOrder.method,
        platform: oldOrder.platform,
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
    platform: result.platform,
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

cron.second(async () => {
  logger.info('check pay order');
 //if(!alipay_f2f) { return; }
 
  //体验券直接完成
  await knex('pay').update({
    status: 'FINISH',
    orderMode : 'free',
    orderStatus: 1,
  }).where({ platform: 'giftcard' });//.whereNot("status","FINISH");

  //完成订单
  await knex('pay').update({
    status: 'FINISH',
    orderMode: 'charge',
    orderStatus: 1,
  }).whereNotNull("payCallback");//.whereNot({ status : 'FINISH'});

  // await knex('pay').update({
  //   orderStatus: 1,
  // }).where('expireTime','>',Date.now()).where({ status : 'FINISH'});

  //关闭过期支付
  await knex('pay').update({
    status: 'TRADE_CLOSED',
    orderStatus:-1,
  })
  .where('expireTime','<',Date.now())
  .where("platform","aliyun").orWhere("platform","wechat");//.whereNot({ status : 'FINISH'});


  //处理未完成订单 
  const orders = await knex('pay').select();//.whereNot('status', "FINISH");
  const scanOrder = order => {
    

    if(order.payCallback || order.platform == "giftcard"){
      let payTime = 0;
      if(order.platform == 'alipay'){
        payTime = JSON.parse(order.payCallback).gmt_payment;
        payTime = moment(payTime).valueOf();
      }else if(order.platform == 'wechat'){
        payTime = JSON.parse(order.payCallback).time_end;
        payTime =  moment(payTime, 'YYYYMMDDHHmmss').valueOf();
      }else if(order.platform == 'giftcard'){
        payTime = order.createTime;
      }

      let expireTime = 0;
      if(order.sku.indexOf("monthly") > 0){
        expireTime = moment(payTime).add(1, "months").valueOf();
      }else if(order.sku.indexOf("quarterly") > 0){
        expireTime = moment(payTime).add(3, "months").valueOf();
      }else if(order.sku.indexOf("yearly") > 0){
        expireTime = moment(payTime).add(1, "years").valueOf();
      }else if(order.sku.indexOf("daily") > 0){
        expireTime = moment(payTime).add(order.limit, "days").valueOf();
      }else if(order.sku.indexOf("hourly") > 0){
        expireTime = moment(payTime).add(order.limit, "hours").valueOf();
      }

      let addTime = (expireTime - payTime)>0 ? expireTime - payTime : 0;
      let isExpired = (expireTime - moment().valueOf()) < 0;
      //"0":"已冻结",
      // "1":"生效中",
      // "2":"已到期",
      // "-1":"异常"

      //logger.info(`order: [${ order.orderId }] payTime:[${ payTime}] expireTime:[${ expireTime}] addTime:[${ addTime  }]`);
      // payTime = moment(payTime).format("YYYY-MM-DD HH:mm:ss");

      return knex('pay').update({
        status: "FINISH",
        activeTime: payTime,
        payTime: payTime,
        expireTime: expireTime,
        addTime: addTime,
        orderStatus: isExpired ? 2:1
      }).where({
        orderId: order.orderId
      });
    }
    // if(order.status !== 'TRADE_SUCCESS' && order.status !== 'FINISH') {
    //   return alipay_f2f.checkInvoiceStatus(order.orderId).then(success => {
    //     if(success.code === '10000') {
    //       return knex('pay').update({
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
        // return knex('pay').update({
        //   status: 'FINISH',
        // }).where({
        //   orderId: order.orderId,
        // });
    //   }).then(() => {
    //     logger.info(`订单支付成功: [${ order.orderId }][${ order.amount }][account: ${ accountId }]`);
    //     ref.payWithRef(userId, order.orderType);
    //     sendSuccessMail(userId);
    //   }).catch(err => {
    //     logger.error(`订单支付失败: [${ order.orderId }]`, err);
    //   });
    // };
  };
  for(const order of orders) {
    await scanOrder(order);
  }
}, 'CheckPayMingboOrder', 10);

const checkOrder = async (orderId) => {
  const order = await knex('pay').select().where({
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
  let vipType = product.vipType;
  
  let totalAmount = 0;
  if(card){
    totalAmount = product.amount* card.cutPrice/100;
  }else{
    totalAmount = product.amount;
  }
  
  let myOrderId = moment().format('YYYYMMDDHHmmss') + Math.random().toString().substr(2, 6);
  let payParams = '';
  let method = 'app';
  let orderMode = "charge";
  let orderModeEnum = {
    "charge":"充值",
    "recharge":"续费",
    "update":"升级",
    "free":"体验"
  };

  if(totalAmount > 0){

    if(platform == 'alipay'){

      const config = {
        out_trade_no: myOrderId,
        total_amount: "1.01",//totalAmount.toFixed(2),
        subject: product.name,
        body: product.comment,
        timeout: orderExpire+'m',
      };
      payParams = await alipay.app(config);

    }else if(platform == 'wechat'){
      
      const config = {
        out_trade_no: myOrderId,
        body: product.name,
        total_fee: 1.01,//totalAmount.toFixed(2), // 直接以元为单位 //totalAmount.toFixed(2),
        spbill_create_ip: '180.165.231.68' // 客户端ip
      };

      payParams = await wechat.app(config);
      payParams = JSON.stringify(payParams);
    }

  }else{
    orderMode = "free";
  }

  logger.info(`创建[${orderModeEnum[orderMode]}]订单: [orderId: ${ myOrderId }][amount: ${ totalAmount }][account: ${ account }]`);


  const insert = {
    orderId: myOrderId,
    orderType: product.vipType,
    orderStatus: 1,
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
    status: platform=="giftcard"?'TRADE_SUCCESS':'CREATE',
    orderMode:orderMode,
    orderStatus:0,
    createTime: Date.now(),
    activeTime: platform=="giftcard" ? Date.now() : 0,
    expireTime: Date.now() + orderExpire * 60 * 1000,
  };
  console.log(insert);

  let order = await knex('pay').insert(insert);

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

let planMingboType = (sku) =>{
  try{
    let toMingboType = {
      "game_monthly":"14",
      "all_monthly":"13",
      "game_quarterly":"15",
      "all_quarterly":"16",
      "game_yearly":"17",
      "all_yearly":"18",
    };
    return toMingboType[sku];
  }catch(e){
    return "-1";
  }
}

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
  let resultEnum = {
    "SUCCESS": "TRADE_SUCCESS",
    "FAIL": "TRADE_CLOSED",
  };

  let orderId = await knex('pay').update({
    "status": data.return_code == "SUCCESS"? resultEnum[data.result_code] : data.return_code,
    "trade_no": data.return_code == "SUCCESS"? data.transaction_id : "",
    "payCallBack": JSON.stringify(data),
  }).where({
     orderId: data.out_trade_no
  }).andWhereNot({
    status: 'FINISH',
  }).then();


  let info = await orderListForMingbo({"orderId":data.out_trade_no}).then();
  if(info.length > 0){
    info[0].mingboType = planMingboType(info[0].sku);
    return {"success": true, "data": info[0] };
  }else{
    return {"success": false, "message": "out_trade_no异常" };
  }
  
  
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
  let orderId = await knex('pay').update({
    status: data.trade_status,
    trade_no: data.trade_no,
    payCallBack: JSON.stringify(data),
  }).where({
     orderId: data.out_trade_no
  }).andWhereNot({
    status: 'FINISH',
  }).then();

  let info = await orderListForMingbo({"orderId":data.out_trade_no}).then();
  if(info.length > 0){
    info[0].mingboType = planMingboType(info[0].sku);
    return {"success": true, "data": info[0] };
  }else{
    return {"success": false, "message": "out_trade_no异常" };
  }
  
};

const verifyCallback = (data) => {
  // const signStatus = alipay_f2f.verifyCallback(data);
  // if(signStatus) {
  //   knex('pay').update({
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
  const orders = await knex('pay').select([
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
    where['pay.orderId'] = options.orderId;
  }

  const orders = await knex('pay').select([
    'pay.orderId',
    'pay.orderType',
    'user.id',
    'user.username as phone',
    'pay.sku as sku',
    'pay.limit as limit',
    'pay.giftcard',
    'giftcard.mingboType as mingboType',
    'pay.amount',
    'pay.totalAmount',
    'pay.method',
    'pay.platform as platform',
    'pay.trade_no as trade_no',
    'pay.status as status',
    'pay.platform as platform',
    //'pay.payCallback as payCallbak',
    'pay.createTime',
    'pay.expireTime',
  ])
  .leftJoin('user', 'user.id', 'pay.user')
  .leftJoin('account_plugin', 'account_plugin.id', 'pay.account')
  .leftJoin('giftcard', 'giftcard.password', 'pay.giftcard')
  .where(where)
  .orderBy('pay.createTime', 'DESC');
  

  /*orders.forEach(f => {
    f.payCallback = JSON.parse(f.payCallback);
  });*/

  return orders;
};

const orderListAndPaging = async (options = {}) => {
  const search = options.search || '';
  const group = options.group;
  const filter = options.filter || [];
  const sort = options.sort || 'pay.createTime_desc';
  const page = options.page || 1;
  const pageSize = options.pageSize || 20;
  const where = options.where || 
  {
    "totalAmount":[">",30]
  };
  const start = options.start ? moment(options.start).hour(0).minute(0).second(0).millisecond(0).toDate().getTime() : moment(0).toDate().getTime();
  const end = options.end ? moment(options.end).hour(23).minute(59).second(59).millisecond(999).toDate().getTime() : moment().toDate().getTime();
  const select  = [
    'pay.orderId',
    'pay.orderType',
    'webgui_order.name as orderName',
    'webgui_order.sku as sku',
    'webgui_order.cycle',
    'webgui_order.shortComment as orderShortName',
    'giftcard.comment',
    'giftcard.cutPrice',
    'giftcard.limit',
    'user.id as userId',
    'user.group as group',
    'user.username as username',
    'account_plugin.port',
    'pay.amount',
    'pay.totalAmount',
    'pay.method',
    'pay.platform as platform',
    'pay.trade_no as trade_no',
    'pay.status',
    'pay.giftcard',
    'pay.payCallback',
    'pay.payParams',
    'pay.createTime',
    'pay.payTime',
    'pay.expireTime',
    'pay.orderStatus as orderStatus',
    'pay.orderMode as orderMode',
    'pay.activeTime as activeTime',
    'pay.limit',
  ];
  let count = knex('pay').select(select)
  .leftJoin('user', 'user.id', 'pay.user')
  .leftJoin('account_plugin', 'account_plugin.id', 'pay.account')
  .leftJoin('webgui_order', 'webgui_order.sku', 'pay.sku')
  .leftJoin('giftcard','giftcard.password','pay.giftcard')
  .whereBetween('pay.createTime', [start, end]);

  let orders = knex('pay').select(select)
  .leftJoin('user', 'user.id', 'pay.user')
  .leftJoin('account_plugin', 'account_plugin.id', 'pay.account')
  .leftJoin('webgui_order', 'webgui_order.sku', 'pay.sku')
  .leftJoin('giftcard','giftcard.password','pay.giftcard')
  //.whereNot("pay.platform","giftcard")
  .whereBetween('pay.createTime', [start, end]);

  if(filter.length) {
    count = count.whereIn('pay.status', filter);
    orders = orders.whereIn('pay.status', filter);
  }
  if(group >= 0) {
    count = count.leftJoin('user', 'user.id', 'pay.user').where({ 'user.group': group });
    orders = orders.where({ 'user.group': group });
  }
  if(search) {
    count = count.where('pay.orderId', 'like', `%${ search }%`);
    orders = orders.where('pay.orderId', 'like', `%${ search }%`);
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

  count = await count.count('pay.orderId as count').then(success => success[0].count);
  orders = await orders.orderBy(sort.split('_')[0], sort.split('_')[1]).limit(pageSize).offset((page - 1) * pageSize);
  console.log()
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

  let orders = knex('pay').select([
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

const getUserFinishOrder = async (userId,limit=20,offset=0) => {

  let orders = await knex('pay').select([
    'orderId',
    'webgui_order.name as name',
    'shortComment',
    'trade_no',
    'status',
    'giftcard',
    'pay.amount as amount',
    'pay.totalAmount as totalAmount',
    'platform',
    'orderMode',
    'orderStatus',
    'activeTime',
    'payParams',
    'payCallback',
    'pay.createTime as createTime',
  ])
  .leftJoin('user', 'user.id', 'pay.user')
  .leftJoin('webgui_order', 'webgui_order.sku', 'pay.sku')
  .where({
    user: userId,
    //status: 'FINISH',
  })
  // .andWhereNot("totalAmount",0)
  .orderBy('createTime', 'DESC')
  .limit(limit).offset(offset);

  
  orders = orders.map(order => {

    return {
      orderId: order.orderId,
      title: order.shortComment + " " + order.name,
      platform: order.platform,
      activeTime: order.payTime,
      status: order.status,
      amount: order.amount,
      totalAmount: order.totalAmount,
      createTime: order.createTime,
      payTime: order.payTime,
      payParams: order.payParams
    };
  });
  
  return orders;
};

const getUserFinishOrderTotal = async (userId,limit=20,offset=0) => {

  let orders = await knex('pay').count("orderId as count")
  .leftJoin('user', 'user.id', 'pay.user')
  .leftJoin('webgui_order', 'webgui_order.sku', 'pay.sku')
  .where({
    user: userId,
    //status: 'FINISH',
  })
  // .andWhereNot("totalAmount",0);
  
  return orders.length > 0? orders[0].count:0;
};

const getUserExpireTime = async (userId) => {
  let result = [];

  let sum = await knex('pay').sum('addTime as addTime').min("payTime as payTime")
  .groupBy("orderType")
  .select("orderType")
  .where({
    user: userId,
    orderStatus:1
  });

  console.log(sum);

  sum.map(o=> {

    let expireTime = o.payTime+o.addTime;

    result.push({
      vipType:o.orderType,
      startTime: o.payTime,
      expireTime: expireTime
    });
  })

  for(let i=0; i< result.length;i++){

    let o = result[i];
    //获取当前时间
    let m1 = moment();
    //获取需要对比的时间
    let m2 = moment(o.expireTime);
    //计算相差多少天 day可以是second minute
    let days = m2.diff(m1, 'day');
    let hours = m2.diff(m1, 'hour');
    let diff = m2.valueOf() - m1.valueOf();

    console.log(m1.valueOf(),m2.valueOf());
    
    // o.days = days;
    o.hours = hours;
    //o.comment = "剩余" + days + "天";
    
    if(i>0){
      let p = result[i-1];
      let id = await knex('user').update({
        vipType: o.vipType
      }).where({
        id:userId
      });
    }
    
  }

  console.log(result);

  return result[result.length-1];
};

const refund = async (orderId, amount) => {
  const order = await knex('pay').where({ orderId }).then(s => s[0]);
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
//   await knex('pay').delete().where({ status: 'CREATE' }).whereBetween('createTime', [0, Date.now() - 1 * 24 * 3600 * 1000]);
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

const checkPackage = async (list) =>{
  let result = [];

  const check = async (package) => {
    const r = await knex('package_list').where({package:package}).select("package","allowInstall","allowVpn","comment");

    if(r.length > 0){
      return r[0];
    }else{
      const config = {
        package:package,
        allowVpn:0,
        allowInstall:1,
        comment:package
      };
      await knex('package_list').insert(config);
      return config;
    }
  };

  for(let i =0; i<list.length; i++){
    const o = list[i];
    result.push(await check(o));
  }

  return result;
}

const getReport = async () => {
  const r1 = await knex('pay').sum("totalAmount as totalPay");//.where({"status":"TRADE_SUCCESS"});
  const r2 = await knex('pay').sum("totalAmount as totalFinish").where({"status":"FINISH"});
  const r3 = await knex('pay').count("user as PaidUsers").where({"status":"FINISH"}).groupBy("user");
  const r4 = await knex('pay').count("id as PaidTimes").where({"status":"FINISH"});

  return {

    "totalPay":r1.length > 0 ? r1[0].totalPay.toFixed(2) : 0,
    "totalFinish":r2.length > 0 ? r2[0].totalFinish.toFixed(2)  : 0,
    "PaidUsers":r3.length > 0 ? r3[0].PaidUsers : 0,
    "PaidTimes":r4.length > 0 ? r4[0].PaidTimes : 0,
  }

}

const getTapGames = async (page) => {
  const req = await httpGET("http://apis.lynca.tech/MingboService/listTapGames?isInnerUse=true&page="+page);
  
  return req;
}

const httpGET = (url) => {
  return new Promise((resolve, reject) => {
    //params = stringify(params);
    const { hostname, path } = parse(url);
    const options = {
      hostname,
      path,
      method: 'GET',
      // headers: {
      //   'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
      // },
      // body: params
    };
    let data = '';
    const req = request(options, res => {
      res.setEncoding('utf8');
      
      res.on('data', chunk => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          error.message = 'Cannot resolve the interface returned data';
          reject(error);
        }
      });
    });
    req.on('error', error => {
      reject(error);
    });
    req.write(data);
    req.end();
  });
}



exports.orderListAndPaging = orderListAndPaging;
exports.orderList = orderList;
exports.createOrder = createOrder;
exports.checkOrder = checkOrder;
exports.verifyCallback = verifyCallback;
exports.getCsvOrder = getCsvOrder;
exports.getUserFinishOrder = getUserFinishOrder;
exports.getUserFinishOrderTotal = getUserFinishOrderTotal;
exports.getUserExpireTime = getUserExpireTime;
exports.refund = refund;
exports.createOrderForMingboUser = createOrderForMingboUser;
exports.createAppOrder = createAppOrder;
exports.alipayNotify = alipayNotify;
exports.wechatNotify = wechatNotify;
exports.youtube = youtube;
exports.checkPackage = checkPackage;
exports.getTapGames = getTapGames;
exports.getReport = getReport;