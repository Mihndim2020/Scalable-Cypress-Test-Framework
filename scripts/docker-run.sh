#!/bin/bash

################################################################################
# Docker Cypress Test Runner Script
#
# This script provides convenient commands for running Cypress tests in Docker
# with various configurations.
#
# Usage:
#   ./scripts/docker-run.sh [COMMAND] [OPTIONS]
#
# Commands:
#   up              Start all services
#   down            Stop all services
#   test            Run tests in headless mode
#   smoke           Run smoke tests only
#   chrome          Run tests in Chrome
#   firefox         Run tests in Firefox
#   edge            Run tests in Edge
#   headed          Run tests in headed mode (requires X11)
#   build           Build Docker images
#   clean           Clean up containers, volumes, and artifacts
#   logs            Show logs from containers
#   shell           Open shell in Cypress container
#   help            Show this help message
#
# Examples:
#   ./scripts/docker-run.sh test
#   ./scripts/docker-run.sh smoke
#   ./scripts/docker-run.sh chrome
#   ./scripts/docker-run.sh clean
################################################################################

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Functions
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

show_help() {
    sed -n '/^# Usage:/,/^$/p' "$0" | sed 's/^# //' | head -n -1
    exit 0
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    log_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Determine docker compose command
if docker compose version &> /dev/null 2>&1; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

# Get command
COMMAND=${1:-help}

case $COMMAND in
    up)
        log_info "Starting Docker services..."
        $DOCKER_COMPOSE up -d app
        log_success "Services started. Waiting for app to be healthy..."
        sleep 5
        log_success "Services are ready!"
        ;;

    down)
        log_info "Stopping Docker services..."
        $DOCKER_COMPOSE down
        log_success "Services stopped"
        ;;

    test)
        log_info "Running Cypress tests in headless mode..."
        $DOCKER_COMPOSE up --abort-on-container-exit cypress
        EXIT_CODE=$?
        $DOCKER_COMPOSE down
        if [ $EXIT_CODE -eq 0 ]; then
            log_success "Tests passed!"
        else
            log_error "Tests failed with exit code: $EXIT_CODE"
        fi
        exit $EXIT_CODE
        ;;

    smoke)
        log_info "Running smoke tests..."
        $DOCKER_COMPOSE --profile smoke up --abort-on-container-exit cypress-smoke
        EXIT_CODE=$?
        $DOCKER_COMPOSE --profile smoke down
        if [ $EXIT_CODE -eq 0 ]; then
            log_success "Smoke tests passed!"
        else
            log_error "Smoke tests failed with exit code: $EXIT_CODE"
        fi
        exit $EXIT_CODE
        ;;

    chrome)
        log_info "Running tests in Chrome..."
        $DOCKER_COMPOSE --profile chrome up --abort-on-container-exit cypress-chrome
        EXIT_CODE=$?
        $DOCKER_COMPOSE --profile chrome down
        if [ $EXIT_CODE -eq 0 ]; then
            log_success "Chrome tests passed!"
        else
            log_error "Chrome tests failed with exit code: $EXIT_CODE"
        fi
        exit $EXIT_CODE
        ;;

    firefox)
        log_info "Running tests in Firefox..."
        $DOCKER_COMPOSE --profile firefox up --abort-on-container-exit cypress-firefox
        EXIT_CODE=$?
        $DOCKER_COMPOSE --profile firefox down
        if [ $EXIT_CODE -eq 0 ]; then
            log_success "Firefox tests passed!"
        else
            log_error "Firefox tests failed with exit code: $EXIT_CODE"
        fi
        exit $EXIT_CODE
        ;;

    edge)
        log_info "Running tests in Edge..."
        $DOCKER_COMPOSE --profile edge up --abort-on-container-exit cypress-edge
        EXIT_CODE=$?
        $DOCKER_COMPOSE --profile edge down
        if [ $EXIT_CODE -eq 0 ]; then
            log_success "Edge tests passed!"
        else
            log_error "Edge tests failed with exit code: $EXIT_CODE"
        fi
        exit $EXIT_CODE
        ;;

    headed)
        log_info "Running tests in headed mode..."
        log_warning "This requires X11 display server running"

        # Set DISPLAY if not set
        export DISPLAY=${DISPLAY:-:0}

        # Allow Docker to connect to X server
        xhost +local:docker 2>/dev/null || log_warning "xhost command not found, X11 may not work"

        $DOCKER_COMPOSE --profile headed up --abort-on-container-exit cypress-headed
        EXIT_CODE=$?
        $DOCKER_COMPOSE --profile headed down
        exit $EXIT_CODE
        ;;

    build)
        log_info "Building Docker images..."
        $DOCKER_COMPOSE build --no-cache
        log_success "Docker images built successfully"
        ;;

    clean)
        log_info "Cleaning up Docker resources..."

        # Stop and remove containers
        $DOCKER_COMPOSE down -v

        # Remove test artifacts
        log_info "Removing test artifacts..."
        rm -rf cypress/screenshots/* cypress/videos/* cypress/results/* cypress/reports/*

        # Remove Docker images
        log_warning "Removing Docker images..."
        docker rmi cypress-tests 2>/dev/null || true

        log_success "Cleanup complete"
        ;;

    logs)
        SERVICE=${2:-cypress}
        log_info "Showing logs for $SERVICE..."
        $DOCKER_COMPOSE logs -f $SERVICE
        ;;

    shell)
        log_info "Opening shell in Cypress container..."
        $DOCKER_COMPOSE run --rm cypress /bin/bash
        ;;

    help|--help|-h)
        show_help
        ;;

    *)
        log_error "Unknown command: $COMMAND"
        echo ""
        show_help
        ;;
esac
