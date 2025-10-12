##### build Docker image called node-app. Execute from root

    docker build -t node-app .
    
Node App

A minimal Node.js application used as a teaching scaffold for Jenkins and CI/CD concepts.

Build Docker image (from repo root):

    docker build -t node-app .

Jenkins teaching demo

This repository includes a small web UI and API endpoints useful for teaching Jenkins pipelines and CI/CD concepts.

What was added:

- `app/public/index.html` - small web UI with links and a button to trigger a demo pipeline
- `app/public/jenkins.html` - a short tutorial page with exercises for students
- `app/jenkins/Jenkinsfile` - sample Jenkinsfile demonstrating build/test/deploy stages
- `/api/jenkinsfile` - HTTP GET returns the raw Jenkinsfile
- `/api/trigger-pipeline` - HTTP POST endpoint that simulates queueing a pipeline run (returns JSON)

Running locally

1. Install dependencies: `npm install`
2. Start the app: `npm start`
3. Open `http://localhost:3000` to view the UI
4. Visit `http://localhost:3000/jenkins` for the teaching page

Classroom exercise ideas

- Point a Jenkins Pipeline job at this repo and use `app/jenkins/Jenkinsfile` as the pipeline script.
- Configure a webhook in your SCM to send push events to your Jenkins server; optionally use this app's `/api/trigger-pipeline` as a mock trigger endpoint to demonstrate incoming webhooks.
- Extend the sample Jenkinsfile with real build and test commands.

Notes

This is intentionally minimal so it can be used as a teaching scaffold. Feel free to modify the Jenkinsfile and UI to match your curriculum.
    