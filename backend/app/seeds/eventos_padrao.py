"""Definição dos 22 eventos padrão (Requisitos.MD §5.8) — copiados por usuário na primeira leitura."""

from typing import TypedDict


class EventoPadraoSeed(TypedDict):
    nome_evento: str
    nota: float
    aumenta_vendas: bool
    diminui_vendas: bool
    meses_afetados: list[int]


# Meses típicos (aproximação comercial no Brasil); ajustáveis pelo usuário em eventos customizados.
EVENTOS_PADRAO_BR: tuple[EventoPadraoSeed, ...] = (
    {"nome_evento": "Carnaval", "nota": 8.0, "aumenta_vendas": True, "diminui_vendas": False, "meses_afetados": [2, 3]},
    {"nome_evento": "Natal", "nota": 10.0, "aumenta_vendas": True, "diminui_vendas": False, "meses_afetados": [12]},
    {"nome_evento": "Dia das Mães", "nota": 7.0, "aumenta_vendas": True, "diminui_vendas": False, "meses_afetados": [5]},
    {"nome_evento": "Black Friday", "nota": 9.0, "aumenta_vendas": True, "diminui_vendas": False, "meses_afetados": [11]},
    {"nome_evento": "Páscoa", "nota": 6.0, "aumenta_vendas": True, "diminui_vendas": False, "meses_afetados": [3, 4]},
    {"nome_evento": "Festa Junina", "nota": 6.5, "aumenta_vendas": True, "diminui_vendas": False, "meses_afetados": [6]},
    {"nome_evento": "Dia dos Pais", "nota": 6.0, "aumenta_vendas": True, "diminui_vendas": False, "meses_afetados": [8]},
    {"nome_evento": "Dia dos Namorados", "nota": 7.0, "aumenta_vendas": True, "diminui_vendas": False, "meses_afetados": [6, 12]},
    {"nome_evento": "Dia das Crianças", "nota": 6.0, "aumenta_vendas": True, "diminui_vendas": False, "meses_afetados": [10]},
    {"nome_evento": "Ano Novo", "nota": 5.0, "aumenta_vendas": True, "diminui_vendas": False, "meses_afetados": [1]},
    {"nome_evento": "Independência do Brasil", "nota": 4.0, "aumenta_vendas": True, "diminui_vendas": False, "meses_afetados": [9]},
    {"nome_evento": "Corpus Christi", "nota": 3.5, "aumenta_vendas": False, "diminui_vendas": True, "meses_afetados": [5, 6]},
    {"nome_evento": "Finados", "nota": 3.0, "aumenta_vendas": False, "diminui_vendas": True, "meses_afetados": [11]},
    {"nome_evento": "Proclamação da República", "nota": 4.0, "aumenta_vendas": True, "diminui_vendas": False, "meses_afetados": [11]},
    {"nome_evento": "Tiradentes", "nota": 3.0, "aumenta_vendas": False, "diminui_vendas": True, "meses_afetados": [4]},
    {"nome_evento": "São João", "nota": 7.0, "aumenta_vendas": True, "diminui_vendas": False, "meses_afetados": [6]},
    {"nome_evento": "Copa do Mundo (quando aplicável)", "nota": 8.0, "aumenta_vendas": True, "diminui_vendas": False, "meses_afetados": [6, 7]},
    {"nome_evento": "Semana Santa", "nota": 5.0, "aumenta_vendas": True, "diminui_vendas": False, "meses_afetados": [3, 4]},
    {"nome_evento": "Réveillon", "nota": 7.0, "aumenta_vendas": True, "diminui_vendas": False, "meses_afetados": [12]},
    {"nome_evento": "Carnaval pós-temporada", "nota": 4.0, "aumenta_vendas": False, "diminui_vendas": True, "meses_afetados": [3]},
    {"nome_evento": "Dia do Trabalho", "nota": 3.0, "aumenta_vendas": False, "diminui_vendas": True, "meses_afetados": [5]},
    {"nome_evento": "Dia do Consumidor", "nota": 6.0, "aumenta_vendas": True, "diminui_vendas": False, "meses_afetados": [3]},
)

assert len(EVENTOS_PADRAO_BR) == 22
