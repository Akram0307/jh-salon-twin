---
name: openrouter_image_generation
version: 1.0.0
description: Generate images with OpenRouter using google/gemini-3.1-flash-image-preview and save them locally.
author: Agent Zero
tags: [image-generation, openrouter, gemini, ui-mockups]
---

# OpenRouter Image Generation

Generate images with OpenRouter using `google/gemini-3.1-flash-image-preview`.

## Script
`/a0/usr/projects/jh_salon_twin/skills/openrouter_image_generation/scripts/generate_image.py`

## Usage
```bash
OPENROUTER_API_KEY='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' \
python /a0/usr/projects/jh_salon_twin/skills/openrouter_image_generation/scripts/generate_image.py \
  --prompt "Generate a beautiful sunset over mountains" \
  --outdir /a0/usr/projects/jh_salon_twin/generated_images/test
```
