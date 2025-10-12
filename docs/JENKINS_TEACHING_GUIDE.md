# Jenkins Teaching Guide

This guide uses the included Node.js sample app as a hands-on scaffold to teach Jenkins concepts. It walks students from creating a simple Freestyle job to GitHub integration, Pipeline jobs using a `Jenkinsfile`, and then deeper Jenkinsfile syntax and tips.

## Goals

- Run a basic Freestyle (free-style) job to build and view console output.
- Create a Pipeline job that uses a `Jenkinsfile` from the repository.
- Connect Jenkins to GitHub (webhooks & credentials) and trigger builds from pushes.
- Learn the structure of a `Jenkinsfile` and practice common pipeline steps.
- Practice Groovy-based syntax constructs used in Jenkins pipelines.

---

## Prerequisites

- A running Jenkins instance (LTS recommended). For classroom use, a single VM or cloud instance is fine.
- Administrator access to Jenkins to create jobs and configure plugins.
- (Optional) A public GitHub account and repository fork of this project.
- The sample project in this repo (or a fork/clone). The important files:
  - `app/jenkins/Jenkinsfile` — sample pipeline
  - `app/public` — static site used for demo triggers
  - `app/server.js` — small Express app exposing `/api/trigger-pipeline` and `/api/jenkinsfile`.

---

## Quick Start (local testing without SCM integration)

1. Run the Node app locally (on a machine reachable by your Jenkins instance if you plan to call webhooks):

   ```bash
   cd path/to/node-app
   npm install
   npm start
   ```

2. Verify the sample app:
   - Open `http://<host>:3000` — you should see the demo UI.
   - `http://<host>:3000/api/jenkinsfile` returns the sample Jenkinsfile.

3. Create a Freestyle job in Jenkins:
   - New Item -> Freestyle project -> give it a name (e.g., `demo-freestyle`).
   - Add a build step `Execute shell` (or "Execute Windows batch command" on Windows) and add:
     ```bash
     echo "Building demo app"
     curl -sS http://<node-host>:3000/api/info
     ```
   - Save and click Build Now. View Console Output to see the echo and the curl response.


---

## Exercise 1 — Freestyle Job (learning job creation & console output)

Instructor notes:
- This exercise teaches UI navigation, build steps, and console logs.

Student steps:
1. Create a new Freestyle project as in Quick Start.
2. Add a build step that runs a small shell script.
3. Run the job, inspect Console Output, and record how exit codes and logs appear.

Discussion points:
- What happens if a command fails? (Build marked as failed)
- How to make a step "optional" or continue on error? (use shell logic or try/catch in pipelines)

---

## Exercise 2 — Pipeline Job from SCM (Jenkinsfile)

Instructor notes:
- This shows how to store pipeline-as-code in your repo and leverage Jenkinsfile.

Student steps:
1. Fork or clone this repository into your GitHub account (or use the provided Git URL).
2. In Jenkins: New Item -> Pipeline -> give name (e.g., `demo-pipeline`)
3. In the Pipeline configuration:
   - Definition: Pipeline script from SCM
   - SCM: Git
   - Repository URL: `https://github.com/<your-user>/node-app.git` (or the class repo)
   - Script Path: `app/jenkins/Jenkinsfile`
4. Save and click Build Now.
5. Inspect the pipeline stages in the Blue Ocean view or classic stage view.

Discussion points:
- Where the workspace is checked out, how stages are executed, and where artifacts can be archived.

---

## Exercise 3 — Connect GitHub & Webhooks

Instructor notes:
- Show students how to add credentials and configure webhooks so pushes automatically trigger builds.

Student steps:
1. In Jenkins, install or ensure the GitHub plugin is installed (GitHub Integration plugin or GitHub Branch Source for multibranch).
2. Add GitHub credentials in Jenkins (Credentials -> System -> Add Credentials -> GitHub token or username/password).
3. Create a webhook in the GitHub repository settings:
   - Payload URL: `http://<jenkins-host>/github-webhook/`
   - Content type: `application/json`
   - Events: `Just the push event` (or choose all push/pull_request for demos)
4. In Jenkins job configuration, under Build Triggers, enable "GitHub hook trigger for GITScm polling" or configure multibranch to use the webhook automatically.
5. Make a small commit to your repo and push. Observe Jenkins receiving webhook and starting a build.

