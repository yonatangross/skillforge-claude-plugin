# /remember - Store decisions in semantic memory

Store important decisions, patterns, or context in mem0 for future sessions.

## Usage

```
/remember <text>
/remember --category <category> <text>
```

## Categories

- `decision` - Why we chose X over Y (default)
- `architecture` - System design and patterns
- `pattern` - Code conventions and standards
- `blocker` - Known issues and workarounds
- `constraint` - Limitations and requirements
- `preference` - User/team preferences

## Instructions

When the user runs `/remember`:

1. **Parse the input:**
   - Check for `--category <category>` flag
   - Extract the text to remember
   - If no category specified, auto-detect from content

2. **Auto-detect category** (if not specified):
   - Contains "chose/decided/selected" → `decision`
   - Contains "architecture/design/system" → `architecture`
   - Contains "pattern/convention/style" → `pattern`
   - Contains "blocked/issue/bug/workaround" → `blocker`
   - Contains "must/cannot/required/constraint" → `constraint`
   - Default → `decision`

3. **Store in mem0:**
   Use the `mcp__mem0__add_memory` tool with:
   ```
   user_id: "skillforge-{project-name}-decisions"
   text: The user's text
   metadata: {
     "category": detected_category,
     "timestamp": current_datetime,
     "source": "user"
   }
   ```

   The project name should be derived from the current working directory name,
   converted to lowercase with special characters replaced by hyphens.

4. **Confirm storage:**
   Output a confirmation message:
   ```
   ✓ Remembered ({category}): "{summary of text}"
     → Will be recalled in future sessions
   ```

## Examples

**Input:** `/remember We chose PostgreSQL for the database because of ACID requirements and team familiarity`

**Action:**
- Auto-detect category: `decision` (contains "chose")
- Store with user_id: `skillforge-myproject-decisions`

**Output:**
```
✓ Remembered (decision): "PostgreSQL chosen for ACID requirements and team familiarity"
  → Will be recalled in future sessions
```

---

**Input:** `/remember --category architecture The API uses a layered architecture with controllers, services, and repositories`

**Action:**
- Use explicit category: `architecture`
- Store with user_id: `skillforge-myproject-decisions`

**Output:**
```
✓ Remembered (architecture): "Layered API architecture with controllers, services, repositories"
  → Will be recalled in future sessions
```

## Error Handling

- If mem0 is unavailable, inform the user and suggest checking MCP configuration
- If text is empty, ask user to provide something to remember
- If text is too long (>2000 chars), truncate with notice