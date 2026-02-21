export interface MotoBrand {
  name: string
  logo: string
}

export const MOTO_BRANDS: MotoBrand[] = [
  { name: "Aprilia", logo: "/brands/aprilia.svg" },
  { name: "Benelli", logo: "/brands/benelli.svg" },
  { name: "BMW", logo: "/brands/bmw.svg" },
  { name: "CF Moto", logo: "/brands/cfmoto.svg" },
  { name: "Ducati", logo: "/brands/ducati.svg" },
  { name: "Harley-Davidson", logo: "/brands/harley-davidson.svg" },
  { name: "Honda", logo: "/brands/honda.svg" },
  { name: "Husqvarna", logo: "/brands/husqvarna.svg" },
  { name: "Indian", logo: "/brands/indian.svg" },
  { name: "Kawasaki", logo: "/brands/kawasaki.svg" },
  { name: "KTM", logo: "/brands/ktm.svg" },
  { name: "Moto Guzzi", logo: "/brands/moto-guzzi.svg" },
  { name: "MV Agusta", logo: "/brands/mv-agusta.svg" },
  { name: "Royal Enfield", logo: "/brands/royal-enfield.svg" },
  { name: "Suzuki", logo: "/brands/suzuki.svg" },
  { name: "Triumph", logo: "/brands/triumph.svg" },
  { name: "Yamaha", logo: "/brands/yamaha.svg" },
]

/** Dato un bike_model tipo "Ducati Monster 821", restituisce brand e modello separati */
export function parseBikeModel(bikeModel: string | null): { brand: string; model: string } {
  if (!bikeModel) return { brand: "", model: "" }

  // Prova a matchare i brand più lunghi prima (es. "Moto Guzzi" prima di "Moto")
  const sorted = [...MOTO_BRANDS].sort((a, b) => b.name.length - a.name.length)
  for (const b of sorted) {
    if (bikeModel.toLowerCase().startsWith(b.name.toLowerCase())) {
      const model = bikeModel.slice(b.name.length).trim()
      return { brand: b.name, model }
    }
  }

  return { brand: "", model: bikeModel }
}

/** Dato un brand name, restituisce il logo URL o null */
export function getBrandLogo(bikeModel: string | null): string | null {
  if (!bikeModel) return null
  const { brand } = parseBikeModel(bikeModel)
  if (!brand) return null
  return MOTO_BRANDS.find((b) => b.name === brand)?.logo ?? null
}
