# Build and Publish Guide

This document outlines the complete process for building and publishing the Node.js application to a Nexus repository.

## Prerequisites

1. **Node.js and npm installed** (version 14 or higher recommended)
2. **Access to your Nexus Repository Manager**
3. **Valid credentials for the Nexus repository**
4. **PowerShell execution policy configured** (for Windows users)

## Setup Instructions

### 1. Install Node.js (if not already installed)
Download and install Node.js from https://nodejs.org/
Verify installation:
```powershell
node --version
npm --version
```

**If npm command fails in PowerShell:**
```powershell
# Set execution policy to allow npm scripts
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 2. Install Project Dependencies
```powershell
npm install
```

### 3. Configure Nexus Repository Settings

#### Update .npmrc file
Edit the `.npmrc` file in the project root and replace placeholders:

```properties
# Replace 'your-nexus-server' with your actual Nexus server URL
registry=http://your-nexus-server:8081/repository/npm-group/

# For scoped packages (optional)
@your-scope:registry=http://your-nexus-server:8081/repository/npm-hosted/

# Authentication - choose one method below
```

#### Update package.json
In `package.json`, update the `publishConfig.registry` field:
```json
"publishConfig": {
  "registry": "http://your-nexus-server:8081/repository/npm-hosted/"
}
```

## Authentication Setup

### Username/Password Authentication (Recommended)

1. **Get your Nexus credentials:**
   - Username: Your Nexus username
   - Password: Your Nexus password

2. **Encode your password in base64:**
   ```powershell
   [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("your-password"))
   ```

3. **Add to `.npmrc`:**
   ```properties
   //your-nexus-server:8081/repository/npm-hosted/:username=your-username
   //your-nexus-server:8081/repository/npm-hosted/:_password=your-base64-encoded-password
   //your-nexus-server:8081/repository/npm-hosted/:always-auth=true
   ```

### Alternative: Environment Variables (for CI/CD)

**PowerShell:**
```powershell
$env:NPM_USERNAME="your-username"
$env:NPM_PASSWORD="your-base64-encoded-password"
```

Then in `.npmrc`:
```properties
//your-nexus-server:8081/repository/npm-hosted/:username=${NPM_USERNAME}
//your-nexus-server:8081/repository/npm-hosted/:_password=${NPM_PASSWORD}
//your-nexus-server:8081/repository/npm-hosted/:always-auth=true
```

## Build Process

The project includes several npm scripts for building and publishing:

### Available Scripts

- `npm run clean` - Remove build artifacts
- `npm run copy-files` - Copy source files to dist directory
- `npm run build` - Full build process (clean + copy-files)
- `npm run prepublishOnly` - Runs automatically before publishing
- `npm run publish:nexus` - Publish to Nexus repository

### Build Steps

1. **Clean previous build:**
```powershell
npm run clean
```

2. **Build the project:**
```powershell
npm run build
```

3. **Verify build output:**
Check the `dist/` directory for copied files.

## Publishing Process

### 1. Update Version (if needed)
```powershell
npm version patch    # for bug fixes (1.0.0 → 1.0.1)
npm version minor    # for new features (1.0.0 → 1.1.0)
npm version major    # for breaking changes (1.0.0 → 2.0.0)
```

### 2. Test the Package Locally (Optional)
```powershell
npm pack
```
This creates a `.tgz` file you can inspect.

### 3. Publish to Nexus
```powershell
npm run publish:nexus
```

Or use the standard npm publish command:
```powershell
npm publish
```

### 4. Verify Publication
Check your Nexus repository web interface to confirm the package was published successfully.

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Verify credentials are correct
   - Check token hasn't expired
   - Ensure repository URL is correct

2. **Network/SSL Issues**
   - For self-signed certificates, add to `.npmrc`:
     ```
     strict-ssl=false
     ```

3. **Permission Errors**
   - Verify your user has publish permissions on the Nexus repository
   - Check repository configuration in Nexus

4. **Version Conflicts**
   - Ensure you're incrementing version numbers
   - Nexus may not allow republishing same version

### Debug Commands

```powershell
# Check npm configuration
npm config list

# Test authentication
npm whoami --registry=http://your-nexus-server:8081/repository/npm-hosted/

# Dry run publish (see what would be published)
npm publish --dry-run
```

## CI/CD Integration

For automated builds and publishing in CI/CD pipelines:

1. Set environment variables for authentication
2. Use `npm ci` instead of `npm install` for faster, reliable builds
3. Run tests before publishing
4. Use version tagging strategies

Example CI script:
```powershell
# Install dependencies
npm ci

# Run tests
npm test

# Build
npm run build

# Publish
npm publish
```

## Security Best Practices

1. **Never commit credentials** to version control
2. **Use environment variables** for sensitive data
3. **Rotate auth tokens** regularly
4. **Use scoped packages** when possible
5. **Review .npmignore** to exclude sensitive files