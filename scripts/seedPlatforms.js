import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Platform from '../models/Platform.js';

dotenv.config();

const platforms = [
  { name: 'LeetCode', slug: 'leetcode', logo: '📘', color: '#FFA116', baseUrl: 'https://leetcode.com/problems/' },
  { name: 'HackerRank', slug: 'hackerrank', logo: '📗', color: '#2EC866', baseUrl: 'https://www.hackerrank.com/challenges/' },
  { name: 'CodeChef', slug: 'codechef', logo: '📙', color: '#5B4638', baseUrl: 'https://www.codechef.com/problems/' },
  { name: 'CodeForces', slug: 'codeforces', logo: '📕', color: '#1E88E5', baseUrl: 'https://codeforces.com/problemset/problem/' },
  { name: 'GeeksForGeeks', slug: 'geeksforgeeks', logo: '📒', color: '#2F8D46', baseUrl: 'https://practice.geeksforgeeks.org/problems/' }
];

async function seedPlatforms() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    await Platform.deleteMany({});
    await Platform.insertMany(platforms);
    console.log('Platforms seeded successfully!');
    
    process.exit();
  } catch (error) {
    console.error('Error seeding platforms:', error);
    process.exit(1);
  }
}

seedPlatforms();