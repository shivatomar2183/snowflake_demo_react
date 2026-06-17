# Snowflake Supply Chain Demos
### Deploy React apps to Snowflake SPCS — no Docker on your Mac needed

---

## What's Inside

```
snowflake-demos/
├── src/
│   ├── App.jsx              ← Home screen + router
│   ├── OpenFlowDemo.jsx     ← OpenFlow pipeline demo
│   ├── MLOpsDemo.jsx        ← ML/MLOps forecasting demo
│   └── main.jsx             ← Entry point
├── index.html
├── package.json
├── vite.config.js
├── Dockerfile               ← Multi-stage: Node build → NGINX serve
├── nginx.conf               ← SPCS-ready (port 8080)
├── snowflake_setup.sql      ← All SQL to run in Snowflake
└── .github/
    └── workflows/
        └── deploy.yml       ← GitHub Actions — builds Docker in cloud
```

---

## Deployment: No Docker on Mac Needed

Docker runs in **GitHub Actions** (free, in the cloud).
You just push code to GitHub and it builds + pushes to Snowflake.

---

## Step-by-Step Instructions

### 1. Create a GitHub Repository

1. Go to https://github.com/new
2. Create a new **private** repo called `snowflake-demos`
3. Upload all files from this folder to the repo

---

### 2. Get Your Snowflake Registry URL

Run this in your Snowflake worksheet:

```sql
USE ROLE SYSADMIN;
CREATE DATABASE IF NOT EXISTS DEMO_APP_DB;
CREATE SCHEMA IF NOT EXISTS DEMO_APP_DB.PUBLIC;
CREATE IMAGE REPOSITORY IF NOT EXISTS DEMO_APP_DB.PUBLIC.DEMO_REPO;
SHOW IMAGE REPOSITORIES IN SCHEMA DEMO_APP_DB.PUBLIC;
```

Copy the `repository_url` — looks like:
`abc123.registry.snowflakecomputing.com`

---

### 3. Add GitHub Secrets

In your GitHub repo → **Settings → Secrets → Actions → New repository secret**

Add these 3 secrets:

| Secret Name | Value |
|---|---|
| `SNOWFLAKE_REGISTRY` | `abc123.registry.snowflakecomputing.com` |
| `SNOWFLAKE_USERNAME` | Your Snowflake username |
| `SNOWFLAKE_PASSWORD` | Your Snowflake password |

---

### 4. Push to GitHub (Triggers the Build)

```bash
git init
git add .
git commit -m "Initial deploy"
git remote add origin https://github.com/YOUR_USERNAME/snowflake-demos.git
git push -u origin main
```

GitHub Actions will automatically:
- Build the React app
- Package it into Docker
- Push the image to your Snowflake registry

Watch it at: `github.com/YOUR_USERNAME/snowflake-demos/actions`

---

### 5. Run the Snowflake SQL

Open `snowflake_setup.sql` and run it step by step in your Snowflake worksheet.

Key steps:
1. Create compute pool → wait for IDLE
2. Create the service
3. Run `SHOW ENDPOINTS` → copy the URL
4. Open the URL in browser ✅

---

### 6. Suspend When Done (Saves Cost)

```sql
ALTER COMPUTE POOL DEMO_POOL SUSPEND;
```

Resume when you need it again:
```sql
ALTER COMPUTE POOL DEMO_POOL RESUME;
```

---

## Estimated Cost

| Item | Cost |
|---|---|
| Compute Pool (CPU_X64_XS) | ~$0.13/hour while running |
| Storage for image | Negligible |
| GitHub Actions | Free (2,000 mins/month) |

---

## Troubleshooting

**Service not starting?**
```sql
CALL SYSTEM$GET_SERVICE_LOGS('DEMO_APP_DB.PUBLIC.DEMO_APP_SERVICE', 0, 'demo-app', 50);
```

**GitHub Actions failing?**
- Check your 3 secrets are set correctly
- Make sure your Snowflake user has SYSADMIN role

**URL not loading?**
- Wait 2-3 mins after CREATE SERVICE
- Check `DESCRIBE SERVICE DEMO_APP_SERVICE` shows `READY`
