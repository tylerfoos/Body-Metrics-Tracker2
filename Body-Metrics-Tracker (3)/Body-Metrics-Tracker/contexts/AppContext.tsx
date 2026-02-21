import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import {
  UserProfile,
  SelectedMeasurement,
  MeasurementEntry,
  ProgressPhoto,
  RatioDefinition,
  MeasurementDefinition,
  PhotoType,
} from "@/lib/types";
import * as Storage from "@/lib/storage";

interface AppContextValue {
  profile: UserProfile | null;
  selectedMeasurements: SelectedMeasurement[];
  selectedRatios: string[];
  customRatios: RatioDefinition[];
  customMeasurements: MeasurementDefinition[];
  customPhotoTypes: PhotoType[];
  entries: MeasurementEntry[];
  photos: ProgressPhoto[];
  isLoading: boolean;
  setProfile: (profile: UserProfile) => Promise<void>;
  setSelectedMeasurements: (m: SelectedMeasurement[]) => Promise<void>;
  setSelectedRatios: (r: string[]) => Promise<void>;
  setCustomRatios: (r: RatioDefinition[]) => Promise<void>;
  setCustomMeasurements: (m: MeasurementDefinition[]) => Promise<void>;
  setCustomPhotoTypes: (t: PhotoType[]) => Promise<void>;
  addEntry: (entry: MeasurementEntry) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  importEntries: (newEntries: MeasurementEntry[]) => Promise<number>;
  addPhoto: (photo: ProgressPhoto) => Promise<void>;
  deletePhoto: (id: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<UserProfile | null>(null);
  const [selectedMeasurements, setSelectedMeasurementsState] = useState<
    SelectedMeasurement[]
  >([]);
  const [selectedRatios, setSelectedRatiosState] = useState<string[]>([]);
  const [customRatios, setCustomRatiosState] = useState<RatioDefinition[]>([]);
  const [customMeasurements, setCustomMeasurementsState] = useState<
    MeasurementDefinition[]
  >([]);
  const [customPhotoTypes, setCustomPhotoTypesState] = useState<PhotoType[]>([]);
  const [entries, setEntriesState] = useState<MeasurementEntry[]>([]);
  const [photos, setPhotosState] = useState<ProgressPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshData = useCallback(async () => {
    try {
      const data = await Storage.getAllData();
      setProfileState(data.profile);
      setSelectedMeasurementsState(data.selectedMeasurements);
      setSelectedRatiosState(data.selectedRatios);
      setCustomRatiosState(data.customRatios);
      setCustomMeasurementsState(data.customMeasurements);
      setCustomPhotoTypesState(data.customPhotoTypes);
      setEntriesState(data.entries);
      setPhotosState(data.photos);
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const setProfile = useCallback(async (p: UserProfile) => {
    setProfileState(p);
    await Storage.saveProfile(p);
  }, []);

  const setSelectedMeasurements = useCallback(
    async (m: SelectedMeasurement[]) => {
      setSelectedMeasurementsState(m);
      await Storage.saveSelectedMeasurements(m);
    },
    [],
  );

  const setSelectedRatios = useCallback(async (r: string[]) => {
    setSelectedRatiosState(r);
    await Storage.saveSelectedRatios(r);
  }, []);

  const setCustomRatios = useCallback(async (r: RatioDefinition[]) => {
    setCustomRatiosState(r);
    await Storage.saveCustomRatios(r);
  }, []);

  const setCustomMeasurements = useCallback(
    async (m: MeasurementDefinition[]) => {
      setCustomMeasurementsState(m);
      await Storage.saveCustomMeasurements(m);
    },
    [],
  );

  const setCustomPhotoTypes = useCallback(async (t: PhotoType[]) => {
    setCustomPhotoTypesState(t);
    await Storage.saveCustomPhotoTypes(t);
  }, []);

  const addEntry = useCallback(async (entry: MeasurementEntry) => {
    setEntriesState((prev) => {
      const updated = [entry, ...prev].sort((a, b) => b.timestamp - a.timestamp);
      return updated;
    });
    await Storage.addEntry(entry);
  }, []);

  const deleteEntry = useCallback(async (id: string) => {
    setEntriesState((prev) => prev.filter((e) => e.id !== id));
    await Storage.deleteEntry(id);
  }, []);

  const importEntries = useCallback(
    async (newEntries: MeasurementEntry[]): Promise<number> => {
      const merged = [...entries];
      let added = 0;

      for (const ne of newEntries) {
        const existing = merged.find((e) => e.date === ne.date);
        if (existing) {
          Object.assign(existing.values, ne.values);
        } else {
          merged.push(ne);
          added++;
        }
      }

      merged.sort((a, b) => b.timestamp - a.timestamp);
      setEntriesState(merged);
      await Storage.saveEntries(merged);
      return added;
    },
    [entries],
  );

  const addPhoto = useCallback(async (photo: ProgressPhoto) => {
    setPhotosState((prev) => {
      const updated = [photo, ...prev].sort((a, b) => b.timestamp - a.timestamp);
      return updated;
    });
    await Storage.addPhoto(photo);
  }, []);

  const deletePhoto = useCallback(async (id: string) => {
    setPhotosState((prev) => prev.filter((p) => p.id !== id));
    await Storage.deletePhoto(id);
  }, []);

  const value = useMemo(
    () => ({
      profile,
      selectedMeasurements,
      selectedRatios,
      customRatios,
      customMeasurements,
      customPhotoTypes,
      entries,
      photos,
      isLoading,
      setProfile,
      setSelectedMeasurements,
      setSelectedRatios,
      setCustomRatios,
      setCustomMeasurements,
      setCustomPhotoTypes,
      addEntry,
      deleteEntry,
      importEntries,
      addPhoto,
      deletePhoto,
      refreshData,
    }),
    [
      profile,
      selectedMeasurements,
      selectedRatios,
      customRatios,
      customMeasurements,
      customPhotoTypes,
      entries,
      photos,
      isLoading,
      setProfile,
      setSelectedMeasurements,
      setSelectedRatios,
      setCustomRatios,
      setCustomMeasurements,
      setCustomPhotoTypes,
      addEntry,
      deleteEntry,
      importEntries,
      addPhoto,
      deletePhoto,
      refreshData,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppData must be used within an AppProvider");
  }
  return context;
}
