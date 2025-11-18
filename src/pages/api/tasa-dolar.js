import { obtenerTasaDolar, actualizarTasaDolar } from '../../lib/db.js';

export async function GET() {
  try {
    const tasa = obtenerTasaDolar();
    return new Response(JSON.stringify({ success: true, tasa }), {
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
    const { tasa } = body;
    
    if (!tasa || tasa <= 0) {
      return new Response(JSON.stringify({ success: false, error: 'Tasa de dólar inválida' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const result = actualizarTasaDolar(parseFloat(tasa));
    return new Response(JSON.stringify({ success: true, ...result }), {
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

