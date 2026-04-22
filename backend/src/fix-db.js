require('dotenv').config({ path: '../.env' });
const { pool } = require('./db');

async function fix() {
  try {
    const { rows } = await pool.query('SELECT latest_analysis FROM system_cache WHERE tenant_id=1');
    if (rows.length > 0) {
      let data = rows[0].latest_analysis;
      if (typeof data === 'string') data = JSON.parse(data);
      if (!data.videoPath) {
        data.videoPath = "/processed/processed_1776605198.mp4";
        await pool.query('UPDATE system_cache SET latest_analysis = $1 WHERE tenant_id=1', [JSON.stringify(data)]);
        console.log("Database fixed successfully. The UI should now show the video.");
      } else {
        console.log("Video path already exists:", data.videoPath);
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

fix();
