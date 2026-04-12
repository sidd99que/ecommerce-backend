import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';

dotenv.config();

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY not found in .env');
    return;
  }
  
  console.log('🔑 Testing API Key:', apiKey.substring(0, 10) + '...');
  
  const genAI = new GoogleGenerativeAI(apiKey);
  
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + apiKey);
    const data = await response.json();
    
    console.log('\n✅ Available Models:\n');
    
    for (const model of data.models) {
      console.log(`📦 Model: ${model.name}`);
      console.log(`   Display Name: ${model.displayName}`);
      console.log(`   Methods: ${model.supportedGenerationMethods.join(', ')}`);
      console.log('---');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

listModels();