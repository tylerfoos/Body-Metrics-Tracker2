import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  useColorScheme,
  Platform,
  Alert,
  Share,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useThemeColors } from "@/constants/colors";
import { useAppData } from "@/contexts/AppContext";
import { exportToCsv } from "@/lib/csv-parser";
import {
  BODY_MEASUREMENTS,
  VITAL_SIGNS,
  DEFAULT_RATIOS,
  getMeasurementById,
} from "@/lib/measurements";
import { clearAllData } from "@/lib/storage";

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = useThemeColors(isDark);
  const insets = useSafeAreaInsets();
  const {
    profile,
    selectedMeasurements,
    selectedRatios,
    customMeasurements,
    entries,
    photos,
    setSelectedMeasurements,
    setSelectedRatios,
    refreshData,
  } = useAppData();

  const [showMeasurements, setShowMeasurements] = useState(false);

  const toggleMeasurement = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = selectedMeasurements.map((m) =>
      m.measurementId === id ? { ...m, enabled: !m.enabled } : m,
    );
    setSelectedMeasurements(updated);
  };

  const handleExport = async () => {
    if (entries.length === 0) {
      Alert.alert("No Data", "There are no entries to export.");
      return;
    }

    const csv = exportToCsv(entries);

    if (Platform.OS === "web") {
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bodylog_export_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }

    try {
      const fileUri =
        FileSystem.documentDirectory +
        `bodylog_export_${new Date().toISOString().split("T")[0]}.csv`;
      await FileSystem.writeAsStringAsync(fileUri, csv);

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "text/csv",
          dialogTitle: "Export BodyLog Data",
        });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      console.error("Export error:", err);
      Alert.alert("Error", "Failed to export data.");
    }
  };

  const handleClearData = () => {
    Alert.alert(
      "Clear All Data",
      "This will permanently delete all your measurements, photos, and profile data. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Everything",
          style: "destructive",
          onPress: async () => {
            await clearAllData();
            await refreshData();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            router.replace("/onboarding");
          },
        },
      ],
    );
  };

  const enabledCount = selectedMeasurements.filter((m) => m.enabled).length;

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
          Settings
        </Text>

        <View style={[styles.profileCard, { backgroundColor: colors.surface }]}>
          <View style={[styles.avatar, { backgroundColor: colors.tintLight }]}>
            <Ionicons name="person" size={28} color={colors.tint} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[styles.profileName, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
              {profile?.name}
            </Text>
            <Text style={[styles.profileInfo, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
              {profile?.sex}, Age {profile?.age}
              {" | "}
              {profile?.units === "imperial" ? "Imperial" : "Metric"}
            </Text>
          </View>
        </View>

        <View style={[styles.statsRow, { marginBottom: 24 }]}>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statNum, { color: colors.tint, fontFamily: "Inter_700Bold" }]}>
              {entries.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
              Entries
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statNum, { color: colors.tint, fontFamily: "Inter_700Bold" }]}>
              {enabledCount}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
              Tracking
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statNum, { color: colors.tint, fontFamily: "Inter_700Bold" }]}>
              {photos.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
              Photos
            </Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
          Data
        </Text>
        <View style={[styles.menuGroup, { backgroundColor: colors.surface }]}>
          <Pressable
            onPress={() => router.push("/import-csv")}
            style={[styles.menuItem, { borderBottomColor: colors.borderLight }]}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="cloud-upload-outline" size={20} color={colors.tint} />
              <Text style={[styles.menuText, { color: colors.text, fontFamily: "Inter_500Medium" }]}>
                Import CSV
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </Pressable>
          <Pressable onPress={handleExport} style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <Ionicons name="download-outline" size={20} color={colors.tint} />
              <Text style={[styles.menuText, { color: colors.text, fontFamily: "Inter_500Medium" }]}>
                Export CSV
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </Pressable>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: "Inter_700Bold", marginTop: 24 }]}>
          Tracked Measurements ({enabledCount})
        </Text>
        <Pressable
          onPress={() => setShowMeasurements(!showMeasurements)}
          style={[styles.expandBtn, { backgroundColor: colors.surface }]}
        >
          <Text style={[styles.expandText, { color: colors.tint, fontFamily: "Inter_500Medium" }]}>
            {showMeasurements ? "Hide" : "Show"} Measurements
          </Text>
          <Ionicons
            name={showMeasurements ? "chevron-up" : "chevron-down"}
            size={18}
            color={colors.tint}
          />
        </Pressable>

        {showMeasurements && (
          <View style={[styles.menuGroup, { backgroundColor: colors.surface, marginTop: 8 }]}>
            {[...BODY_MEASUREMENTS, ...VITAL_SIGNS, ...customMeasurements].map((m, i, arr) => {
              const sm = selectedMeasurements.find(
                (s) => s.measurementId === m.id,
              );
              const enabled = sm?.enabled || false;
              return (
                <Pressable
                  key={m.id}
                  onPress={() => toggleMeasurement(m.id)}
                  style={[
                    styles.measurementToggleItem,
                    i < arr.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: colors.borderLight,
                    },
                  ]}
                >
                  <Text style={[styles.menuText, { color: colors.text, fontFamily: "Inter_500Medium" }]}>
                    {m.label}
                  </Text>
                  <View
                    style={[
                      styles.toggleDot,
                      {
                        backgroundColor: enabled ? colors.tint : colors.surfaceSecondary,
                        borderColor: enabled ? colors.tint : colors.border,
                      },
                    ]}
                  >
                    {enabled && <Ionicons name="checkmark" size={12} color="#fff" />}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: "Inter_700Bold", marginTop: 24 }]}>
          Danger Zone
        </Text>
        <Pressable
          onPress={handleClearData}
          style={[styles.dangerBtn, { backgroundColor: colors.accentLight }]}
        >
          <Ionicons name="trash-outline" size={20} color={colors.accent} />
          <Text style={[styles.dangerText, { color: colors.accent, fontFamily: "Inter_600SemiBold" }]}>
            Clear All Data
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  title: { fontSize: 24, marginBottom: 20 },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    gap: 14,
    marginBottom: 16,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  profileName: { fontSize: 18 },
  profileInfo: { fontSize: 13 },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    gap: 4,
  },
  statNum: { fontSize: 22 },
  statLabel: { fontSize: 12 },
  sectionTitle: { fontSize: 16, marginBottom: 10 },
  menuGroup: { borderRadius: 14, overflow: "hidden" },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  menuLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  menuText: { fontSize: 15 },
  expandBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: 12,
    borderRadius: 12,
  },
  expandText: { fontSize: 14 },
  measurementToggleItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  toggleDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  dangerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
    borderRadius: 14,
  },
  dangerText: { fontSize: 15 },
});
