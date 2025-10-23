# Docker Execution Guide

This guide explains how to run Cypress tests in Docker containers for reproducible, isolated test execution.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Quick Start](#quick-start)
4. [Docker Architecture](#docker-architecture)
5. [Running Tests](#running-tests)
6. [Docker Compose Profiles](#docker-compose-profiles)
7. [Environment Configuration](#environment-configuration)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)

---

## Overview

### Why Use Docker for Cypress?

✅ **Reproducible Environment** - Same OS, browsers, and dependencies everywhere
✅ **Isolation** - Tests run in isolated containers
✅ **CI/CD Parity** - Local environment matches CI exactly
✅ **Version Control** - Browser and Cypress versions locked
✅ **Easy Cleanup** - Remove everything with one command
✅ **Multi-Browser** - Test across different browsers easily

### What's Included

- **[Dockerfile](Dockerfile)** - Container image definition
- **[docker-compose.yml](docker-compose.yml)** - Multi-service orchestration
- **[scripts/docker-run.sh](scripts/docker-run.sh)** - Convenience wrapper script
- **[.dockerignore](.dockerignore)** - Files excluded from Docker build

---

## Prerequisites

### Required Software

```bash
# Check Docker installation
docker --version
# Required: Docker 20.10+

# Check Docker Compose
docker compose version
# Required: Docker Compose 2.0+ (or docker-compose 1.29+)
```

### Install Docker

**macOS**:
```bash
brew install --cask docker
# Or download from: https://www.docker.com/products/docker-desktop
```

**Ubuntu/Debian**:
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

**Windows**:
- Download and install [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop)

---

## Quick Start

### 1. Basic Test Execution

```bash
# Run tests using helper script
./scripts/docker-run.sh test

# Or using Docker Compose directly
docker compose up --abort-on-container-exit cypress
```

### 2. Smoke Tests Only

```bash
./scripts/docker-run.sh smoke
```

### 3. Specific Browser

```bash
# Chrome
./scripts/docker-run.sh chrome

# Firefox
./scripts/docker-run.sh firefox

# Edge
./scripts/docker-run.sh edge
```

### 4. Interactive Mode (Headed)

```bash
# Requires X11 display server
./scripts/docker-run.sh headed
```

---

## Docker Architecture

### Container Structure

```
┌─────────────────────────────────────────┐
│   Cypress Docker Container              │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │  Base Image:                     │  │
│  │  cypress/included:13.6.3         │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │  Installed Software:             │  │
│  │  - Node.js 18.x                  │  │
│  │  - Chrome (latest)               │  │
│  │  - Firefox (latest)              │  │
│  │  - Edge (latest)                 │  │
│  │  - Electron                      │  │
│  │  - curl, wget, jq, netcat        │  │
│  │  - BrowserStack Local            │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │  Application Code:               │  │
│  │  /app/                           │  │
│  │    ├── cypress/                  │  │
│  │    ├── src/                      │  │
│  │    ├── node_modules/             │  │
│  │    └── cypress.config.js         │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │  Mounted Volumes:                │  │
│  │  - cypress/screenshots           │  │
│  │  - cypress/videos                │  │
│  │  - cypress/results               │  │
│  │  - ~/.cache/cypress (cached)     │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Dockerfile Breakdown

```dockerfile
# Base image with Cypress and browsers pre-installed
FROM cypress/included:13.6.3

# Install system utilities
RUN apt-get update && apt-get install -y curl jq gettext-base

# Install BrowserStack Local for tunnel support
RUN wget https://www.browserstack.com/browserstack-local/...

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copy application code
COPY . .

# Create result directories
RUN mkdir -p cypress/{screenshots,videos,results,reports}

# Default command
CMD ["npm", "run", "test:run"]
```

---

## Running Tests

### Using Helper Script (Recommended)

The **[scripts/docker-run.sh](scripts/docker-run.sh)** script provides convenient commands:

```bash
# Show help
./scripts/docker-run.sh help

# Run all tests (headless)
./scripts/docker-run.sh test

# Run smoke tests only
./scripts/docker-run.sh smoke

# Run in specific browser
./scripts/docker-run.sh chrome
./scripts/docker-run.sh firefox
./scripts/docker-run.sh edge

# Run in headed mode (interactive)
./scripts/docker-run.sh headed

# Build Docker images
./scripts/docker-run.sh build

# Clean up everything
./scripts/docker-run.sh clean

# View logs
./scripts/docker-run.sh logs

# Open shell in container
./scripts/docker-run.sh shell
```

### Using Docker Compose Directly

```bash
# Start application service
docker compose up -d app

# Run tests (default: headless Chrome)
docker compose up --abort-on-container-exit cypress

# Run smoke tests
docker compose --profile smoke up --abort-on-container-exit cypress-smoke

# Run in Firefox
docker compose --profile firefox up --abort-on-container-exit cypress-firefox

# Run in headed mode
export DISPLAY=:0
xhost +local:docker
docker compose --profile headed up --abort-on-container-exit cypress-headed

# Stop all services
docker compose down
```

### Using Docker Run

```bash
# Build image
docker build -t cypress-tests .

# Run tests
docker run --rm \
  -v $(pwd)/cypress/screenshots:/app/cypress/screenshots \
  -v $(pwd)/cypress/videos:/app/cypress/videos \
  -e BASE_URL=http://localhost:3000 \
  cypress-tests npm run test:run

# Run with custom command
docker run --rm -it cypress-tests npm run test:chrome

# Open interactive shell
docker run --rm -it cypress-tests /bin/bash
```

---

## Docker Compose Profiles

### Available Profiles

Docker Compose uses **profiles** to define different test configurations:

| Profile | Service | Description | Command |
|---------|---------|-------------|---------|
| *default* | `cypress` | Standard headless tests | `docker compose up cypress` |
| `smoke` | `cypress-smoke` | Smoke tests only | `docker compose --profile smoke up cypress-smoke` |
| `chrome` | `cypress-chrome` | Chrome browser | `docker compose --profile chrome up cypress-chrome` |
| `firefox` | `cypress-firefox` | Firefox browser | `docker compose --profile firefox up cypress-firefox` |
| `edge` | `cypress-edge` | Edge browser | `docker compose --profile edge up cypress-edge` |
| `headed` | `cypress-headed` | Interactive mode | `docker compose --profile headed up cypress-headed` |

### Profile Configuration

Each profile is defined in [docker-compose.yml](docker-compose.yml):

```yaml
services:
  cypress-smoke:
    build:
      context: .
    environment:
      - TAGS=@smoke
    command: npm run test:smoke
    profiles:
      - smoke  # Only runs when --profile smoke is specified
```

---

## Environment Configuration

### Environment Variables

Set via `.env` file or command line:

```bash
# Create .env file
cat > .env <<EOF
BASE_URL=http://localhost:3000
API_URL=http://localhost:3001
TEST_USERNAME=testuser
TEST_PASSWORD=testpassword
CYPRESS_VIDEO=true
CYPRESS_SCREENSHOTS=true
BROWSERSTACK_USERNAME=your_username
BROWSERSTACK_ACCESS_KEY=your_key
EOF

# Docker Compose will automatically load .env
docker compose up cypress
```

### Override Environment Variables

```bash
# Via command line
BASE_URL=https://staging.example.com docker compose up cypress

# Via docker-compose override
cat > docker-compose.override.yml <<EOF
version: '3.8'
services:
  cypress:
    environment:
      - BASE_URL=https://staging.example.com
EOF
```

### Volume Mounts

Customize volume mounts in [docker-compose.yml](docker-compose.yml):

```yaml
volumes:
  # Source code (for live updates)
  - ./cypress:/app/cypress
  - ./src:/app/src
  - ./cypress.config.js:/app/cypress.config.js

  # Test artifacts (persist to host)
  - ./cypress/screenshots:/app/cypress/screenshots
  - ./cypress/videos:/app/cypress/videos
  - ./cypress/results:/app/cypress/results

  # Named volumes (for caching)
  - cypress_cache:/root/.cache/cypress
  - node_modules:/app/node_modules
```

---

## Troubleshooting

### Common Issues

#### 1. Permission Denied for Artifacts

**Problem**: Cannot write screenshots/videos

**Solution**:
```bash
# Fix permissions
sudo chmod -R 777 cypress/screenshots cypress/videos cypress/results

# Or run with specific user
docker compose run --user $(id -u):$(id -g) cypress
```

#### 2. Port Already in Use

**Problem**: "port 3000 is already allocated"

**Solution**:
```bash
# Change port in docker-compose.yml
ports:
  - "3001:80"  # Change 3000 to 3001

# Or stop conflicting service
docker ps
docker stop <container_id>
```

#### 3. Out of Disk Space

**Problem**: "no space left on device"

**Solution**:
```bash
# Clean up Docker resources
docker system prune -a --volumes

# Remove unused images
docker image prune -a

# Remove stopped containers
docker container prune
```

#### 4. Slow Build Times

**Problem**: Docker build takes too long

**Solution**:
```bash
# Use BuildKit for faster builds
DOCKER_BUILDKIT=1 docker build -t cypress-tests .

# Enable BuildKit by default
export DOCKER_BUILDKIT=1

# Cache node_modules
docker compose build --build-arg BUILDKIT_INLINE_CACHE=1
```

#### 5. Cannot Connect to Display (Headed Mode)

**Problem**: "cannot open display :0"

**Solution**:
```bash
# macOS: Install XQuartz
brew install --cask xquartz
# Start XQuartz and enable "Allow connections from network clients"

# Linux: Allow Docker to access display
xhost +local:docker
export DISPLAY=:0

# Verify
echo $DISPLAY
```

#### 6. Tests Pass Locally but Fail in Docker

**Problem**: Different behavior in container

**Solutions**:
```bash
# 1. Check environment variables
docker compose config

# 2. Run interactive shell to debug
docker compose run --rm cypress /bin/bash
# Then: npm run test:open

# 3. Check base URL
docker compose run --rm cypress printenv | grep BASE_URL

# 4. Increase timeout
# In cypress.config.js:
defaultCommandTimeout: 15000,  # Increase from 10000
```

#### 7. Network Issues

**Problem**: Cannot reach application

**Solution**:
```bash
# Check network connectivity
docker compose run --rm cypress curl http://app:3000

# Use host.docker.internal (macOS/Windows)
BASE_URL=http://host.docker.internal:3000 docker compose up cypress

# Linux: use host network
docker compose run --network host cypress
```

---

## Best Practices

### 1. Use Multi-Stage Builds

Optimize Dockerfile for smaller images:

```dockerfile
# Build stage
FROM cypress/included:13.6.3 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Runtime stage
FROM cypress/included:13.6.3
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
```

### 2. Cache Dependencies

Use named volumes for caching:

```yaml
volumes:
  cypress_cache:
    name: cypress_cache
  node_modules:
    name: cypress_node_modules
```

### 3. Use .dockerignore

Exclude unnecessary files (already included):

```
node_modules/
cypress/screenshots/
cypress/videos/
.git/
```

### 4. Pin Versions

Always pin specific versions:

```dockerfile
FROM cypress/included:13.6.3  # ✅ Specific version
# FROM cypress/included:latest  # ❌ Avoid latest
```

### 5. Health Checks

Add health checks to services:

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost/health"]
  interval: 30s
  timeout: 10s
  retries: 3
```

### 6. Resource Limits

Set resource limits to prevent container from consuming too much:

```yaml
deploy:
  resources:
    limits:
      cpus: '2.0'
      memory: 4G
    reservations:
      memory: 2G
```

### 7. Clean Up Regularly

```bash
# Daily cleanup script
#!/bin/bash
docker compose down
docker system prune -f
rm -rf cypress/screenshots/* cypress/videos/*
```

---

## Advanced Usage

### Running Parallel Tests

```bash
# Start multiple instances
for i in {1..3}; do
  docker compose run -d --name cypress-$i cypress npm run test:run
done

# Wait for all to complete
docker wait cypress-1 cypress-2 cypress-3
```

### Custom Network Configuration

```yaml
networks:
  cypress-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.25.0.0/16
```

### Using Docker in CI/CD

Example GitLab CI:

```yaml
test:
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker compose up --abort-on-container-exit cypress
  artifacts:
    paths:
      - cypress/screenshots
      - cypress/videos
```

---

## Performance Comparison

| Execution Method | Startup Time | Test Duration | Reproducibility |
|------------------|--------------|---------------|-----------------|
| Local (native) | ~5 sec | Baseline | Low |
| Docker (cached) | ~10 sec | +5-10% | High |
| Docker (uncached) | ~60 sec | +5-10% | High |
| CI/CD (Docker) | ~90 sec | +10-15% | Very High |

---

## Quick Reference

### Essential Commands

```bash
# Build and run
docker compose up --build cypress

# Run in background
docker compose up -d cypress

# View logs
docker compose logs -f cypress

# Stop all
docker compose down

# Clean everything
docker compose down -v
docker system prune -a

# Shell access
docker compose run --rm cypress /bin/bash

# Run specific command
docker compose run --rm cypress npm run test:smoke

# Check running containers
docker compose ps

# View resource usage
docker stats
```

### File Locations

| Resource | Container Path | Host Mount |
|----------|----------------|------------|
| Screenshots | `/app/cypress/screenshots` | `./cypress/screenshots` |
| Videos | `/app/cypress/videos` | `./cypress/videos` |
| Results | `/app/cypress/results` | `./cypress/results` |
| Reports | `/app/cypress/reports` | `./cypress/reports` |
| Source Code | `/app/cypress` | `./cypress` |
| Config | `/app/cypress.config.js` | `./cypress.config.js` |

---

## Additional Resources

- **[Official Cypress Docker Images](https://github.com/cypress-io/cypress-docker-images)**
- **[Docker Compose Documentation](https://docs.docker.com/compose/)**
- **[Cypress Docker Guide](https://docs.cypress.io/guides/getting-started/installing-cypress#Docker)**
- **[Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)**

---

**Last Updated**: 2025-10-21
**Maintainer**: QA Team
