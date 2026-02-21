export type UnitSystem = "imperial" | "metric";
export type Sex = "male" | "female" | "other";

export interface UserProfile {
  id: string;
  name: string;
  units: UnitSystem;
  sex: Sex;
  age: number;
  heightCm: number;
  createdAt: string;
  onboardingComplete: boolean;
}

export type MeasurementVariation = {
  id: string;
  label: string;
};

export type MeasurementSide = "left" | "right" | "none";

export interface MeasurementDefinition {
  id: string;
  label: string;
  category: "body" | "vital";
  icon: string;
  iconFamily: "Ionicons" | "MaterialCommunityIcons" | "Feather";
  howToMeasure: string;
  unit: string;
  unitMetric?: string;
  hasLeftRight: boolean;
  variations: MeasurementVariation[];
  subSites?: { id: string; label: string; group?: string }[];
  isCustom?: boolean;
}

export interface SelectedMeasurement {
  measurementId: string;
  enabled: boolean;
  selectedVariations: string[];
  selectedSides: MeasurementSide[];
  selectedSubSites?: string[];
}

export interface RatioDefinition {
  id: string;
  label: string;
  numeratorId: string;
  denominatorId: string;
  numeratorLabel: string;
  denominatorLabel: string;
  isSymmetry: boolean;
  isCustom?: boolean;
}

export interface MeasurementEntry {
  id: string;
  date: string;
  timestamp: number;
  values: Record<string, number | string>;
  notes?: string;
}

export interface PhotoType {
  id: string;
  label: string;
  isCustom?: boolean;
}

export interface ProgressPhoto {
  id: string;
  date: string;
  timestamp: number;
  type: string;
  uri: string;
}

export interface AppData {
  profile: UserProfile | null;
  selectedMeasurements: SelectedMeasurement[];
  selectedRatios: string[];
  customRatios: RatioDefinition[];
  customMeasurements: MeasurementDefinition[];
  customPhotoTypes: PhotoType[];
  entries: MeasurementEntry[];
  photos: ProgressPhoto[];
}
