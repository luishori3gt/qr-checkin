// Rutas por línea transportista - Edita este archivo para agregar/modificar rutas
export const RUTAS_POR_LINEA: Record<string, string[]> = {
  "Panda": ["Queretaro", "Puebla", "Toluca"],
  "DJ": ["Herradura", "Interlomas", "Santa Fe", "Lilas"],
  "Libra": ["Chapultepec", "Herradura", "Toluca"],
  "Ledesma": ["Satelite"],
  "Andame": ["Pilares", "Carso"],
  "Aguilar": ["San Jeronimo", "San Miguel", "Rio Mayo"],
};

// Función para obtener rutas de una línea (case-insensitive)
export function getRutasPorLinea(nombreLinea: string): string[] {
  // Busca coincidencia exacta primero
  if (RUTAS_POR_LINEA[nombreLinea]) {
    return RUTAS_POR_LINEA[nombreLinea];
  }
  // Busca coincidencia case-insensitive
  const key = Object.keys(RUTAS_POR_LINEA).find(
    (k) => k.toLowerCase() === nombreLinea.toLowerCase()
  );
  return key ? RUTAS_POR_LINEA[key] : [];
}

// Obtener todas las líneas disponibles
export function getLineas(): string[] {
  return Object.keys(RUTAS_POR_LINEA);
}
