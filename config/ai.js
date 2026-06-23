// backend/config/ai.js
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';

dotenv.config();

// ============================================================
// 1. GOOGLE GEMINI - NOW WORKING!
// ============================================================
export const geminiAI = {
    init: () => {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.warn('⚠️ GEMINI_API_KEY not found in .env');
            return null;
        }
        const genAI = new GoogleGenerativeAI(apiKey);
        return genAI.getGenerativeModel({ 
            model: process.env.GEMINI_MODEL || 'gemini-2.5-flash'  // ✅ Updated default
        });
    },
    
    generate: async (prompt) => {
        try {
            const model = geminiAI.init();
            if (!model) throw new Error('Gemini not configured');
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error('❌ Gemini error:', error.message);
            throw error;
        }
    }
};

// ============================================================
// 2. GROQ - WORKING
// ============================================================
export const groqAI = {
    init: () => {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            console.warn('⚠️ GROQ_API_KEY not found in .env');
            return null;
        }
        return {
            apiKey,
            model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant'  // ✅ Updated default
        };
    },
    
    generate: async (prompt) => {
        try {
            const config = groqAI.init();
            if (!config) throw new Error('Groq not configured');
            
            const response = await axios.post(
                'https://api.groq.com/openai/v1/chat/completions',
                {
                    model: config.model,
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.3,
                    max_tokens: 800
                },
                {
                    headers: {
                        'Authorization': `Bearer ${config.apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000
                }
            );
            
            return response.data.choices[0]?.message?.content || '';
        } catch (error) {
            console.error('❌ Groq error:', error.message);
            throw error;
        }
    }
};

// ============================================================
// 3. MASTER CONTROLLER - Try Gemini first, then Groq
// ============================================================
export const AI_PROVIDERS = [
    { name: 'gemini', client: geminiAI },
    { name: 'groq', client: groqAI }
];

export async function generateWithFallback(prompt, maxAttempts = 2) {
    const errors = [];
    
    for (let i = 0; i < Math.min(maxAttempts, AI_PROVIDERS.length); i++) {
        const provider = AI_PROVIDERS[i];
        try {
            console.log(`🔄 Trying ${provider.name}...`);
            const result = await provider.client.generate(prompt);
            if (result && result.length > 10) {
                console.log(`✅ ${provider.name} succeeded!`);
                return { success: true, provider: provider.name, data: result };
            }
        } catch (error) {
            console.error(`❌ ${provider.name} failed:`, error.message);
            errors.push({ provider: provider.name, error: error.message });
        }
    }
    
    return { 
        success: false, 
        errors,
        message: 'All AI providers failed'
    };
}

// ============================================================
// 4. TEST FUNCTION
// ============================================================
async function testAI() {
    console.log('🧪 Testing AI Providers...\n');
    
    const testPrompt = 'Say "Hello, Techibars! AI is working!" in one sentence.';
    
    const result = await generateWithFallback(testPrompt);
    
    if (result.success) {
        console.log(`\n✅ SUCCESS! Provider: ${result.provider}`);
        console.log(`📝 Response: ${result.data}`);
    } else {
        console.log('\n❌ All providers failed:');
        result.errors.forEach(e => {
            console.log(`   - ${e.provider}: ${e.error}`);
        });
    }
}

// If run directly: node config/ai.js
if (import.meta.url === `file://${process.argv[1]}`) {
    testAI();
}

export default { geminiAI, groqAI, generateWithFallback, AI_PROVIDERS };