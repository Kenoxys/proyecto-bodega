import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, '../../bodega.db'));

// Inicializar tablas
db.exec(`
  CREATE TABLE IF NOT EXISTS config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS productos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    cantidad INTEGER NOT NULL DEFAULT 0,
    precio_usd REAL NOT NULL DEFAULT 0,
    precio_bs REAL NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS clientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    direccion TEXT,
    telefono TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS ventas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_id INTEGER,
    cliente_nombre TEXT NOT NULL,
    cliente_direccion TEXT,
    cliente_telefono TEXT,
    total_bs REAL NOT NULL,
    total_usd REAL NOT NULL,
    tasa_dolar REAL NOT NULL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id)
  );

  CREATE TABLE IF NOT EXISTS venta_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    venta_id INTEGER NOT NULL,
    producto_id INTEGER NOT NULL,
    producto_codigo TEXT NOT NULL,
    producto_nombre TEXT NOT NULL,
    cantidad INTEGER NOT NULL,
    precio_unitario_bs REAL NOT NULL,
    precio_unitario_usd REAL NOT NULL,
    subtotal_bs REAL NOT NULL,
    subtotal_usd REAL NOT NULL,
    FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id)
  );

  CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas(fecha);
  CREATE INDEX IF NOT EXISTS idx_venta_items_venta ON venta_items(venta_id);
`);

// Inicializar tasa de dólar si no existe
const tasaExistente = db.prepare('SELECT value FROM config WHERE key = ?').get('tasa_dolar');
if (!tasaExistente) {
  db.prepare('INSERT INTO config (key, value) VALUES (?, ?)').run('tasa_dolar', '1');
}

