---
name: "vision-analyzer"
description: "Analyze images and screenshots using Gemini 3.1 Flash Lite via OpenRouter. Use when vision_load fails or when screenshots need interpretation."
version: "1.0.0"
author: "Agent Zero"
tags: ["vision","gemini","openrouter","image-analysis"]
trigger_patterns:
  - "analyze image"
  - "analyze screenshot"
  - "describe image"
  - "vision analyze"
allowed_tools:
  - "code_execution"
---

# Vision Analyzer (Gemini via OpenRouter)

## When to Use

Use this skill when:
- A user uploads a screenshot
- The `vision_load` tool fails
- UI errors need visual inspection

## Run Analysis

```
python skills/vision_analyzer/scripts/analyze.py /path/to/image.jpg
```

## Output

The script returns:

- Scene description
- UI elements detected
- Text visible in screenshot
- Errors or warnings
- Recommendations

## Model

```
google/gemini-2.5-flash-image
```

## API

OpenRouter endpoint:

```
https://openrouter.ai/api/v1/chat/completions
```

Authentication is read from environment variable:

```
OPENROUTER_API_KEY
```
