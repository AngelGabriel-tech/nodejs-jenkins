# Complete EC2 Deployment Guide

## Prerequisites

### A. Configure AWS Security Group
Before deployment, configure your EC2 Security Group:

1. **AWS Console** → EC2 → Instances
2. **Select your instance** (13.53.171.29)
3. **Security tab** → Click Security Group link
4. **Edit inbound rules** → Add new rule:
   - **Type**: Custom TCP
   - **Port**: 3000
   - **Source**: 0.0.0.0/0 (public) or Your IP (restricted)
5. **Save rules**

### B. Ensure Package is Published
Verify your package is published to Nexus:
- Package: `nodejs-app@1.0.3` (includes HTTP routes)
- Registry: `http://172.202.28.224:8081/repository/demo-npm-hosted/`

## Deployment Steps

## 1. Connect to EC2
```bash
ssh -i "C:\Users\Goftech Support\Downloads\nexuspair.pem" ubuntu@13.53.171.29
```

## 2. Install Node.js (if needed)
Node.js should already be installed. Verify with:
```bash
node --version
npm --version
```

If not installed, use:
```bash
sudo apt update
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
```

## 3. Setup Application Directory
```bash
mkdir ~/nodejs-app-deployment
cd ~/nodejs-app-deployment
```

## 4. Create .npmrc
```bash
cat > .npmrc << EOF
registry=https://registry.npmjs.org/
//172.202.28.224:8081/repository/demo-npm-hosted/:username=demo-user
//172.202.28.224:8081/repository/demo-npm-hosted/:_password=YWRtaW4=
//172.202.28.224:8081/repository/demo-npm-hosted/:always-auth=true
EOF
```

## 5. Install Your Package
```bash
# First install dependencies from public npm
npm install express@4.18.2 pino@8.11.0

# Then install your package from Nexus
npm install nodejs-app@1.0.3 --registry=http://172.202.28.224:8081/repository/demo-npm-hosted/
```

## 6. Test Run
```bash
npx nodejs-app
# or
node node_modules/nodejs-app/app/server.js
```

## 7. Setup as Service (Production)
```bash
sudo tee /etc/systemd/system/nodejs-app.service << EOF
[Unit]
Description=Node.js App
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/nodejs-app-deployment
ExecStart=$(which node) node_modules/nodejs-app/app/server.js
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable nodejs-app
sudo systemctl start nodejs-app
sudo systemctl status nodejs-app
```

## 8. Test Application

### Local Test (from EC2):
```bash
curl http://localhost:3000
```

### Public Access:
Your application is now accessible at:
**http://13.53.171.29:3000**

### Test from Your Local Machine:
```powershell
curl http://13.53.171.29:3000
# or open in browser: http://13.53.171.29:3000
```

## 9. Verify Deployment Success

Check service status:
```bash
sudo systemctl status nodejs-app
```

View real-time logs:
```bash
sudo journalctl -u nodejs-app -f
```

## Management Commands

```bash
# View logs
sudo journalctl -u nodejs-app -f

# Restart service
sudo systemctl restart nodejs-app

# Stop service
sudo systemctl stop nodejs-app

# Start service
sudo systemctl start nodejs-app

# Update application
npm install nodejs-app@latest --registry=http://172.202.28.224:8081/repository/demo-npm-hosted/
sudo systemctl restart nodejs-app

# Check service status
sudo systemctl status nodejs-app
```

## Troubleshooting

### If service fails to start:
```bash
# Check service status
sudo systemctl status nodejs-app

# Check logs for errors
sudo journalctl -u nodejs-app --no-pager

# Restart service
sudo systemctl restart nodejs-app
```

### If application is not accessible:
1. **Check Security Group** - Ensure port 3000 is open
2. **Check Service Status** - `sudo systemctl status nodejs-app`
3. **Check Process** - `ps aux | grep node`
4. **Check Port** - `netstat -tlnp | grep 3000`

