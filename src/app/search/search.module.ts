import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Product, ProductSchema } from '@models/product.model';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
    ]),
  ],
  controllers: [SearchController],
  providers:   [SearchService],
  exports:     [SearchService],   // export in case other modules (e.g. ProductsModule) need it
})
export class SearchModule {}