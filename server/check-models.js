import sqlite3 from 'sqlite3';

console.log('Starting database check for models table...');

// Specify the database path
const dbPath = './sqlite.db';
console.log(`Using database path: ${dbPath}`);

// Open the database
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Successfully connected to database');
  
  // Check if the models table exists
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='models'", (err, row) => {
    if (err) {
      console.error('Error checking for models table:', err.message);
      db.close();
      process.exit(1);
    }
    
    if (!row) {
      console.log('The models table does not exist in the database');
      db.close();
      process.exit(0);
    }
    
    console.log('The models table exists, checking for records...');
    
    // Query all records from the models table
    db.all('SELECT * FROM models', (err, rows) => {
      if (err) {
        console.error('Error querying models table:', err.message);
        db.close();
        process.exit(1);
      }
      
      console.log(`Found ${rows.length} records in the models table`);
      
      if (rows.length > 0) {
        console.log('Sample record:');
        console.log(JSON.stringify(rows[0], null, 2));
      }
      
      // Close the database connection
      db.close(() => {
        console.log('Database connection closed');
        process.exit(0);
      });
    });
  });
});