### Update to New Version:
1. **Update local package.json version**
2. **Republish to Nexus**: `npm publish`
3. **Update on EC2**: 
   ```bash
   npm install nodejs-app@new-version --registry=http://172.202.28.224:8081/repository/demo-npm-hosted/
   sudo systemctl restart nodejs-app
   ```

## Success Indicators

✅ **Service Status**: `active (running)`
✅ **Port Listening**: `netstat -tlnp | grep 3000`
✅ **Local Access**: `curl http://localhost:3000` returns response
✅ **Public Access**: `http://13.53.171.29:3000` accessible from browser
✅ **Logs**: Pino logging messages visible in `sudo journalctl -u nodejs-app -f`

## Final Verification

Your Node.js application is successfully deployed when:
- Service is running: `sudo systemctl status nodejs-app`
- Application responds: `curl http://13.53.171.29:3000`
- Logs show Pino messages: `sudo journalctl -u nodejs-app -f`

## Expected Responses

### Successful curl response:
```json
{
  "message": "Hello from Node.js app deployed from Nexus!",
  "timestamp": "2025-09-26T17:04:04.682Z",
  "version": "1.0.3",
  "status": "running"
}
```

### Health check endpoint:
```bash
curl http://13.53.171.29:3000/health
```
Response:
```json
{
  "status": "healthy",
  "uptime": 123.45,
  "timestamp": "2025-09-26T17:04:04.682Z"
}
```

## Common Issues and Solutions

### Issue: "Cannot GET /"
**Cause**: Application running but no routes defined
**Solution**: Ensure you're using version 1.0.3+ which includes HTTP routes

### Issue: npm install fails with E404
**Cause**: Package not found in registry
**Solution**: 
1. Verify package exists in Nexus web interface
2. Check authentication credentials
3. Use correct registry URL with `--registry` flag

### Issue: Service won't start
**Cause**: Multiple possible issues
**Solution**:
```bash
# Kill any existing node processes
sudo pkill -f node

# Check what's using port 3000
sudo netstat -tlnp | grep 3000

# Restart service
sudo systemctl restart nodejs-app
```

## Complete Deployment Workflow

### For New Deployments:
1. **Develop locally** → Test your Node.js app
2. **Build package** → `npm run build`
3. **Publish to Nexus** → `npm publish`
4. **Deploy to EC2** → Follow steps 1-7
5. **Test deployment** → Step 8
6. **Verify success** → Step 9

### For Updates:
1. **Update code locally**
2. **Update version** → `package.json`
3. **Republish** → `npm publish`
4. **Update EC2** → Management Commands section
5. **Test changes** → `curl http://13.53.171.29:3000`

## Security Considerations

- ⚠️ **Security Group**: Consider restricting port 3000 to specific IPs instead of 0.0.0.0/0
- ⚠️ **HTTPS**: For production, set up SSL/TLS with a reverse proxy (nginx/Apache)
- ⚠️ **Authentication**: The current setup uses basic auth - consider more secure methods for production
- ⚠️ **Firewall**: Consider additional firewall rules on the EC2 instance

## Next Steps for Production

1. **Set up reverse proxy** (nginx) with SSL
2. **Configure domain name** and DNS
3. **Set up monitoring** and alerting
4. **Implement log aggregation**
5. **Set up automated backups**
6. **Configure auto-scaling** if needed

## Instance Cleanup for Fresh Tasks

### Complete EC2 Instance Reset

To prepare your EC2 instance for a fresh deployment or different project:

#### Step 1: Stop and Remove Current Services
```bash
# Stop the current Node.js service
sudo systemctl stop nodejs-app
sudo systemctl disable nodejs-app

# Remove the service file
sudo rm /etc/systemd/system/nodejs-app.service

# Reload systemd
sudo systemctl daemon-reload
```

#### Step 2: Clean Up Application Files
```bash
# Remove deployment directory
rm -rf ~/nodejs-app-deployment

# Clean npm cache
npm cache clean --force

# Remove global npm packages (if any were installed)
sudo npm list -g --depth=0
# Then remove specific packages if needed:
# sudo npm uninstall -g package-name
```

