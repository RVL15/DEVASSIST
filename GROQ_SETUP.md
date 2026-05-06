# Groq API Setup (Fast & Free)

## Step 1: Get Free Groq API Key
1. Visit https://console.groq.com/keys
2. Sign up for free account
3. Copy your API key

## Step 2: Set Environment Variable
**Windows (PowerShell):**
```powershell
$env:GROQ_API_KEY = "your_api_key_here"
```

**Or create `.env` file in backend folder:**
```
GROQ_API_KEY=your_api_key_here
```

## Step 3: Run Backend
```bash
cd devassist/backend
python main.py
```

## Features
- ✅ **Fast**: Inference in ~1-2 seconds
- ✅ **Free**: 25 requests/day free tier
- ✅ **Online**: No local setup needed
- ✅ **Works**: Mixtral-8x7b model (powerful)

## Available Models
- mixtral-8x7b-32768 (default - best)
- llama2-70b-4096
- gemma-7b-it
