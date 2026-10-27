# casacake.cl

Catálogo en línea de Casacake, inspirado en pidy.com: productos con código propio, ficha técnica y contacto directo con el vendedor por WhatsApp. No tiene carro de pago; el cliente arma una lista de consulta y la envía al vendedor.

Es un sitio estático: no necesita base de datos ni servidor propio, y se puede publicar gratis en Cloudflare Pages o Netlify.

## Cómo se edita

Todo el contenido está en dos archivos:

- `data/sitio.json`: nombre, correo, dirección, horario, RUT, vendedores (nombre, zona y WhatsApp en formato `569XXXXXXXX`), redes, tiendas donde comprar y si se muestran precios (`mostrarPrecios`).
- `data/productos.json`: líneas de producto, productos e ideas de relleno.

Cada producto tiene un `codigo` único (por ejemplo `CC-TAC-050`), que también define su dirección: `/productos/cc-tac-050/`. Los campos en `null` (medidas, peso, conservación, código de barras, foto) no se muestran en el sitio publicado.

Las fotos van en `img/productos/` y se indican en el campo `fotos` de cada producto (por ejemplo `"fotos": ["productos/cc-tac-050-1.webp"]`); la primera es la principal. Mientras no haya fotos, se muestra una ilustración de la bandeja. El logo, el sello y los íconos están en `img/marca/`.

### Códigos propuestos

`CC` (Casacake) + familia + unidades. Si Casacake ya usa códigos internos, se reemplazan en `data/productos.json`.

| Familia | Código |
|---|---|
| Tacita cóctel | TAC |
| Mini tartaleta flor | TAR |
| Cachito cóctel | CAC |
| Hojarasca | HOJ |
| Mini chilenito | CHI |
| Galletitas para alfajores | ALF |
| Chilenos con manjar | CHM |
| Chilenos con merengue | CHE |

## Cómo se genera

Requiere Node.js 18 o superior. No tiene dependencias.

```
node build.mjs              # sitio para publicar, en dist/
node build.mjs --zip        # además, entrega/casacake-sitio.zip para cPanel
node build.mjs --borrador   # marca los datos pendientes y bloquea buscadores
node build.mjs --local      # enlaces que funcionan abriendo los archivos sin servidor
```

La versión para publicar no se genera si falta el WhatsApp de algún vendedor. Al terminar, el script lista los datos que aún faltan.

## Cómo se publica

El hosting de casacake.cl es cPanel. `node build.mjs --zip` genera `entrega/casacake-sitio.zip` con el sitio y su `.htaccess` (HTTPS, www y redirecciones desde las direcciones del sitio anterior). Los pasos para subirlo están en [PUBLICAR-CPANEL.md](PUBLICAR-CPANEL.md).

El build también genera `_redirects`, por si algún día se publica en Cloudflare Pages o Netlify (carpeta raíz `sitios/casacake`, comando `node build.mjs`, salida `dist`).
