const knex = appRequire('init/knex').knex;
const giftcard = appRequire('plugins/giftcard');
const log4js = require('log4js');
const logger = log4js.getLogger('webgui');

exports.addGiftCard = async (req, resp) => {
  const count = Number(req.body.count);
  const type = Number(req.body.type);
  const comment = req.body.comment;
  if (count === NaN || type === NaN || count === 0) {
    resp.status(400).send('Bad parameters').end();
    return;
  }
  try {
    const batchNumber = await giftcard.generateGiftCard(count, type, comment);
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

exports.listBatch = async (req, resp) => {
  try {
    resp.send(await giftcard.listBatch());
  } catch (err) {
    logger.error(`无法列出充值码：${err.toString()}`);
    resp.status(500).end();
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

exports.getOrders = async (req, resp) => {
  try {
    const details = await giftcard.orderListAndPaging();
    resp.send(details);
  } catch (err) {
    logger.error(err);
    resp.status(500).end();
  }
};