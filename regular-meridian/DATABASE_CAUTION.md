# Cloudflare D1 Database Management Caution Guidelines

This document outlines critical precautions, lessons learned, and guidelines for managing the Cloudflare D1 database (`ipl-leaderboard`) to prevent accidental data loss or database wipes.

---

## 🚨 Critical Precautions

### 1. No Destructive SQL in Initialization Scripts
- **Rule**: Never include `DROP TABLE IF EXISTS` or other destructive statements (like `DELETE FROM`) in files like [schema.sql](file:///d:/IPL_GAME/regular-meridian/schema.sql) once a database is in production.
- **Why**: Running schema initialization scripts during development, deployment, or migrations will immediately wipe all live player records.
- **Action**: Always use constructive `CREATE TABLE IF NOT EXISTS` declarations.

### 2. Restrict Direct SQL Execution on Production
- **Rule**: Do not run arbitrary execute commands against the production D1 database:
  - **AVOID**: `npx wrangler d1 execute ipl-leaderboard --remote --file=schema.sql` (unless it is a migration script with no destructive statements).
- **Why**: Raw SQL executions lack safety boundaries and can instantly delete tables, columns, or rows.

### 3. Use Incremental D1 Migrations
- **Rule**: For any schema changes (such as adding columns, indices, or new tables), use the official D1 migration system:
  - **Create a migration**: `npx wrangler d1 migrations create ipl-leaderboard <migration_name>`
  - **Apply migrations**: `npx wrangler d1 migrations apply ipl-leaderboard --remote`
- **Why**: Migrations apply changes incrementally without dropping existing tables or data.

---

## ⏮️ How to Recover Wiped Data (Cloudflare D1 Backups)

Cloudflare D1 automatically captures daily backups. If the database is accidentally wiped or corrupted, follow these steps to recover the data:

1. **Log in** to your Cloudflare Dashboard.
2. Go to **Workers & Pages** > **D1** (SQL Databases) in the sidebar.
3. Select your database: **`ipl-leaderboard`**.
4. Click on the **Backups** tab.
5. Identify a backup from a timestamp **just before** the wipe occurred (e.g. yesterday).
6. Click **Restore** next to the desired backup and confirm the action.

---

## 🛠️ Local vs Remote Environments

| Command | Environment | Database | Action |
| :--- | :--- | :--- | :--- |
| `npx wrangler pages dev` | Local Dev | Local SQLite (`.wrangler/state`) | Safe for testing. Does not affect live players. |
| `npx wrangler pages dev --remote` | Local Dev | Cloudflare D1 Cloud (Live Database) | **CAUTION**: Modifying data inside the app will affect the live production database. |
| `npx wrangler pages deploy` | Production | Cloudflare D1 Cloud (Live Database) | Safe. Deploys code, but does not execute database initialization files. |
