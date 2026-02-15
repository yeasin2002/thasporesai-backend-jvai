# GitHub Actions Workflows

This directory contains GitHub Actions workflows for CI/CD automation.

## Available Workflows

### 1. Build and Test (`build.yml`)

**Trigger:** Automatically runs on:
- Push to `main` or `develop` branches
- Pull requests to `main` branch

**What it does:**
1. Checks out code
2. Sets up pnpm and Node.js
3. Installs Task runner
4. Installs dependencies
5. Runs CI checks (lint + type-check + build)

**Tasks executed:**
- `task ci` - Runs all CI checks:
  - Linting (ESLint + Prettier)
  - Type checking (TypeScript)
  - Build (tsdown)

**Status:** ✅ Automated

### 2. Deploy to VPS (`deploy.yml`)

**Trigger:** Manual workflow dispatch (requires approval)

**What it does:**
1. Connects to VPS via SSH
2. Pulls latest code from `main` branch
3. Installs Task (if not already installed)
4. Runs deployment via Task
5. Performs health checks

**Tasks executed:**
- `task update` - Pull and rebuild
- `task docker:ps` - Show container status
- `task test:all` - Run health checks

**Status:** 🔒 Manual (requires secrets)

## Required Secrets

For the deploy workflow to work, you need to configure these secrets in your GitHub repository:

### VPS Secrets

Go to: **Settings → Secrets and variables → Actions → New repository secret**

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `VPS_HOST` | VPS IP address or domain | `123.45.67.89` or `api.yourdomain.com` |
| `VPS_USERNAME` | SSH username | `root` or `ubuntu` |
| `VPS_SSH_KEY` | Private SSH key | Contents of `~/.ssh/id_rsa` |

### How to Get SSH Key

On your local machine:

```bash
# Generate SSH key (if you don't have one)
ssh-keygen -t rsa -b 4096 -C "github-actions"

# Copy public key to VPS
ssh-copy-id user@your-vps-ip

# Display private key (copy this to GitHub secret)
cat ~/.ssh/id_rsa
```

## Using the Workflows

### Build and Test (Automatic)

This workflow runs automatically on every push and pull request. No action needed.

**View results:**
1. Go to **Actions** tab in GitHub
2. Click on the latest workflow run
3. View logs and results

### Deploy to VPS (Manual)

**To deploy:**

1. Go to **Actions** tab in GitHub
2. Click on **Deploy to VPS** workflow
3. Click **Run workflow** button
4. Select environment: `production`
5. Click **Run workflow**

**Monitor deployment:**
- Watch the workflow logs in real-time
- Check for success/failure status
- Review health check results

## Workflow Features

### Build Workflow

✅ **Fast** - Uses pnpm cache for faster installs  
✅ **Comprehensive** - Runs all quality checks  
✅ **Informative** - Shows detailed results  
✅ **Automated** - No manual intervention needed  

### Deploy Workflow

✅ **Safe** - Manual approval required  
✅ **Automated** - Uses Task for consistent deployment  
✅ **Health checks** - Verifies deployment success  
✅ **Rollback ready** - Easy to redeploy previous version  

## Task Integration

Both workflows use [Task](https://taskfile.dev/) for running commands:

**Build workflow:**
```yaml
- name: Run CI checks
  run: task ci
```

**Deploy workflow:**
```bash
task update      # Pull and rebuild
task docker:ps   # Show status
task test:all    # Health checks
```

**Benefits:**
- Consistent commands across local and CI/CD
- Single source of truth (Taskfile.yml)
- Easy to maintain and update
- Cross-platform compatibility

## Troubleshooting

### Build Workflow Fails

**Check:**
1. Linting errors - Run `task lint` locally
2. Type errors - Run `task check-types` locally
3. Build errors - Run `task build` locally

**Fix:**
```bash
task lint:fix    # Fix linting issues
task ci          # Run all checks locally
```

### Deploy Workflow Fails

**Common issues:**

1. **SSH connection failed**
   - Verify VPS_HOST secret
   - Verify VPS_USERNAME secret
   - Verify VPS_SSH_KEY secret (must be private key)

2. **Task not found**
   - Workflow auto-installs Task
   - Check VPS has internet access

3. **Docker build failed**
   - Check VPS has enough disk space
   - Check Docker is running: `docker ps`
   - View logs: `task docker:logs`

4. **Health check failed**
   - Check application logs: `task docker:logs:app`
   - Verify environment variables in `.env`
   - Check if port 4000 is available

**Manual deployment:**
```bash
# SSH to VPS
ssh user@your-vps-ip

# Navigate to project
cd ~/thasporesai-backend-jvai

# Run deployment
task update

# Check status
task docker:ps
task test:all
```

## Local Testing

Test workflows locally before pushing:

**Build checks:**
```bash
task ci          # Run all CI checks
```

**Deployment simulation:**
```bash
task update      # Simulate deployment
task docker:ps   # Check status
task test:all    # Run health checks
```

## Workflow Customization

### Add More Checks to Build

Edit `.github/workflows/build.yml`:

```yaml
- name: Run tests
  run: task test

- name: Security audit
  run: pnpm audit
```

### Add Notifications to Deploy

Edit `.github/workflows/deploy.yml`:

```yaml
- name: Notify on success
  if: success()
  run: |
    curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
      -d '{"text":"✅ Deployment successful!"}'
```

## Best Practices

1. **Always test locally first**
   ```bash
   task ci          # Before pushing
   ```

2. **Review changes before deploying**
   - Check git diff
   - Review PR comments
   - Test in staging (if available)

3. **Monitor deployments**
   - Watch workflow logs
   - Check health checks
   - Verify application works

4. **Keep secrets secure**
   - Never commit secrets
   - Rotate SSH keys regularly
   - Use environment-specific secrets

5. **Document changes**
   - Update this README
   - Add comments to workflows
   - Document new tasks

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Task Documentation](https://taskfile.dev/)
- [go-task/setup-task Action](https://github.com/go-task/setup-task)
- [TASK-COMMANDS.md](../../TASK-COMMANDS.md) - Complete Task reference
- [DEPLOYMENT.md](../../DEPLOYMENT.md) - Deployment guide

## Support

If you encounter issues:

1. Check workflow logs in GitHub Actions tab
2. Review this README
3. Check [TASK-COMMANDS.md](../../TASK-COMMANDS.md)
4. Test commands locally
5. Contact the team

---

**Last Updated:** 2026-02-14  
**Workflows:** 2 (Build, Deploy)  
**Task Integration:** ✅ Complete
