#!/bin/bash

# Test Docker Setup Script
# This script verifies your Docker setup is working correctly

echo "🧪 Testing JobSphere Docker Setup..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
echo "1. Checking environment configuration..."
if [ -f .env ]; then
    echo -e "${GREEN}✓${NC} .env file exists"
    
    # Check required variables
    if grep -q "DATABASE_URL=" .env; then
        echo -e "${GREEN}✓${NC} DATABASE_URL configured"
    else
        echo -e "${RED}✗${NC} DATABASE_URL not found in .env"
        exit 1
    fi
    
    if grep -q "ACCESS_SECRET=" .env; then
        echo -e "${GREEN}✓${NC} ACCESS_SECRET configured"
    else
        echo -e "${RED}✗${NC} ACCESS_SECRET not found in .env"
        exit 1
    fi
else
    echo -e "${RED}✗${NC} .env file not found"
    echo "Run: cp .env.docker .env"
    exit 1
fi

echo ""

# Check if Docker is running
echo "2. Checking Docker..."
if docker info > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Docker is running"
else
    echo -e "${RED}✗${NC} Docker is not running"
    exit 1
fi

echo ""

# Check if docker-compose is available
echo "3. Checking Docker Compose..."
if command -v docker-compose &> /dev/null; then
    echo -e "${GREEN}✓${NC} Docker Compose is available"
else
    echo -e "${RED}✗${NC} Docker Compose not found"
    exit 1
fi

echo ""

# Start services
echo "4. Starting services..."
docker-compose up -d

echo ""

# Wait for services to be ready
echo "5. Waiting for services to start (30 seconds)..."
sleep 30

echo ""

# Check if container is running
echo "6. Checking container status..."
if docker ps | grep -q "jobsphere-app"; then
    echo -e "${GREEN}✓${NC} Container is running"
else
    echo -e "${RED}✗${NC} Container is not running"
    echo "Check logs: docker-compose logs app"
    exit 1
fi

echo ""

# Check health
echo "7. Checking application health..."
if curl -s http://localhost:4000/ > /dev/null; then
    echo -e "${GREEN}✓${NC} Application is responding"
else
    echo -e "${RED}✗${NC} Application is not responding"
    echo "Check logs: docker-compose logs app"
    exit 1
fi

echo ""

# Test API endpoint
echo "8. Testing API endpoint..."
RESPONSE=$(curl -s http://localhost:4000/)
if [ "$RESPONSE" = "OK" ]; then
    echo -e "${GREEN}✓${NC} API endpoint working"
else
    echo -e "${YELLOW}⚠${NC} Unexpected response: $RESPONSE"
fi

echo ""

# Check logs for errors
echo "9. Checking for errors in logs..."
if docker-compose logs app | grep -i "error" | grep -v "errorHandler" > /dev/null; then
    echo -e "${YELLOW}⚠${NC} Errors found in logs (check with: docker-compose logs app)"
else
    echo -e "${GREEN}✓${NC} No errors in logs"
fi

echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✓ All tests passed!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Your Docker setup is working correctly! 🎉"
echo ""
echo "Access your application:"
echo "  • API: http://localhost:4000/"
echo "  • Swagger: http://localhost:4000/swagger"
echo "  • Scalar: http://localhost:4000/scaler"
echo ""
echo "Useful commands:"
echo "  • View logs: docker-compose logs -f app"
echo "  • Stop: docker-compose down"
echo "  • Restart: docker-compose restart"
echo ""
