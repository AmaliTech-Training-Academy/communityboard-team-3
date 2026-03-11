# Testing Log

## Database Persistence Test

**Date:** 2026-03-11
**Tester:** Joel Alumasa (DevOps)

### Test: Volume Persistence Across Container Restarts

**Objective:** Verify that PostgreSQL data persists when containers are stopped and restarted.

**Procedure:**
1. Started containers with `docker compose up -d`
2. Verified data-seed container loaded sample data
3. Checked initial post count: `SELECT COUNT(*) FROM posts;`
4. Stopped containers: `docker compose down` (without -v flag)
5. Restarted containers: `docker compose up -d`
6. Checked post count again

**Expected Result:** Post count should remain the same after restart

**Actual Result:** ✅ Data persisted correctly
- Initial count: 80 posts
- After restart: 80 posts
- Volume: `communityboard-team-3_pgdata` maintained state

**Conclusion:** Database volume persistence working as expected. Data survives container restarts when using `docker compose down` without the `-v` flag.

**Note:** Using `docker compose down -v` WILL delete all data (removes volumes).

---

## Environment Configuration Test

**Date:** 2026-03-11
**Tester:** Joel Alumasa (DevOps)

### Test: Environment Files Created

**Created Files:**
- ✅ `.env.dev` - Development environment variables
- ✅ `.env.test` - Test environment variables
- ✅ `.env.example` - Template (already existed)

**Status:** Environment configuration structure in place for future use.

**Note:** Currently docker-compose.yml uses hardcoded values. These .env files demonstrate proper practice for when/if we migrate to environment-based configuration.
