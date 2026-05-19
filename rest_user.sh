#!/bin/bash

echo "🔄 Resetting user..."

# Delete the user from MongoDB
mongosh blogdb --eval 'db.users.deleteOne({email: "john@example.com"})' > /dev/null 2>&1

echo "✅ Deleted old user"

# Create new user
echo "📝 Creating new user..."
SIGNUP_RESPONSE=$(curl -s -X POST http://localhost:5001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }')

# Check if signup worked
if echo "$SIGNUP_RESPONSE" | grep -q "token"; then
    echo "✅ Signup successful!"
    TOKEN=$(echo "$SIGNUP_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    echo "✅ Token obtained"
    echo ""
    echo "Your token:"
    echo "$TOKEN"
    echo ""
    echo "Save this token for creating blogs"
else
    echo "❌ Signup failed:"
    echo "$SIGNUP_RESPONSE"
fi