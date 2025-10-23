#!/bin/bash

################################################################################
# BrowserStack Cypress Test Runner Script
#
# This script provides a wrapper for running Cypress tests on BrowserStack
# with environment-aware configuration and error handling.
#
# Usage:
#   ./scripts/run-browserstack.sh [OPTIONS]
#
# Options:
#   --config FILE       BrowserStack config file (default: browserstack-cypress.json)
#   --build-name NAME   Custom build name
#   --parallel N        Number of parallel tests (default: 5)
#   --specs PATTERN     Spec pattern to run
#   --sync              Run synchronously (wait for results)
#   --local             Enable BrowserStack Local tunnel
#   --help              Show this help message
#
# Environment Variables:
#   BROWSERSTACK_USERNAME     BrowserStack username (required)
#   BROWSERSTACK_ACCESS_KEY   BrowserStack access key (required)
#   BUILD_NUMBER              CI build number (optional)
#   LOCAL_IDENTIFIER          Local tunnel identifier (optional)
################################################################################

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
CONFIG_FILE="browserstack-cypress.json"
SYNC_MODE=""
BUILD_NAME=""
PARALLEL=""
SPECS=""
ENABLE_LOCAL=""

# Function to print colored messages
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show help
show_help() {
    sed -n '/^# Usage:/,/^$/p' "$0" | sed 's/^# //' | head -n -1
    exit 0
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --config)
            CONFIG_FILE="$2"
            shift 2
            ;;
        --build-name)
            BUILD_NAME="$2"
            shift 2
            ;;
        --parallel)
            PARALLEL="$2"
            shift 2
            ;;
        --specs)
            SPECS="$2"
            shift 2
            ;;
        --sync)
            SYNC_MODE="--sync"
            shift
            ;;
        --local)
            ENABLE_LOCAL="true"
            shift
            ;;
        --help)
            show_help
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            ;;
    esac
done

# Check required environment variables
if [ -z "$BROWSERSTACK_USERNAME" ]; then
    log_error "BROWSERSTACK_USERNAME environment variable is not set"
    exit 1
fi

if [ -z "$BROWSERSTACK_ACCESS_KEY" ]; then
    log_error "BROWSERSTACK_ACCESS_KEY environment variable is not set"
    exit 1
fi

# Check if config file exists
if [ ! -f "$CONFIG_FILE" ]; then
    log_error "Config file not found: $CONFIG_FILE"
    exit 1
fi

log_info "BrowserStack Cypress Test Execution"
log_info "===================================="
log_info "Config File: $CONFIG_FILE"
log_info "Username: $BROWSERSTACK_USERNAME"

# Set environment variables for config interpolation
export BROWSERSTACK_USERNAME
export BROWSERSTACK_ACCESS_KEY
export BUILD_NUMBER="${BUILD_NUMBER:-local-$(date +%Y%m%d-%H%M%S)}"
export LOCAL_IDENTIFIER="${LOCAL_IDENTIFIER:-local-${RANDOM}}"

log_info "Build Number: $BUILD_NUMBER"

# Create a temporary config file with environment variable substitution
TEMP_CONFIG="/tmp/browserstack-config-${RANDOM}.json"
envsubst < "$CONFIG_FILE" > "$TEMP_CONFIG"

# Override config values if provided via CLI
if [ -n "$BUILD_NAME" ]; then
    log_info "Build Name: $BUILD_NAME"
    jq --arg name "$BUILD_NAME" '.run_settings.build_name = $name' "$TEMP_CONFIG" > "$TEMP_CONFIG.tmp" && mv "$TEMP_CONFIG.tmp" "$TEMP_CONFIG"
fi

if [ -n "$PARALLEL" ]; then
    log_info "Parallel Execution: $PARALLEL"
    jq --arg parallel "$PARALLEL" '.run_settings.parallels = ($parallel | tonumber)' "$TEMP_CONFIG" > "$TEMP_CONFIG.tmp" && mv "$TEMP_CONFIG.tmp" "$TEMP_CONFIG"
fi

if [ -n "$SPECS" ]; then
    log_info "Spec Pattern: $SPECS"
    jq --arg specs "$SPECS" '.run_settings.specs = [$specs]' "$TEMP_CONFIG" > "$TEMP_CONFIG.tmp" && mv "$TEMP_CONFIG.tmp" "$TEMP_CONFIG"
fi

# Start BrowserStack Local tunnel if requested
LOCAL_PID=""
if [ "$ENABLE_LOCAL" = "true" ]; then
    log_info "Starting BrowserStack Local tunnel..."

    # Check if browserstack-local is installed
    if ! command -v browserstack-local &> /dev/null; then
        log_warning "browserstack-local not found globally, trying npx..."
        BROWSERSTACK_LOCAL_CMD="npx browserstack-local"
    else
        BROWSERSTACK_LOCAL_CMD="browserstack-local"
    fi

    # Start tunnel in background
    $BROWSERSTACK_LOCAL_CMD \
        --key "$BROWSERSTACK_ACCESS_KEY" \
        --local-identifier "$LOCAL_IDENTIFIER" \
        --daemon start \
        --log-file /tmp/browserstack-local.log

    # Wait for tunnel to establish
    log_info "Waiting for tunnel to establish (15 seconds)..."
    sleep 15

    # Check if tunnel is running
    if $BROWSERSTACK_LOCAL_CMD --key "$BROWSERSTACK_ACCESS_KEY" --daemon status | grep -q "Connected"; then
        log_success "BrowserStack Local tunnel established"
    else
        log_error "Failed to establish BrowserStack Local tunnel"
        cat /tmp/browserstack-local.log
        exit 1
    fi
fi

# Cleanup function
cleanup() {
    local exit_code=$?

    # Stop BrowserStack Local tunnel
    if [ -n "$ENABLE_LOCAL" ]; then
        log_info "Stopping BrowserStack Local tunnel..."
        $BROWSERSTACK_LOCAL_CMD --key "$BROWSERSTACK_ACCESS_KEY" --daemon stop || true
    fi

    # Remove temporary config
    rm -f "$TEMP_CONFIG"

    exit $exit_code
}

trap cleanup EXIT INT TERM

# Run BrowserStack Cypress tests
log_info "Starting BrowserStack Cypress test execution..."
log_info "===================================="

# Build command
BROWSERSTACK_CMD="npx browserstack-cypress run --config-file $TEMP_CONFIG"

if [ -n "$SYNC_MODE" ]; then
    BROWSERSTACK_CMD="$BROWSERSTACK_CMD $SYNC_MODE"
    log_info "Mode: Synchronous (waiting for results)"
else
    log_info "Mode: Asynchronous"
fi

# Execute command
log_info "Executing: $BROWSERSTACK_CMD"
echo ""

if eval "$BROWSERSTACK_CMD"; then
    log_success "BrowserStack tests completed successfully"
    exit 0
else
    EXIT_CODE=$?
    log_error "BrowserStack tests failed with exit code: $EXIT_CODE"
    exit $EXIT_CODE
fi
