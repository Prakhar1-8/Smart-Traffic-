const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "traffic_db",
  password: "password",
  port: 5432
});

module.exports = pool;