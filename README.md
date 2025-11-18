# Sistema de Gestión de Bodega

Sistema web para gestión de inventario, facturación y reportes de ventas desarrollado con Astro, Tailwind CSS y SQLite3.

## Características

- **Inventario**: Gestión de productos con código, nombre, cantidad y precios en USD y Bs
- **Actualización de Tasa de Dólar**: Sistema para actualizar el valor del dólar y recalcular todos los precios automáticamente
- **Facturación**: Creación de facturas con datos del cliente y productos del inventario
- **Clientes**: Registro automático por cédula, autocompletado y reutilización en compras futuras
- **Resumen de Ventas**: Reportes por día, mes y año con totales en bolívares y dólares, con clientes vinculados

## Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Iniciar el servidor de desarrollo:
```bash
npm run dev
```

3. Abrir en el navegador:
```
http://localhost:4321
```

## Estructura del Proyecto

- `/src/pages/` - Páginas principales (inventario, factura, ventas)
- `/src/pages/api/` - Endpoints de API
- `/src/lib/db.js` - Configuración de base de datos SQLite3
- `/src/layouts/` - Layouts reutilizables

## Base de Datos

La base de datos SQLite se crea automáticamente en `bodega.db` con las siguientes tablas:

- `productos` - Inventario de productos
- `clientes` - Información de clientes
- `ventas` - Registro de ventas
- `venta_items` - Items de cada venta
- `config` - Configuración (tasa de dólar)

## Uso

### Inventario
- Agregar nuevos productos con código, nombre, cantidad y precio en USD
- Actualizar productos cuando llega un proveedor (suma cantidad y actualiza precio si subió)
- Actualizar tasa de dólar para recalcular todos los precios

### Facturación
- Registrar cédula del cliente (obligatoria). Si existe, se autocompleta nombre/dirección/teléfono.
- Los clientes nuevos se guardan automáticamente al procesar la factura
- Agregar productos del inventario
- El sistema calcula automáticamente los totales
- Al procesar, se actualiza el stock del inventario

### Ventas
- Ver resumen de ventas por día, mes o año
- Filtrar por rango de fechas
- Ver totales en bolívares y dólares, junto a la cédula del cliente en cada venta