// Funciones helper
export function actualizarTasaDolar(tasa) {
  const stmt = db.prepare('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)');
  stmt.run('tasa_dolar', tasa.toString());
  
  // Actualizar todos los precios en bolívares
  const productos = db.prepare('SELECT id, precio_usd FROM productos').all();
  const updateStmt = db.prepare('UPDATE productos SET precio_bs = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
  
  for (const producto of productos) {
    updateStmt.run((producto.precio_usd * tasa).toFixed(2), producto.id);
  }
  
  return { success: true, tasa };
}

export function obtenerTasaDolar() {
  const result = db.prepare('SELECT value FROM config WHERE key = ?').get('tasa_dolar');
  return result ? parseFloat(result.value) : 1;
}

export function obtenerProductos() {
  return db.prepare('SELECT * FROM productos ORDER BY nombre').all();
}

export function obtenerProductoPorId(id) {
  return db.prepare('SELECT * FROM productos WHERE id = ?').get(id);
}

export function obtenerProductoPorCodigo(codigo) {
  return db.prepare('SELECT * FROM productos WHERE codigo = ?').get(codigo);
}

export function crearProducto(codigo, nombre, cantidad, precio_usd) {
  const tasa = obtenerTasaDolar();
  const precio_bs = precio_usd * tasa;
  
  const stmt = db.prepare(`
    INSERT INTO productos (codigo, nombre, cantidad, precio_usd, precio_bs)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(codigo, nombre, cantidad, precio_usd, precio_bs.toFixed(2));
  return obtenerProductoPorId(result.lastInsertRowid);
}

export function actualizarProductoProveedor(id, cantidadNueva, precioNuevoUsd) {
  const producto = obtenerProductoPorId(id);
  if (!producto) return null;
  
  const tasa = obtenerTasaDolar();
  const nuevaCantidad = producto.cantidad + cantidadNueva;
  const precioFinalUsd = precioNuevoUsd > producto.precio_usd ? precioNuevoUsd : producto.precio_usd;
  const precioFinalBs = precioFinalUsd * tasa;
  
  const stmt = db.prepare(`
    UPDATE productos 
    SET cantidad = ?, precio_usd = ?, precio_bs = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  
  stmt.run(nuevaCantidad, precioFinalUsd, precioFinalBs.toFixed(2), id);
  return obtenerProductoPorId(id);
}

export function actualizarCantidadProducto(id, cantidad) {
  const stmt = db.prepare('UPDATE productos SET cantidad = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
  stmt.run(cantidad, id);
  return obtenerProductoPorId(id);
}

export function crearVenta(cliente, items) {
  const tasa = obtenerTasaDolar();
  let totalUsd = 0;
  let totalBs = 0;
  
  const ventaStmt = db.prepare(`
    INSERT INTO ventas (cliente_nombre, cliente_direccion, cliente_telefono, total_bs, total_usd, tasa_dolar)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  const itemStmt = db.prepare(`
    INSERT INTO venta_items 
    (venta_id, producto_id, producto_codigo, producto_nombre, cantidad, precio_unitario_bs, precio_unitario_usd, subtotal_bs, subtotal_usd)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const actualizarProductoStmt = db.prepare('UPDATE productos SET cantidad = cantidad - ? WHERE id = ?');
  
  return db.transaction(() => {
    // Calcular totales
    for (const item of items) {
      const producto = obtenerProductoPorId(item.producto_id);
      if (!producto || producto.cantidad < item.cantidad) {
        throw new Error(`Stock insuficiente para ${producto?.nombre || 'producto'}`);
      }
      
      const subtotalUsd = producto.precio_usd * item.cantidad;
      const subtotalBs = producto.precio_bs * item.cantidad;
      
      totalUsd += subtotalUsd;
      totalBs += subtotalBs;
    }
    
    // Crear venta
    const ventaResult = ventaStmt.run(
      cliente.nombre,
      cliente.direccion || '',
      cliente.telefono || '',
      totalBs.toFixed(2),
      totalUsd.toFixed(2),
      tasa
    );
    
    const ventaId = ventaResult.lastInsertRowid;
    
    // Crear items y actualizar stock
    for (const item of items) {
      const producto = obtenerProductoPorId(item.producto_id);
      const subtotalUsd = producto.precio_usd * item.cantidad;
      const subtotalBs = producto.precio_bs * item.cantidad;
      
      itemStmt.run(
        ventaId,
        item.producto_id,
        producto.codigo,
        producto.nombre,
        item.cantidad,
        producto.precio_bs,
        producto.precio_usd,
        subtotalBs.toFixed(2),
        subtotalUsd.toFixed(2)
      );
      
      actualizarProductoStmt.run(item.cantidad, item.producto_id);
    }
    
    return ventaId;
  })();
}

export function obtenerVentasPorFecha(fechaInicio, fechaFin) {
  return db.prepare(`
    SELECT v.*, 
           GROUP_CONCAT(vi.producto_nombre || ' (' || vi.cantidad || ')') as productos
    FROM ventas v
    LEFT JOIN venta_items vi ON v.id = vi.venta_id
    WHERE v.fecha >= ? AND v.fecha <= ?
    GROUP BY v.id
    ORDER BY v.fecha DESC
  `).all(fechaInicio, fechaFin);
}

export function obtenerResumenVentas(fechaInicio, fechaFin) {
  const ventas = db.prepare(`
    SELECT 
      DATE(v.fecha) as fecha,
      COUNT(*) as total_ventas,
      SUM(v.total_bs) as total_bs,
      SUM(v.total_usd) as total_usd
    FROM ventas v
    WHERE v.fecha >= ? AND v.fecha <= ?
    GROUP BY DATE(v.fecha)
    ORDER BY fecha DESC
  `).all(fechaInicio, fechaFin);
  
  const total = ventas.reduce((acc, v) => ({
    total_bs: acc.total_bs + parseFloat(v.total_bs),
    total_usd: acc.total_usd + parseFloat(v.total_usd),
    total_ventas: acc.total_ventas + v.total_ventas
  }), { total_bs: 0, total_usd: 0, total_ventas: 0 });
  
  return { ventas, total };
}

export function obtenerResumenMensual(ano) {
  return db.prepare(`
    SELECT 
      strftime('%m', fecha) as mes,
      COUNT(*) as total_ventas,
      SUM(total_bs) as total_bs,
      SUM(total_usd) as total_usd
    FROM ventas
    WHERE strftime('%Y', fecha) = ?
    GROUP BY mes
    ORDER BY mes DESC
  `).all(ano.toString());
}

export function obtenerResumenAnual() {
  return db.prepare(`
    SELECT 
      strftime('%Y', fecha) as ano,
      COUNT(*) as total_ventas,
      SUM(total_bs) as total_bs,
      SUM(total_usd) as total_usd
    FROM ventas
    GROUP BY ano
    ORDER BY ano DESC
  `).all();
}

export default db;

