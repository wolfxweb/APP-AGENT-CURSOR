from fastapi import APIRouter

from app.api.v1.admin import router as admin_router
from app.api.v1.auth import router as auth_router
from app.api.v1.basic_data import router as basic_data_router
from app.api.v1.calculator import router as calculator_router
from app.api.v1.categorias import router as categorias_router
from app.api.v1.diagnostico import router as diagnostico_router
from app.api.v1.eventos_venda import router as eventos_venda_router
from app.api.v1.geo import router as geo_router
from app.api.v1.importancia_meses import router as importancia_meses_router
from app.api.v1.health import router as health_router
from app.api.v1.profile import router as profile_router
from app.api.v1.prioridades import router as prioridades_router
from app.api.v1.produtos import router as produtos_router
from app.api.v1.simulador import router as simulador_router

router = APIRouter()
router.include_router(health_router, tags=["health"])
router.include_router(auth_router)
router.include_router(profile_router)
router.include_router(basic_data_router)
router.include_router(categorias_router)
router.include_router(produtos_router)
router.include_router(prioridades_router)
router.include_router(simulador_router)
router.include_router(calculator_router)
router.include_router(diagnostico_router)
router.include_router(importancia_meses_router)
router.include_router(eventos_venda_router)
router.include_router(geo_router)
router.include_router(admin_router)
