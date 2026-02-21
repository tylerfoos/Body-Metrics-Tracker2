import { MeasurementDefinition, RatioDefinition, PhotoType } from "./types";

export const BODY_MEASUREMENTS: MeasurementDefinition[] = [
  {
    id: "neck",
    label: "Neck",
    category: "body",
    icon: "body-outline",
    iconFamily: "Ionicons",
    howToMeasure:
      "Measure around the middle of the neck, just below the Adam's apple. Keep the tape level and snug but not tight.",
    unit: "in",
    unitMetric: "cm",
    hasLeftRight: false,
    variations: [],
  },
  {
    id: "shoulders",
    label: "Shoulders",
    category: "body",
    icon: "human-handsup",
    iconFamily: "MaterialCommunityIcons",
    howToMeasure:
      "Stand naturally with arms at sides. Measure around the widest point of the shoulders, keeping the tape level across the deltoids.",
    unit: "in",
    unitMetric: "cm",
    hasLeftRight: false,
    variations: [],
  },
  {
    id: "chest",
    label: "Chest",
    category: "body",
    icon: "human",
    iconFamily: "MaterialCommunityIcons",
    howToMeasure:
      "Wrap the tape around the fullest part of the chest, under the armpits and across the shoulder blades. Keep tape level.",
    unit: "in",
    unitMetric: "cm",
    hasLeftRight: false,
    variations: [
      { id: "relaxed", label: "Relaxed" },
      { id: "expanded", label: "Expanded" },
    ],
  },
  {
    id: "bicep",
    label: "Bicep",
    category: "body",
    icon: "arm-flex-outline",
    iconFamily: "MaterialCommunityIcons",
    howToMeasure:
      "Measure around the largest part of the upper arm. For flexed, flex the bicep and measure at the peak. For relaxed, let arm hang naturally.",
    unit: "in",
    unitMetric: "cm",
    hasLeftRight: true,
    variations: [
      { id: "flexed", label: "Flexed" },
      { id: "relaxed", label: "Relaxed" },
    ],
  },
  {
    id: "forearm",
    label: "Forearm",
    category: "body",
    icon: "hand-back-left-outline",
    iconFamily: "MaterialCommunityIcons",
    howToMeasure:
      "Measure around the widest part of the forearm, about 1 inch below the elbow crease.",
    unit: "in",
    unitMetric: "cm",
    hasLeftRight: true,
    variations: [],
  },
  {
    id: "wrist",
    label: "Wrist",
    category: "body",
    icon: "watch",
    iconFamily: "Feather",
    howToMeasure:
      "Measure around the wrist just above the wrist bone (ulna styloid process). Keep tape snug.",
    unit: "in",
    unitMetric: "cm",
    hasLeftRight: true,
    variations: [],
  },
  {
    id: "stomach",
    label: "Stomach",
    category: "body",
    icon: "human",
    iconFamily: "MaterialCommunityIcons",
    howToMeasure:
      "Measure at the navel level. For relaxed, breathe normally. For vacuumed, exhale and pull navel toward spine. For braced, flex abs.",
    unit: "in",
    unitMetric: "cm",
    hasLeftRight: false,
    variations: [
      { id: "relaxed", label: "Relaxed" },
      { id: "vacuumed", label: "Vacuumed" },
      { id: "braced", label: "Braced" },
    ],
  },
  {
    id: "waist",
    label: "Waist",
    category: "body",
    icon: "resize-outline",
    iconFamily: "Ionicons",
    howToMeasure:
      "Measure at the narrowest point of your torso, typically just above the navel. Keep tape level and breathe normally.",
    unit: "in",
    unitMetric: "cm",
    hasLeftRight: false,
    variations: [],
  },
  {
    id: "hips",
    label: "Hips",
    category: "body",
    icon: "body-outline",
    iconFamily: "Ionicons",
    howToMeasure:
      "Measure around the widest part of the hips and buttocks. Keep tape level and parallel to the floor.",
    unit: "in",
    unitMetric: "cm",
    hasLeftRight: false,
    variations: [{ id: "relaxed", label: "Relaxed" }],
  },
  {
    id: "thigh",
    label: "Thigh",
    category: "body",
    icon: "human",
    iconFamily: "MaterialCommunityIcons",
    howToMeasure:
      "Measure around the largest part of the upper thigh, just below the gluteal fold. Stand with weight evenly distributed.",
    unit: "in",
    unitMetric: "cm",
    hasLeftRight: true,
    variations: [],
  },
  {
    id: "calf",
    label: "Calf",
    category: "body",
    icon: "human",
    iconFamily: "MaterialCommunityIcons",
    howToMeasure:
      "Measure around the widest part of the calf muscle. Stand with weight evenly distributed on both feet.",
    unit: "in",
    unitMetric: "cm",
    hasLeftRight: true,
    variations: [],
  },
  {
    id: "ankle",
    label: "Ankle",
    category: "body",
    icon: "footsteps-outline",
    iconFamily: "Ionicons",
    howToMeasure:
      "Measure around the narrowest part of the ankle, just above the ankle bone.",
    unit: "in",
    unitMetric: "cm",
    hasLeftRight: true,
    variations: [],
  },
];

