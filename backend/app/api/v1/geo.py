from fastapi import APIRouter, HTTPException, status

from app.services.viacep import ViaCepError, fetch_cities_for_uf

router = APIRouter(prefix="/geo", tags=["geo"])


@router.get("/cities/{uf}")
async def list_cities(uf: str) -> list[str]:
    u = uf.strip().upper()
    if len(u) != 2 or not u.isalpha():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="UF inválida",
        )
    try:
        return await fetch_cities_for_uf(u)
    except ViaCepError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(e),
        ) from e
