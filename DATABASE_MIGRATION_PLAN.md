# Database Migration Plan: TRACER MongoDB → JEREMY PostgreSQL

## Current Situation
- **TRACER cluster**: MongoDB with production data (active development team)
- **JEREMY cluster**: PostgreSQL (Neon) with minimal test data
- **Issue**: Login failures because user data is in TRACER, not JEREMY

## Migration Strategy

### Phase 1: Data Extraction from TRACER MongoDB
1. **Export collections from TRACER MongoDB cluster:**
   - Users (with authentication data)
   - Documents and folders
   - Chat history and messages
   - FAQ knowledge base
   - Training data
   - Admin settings

### Phase 2: Data Transformation
MongoDB → PostgreSQL requires schema mapping:

**MongoDB Collections → PostgreSQL Tables:**
- `users` → `users` table
- `documents` → `documents` table
- `chats` → `chats` table
- `messages` → `messages` table
- `folders` → `folders` table
- `faq_entries` → `faqKnowledgeBase` table

### Phase 3: Data Import to PostgreSQL
Use Drizzle ORM to insert transformed data into current database

## Implementation Options

### Option A: Direct Database Migration Script
Create a Node.js script that:
1. Connects to TRACER MongoDB
2. Exports data to JSON files
3. Transforms data format
4. Imports to PostgreSQL via Drizzle

### Option B: Manual Export/Import
1. Export data from MongoDB using mongoexport
2. Transform JSON data manually
3. Import via SQL or Drizzle scripts

### Option C: Live Sync (Advanced)
Set up real-time synchronization between databases

## Required Information from You

To implement the migration, I need:

1. **TRACER MongoDB connection details:**
   - Connection string
   - Database name
   - Collection names

2. **Access credentials:**
   - Username/password for TRACER cluster
   - Or connection string with auth

3. **Data scope:**
   - Which collections to migrate
   - Date range for historical data
   - User accounts to include

## Next Steps

1. Provide TRACER MongoDB access details
2. I'll create a migration script
3. Test migration with sample data
4. Execute full migration
5. Update authentication system to use migrated data

This will resolve the login issues and give you a complete copy of the production data in your PostgreSQL database.