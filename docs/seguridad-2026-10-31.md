# Seguridad: revisión del 2026-10-31

Contexto: revisión de seguridad de todos los repos tras el «octubre negro» (la IA abarata el ataque: se asume que todo repo, endpoint y clave se escanea en minutos). Este documento recoge lo aplicado a este repo y lo que queda pendiente; el estado vive en `docs/`, no en la conversación.

> Repo **público**: los pendientes se describen por categoría y acción, sin detalles explotables.

## Cambios aplicados

Ninguno en esta tanda.

## Pendientes

- [ ] **Baja** · `visualization.js` (E-06): Uso de `innerHTML` con plantillas; sustituir por `textContent` o nodos DOM para valores dinámicos.
- [ ] **Baja** · `index.html` (E-07): Añadir `<meta http-equiv="Content-Security-Policy">` restrictiva (Pages no permite cabeceras).
- [ ] **Info** · `ray_data.json` (E-08): Fichero grande versionado que hincha el clon; valorar Git LFS o generarlo en CI.
- [ ] **Info** · `README.md:35` (E-09): Corregir la URL de clonado, que apunta a un nombre de repo distinto del real.
- [ ] **Info** · Metadatos de commit (E-03): Email `noreply` de GitHub en commits futuros.

## Reglas nuevas para agentes de este repo

- En repos públicos, commits con el email `noreply` de GitHub.
- .gitignore base: `.env*`, `*.pem`, `*.key`, `*.sqlite*`, `*.db`, `.wrangler/`, y `*.xlsx`/`*.docx`/`*.pdf` en repos con material de cliente. Ejecutar `gitleaks detect --log-opts=--all` antes de hacer público un repo.
- Nada de `innerHTML` con datos que no sean constantes del propio código.
- Dependabot (npm y github-actions) y alertas de seguridad activas, incluso en repos estáticos.
