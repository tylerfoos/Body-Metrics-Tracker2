import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  useColorScheme,
  Platform,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Crypto from "expo-crypto";
import { useThemeColors } from "@/constants/colors";
import { useAppData } from "@/contexts/AppContext";
import {
  getMeasurementById,
  getEntryKey,
} from "@/lib/measurements";
import { MeasurementEntry, MeasurementDefinition } from "@/lib/types";

interface FieldGroup {
  measurement: MeasurementDefinition;
  unit: string;
  fields: { key: string; sideLabel?: string; variationLabel?: string }[];
  subSiteFields?: { key: string; siteLabel: string }[];
}

export default function AddEntryScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = useThemeColors(isDark);
  const insets = useSafeAreaInsets();
  const { profile, selectedMeasurements, customMeasurements, addEntry } = useAppData();

  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [expandedInfo, setExpandedInfo] = useState<string | null>(null);

  const fieldGroups = useMemo(() => {
    const groups: FieldGroup[] = [];
    const enabled = selectedMeasurements.filter((m) => m.enabled);

    for (const sm of enabled) {
      const def = getMeasurementById(sm.measurementId, customMeasurements);
      if (!def) continue;

      const unit =
        profile?.units === "metric" && def.unitMetric ? def.unitMetric : def.unit;

      if (def.subSites && sm.selectedSubSites && sm.selectedSubSites.length > 0) {
        const siteFields = sm.selectedSubSites.map((siteId) => {
          const siteDef = def.subSites?.find((s) => s.id === siteId);
          return {
            key: `${def.id}_${siteId}`,
            siteLabel: siteDef?.label || siteId,
          };
        });
        groups.push({
          measurement: def,
          unit,
          fields: [],
          subSiteFields: siteFields,
        });
        continue;
      }

      const sides = def.hasLeftRight
        ? sm.selectedSides.filter((s) => s !== "none")
        : [undefined];
      const variations =
        sm.selectedVariations.length > 0 ? sm.selectedVariations : [undefined];

      if (sides.length === 0 && def.hasLeftRight) continue;

      const fields: FieldGroup["fields"] = [];
      for (const variation of variations) {
        for (const side of sides) {
          const key = getEntryKey(def.id, side, variation);
          fields.push({
            key,
            sideLabel: side === "left" ? "L" : side === "right" ? "R" : undefined,
            variationLabel: variation
              ? variation.charAt(0).toUpperCase() + variation.slice(1)
              : undefined,
          });
        }
      }

      if (fields.length > 0) {
        groups.push({ measurement: def, unit, fields });
      }
    }

    return groups;
  }, [selectedMeasurements, profile, customMeasurements]);

  const handleSave = async () => {
    const numericValues: Record<string, number | string> = {};
    let hasAny = false;

    for (const [key, val] of Object.entries(values)) {
      if (val.trim()) {
        const num = parseFloat(val);
        numericValues[key] = isNaN(num) ? val : num;
        hasAny = true;
      }
    }

    if (!hasAny) {
      Alert.alert("No Data", "Please enter at least one measurement.");
      return;
    }

    const entry: MeasurementEntry = {
      id: Crypto.randomUUID(),
      date,
      timestamp: new Date(date).getTime(),
      values: numericValues,
      notes: notes.trim() || undefined,
    };

    await addEntry(entry);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  const renderFieldGroup = (group: FieldGroup) => {
    const { measurement: m, unit, fields, subSiteFields } = group;
    const isInfoExpanded = expandedInfo === m.id;
    const hasMultipleFields = fields.length > 1 || (subSiteFields && subSiteFields.length > 1);

    return (
      <View
        key={m.id}
        style={[styles.groupCard, { backgroundColor: colors.surface }]}
      >
        <View style={styles.groupHeader}>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.groupTitle,
                { color: colors.text, fontFamily: "Inter_700Bold" },
              ]}
            >
              {m.label}
            </Text>
            {unit ? (
              <Text
                style={[
                  styles.groupUnit,
                  { color: colors.textTertiary, fontFamily: "Inter_400Regular" },
                ]}
              >
                {unit}
              </Text>
            ) : null}
          </View>
          <Pressable
            onPress={() => setExpandedInfo(isInfoExpanded ? null : m.id)}
            hitSlop={8}
          >
            <Ionicons
              name={isInfoExpanded ? "information-circle" : "information-circle-outline"}
              size={22}
              color={isInfoExpanded ? colors.tint : colors.textTertiary}
            />
          </Pressable>
        </View>

        {isInfoExpanded && (
          <View
            style={[
              styles.infoBox,
              { backgroundColor: colors.tintLight, borderColor: colors.tint },
            ]}
          >
            <Text
              style={[
                styles.infoBoxTitle,
                { color: colors.tint, fontFamily: "Inter_600SemiBold" },
              ]}
            >
              How to measure
            </Text>
            <Text
              style={[
                styles.infoBoxText,
                { color: colors.text, fontFamily: "Inter_400Regular" },
              ]}
            >
              {m.howToMeasure}
            </Text>
          </View>
        )}

        {subSiteFields && subSiteFields.length > 0 ? (
          <View style={styles.tableContainer}>
            {subSiteFields.map((sf, i) => (
              <View
                key={sf.key}
                style={[
                  styles.tableRow,
                  i < subSiteFields.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: colors.borderLight,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.tableLabel,
                    { color: colors.textSecondary, fontFamily: "Inter_500Medium" },
                  ]}
                  numberOfLines={1}
                >
                  {sf.siteLabel}
                </Text>
                <TextInput
                  style={[
                    styles.tableInput,
                    {
                      backgroundColor: colors.background,
                      color: colors.text,
                      borderColor: values[sf.key]
                        ? colors.tint
                        : colors.border,
                      fontFamily: "Inter_400Regular",
                    },
                  ]}
                  value={values[sf.key] || ""}
                  onChangeText={(t) =>
                    setValues((prev) => ({ ...prev, [sf.key]: t }))
                  }
                  placeholder="--"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="decimal-pad"
                />
              </View>
            ))}
          </View>
        ) : hasMultipleFields ? (
          <View style={styles.tableContainer}>
            {fields.map((f, i) => {
              let label = "";
              if (f.variationLabel && f.sideLabel) {
                label = `${f.variationLabel} (${f.sideLabel})`;
              } else if (f.variationLabel) {
                label = f.variationLabel;
              } else if (f.sideLabel) {
                label = f.sideLabel === "L" ? "Left" : "Right";
              }

              return (
                <View
                  key={f.key}
                  style={[
                    styles.tableRow,
                    i < fields.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: colors.borderLight,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.tableLabel,
                      {
                        color: colors.textSecondary,
                        fontFamily: "Inter_500Medium",
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {label}
                  </Text>
                  <TextInput
                    style={[
                      styles.tableInput,
                      {
                        backgroundColor: colors.background,
                        color: colors.text,
                        borderColor: values[f.key]
                          ? colors.tint
                          : colors.border,
                        fontFamily: "Inter_400Regular",
                      },
                    ]}
                    value={values[f.key] || ""}
                    onChangeText={(t) =>
                      setValues((prev) => ({ ...prev, [f.key]: t }))
                    }
                    placeholder="--"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="decimal-pad"
                  />
                </View>
              );
            })}
          </View>
        ) : fields.length === 1 ? (
          <TextInput
            style={[
              styles.singleInput,
              {
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: values[fields[0].key]
                  ? colors.tint
                  : colors.border,
                fontFamily: "Inter_400Regular",
              },
            ]}
            value={values[fields[0].key] || ""}
            onChangeText={(t) =>
              setValues((prev) => ({ ...prev, [fields[0].key]: t }))
            }
            placeholder={`Enter ${m.label.toLowerCase()}`}
            placeholderTextColor={colors.textTertiary}
            keyboardType="decimal-pad"
          />
        ) : null}
      </View>
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: Platform.OS === "web" ? 67 : insets.top,
        },
      ]}
    >
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={28} color={colors.text} />
        </Pressable>
        <Text
          style={[
            styles.headerTitle,
            { color: colors.text, fontFamily: "Inter_700Bold" },
          ]}
        >
          Add Entry
        </Text>
        <Pressable onPress={handleSave} hitSlop={12}>
          <Ionicons name="checkmark" size={28} color={colors.tint} />
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.dateSection}>
          <Text
            style={[
              styles.label,
              { color: colors.text, fontFamily: "Inter_600SemiBold" },
            ]}
          >
            Date
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                color: colors.text,
                borderColor: colors.border,
                fontFamily: "Inter_400Regular",
              },
            ]}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textTertiary}
          />
        </View>

        {fieldGroups.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="construct-outline"
              size={40}
              color={colors.textTertiary}
            />
            <Text
              style={[
                styles.emptyStateText,
                {
                  color: colors.textSecondary,
                  fontFamily: "Inter_500Medium",
                },
              ]}
            >
              No measurements selected. Go to Settings to choose what to track.
            </Text>
          </View>
        ) : (
          fieldGroups.map((group) => renderFieldGroup(group))
        )}

        <View style={[styles.groupCard, { backgroundColor: colors.surface, marginTop: 8 }]}>
          <Text
            style={[
              styles.groupTitle,
              { color: colors.text, fontFamily: "Inter_600SemiBold" },
            ]}
          >
            Notes (optional)
          </Text>
          <TextInput
            style={[
              styles.notesInput,
              {
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: colors.border,
                fontFamily: "Inter_400Regular",
              },
            ]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Any notes about this entry..."
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16 },
  dateSection: { marginBottom: 16 },
  label: { fontSize: 14, marginBottom: 8 },
  input: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 12 },
  emptyStateText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  groupCard: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    gap: 10,
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  groupTitle: { fontSize: 16 },
  groupUnit: { fontSize: 12, marginTop: 1 },
  infoBox: {
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    gap: 4,
  },
  infoBoxTitle: { fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 },
  infoBoxText: { fontSize: 13, lineHeight: 19 },
  tableContainer: {
    borderRadius: 10,
    overflow: "hidden",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    gap: 10,
  },
  tableLabel: {
    width: 100,
    fontSize: 13,
  },
  tableInput: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
    borderWidth: 1,
    textAlign: "center",
  },
  singleInput: {
    height: 44,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    borderWidth: 1,
  },
  notesInput: {
    minHeight: 70,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    borderWidth: 1,
  },
});
