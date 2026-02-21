import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  UserProfile,
  SelectedMeasurement,
  MeasurementEntry,
  ProgressPhoto,
  RatioDefinition,
  MeasurementDefinition,
  PhotoType,
  AppData,
} from "./types";

const KEYS = {
  PROFILE: "@bodylog_profile",
  MEASUREMENTS: "@bodylog_measurements",
  RATIOS: "@bodylog_ratios",
  CUSTOM_RATIOS: "@bodylog_custom_ratios",
  CUSTOM_MEASUREMENTS: "@bodylog_custom_measurements",
  CUSTOM_PHOTO_TYPES: "@bodylog_custom_photo_types",
  ENTRIES: "@bodylog_entries",
  PHOTOS: "@bodylog_photos",
};

export async function saveProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
}

export async function getProfile(): Promise<UserProfile | null> {
  const data = await AsyncStorage.getItem(KEYS.PROFILE);
  return data ? JSON.parse(data) : null;
}

export async function saveSelectedMeasurements(
  measurements: SelectedMeasurement[],
): Promise<void> {
  await AsyncStorage.setItem(KEYS.MEASUREMENTS, JSON.stringify(measurements));
}

export async function getSelectedMeasurements(): Promise<SelectedMeasurement[]> {
  const data = await AsyncStorage.getItem(KEYS.MEASUREMENTS);
  return data ? JSON.parse(data) : [];
}

export async function saveSelectedRatios(ratioIds: string[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.RATIOS, JSON.stringify(ratioIds));
}

export async function getSelectedRatios(): Promise<string[]> {
  const data = await AsyncStorage.getItem(KEYS.RATIOS);
  return data ? JSON.parse(data) : [];
}

export async function saveCustomRatios(ratios: RatioDefinition[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.CUSTOM_RATIOS, JSON.stringify(ratios));
}

export async function getCustomRatios(): Promise<RatioDefinition[]> {
  const data = await AsyncStorage.getItem(KEYS.CUSTOM_RATIOS);
  return data ? JSON.parse(data) : [];
}

export async function saveCustomMeasurements(
  measurements: MeasurementDefinition[],
): Promise<void> {
  await AsyncStorage.setItem(KEYS.CUSTOM_MEASUREMENTS, JSON.stringify(measurements));
}

export async function getCustomMeasurements(): Promise<MeasurementDefinition[]> {
  const data = await AsyncStorage.getItem(KEYS.CUSTOM_MEASUREMENTS);
  return data ? JSON.parse(data) : [];
}

export async function saveCustomPhotoTypes(types: PhotoType[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.CUSTOM_PHOTO_TYPES, JSON.stringify(types));
}

export async function getCustomPhotoTypes(): Promise<PhotoType[]> {
  const data = await AsyncStorage.getItem(KEYS.CUSTOM_PHOTO_TYPES);
  return data ? JSON.parse(data) : [];
}

export async function saveEntries(entries: MeasurementEntry[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.ENTRIES, JSON.stringify(entries));
}

export async function getEntries(): Promise<MeasurementEntry[]> {
  const data = await AsyncStorage.getItem(KEYS.ENTRIES);
  return data ? JSON.parse(data) : [];
}

export async function addEntry(entry: MeasurementEntry): Promise<void> {
  const entries = await getEntries();
  entries.push(entry);
  entries.sort((a, b) => b.timestamp - a.timestamp);
  await saveEntries(entries);
}

export async function deleteEntry(id: string): Promise<void> {
  const entries = await getEntries();
  await saveEntries(entries.filter((e) => e.id !== id));
}

export async function savePhotos(photos: ProgressPhoto[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.PHOTOS, JSON.stringify(photos));
}

export async function getPhotos(): Promise<ProgressPhoto[]> {
  const data = await AsyncStorage.getItem(KEYS.PHOTOS);
  return data ? JSON.parse(data) : [];
}

export async function addPhoto(photo: ProgressPhoto): Promise<void> {
  const photos = await getPhotos();
  photos.push(photo);
  photos.sort((a, b) => b.timestamp - a.timestamp);
  await savePhotos(photos);
}

export async function deletePhoto(id: string): Promise<void> {
  const photos = await getPhotos();
  await savePhotos(photos.filter((p) => p.id !== id));
}

export async function getAllData(): Promise<AppData> {
  const [
    profile,
    selectedMeasurements,
    selectedRatios,
    customRatios,
    customMeasurements,
    customPhotoTypes,
    entries,
    photos,
  ] = await Promise.all([
    getProfile(),
    getSelectedMeasurements(),
    getSelectedRatios(),
    getCustomRatios(),
    getCustomMeasurements(),
    getCustomPhotoTypes(),
    getEntries(),
    getPhotos(),
  ]);
  return {
    profile,
    selectedMeasurements,
    selectedRatios,
    customRatios,
    customMeasurements,
    customPhotoTypes,
    entries,
    photos,
  };
}

export async function clearAllData(): Promise<void> {
  await AsyncStorage.multiRemove(Object.values(KEYS));
}
