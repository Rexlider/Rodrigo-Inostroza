# Publicar casacake.cl en el hosting con cPanel

Archivo a subir: `entrega/casacake-sitio.zip`. El correo @casacake.cl no se toca: vive en otra carpeta del hosting, no en `public_html`.

Tiempo estimado: 20 a 30 minutos.

## 1. Revisar el certificado SSL

1. Entrar a cPanel y abrir **Estado de SSL/TLS** (*SSL/TLS Status*).
2. Confirmar que `casacake.cl` y `www.casacake.cl` tienen certificado válido (candado verde).
3. Si alguno no lo tiene, presionar **Ejecutar AutoSSL** (*Run AutoSSL*) y esperar unos minutos.

El sitio nuevo envía todas las visitas a `https://www.casacake.cl`, así que el certificado debe cubrir el `www`.

## 2. Respaldar el sitio actual

1. Abrir **Copia de seguridad** (*Backup*).
2. En *Partial Backups*, descargar **Directorio principal** (*Home Directory*) y, si aparece alguna, cada **base de datos MySQL**.
3. Guardar los archivos en el computador. Con eso se puede volver atrás en cualquier momento.

## 3. Probar el sitio nuevo sin reemplazar el actual (opcional, recomendado)

1. Abrir **Administrador de archivos** (*File Manager*) y entrar a `public_html`.
2. Crear la carpeta `nuevo` y entrar en ella.
3. **Cargar** (*Upload*) `casacake-sitio.zip`.
4. Seleccionar el zip, **Extraer** (*Extract*) y luego borrar el zip.
5. Abrir `https://www.casacake.cl/nuevo/` en el celular y en el computador. Revisar productos, fichas, botón de WhatsApp y formulario de empresas.
6. Si todo está bien, borrar la carpeta `nuevo` y seguir con el paso 4.

## 4. Reemplazar el sitio

1. En el Administrador de archivos, abrir **Configuración** (*Settings*, arriba a la derecha) y marcar **Mostrar archivos ocultos** (*Show Hidden Files*).
2. Ir a la carpeta principal (el ícono de casa, *Home*) y crear la carpeta `sitio-anterior`. Debe quedar **fuera** de `public_html`.
3. Entrar a `public_html`, seleccionar todo **menos** `.well-known` y `cgi-bin`, y **Mover** (*Move*) a `/sitio-anterior` (escribir la ruta completa que muestra cPanel, por ejemplo `/home/USUARIO/sitio-anterior`).
4. Con `public_html` vacío (salvo `.well-known` y `cgi-bin`), **Cargar** `casacake-sitio.zip`, **Extraer** y borrar el zip.
5. Confirmar que quedó el archivo `.htaccess` (visible porque se activaron los archivos ocultos).

## 5. Verificar

| Abrir | Debe pasar |
|---|---|
| `https://www.casacake.cl` | Carga el sitio nuevo con candado |
| `http://casacake.cl` | Redirige a `https://www.casacake.cl` |
| `https://www.casacake.cl/productos/cc-tac-050/` | Ficha de las tacitas con foto |
| `https://www.casacake.cl/en/tacita-coctel-neutra-bandeja-50-un` | Redirige a la ficha nueva de tacitas |
| Botón **Consultar por WhatsApp** | Abre un chat con +56 9 4021 1074 y el mensaje escrito |
| `https://www.casacake.cl/no-existe` | Muestra la página «No encontramos esta página» |

Si el sitio no cambia después de subir los archivos, el dominio podría estar apuntando a otro servidor: revisar en **Editor de zona** (*Zone Editor*) que el registro `A` de `casacake.cl` y `www` tenga la IP del hosting (aparece en la columna derecha de cPanel como *Dirección IP compartida*).

## 6. Si algo sale mal

Mover el contenido de `public_html` (menos `.well-known` y `cgi-bin`) a otra carpeta y devolver lo que hay en `sitio-anterior`. El sitio antiguo vuelve tal como estaba.

## 7. Después de publicar

1. Entrar a [Google Search Console](https://search.google.com/search-console) con la cuenta Rexlider1@gmail.com y agregar la propiedad de dominio `casacake.cl`.
2. Google entrega un registro TXT: pegarlo en cPanel → **Editor de zona** → *Add Record* → tipo TXT.
3. Una vez verificado, en **Sitemaps** enviar `https://www.casacake.cl/sitemap.xml`.
4. Cuando el sitio nuevo esté funcionando unas semanas, la carpeta `sitio-anterior` se puede borrar.

## Para actualizar el sitio más adelante

Cambiar `data/productos.json` o `data/sitio.json`, ejecutar `node build.mjs --zip` y repetir el paso 4 (sin mover nada a `sitio-anterior`: basta con reemplazar los archivos de `public_html`).
