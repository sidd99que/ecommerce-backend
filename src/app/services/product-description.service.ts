import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ProductDescriptionService {
  private genAI: GoogleGenerativeAI;
  private model;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    
    
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

 

  // Generate product title and description
  async generateProductContent(
    productName: string,
    features: string[]
  ): Promise<{ title: string; description: string }> {
    const featuresText = features.join(', ');

    const prompt = `You are an AI assistant for an eCommerce website. Generate a catchy product title and a 2-3 sentence product description.

Rules:
1. Keep the title short, attractive, and SEO-friendly.
2. Description should be 2-3 sentences, informative, and persuasive.
3. Mention the key features provided.
4. Use a friendly and professional tone.

Product Name: ${productName}
Features: ${featuresText}

Output Format:
Title: <generated title>
Description: <generated description>`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      
      return this.parseResponse(response);
    } catch (error) {
      throw new Error(`Failed to generate content: ${error.message}`);
    }
  }

  private parseResponse(response: string): { title: string; description: string } {
    const titleMatch = response.match(/Title:\s*(.+)/);
    const descMatch = response.match(/Description:\s*(.+(?:\n.+)*)/);

    return {
      title: titleMatch ? titleMatch[1].trim() : '',
      description: descMatch ? descMatch[1].trim().replace(/\n/g, ' ') : '',
    };
  }
}