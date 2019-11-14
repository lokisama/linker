const knex = appRequire('init/knex').knex;
const giftcard = appRequire('plugins/giftcard');
const user = appRequire('plugins/user/index');
const log4js = require('log4js');
const logger = log4js.getLogger('webgui');

const minboPlugin = appRequire('plugins/payMingbo');

exports.addGiftCard = async (req, resp) => {
  const count = Number(req.body.count);
  const orderId = Number(req.body.orderId);
  const comment = req.body.comment;
  const sku = req.body.sku;
  const limit = req.body.limit;
  const cutPrice = req.body.cutPrice;
  const mingboType = req.body.mingboType;
  if (count === NaN || orderId === NaN || count === 0) {
    resp.status(400).send('Bad parameters').end();
    return;
  }
  try {
    const batchNumber = await giftcard.generateGiftCard(count, orderId, comment,sku,limit,cutPrice, mingboType);
    resp.send({ batchNumber: batchNumber });
  } catch (err) {
    logger.error(`添加充值码失败：${err.toString()}`);
    resp.status(500).send(err.toString()).end();
  }
};

exports.revokeBatch = async (req, resp) => {
  const batchNumber = Number(req.body.batchNumber);
  if (req.body.batchNumber != null && batchNumber !== NaN) {
    try {
      await giftcard.revokeBatch(batchNumber);
      resp.send('success');
    } catch (err) {
      logger.error(`无法收回批次 ${batchNumber}：${err.toString()}`);
      resp.status(500).end();
    }
  } else {
    resp.status(400).end();
  }
};

exports.listBatch = async (req, res) => {
  try {
    res.send(await giftcard.listBatch());
  } catch (err) {
    logger.error(`无法列出充值码：${err.toString()}`);
    res.status(500).end();
  }
};

exports.getBatchDetails = async (req, resp) => {
  const batchNumber = Number(req.params.batchNumber);
  if (req.params.batchNumber != null && batchNumber !== NaN) {
    try {
      const details = await giftcard.getBatchDetails(batchNumber);
      if (details != null)
        resp.send(details);
      else
        resp.send(404).end();
    } catch (err) {
      logger.error(`无法查询批次 ${batchNumber}：${err.toString()}`);
      resp.status(500).end();
    }
  } else {
    resp.status(400).end();
  }
};

exports.getOrders = async (req, res) => {
  try {
    const options = {};
    if(req.adminInfo.id === 1) {
      options.group = +req.query.group;
    } else {
      options.group = req.adminInfo.group;
    }
    options.page = +req.query.page;
    options.pageSize = +req.query.pageSize;
    options.start = req.query.start;
    options.end = req.query.end;
    const details = await giftcard.orderListAndPaging(options);
    res.send(details);
  } catch (err) {
    logger.error(err);
    res.status(500).end();
  }
};

exports.getUserOrders = async (req, res) => {
  try {
    const userId = +req.params.userId;
    const details = await giftcard.getUserOrders(userId);
    res.send(details);
  } catch (err) {
    logger.error(err);
    res.status(500).end();
  }
};

exports.useGiftCardForUser = async (req, res) => {
  try {
    const password = req.body.password;
    const userId = +req.body.userId;
    const accountId = req.body.accountId ? +req.body.accountId : null;
    const result = await giftcard.processOrder(userId, accountId, password);
    res.send(result);
  } catch (err) {
    logger.error(err);
    res.status(500).end();
  }
};

/**
 * 使用礼品券
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * userId
 * password
 * @return {[type]}     [description]
 */
exports.useGiftCardForMingboUser = async (req, res) => {
  try {
    const userId = +req.body.userId;
    const phone = req.body.phone;
    const password = req.body.password;
    const accountId = req.body.accountId ? +req.body.accountId : null;
    let userInfo;
    if(!userId && phone){
      userInfo = await user.getOneUserByPhone(phone);
    }else if(userId && !phone){
      userInfo = await user.getOne(userId);
    }

    if(userInfo == null){
      return res.send({"succuss": false,"error":"用户不存在"});
    }

    const result = await giftcard.processOrderForMingboUser(userInfo,accountId,password);
    return res.send(result);

  } catch (err) {
    logger.error(err);
    return res.send({"succuss": false,"error":err});
  }
};

/**
 * 发送礼品券
 * @param  {[type]} req [description]
  {
  "phone":13788997536,
  "type":2
  }
 * @param  {[type]} res [description]
  {
    "success": true,
    "data": {
        "cardId": 27,
        "sku": "tcp_daily",
        "comment": "2天免费",
        "password": "679d83a76f7b41c882",
        "type": 2
      }
    }
 * @return {[type]}     [description]
 */
exports.sendGiftCardForMingboUser = async (req, res) => {
  try {
    const userId = +req.body.userId;
    const phone = req.body.phone;
    const mingboType = req.body.type;
    const accountId = req.body.accountId ? +req.body.accountId : null;
    let userInfo;
    if(!userId && phone){
      userInfo = await user.getOneUserByPhone(phone);
    }else if(userId && !phone){
      userInfo = await user.getOne(userId);
    }

    const result = await giftcard.processBind(userInfo.id, accountId, mingboType);
    return res.send(result);
  } catch (err) {
    logger.error(err);
    return res.send({"succuss": false,"error":err});
  }
};

exports.searchGiftcard = async (req, res) => {
  try {
    const userId = +req.body.userId;
    const phone = req.body.phone;
    const status = req.body.status;
    let userInfo;
    if(!userId && phone){
      userInfo = await user.getOneUserByPhone(phone);
    }else if(userId && !phone){
      userInfo = await user.getOne(userId);
    }

    const result = await giftcard.searchGiftcard(userInfo.id,status);
    return res.send(result);

  } catch (err) {
    logger.error(err);
    return res.send({"succuss": false,"error":err});
  }
}

