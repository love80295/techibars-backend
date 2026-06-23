// backend/controllers/aiController.js
import Solution from '../models/Solution.js';
import { generateWithFallback } from '../config/ai.js';

// ============================================================
// BUILD TOPIC DETECTION PROMPT
// ============================================================
function buildTopicDetectionPrompt(code, approach, problemTitle) {
    return `
You are a coding expert. Analyze this solution and identify the main data structures and algorithms used.

Problem: ${problemTitle || 'Unknown'}
Approach: ${approach || 'Not provided'}

Code:
\`\`\`
${code}
\`\`\`

IMPORTANT: Return ONLY a valid JSON object with EXACTLY this structure:
{
    "topics": ["Topic1", "Topic2"],
    "combined": "Topic1 + Topic2"
}

Available topics (choose from these, or add similar ones):
Array, Two Pointers, Sliding Window, Binary Search, Hash Table, Linked List, Stack, Queue, Heap, Graph, Tree, Trie, Dynamic Programming, Backtracking, Greedy, Sorting, String, Math, Bit Manipulation, Intervals, Recursion

If multiple topics are used, list them all. If only one, just list that one.
`;
}

// ============================================================
// BUILD EXPLANATION PROMPT
// ============================================================
function buildExplanationPrompt(solution) {
    const { problemTitle, difficulty, language, approach, code, timeComplexity, spaceComplexity } = solution;
    
    return `
You are a coding mentor. Explain this solution in a way that helps a student understand it thoroughly.

Problem: ${problemTitle || 'Unknown'}
Difficulty: ${difficulty || 'Medium'}
Language: ${language || 'Unknown'}
Approach: ${approach || 'Not provided'}
Time Complexity: ${timeComplexity || 'Unknown'}
Space Complexity: ${spaceComplexity || 'Unknown'}

Code:
\`\`\`
${code}
\`\`\`

Return ONLY a valid JSON object with EXACTLY this structure:
{
    "summary": "A brief 2-3 sentence summary of the solution",
    "steps": [
        {"step": 1, "description": "First step of the algorithm"},
        {"step": 2, "description": "Second step of the algorithm"}
    ],
    "insights": [
        "Key insight 1 about this solution",
        "Key insight 2 about this solution"
    ],
    "tips": [
        "Helpful tip 1 for solving similar problems",
        "Helpful tip 2 for solving similar problems"
    ]
}

Make sure the steps are clear and logical. The summary should be concise but informative.
`;
}

// ============================================================
// DETECT TOPICS (API Endpoint)
// ============================================================
export const detectTopics = async (req, res) => {
    try {
        const { code, approach, problemTitle } = req.body;
        
        if (!code) {
            return res.status(400).json({ 
                success: false, 
                message: 'Code is required' 
            });
        }

        console.log('🔍 Detecting topics for:', problemTitle || 'Untitled');

        const prompt = buildTopicDetectionPrompt(code, approach, problemTitle);
        const result = await generateWithFallback(prompt);

        if (!result.success) {
            return res.status(503).json({
                success: false,
                message: 'AI service temporarily unavailable',
                errors: result.errors
            });
        }

        // Clean and parse the AI response
        let cleanResponse = result.data
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim();

        const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No valid JSON found in AI response');
        }

        const parsed = JSON.parse(jsonMatch[0]);
        
        if (!parsed.topics || !Array.isArray(parsed.topics) || parsed.topics.length === 0) {
            parsed.topics = ['General'];
            parsed.combined = 'General';
        }

        console.log('✅ Topics detected:', parsed.topics);

        res.json({
            success: true,
            provider: result.provider,
            data: {
                topics: parsed.topics,
                combined: parsed.combined || parsed.topics.join(' + ')
            }
        });

    } catch (error) {
        console.error('❌ Topic detection error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// ============================================================
// EXPLAIN SOLUTION (API Endpoint)
// ============================================================
export const explainSolution = async (req, res) => {
    try {
        const { solutionId } = req.params;
        
        const solution = await Solution.findById(solutionId)
            .populate('platform', 'name')
            .populate('author', 'name');
            
        if (!solution) {
            return res.status(404).json({ 
                success: false, 
                message: 'Solution not found' 
            });
        }

        // Check cache
        if (solution.aiExplanation && solution.aiExplanation.summary) {
            console.log('📦 Using cached explanation for:', solution.problemTitle);
            return res.json({
                success: true,
                cached: true,
                data: solution.aiExplanation
            });
        }

        console.log('🧠 Generating explanation for:', solution.problemTitle);

        const prompt = buildExplanationPrompt(solution);
        const result = await generateWithFallback(prompt);

        if (!result.success) {
            return res.status(503).json({
                success: false,
                message: 'AI service temporarily unavailable',
                errors: result.errors
            });
        }

        let cleanResponse = result.data
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim();

        const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No valid JSON found in AI response');
        }

        const parsed = JSON.parse(jsonMatch[0]);
        
        const explanation = {
            summary: parsed.summary || 'Solution explanation not available.',
            steps: parsed.steps || [{ step: 1, description: 'See the approach section for details.' }],
            insights: parsed.insights || ['Check the approach section for more details.'],
            tips: parsed.tips || ['Practice similar problems to master this technique.'],
            generatedAt: new Date()
        };

        // Cache in database
        solution.aiExplanation = explanation;
        await solution.save();

        console.log('✅ Explanation generated and cached');

        res.json({
            success: true,
            cached: false,
            provider: result.provider,
            data: explanation
        });

    } catch (error) {
        console.error('❌ Explanation error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// ============================================================
// GET AI STATUS (Admin)
// ============================================================
export const getAIStatus = async (req, res) => {
    try {
        const providers = [
            {
                name: 'gemini',
                configured: !!process.env.GEMINI_API_KEY,
                model: process.env.GEMINI_MODEL || 'gemini-2.5-flash'
            },
            {
                name: 'groq',
                configured: !!process.env.GROQ_API_KEY,
                model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant'
            }
        ];
        
        res.json({
            success: true,
            providers,
            defaultOrder: ['gemini', 'groq']
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};