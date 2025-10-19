# Deploy to a separate VM via Jenkins — Quick README

This document walks you through deploying the Node.js app from Jenkins to a separate VM (recommended). Save this file as `README-DEPLOY-VM.md` in your repo and follow the sections below.

Summary
- Target: deploy Node app from Jenkins to a remote VM over SSH.
- Jenkins: server already running and able to run pipeline jobs.
- Target VM: Ubuntu (commands below use Ubuntu). App will run at port 3000 by default.
Replace placeholders:
<VM_IP>` -> remote VM public IP or DNS
`deploy-to-vm` -> Jenkins credentials id (SSH Username with private key)
`azureuser` -> remote VM username (or use `ubuntu`/`ec2-user` if preferred)
- `<VM_IP>` -> remote VM public IP or DNS
- `deploy-to-vm` -> Jenkins credentials id (SSH Username with private key)
- [ ] Add SSH credential to Jenkins (ID: `deploy-to-vm`).
- [ ] Run the pipeline and verify `http://<VM_IP>:3000/health` returns healthy JSON.

---

## 1) Prepare the remote VM (Ubuntu)
Run the following on the target VM:

```bash
#  install Node/Git/rsync
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get update
sudo apt-get install -y nodejs npm git rsync build-essential
sudo mkdir -p /opt/node-app
sudo chown azureuser:azureuser /opt/node-app
sudo chmod 755 /opt/node-app

# allow port 3000
sudo ufw allow OpenSSH
sudo ufw allow 3000/tcp
sudo ufw enable
sudo ufw status

- Adjust user name if you prefer `ubuntu` or `ec2-user` on cloud images.

---

## 2) Generate or reuse an SSH key on the Jenkins host and copy it to the VM
On the Jenkins host (or wherever you create the keys):

```bash
# create a key for Jenkins to use
ssh-keygen -t ed25519 -f jenkins-deploy-key -N ""

# copy public key to VM (replace IP and user)
ssh-copy-id -i jenkins-deploy-key.pub azureuser@<VM_IP>

# test the connection
ssh -i jenkins-deploy-key azureuser@<VM_IP> 'echo "SSH to VM OK"; whoami; pwd'
```
If `ssh-copy-id` is not available, append the public key to `/home/deploy/.ssh/authorized_keys` on the VM.

---

## 3) Add SSH credential in Jenkins
1. Jenkins → Credentials → System → Global credentials → Add Credentials
2. Kind: **SSH Username with private key**
   - Username: `azureuser`
   - Private Key: Enter directly (paste contents of `jenkins-deploy-key` private key)
3. Save

---

## 4) Jenkinsfile to deploy to remote VM via SSH + rsync
Copy this pipeline into your Jenkins job or the repo Jenkinsfile. It syncs the workspace to the VM, installs deps, starts the app (does not stop by default), and performs a health check. Replace `<VM_IP>` or provide as parameter.

```groovy
pipeline {
  agent any
  parameters {
    string(name: 'TARGET_IP', defaultValue: '172.212.218.66', description: 'Target VM IP or hostname')
    booleanParam(name: 'STOP_APP', defaultValue: false, description: 'If true, stop the remote app after run')
  }
  stages {
    stage('Deploy to VM') {
      steps {
        script {
          def remote = "azureuser@${params.TARGET_IP}"
          def remoteDir = "/opt/node-app"
          withCredentials([sshUserPrivateKey(credentialsId: 'deploy-to-vm', keyFileVariable: 'SSH_KEY')]) {
            // compute stop flag here to avoid interpolating credentials
            def stopFlag = params.STOP_APP ? 'true' : 'false'
            sh """
              set -e
              # ensure target dir exists
              ssh -i \$SSH_KEY -o StrictHostKeyChecking=no ${remote} 'mkdir -p ${remoteDir}'
              # sync workspace to remote (do not preserve owner/group/permissions)
              rsync -e "ssh -i \$SSH_KEY -o StrictHostKeyChecking=no" -rlptD --no-owner --no-group --no-perms --delete $WORKSPACE/ ${remote}:${remoteDir}/
              # run remote deploy commands (single ssh command to avoid heredoc/indent issues)
              ssh -i \$SSH_KEY -o StrictHostKeyChecking=no ${remote} 'cd ${remoteDir} && npm ci --no-audit --no-fund && if [ "${stopFlag}" = "true" ]; then npm run stop || pkill -f "node app/server.js" || true; fi && nohup npm start > server.out.log 2>&1 & sleep 2 && echo "=== Remote app logs ===" && tail -n 20 server.out.log || true'
            """
          }
        }
      }
    }

    stage('Remote Health Check') {
      steps {
        script {
          def ip = params.TARGET_IP
          sh """
            set -e
            for i in \$(seq 1 10); do
              if curl -sS http://${ip}:3000/health | grep -q 'healthy'; then
                echo 'Remote app is healthy'
                exit 0
              fi
              echo 'Waiting for remote app...'
              sleep 2
            done
            echo 'Remote app did not become healthy' >&2
            exit 1
          """
        }
      }
    }
  }

  post {
    always {
      echo 'Deploy finished; check remote logs if needed'
    }
  }
}
Notes:
- You can make `TARGET_IP` a job parameter or hardcode the IP.

## 5) How to run the job
- Pipeline output will show remote logs and health check result.


## 6) Verify & access the app
- After successful run:
  - Health: `http://<VM_IP>:3000/health`

- From PowerShell:
```powershell
Test-NetConnection -ComputerName <VM_IP> -Port 3000
```


## 7) Logs & rollback
- View logs:
ssh -i jenkins-deploy-key azureuser@<VM_IP> 'tail -n 200 /opt/node-app/server.out.log'
```
- Rollback to a previous commit or tag:
```bash
```

---

## 8) Optional: run the app as a managed service (systemd example)
Create a systemd unit on the VM to supervise the app (recommended for production):

```bash
# as root: create /etc/systemd/system/node-app.service
sudo tee /etc/systemd/system/node-app.service > /dev/null <<'EOF'
[Unit]
Description=Node.js App
After=network.target

[Service]
User=deploy
WorkingDirectory=/opt/node-app
Environment=NODE_ENV=production
ExecStart=/usr/bin/node /opt/node-app/app/server.js
Restart=always
RestartSec=5
StandardOutput=file:/opt/node-app/server.out.log
StandardError=file:/opt/node-app/server.err.log

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now node-app
sudo journalctl -u node-app -f
```
If you use systemd, update the pipeline to `systemctl restart node-app` instead of `nohup` so the service is managed.

- Limit the VM security group to known IP ranges.
- Consider adding a reverse proxy (Nginx) and TLS termination for production.

- Replace `<VM_IP>` with a job parameter and keep `deploy-to-vm` as the Jenkins credentials id.
- Add a pipeline stage to install `rsync` on the Jenkins container if it’s missing, or switch to `scp`.
- Add a stage to create the systemd unit on first deploy, then use `systemctl restart node-app` on subsequent deploys.

If you want, I can patch the repo `Jenkinsfile` to use `TARGET_IP` and `deploy-to-vm` automatically. Just tell me to proceed.
