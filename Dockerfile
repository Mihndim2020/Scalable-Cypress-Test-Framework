# Cypress Docker Container for Reproducible Test Execution
#
# This Dockerfile creates a containerized environment for running Cypress tests
# with all necessary dependencies pre-installed.
#
# Usage:
#   docker build -t cypress-tests .
#   docker run -it --rm cypress-tests npm run test:run
#
# Base image: Official Cypress Docker image with browsers
FROM cypress/included:13.6.3

# Set working directory
WORKDIR /app

# Install additional system dependencies
RUN apt-get update && apt-get install -y \
    # For wait-on and network utilities
    curl \
    netcat-openbsd \
    # For BrowserStack Local
    wget \
    unzip \
    # For jq (JSON processing)
    jq \
    # For envsubst (environment variable substitution)
    gettext-base \
    # Clean up apt cache
    && rm -rf /var/lib/apt/lists/*

# Install BrowserStack Local binary
RUN wget https://www.browserstack.com/browserstack-local/BrowserStackLocal-linux-x64.zip \
    && unzip BrowserStackLocal-linux-x64.zip \
    && mv BrowserStackLocal /usr/local/bin/browserstack-local \
    && chmod +x /usr/local/bin/browserstack-local \
    && rm BrowserStackLocal-linux-x64.zip

# Copy package files for dependency installation
COPY package.json package-lock.json ./

# Install npm dependencies
# Using --legacy-peer-deps to handle potential peer dependency conflicts
RUN npm ci --legacy-peer-deps

# Copy application code
COPY . .

# Verify Cypress installation
RUN npx cypress verify

# Create directories for test results and artifacts
RUN mkdir -p \
    cypress/screenshots \
    cypress/videos \
    cypress/results \
    cypress/reports \
    cypress/downloads

# Set permissions for Cypress to write results
RUN chmod -R 777 cypress

# Environment variables
ENV CI=true \
    CYPRESS_CACHE_FOLDER=/root/.cache/cypress \
    NODE_ENV=test

# Expose port for Cypress Dashboard (optional)
EXPOSE 5555

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node --version || exit 1

# Default command: run Cypress tests
CMD ["npm", "run", "test:run"]
