// src/search/search.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from '@models/product.model';

// ─────────────────────────────────────────
// DTOs
// ─────────────────────────────────────────
interface SearchDto {
  q?: string;
  page?: number;
  limit?: number;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  featured?: boolean;
  onSale?: boolean;
  sort?: string;
}

interface ProductFilter {
  status: string;
  'category._id'?: Types.ObjectId;
  'category.name'?: RegExp;
  'brand._id'?: Types.ObjectId;
  'brand.name'?: RegExp;
  'price.current'?: { $gte?: number; $lte?: number };
  stock?: { $gt: number };
  featured?: boolean;
  isDiscounted?: boolean;
  discountPercentage?: { $gt: number };
  $text?: { $search: string };
  $and?: any[];
  $or?: any[];
}

// ─────────────────────────────────────────
// Constants
// ─────────────────────────────────────────

// Minimum textScore to be considered relevant.
// MongoDB textScore: name(weight=10) exact match ≈ 1.1–2.0, partial ≈ 0.5–1.0
// Anything below 0.6 is likely noise / coincidental match
const MIN_RELEVANCE_SCORE = 0.6;

// Stop words — stripped before search
const STOP_WORDS = new Set([
  'for', 'my', 'the', 'a', 'an', 'of', 'to', 'in', 'on', 'and', 'or',
  'is', 'with', 'by', 'at', 'from', 'as', 'this', 'that', 'it', 'be',
  'are', 'can', 'i', 'me', 'we', 'us', 'get', 'want', 'need', 'buy',
]);

// Synonym map — ONLY expands when the keyword is very specific
// Key = user's word, Value = list of equivalent terms to OR-search
const SYNONYM_MAP = new Map<string, string[]>([
  ['girl',   ['girl', 'girls', 'women', 'ladies']],
  ['girls',  ['girls', 'girl', 'women', 'ladies']],
  ['women',  ['women', 'woman', 'girls', 'ladies']],
  ['woman',  ['women', 'woman', 'girls', 'ladies']],
  ['ladies', ['ladies', 'women', 'girls']],
  ['men',    ['men', 'man', 'male', 'gents']],
  ['man',    ['man', 'men', 'male', 'gents']],
  ['boy',    ['boy', 'boys', 'men', 'male']],
  ['boys',   ['boys', 'boy', 'men', 'male']],
  ['kids',   ['kids', 'children', 'child', 'boy', 'girl', 'boys', 'girls']],
  ['child',  ['child', 'children', 'kids', 'baby']],
  ['baby',   ['baby', 'infant', 'toddler', 'kids']],
  ['cap',    ['cap', 'caps', 'hat', 'hats']],
  ['hat',    ['hat', 'hats', 'cap', 'caps']],
  ['shoe',   ['shoe', 'shoes', 'sneaker', 'sneakers', 'footwear']],
  ['shoes',  ['shoes', 'shoe', 'sneakers', 'footwear']],
  ['bag',    ['bag', 'bags', 'handbag', 'purse', 'tote']],
  ['suit',   ['suit', 'suits', 'blazer', 'formal']],
  ['dress',  ['dress', 'dresses', 'frock', 'gown']],
  ['shirt',  ['shirt', 'shirts', 'top', 'tee', 't-shirt']],
  ['pant',   ['pant', 'pants', 'trouser', 'trousers']],
  ['watch',  ['watch', 'watches', 'timepiece']],
]);

