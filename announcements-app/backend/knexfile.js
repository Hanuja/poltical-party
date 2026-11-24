// backend/knexfile.js
module.exports = {
  client: 'sqlite3',
  connection: {
    filename: './dev.sqlite3',
  },
  useNullAsDefault: true,
  migrations: {
    directory: './migrations',
  },
};
