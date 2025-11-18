import { obtenerClientePorCedula, guardarCliente } from '../../lib/db.js';

export async function GET({ url }) {
  try {
    const cedula = url.searchParams.get('cedula');
    if (!cedula) {
      return new Response(JSON.stringify({ success: false, error: 'La cédula es requerida' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const cliente = obtenerClientePorCedula(cedula);
    return new Response(JSON.stringify({ success: true, data: cliente || null }), {
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
    const { cedula, nombre, direccion, telefono } = body;
    if (!cedula || !nombre) {
      return new Response(JSON.stringify({ success: false, error: 'Cédula y nombre son requeridos' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const cliente = guardarCliente({ cedula, nombre, direccion, telefono });
    return new Response(JSON.stringify({ success: true, data: cliente }), {
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

