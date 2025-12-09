#!/bin/bash
# JobSphere Deployment Script for VPS

set -e

echo "🚀 JobSphere Deployment Script"
echo "=============================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found!${NC}"
    echo "Copy .env.production.example to .env and configure it first."
    exit 1
fi

# Check if firebase-service-account.json exists
if [ ! -f firebase-service-account.json ]; then
    echo -e "${YELLOW}Warning: firebase-service-account.json not found.${NC}"
    echo "Push notifications will not work without it."
fi

# Create required directories
echo -e "${GREEN}Creating directories...${NC}"
mkdir -p uploads logs

# Pull latest changes (if using git)
if [ -d .git ]; then
    echo -e "${GREEN}Pulling latest changes...${NC}"
    git pull origin main || git pull origin master
fi

# Build and start containers
echo -e "${GREEN}Building and starting Docker containers...${NC}"
docker compose down
docker compose up -d --build

# Wait for container to be healthy
echo -e "${GREEN}Waiting for application to start...${NC}"
sleep 10

# Health check
echo -e "${GREEN}Running health check...${NC}"
if curl -s http://localhost:4000/ > /dev/null; then
    echo -e "${GREEN}✓ Application is running!${NC}"
else
    echo -e "${RED}✗ Application health check failed${NC}"
    echo "Check logs with: docker compose logs -f app"
    exit 1
fi

echo ""
echo -e "${GREEN}=============================="
echo "Deployment complete!"
echo "==============================${NC}"
echo ""
echo "Useful commands:"
echo "  docker compose logs -f app    # View logs"
echo "  docker compose restart        # Restart app"
echo "  docker compose down           # Stop app"
echo ""
