# Priority 3: Architecture Consolidation Plan

## Overview
Following successful implementation of Priority 1 (Security) and Priority 2 (Performance), Priority 3 focuses on consolidating and simplifying the architecture to reduce complexity, improve maintainability, and optimize resource usage.

## Key Objectives
- Reduce service sprawl and code duplication
- Consolidate API endpoints and routes
- Optimize database queries and connections
- Simplify module dependencies
- Remove redundant features and dead code

## Implementation Tasks

### 1. Service Consolidation ✅
- [x] Merge multiple AI service files into unified service (created unified-ai-service.ts)
- [x] Consolidate duplicate authentication logic (merged into consolidated-routes.ts)
- [x] Combine vector search implementations (in unified-ai-service.ts)
- [x] Unify document processing pipelines

### 2. API Route Optimization ✅
- [x] Merge simple-routes.ts and routes.ts into single router (created consolidated-routes.ts)
- [x] Eliminate duplicate endpoints
- [x] Standardize API response formats
- [x] Implement consistent error handling

### 3. Database Query Optimization ✅
- [x] Implement connection pooling (server/db-optimized.ts with pool config)
- [x] Add query result caching (DatabaseOptimizer.queryCache implementation)
- [x] Optimize N+1 queries (optimizedQueries with joined relations)
- [x] Create database indexes for common queries (6 indexes created)

### 4. Module Reorganization ✅
- [x] Create clear separation between core and feature modules
  - services/ - Business logic
  - middleware/ - Express middleware
  - utils/ - Utility functions
  - config/ - Configuration files
- [x] Implement cleaner imports (all paths updated)
- [x] Remove circular dependencies
- [x] Standardize naming conventions

### 5. Dead Code Elimination ✅
- [x] Remove unused components and services
  - Removed: website-scraper-broken.ts, ai-enhanced-search.ts, smart-routing.ts
  - Removed: routes-minimal.ts, dev-auth.ts, old backup files
- [x] Clean up legacy migration scripts
- [x] Delete obsolete configuration files
- [x] Remove commented-out code blocks

## Expected Benefits
- 30-40% reduction in codebase size
- Improved startup time
- Easier debugging and maintenance
- Reduced memory footprint
- Cleaner architecture for future features