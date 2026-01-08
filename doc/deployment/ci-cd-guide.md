# CI/CD Deployment Guide

This guide explains how to set up GitHub Actions for manual deployment to a VPS using SSH.

## Overview

- **Trigger:** Manual (workflow_dispatch)
- **Method:** SSH into VPS and run deployment commands
- **Action Used:** [appleboy/ssh-action](https://github.com/appleboy/ssh-action)

## Prerequisites

1. A VPS with Docker and Docker Compose installed
2. SSH access to the VPS
3. Git repository cloned on the VPS
4. SSH key pair on the VPS

## Setup Steps

### 1. Create the Workflow File

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to VPS

on:
  workflow_dispatch:
    inputs:
      environment:
        description: "Deployment environment"
        required: true
        default: "production"
        type: choice
        options:
          - production

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production

    steps:
      - name: Deploy to VPS
        uses: appleboy/ssh-action@v1.2.2
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USERNAME }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd ~/your-project-folder
            git pull origin main
            docker compose down
            docker compose up -d --build
            docker image prune -f
            echo "✅ Deployment complete!"
            docker ps --filter name=your-container-name
```

### 2. Generate SSH Key on VPS (if not exists)

```bash
ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519 -N ""
```

### 3. Add Public Key to authorized_keys

```bash
cat ~/.ssh/id_ed25519.pub >> ~/.ssh/authorized_keys
```

### 4. Set Correct Permissions

```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
chmod 600 ~/.ssh/id_ed25519
```

### 5. Get the Private Key

```bash
cat ~/.ssh/id_ed25519
```

Copy the entire output including `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----`.

### 6. Add GitHub Secrets

Go to: **GitHub Repo → Settings → Secrets and variables → Actions → New repository secret**

Add these secrets:

| Secret Name    | Value                                      |
| -------------- | ------------------------------------------ |
| `VPS_HOST`     | Your VPS IP address (e.g., `31.97.129.37`) |
| `VPS_USERNAME` | SSH username (e.g., `root`)                |
| `VPS_SSH_KEY`  | The private key content from step 5        |

## How to Deploy

1. Go to your GitHub repository
2. Click **Actions** tab
3. Select **Deploy to VPS** workflow from the left sidebar
4. Click **Run workflow** button
5. Select branch and click **Run workflow**

## Customization

### Change Project Path

Update the `cd` command in the script:

```yaml
script: |
  cd ~/your-project-folder  # Change this
```

### Change Container Name

Update the `docker ps` filter:

```yaml
docker ps --filter name=your-container-name # Change this
```

### Add Auto-Deploy on Push

To deploy automatically when pushing to main, change the trigger:

```yaml
on:
  push:
    branches: [main]
  workflow_dispatch: # Keep manual trigger as well
```

### Deploy to Multiple Environments

```yaml
on:
  workflow_dispatch:
    inputs:
      environment:
        description: "Deployment environment"
        required: true
        default: "production"
        type: choice
        options:
          - production
          - staging
```

Then use different secrets for each environment.

## Troubleshooting

### "ssh: handshake failed" Error

1. Verify the public key is in `~/.ssh/authorized_keys` on VPS
2. Check permissions: `chmod 600 ~/.ssh/authorized_keys`
3. Ensure the private key in GitHub Secrets is complete (including BEGIN/END lines)

### "Permission denied" Error

1. Check SSH username is correct
2. Verify the user has access to the project directory
3. Check Docker permissions: `sudo usermod -aG docker $USER`

### "docker compose: command not found"

Use `docker-compose` (with hyphen) for older Docker versions, or install Docker Compose V2.

## Security Notes

- Never commit SSH keys to the repository
- Use GitHub Secrets for all sensitive data
- Consider using a dedicated deploy user instead of root
- Rotate SSH keys periodically
