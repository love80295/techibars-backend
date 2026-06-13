import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// 🔔 TELEGRAM NOTIFICATION FUNCTION
async function sendTelegramNotification(name, email) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    
    if (!botToken || !chatId) {
        console.log('⚠️ Telegram credentials not found in .env file');
        return;
    }
    
    const message = `🔔 *NEW USER SIGNUP!* 🔔\n\n👤 *Name:* ${name}\n📧 *Email:* ${email}\n⏰ *Time:* ${new Date().toLocaleString()}\n🌐 *Server:* Live`;
    
    try {
        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'Markdown'
            })
        });
        
        const data = await response.json();
        if (data.ok) {
            console.log('✅ Telegram notification sent successfully');
        } else {
            console.log('❌ Telegram failed:', data.description);
        }
    } catch (error) {
        console.error('Telegram error:', error.message);
    }
}

// 📝 SIGNUP FUNCTION
export const signup = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide name, email and password'
            });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Hash password with proper salt
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: email === 'loveagrawal80295@gmail.com' ? 'admin' : 'user'
        });

        // Send Telegram notification
        await sendTelegramNotification(name, email);

        const token = generateToken(user._id);
        
        user.password = undefined;

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: { user, token }
        });

    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create user',
            error: error.message
        });
    }
};

// 🔐 LOGIN FUNCTION
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Get user with password field
        const user = await User.findOne({ email }).select('+password');
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Compare password with try-catch
        let isMatch = false;
        try {
            isMatch = await bcrypt.compare(password, user.password);
        } catch (bcryptError) {
            console.error('Bcrypt compare error:', bcryptError);
            // If bcrypt fails, maybe password is not hashed? Try direct comparison
            if (user.password === password) {
                isMatch = true;
                // Rehash the password for future
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(password, salt);
                await User.updateOne({ _id: user._id }, { password: hashedPassword });
                console.log('Password rehashed for user:', email);
            }
        }
        
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const token = generateToken(user._id);
        user.password = undefined;

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: { user, token }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to login',
            error: error.message
        });
    }
};

// 👤 GET CURRENT USER
export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get profile',
            error: error.message
        });
    }
};

// 🔄 UPDATE USER ROLE (Admin only)
export const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        
        // Check if current user is admin
        const currentUser = await User.findById(req.user.id);
        if (currentUser.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }
        
        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role. Must be user or admin'
            });
        }
        
        const user = await User.findByIdAndUpdate(
            id,
            { role },
            { new: true }
        ).select('-password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.json({
            success: true,
            message: `User role updated to ${role}`,
            data: user
        });
    } catch (error) {
        console.error('Update role error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// 📊 GET ALL USERS (Admin only)
export const getAllUsers = async (req, res) => {
    try {
        const currentUser = await User.findById(req.user.id);
        if (currentUser.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }
        
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        
        res.json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};