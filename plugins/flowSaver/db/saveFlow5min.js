const knex = appRequire('init/knex').knex;
const tableName = 'saveFlow5min';

const createTable = async() => {
  const exist = await knex.schema.hasTable(tableName);
  if(exist) {
    return;
  }
  return knex.schema.createTableIfNotExists(tableName, function(table) {
    table.integer('id');
    table.integer('port');
    table.bigInteger('flow');
    table.bigInteger('time');
    table.index(['time', 'port'], '5minIndex');
  });
};

exports.createTable = createTable;
