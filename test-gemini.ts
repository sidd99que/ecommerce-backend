// test-gemini.js
require('dotenv').config(); // This loads your .env file
import { GoogleGenerativeAI } from '@google/generative-ai';

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  
  const result = await model.generateContent('Say hello!');
  console.log('✅ API Key works!');
  console.log('Response:', result.response.text());
}

test().catch(err => {
  console.error('❌ Error:', err.message);
});