# MCP Server Optimization Guide

## 🎯 Installed MCP Servers

Your ai-agent-hub installation includes **3 core MCP servers** optimized for token efficiency (~7,000 tokens).

### Core Servers (Always Active)

| Server | Purpose | Token Cost |
|--------|---------|------------|
| **memory** | Conversation context persistence across sessions | ~2,000 |
| **sequential-thinking** | Advanced multi-step reasoning and analysis | ~700 |
| **context7** | Library documentation lookup (npm, frameworks, APIs) | ~1,500 |

**Total core overhead:** ~4,200 tokens

These servers provide essential AI capabilities while following Anthropic's recommendation of 2-3 MCP servers for optimal accuracy.

---

## 📊 Task-Based Server Recommendations

Add additional servers to `.mcp.json` based on your specific tasks:

### 🎨 Frontend/UI Development
```json
{
  "browsermcp": {
    "command": "npx",
    "args": ["@browsermcp/mcp@latest"]
  },
  "shadcn": {
    "command": "npx",
    "args": ["shadcn@latest", "mcp"]
  }
}
```
**Use when:** Building UIs, testing components, working with design systems

### 🔧 Backend/Database Work
```json
{
  "postgres": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-postgres"],
    "env": {
      "POSTGRES_CONNECTION_STRING": "your-connection-string"
    }
  }
}
```
**Use when:** Database schema design, migrations, SQL queries

### 🐙 GitHub Integration
```json
{
  "github": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-github"],
    "env": {
      "GITHUB_TOKEN": "your-token"
    }
  }
}
```
**Use when:** Working with repositories, issues, pull requests

---

## ⚙️ How to Enable/Disable Servers

### Adding a Server
1. Open `.mcp.json` in your project root
2. Add the server configuration to the `mcpServers` object
3. Restart Claude Code or Claude Desktop
4. Verify with `/context` command

### Removing a Server
1. Comment out or delete the server entry from `.mcp.json`
2. Restart Claude

### Example .mcp.json
```json
{
  "mcpServers": {
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp@latest"]
    }
    // Add task-specific servers here as needed
  }
}
```

---

## 🔍 Monitoring Token Usage

Use the `/context` command in Claude Code to see:
- Total tokens consumed by MCP servers
- Which servers are currently active
- Token consumption per server

**Recommended practice:** Check `/context` before starting complex tasks to ensure you're not exceeding token budgets.

---

## 🚀 Advanced Optimizations

### Better Playwright Alternative
If you need browser automation with lower token cost:

```json
{
  "better-playwright": {
    "command": "npx",
    "args": ["-y", "@livoras/better-playwright-mcp@latest"]
  }
}
```
**Benefits:** 70-90% token reduction vs standard playwright (~1,500 tokens vs ~13,647)

### Set Token Output Limits
Configure maximum tokens per MCP response:

```bash
export MAX_MCP_OUTPUT_TOKENS=15000
```

Add to your `.env` file to persist across sessions.

---

## 📖 Best Practices

1. **Start minimal:** Use the 3 core servers for most work
2. **Add selectively:** Enable task-specific servers only when needed
3. **Monitor usage:** Check `/context` regularly
4. **Remove when done:** Disable servers after completing specific tasks
5. **Follow Anthropic's guideline:** Keep total servers to 2-5 for best accuracy

---

## ❓ Frequently Asked Questions

### Why only 3 servers by default?
- Anthropic recommends 2-3 servers for optimal tool use accuracy
- More servers = higher token cost + reduced agent performance
- Core 3 servers provide essential capabilities (~7k tokens vs industry average ~30k)

### What happened to playwright/browsermcp/shadcn?
- Moved to task-specific recommendations
- playwright had documented bugs and high token cost (13,647 tokens)
- browsermcp and shadcn are valuable but not universally needed
- You can easily add them when needed (see examples above)

### How do I know which servers to enable?
- Check the "Task-Based Server Recommendations" section above
- Start your task with core 3 servers
- Add task-specific servers if you need their capabilities
- Use `/context` to monitor impact

### Can I use more than 5 servers?
- Yes, but Anthropic research shows accuracy drops significantly beyond 2-3 servers
- More servers = token bloat + confusion between similar tools
- Recommendation: Be selective and task-focused

---

## 🔗 References

- [Anthropic MCP Documentation](https://docs.anthropic.com)
- [MCP Server Catalog](https://github.com/modelcontextprotocol/servers)
- [Code Execution with MCP](https://www.anthropic.com/engineering/code-execution-with-mcp)

---

*This guide is part of ai-agent-hub v3.5+ token optimization system.*
