// src/database/create-search-indexes.ts
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from '../app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from '../models/product.model';

const logger = new Logger('IndexCreation');

interface IndexDefinition {
  keys: Record<string, any>;
  options: {
    name: string;
    weights?: Record<string, number>;
    background?: boolean;
  };
}

const SEARCH_INDEXES: IndexDefinition[] = [
  {
    keys: {
      name: 'text',
      description: 'text',
      searchKeywords: 'text',
      'brand.name': 'text',
    },
    options: {
      name: 'product_text_search',
      weights: {
        name: 10,
        searchKeywords: 5,
        'brand.name': 3,
        description: 1,
      },
      background: true,
    },
  },
  {
    keys: { status: 1, 'category._id': 1, 'price.current': 1 },
    options: { name: 'category_price_filter', background: true },
  },
  {
    keys: { status: 1, 'brand._id': 1, 'price.current': 1 },
    options: { name: 'brand_price_filter', background: true },
  },
  {
    keys: { status: 1, featured: 1, 'metrics.popularityScore': -1 },
    options: { name: 'featured_popular', background: true },
  },
  {
    keys: { status: 1, isDiscounted: 1, discountPercentage: -1 },
    options: { name: 'discount_filter', background: true },
  },
];

async function createSearchIndexes(): Promise<void> {
  let app;

  try {
    logger.log('Initializing application context');
    app = await NestFactory.createApplicationContext(AppModule, {
      logger: ['error', 'warn', 'log'],
    });

   
    const productModel = app.get(
      getModelToken(Product.name)
    ) as Model<ProductDocument>;

    const existingIndexes = await productModel.collection.indexes();
    const existingIndexNames = existingIndexes.map((idx) => idx.name);

    let createdCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    for (const indexDef of SEARCH_INDEXES) {
      const indexName = indexDef.options.name;

      try {
        if (existingIndexNames.includes(indexName)) {
          logger.log(`Skipping existing index: ${indexName}`);
          skippedCount++;
          continue;
        }

        await productModel.collection.createIndex(
          indexDef.keys,
          indexDef.options,
        );
        logger.log(`Created index: ${indexName}`);
        createdCount++;
      } catch (error) {
        logger.error(`Failed to create ${indexName}: ${error.message}`);
        failedCount++;
      }
    }

    logger.log('Index creation summary:');
    logger.log(`  Created: ${createdCount}`);
    logger.log(`  Skipped: ${skippedCount}`);
    logger.log(`  Failed: ${failedCount}`);
    logger.log(`  Total: ${SEARCH_INDEXES.length}`);

    if (failedCount > 0) {
      throw new Error(`${failedCount} index(es) failed to create`);
    }

    logger.log('Index creation completed successfully');
  } catch (error) {
    logger.error(`Index creation failed: ${error.message}`);
    logger.error(error.stack);
    process.exit(1);
  } finally {
    if (app) {
      await app.close();
    }
  }
}

createSearchIndexes()
  .then(() => process.exit(0))
  .catch((error) => {
    logger.error(`Unhandled error: ${error.message}`);
    process.exit(1);
  });