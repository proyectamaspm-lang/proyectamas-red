#!/usr/bin/env python3
"""Arma index.html a partir de src/index.template.html y las secciones de src/secciones/."""
from pathlib import Path
raiz = Path(__file__).parent
s = (raiz / "src/index.template.html").read_text(encoding="utf-8")
for clave, archivo in {"HERO": "hero", "RESPALDO": "respaldo", "PRIMER": "primer-cliente", "CAMINO": "camino", "BENEFICIOS": "beneficios", "QUIEN": "quien"}.items():
    s = s.replace("{{%s}}" % clave, (raiz / f"src/secciones/sec-{archivo}.html").read_text(encoding="utf-8"))
assert "{{" not in s, "quedó un hueco sin llenar"
(raiz / "index.html").write_text(s, encoding="utf-8")
print("index.html listo,", len(s), "caracteres")
