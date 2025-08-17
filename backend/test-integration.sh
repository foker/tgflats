#!/bin/bash

# Test script for TBI-Prop integration

echo "🚀 Testing TBI-Prop Real Estate Integration"
echo "=========================================="

BASE_URL="http://localhost:3001/api"

# Function to make API call and format output
api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    
    echo ""
    echo "📍 Testing: $method $endpoint"
    
    if [ -z "$data" ]; then
        response=$(curl -s -X $method "$BASE_URL$endpoint")
    else
        response=$(curl -s -X $method "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    if [ $? -eq 0 ]; then
        echo "✅ Success"
        echo "$response" | jq '.' 2>/dev/null || echo "$response"
    else
        echo "❌ Failed"
    fi
}

# 1. Check health
api_call GET "/health"

# 2. Get parsing stats
api_call GET "/admin/parsing-stats"

# 3. Parse recent posts (small test)
echo ""
echo "📊 Starting test parse of 2 recent posts..."
api_call POST "/admin/parse-recent" '{"limit": 2}'

# 4. Check queue stats
api_call GET "/queues/stats"

# 5. Get system health
api_call GET "/admin/system-health"

echo ""
echo "=========================================="
echo "✨ Integration test complete!"
echo ""
echo "To run full initial parsing (100 posts per channel), run:"
echo "curl -X POST $BASE_URL/admin/parse-initial"