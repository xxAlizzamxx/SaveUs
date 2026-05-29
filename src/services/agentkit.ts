const AGENTKIT_URL = (import.meta.env.VITE_AGENTKIT_URL as string) || 'http://localhost:8000';

export interface AgentkitContacto {
  name: string;
  phone: string;
  relation: string;
}

export interface AgentkitUbicacion {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
  address?: string;
}

export interface AgentkitEmergenciaPayload {
  id: string;
  nombre_usuario: string;
  contacts: AgentkitContacto[];
  location: AgentkitUbicacion | null;
}

export interface AgentkitEmergenciaResponse {
  emergencia_id: string;
  tracking_url: string;
  status: string;
}

export async function activarEmergenciaAgentKit(
  payload: AgentkitEmergenciaPayload
): Promise<AgentkitEmergenciaResponse | null> {
  try {
    const res = await fetch(`${AGENTKIT_URL}/emergencia`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    return (await res.json()) as AgentkitEmergenciaResponse;
  } catch {
    return null;
  }
}

export async function actualizarUbicacionAgentKit(
  emergenciaId: string,
  lat: number,
  lng: number,
  accuracy: number
): Promise<void> {
  try {
    await fetch(`${AGENTKIT_URL}/emergencia/${emergenciaId}/ubicacion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat, lng, accuracy, timestamp: Date.now() }),
    });
  } catch {
    // Silencioso — no interrumpir el flujo de emergencia
  }
}

export async function cancelarEmergenciaAgentKit(emergenciaId: string): Promise<void> {
  try {
    await fetch(`${AGENTKIT_URL}/emergencia/${emergenciaId}/cancelar`, {
      method: 'POST',
    });
  } catch {
    // Silencioso
  }
}