// Gender intent detection — maps keywords to category regex
const GENDER_INTENT: Array<{
  keywords: string[];
  categoryRegex: RegExp;
  genderValues: string[];
}> = [
  {
    keywords: ['girl', 'girls', 'women', 'woman', 'ladies', 'female'],
    categoryRegex: /women|girl|girls|ladies|female/i,
    genderValues: ['women', 'girls', 'female', 'ladies'],
  },
  {
    keywords: ['men', 'man', 'male', 'boy', 'boys', 'gents', 'gentlemen'],
    categoryRegex: /men|boy|boys|male|gents/i,
    genderValues: ['men', 'boys', 'male'],
  },
  {
    keywords: ['kids', 'children', 'child', 'baby', 'infant', 'toddler'],
    categoryRegex: /kids|children|child|baby|infant/i,
    genderValues: ['kids', 'children', 'baby'],
  },
];

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  // ─────────────────────────────────────────
  // PUBLIC: Main search entry point
  // ─────────────────────────────────────────
  async search(dto: SearchDto) {
    try {
      if (!dto.q?.trim()) {
        return await this.filterSearch(dto);
      }
      return await this.smartSearch(dto);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Search failed: ${err.message}`, err.stack);
      throw err;
    }
  }

  // ─────────────────────────────────────────
  // PUBLIC: Suggestions / Autocomplete
  // ─────────────────────────────────────────
  async getSuggestions(query: string, limit = 8) {
    if (!query?.trim() || query.trim().length < 2) {
      return { success: true, suggestions: [] };
    }

    try {
      const { keywords, genderKeywords } = this.parseQuery(query.trim());

      // Build a focused text search — name + brand only (not description)
      // This avoids description noise in suggestions
      const searchTerm = this.buildSearchTerm(keywords);

      if (!searchTerm) {
        return { success: true, suggestions: [] };
      }

      const filter: any = {
        status: 'active',
        $text: { $search: searchTerm },
      };

      // Apply gender filter only when query has explicit gender intent
      const genderFilter = this.buildGenderFilter(genderKeywords);
      if (genderFilter) {
        filter.$and = [genderFilter];
      }

      const products = await this.productModel
        .find(filter, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } } as any)
        .select('name brand category variants images price _id subCategory')
        .limit(limit * 2) // fetch extra to filter by score
        .lean()
        .exec();

      // Filter by minimum relevance score
      const relevant = products.filter((p: any) => p.score >= MIN_RELEVANCE_SCORE);
      const final = (relevant.length > 0 ? relevant : products).slice(0, limit);

      // Fallback to regex if nothing found
      if (final.length === 0) {
        return this.regexSuggestions(query.trim(), genderKeywords, limit);
      }

      return {
        success: true,
        suggestions: final.map(this.mapSuggestion),
      };
    } catch (error) {
      this.logger.error(`Suggestions failed: ${error}`);
      return { success: false, suggestions: [] };
    }
  }

  // ─────────────────────────────────────────
  // PRIVATE: Smart text search (Zara-like)
  // ─────────────────────────────────────────
  private async smartSearch(dto: SearchDto) {
    const { q, page = 1, limit = 20, sort = 'relevance' } = dto;
    const skip = (page - 1) * limit;

    // Step 1: Parse query into product keywords + gender keywords separately
    const { keywords, genderKeywords, productKeywords } = this.parseQuery(q!.trim());

    // Step 2: Build search term from product keywords only
    // (gender words are handled via category filter, not text search)
    const searchTerm = this.buildSearchTerm(productKeywords.length > 0 ? productKeywords : keywords);

    if (!searchTerm) {
      return this.filterSearch(dto);
    }

    // Step 3: Build base filter
    const baseFilter = this.buildFilter(dto);

    const filter: any = {
      ...baseFilter,
      $text: { $search: searchTerm },
    };

    // Step 4: Apply strict gender/category filter when gender intent detected
    const genderFilter = this.buildGenderFilter(genderKeywords);
    if (genderFilter) {
      filter.$and = filter.$and ? [...filter.$and, genderFilter] : [genderFilter];
    }

    const useRelevance = sort === 'relevance';
    const projection = useRelevance ? { score: { $meta: 'textScore' } } : {};
    const sortQuery = useRelevance
      ? ({ score: { $meta: 'textScore' } } as any)
      : this.buildSortQuery(sort);

    // Step 5: Execute text search
    let [rawResults, total] = await Promise.all([
      this.productModel
        .find(filter, projection)
        .sort(sortQuery)
        .skip(skip)
        .limit(limit * 2) // fetch extra for score filtering
        .lean()
        .exec(),
      this.productModel.countDocuments(filter).exec(),
    ]);

    // Step 6: Filter by minimum relevance score (KEY: removes garbage results)
    if (useRelevance) {
      const filtered = rawResults.filter((p: any) => p.score >= MIN_RELEVANCE_SCORE);
      // If filtering removed too many, lower the bar slightly before fallback
      rawResults = filtered.length > 0 ? filtered : rawResults.filter((p: any) => p.score >= 0.3);
    }

    const results = rawResults.slice(0, limit);

    // Step 7: Fallback if still no results
    if (results.length === 0) {
      this.logger.log(`Text search returned 0 results for "${q}". Trying regex fallback...`);
      return this.regexSearch(dto, keywords, genderKeywords);
    }

    return {
      success: true,
      type: 'search',
      query: q,
      data: results,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    };
  }

  // ─────────────────────────────────────────
  // PRIVATE: Parse query into keyword groups
  // ─────────────────────────────────────────
  private parseQuery(query: string): {
    keywords: string[];        // all meaningful keywords
    genderKeywords: string[];  // words that indicate gender intent
    productKeywords: string[]; // non-gender product keywords
  } {
    const words = query
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 1 && !STOP_WORDS.has(w));

    const genderKeywords: string[] = [];
    const productKeywords: string[] = [];

    for (const word of words) {
      const isGender = GENDER_INTENT.some(g => g.keywords.includes(word));
      if (isGender) {
        genderKeywords.push(word);
      } else {
        productKeywords.push(word);
      }
    }

    return { keywords: words, genderKeywords, productKeywords };
  }

  // ─────────────────────────────────────────
  // PRIVATE: Build MongoDB $text search string
  // Expands synonyms where applicable
  // ─────────────────────────────────────────
  private buildSearchTerm(keywords: string[]): string {
    if (!keywords.length) return '';

    const expanded = new Set<string>();

    for (const word of keywords) {
      const synonyms = SYNONYM_MAP.get(word);
      if (synonyms) {
        // Use quoted phrases for exact synonym matching to avoid noise
        synonyms.forEach(s => expanded.add(s));
      } else {
        expanded.add(word);
      }
    }

    // MongoDB $text search: wrap multi-word phrases in quotes for exactness
    // Single words are left as-is for partial index matching
    return Array.from(expanded).join(' ');
  }

  // ─────────────────────────────────────────
  // PRIVATE: Build gender/category filter
  // Only applied when query has clear gender intent
  // ─────────────────────────────────────────
  private buildGenderFilter(genderKeywords: string[]): any | null {
    if (!genderKeywords.length) return null;

    // Find which gender intents match
    const matchedIntents = GENDER_INTENT.filter(g =>
      genderKeywords.some(kw => g.keywords.includes(kw))
    );

    if (!matchedIntents.length) return null;

    // Build OR conditions for each matched intent
    const orConditions: any[] = [];

    for (const intent of matchedIntents) {
      orConditions.push(
        { 'category.name': { $regex: intent.categoryRegex } },
        { subCategory: { $regex: intent.categoryRegex } },
      );
      // If product has gender field
      if (intent.genderValues.length) {
        orConditions.push({ gender: { $in: intent.genderValues } });
      }
    }

    return { $or: orConditions };
  }

  // ─────────────────────────────────────────
  // PRIVATE: Regex fallback search (full search)
  // ─────────────────────────────────────────
  private async regexSearch(dto: SearchDto, keywords: string[], genderKeywords: string[]) {
    const { page = 1, limit = 20, sort = 'relevance' } = dto;
    const skip = (page - 1) * limit;

    // Only use meaningful product keywords for regex — not gender words
    const productKeywords = keywords.filter(
      kw => !GENDER_INTENT.some(g => g.keywords.includes(kw))
    );

    const searchWords = productKeywords.length > 0 ? productKeywords : keywords;

    // Each keyword must appear in at least one field (AND between keywords)
    const keywordConditions = searchWords.map(kw => ({
      $or: [
        { name: { $regex: kw, $options: 'i' } },
        { 'brand.name': { $regex: kw, $options: 'i' } },
        { 'category.name': { $regex: kw, $options: 'i' } },
        { subCategory: { $regex: kw, $options: 'i' } },
        { searchKeywords: { $regex: kw, $options: 'i' } },
        { description: { $regex: kw, $options: 'i' } },
      ],
    }));

    const filter: any = {
      ...this.buildFilter(dto),
      $and: keywordConditions,
    };

    // Also apply gender filter in fallback
    const genderFilter = this.buildGenderFilter(genderKeywords);
    if (genderFilter) {
      filter.$and = [...(filter.$and || []), genderFilter];
    }

    const [results, total] = await Promise.all([
      this.productModel
        .find(filter)
        .sort(this.buildSortQuery(sort))
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.productModel.countDocuments(filter).exec(),
    ]);

    return {
      success: true,
      type: 'search',
      query: dto.q,
      data: results,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    };
  }

  // ─────────────────────────────────────────
  // PRIVATE: Regex fallback for suggestions
  // ─────────────────────────────────────────
  private async regexSuggestions(query: string, genderKeywords: string[], limit: number) {
    const filter: any = {
      status: 'active',
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { 'brand.name': { $regex: query, $options: 'i' } },
        { subCategory: { $regex: query, $options: 'i' } },
        { searchKeywords: { $elemMatch: { $regex: query, $options: 'i' } } },
      ],
    };

    const genderFilter = this.buildGenderFilter(genderKeywords);
    if (genderFilter) {
      filter.$and = [genderFilter];
    }

    const products = await this.productModel
      .find(filter)
      .select('name brand category variants images price _id subCategory')
      .limit(limit)
      .lean()
      .exec();

    return {
      success: true,
      suggestions: products.map(this.mapSuggestion),
    };
  }

  // ─────────────────────────────────────────
  // PRIVATE: Filter-only search (no query)
  // ─────────────────────────────────────────
  private async filterSearch(dto: SearchDto) {
    const { page = 1, limit = 20, sort = 'newest' } = dto;
    const skip = (page - 1) * limit;
    const filter = this.buildFilter(dto);

    const [products, total] = await Promise.all([
      this.productModel
        .find(filter)
        .sort(this.buildSortQuery(sort))
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.productModel.countDocuments(filter).exec(),
    ]);

    return {
      success: true,
      type: 'filter',
      data: products,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    };
  }

  // ─────────────────────────────────────────
  // PRIVATE: Build base MongoDB filter
  // ─────────────────────────────────────────
  private buildFilter(dto: SearchDto): ProductFilter {
    const filter: ProductFilter = { status: 'active' };

    if (dto.category) {
      if (Types.ObjectId.isValid(dto.category)) {
        filter['category._id'] = new Types.ObjectId(dto.category);
      } else {
        filter['category.name'] = new RegExp(dto.category, 'i');
      }
    }

    if (dto.brand) {
      if (Types.ObjectId.isValid(dto.brand)) {
        filter['brand._id'] = new Types.ObjectId(dto.brand);
      } else {
        filter['brand.name'] = new RegExp(dto.brand, 'i');
      }
    }

    if (dto.minPrice !== undefined || dto.maxPrice !== undefined) {
      filter['price.current'] = {};
      if (dto.minPrice !== undefined) filter['price.current'].$gte = dto.minPrice;
      if (dto.maxPrice !== undefined) filter['price.current'].$lte = dto.maxPrice;
    }

    if (dto.inStock === true) filter.stock = { $gt: 0 };
    if (dto.featured === true) filter.featured = true;
    if (dto.onSale === true) {
      filter.isDiscounted = true;
      filter.discountPercentage = { $gt: 0 };
    }

    return filter;
  }

  // ─────────────────────────────────────────
  // PRIVATE: Sort query builder
  // ─────────────────────────────────────────
  private buildSortQuery(sort: string): Record<string, 1 | -1> {
    const sortMap: Record<string, Record<string, 1 | -1>> = {
      'price-asc':  { 'price.current': 1 },
      'price-desc': { 'price.current': -1 },
      newest:       { arrivalDate: -1 },
      popular:      { 'metrics.popularityScore': -1 },
      rating:       { 'metrics.rating': -1 },
    };
    return sortMap[sort] ?? { arrivalDate: -1 };
  }

  // ─────────────────────────────────────────
  // PRIVATE: Map product to suggestion shape
  // ─────────────────────────────────────────
  private mapSuggestion(p: any) {
    return {
      id: p._id,
      name: p.name,
      brand: p.brand?.name ?? '',
      category: p.category?.name ?? p.subCategory ?? '',
      image: p.variants?.[0]?.images?.[0] ?? p.images?.[0] ?? '',
      price: p.price,
    };
  }
}