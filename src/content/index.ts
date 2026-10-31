import health from "./health.json";
import infrastructure from "./infrastructure.json";
import gardening from "./gardening.json";
import cropData from "./crops.json";
import type { Guide, Crop } from "../types";
export const guides = [...health, ...infrastructure, ...gardening] as Guide[];
for (const guide of guides)
  if (!guide.related.length)
    guide.related = guides
      .filter((g) => g.category === guide.category && g.id !== guide.id)
      .slice(0, 3)
      .map((g) => g.id);
export const crops = cropData as Crop[];
export const labels: Record<string, string> = {
  water: "Water",
  food: "Food & pantry",
  farming: "Urban growing",
  sanitation: "Sanitation",
  power: "Power & light",
  climate: "Heating & cooling",
  medical: "First aid",
  communications: "Communication",
  shelter: "Shelter & safety",
  repairs: "Practical repairs",
};
