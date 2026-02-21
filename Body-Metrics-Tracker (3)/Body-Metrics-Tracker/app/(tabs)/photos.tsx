import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  useColorScheme,
  Platform,
  Dimensions,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import * as Crypto from "expo-crypto";
import { useThemeColors } from "@/constants/colors";
import { useAppData } from "@/contexts/AppContext";
import { ProgressPhoto } from "@/lib/types";
import { DEFAULT_PHOTO_TYPES } from "@/lib/measurements";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PHOTO_SIZE = (SCREEN_WIDTH - 60) / 3;

export default function PhotosScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = useThemeColors(isDark);
  const insets = useSafeAreaInsets();
  const { photos, addPhoto, deletePhoto, customPhotoTypes } = useAppData();
  const allPhotoTypes = [...DEFAULT_PHOTO_TYPES, ...(customPhotoTypes || [])];
  const [selectedType, setSelectedType] = useState<string>("all");

  const filteredPhotos = useMemo(() => {
    if (selectedType === "all") return photos;
    return photos.filter((p) => p.type === selectedType);
  }, [photos, selectedType]);

  const groupedPhotos = useMemo(() => {
    const groups: Record<string, ProgressPhoto[]> = {};
    filteredPhotos.forEach((p) => {
      if (!groups[p.date]) groups[p.date] = [];
      groups[p.date].push(p);
    });
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [filteredPhotos]);

  const takePhoto = async (type: string) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Camera Access",
        "Please enable camera access in your device settings.",
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: true,
      aspect: [3, 4],
    });

    if (!result.canceled && result.assets[0]) {
      const photo: ProgressPhoto = {
        id: Crypto.randomUUID(),
        date: new Date().toISOString().split("T")[0],
        timestamp: Date.now(),
        type,
        uri: result.assets[0].uri,
      };
      await addPhoto(photo);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const pickFromGallery = async (type: string) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.8,
      allowsEditing: true,
      aspect: [3, 4],
    });

    if (!result.canceled && result.assets[0]) {
      const photo: ProgressPhoto = {
        id: Crypto.randomUUID(),
        date: new Date().toISOString().split("T")[0],
        timestamp: Date.now(),
        type,
        uri: result.assets[0].uri,
      };
      await addPhoto(photo);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const showAddOptions = (type: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const typeLabel = allPhotoTypes.find((t) => t.id === type)?.label || type;
    Alert.alert("Add Photo", `Add ${typeLabel} progress photo`, [
      { text: "Take Photo", onPress: () => takePhoto(type) },
      { text: "Choose from Gallery", onPress: () => pickFromGallery(type) },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const confirmDelete = (id: string) => {
    Alert.alert("Delete Photo", "Remove this progress photo?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deletePhoto(id);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Platform.OS === "web" ? 67 + 12 : insets.top + 12,
            paddingBottom: 120,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
          Progress Photos
        </Text>

        <View style={styles.addRow}>
          {allPhotoTypes.map((pt) => (
            <Pressable
              key={pt.id}
              onPress={() => showAddOptions(pt.id)}
              style={[styles.addCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Ionicons name="camera-outline" size={22} color={colors.tint} />
              <Text style={[styles.addCardText, { color: colors.text, fontFamily: "Inter_500Medium" }]}>
                {pt.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterRow}
          contentContainerStyle={{ gap: 8 }}
        >
          {[{ id: "all", label: "All" }, ...allPhotoTypes].map((f) => (
            <Pressable
              key={f.id}
              onPress={() => {
                setSelectedType(f.id);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              style={[
                styles.filterChip,
                {
                  backgroundColor:
                    selectedType === f.id ? colors.tint : colors.surfaceSecondary,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  {
                    color: selectedType === f.id ? "#fff" : colors.textSecondary,
                    fontFamily: "Inter_500Medium",
                  },
                ]}
              >
                {f.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {groupedPhotos.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="images-outline" size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>
              No photos yet
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
              Take progress photos to track your visual changes over time.
            </Text>
          </View>
        ) : (
          groupedPhotos.map(([date, datePhotos]) => (
            <View key={date} style={styles.dateGroup}>
              <Text style={[styles.dateLabel, { color: colors.textSecondary, fontFamily: "Inter_600SemiBold" }]}>
                {new Date(date).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </Text>
              <View style={styles.photoGrid}>
                {datePhotos.map((photo) => (
                  <Pressable
                    key={photo.id}
                    onLongPress={() => confirmDelete(photo.id)}
                    style={styles.photoItem}
                  >
                    <Image
                      source={{ uri: photo.uri }}
                      style={styles.photoImage}
                      contentFit="cover"
                    />
                    <View
                      style={[
                        styles.photoTypeBadge,
                        { backgroundColor: colors.tint },
                      ]}
                    >
                      <Text style={[styles.photoTypeText, { fontFamily: "Inter_500Medium" }]}>
                        {photo.type.replace("side-", "")}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  title: { fontSize: 24, marginBottom: 16 },
  addRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  addCard: {
    flex: 1,
    minWidth: (SCREEN_WIDTH - 60) / 2 - 5,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
  },
  addCardText: { fontSize: 13 },
  filterRow: { marginBottom: 20 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterChipText: { fontSize: 13 },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 10,
  },
  emptyTitle: { fontSize: 17 },
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 20, paddingHorizontal: 20 },
  dateGroup: { marginBottom: 20 },
  dateLabel: {
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  photoItem: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE * 1.33,
    borderRadius: 12,
    overflow: "hidden",
  },
  photoImage: {
    width: "100%",
    height: "100%",
  },
  photoTypeBadge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  photoTypeText: { fontSize: 10, color: "#fff", textTransform: "capitalize" },
});
