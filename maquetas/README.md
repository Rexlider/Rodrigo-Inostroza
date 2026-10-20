# Maquetas: Agrotrade y Casacake

Propuestas de rediseño para [agrotrade.cl](https://agrotrade.cl) y [casacake.cl](https://www.casacake.cl). Cada una es un solo archivo HTML (sin dependencias, salvo Google Fonts). Ábrelo en el navegador.

- `agrotrade/index.html`: tienda por saco con compra mínima, carro con peso total, checkout por transferencia/WhatsApp y formulario de cotización por volumen.
- `casacake/index.html`: tienda por bandeja con precio por unidad, calculadora de cóctel, ideas de relleno, checkout y formulario para empresas y mayoristas.

El carro, el checkout y los formularios son de demostración: arman el mensaje del pedido, pero no lo envían.

## Origen del catálogo

Productos tomados de los sitios actuales (vía buscador, octubre 2026):

| Agrotrade | Formato | Compra mínima |
|---|---|---|
| Maíz molido (fino o grueso) | Saco 25 kg | 10 sacos |
| Avena forrajera | Saco 25 kg | 20 sacos |
| Harina de soya 48 % proteína | Saco 50 kg | 5 sacos |
| Pellet de girasol | Por confirmar | Por confirmar |

| Casacake | Formato | Precio publicado |
|---|---|---|
| Tacita cóctel neutra | Bandeja 50 un | $4.500 |
| Tacita cóctel neutra · Pack 3 | 150 un | $14.900 |
| Mini tartaleta flor cóctel · Pack 3 | 72 un | $14.900 |
| Cachito cóctel · Pack 3 | 90 un | $14.900 |
| Hojarasca cóctel | Bandeja 60 tapitas | $4.500 |
| Mini chilenito · Pack 3 (agotado) | 36 un | $10.490 |
| Galletitas para mini alfajores · Pack 3 | 110 un | Por confirmar |
| Chilenos rellenos de manjar | 6 un | $2.500–$2.790 (confirmar) |
| Chilenos con manjar y baño de merengue | 6 un | $2.500–$2.790 (confirmar) |

## Por completar

Todo lo marcado con borde punteado en las maquetas: precios de Agrotrade, WhatsApp, direcciones, correo de Casacake, RUT, historia de la familia, zonas y costos de despacho, y fotos reales de producto (hoy son ilustraciones).

## PDF de concepto

`concepto/Concepto-Agrotrade.pdf` y `concepto/Concepto-Casacake.pdf` presentan cada propuesta: diagnóstico del sitio actual, público, identidad visual, estructura, tienda, flujo de compra, pedidos por volumen, versión móvil, datos pendientes y próximos pasos.

Para regenerarlos después de cambiar las maquetas: `cd maquetas/concepto && npm install && node generar.cjs` (usa Playwright con Chromium).
