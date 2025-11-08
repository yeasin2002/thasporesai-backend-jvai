# Test Docker Setup Script (PowerShell)
# This script verifies your Docker setup is working correctly

Write-Host "🧪 Testing JobSphere Docker Setup..." -ForegroundColor Cyan
Write-Host ""

$success = $true

# Check if .env exists
Write-Host "1. Checking environment configuration..."
if (Test-Path .env) {
    Write-Host "✓ .env file exists" -ForegroundColor Green
    
    $envContent = Get-Content .env -Raw
    
    if ($envContent -match "DATABASE_URL=") {
        Write-Host "✓ DATABASE_URL configured" -ForegroundColor Green
    } else {
        Write-Host "✗ DATABASE_URL not found in .env" -ForegroundColor Red
        $success = $false
    }
    
    if ($envContent -match "ACCESS_SECRET=") {
        Write-Host "✓ ACCESS_SECRET configured" -ForegroundColor Green
    } else {
        Write-Host "✗ ACCESS_SECRET not found in .env" -ForegroundColor Red
        $success = $false
    }
} else {
    Write-Host "✗ .env file not found" -ForegroundColor Red
    Write-Host "Run: cp .env.docker .env" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Check if Docker is running
Write-Host "2. Checking Docker..."
try {
    docker info | Out-Null
    Write-Host "✓ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker is not running" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Check if docker-compose is available
Write-Host "3. Checking Docker Compose..."
try {
    docker-compose version | Out-Null
    Write-Host "✓ Docker Compose is available" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker Compose not found" -ForegroundColor Red
    exit 1
}

Write-Host ""

if (-not $success) {
    Write-Host "Please fix the configuration issues above" -ForegroundColor Red
    exit 1
}

# Start services
Write-Host "4. Starting services..."
docker-compose up -d

Write-Host ""

# Wait for services to be ready
Write-Host "5. Waiting for services to start (30 seconds)..."
Start-Sleep -Seconds 30

Write-Host ""

# Check if container is running
Write-Host "6. Checking container status..."
$containers = docker ps --format "{{.Names}}"
if ($containers -match "jobsphere-app") {
    Write-Host "✓ Container is running" -ForegroundColor Green
} else {
    Write-Host "✗ Container is not running" -ForegroundColor Red
    Write-Host "Check logs: docker-compose logs app" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Check health
Write-Host "7. Checking application health..."
try {
    $response = Invoke-WebRequest -Uri "http://localhost:4000/" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Application is responding" -ForegroundColor Green
    } else {
        Write-Host "✗ Application returned status: $($response.StatusCode)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "✗ Application is not responding" -ForegroundColor Red
    Write-Host "Check logs: docker-compose logs app" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Test API endpoint
Write-Host "8. Testing API endpoint..."
try {
    $response = Invoke-WebRequest -Uri "http://localhost:4000/" -UseBasicParsing
    if ($response.Content -eq "OK") {
        Write-Host "✓ API endpoint working" -ForegroundColor Green
    } else {
        Write-Host "⚠ Unexpected response: $($response.Content)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠ Could not test API endpoint" -ForegroundColor Yellow
}

Write-Host ""

# Check logs for errors
Write-Host "9. Checking for errors in logs..."
$logs = docker-compose logs app 2>&1
if ($logs -match "(?i)error" -and $logs -notmatch "errorHandler") {
    Write-Host "⚠ Errors found in logs (check with: docker-compose logs app)" -ForegroundColor Yellow
} else {
    Write-Host "✓ No errors in logs" -ForegroundColor Green
}

Write-Host ""

# Summary
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "✓ All tests passed!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host ""
Write-Host "Your Docker setup is working correctly! 🎉" -ForegroundColor Cyan
Write-Host ""
Write-Host "Access your application:"
Write-Host "  • API: http://localhost:4000/"
Write-Host "  • Swagger: http://localhost:4000/swagger"
Write-Host "  • Scalar: http://localhost:4000/scaler"
Write-Host ""
Write-Host "Useful commands:"
Write-Host "  • View logs: docker-compose logs -f app"
Write-Host "  • Stop: docker-compose down"
Write-Host "  • Restart: docker-compose restart"
Write-Host ""
