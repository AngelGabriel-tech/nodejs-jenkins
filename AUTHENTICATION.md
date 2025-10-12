# Quick Authentication Setup for Nexus Publishing

## Before You Start

1. Replace `your-nexus-server` in `.npmrc` and `package.json` with your actual Nexus server URL
2. Ensure your Nexus repository is configured to accept npm packages
3. **For PowerShell users:** If npm commands don't work, run:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

## Authentication Setup (Username/Password)

### Step 1: Encode Your Password

**PowerShell:**
```powershell
[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("your-password"))
```

Copy the output - this is your base64-encoded password.

### Step 2: Update .npmrc File

Add these lines to your `.npmrc` file (replace the placeholders):
```properties
//your-nexus-server:8081/repository/npm-hosted/:username=your-username
//your-nexus-server:8081/repository/npm-hosted/:_password=your-base64-encoded-password
//your-nexus-server:8081/repository/npm-hosted/:always-auth=true
```

### Example Configuration

If your:
- Nexus server is at: `nexus.company.com:8081`
- Username is: `john.doe`
- Password is: `mypassword123`

First encode the password:
```powershell
[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("mypassword123"))
# Output: bXlwYXNzd29yZDEyMw==
```

Then your `.npmrc` should contain:
```properties
registry=http://nexus.company.com:8081/repository/npm-group/
//nexus.company.com:8081/repository/npm-hosted/:username=john.doe
//nexus.company.com:8081/repository/npm-hosted/:_password=bXlwYXNzd29yZDEyMw==
//nexus.company.com:8081/repository/npm-hosted/:always-auth=true
```

## Test Authentication

```powershell
npm whoami --registry=http://your-nexus-server:8081/repository/npm-hosted/
```

## Quick Publish Steps

1. **Update version:**
   ```powershell
   npm version patch
   ```

2. **Publish:**
   ```powershell
   npm publish
   ```

That's it! 🚀