Troubleshooting tips:
- If webhooks aren't received, check that your Jenkins host is accessible from GitHub (use ngrok for local demos or a public VM).
- Check Jenkins system logs for webhook delivery.

---

## Jenkinsfile basics (breakdown of `app/jenkins/Jenkinsfile`)

Example file in this project:

```groovy
pipeline {
    agent any
    stages {
        stage('Build') {
            steps {
                echo 'Building the application...'
                // Example: sh 'npm install'
            }
        }
        stage('Test') {
            steps {
                echo 'Running tests...'
                // Example: sh 'npm test'
            }
        }
        stage('Deploy') {
            steps {
                echo 'Deploying...'
                // Example: sh 'npm run deploy'
            }
        }
    }
}
```

Key concepts:
- `pipeline` block — top-level structure for Declarative Pipeline.
- `agent` — where the pipeline or a stage runs (e.g., `any`, `label 'docker'`, or `none`).
- `stages` and `stage` — logical grouping of steps shown in the UI.
- `steps` — commands executed for a given stage.

---

## Exercise 4 — Modify and extend the Jenkinsfile

Student steps:
1. Update `app/jenkins/Jenkinsfile` in your fork to run real commands:
   - Run `npm install` in Build stage
   - Run `npm test` in Test stage (you may add a simple test script to `package.json`)
2. Commit and push your changes; observe Jenkins pipeline executing these commands.
3. Add an `post` block to send notifications (e.g., `post { always { echo 'Done' } }`).

Answers / Hints:
- Use `sh 'npm install'` on Linux agents and `bat 'npm install'` on Windows agents.
- Use `archiveArtifacts` to save build outputs.

---

## Exercise 5 — Jenkinsfile syntax and Groovy fundamentals

Learning goals:
- Understand when to use Declarative vs Scripted pipelines.
- Learn simple Groovy constructs used in Jenkinsfiles (variables, conditionals, loops).

Short primer:
- Declarative pipelines provide strict structure and built-in stages/steps. Start here for teaching.
- Scripted pipelines are full Groovy scripts and are more flexible but less opinionated.

Example: conditional stage

```groovy
stage('Conditional') {
  when {
    branch 'main'
  }
  steps {
    echo "Only runs on main branch"
  }
}
```

Example: using environment variables and credentials

```groovy
pipeline {
  agent any
  environment {
    MY_ENV = 'value'
  }
  stages {
    stage('Show') {
      steps {
        echo "env.MY_ENV = ${env.MY_ENV}"
      }
    }
  }
}
```

Using credentials:
```groovy
withCredentials([string(credentialsId: 'GH_TOKEN', variable: 'TOKEN')]) {
  sh 'curl -H "Authorization: token $TOKEN" https://api.github.com/user'
}
```

---

## Troubleshooting & common pitfalls

- Jenkins agent labels: ensure the node you target has the required tools (node, docker, etc.).
- Workspace cleanup: use `cleanWs()` or `deleteDir()` when needed.
- Make sure credentials IDs in your Jenkinsfile match those stored in Jenkins.
- If builds hang, open the agent logs and check for missing executables.

---

## Optional advanced topics

- Multibranch Pipelines and GitHub Organization folders.
- Using Docker agents and containerized builds.
- Caching `node_modules` between builds.
- Using shared libraries for common pipeline code.

---

## Classroom assessment ideas

- Ask students to add a failing test to see pipeline failure handling.
- Have students implement a caching strategy and measure speedup.
- Challenge: convert the Declarative Jenkinsfile to a Scripted pipeline and discuss the tradeoffs.

---

## References

- Jenkins Pipeline Syntax: https://www.jenkins.io/doc/book/pipeline/syntax/
- Pipeline Steps Reference: https://www.jenkins.io/doc/pipeline/steps/
- Jenkinsfile examples: https://github.com/jenkinsci/pipeline-examples


---

If you'd like, I can also:
- Add a small `run-local.ps1` and `run-local.sh` scripts to the repo to help students start the server quickly.
- Add a sample test (e.g., using jest) so the Test stage runs real assertions.
- Expand the Jenkinsfile with `archiveArtifacts`, `stash/unstash`, or Docker agent examples.

Tell me which extras you want and I'll implement them next.
