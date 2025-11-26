import { obtenerDeudoresPendientes, pagarDeudasPorCedula } from '../../lib/db.js';

export async function GET() {
  try {
    const data = obtenerDeudoresPendientes();
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

export async function POST({ request }) {
  try {
    const body = await request.json();
    const { cedula, tasa_pago } = body;

    if (!cedula || !tasa_pago) {
      return new Response(JSON.stringify({ success: false, error: 'Cédula y tasa de pago son requeridas' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = pagarDeudasPorCedula(cedula, parseFloat(tasa_pago));
    return new Response(JSON.stringify({ success: true, data: result }), {
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


