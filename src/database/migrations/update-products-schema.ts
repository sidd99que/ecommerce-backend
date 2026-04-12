// src/database/migrations/update-products-schema.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class UpdateProductsSchema {
  private readonly logger = new Logger(UpdateProductsSchema.name);

  constructor(
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async run(): Promise<void> {
    this.logger.log('🚀 Starting products schema migration...');

    const productsCollection = this.connection.collection('products');
    const categoriesCollection = this.connection.collection('categories');

    try {
      // Step 1: Get all products
      const products = await productsCollection.find({}).toArray();
      this.logger.log(`📦 Found ${products.length} products to migrate`);

      // Step 2: Get all categories for lookup
      const categories = await categoriesCollection.find({}).toArray();
      const categoryMap = new Map(
        categories.map((cat) => [cat._id.toString(), cat]),
      );
      this.logger.log(`📁 Loaded ${categories.length} categories`);

      let updatedCount = 0;
      let errorCount = 0;

      // Step 3: Update each product
      for (const product of products) {
        try {
          const categoryId = product.category?.toString();
          const categoryData = categoryMap.get(categoryId);

          if (!categoryData) {
            this.logger.warn(
              `⚠️  Category not found for product ${product._id}`,
            );
            continue;
          }

          // Generate slug from name
          const slug = this.generateSlug(product.name, product._id);

          // Generate search keywords from name
          const searchKeywords = this.generateKeywords(product.name);

          // Prepare update
          const update = {
            $set: {
              // Update slug
              slug: slug,

              // Transform price to object structure
              price: {
                current: product.price || 0,
                original: product.price || 0,
                currency: 'PKR',
              },

              // Embed category information
              category: {
                _id: categoryData._id,
                name: categoryData.name,
                slug: categoryData.slug || this.generateSlug(categoryData.name),
              },

              // Add brand (set to null for now, you can update later)
              brand: null,

              // Add status
              status: 'active',

              // Add search keywords
              searchKeywords: searchKeywords,

              // Add metrics
              metrics: {
                viewCount: 0,
                salesCount: 0,
                rating: 0,
                reviewCount: 0,
                popularityScore: 0,
              },
            },
          };

          // Execute update
          await productsCollection.updateOne({ _id: product._id }, update);

          updatedCount++;

          if (updatedCount % 50 === 0) {
            this.logger.log(`✅ Updated ${updatedCount} products...`);
          }
        } catch (error) {
          errorCount++;
          this.logger.error(
            `❌ Error updating product ${product._id}: ${error.message}`,
          );
        }
      }

      this.logger.log(`
        ========================================
        Migration Complete!
        ========================================
        ✅ Successfully updated: ${updatedCount}
        ❌ Errors: ${errorCount}
        ========================================
      `);
    } catch (error) {
      this.logger.error(`❌ Migration failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate slug from product name
   */
  private generateSlug(name: string, id?: any): string {
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Add ID suffix to ensure uniqueness
    return id ? `${baseSlug}-${id.toString().slice(-6)}` : baseSlug;
  }

  /**
   * Generate search keywords from product name
   */
  private generateKeywords(name: string): string[] {
    if (!name) return [];

    // Split by spaces and special characters
    const words = name
      .toLowerCase()
      .split(/[\s,.-]+/)
      .filter((word) => word.length > 2); // Only words longer than 2 chars

    // Remove duplicates
    return [...new Set(words)];
  }

  /**
   * Rollback migration (if needed)
   */
  async rollback(): Promise<void> {
    this.logger.log('🔄 Rolling back products schema migration...');

    const productsCollection = this.connection.collection('products');

    try {
      const products = await productsCollection.find({}).toArray();

      let rollbackCount = 0;

      for (const product of products) {
        // Restore old price structure
        const oldPrice = product.price?.current || product.price || 0;

        // Restore category to just ObjectId
        const categoryId = product.category?._id || product.category;

        await productsCollection.updateOne(
          { _id: product._id },
          {
            $set: {
              price: oldPrice,
              category: categoryId,
            },
            $unset: {
              slug: '',
              brand: '',
              status: '',
              searchKeywords: '',
              metrics: '',
            },
          },
        );

        rollbackCount++;
      }

      this.logger.log(`✅ Rolled back ${rollbackCount} products`);
    } catch (error) {
      this.logger.error(`❌ Rollback failed: ${error.message}`);
      throw error;
    }
  }
}