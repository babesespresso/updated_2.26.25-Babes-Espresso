import createModelsTable from './create-models-table';

async function runMigrations() {
  console.log('Running database migrations...');
  
  try {
    // Run migrations in sequence
    await createModelsTable();
    
    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }
}

export default runMigrations;
