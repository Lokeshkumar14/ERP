from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.core.database import get_database
from app.routes.auth import router as auth_router
from app.routes.dashboard import router as dashboard_router
from app.routes.customers import router as customers_router
from app.routes.parties import router as parties_router
from app.routes.products import router as products_router
from app.routes.sales_orders import router as sales_orders_router
from app.routes.purchases import router as purchases_router
from app.routes.yarn_inventory import router as yarn_inventory_router
from app.routes.job_work import router as job_work_router
from app.routes.rolls import router as rolls_router
from app.routes.quality import router as quality_router
from app.routes.godowns import router as godowns_router
from app.routes.delivery_challans import router as delivery_challans_router
from app.routes.deliveries import router as deliveries_router
from app.routes.invoices import router as invoices_router
from app.routes.accounts import router as accounts_router
from app.routes.costing import router as costing_router
from app.routes.reports import router as reports_router
from app.routes.audit import router as audit_router
from app.routes.notifications import router as notifications_router
from app.routes.seed import router as seed_router, seed_initial_data

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize DB and auto-seed if needed
    db_wrapper = get_database()
    await db_wrapper.init()
    try:
        await seed_initial_data()
    except Exception as e:
        print(f"Seed note: {e}")
    yield
    # Shutdown

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="TextilePro Fabric Trading ERP Backend API",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes under API_V1_STR
api_prefix = settings.API_V1_STR

app.include_router(auth_router, prefix=api_prefix)
app.include_router(dashboard_router, prefix=api_prefix)
app.include_router(customers_router, prefix=api_prefix)
app.include_router(parties_router, prefix=api_prefix)
app.include_router(products_router, prefix=api_prefix)
app.include_router(sales_orders_router, prefix=api_prefix)
app.include_router(purchases_router, prefix=api_prefix)
app.include_router(yarn_inventory_router, prefix=api_prefix)
app.include_router(job_work_router, prefix=api_prefix)
app.include_router(rolls_router, prefix=api_prefix)
app.include_router(quality_router, prefix=api_prefix)
app.include_router(godowns_router, prefix=api_prefix)
app.include_router(delivery_challans_router, prefix=api_prefix)
app.include_router(deliveries_router, prefix=api_prefix)
app.include_router(invoices_router, prefix=api_prefix)
app.include_router(accounts_router, prefix=api_prefix)
app.include_router(costing_router, prefix=api_prefix)
app.include_router(reports_router, prefix=api_prefix)
app.include_router(audit_router, prefix=api_prefix)
app.include_router(notifications_router, prefix=api_prefix)
app.include_router(seed_router, prefix=api_prefix)

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "app": settings.PROJECT_NAME,
        "database": "online"
    }

@app.get("/")
async def root():
    return {
        "message": "Welcome to TextilePro Fabric Trading ERP API",
        "docs_url": "/docs"
    }
