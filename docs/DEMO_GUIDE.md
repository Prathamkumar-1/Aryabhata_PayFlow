<div align="center">

# PayFlow — Demo Guide

### Quick-Start for Evaluators & Judges

**iDEA 2.0 National Level Hackathon Round 2 | PS3: Fund Flow Tracking for Fraud Detection | Team Aryabhata**

</div>

---

## Prerequisites

| Requirement | Minimum Version | Notes |
|---|---|---|
| Python | 3.11+ | With pip and venv |
| Node.js | 20+ | With npm |
| Ollama | Latest | Optional — AI explanations. [Download here](https://ollama.com) |
| GPU | NVIDIA with 8 GB VRAM | Optional — has CPU fallback |

---

## Step 1: Backend Setup

```powershell
# Navigate to project root
cd path\to\Aryabhata_PayFlow

# Create and activate virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip

# Install all dependencies (including dev)
pip install -e ".[dev]"
```

## Step 2: Ollama Setup (Optional — for AI Explanations)

```powershell
# Pull the Qwen model used for local AI explanations
ollama pull qwen3.5:4b
```

> [!NOTE]
> If Ollama is not installed or you want a faster startup, the system works without it.
> Use `--skip-llm` flag in Step 3 to bypass AI explanations entirely.

## Step 3: Start the Backend

Choose **one** of the following options:

### Option A — Full Pipeline with Dashboard (RECOMMENDED for demo)

```powershell
$env:OLLAMA_URL = "http://localhost:11434"
$env:OLLAMA_MODEL = "qwen3.5:4b"

# Runs ingestion → training → inference, then keeps the dashboard alive
python main.py --serve --events 1500 --accounts 600 --fraud-ratio 0.08
```

### Option B — CPU-Only Mode (No GPU Required)

```powershell
python main.py --serve --cpu-only --events 1500 --accounts 600 --fraud-ratio 0.08
```

### Option C — Skip LLM Entirely (Fastest Startup)

```powershell
python main.py --serve --cpu-only --skip-llm --events 1500 --accounts 600
```

### Option D — FastAPI Standalone (Lightweight)

```powershell
python -m uvicorn src.api.app:create_app --factory --host 127.0.0.1 --port 8000 --reload
```

## Step 4: Start the Frontend

Open a **new terminal** and run:

```powershell
cd path\to\Aryabhata_PayFlow\frontend\app
npm install
npm run dev -- --host 127.0.0.1 --port 3006
```

## Step 5: Open in Browser

| Service | URL |
|---|---|
| **Frontend Console** | [http://127.0.0.1:3006](http://127.0.0.1:3006) |
| **API Docs (Swagger)** | [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) |
| **Ollama Probe** | [http://127.0.0.1:8000/ask](http://127.0.0.1:8000/ask) |

---

## Recommended Demo Flow

> [!TIP]
> Pre-warm everything 15 minutes before your presentation. Start the backend first (`python main.py --serve`), then the frontend. This ensures ML models are trained and the synthetic graph is populated.

### Flow 1: Landing & Role Selection (~1 min)
1. Open [http://127.0.0.1:3006](http://127.0.0.1:3006) → Union Bank branded landing page
2. Select a role (e.g., **"Fraud Analyst"**) — demonstrates RBAC
3. Enter the console → role-based navigation with locked/unlocked tabs

### Flow 2: Pre-Fraud Intelligence (~2 min)
1. Click **"Pre-Fraud Intel"** tab
2. Show real-time media signals, fraud playbooks, and advisory intelligence
3. **Key talking point:** _"This is proactive — signals appear before internal alerts"_

### Flow 3: Event Lab — Live Fraud Simulation (~3 min)
1. Click **"Adaptive Event Lab"** tab
2. Select a template (e.g., **"UPI Mule Cash-Out Chain"**)
3. Click **"Launch Into Pipeline"**
4. Watch the **Live Terminal** stream backend events in real time:
   - Event ingestion → ML scoring → Graph heuristics → Circuit breaker → Qwen explanation
5. **Key talking point:** _"Every step is visible — no black box"_

### Flow 4: Fund-Flow Graph (~2 min)
1. Navigate to the fund-flow graph view
2. Show the 3D/2D graph with suspicious paths highlighted
3. Click on nodes to see account details, risk scores, mule scores
4. **Key talking point:** _"This is the core PS3 answer — we trace where money went"_

### Flow 5: Analytics (~1 min)
1. Click **"Analytics"** tab
2. Show live charts: fraud rate by channel, typology distribution, latency metrics
3. **Key talking point:** _"Operational command centre, not just a one-off report"_

### Flow 6: Investigation & Evidence (~2 min)
1. Show an investigation case with AI-generated explanation
2. Demonstrate evidence packaging (FIU-ready report)
3. **Key talking point:** _"Evidence packages are structured for regulatory submission"_

### Flow 7: Bank Reality & RBAC (~1 min)
1. Switch roles to **"Branch Manager"** — show locked actions
2. Switch to **"Compliance Officer"** — different view
3. **Key talking point:** _"AI doesn't decide. Bank roles decide. AI assists."_

---

## Troubleshooting

| Problem | Solution |
|---|---|
| Port 8000 or 3006 in use | Kill the process: `Get-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess \| Stop-Process` |
| Ollama not available | Use `--skip-llm` flag — all fraud detection works without the LLM |
| No GPU / CUDA errors | Use `--cpu-only` flag — XGBoost and all ML works on CPU |
| Frontend won't start | Delete `node_modules` and run `npm install` again |
| Backend import errors | Make sure virtualenv is activated and `pip install -e ".[dev]"` completed |

---

## API Quick Test

If the frontend is broken, you can verify the backend works via PowerShell:

```powershell
# Inject a custom event
Invoke-RestMethod -Method Post `
  -Uri http://127.0.0.1:8000/api/v1/simulation/inject-event `
  -ContentType "application/json" `
  -Body '{"event_type":"transaction","sender_id":"UBI10000001","receiver_id":"MULE90000001","amount_inr":95000,"channel":"UPI"}'
```

```powershell
# Launch an Event Lab scenario
Invoke-RestMethod -Method Post `
  -Uri http://127.0.0.1:8000/api/v1/simulation/event-lab/runs `
  -ContentType "application/json" `
  -Body '{"template_id":"upi_mule_cashout","mode":"chain","intensity":"scale","analyst_required":true}'
```

---

## Emergency Fallback

If the live demo breaks during presentation:

1. **Screenshots** — 7 curated screenshots in `docs/assets/screenshots/`
2. **README** — All screenshots are embedded in the GitHub README
3. **Swagger UI** — [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) works even if the frontend is broken
4. **API calls** — Use the PowerShell commands above to demo the backend
5. **Codebase walkthrough** — Show the architecture and code structure

---

<div align="center">

**Team Aryabhata** | IIT Bombay | iDEA 2.0 Round 2

</div>
