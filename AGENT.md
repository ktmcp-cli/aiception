# AIception CLI - AI Agent Guide

This CLI provides programmatic access to the AIception Image Recognition API.

## Quick Start for AI Agents

```bash
aiception config set --username YOUR_USER --password YOUR_PASS
aiception images analyze https://example.com/image.jpg
aiception tasks get TASK_ID
```

## Available Commands

### config
- `aiception config set --username <user> --password <pass>` - Set credentials
- `aiception config get <key>` - Get config value
- `aiception config list` - Show all config

### images
- `aiception images analyze <url>` - Analyze image content
- `aiception images classify <url>` - Classify image into categories
- `aiception images detect-objects <url>` - Detect objects in image

### tasks
- `aiception tasks get <task-id>` - Get async task result
- `aiception tasks list` - List recent tasks

### nudity
- `aiception nudity detect <url>` - Detect nudity in image

## Async Processing Workflow

AIception uses async processing. The typical workflow:

1. Submit image: `aiception images analyze <url> --json | jq -r '.task_id'`
2. Wait for processing
3. Get result: `aiception tasks get <task-id> --json`

## Tips for Agents

- All commands support `--json` for machine-readable output
- Image commands return a task_id for async polling
- Use `--json` and `jq` to extract task IDs automatically
