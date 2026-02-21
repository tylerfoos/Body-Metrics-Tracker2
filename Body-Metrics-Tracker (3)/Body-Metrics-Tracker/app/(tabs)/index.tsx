import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  useColorScheme,
  Platform,
  Dimensions,
} from "react-native";
import { router, Redirect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useThemeColors } from "@/constants/colors";
import { useAppData } from "@/contexts/AppContext";
import { MiniChart } from "@/components/MiniChart";
import {
  ALL_MEASUREMENTS,
  DEFAULT_RATIOS,
  getDisplayLabel,
  getEntryKey,
  getMeasurementById,
} from "@/lib/measurements";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = (SCREEN_WIDTH - 52) / 2;

export default function DashboardScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = useThemeColors(isDark);
  const insets = useSafeAreaInsets();
  const { profile, selectedMeasurements, selectedRatios, customRatios, customMeasurements, entries, isLoading } =
    useAppData();

  if (!isLoading && (!profile || !profile.onboardingComplete)) {
    return <Redirect href="/onboarding" />;
  }

  const enabledMeasurements = useMemo(
    () => selectedMeasurements.filter((m) => m.enabled),
    [selectedMeasurements],
  );

  const chartData = useMemo(() => {
    const result: Record<string, { values: number[]; latest: number | string; change: number | null; unit: string }> = {};
    const sortedEntries = [...entries].sort((a, b) => a.timestamp - b.timestamp);

    for (const sm of enabledMeasurements) {
      const def = getMeasurementById(sm.measurementId, customMeasurements);
      if (!def) continue;

      const sides = def.hasLeftRight ? ["left", "right"] : ["none"];
      const variations = sm.selectedVariations.length > 0 ? sm.selectedVariations : [""];

      for (const side of sides) {
        for (const variation of variations) {
          const key = getEntryKey(sm.measurementId, side === "none" ? undefined : side, variation || undefined);
          const vals: number[] = [];

          for (const entry of sortedEntries) {
            const v = entry.values[key] ?? entry.values[sm.measurementId];
            if (v !== undefined && typeof v === "number") {
              vals.push(v);
            }
          }

          if (vals.length > 0) {
            const latest = vals[vals.length - 1];
            const prev = vals.length > 1 ? vals[vals.length - 2] : null;
            const change = prev !== null ? latest - prev : null;
            const unit = profile?.units === "metric" && def.unitMetric ? def.unitMetric : def.unit;
            result[key] = { values: vals, latest, change, unit };
          }
        }
      }
    }

    return result;
  }, [enabledMeasurements, entries, profile, customMeasurements]);

  const ratioData = useMemo(() => {
    if (entries.length === 0) return [];
    const latest = [...entries].sort((a, b) => b.timestamp - a.timestamp)[0];
    if (!latest) return [];

    const allRatios = [...DEFAULT_RATIOS, ...(customRatios || [])];
    return (selectedRatios || [])
      .map((rId) => {
        const def = allRatios.find((r) => r.id === rId);
        if (!def) return null;

        const numVal = latest.values[def.numeratorId];
        const denVal = latest.values[def.denominatorId];
        if (typeof numVal !== "number" || typeof denVal !== "number" || denVal === 0)
          return null;

        return {
          ...def,
          value: Math.round((numVal / denVal) * 100) / 100,
        };
      })
      .filter(Boolean);
  }, [selectedRatios, entries, customRatios]);

  const recentEntries = useMemo(
    () => entries.slice(0, 5),
    [entries],
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Ionicons name="fitness-outline" size={40} color={colors.tint} />
        </View>
      </View>
    );
  }

  const chartKeys = Object.keys(chartData);

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
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary, fontFamily: "Inter_500Medium" }]}>
              Welcome back
            </Text>
            <Text style={[styles.name, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
              {profile?.name}
            </Text>
          </View>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push("/add-entry");
            }}
            style={[styles.addButton, { backgroundColor: colors.tint }]}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </Pressable>
        </View>

        {entries.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="analytics-outline" size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>
              No data yet
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
              Add your first measurement or import data from a CSV file to see your trends here.
            </Text>
            <View style={styles.emptyActions}>
              <Pressable
                onPress={() => router.push("/add-entry")}
                style={[styles.emptyBtn, { backgroundColor: colors.tint }]}
              >
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={[styles.emptyBtnText, { color: "#fff", fontFamily: "Inter_600SemiBold" }]}>
                  Add Entry
                </Text>
              </Pressable>
              <Pressable
                onPress={() => router.push("/import-csv")}
                style={[styles.emptyBtn, { backgroundColor: colors.surfaceSecondary }]}
              >
                <Ionicons name="cloud-upload-outline" size={18} color={colors.tint} />
                <Text style={[styles.emptyBtnText, { color: colors.tint, fontFamily: "Inter_600SemiBold" }]}>
                  Import CSV
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <>
            {chartKeys.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
                  Trends
                </Text>
                <View style={styles.cardGrid}>
                  {chartKeys.slice(0, 8).map((key) => {
                    const d = chartData[key];
                    const label = getDisplayLabel(key, customMeasurements);
                    const isPositive = d.change !== null && d.change > 0;
                    const isNegative = d.change !== null && d.change < 0;

                    return (
                      <View
                        key={key}
                        style={[
                          styles.chartCard,
                          { backgroundColor: colors.surface },
                        ]}
                      >
                        <View style={styles.chartCardHeader}>
                          <Text
                            style={[
                              styles.chartLabel,
                              {
                                color: colors.textSecondary,
                                fontFamily: "Inter_500Medium",
                              },
                            ]}
                            numberOfLines={1}
                          >
                            {label}
                          </Text>
                          {d.change !== null && (
                            <View
                              style={[
                                styles.changeBadge,
                                {
                                  backgroundColor: isPositive
                                    ? "rgba(16, 185, 129, 0.1)"
                                    : isNegative
                                      ? "rgba(239, 68, 68, 0.1)"
                                      : colors.surfaceSecondary,
                                },
                              ]}
                            >
                              <Ionicons
                                name={
                                  isPositive
                                    ? "trending-up"
                                    : isNegative
                                      ? "trending-down"
                                      : "remove"
                                }
                                size={12}
                                color={
                                  isPositive
                                    ? colors.success
                                    : isNegative
                                      ? colors.accent
                                      : colors.textTertiary
                                }
                              />
                              <Text
                                style={[
                                  styles.changeText,
                                  {
                                    color: isPositive
                                      ? colors.success
                                      : isNegative
                                        ? colors.accent
                                        : colors.textTertiary,
                                    fontFamily: "Inter_500Medium",
                                  },
                                ]}
                              >
                                {Math.abs(d.change).toFixed(1)}
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text
                          style={[
                            styles.chartValue,
                            { color: colors.text, fontFamily: "Inter_700Bold" },
                          ]}
                        >
                          {typeof d.latest === "number"
                            ? d.latest % 1 === 0
                              ? d.latest
                              : d.latest.toFixed(1)
                            : d.latest}
                          <Text
                            style={[
                              styles.chartUnit,
                              {
                                color: colors.textTertiary,
                                fontFamily: "Inter_400Regular",
                              },
                            ]}
                          >
                            {" "}
                            {d.unit}
                          </Text>
                        </Text>
                        {d.values.length >= 2 && (
                          <MiniChart
                            data={d.values.slice(-14)}
                            width={CARD_WIDTH - 24}
                            height={48}
                            color={colors.tint}
                            showDots
                          />
                        )}
                      </View>
                    );
                  })}
                </View>
              </>
            )}

            {ratioData.length > 0 && (
              <>
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: colors.text, fontFamily: "Inter_700Bold", marginTop: 24 },
                  ]}
                >
                  Ratios & Symmetry
                </Text>
                <View style={styles.cardGrid}>
                  {ratioData.map((r: any) => (
                    <View
                      key={r.id}
                      style={[
                        styles.ratioCard,
                        { backgroundColor: colors.surface },
                      ]}
                    >
                      <Text
                        style={[
                          styles.ratioLabel,
                          { color: colors.textSecondary, fontFamily: "Inter_500Medium" },
                        ]}
                      >
                        {r.label}
                      </Text>
                      <Text
                        style={[
                          styles.ratioValue,
                          { color: colors.info, fontFamily: "Inter_700Bold" },
                        ]}
                      >
                        {r.value.toFixed(2)}
                      </Text>
                      <Text
                        style={[
                          styles.ratioFormula,
                          { color: colors.textTertiary, fontFamily: "Inter_400Regular" },
                        ]}
                      >
                        {r.numeratorLabel} / {r.denominatorLabel}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            <Text
              style={[
                styles.sectionTitle,
                { color: colors.text, fontFamily: "Inter_700Bold", marginTop: 24 },
              ]}
            >
              Recent Entries
            </Text>
            {recentEntries.map((entry) => {
              const valueKeys = Object.keys(entry.values).slice(0, 3);
              return (
                <View
                  key={entry.id}
                  style={[styles.entryCard, { backgroundColor: colors.surface }]}
                >
                  <View style={styles.entryHeader}>
                    <Text
                      style={[
                        styles.entryDate,
                        { color: colors.text, fontFamily: "Inter_600SemiBold" },
                      ]}
                    >
                      {new Date(entry.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </Text>
                    <Text
                      style={[
                        styles.entryCount,
                        { color: colors.textTertiary, fontFamily: "Inter_400Regular" },
                      ]}
                    >
                      {Object.keys(entry.values).length} metrics
                    </Text>
                  </View>
                  <View style={styles.entryValues}>
                    {valueKeys.map((k) => (
                      <View key={k} style={styles.entryValueItem}>
                        <Text
                          style={[
                            styles.entryValueLabel,
                            { color: colors.textSecondary, fontFamily: "Inter_400Regular" },
                          ]}
                          numberOfLines={1}
                        >
                          {getDisplayLabel(k, customMeasurements)}
                        </Text>
                        <Text
                          style={[
                            styles.entryValueNum,
                            { color: colors.text, fontFamily: "Inter_600SemiBold" },
                          ]}
                        >
                          {entry.values[k]}
                        </Text>
                      </View>
                    ))}
                    {Object.keys(entry.values).length > 3 && (
                      <Text
                        style={[
                          styles.moreText,
                          { color: colors.textTertiary, fontFamily: "Inter_400Regular" },
                        ]}
                      >
                        +{Object.keys(entry.values).length - 3} more
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: { paddingHorizontal: 20 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  greeting: { fontSize: 14 },
  name: { fontSize: 24 },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyCard: {
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  emptyTitle: { fontSize: 18, marginTop: 4 },
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  emptyActions: { flexDirection: "row", gap: 12, marginTop: 8 },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  emptyBtnText: { fontSize: 14 },
  sectionTitle: { fontSize: 18, marginBottom: 12 },
  cardGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  chartCard: {
    width: CARD_WIDTH,
    borderRadius: 16,
    padding: 12,
    gap: 6,
  },
  chartCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chartLabel: { fontSize: 12, flex: 1 },
  changeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  changeText: { fontSize: 11 },
  chartValue: { fontSize: 22 },
  chartUnit: { fontSize: 13 },
  ratioCard: {
    width: CARD_WIDTH,
    borderRadius: 16,
    padding: 14,
    gap: 4,
  },
  ratioLabel: { fontSize: 12 },
  ratioValue: { fontSize: 24 },
  ratioFormula: { fontSize: 11 },
  entryCard: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  entryDate: { fontSize: 15 },
  entryCount: { fontSize: 12 },
  entryValues: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  entryValueItem: { gap: 2 },
  entryValueLabel: { fontSize: 11 },
  entryValueNum: { fontSize: 15 },
  moreText: { fontSize: 12, alignSelf: "center" },
});
