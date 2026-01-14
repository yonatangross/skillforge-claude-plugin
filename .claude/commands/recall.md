# /recall - Search semantic memory

Search past decisions and patterns stored in mem0.

## Usage

```
/recall <search query>
/recall --category <category> <search query>
/recall --limit <number> <search query>
```

## Options

- `--category <category>` - Filter by category (decision, architecture, pattern, blocker, constraint, preference)
- `--limit <number>` - Maximum results to return (default: 10)

## Instructions

When the user runs `/recall`:

1. **Parse the input:**
   - Check for `--category <category>` flag
   - Check for `--limit <number>` flag
   - Extract the search query

2. **Search mem0:**
   Use the `mcp__mem0__search_memories` tool with:
   ```
   query: The user's search query
   filters: {
     "AND": [
       { "user_id": "skillforge-{project-name}-decisions" }
     ]
   }
   limit: specified limit or 10
   ```

   If category is specified, the search query should include the category context.

3. **Format and display results:**
   ```
   🔍 Found {count} memories matching "{query}":

   1. [{time ago}] ({category}) {memory text}

   2. [{time ago}] ({category}) {memory text}

   ...
   ```

4. **Handle no results:**
   ```
   🔍 No memories found matching "{query}"

   Try:
   • Broader search terms
   • /remember to store new decisions
   • Check if mem0 is configured correctly
   ```

## Examples

**Input:** `/recall database`

**Action:**
- Search with query: "database"
- Filter by user_id for current project

**Output:**
```
🔍 Found 3 memories matching "database":

1. [2 days ago] (decision) PostgreSQL chosen for ACID requirements and team familiarity

2. [1 week ago] (pattern) Database connection pooling with pool_size=10, max_overflow=20

3. [2 weeks ago] (architecture) Using pgvector extension for vector similarity search
```

---

**Input:** `/recall --category architecture API`

**Action:**
- Search with query: "API architecture"
- Filter by user_id for current project

**Output:**
```
🔍 Found 2 memories matching "API" (category: architecture):

1. [3 days ago] (architecture) Layered API architecture with controllers, services, repositories

2. [1 week ago] (architecture) API versioning using /api/v1 prefix in URL path
```

---

**Input:** `/recall --limit 5 auth`

**Action:**
- Search with query: "auth"
- Limit to 5 results

**Output:**
```
🔍 Found 5 memories matching "auth":

1. [1 day ago] (decision) JWT authentication with 24h expiry for access tokens

2. [3 days ago] (pattern) Refresh tokens stored in httpOnly cookies

3. [1 week ago] (architecture) Auth middleware in src/auth/middleware.py

4. [1 week ago] (constraint) Must support OAuth2 for enterprise customers

5. [2 weeks ago] (blocker) Auth tokens not refreshing properly - fixed by adding token rotation
```

## Time Formatting

- Less than 1 day: "today"
- 1 day: "yesterday"
- 2-7 days: "X days ago"
- 1-4 weeks: "X weeks ago"
- More than 4 weeks: "X months ago"

## Error Handling

- If mem0 is unavailable, inform the user and suggest checking MCP configuration
- If search query is empty, show recent memories instead
- If no results, suggest alternatives