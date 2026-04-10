import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'bazar.db');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(dbPath);
    initDb();
  }
  return db;
}

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS prices_raw (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id TEXT NOT NULL,
      bazar_id TEXT NOT NULL,
      user_id TEXT,
      price REAL NOT NULL,
      photo_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      ip_address TEXT
    );

    CREATE TABLE IF NOT EXISTS prices_verified (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id TEXT NOT NULL,
      bazar_id TEXT NOT NULL,
      median_price REAL NOT NULL,
      confidence_score REAL NOT NULL,
      verified_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS market_basket_totals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bazar_id TEXT NOT NULL,
      area_id TEXT NOT NULL,
      weekly_total_default_family REAL NOT NULL,
      calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed some initial verified data for demonstration
  const count = db.prepare('SELECT count(*) as count FROM prices_verified').get() as { count: number };
  if (count.count === 0) {
    const stmt = db.prepare(`
      INSERT INTO prices_verified (product_id, bazar_id, median_price, confidence_score)
      VALUES (?, ?, ?, ?)
    `);

    // Mirpur 6 Data
    stmt.run('1', 'mirpur', 150, 92); // Broiler Chicken
    stmt.run('2', 'mirpur', 145, 95); // Eggs
    stmt.run('3', 'mirpur', 45, 88);  // Potato
    stmt.run('4', 'mirpur', 120, 90); // Onion
    stmt.run('5', 'mirpur', 80, 85);  // Green Chili
    stmt.run('6', 'mirpur', 165, 98); // Soybean Oil
    stmt.run('7', 'mirpur', 135, 96); // Sugar
    stmt.run('8', 'mirpur', 110, 94); // Lentil

    // Dhanmondi Data (Slightly more expensive)
    stmt.run('1', 'dhanmondi', 160, 85);
    stmt.run('2', 'dhanmondi', 150, 88);
    stmt.run('3', 'dhanmondi', 50, 82);
    stmt.run('4', 'dhanmondi', 130, 85);
    stmt.run('5', 'dhanmondi', 90, 80);
    stmt.run('6', 'dhanmondi', 170, 95);
    stmt.run('7', 'dhanmondi', 140, 92);
    stmt.run('8', 'dhanmondi', 115, 90);

    // Gulshan Data (Most expensive)
    stmt.run('1', 'gulshan', 170, 80);
    stmt.run('2', 'gulshan', 155, 85);
    stmt.run('3', 'gulshan', 55, 78);
    stmt.run('4', 'gulshan', 140, 82);
    stmt.run('5', 'gulshan', 100, 75);
    stmt.run('6', 'gulshan', 175, 92);
    stmt.run('7', 'gulshan', 145, 90);
    stmt.run('8', 'gulshan', 120, 88);
  }
}
