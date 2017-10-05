const knex = appRequire('init/knex').knex;
const tableName = 'menu';

const config = appRequire('services/config').all();
const createTable = async () => {
  if(config.empty) {
    await knex.schema.dropTableIfExists(tableName);
  }
  const exist = await knex.schema.hasTable(tableName);
  if(exist) {
    return;
  }
  return knex.schema.createTableIfNotExists(tableName, function(table) {
    table.increments('id').primary();
    table.string('menuId').unique();
    table.string('menuType').defaultTo('month');
    table.string('price');
    table.integer('flow');
    table.integer('time');
    table.string('status');
    table.bigInteger('createTime');
    table.bigInteger('expireTime');
  });
};

exports.createTable = createTable;
