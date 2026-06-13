import Solution from '../models/Solution.js';
import Platform from '../models/Platform.js';
import User from '../models/User.js';

// Get all solutions with filters
export const getSolutions = async (req, res) => {
  try {
    const { platform, difficulty, language, search, sortBy = 'averageRating', limit = 20 } = req.query;
    
    let filter = { isApproved: true };
    if (platform) filter.platform = platform;
    if (difficulty) filter.difficulty = difficulty;
    if (language) filter.language = language;
    if (search) {
      filter.$text = { $search: search };
    }
    
    let sort = {};
    if (sortBy === 'averageRating') sort = { averageRating: -1 };
    if (sortBy === 'newest') sort = { createdAt: -1 };
    if (sortBy === 'mostViewed') sort = { views: -1 };
    if (sortBy === 'mostUpvoted') sort = { upvotes: -1 };
    
    const solutions = await Solution.find(filter)
      .populate('platform', 'name slug color')
      .populate('author', 'name email')
      .sort(sort)
      .limit(parseInt(limit));
      
    res.json({ success: true, data: solutions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single solution by ID
export const getSolutionById = async (req, res) => {
  try {
    const solution = await Solution.findById(req.params.id)
      .populate('platform', 'name slug color')
      .populate('author', 'name email')
      .populate('comments.user', 'name email');
      
    if (!solution) {
      return res.status(404).json({ success: false, message: 'Solution not found' });
    }
    
    // Increment views
    solution.views += 1;
    await solution.save();
    
    res.json({ success: true, data: solution });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create new solution
export const createSolution = async (req, res) => {
  try {
    const { platform, problemId, problemTitle, problemUrl, difficulty, approach, code, language, timeComplexity, spaceComplexity, tags } = req.body;
    
    // Validate required fields
    if (!platform || !problemId || !problemTitle || !approach || !code || !language) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: platform, problemId, problemTitle, approach, code, language' 
      });
    }
    
    const solution = await Solution.create({
      platform,
      problemId,
      problemTitle,
      problemUrl: problemUrl || '',
      difficulty: difficulty || 'Medium',
      approach,
      code,
      language,
      timeComplexity: timeComplexity || '',
      spaceComplexity: spaceComplexity || '',
      tags: tags || [],
      author: req.user._id
    });
    
    // Update platform solution count
    await Platform.findByIdAndUpdate(platform, {
      $inc: { solutionCount: 1 }
    });
    
    res.status(201).json({ success: true, data: solution, message: 'Solution submitted successfully' });
  } catch (error) {
    console.error('Create solution error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Rate a solution (1-5 stars)
export const rateSolution = async (req, res) => {
  try {
    const { score } = req.body;
    const solution = await Solution.findById(req.params.id);
    
    if (!solution) {
      return res.status(404).json({ success: false, message: 'Solution not found' });
    }
    
    // Validate score
    if (!score || score < 1 || score > 5) {
      return res.status(400).json({ success: false, message: 'Score must be between 1 and 5' });
    }
    
    // Check if user already rated
    const existingRating = solution.ratings.find(r => 
      r.user.toString() === req.user._id.toString()
    );
    
    if (existingRating) {
      existingRating.score = score;
    } else {
      solution.ratings.push({ user: req.user._id, score });
    }
    
    // Recalculate average
    const total = solution.ratings.reduce((sum, r) => sum + r.score, 0);
    solution.averageRating = total / solution.ratings.length;
    
    await solution.save();
    res.json({ success: true, averageRating: solution.averageRating });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Upvote solution
export const upvoteSolution = async (req, res) => {
  try {
    const solution = await Solution.findById(req.params.id);
    const userId = req.user._id;
    
    if (!solution) {
      return res.status(404).json({ success: false, message: 'Solution not found' });
    }
    
    if (solution.upvotes.includes(userId)) {
      solution.upvotes = solution.upvotes.filter(id => id.toString() !== userId.toString());
    } else {
      solution.upvotes.push(userId);
      solution.downvotes = solution.downvotes.filter(id => id.toString() !== userId.toString());
    }
    
    await solution.save();
    res.json({ success: true, upvotes: solution.upvotes.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Downvote solution
export const downvoteSolution = async (req, res) => {
  try {
    const solution = await Solution.findById(req.params.id);
    const userId = req.user._id;
    
    if (!solution) {
      return res.status(404).json({ success: false, message: 'Solution not found' });
    }
    
    if (solution.downvotes.includes(userId)) {
      solution.downvotes = solution.downvotes.filter(id => id.toString() !== userId.toString());
    } else {
      solution.downvotes.push(userId);
      solution.upvotes = solution.upvotes.filter(id => id.toString() !== userId.toString());
    }
    
    await solution.save();
    res.json({ success: true, downvotes: solution.downvotes.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add comment to solution
export const addComment = async (req, res) => {
  try {
    const { content } = req.body;
    const solution = await Solution.findById(req.params.id);
    
    if (!solution) {
      return res.status(404).json({ success: false, message: 'Solution not found' });
    }
    
    if (!content || content.trim() === '') {
      return res.status(400).json({ success: false, message: 'Comment content is required' });
    }
    
    solution.comments.push({
      user: req.user._id,
      content: content.trim(),
      createdAt: new Date()
    });
    
    await solution.save();
    await solution.populate('comments.user', 'name email');
    
    res.status(201).json({ success: true, data: solution.comments[solution.comments.length - 1] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Bookmark solution
export const bookmarkSolution = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const solutionId = req.params.id;
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    if (user.bookmarkedSolutions.includes(solutionId)) {
      user.bookmarkedSolutions = user.bookmarkedSolutions.filter(id => id.toString() !== solutionId);
      await user.save();
      res.json({ success: true, bookmarked: false, message: 'Removed from bookmarks' });
    } else {
      user.bookmarkedSolutions.push(solutionId);
      await user.save();
      res.json({ success: true, bookmarked: true, message: 'Added to bookmarks' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get user's bookmarked solutions
export const getBookmarkedSolutions = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'bookmarkedSolutions',
      populate: { path: 'platform', select: 'name slug color' }
    });
    res.json({ success: true, data: user.bookmarkedSolutions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Complexity analyzer (pattern-based detection)
export const analyzeComplexity = async (req, res) => {
  try {
    const { code, language } = req.body;
    
    if (!code) {
      return res.status(400).json({ success: false, message: 'Code is required' });
    }
    
    // Simple pattern-based complexity detection
    let timeComplexity = "O(n)";
    let spaceComplexity = "O(1)";
    let explanation = "";
    
    // Remove comments for better pattern detection
    const cleanCode = code.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    
    // Count loops
    const singleLoopCount = (cleanCode.match(/for\s*\([^)]*\)\s*\{/g) || []).length;
    const whileLoopCount = (cleanCode.match(/while\s*\([^)]*\)\s*\{/g) || []).length;
    const nestedLoopCount = (cleanCode.match(/for\s*\([^)]*\)\s*\{[\s\S]*?for\s*\([^)]*\)\s*\{/g) || []).length;
    
    // Detect time complexity
    if (nestedLoopCount > 0) {
      timeComplexity = "O(n²)";
      explanation = "Nested loops detected";
    } else if ((singleLoopCount + whileLoopCount) > 1) {
      timeComplexity = "O(n)";
      explanation = "Multiple sequential loops (O(n) each, total O(n))";
    } else if ((singleLoopCount + whileLoopCount) === 1) {
      timeComplexity = "O(n)";
      explanation = "Single loop detected";
    } else {
      const hasRecursion = /function\s+\w+\s*\([^)]*\)\s*\{[\s\S]*?\1\s*\(/g.test(cleanCode);
      if (hasRecursion) {
        timeComplexity = "O(2^n)";
        explanation = "Recursion detected (may be exponential)";
      } else {
        timeComplexity = "O(1)";
        explanation = "No loops detected - constant time";
      }
    }
    
    // Detect space complexity
    const hasArray = /new\s+Array\(|\[[^\]]*\]/g.test(cleanCode);
    const hasHashSet = /Set\(|new\s+Set\(/g.test(cleanCode);
    const hasHashMap = /Map\(|new\s+Map\(|\{\}[^=]|dict\(/g.test(cleanCode);
    const hasMatrix = /\[\[\]\]|new\s+Array\([^)]*\)\.fill\([^)]*\)\.map/g.test(cleanCode);
    const hasRecursionStack = /function\s+\w+\s*\([^)]*\)\s*\{[\s\S]*?\1\s*\(/g.test(cleanCode);
    
    if (hasMatrix) {
      spaceComplexity = "O(n²)";
      explanation += " | Matrix/2D array detected";
    } else if (hasArray || hasHashSet || hasHashMap) {
      spaceComplexity = "O(n)";
      explanation += " | Auxiliary data structure detected";
    } else if (hasRecursionStack) {
      spaceComplexity = "O(n)";
      explanation += " | Recursion call stack usage";
    } else {
      spaceComplexity = "O(1)";
      explanation += " | Constant space";
    }
    
    res.json({
      success: true,
      timeComplexity,
      spaceComplexity,
      explanation: explanation.trim()
    });
  } catch (error) {
    console.error('Complexity analysis error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message,
      timeComplexity: "O(n)",
      spaceComplexity: "O(1)",
      explanation: "Could not analyze. Please enter manually."
    });
  }
};