import { crearVenta, obtenerVentasPorFecha, obtenerResumenVentas, obtenerResumenMensual, obtenerResumenAnual } from '../../lib/db.js';

export async function POST({ request }) {
  try {
    const body = await request.json();
    const { cliente, items } = body;
    
    if (!cliente || !cliente.nombre || !items || items.length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'Faltan campos requeridos' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const ventaId = crearVenta(cliente, items);
    return new Response(JSON.stringify({ success: true, venta_id: ventaId }), {
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

export async function GET({ url }) {
  try {
    const tipo = url.searchParams.get('tipo') || 'fecha';
    const fechaInicio = url.searchParams.get('fecha_inicio') || new Date(new Date().setHours(0,0,0,0)).toISOString();
    const fechaFin = url.searchParams.get('fecha_fin') || new Date(new Date().setHours(23,59,59,999)).toISOString();
    const ano = url.searchParams.get('ano');
    
    let data;
    
    if (tipo === 'resumen') {
      data = obtenerResumenVentas(fechaInicio, fechaFin);
    } else if (tipo === 'mensual' && ano) {
      data = obtenerResumenMensual(parseInt(ano));
    } else if (tipo === 'anual') {
      data = obtenerResumenAnual();
    } else {
      data = obtenerVentasPorFecha(fechaInicio, fechaFin);
    }
    
    return new Response(JSON.stringify({ success: true, data }), {
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

