/**
 * List available models for the API key
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

const GOOGLE_API_KEY = 'AIzaSyAtaLYBku6EmcnFp8puSL8tGtqwgHw22Uk';
const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);

async function listModels() {
  try {
    console.log('\n🔍 Checking available models...\n');

    // Try to list models
    const models = await genAI.listModels();

    console.log('Available models:');
    for await (const model of models) {
      console.log(`- ${model.name}`);
      console.log(`  Display Name: ${model.displayName}`);
      console.log(`  Supported: ${model.supportedGenerationMethods.join(', ')}`);
      console.log('');
    }
  } catch (error) {
    console.error('Error listing models:', error.message);
  }
}

listModels();
