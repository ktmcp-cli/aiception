> "Six months ago, everyone was talking about MCPs. And I was like, screw MCPs. Every MCP would be better as a CLI."
>
> — [Peter Steinberger](https://twitter.com/steipete), Founder of OpenClaw
> [Watch on YouTube (~2:39:00)](https://www.youtube.com/@lexfridman) | [Lex Fridman Podcast #491](https://lexfridman.com/peter-steinberger/)

# AIception CLI

Production-ready CLI for the [AIception](https://aiception.com) Image Recognition API. Analyze images, detect objects, classify content, and detect nudity directly from your terminal.

> **Disclaimer**: This is an unofficial CLI tool and is not affiliated with, endorsed by, or supported by AIception.

## Installation

```bash
npm install -g @ktmcp-cli/aiception
```

## Configuration

```bash
aiception config set --username YOUR_USERNAME --password YOUR_PASSWORD
```

Get your credentials at [aiception.com](https://aiception.com).

## Usage

### Configuration

```bash
# Set credentials
aiception config set --username YOUR_USERNAME --password YOUR_PASSWORD

# Show configuration
aiception config list

# Get a specific config value
aiception config get username
```

### Image Analysis

```bash
# Analyze an image and get a description
aiception images analyze https://example.com/image.jpg

# Classify an image into categories
aiception images classify https://example.com/photo.png

# Detect objects in an image
aiception images detect-objects https://example.com/scene.jpg
```

### Task Management

AIception processes images asynchronously. Use task commands to retrieve results:

```bash
# Get the result of a processing task
aiception tasks get TASK_ID

# List all recent tasks
aiception tasks list
```

### Nudity Detection

```bash
# Detect nudity in an image
aiception nudity detect https://example.com/image.jpg
```

### JSON Output

All commands support `--json` for machine-readable output:

```bash
# Analyze image and get task ID as JSON
aiception images analyze https://example.com/image.jpg --json

# Get task result as JSON
aiception tasks get TASK_ID --json | jq '.result'

# Check nudity detection result
aiception nudity detect https://example.com/image.jpg --json | jq '{nude: .nude, confidence: .confidence}'
```

## Workflow Example

AIception uses asynchronous processing. Here's a typical workflow:

```bash
# 1. Submit an image for analysis
aiception images analyze https://example.com/photo.jpg
# Note the Task ID from the output

# 2. Poll for the result
aiception tasks get TASK_ID

# 3. Or get it as JSON for scripting
aiception tasks get TASK_ID --json | jq '.result'
```

## Examples

```bash
# Classify a product image
aiception images classify https://shop.example.com/product.jpg

# Detect objects in a scene
aiception images detect-objects https://example.com/street.jpg --json | jq '.objects'

# Moderate user-uploaded content
aiception nudity detect https://upload.example.com/user123/photo.jpg

# Batch analyze images
for url in url1 url2 url3; do
  aiception images analyze $url --json | jq -r '.task_id'
done
```

## License

MIT

---

Part of the [KTMCP CLI](https://killthemcp.com) project — replacing MCPs with simple, composable CLIs.
