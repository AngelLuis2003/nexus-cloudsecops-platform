# NEXUS — CloudSecOps Command Center

**Enterprise Cloud Security Operations Platform**

NEXUS is a portfolio-grade cloud security operations platform designed to bring cloud asset visibility, vulnerability prioritization, threat detection, incident response, and security compliance into one command center.

> **Current stage:** Foundation / v0.1.0. The dashboard currently uses clearly identified demonstration data. No AWS account is connected yet.

## Product vision

Build a working security operations application with six core modules:

1. **Cloud Asset Inventory** — discover and organize cloud resources.
2. **Vulnerability Management** — track findings and prioritize remediation.
3. **Threat Detection** — identify suspicious activity through detection rules.
4. **Incident Response** — investigate, track, and document security incidents.
5. **Compliance Center** — map security controls and evidence to NIST CSF 2.0.
6. **Executive Risk Dashboard** — summarize security posture and risk trends.

## Technology

- **Frontend:** React, TypeScript, Vite
- **Backend:** Python, FastAPI, Pydantic
- **Data:** PostgreSQL (planned)
- **Delivery:** Docker, GitHub Actions (planned)
- **Cloud & Infrastructure:** AWS, Terraform (planned)
- **Quality & Observability:** pytest, OpenTelemetry (planned)

## Repository structure

```text
.
├── backend/
│   ├── app/
│   │   └── main.py
│   ├── tests/
│   │   └── test_api.py
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── styles.css
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── docker-compose.yml
└── README.md
```

## Run locally

### 1. Start the API

From the repository root:

```bash
cd backend
python -m venv .venv
# Windows PowerShell: .venv\Scripts\Activate.ps1
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

API health: http://localhost:8000/api/health  
Interactive API documentation: http://localhost:8000/docs

### 2. Start the frontend

In a second terminal, from the repository root:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite (normally http://localhost:5173).

### 3. Run backend tests

From the `backend` directory, with the virtual environment activated:

```bash
pytest
```

## Demo data and security

The overview endpoint currently returns static demonstration metrics. These values are not live cloud telemetry and must not be interpreted as a real security assessment. AWS integration, authentication, authorization, persistent storage, and production hardening will be implemented in later stages.

Never commit cloud credentials, API keys, passwords, private keys, or real customer data. Use environment variables and example configuration files for local development.

## Visual direction

NEXUS uses a dark security-operations interface with electric blue and cyan accents, high-contrast risk indicators, responsive layouts, and analyst-focused data panels.

## Roadmap

- [x] Initialize repository and application structure
- [x] Build first command-center dashboard interface
- [x] Add initial FastAPI health and overview endpoints
- [x] Add initial API tests
- [ ] Verify frontend build and backend tests locally
- [ ] Add PostgreSQL data models and migrations
- [ ] Implement asset inventory and vulnerability workflows
- [ ] Add threat detection and incident response workflows
- [ ] Add NIST CSF 2.0 control mapping
- [ ] Add CI checks, observability, and infrastructure automation
- [ ] Integrate AWS safely using least-privilege access

---

NEXUS is an evolving engineering portfolio project. Features and integrations will be documented as they become functional.
