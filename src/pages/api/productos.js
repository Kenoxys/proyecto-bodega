import { obtenerProductos, crearProducto, actualizarProductoProveedor, obtenerProductoPorCodigo } from '../../lib/db.js';

export async function GET() {
  try {
    const productos = obtenerProductos();
    return new Response(JSON.stringify({ success: true, data: productos }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function POST({ request }) {
  try {
    const body = await request.json();
    const { codigo, nombre, cantidad, precio_usd } = body;
    
    if (!codigo || !nombre || cantidad === undefined || precio_usd === undefined) {
      return new Response(JSON.stringify({ success: false, error: 'Faltan campos requeridos' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const productoExistente = obtenerProductoPorCodigo(codigo);
    if (productoExistente) {
      return new Response(JSON.stringify({ success: false, error: 'El código del producto ya existe' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const producto = crearProducto(codigo, nombre, cantidad, precio_usd);
    return new Response(JSON.stringify({ success: true, data: producto }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function PUT({ request }) {
  try {
    const body = await request.json();
    const { id, cantidad, precio_usd } = body;
    
    if (!id || cantidad === undefined || precio_usd === undefined) {
      return new Response(JSON.stringify({ success: false, error: 'Faltan campos requeridos' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const producto = actualizarProductoProveedor(id, cantidad, precio_usd);
    if (!producto) {
      return new Response(JSON.stringify({ success: false, error: 'Producto no encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ success: true, data: producto }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