export const VITAL_SIGNS: MeasurementDefinition[] = [
  {
    id: "weight",
    label: "Weight",
    category: "vital",
    icon: "scale-bathroom",
    iconFamily: "MaterialCommunityIcons",
    howToMeasure:
      "Weigh yourself first thing in the morning, after using the bathroom, wearing minimal clothing. Use the same scale each time.",
    unit: "lb",
    unitMetric: "kg",
    hasLeftRight: false,
    variations: [],
  },
  {
    id: "bodyFat",
    label: "Body Fat %",
    category: "vital",
    icon: "analytics-outline",
    iconFamily: "Ionicons",
    howToMeasure:
      "Use calipers, bioelectrical impedance scale, or DEXA scan. Measure at the same time of day and hydration level.",
    unit: "%",
    hasLeftRight: false,
    variations: [],
  },
  {
    id: "bmi",
    label: "BMI",
    category: "vital",
    icon: "calculator-outline",
    iconFamily: "Ionicons",
    howToMeasure:
      "Calculated automatically from your weight and height. BMI = weight(kg) / height(m)^2.",
    unit: "",
    hasLeftRight: false,
    variations: [],
  },
  {
    id: "bloodPressure",
    label: "Blood Pressure",
    category: "vital",
    icon: "heart-pulse",
    iconFamily: "MaterialCommunityIcons",
    howToMeasure:
      "Sit quietly for 5 minutes before measuring. Place the cuff on bare upper arm at heart level. Record systolic/diastolic (e.g., 120/80).",
    unit: "mmHg",
    hasLeftRight: false,
    variations: [],
  },
  {
    id: "temperature",
    label: "Temperature",
    category: "vital",
    icon: "thermometer-outline",
    iconFamily: "Ionicons",
    howToMeasure:
      "Use a digital thermometer. Oral: under the tongue for 3 min. Record the site used. Multi-site monitoring can help assess circulation.",
    unit: "\u00B0F",
    unitMetric: "\u00B0C",
    hasLeftRight: false,
    variations: [],
    subSites: [
      { id: "oral", label: "Oral", group: "Core" },
      { id: "ear", label: "Ear", group: "Core" },
      { id: "forehead", label: "Forehead", group: "Core" },
      { id: "armpit", label: "Armpit", group: "Core" },
      { id: "core", label: "Core (Rectal)", group: "Core" },
      { id: "hands", label: "Hands", group: "Peripheral" },
      { id: "feet", label: "Feet", group: "Peripheral" },
      { id: "fingers", label: "Fingers", group: "Peripheral" },
      { id: "toes", label: "Toes", group: "Peripheral" },
      { id: "nose", label: "Nose", group: "Peripheral" },
      { id: "earlobes", label: "Earlobes", group: "Peripheral" },
    ],
  },
  {
    id: "restingHeartRate",
    label: "Resting Heart Rate",
    category: "vital",
    icon: "heart-outline",
    iconFamily: "Ionicons",
    howToMeasure:
      "Measure first thing in the morning before getting out of bed, or after sitting quietly for 10 minutes.",
    unit: "bpm",
    hasLeftRight: false,
    variations: [],
  },
  {
    id: "heartRate",
    label: "Heart Rate",
    category: "vital",
    icon: "heart-circle-outline",
    iconFamily: "Ionicons",
    howToMeasure: "Record your current heart rate. Can be a range (e.g., 60-100).",
    unit: "bpm",
    hasLeftRight: false,
    variations: [],
  },
  {
    id: "hrv",
    label: "Heart Rate Variability",
    category: "vital",
    icon: "pulse-outline",
    iconFamily: "Ionicons",
    howToMeasure:
      "Measure using a chest strap or smartwatch. Best measured first thing in the morning.",
    unit: "ms",
    hasLeftRight: false,
    variations: [],
  },
  {
    id: "bloodOxygen",
    label: "Blood Oxygen (SpO2)",
    category: "vital",
    icon: "water-outline",
    iconFamily: "Ionicons",
    howToMeasure:
      "Use a pulse oximeter on your fingertip. Sit still for 1 minute before reading. Normal is 95-100%.",
    unit: "%",
    hasLeftRight: false,
    variations: [],
  },
  {
    id: "bloodGlucose",
    label: "Blood Glucose",
    category: "vital",
    icon: "water",
    iconFamily: "Ionicons",
    howToMeasure:
      "Use a blood glucose monitor. Fasting glucose should be measured after 8+ hours without eating.",
    unit: "mg/dL",
    unitMetric: "mmol/L",
    hasLeftRight: false,
    variations: [],
  },
  {
    id: "activeCalories",
    label: "Active Calories",
    category: "vital",
    icon: "flame-outline",
    iconFamily: "Ionicons",
    howToMeasure: "Calories burned through physical activity, from your fitness tracker.",
    unit: "kcal",
    hasLeftRight: false,
    variations: [],
  },
  {
    id: "restingCalories",
    label: "Resting Calories",
    category: "vital",
    icon: "flash-outline",
    iconFamily: "Ionicons",
    howToMeasure: "Basal metabolic rate calories, from your fitness tracker.",
    unit: "kcal",
    hasLeftRight: false,
    variations: [],
  },
  {
    id: "walkingHeartRate",
    label: "Walking Heart Rate",
    category: "vital",
    icon: "walk-outline",
    iconFamily: "Ionicons",
    howToMeasure: "Average heart rate during walking activities.",
    unit: "bpm",
    hasLeftRight: false,
    variations: [],
  },
  {
    id: "sleep",
    label: "Sleep Duration",
    category: "vital",
    icon: "moon-outline",
    iconFamily: "Ionicons",
    howToMeasure:
      "Record total sleep time in hours and minutes. Use a sleep tracker for accuracy.",
    unit: "hrs",
    hasLeftRight: false,
    variations: [],
  },
];

