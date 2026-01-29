#!/bin/bash

# Beszel Monitoring Setup Script
# This script helps you set up Beszel monitoring for JobSphere

set -e

echo "=========================================="
echo "Beszel Monitoring Setup for JobSphere"
echo "=========================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running. Please start Docker and try again."
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  Warning: .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "✅ Created .env file"
    echo ""
fi

# Pull latest images
echo "📥 Pulling Beszel images..."
docker-compose pull beszel-hub beszel-agent
echo "✅ Images pulled successfully"
echo ""

# Start Beszel Hub first
echo "🚀 Starting Beszel Hub..."
docker-compose up -d beszel-hub
echo "✅ Beszel Hub started"
echo ""

# Wait for Hub to be healthy
echo "⏳ Waiting for Hub to be ready (this may take 30-40 seconds)..."
timeout=60
elapsed=0
while [ $elapsed -lt $timeout ]; do
    if docker inspect beszel-hub --format='{{.State.Health.Status}}' 2>/dev/null | grep -q "healthy"; then
        echo "✅ Hub is healthy and ready!"
        break
    fi
    sleep 2
    elapsed=$((elapsed + 2))
    echo -n "."
done
echo ""

if [ $elapsed -ge $timeout ]; then
    echo "❌ Hub did not become healthy within timeout. Check logs:"
    echo "   docker-compose logs beszel-hub"
    exit 1
fi

# Display setup instructions
echo ""
echo "=========================================="
echo "🎉 Beszel Hub is ready!"
echo "=========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Open your browser and go to:"
echo "   👉 http://localhost:8090"
echo ""
echo "2. Create an admin account (first-time setup)"
echo ""
echo "3. Add a system:"
echo "   - Click 'Add System' button"
echo "   - Name: JobSphere Local"
echo "   - Copy the generated KEY"
echo ""
echo "4. Update your .env file:"
echo "   - Open .env file"
echo "   - Find BESZEL_AGENT_KEY="
echo "   - Paste the key: BESZEL_AGENT_KEY=your_copied_key"
echo "   - Save the file"
echo ""
echo "5. Start the Agent:"
echo "   docker-compose up -d beszel-agent"
echo ""
echo "6. Verify monitoring:"
echo "   - Refresh the dashboard"
echo "   - System should show 'Online' status"
echo "   - Metrics should appear within 5 seconds"
echo ""
echo "=========================================="
echo ""
echo "Useful commands:"
echo "  View logs:     docker-compose logs -f beszel-hub beszel-agent"
echo "  Restart:       docker-compose restart beszel-hub beszel-agent"
echo "  Stop:          docker-compose stop beszel-hub beszel-agent"
echo "  Full restart:  docker-compose down && docker-compose up -d"
echo ""
echo "Documentation: doc/deployment/Beszel-monitoring.md"
echo "=========================================="
