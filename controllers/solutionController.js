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
    
    const solution = await Solution.create({
      platform,
      problemId,
      problemTitle,
      problemUrl,
      difficulty,
      approach,
      code,
      language,
      timeComplexity,
      spaceComplexity,
      tags: tags || [],
      author: req.user._id
    });
    
    // Update platform solution count
    await Platform.findByIdAndUpdate(platform, {
      $inc: { solutionCount: 1 }
    });
    
    res.status(201).json({ success: true, data: solution, message: 'Solution submitted for review' });
  } catch (error) {
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
    
    solution.comments.push({
      user: req.user._id,
      content,
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
    
    if (user.bookmarkedSolutions.includes(solutionId)) {
      user.bookmarkedSolutions = user.bookmarkedSolutions.filter(id => id.toString() !== solutionId);
    } else {
      user.bookmarkedSolutions.push(solutionId);
    }
    
    await user.save();
    res.json({ success: true, bookmarked: !user.bookmarkedSolutions.includes(solutionId) });
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

// Complexity analyzer (simple version)
export const analyzeComplexity = async (req, res) => {
  try {
    const { code, language } = req.body;
    
    // Simple pattern-based complexity detection
    let timeComplexity = "O(n)";
    let spaceComplexity = "O(1)";
    
    // Detect nested loops -> O(n²)
    const nestedLoopPattern = /for\s*\([^)]*\)\s*\{[\s\S]*?for\s*\([^)]*\)\s*\{/g;
    if (nestedLoopPattern.test(code)) {
      timeComplexity = "O(n²)";
    }
    
    // Detect while loop with division -> O(log n)
    const logPattern = /while\s*\([^)]*\/\s*2[^)]*\)/g;
    if (logPattern.test(code)) {
      timeComplexity = "O(log n)";
    }
    
    // Detect sorting -> O(n log n)
    const sortPattern = /sort\(|sorted\(/g;
    if (sortPattern.test(code)) {
      timeComplexity = "O(n log n)";
    }
    
    // Detect hash map usage -> O(n) space
    const hashPattern = /Map\(|HashMap\(|\{\}|dict\(/g;
    if (hashPattern.test(code)) {
      spaceComplexity = "O(n)";
    }
    
    // Detect 2D array -> O(n²) space
    const matrixPattern = /\[\[\]\]|new\s*Array\([^)]*\)\.fill\([^)]*\)\.map/g;
    if (matrixPattern.test(code)) {
      spaceComplexity = "O(n²)";
    }
    
    res.json({
      success: true,
      timeComplexity,
      spaceComplexity,
      explanation: `Analysis based on code patterns. Time: ${timeComplexity}, Space: ${spaceComplexity}`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};