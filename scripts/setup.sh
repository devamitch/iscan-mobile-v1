#!/bin/bash

# AEye Scan App Setup Script
# This script sets up the development environment for the AEye Scan App

set -e

echo "🚀 Setting up AEye Scan App development environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node -v)"
        exit 1
    fi
    
    print_success "Node.js $(node -v) is installed"
}

# Check if React Native CLI is installed
check_react_native_cli() {
    if ! command -v react-native &> /dev/null; then
        print_warning "React Native CLI not found. Installing..."
        npm install -g react-native-cli
        print_success "React Native CLI installed"
    else
        print_success "React Native CLI is installed"
    fi
}

# Check if CocoaPods is installed (macOS only)
check_cocoapods() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if ! command -v pod &> /dev/null; then
            print_warning "CocoaPods not found. Installing..."
            sudo gem install cocoapods
            print_success "CocoaPods installed"
        else
            print_success "CocoaPods is installed"
        fi
    fi
}

# Install npm dependencies
install_dependencies() {
    print_status "Installing npm dependencies..."
    npm install
    print_success "npm dependencies installed"
}

# Install iOS dependencies
install_ios_dependencies() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        print_status "Installing iOS dependencies..."
        cd ios
        pod install
        cd ..
        print_success "iOS dependencies installed"
    else
        print_warning "Skipping iOS setup (not on macOS)"
    fi
}

# Setup environment files
setup_environment() {
    print_status "Setting up environment files..."
    
    if [ ! -f .env ]; then
        cp .env.example .env
        print_success "Created .env file from .env.example"
        print_warning "Please update .env file with your API keys and configuration"
    else
        print_warning ".env file already exists"
    fi
    
    if [ ! -f .env.development ]; then
        print_success "Development environment file already exists"
    fi
}

# Download MediaPipe models
download_models() {
    print_status "Downloading MediaPipe models..."
    node scripts/download-mediapipe-models.js
    print_success "MediaPipe models downloaded"
}

# Setup Git hooks
setup_git_hooks() {
    print_status "Setting up Git hooks..."
    npx husky install
    npx husky add .husky/pre-commit "npx lint-staged"
    npx husky add .husky/pre-push "npm run type-check && npm run test:ci"
    print_success "Git hooks configured"
}

# Generate app icons and splash screens
generate_assets() {
    print_status "Generating app assets..."
    
    # Create directories if they don't exist
    mkdir -p src/assets/images
    mkdir -p src/assets/icons
    mkdir -p src/assets/lottie
    
    # Generate app icons (placeholder)
    print_warning "Please add your app icon to src/assets/images/app-icon.png"
    print_warning "Then run: npm run generate:icons"
    
    # Generate splash screen (placeholder)
    print_warning "Please add your splash screen image to src/assets/images/splash.png"
    print_warning "Then run: npm run generate:splash"
    
    print_success "Asset directories created"
}

# Create necessary directories
create_directories() {
    print_status "Creating project directories..."
    
    # Create all necessary directories
    mkdir -p src/assets/{fonts,icons,images,lottie,models}
    mkdir -p src/ui/components/{Scanner,Visualization,GlassCard,HolographicView,BiometricAuth,AnalyticsChart,AROverlay,Button,Input,Modal,Loader}
    mkdir -p src/ui/layouts
    mkdir -p src/features/{auth,home,iris-scan,face-analysis,hand-tracking,pose-estimation,object-detection,document-scan,medical-analysis,ar-visualization,chat,profile,analytics,ai-assistant,settings}/{screens,components,hooks,services}
    mkdir -p src/navigation
    mkdir -p src/store/{slices,queries}
    mkdir -p src/services/{api,mediapipe,computer-vision,ml-models,biometric,ar-engine,ai,socket,auth,camera,sensors}
    mkdir -p src/database
    mkdir -p src/themes
    mkdir -p src/hooks
    mkdir -p src/utils
    mkdir -p src/config
    mkdir -p src/types
    mkdir -p mediapipe/{android,ios,models}
    mkdir -p docs
    
    print_success "Project directories created"
}

# Verify React Native environment
verify_environment() {
    print_status "Verifying React Native environment..."
    npx react-native doctor
}

# Main setup function
main() {
    echo "🎯 AEye Scan App - Production-Ready React Native Template"
    echo "=================================================="
    echo ""
    
    check_node
    check_react_native_cli
    check_cocoapods
    create_directories
    install_dependencies
    install_ios_dependencies
    setup_environment
    download_models
    setup_git_hooks
    generate_assets
    
    echo ""
    echo "🎉 Setup completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Update .env file with your API keys"
    echo "2. Configure Firebase (add GoogleService-Info.plist and google-services.json)"
    echo "3. Add your app icons and splash screen images"
    echo "4. Run 'npm run ios' or 'npm run android' to start development"
    echo ""
    echo "For more information, see README.md"
    
    # Verify environment
    verify_environment
}

# Run main function
main "$@"
