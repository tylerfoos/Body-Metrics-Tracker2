import React from "react";
import { View, Text, Pressable, StyleSheet, useColorScheme, Platform } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "@/constants/colors";
import { getMeasurementById } from "@/lib/measurements";
import { useAppData } from "@/contexts/AppContext";

export default function MeasurementInfoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = useThemeColors(isDark);
  const insets = useSafeAreaInsets();
  const { customMeasurements } = useAppData();

  const measurement = getMeasurementById(id || "", customMeasurements);

  if (!measurement) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Measurement not found</Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: Platform.OS === "web" ? 67 : insets.top + 12,
        },
      ]}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={28} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.content}>
        <View style={[styles.iconCircle, { backgroundColor: colors.tintLight }]}>
          <Ionicons name="fitness-outline" size={32} color={colors.tint} />
        </View>
        <Text style={[styles.title, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
          {measurement.label}
        </Text>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary, fontFamily: "Inter_600SemiBold" }]}>
          How to measure
        </Text>
        <Text style={[styles.instructions, { color: colors.text, fontFamily: "Inter_400Regular" }]}>
          {measurement.howToMeasure}
        </Text>

        {measurement.unit && (
          <View style={[styles.unitBadge, { backgroundColor: colors.surfaceSecondary }]}>
            <Text style={[styles.unitText, { color: colors.textSecondary, fontFamily: "Inter_500Medium" }]}>
              Unit: {measurement.unit}
              {measurement.unitMetric ? ` / ${measurement.unitMetric}` : ""}
            </Text>
          </View>
        )}

        {measurement.hasLeftRight && (
          <View style={[styles.infoPill, { backgroundColor: colors.tintLight }]}>
            <Ionicons name="swap-horizontal" size={16} color={colors.tint} />
            <Text style={[styles.infoPillText, { color: colors.tint, fontFamily: "Inter_500Medium" }]}>
              Tracked for left and right sides
            </Text>
          </View>
        )}

        {measurement.variations.length > 0 && (
          <View style={{ gap: 6, marginTop: 8 }}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary, fontFamily: "Inter_600SemiBold" }]}>
              Variations
            </Text>
            <View style={styles.tagRow}>
              {measurement.variations.map((v) => (
                <View
                  key={v.id}
                  style={[styles.tag, { backgroundColor: colors.surfaceSecondary }]}
                >
                  <Text style={[styles.tagText, { color: colors.text, fontFamily: "Inter_500Medium" }]}>
                    {v.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {measurement.subSites && measurement.subSites.length > 0 && (
          <View style={{ gap: 6, marginTop: 8 }}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary, fontFamily: "Inter_600SemiBold" }]}>
              Measurement Sites
            </Text>
            <View style={styles.tagRow}>
              {measurement.subSites.map((s) => (
                <View
                  key={s.id}
                  style={[styles.tag, { backgroundColor: colors.surfaceSecondary }]}
                >
                  <Text style={[styles.tagText, { color: colors.text, fontFamily: "Inter_500Medium" }]}>
                    {s.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  content: { paddingHorizontal: 24, gap: 12, alignItems: "center" },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  title: { fontSize: 24, textAlign: "center" },
  sectionLabel: { fontSize: 13, textTransform: "uppercase", letterSpacing: 0.5, alignSelf: "flex-start", marginTop: 12 },
  instructions: { fontSize: 16, lineHeight: 24, textAlign: "left", alignSelf: "flex-start" },
  unitBadge: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  unitText: { fontSize: 14 },
  infoPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  infoPillText: { fontSize: 13 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, alignSelf: "flex-start" },
  tag: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  tagText: { fontSize: 13 },
});
