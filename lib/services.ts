export type ServiceKey =
  | "haircut"
  | "haircut_beard"
  | "haircut_beard_shave"
  | "kids_seniors"
  | "buzz_cut"
  | "line_up";

export type Service = {
  key: ServiceKey;
  name: string;
  priceCAD: number;
  durationMinutes: number;
  tagline: string;
  features: string[];
  badge?: "Most Popular" | "Popular";
};

export const SERVICES: Service[] = [
  {
    key: "haircut",
    name: "Haircut",
    priceCAD: 40,
    durationMinutes: 30,
    tagline: "Professional cut tailored to your style",
    features: ["Consultation", "Precision Cut", "Style & Finish"],
  },
  {
    key: "haircut_beard",
    name: "Haircut + Beard",
    priceCAD: 50,
    durationMinutes: 45,
    tagline: "Complete grooming experience",
    badge: "Popular",
    features: ["Haircut Service", "Beard Trim", "Hot Towel"],
  },
  {
    key: "haircut_beard_shave",
    name: "Haircut + Beard (Shave)",
    priceCAD: 60,
    durationMinutes: 60,
    tagline: "The ultimate grooming package",
    badge: "Most Popular",
    features: ["Premium Haircut", "Hot Shave", "Beard Sculpting", "Face Massage"],
  },
  {
    key: "kids_seniors",
    name: "Kids & Seniors",
    priceCAD: 30,
    durationMinutes: 30,
    tagline: "Special pricing for kids & seniors",
    features: ["Professional Cut", "Patient Service", "Style Advice"],
  },
  {
    key: "buzz_cut",
    name: "Buzz Cut",
    priceCAD: 30,
    durationMinutes: 20,
    tagline: "Quick, clean, and precise",
    features: ["Even Cut", "Edge Up", "Quick Service"],
  },
  {
    key: "line_up",
    name: "Line Up",
    priceCAD: 25,
    durationMinutes: 20,
    tagline: "Beard & hair line perfection",
    features: ["Beard Edges", "Hairline Shape", "Clean Finish"],
  },
];

export function getService(key: ServiceKey) {
  const service = SERVICES.find((s) => s.key === key);
  if (!service) throw new Error(`Unknown service key: ${key}`);
  return service;
}

