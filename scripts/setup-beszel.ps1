# Beszel Monitoring Setup Script for Windows
# This script helps you set up Beszel monitoring for JobSphere

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Beszel Monitoring Setup for JobSphere" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Docker is not running. Please start Docker and try again." -ForegroundColor Red
    exit 1
}
Write-Host ""

# Check if .env file exists
if (-not (Test-Path .env)) {
    Write-Host "⚠️  Warning: .env file not found. Creating from .env.example..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "✅ Created .env file" -ForegroundColor Green
    Write-Host ""
}

# Pull latest images
Write-Host "📥 Pulling Beszel images..." -ForegroundColor Cyan
docker-compose pull beszel-hub beszel-agent
Write-Host "✅ Images pulled successfully" -ForegroundColor Green
Write-Host ""

# Start Beszel Hub first
Write-Host "🚀 Starting Beszel Hub..." -ForegroundColor Cyan
docker-compose up -d beszel-hub
Write-Host "✅ Beszel Hub started" -ForegroundColor Green
Write-Host ""

# Wait for Hub to be healthy
Write-Host "⏳ Waiting for Hub to be ready (this may take 30-40 seconds)..." -ForegroundColor Yellow
$timeout = 60
$elapsed = 0
$healthy = $false

while ($elapsed -lt $timeout) {
    try {
        $healthStatus = docker inspect beszel-hub --format='{{.State.Health.Status}}' 2>$null
        if ($healthStatus -eq "healthy") {
            Write-Host ""
            Write-Host "✅ Hub is healthy and ready!" -ForegroundColor Green
            $healthy = $true
            break
        }
    } catch {
        # Continue waiting
    }
    Start-Sleep -Seconds 2
    $elapsed += 2
    Write-Host -NoNewline "."
}
Write-Host ""

if (-not $healthy) {
    Write-Host "❌ Hub did not become healthy within timeout. Check logs:" -ForegroundColor Red
    Write-Host "   docker-compose logs beszel-hub" -ForegroundColor Yellow
    exit 1
}

# Display setup instructions
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "🎉 Beszel Hub is ready!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Open your browser and go to:"
Write-Host "   👉 http://localhost:8090" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Create an admin account (first-time setup)"
Write-Host ""
Write-Host "3. Add a system:"
Write-Host "   - Click 'Add System' button"
Write-Host "   - Name: JobSphere Local"
Write-Host "   - Copy the generated KEY"
Write-Host ""
Write-Host "4. Update your .env file:"
Write-Host "   - Open .env file"
Write-Host "   - Find BESZEL_AGENT_KEY="
Write-Host "   - Paste the key: BESZEL_AGENT_KEY=your_copied_key"
Write-Host "   - Save the file"
Write-Host ""
Write-Host "5. Start the Agent:"
Write-Host "   docker-compose up -d beszel-agent" -ForegroundColor Cyan
Write-Host ""
Write-Host "6. Verify monitoring:"
Write-Host "   - Refresh the dashboard"
Write-Host "   - System should show 'Online' status"
Write-Host "   - Metrics should appear within 5 seconds"
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Yellow
Write-Host "  View logs:     docker-compose logs -f beszel-hub beszel-agent"
Write-Host "  Restart:       docker-compose restart beszel-hub beszel-agent"
Write-Host "  Stop:          docker-compose stop beszel-hub beszel-agent"
Write-Host "  Full restart:  docker-compose down && docker-compose up -d"
Write-Host ""
Write-Host "Documentation: doc/deployment/Beszel-monitoring.md"
Write-Host "==========================================" -ForegroundColor Cyan
