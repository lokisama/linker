const knex = appRequire('init/knex').knex;
const tableName = 'user';

const createTable = async() => {
  const exist = await knex.schema.hasTable(tableName);
  if(exist) {
    const hasColumnGroup = await knex.schema.hasColumn(tableName, 'group');
    if(!hasColumnGroup) {
      await knex.schema.table(tableName, function(table) {
        table.integer('group').defaultTo(0);
      });
    }
    return;
  }
  return knex.schema.createTableIfNotExists(tableName, function(table) {
    table.increments('id').primary();
    table.string('username').unique();
    table.string('email');
    table.string('telegram');
    table.string('password');
    table.string('type');
    table.bigInteger('createTime');
    table.bigInteger('lastLogin');
    table.string('resetPasswordId');
    table.bigInteger('resetPasswordTime');
    table.integer('group').defaultTo(0);
  });
};

exports.createTable = createTable;
