import sys, base64, requests, os, json

if len(sys.argv) < 2:
    print("Usage: analyze.py <image>")
    sys.exit(1)

image_path = sys.argv[1]

with open(image_path, "rb") as f:
    b64 = base64.b64encode(f.read()).decode()

api_key = os.environ.get("OPENROUTER_API_KEY")

if not api_key:
    print("OPENROUTER_API_KEY not found in environment")
    sys.exit(1)

payload = {
"model": "google/gemini-2.5-flash-image",
"messages": [
{
"role": "user",
"content": [
{"type": "text", "text": "Analyze this screenshot in detail. Identify UI elements, visible text, errors, and what the user might be experiencing."},
{
"type": "image_url",
"image_url": {"url": f"data:image/jpeg;base64,{b64}"}
}
]
}
]
}

headers = {
"Authorization": f"Bearer {api_key}",
"Content-Type": "application/json",
"HTTP-Referer": "agent-zero",
"X-Title": "Vision Analyzer"
}

r = requests.post(
"https://openrouter.ai/api/v1/chat/completions",
headers=headers,
data=json.dumps(payload)
)

print("STATUS:", r.status_code)

try:
    data = r.json()
    print(json.dumps(data, indent=2))
except:
    print(r.text)
