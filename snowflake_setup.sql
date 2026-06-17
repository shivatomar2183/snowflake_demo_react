-- ═══════════════════════════════════════════════════════════════════
-- SNOWFLAKE SPCS SETUP SCRIPT
-- Run these in order in your Snowflake worksheet
-- ═══════════════════════════════════════════════════════════════════

-- STEP 1: Create database and schema
-- ─────────────────────────────────────────────────────────────────
USE ROLE SYSADMIN;

CREATE DATABASE IF NOT EXISTS DEMO_APP_DB;
CREATE SCHEMA  IF NOT EXISTS DEMO_APP_DB.PUBLIC;

USE DATABASE DEMO_APP_DB;
USE SCHEMA   PUBLIC;
USE WAREHOUSE COMPUTE_WH;


-- STEP 2: Create the image repository
-- ─────────────────────────────────────────────────────────────────
CREATE IMAGE REPOSITORY IF NOT EXISTS DEMO_REPO;

-- !! IMPORTANT: Run this and copy the repository_url value
-- You will need it for your GitHub Secrets
SHOW IMAGE REPOSITORIES IN SCHEMA DEMO_APP_DB.PUBLIC;
-- Example output:
-- repository_url = abc123.registry.snowflakecomputing.com/demo_app_db/public/demo_repo


-- STEP 3: Create compute pool
-- ─────────────────────────────────────────────────────────────────
CREATE COMPUTE POOL IF NOT EXISTS DEMO_POOL
  MIN_NODES = 1
  MAX_NODES = 1
  INSTANCE_FAMILY = CPU_X64_XS;   -- cheapest option, fine for demos

-- Wait ~2 minutes then check it says IDLE
DESCRIBE COMPUTE POOL DEMO_POOL;
-- Status should be: IDLE  (not STARTING)


-- STEP 4: Create External Access Integration (allows HTTPS endpoints)
-- ─────────────────────────────────────────────────────────────────
-- Note: This may already exist in your account
CREATE EXTERNAL ACCESS INTEGRATION IF NOT EXISTS ALLOW_ALL_ACCESS_INTEGRATION
  ALLOWED_NETWORK_RULES = ()
  ENABLED = TRUE;


-- STEP 5: After GitHub Actions pushes the image, create the service
-- ─────────────────────────────────────────────────────────────────
-- Replace <YOUR_ACCOUNT> with your actual account (from SHOW IMAGE REPOSITORIES above)

CREATE SERVICE IF NOT EXISTS DEMO_APP_SERVICE
  IN COMPUTE POOL DEMO_POOL
  FROM SPECIFICATION $$
spec:
  containers:
    - name: demo-app
      image: /demo_app_db/public/demo_repo/snowflake-demos:latest
      resources:
        requests:
          cpu: "0.5"
          memory: 512M
        limits:
          cpu: "1"
          memory: 1G
      readinessProbe:
        port: 8080
        path: /
  endpoints:
    - name: ui
      port: 8080
      public: true
$$
EXTERNAL_ACCESS_INTEGRATIONS = (ALLOW_ALL_ACCESS_INTEGRATION);


-- STEP 6: Check service is running (~2 mins)
-- ─────────────────────────────────────────────────────────────────
DESCRIBE SERVICE DEMO_APP_SERVICE;
-- Status should be: READY

-- Check logs if something goes wrong
CALL SYSTEM$GET_SERVICE_LOGS('DEMO_APP_DB.PUBLIC.DEMO_APP_SERVICE', 0, 'demo-app', 50);


-- STEP 7: Get your public URL
-- ─────────────────────────────────────────────────────────────────
SHOW ENDPOINTS IN SERVICE DEMO_APP_SERVICE;
-- Copy the ingress_url value
-- Looks like: abcdefgh-myorg-myaccount.snowflakecomputing.app
-- Open that URL in your browser ✅


-- STEP 8: Share access with your customer / team
-- ─────────────────────────────────────────────────────────────────
-- Grant access to all Snowflake users
GRANT SERVICE ROLE DEMO_APP_SERVICE!ALL_ENDPOINTS_USAGE TO ROLE PUBLIC;

-- Or grant to specific role only
-- GRANT SERVICE ROLE DEMO_APP_SERVICE!ALL_ENDPOINTS_USAGE TO ROLE ANALYST;


-- ─────────────────────────────────────────────────────────────────
-- COST MANAGEMENT
-- ─────────────────────────────────────────────────────────────────

-- Suspend compute pool when demo is done (stops billing)
ALTER COMPUTE POOL DEMO_POOL SUSPEND;

-- Resume when needed again
ALTER COMPUTE POOL DEMO_POOL RESUME;

-- Teardown everything if no longer needed
-- DROP SERVICE DEMO_APP_DB.PUBLIC.DEMO_APP_SERVICE;
-- DROP COMPUTE POOL DEMO_POOL;
-- DROP IMAGE REPOSITORY DEMO_APP_DB.PUBLIC.DEMO_REPO;
