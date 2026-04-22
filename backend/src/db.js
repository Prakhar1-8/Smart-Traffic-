const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "traffic_db",
  password: process.env.DB_PASSWORD || "password",
  port: process.env.DB_PORT || 5432
});

const bcrypt = require("bcrypt");

const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS analytics_reports (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
        total_vehicles INTEGER NOT NULL,
        car_count INTEGER DEFAULT 0,
        bike_count INTEGER DEFAULT 0,
        bus_count INTEGER DEFAULT 0,
        truck_count INTEGER DEFAULT 0,
        density DECIMAL(5,2) DEFAULT 0,
        recommended_signal_time INTEGER DEFAULT 30,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS alerts (
            id SERIAL PRIMARY KEY,
            tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
            severity VARCHAR(50) DEFAULT 'warning',
            title VARCHAR(255) NOT NULL,
            description TEXT,
            location VARCHAR(255) DEFAULT 'Central Junction',
            is_read BOOLEAN DEFAULT false,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS cameras (
            id SERIAL PRIMARY KEY,
            tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
            junction_id INTEGER NOT NULL,
            camera_name VARCHAR(255) NOT NULL,
            stream_url VARCHAR(255),
            lane_config JSONB DEFAULT '[]'::JSONB,
            status VARCHAR(50) DEFAULT 'offline',
            processing_status VARCHAR(50) DEFAULT 'idle',
            last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await pool.query(`
            CREATE TABLE IF NOT EXISTS signals (
                id SERIAL PRIMARY KEY,
                tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
                junction_id INTEGER NOT NULL,
                mode VARCHAR(50) DEFAULT 'auto',
                recommended_green_time INTEGER DEFAULT 30,
                current_green_time INTEGER DEFAULT 30,
                manual_override BOOLEAN DEFAULT false,
                l1 VARCHAR(15) DEFAULT 'red',
                l2 VARCHAR(15) DEFAULT 'red',
                l3 VARCHAR(15) DEFAULT 'red',
                l4 VARCHAR(15) DEFAULT 'red',
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS system_cache (
            id SERIAL PRIMARY KEY,
            tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
            latest_analysis JSONB,
            signal_state JSONB,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Dynamically inject the expanded profile attributes securely scaling the table
    await pool.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS full_name VARCHAR(255),
        ADD COLUMN IF NOT EXISTS dob DATE,
        ADD COLUMN IF NOT EXISTS email VARCHAR(255),
        ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
        ADD COLUMN IF NOT EXISTS location VARCHAR(255),
        ADD COLUMN IF NOT EXISTS gender VARCHAR(50)
    `);

    // Dynamically inject lane config matrix for existing databases
    await pool.query(`
      ALTER TABLE cameras
        ADD COLUMN IF NOT EXISTS lane_config JSONB DEFAULT '[]'::JSONB
    `);

    // Ensure backwards compatibility with expanded columns
    await pool.query(`
      ALTER TABLE signals
        ADD COLUMN IF NOT EXISTS l1 VARCHAR(15) DEFAULT 'red',
        ADD COLUMN IF NOT EXISTS l2 VARCHAR(15) DEFAULT 'red',
        ADD COLUMN IF NOT EXISTS l3 VARCHAR(15) DEFAULT 'red',
        ADD COLUMN IF NOT EXISTS l4 VARCHAR(15) DEFAULT 'red'
    `);

    // Verify if root network tenants exist
    const { rows: tenantRows } = await pool.query("SELECT COUNT(*) FROM tenants");
    let initialTenantId = 1;
    if (parseInt(tenantRows[0].count) === 0) {
       const tenantRes = await pool.query("INSERT INTO tenants (name) VALUES ($1) RETURNING id", ["Root Administration"]);
       initialTenantId = tenantRes.rows[0].id;
       console.log("PostgreSQL: Root administration tenant strictly generated.");
       
       // Pre-seed system cache
       await pool.query("INSERT INTO system_cache (tenant_id, latest_analysis, signal_state) VALUES ($1, $2, $3)", 
          [initialTenantId, JSON.stringify({
             totalVehicles: 0,
             density: 0,
             vehicleTypes: { car: 0, bike: 0, bus: 0, truck: 0 },
             laneDensity: [],
             trafficTrend: [],
             recommendedSignalTime: 30,
             videoPath: null
          }), JSON.stringify({})]
       );

       // Pre-seed hardware
       await pool.query(`INSERT INTO cameras (tenant_id, junction_id, camera_name, stream_url, status) 
                         VALUES ($1, 101, 'Main Intersection Cam 1', 'http://192.168.1.100/stream', 'online')`, [initialTenantId]);
       await pool.query(`INSERT INTO signals (tenant_id, junction_id) VALUES ($1, 101)`, [initialTenantId]);
    }

    // Verify if root accounts exist, if not, auto-seed them linked to root tenant
    const { rows } = await pool.query("SELECT COUNT(*) FROM users");
    if (parseInt(rows[0].count) === 0) {
      const adminHash = await bcrypt.hash("admin123", 10);
      const userHash = await bcrypt.hash("user123", 10);
      
      await pool.query(
        "INSERT INTO users (tenant_id, username, password_hash, role) VALUES ($1, $2, $3, $4), ($5, $6, $7, $8)",
        [initialTenantId, "admin", adminHash, "admin", initialTenantId, "user", userHash, "user"]
      );
      console.log("PostgreSQL: Initial cryptographic user identities seeded mapped strictly to boundaries");
    }

    console.log("PostgreSQL: Architected Schema configuration complete");
  } catch (err) {
    console.error("PostgreSQL Init Error:", err.message);
  }
};

module.exports = { pool, initDB };