export let ALL_MEASUREMENTS = [...BODY_MEASUREMENTS, ...VITAL_SIGNS];

export function refreshAllMeasurements(customMeasurements: MeasurementDefinition[]) {
  ALL_MEASUREMENTS = [...BODY_MEASUREMENTS, ...VITAL_SIGNS, ...customMeasurements];
}

export const DEFAULT_RATIOS: RatioDefinition[] = [
  {
    id: "waist-to-hip",
    label: "Waist to Hip",
    numeratorId: "waist",
    denominatorId: "hips",
    numeratorLabel: "Waist",
    denominatorLabel: "Hips",
    isSymmetry: false,
  },
  {
    id: "neck-to-waist",
    label: "Neck to Waist",
    numeratorId: "neck",
    denominatorId: "waist",
    numeratorLabel: "Neck",
    denominatorLabel: "Waist",
    isSymmetry: false,
  },
  {
    id: "shoulder-to-waist",
    label: "Shoulder to Waist",
    numeratorId: "shoulders",
    denominatorId: "waist",
    numeratorLabel: "Shoulders",
    denominatorLabel: "Waist",
    isSymmetry: false,
  },
  {
    id: "chest-to-waist",
    label: "Chest to Waist",
    numeratorId: "chest",
    denominatorId: "waist",
    numeratorLabel: "Chest",
    denominatorLabel: "Waist",
    isSymmetry: false,
  },
  {
    id: "bicep-symmetry",
    label: "Bicep Symmetry",
    numeratorId: "bicep_left",
    denominatorId: "bicep_right",
    numeratorLabel: "Bicep (L)",
    denominatorLabel: "Bicep (R)",
    isSymmetry: true,
  },
  {
    id: "thigh-symmetry",
    label: "Thigh Symmetry",
    numeratorId: "thigh_left",
    denominatorId: "thigh_right",
    numeratorLabel: "Thigh (L)",
    denominatorLabel: "Thigh (R)",
    isSymmetry: true,
  },
];

export const DEFAULT_PHOTO_TYPES: PhotoType[] = [
  { id: "front", label: "Front" },
  { id: "back", label: "Back" },
  { id: "side-left", label: "Left Side" },
  { id: "side-right", label: "Right Side" },
];

export function getMeasurementById(
  id: string,
  customMeasurements?: MeasurementDefinition[],
): MeasurementDefinition | undefined {
  const all = customMeasurements
    ? [...BODY_MEASUREMENTS, ...VITAL_SIGNS, ...customMeasurements]
    : ALL_MEASUREMENTS;
  return all.find((m) => m.id === id);
}

export function getEntryKey(
  measurementId: string,
  side?: string,
  variation?: string,
): string {
  let key = measurementId;
  if (side && side !== "none") key += `_${side}`;
  if (variation) key += `_${variation}`;
  return key;
}

export function parseEntryKey(
  key: string,
  customMeasurements?: MeasurementDefinition[],
): {
  measurementId: string;
  side?: string;
  variation?: string;
} {
  const parts = key.split("_");
  const all = customMeasurements
    ? [...BODY_MEASUREMENTS, ...VITAL_SIGNS, ...customMeasurements]
    : ALL_MEASUREMENTS;
  const def = all.find((m) => m.id === parts[0]);
  if (!def) return { measurementId: parts[0] };

  let side: string | undefined;
  let variation: string | undefined;

  if (def.hasLeftRight && parts.length > 1) {
    if (parts[1] === "left" || parts[1] === "right") {
      side = parts[1];
      if (parts.length > 2) variation = parts[2];
    } else {
      variation = parts[1];
    }
  } else if (parts.length > 1) {
    variation = parts[1];
  }

  return { measurementId: def.id, side, variation };
}

export function getDisplayLabel(
  key: string,
  customMeasurements?: MeasurementDefinition[],
): string {
  const { measurementId, side, variation } = parseEntryKey(key, customMeasurements);
  const def = getMeasurementById(measurementId, customMeasurements);
  if (!def) return key;

  let label = def.label;
  if (side) label += ` (${side === "left" ? "L" : "R"})`;
  if (variation)
    label += ` ${variation.charAt(0).toUpperCase() + variation.slice(1)}`;
  return label;
}
