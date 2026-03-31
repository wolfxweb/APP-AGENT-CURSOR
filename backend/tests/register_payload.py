"""Payload de registro (chave TEST1234 enquanto SKIP_ACTIVATION_LICENSE_CHECK=false nos testes)."""


def register_json(
    *,
    name: str,
    email: str,
    password: str,
    whatsapp: str | None = "11999998888",
    activity_type: str = "Comércio varejista",
    specialty_area: str = "Minimercados",
    cep: str = "01310100",
    state: str | None = "SP",
    city: str | None = "São Paulo",
    activation_key: str = "TEST1234",
) -> dict:
    d: dict = {
        "name": name,
        "email": email,
        "password": password,
        "terms_accepted": True,
        "activation_key": activation_key,
        "activity_type": activity_type,
        "specialty_area": specialty_area,
        "cep": cep,
    }
    if whatsapp is not None:
        d["whatsapp"] = whatsapp
    if state is not None:
        d["state"] = state
    if city is not None:
        d["city"] = city
    return d
