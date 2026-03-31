import logging

import httpx

logger = logging.getLogger(__name__)


class ViaCepError(Exception):
    pass


async def fetch_cities_for_uf(uf: str) -> list[str]:
    """Lista nomes de municípios pela UF (proxy ViaCEP)."""
    url = f"https://viacep.com.br/ws/{uf}/cidades/json"
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url)
            response.raise_for_status()
            data = response.json()
    except (httpx.HTTPError, ValueError, TypeError) as e:
        logger.warning("ViaCEP falhou para %s: %s", uf, e)
        raise ViaCepError("Não foi possível carregar cidades") from e

    if not isinstance(data, list):
        raise ViaCepError("Resposta inválida do ViaCEP")

    names: list[str] = []
    for item in data:
        if isinstance(item, dict) and "nome" in item:
            names.append(str(item["nome"]))
        elif isinstance(item, str):
            names.append(item)

    return sorted(set(names), key=lambda x: x.lower())
