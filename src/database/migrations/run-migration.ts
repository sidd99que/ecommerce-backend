// src/database/migrations/run-migration.ts
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { MigrationModule } from './migration.module';
import { UpdateProductsSchema } from './update-products-schema';

const logger = new Logger('Migration');

async function runMigration(): Promise<void> {
  let app;

  try {
    logger.log('Initializing migration process');
    
    app = await NestFactory.createApplicationContext(MigrationModule, {
      logger: ['error', 'warn', 'log'],
    });

    const migration = app.get(UpdateProductsSchema);

    await migration.run();
    
    logger.log('Migration completed successfully');
  } catch (error) {
    logger.error(`Migration failed: ${error.message}`);
    logger.error(error.stack);
    process.exit(1);
  } finally {
    if (app) {
      await app.close();
    }
  }
}

runMigration()
  .then(() => process.exit(0))
  .catch((error) => {
    logger.error(`Unhandled error: ${error.message}`);
    process.exit(1);
  });