#### Step 3: Kill Any Running Processes
```bash
# Kill any remaining node processes
sudo pkill -f node

# Check for any processes using port 3000
sudo netstat -tlnp | grep 3000

# Kill specific processes if found (replace PID with actual process ID)
# sudo kill -9 PID
```

#### Step 4: Clean System Logs
```bash
# Clear systemd logs for the service
sudo journalctl --vacuum-time=1d

# Or clear all logs older than 1 day
sudo find /var/log -name "*.log" -type f -mtime +1 -delete
```

#### Step 5: Reset Network/Firewall (Optional)
```bash
# Check current iptables rules
sudo iptables -L

# Reset to default if needed (be careful with this)
# sudo iptables -F
# sudo iptables -X
# sudo iptables -t nat -F
# sudo iptables -t nat -X
# sudo iptables -t mangle -F
# sudo iptables -t mangle -X
```

#### Step 6: Update System Packages
```bash
# Update package lists
sudo apt update

# Upgrade installed packages
sudo apt upgrade -y

# Remove unnecessary packages
sudo apt autoremove -y

# Clean package cache
sudo apt autoclean
```

#### Step 7: Verify Clean State
```bash
# Check no node processes running
ps aux | grep node

# Check no services using port 3000
sudo netstat -tlnp | grep 3000

# Check systemd services
sudo systemctl list-units --state=active | grep nodejs

# Check home directory is clean
ls -la ~/
```

### Quick Cleanup Script

Create a cleanup script for future use:

```bash
# Create cleanup script
cat > ~/cleanup-instance.sh << 'EOF'
#!/bin/bash
echo "🧹 Starting EC2 instance cleanup..."

# Stop services
echo "Stopping services..."
sudo systemctl stop nodejs-app 2>/dev/null || echo "Service not found"
sudo systemctl disable nodejs-app 2>/dev/null || echo "Service not enabled"

# Remove service files
echo "Removing service files..."
sudo rm -f /etc/systemd/system/nodejs-app.service
sudo systemctl daemon-reload

# Clean application files
echo "Cleaning application files..."
rm -rf ~/nodejs-app-deployment
rm -rf ~/.npm/_logs/*
npm cache clean --force 2>/dev/null || echo "npm not configured"

# Kill processes
echo "Killing node processes..."
sudo pkill -f node 2>/dev/null || echo "No node processes found"

# Clean logs
echo "Cleaning logs..."
sudo journalctl --vacuum-time=1d

# Update system
echo "Updating system..."
sudo apt update && sudo apt upgrade -y
sudo apt autoremove -y
sudo apt autoclean

echo "✅ Cleanup completed!"
echo "📋 Verification:"
echo "Node processes: $(ps aux | grep node | grep -v grep | wc -l)"
echo "Port 3000 usage: $(sudo netstat -tlnp | grep 3000 | wc -l)"
echo "🎉 Instance is ready for fresh tasks!"
EOF

# Make script executable
chmod +x ~/cleanup-instance.sh
```

### Run the Cleanup
```bash
# Execute the cleanup script
~/cleanup-instance.sh
```

### Alternative: Nuclear Option (Complete Reset)

If you want to completely reset everything:

```bash
# Remove ALL user files (DANGEROUS - use with caution)
rm -rf ~/.[^.]* ~/*

# Reset bash profile
cp /etc/skel/.bashrc ~/
cp /etc/skel/.profile ~/

# Clear command history
history -c
history -w

# Reboot instance (optional)
sudo reboot
```

### After Cleanup - Fresh Start

Your instance is now clean and ready for:
- ✅ New Node.js projects
- ✅ Different programming languages  
- ✅ Different deployment methods
- ✅ Fresh package installations
- ✅ New service configurations

### Quick Verification Commands

After cleanup, verify your instance is ready:

```bash
# Check system status
df -h                    # Disk space
free -h                  # Memory usage
ps aux | head -10        # Running processes
sudo systemctl list-units --state=active | grep -E "(node|npm|app)" # No custom services
netstat -tlnp | grep 3000  # Port 3000 should be free
```

---

🎉 **Congratulations!** You have successfully deployed a Node.js application from Nexus to EC2!