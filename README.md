# Fabric ERP

Single-repository monorepo for the Fabric Trading ERP.

## Structure

- `fabric-erp-frontend/` — React + TypeScript + Vite web application.
- `fabric-erp-backend/` — FastAPI + MongoDB API.

## Quick start

### Backend

```bash
cd fabric-erp-backend
python -m venv .venv
# Windows: .venv\\Scripts\\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

### Frontend

```bash
cd fabric-erp-frontend
npm install
cp .env.example .env
npm run dev
```

Configure `VITE_API_BASE_URL` in the frontend `.env` to point to the FastAPI server.

## Important

This is an initial development foundation, not a production-ready ERP. Complete business workflows, validations, GST rules, PDF templates, integration tests, and deployment hardening must be implemented and verified before production use.
