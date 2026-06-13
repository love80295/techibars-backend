import Platform from '../models/Platform.js';

// Get all platforms
export const getPlatforms = async (req, res) => {
  try {
    const platforms = await Platform.find({ active: true }).sort({ name: 1 });
    res.json({ success: true, data: platforms });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single platform by slug
export const getPlatformBySlug = async (req, res) => {
  try {
    const platform = await Platform.findOne({ slug: req.params.slug });
    if (!platform) {
      return res.status(404).json({ success: false, message: 'Platform not found' });
    }
    res.json({ success: true, data: platform });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create platform (Admin only)
export const createPlatform = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin only' });
    }
    const platform = await Platform.create(req.body);
    res.status(201).json({ success: true, data: platform });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};