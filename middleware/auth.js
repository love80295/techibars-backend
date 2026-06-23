import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      
      // ✅ Debug log to verify role is being set
      console.log('🔐 User authenticated:');
      console.log('   - ID:', req.user?._id);
      console.log('   - Name:', req.user?.name);
      console.log('   - Email:', req.user?.email);
      console.log('   - Role:', req.user?.role);
      
      next();
    } catch (error) {
      console.error('❌ Auth error:', error.message);
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
};

export const admin = (req, res, next) => {
  console.log('🔍 Admin check - User role:', req.user?.role);
  
  if (req.user && req.user.role === 'admin') {
    console.log('✅ Admin access granted');
    next();
  } else {
    console.log('❌ Admin access denied - User role:', req.user?.role);
    res.status(403).json({ success: false, message: 'Admin access required' });
  }
};