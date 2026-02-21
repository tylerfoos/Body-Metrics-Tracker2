import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  useColorScheme,
  Platform,
  Dimensions,
  Alert,
  Modal,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Crypto from "expo-crypto";
import { useThemeColors } from "@/constants/colors";
import { useAppData } from "@/contexts/AppContext";
import {
  BODY_MEASUREMENTS,
  VITAL_SIGNS,
  DEFAULT_RATIOS,
} from "@/lib/measurements";
import {
  UserProfile,
  SelectedMeasurement,
  UnitSystem,
  Sex,
  MeasurementDefinition,
  RatioDefinition,
} from "@/lib/types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type Step = "profile" | "measurements" | "done";

export default function OnboardingScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = useThemeColors(isDark);
  const insets = useSafeAreaInsets();
  const {
    setProfile,
    setSelectedMeasurements,
    setSelectedRatios,
    setCustomMeasurements,
    setCustomRatios,
    customMeasurements: existingCustom,
    customRatios: existingCustomRatios,
  } = useAppData();

  const [step, setStep] = useState<Step>("profile");
  const [name, setName] = useState("");
  const [units, setUnits] = useState<UnitSystem>("imperial");
  const [sex, setSex] = useState<Sex>("male");
  const [age, setAge] = useState("");
  const [heightFt, setHeightFt] = useState("");
  const [heightIn, setHeightIn] = useState("");
  const [heightCm, setHeightCm] = useState("");

  const [localCustomMeasurements, setLocalCustomMeasurements] = useState<MeasurementDefinition[]>(existingCustom || []);
  const [localCustomRatios, setLocalCustomRatios] = useState<RatioDefinition[]>(existingCustomRatios || []);

  const allBodyMeasurements = [...BODY_MEASUREMENTS, ...localCustomMeasurements.filter((m) => m.category === "body")];
  const allVitalSigns = [...VITAL_SIGNS, ...localCustomMeasurements.filter((m) => m.category === "vital")];

  const [selectedBody, setSelectedBody] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    BODY_MEASUREMENTS.forEach((m) => (init[m.id] = true));
    return init;
  });
  const [selectedVitals, setSelectedVitals] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    VITAL_SIGNS.forEach((m) => (init[m.id] = false));
    init["weight"] = true;
    init["restingHeartRate"] = true;
    return init;
  });
  const [selectedVariations, setSelectedVariations] = useState<Record<string, string[]>>({});
  const [selectedSidesMap, setSelectedSidesMap] = useState<Record<string, { left: boolean; right: boolean }>>(() => {
    const init: Record<string, { left: boolean; right: boolean }> = {};
    [...BODY_MEASUREMENTS, ...VITAL_SIGNS].filter((m) => m.hasLeftRight).forEach((m) => {
      init[m.id] = { left: true, right: true };
    });
    return init;
  });
  const [selectedSubSites, setSelectedSubSites] = useState<Record<string, string[]>>({});
  const [customTempSites, setCustomTempSites] = useState<{ id: string; label: string }[]>([]);
  const [selectedRatioIds, setSelectedRatioIds] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    DEFAULT_RATIOS.forEach((r) => (init[r.id] = true));
    return init;
  });

  const [showAddCustomModal, setShowAddCustomModal] = useState(false);
  const [customCategory, setCustomCategory] = useState<"body" | "vital">("body");
  const [customLabel, setCustomLabel] = useState("");
  const [customUnit, setCustomUnit] = useState("");
  const [customHasLR, setCustomHasLR] = useState(false);
  const [customHowTo, setCustomHowTo] = useState("");

  const [showAddRatioModal, setShowAddRatioModal] = useState(false);
  const [ratioLabel, setRatioLabel] = useState("");
  const [ratioNumId, setRatioNumId] = useState("");
  const [ratioDenId, setRatioDenId] = useState("");
  const [ratioIsSymmetry, setRatioIsSymmetry] = useState(false);

  const [showAddTempSiteModal, setShowAddTempSiteModal] = useState(false);
  const [newTempSiteLabel, setNewTempSiteLabel] = useState("");

  const toggleMeasurement = (id: string, isBody: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isBody) {
      setSelectedBody((prev) => ({ ...prev, [id]: !prev[id] }));
    } else {
      setSelectedVitals((prev) => ({ ...prev, [id]: !prev[id] }));
    }
  };

  const toggleVariation = (measId: string, varId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const def = [...allBodyMeasurements, ...allVitalSigns].find((m) => m.id === measId);
    const allVarIds = def?.variations.map((v) => v.id) || [];
    setSelectedVariations((prev) => {
      const current = prev[measId] || allVarIds;
      if (current.includes(varId)) {
        return { ...prev, [measId]: current.filter((v) => v !== varId) };
      }
      return { ...prev, [measId]: [...current, varId] };
    });
  };

  const toggleSide = (measId: string, side: "left" | "right") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedSidesMap((prev) => ({
      ...prev,
      [measId]: { ...prev[measId], [side]: !prev[measId]?.[side] },
    }));
  };

  const toggleSubSite = (measId: string, siteId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedSubSites((prev) => {
      const current = prev[measId] || [];
      if (current.includes(siteId)) {
        return { ...prev, [measId]: current.filter((s) => s !== siteId) };
      }
      return { ...prev, [measId]: [...current, siteId] };
    });
  };

  const handleAddCustomMeasurement = () => {
    if (!customLabel.trim()) return;
    const id = `custom_${customLabel.trim().toLowerCase().replace(/\s+/g, "_")}_${Date.now()}`;
    const newMeas: MeasurementDefinition = {
      id,
      label: customLabel.trim(),
      category: customCategory,
      icon: customCategory === "body" ? "body-outline" : "pulse-outline",
      iconFamily: "Ionicons",
      howToMeasure: customHowTo.trim() || "No instructions provided.",
      unit: customUnit.trim() || (customCategory === "body" ? "in" : ""),
      hasLeftRight: customHasLR,
      variations: [],
      isCustom: true,
    };
    setLocalCustomMeasurements((prev) => [...prev, newMeas]);
    if (customCategory === "body") {
      setSelectedBody((prev) => ({ ...prev, [id]: true }));
    } else {
      setSelectedVitals((prev) => ({ ...prev, [id]: true }));
    }
    if (customHasLR) {
      setSelectedSidesMap((prev) => ({ ...prev, [id]: { left: true, right: true } }));
    }
    setCustomLabel("");
    setCustomUnit("");
    setCustomHasLR(false);
    setCustomHowTo("");
    setShowAddCustomModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleAddCustomRatio = () => {
    if (!ratioLabel.trim() || !ratioNumId || !ratioDenId) return;
    const allMeas = [...allBodyMeasurements, ...allVitalSigns];
    const numDef = allMeas.find((m) => m.id === ratioNumId);
    const denDef = allMeas.find((m) => m.id === ratioDenId);
    const id = `custom_ratio_${Date.now()}`;
    const newRatio: RatioDefinition = {
      id,
      label: ratioLabel.trim(),
      numeratorId: ratioNumId,
      denominatorId: ratioDenId,
      numeratorLabel: numDef?.label || ratioNumId,
      denominatorLabel: denDef?.label || ratioDenId,
      isSymmetry: ratioIsSymmetry,
      isCustom: true,
    };
    setLocalCustomRatios((prev) => [...prev, newRatio]);
    setSelectedRatioIds((prev) => ({ ...prev, [id]: true }));
    setRatioLabel("");
    setRatioNumId("");
    setRatioDenId("");
    setRatioIsSymmetry(false);
    setShowAddRatioModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleAddTempSite = () => {
    if (!newTempSiteLabel.trim()) return;
    const id = `custom_temp_${newTempSiteLabel.trim().toLowerCase().replace(/\s+/g, "_")}_${Date.now()}`;
    setCustomTempSites((prev) => [...prev, { id, label: newTempSiteLabel.trim() }]);
    setNewTempSiteLabel("");
    setShowAddTempSiteModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleProfileNext = () => {
    if (!name.trim()) {
      Alert.alert("Name Required", "Please enter your name.");
      return;
    }
    if (!age || parseInt(age) < 1) {
      Alert.alert("Age Required", "Please enter a valid age.");
      return;
    }
    let totalCm: number;
    if (units === "imperial") {
      const ft = parseInt(heightFt) || 0;
      const inches = parseInt(heightIn) || 0;
      totalCm = Math.round((ft * 12 + inches) * 2.54);
    } else {
      totalCm = parseInt(heightCm) || 0;
    }
    if (totalCm < 50 || totalCm > 300) {
      Alert.alert("Height Required", "Please enter a valid height.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStep("measurements");
  };

  const handleFinish = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    let totalCm: number;
    if (units === "imperial") {
      const ft = parseInt(heightFt) || 0;
      const inches = parseInt(heightIn) || 0;
      totalCm = Math.round((ft * 12 + inches) * 2.54);
    } else {
      totalCm = parseInt(heightCm) || 0;
    }

    const profile: UserProfile = {
      id: Crypto.randomUUID(),
      name: name.trim(),
      units,
      sex,
      age: parseInt(age),
      heightCm: totalCm,
      createdAt: new Date().toISOString(),
      onboardingComplete: true,
    };
    await setProfile(profile);
    await setCustomMeasurements(localCustomMeasurements);
    await setCustomRatios(localCustomRatios);

    const allMeas = [...allBodyMeasurements, ...allVitalSigns];
    const allSelectedMeasurements = allMeas.map((m) => {
      const isBody = m.category === "body";
      const enabled = isBody ? (selectedBody[m.id] || false) : (selectedVitals[m.id] || false);
      const sides = m.hasLeftRight
        ? ([] as ("left" | "right" | "none")[])
            .concat(selectedSidesMap[m.id]?.left ? ["left"] : [])
            .concat(selectedSidesMap[m.id]?.right ? ["right"] : [])
        : (["none"] as const);
      const defVarIds = m.variations.map((v) => v.id);
      const vars = selectedVariations[m.id] || defVarIds;

      let subSites: string[] | undefined;
      if (m.subSites) {
        const allSiteIds = [...m.subSites, ...customTempSites].map((s) => s.id);
        subSites = selectedSubSites[m.id]?.length ? selectedSubSites[m.id] : allSiteIds;
      }

      return {
        measurementId: m.id,
        enabled,
        selectedVariations: vars,
        selectedSides: sides.length > 0 ? sides : (["none"] as const),
        selectedSubSites: subSites,
      } as SelectedMeasurement;
    });

    await setSelectedMeasurements(allSelectedMeasurements);

    const activeRatios = Object.entries(selectedRatioIds)
      .filter(([, v]) => v)
      .map(([k]) => k);
    await setSelectedRatios(activeRatios);

    router.replace("/(tabs)");
  };

  const renderIcon = (iconName: string, iconFamily: string, color: string, size: number) => {
    switch (iconFamily) {
      case "MaterialCommunityIcons":
        return <MaterialCommunityIcons name={iconName as any} size={size} color={color} />;
      case "Feather":
        return <Feather name={iconName as any} size={size} color={color} />;
      default:
        return <Ionicons name={iconName as any} size={size} color={color} />;
    }
  };

  const renderMeasurementCard = (m: MeasurementDefinition, isBody: boolean) => {
    const enabled = isBody ? selectedBody[m.id] : selectedVitals[m.id];
    const sidesState = selectedSidesMap[m.id] || { left: true, right: true };
    const defVarIds = m.variations.map((v) => v.id);
    const activeVars = selectedVariations[m.id] || defVarIds;
    const tempDef = VITAL_SIGNS.find((v) => v.id === "temperature");
    const allTempSites = [...(tempDef?.subSites || []), ...customTempSites];

    return (
      <View
        key={m.id}
        style={[
          styles.measurementCard,
          {
            backgroundColor: colors.surface,
            borderColor: enabled ? colors.tint : colors.border,
            borderWidth: enabled ? 2 : 1,
          },
        ]}
      >
        <Pressable
          style={styles.measurementCardHeader}
          onPress={() => toggleMeasurement(m.id, isBody)}
        >
          <View style={styles.checkboxRow}>
            <View
              style={[
                styles.checkbox,
                {
                  backgroundColor: enabled ? colors.tint : "transparent",
                  borderColor: enabled ? colors.tint : colors.border,
                },
              ]}
            >
              {enabled && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            {!isBody &&
              renderIcon(m.icon, m.iconFamily, enabled ? colors.tint : colors.textTertiary, 16)}
            <Text
              style={[
                styles.measurementLabel,
                { color: colors.text, fontFamily: "Inter_600SemiBold" },
              ]}
              numberOfLines={1}
            >
              {m.label}
              {m.isCustom ? " *" : ""}
            </Text>
          </View>
          <Pressable
            onPress={() =>
              router.push({ pathname: "/measurement-info", params: { id: m.id } })
            }
            hitSlop={8}
          >
            <Ionicons name="information-circle-outline" size={22} color={colors.textTertiary} />
          </Pressable>
        </Pressable>

        {enabled && m.hasLeftRight && (
          <View style={styles.variationRow}>
            {(["left", "right"] as const).map((side) => (
              <Pressable
                key={side}
                onPress={() => toggleSide(m.id, side)}
                style={[
                  styles.variationTag,
                  {
                    backgroundColor: sidesState[side] ? colors.tint : colors.surfaceSecondary,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.variationTagText,
                    {
                      color: sidesState[side] ? "#fff" : colors.textSecondary,
                      fontFamily: "Inter_500Medium",
                    },
                  ]}
                >
                  {side === "left" ? "L" : "R"}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {enabled && m.variations.length > 0 && (
          <View style={styles.variationRow}>
            {m.variations.map((v) => {
              const active = activeVars.includes(v.id);
              return (
                <Pressable
                  key={v.id}
                  onPress={() => toggleVariation(m.id, v.id)}
                  style={[
                    styles.variationTag,
                    {
                      backgroundColor: active ? colors.tint : colors.surfaceSecondary,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.variationTagText,
                      {
                        color: active ? "#fff" : colors.textSecondary,
                        fontFamily: "Inter_500Medium",
                      },
                    ]}
                  >
                    {v.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {enabled && m.id === "temperature" && (
          <View style={{ gap: 8, marginTop: 4 }}>
            <Text style={[styles.subSiteGroupLabel, { color: colors.textSecondary, fontFamily: "Inter_600SemiBold" }]}>
              Core Sites
            </Text>
            <View style={styles.variationRow}>
              {allTempSites
                .filter((s) => s.group === "Core" || (!s.group && !customTempSites.find((c) => c.id === s.id)))
                .map((site) => {
                  const active = (selectedSubSites[m.id] || allTempSites.map((s) => s.id)).includes(site.id);
                  return (
                    <Pressable
                      key={site.id}
                      onPress={() => toggleSubSite(m.id, site.id)}
                      style={[
                        styles.variationTag,
                        {
                          backgroundColor: active ? colors.warning : colors.surfaceSecondary,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.variationTagText,
                          {
                            color: active ? "#fff" : colors.textSecondary,
                            fontFamily: "Inter_500Medium",
                          },
                        ]}
                      >
                        {site.label}
                      </Text>
                    </Pressable>
                  );
                })}
            </View>
            <Text style={[styles.subSiteGroupLabel, { color: colors.textSecondary, fontFamily: "Inter_600SemiBold" }]}>
              Peripheral (circulation)
            </Text>
            <View style={styles.variationRow}>
              {allTempSites
                .filter((s) => s.group === "Peripheral")
                .map((site) => {
                  const active = (selectedSubSites[m.id] || []).includes(site.id);
                  return (
                    <Pressable
                      key={site.id}
                      onPress={() => toggleSubSite(m.id, site.id)}
                      style={[
                        styles.variationTag,
                        {
                          backgroundColor: active ? colors.accent : colors.surfaceSecondary,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.variationTagText,
                          {
                            color: active ? "#fff" : colors.textSecondary,
                            fontFamily: "Inter_500Medium",
                          },
                        ]}
                      >
                        {site.label}
                      </Text>
                    </Pressable>
                  );
                })}
            </View>
            {customTempSites.length > 0 && (
              <>
                <Text style={[styles.subSiteGroupLabel, { color: colors.textSecondary, fontFamily: "Inter_600SemiBold" }]}>
                  Custom Sites
                </Text>
                <View style={styles.variationRow}>
                  {customTempSites.map((site) => {
                    const active = (selectedSubSites[m.id] || []).includes(site.id);
                    return (
                      <Pressable
                        key={site.id}
                        onPress={() => toggleSubSite(m.id, site.id)}
                        style={[
                          styles.variationTag,
                          {
                            backgroundColor: active ? colors.info : colors.surfaceSecondary,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.variationTagText,
                            {
                              color: active ? "#fff" : colors.textSecondary,
                              fontFamily: "Inter_500Medium",
                            },
                          ]}
                        >
                          {site.label}
                        </Text>
                        <Pressable
                          onPress={() => {
                            setCustomTempSites((prev) => prev.filter((s) => s.id !== site.id));
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }}
                          hitSlop={6}
                        >
                          <Ionicons name="close" size={12} color={active ? "#fff" : colors.textTertiary} />
                        </Pressable>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}
            <Pressable
              onPress={() => setShowAddTempSiteModal(true)}
              style={[styles.addCustomInline, { borderColor: colors.border }]}
            >
              <Ionicons name="add" size={16} color={colors.tint} />
              <Text style={[styles.addCustomInlineText, { color: colors.tint, fontFamily: "Inter_500Medium" }]}>
                Add Custom Site
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  };

  const renderProfileStep = () => (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.stepHeader}>
        <Ionicons name="person-outline" size={32} color={colors.tint} />
        <Text style={[styles.stepTitle, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
          Set Up Your Profile
        </Text>
        <Text style={[styles.stepSubtitle, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
          This information helps personalize your tracking
        </Text>
      </View>

      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>Name</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border, fontFamily: "Inter_400Regular" }]}
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          placeholderTextColor={colors.textTertiary}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>Units</Text>
        <View style={styles.segmentRow}>
          {(["imperial", "metric"] as const).map((u) => (
            <Pressable
              key={u}
              onPress={() => { setUnits(u); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              style={[styles.segmentBtn, { backgroundColor: units === u ? colors.tint : colors.surface, borderColor: units === u ? colors.tint : colors.border }]}
            >
              <Text style={[styles.segmentText, { color: units === u ? "#fff" : colors.text, fontFamily: "Inter_500Medium" }]}>
                {u === "imperial" ? "Imperial (lb, in)" : "Metric (kg, cm)"}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>Sex</Text>
        <View style={styles.segmentRow}>
          {(["male", "female", "other"] as const).map((s) => (
            <Pressable
              key={s}
              onPress={() => { setSex(s); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              style={[styles.segmentBtn, { flex: 1, backgroundColor: sex === s ? colors.tint : colors.surface, borderColor: sex === s ? colors.tint : colors.border }]}
            >
              <Text style={[styles.segmentText, { color: sex === s ? "#fff" : colors.text, fontFamily: "Inter_500Medium" }]}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>Age</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border, fontFamily: "Inter_400Regular", width: 120 }]}
          value={age}
          onChangeText={(t) => setAge(t.replace(/[^0-9]/g, ""))}
          placeholder="25"
          placeholderTextColor={colors.textTertiary}
          keyboardType="number-pad"
          maxLength={3}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>Height</Text>
        {units === "imperial" ? (
          <View style={styles.heightRow}>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border, fontFamily: "Inter_400Regular", flex: 1 }]}
              value={heightFt}
              onChangeText={(t) => setHeightFt(t.replace(/[^0-9]/g, ""))}
              placeholder="5"
              placeholderTextColor={colors.textTertiary}
              keyboardType="number-pad"
              maxLength={1}
            />
            <Text style={[styles.heightLabel, { color: colors.textSecondary, fontFamily: "Inter_500Medium" }]}>ft</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border, fontFamily: "Inter_400Regular", flex: 1 }]}
              value={heightIn}
              onChangeText={(t) => setHeightIn(t.replace(/[^0-9]/g, ""))}
              placeholder="10"
              placeholderTextColor={colors.textTertiary}
              keyboardType="number-pad"
              maxLength={2}
            />
            <Text style={[styles.heightLabel, { color: colors.textSecondary, fontFamily: "Inter_500Medium" }]}>in</Text>
          </View>
        ) : (
          <View style={styles.heightRow}>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border, fontFamily: "Inter_400Regular", width: 120 }]}
              value={heightCm}
              onChangeText={(t) => setHeightCm(t.replace(/[^0-9]/g, ""))}
              placeholder="178"
              placeholderTextColor={colors.textTertiary}
              keyboardType="number-pad"
              maxLength={3}
            />
            <Text style={[styles.heightLabel, { color: colors.textSecondary, fontFamily: "Inter_500Medium" }]}>cm</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );

  const allMeasForPicker = [...allBodyMeasurements, ...allVitalSigns];

  const renderMeasurementsStep = () => (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.stepHeader}>
        <Ionicons name="fitness-outline" size={32} color={colors.tint} />
        <Text style={[styles.stepTitle, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
          What to Track
        </Text>
        <Text style={[styles.stepSubtitle, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
          Choose measurements, vitals, and ratios. You can change these later.
        </Text>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
        Body Measurements
      </Text>
      <View style={styles.measurementGrid}>
        {allBodyMeasurements.map((m) => renderMeasurementCard(m, true))}
      </View>
      <Pressable
        onPress={() => { setCustomCategory("body"); setShowAddCustomModal(true); }}
        style={[styles.addCustomBtn, { borderColor: colors.tint }]}
      >
        <Ionicons name="add-circle-outline" size={20} color={colors.tint} />
        <Text style={[styles.addCustomBtnText, { color: colors.tint, fontFamily: "Inter_600SemiBold" }]}>
          Add Custom Body Measurement
        </Text>
      </Pressable>

      <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: "Inter_700Bold", marginTop: 24 }]}>
        Vital Signs
      </Text>
      <View style={styles.measurementGrid}>
        {allVitalSigns.map((m) => renderMeasurementCard(m, false))}
      </View>
      <Pressable
        onPress={() => { setCustomCategory("vital"); setShowAddCustomModal(true); }}
        style={[styles.addCustomBtn, { borderColor: colors.tint }]}
      >
        <Ionicons name="add-circle-outline" size={20} color={colors.tint} />
        <Text style={[styles.addCustomBtnText, { color: colors.tint, fontFamily: "Inter_600SemiBold" }]}>
          Add Custom Vital Sign
        </Text>
      </Pressable>

      <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: "Inter_700Bold", marginTop: 24 }]}>
        Ratios & Symmetry
      </Text>
      <View style={styles.measurementGrid}>
        {[...DEFAULT_RATIOS, ...localCustomRatios].map((r) => {
          const active = selectedRatioIds[r.id];
          return (
            <Pressable
              key={r.id}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedRatioIds((prev) => ({ ...prev, [r.id]: !prev[r.id] }));
              }}
              style={[styles.ratioCard, { backgroundColor: colors.surface, borderColor: active ? colors.info : colors.border, borderWidth: active ? 2 : 1 }]}
            >
              <Text style={[styles.ratioLabel, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>
                {r.label}{r.isCustom ? " *" : ""}
              </Text>
              <Text style={[styles.ratioFormula, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
                {r.numeratorLabel} {r.isSymmetry ? " vs " : " / "} {r.denominatorLabel}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Pressable
        onPress={() => setShowAddRatioModal(true)}
        style={[styles.addCustomBtn, { borderColor: colors.info }]}
      >
        <Ionicons name="add-circle-outline" size={20} color={colors.info} />
        <Text style={[styles.addCustomBtnText, { color: colors.info, fontFamily: "Inter_600SemiBold" }]}>
          Create Custom Ratio
        </Text>
      </Pressable>
    </ScrollView>
  );

  const isProfileValid = name.trim().length > 0 && age.length > 0;

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background, paddingTop: Platform.OS === "web" ? 67 + insets.top : insets.top }]}
    >
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { backgroundColor: colors.tint, width: step === "profile" ? "50%" : "100%" }]} />
      </View>

      {step === "profile" && renderProfileStep()}
      {step === "measurements" && renderMeasurementsStep()}

      <View
        style={[styles.bottomBar, { backgroundColor: colors.background, paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 16, borderTopColor: colors.border }]}
      >
        {step === "measurements" && (
          <Pressable onPress={() => setStep("profile")} style={[styles.backBtn, { borderColor: colors.border }]}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </Pressable>
        )}
        <Pressable
          onPress={step === "profile" ? handleProfileNext : handleFinish}
          disabled={step === "profile" && !isProfileValid}
          style={[styles.nextBtn, { backgroundColor: step === "profile" && !isProfileValid ? colors.surfaceSecondary : colors.tint, flex: 1 }]}
        >
          <Text style={[styles.nextBtnText, { color: step === "profile" && !isProfileValid ? colors.textTertiary : "#fff", fontFamily: "Inter_600SemiBold" }]}>
            {step === "profile" ? "Next" : "Start Tracking"}
          </Text>
          {step === "profile" && (
            <Ionicons name="arrow-forward" size={18} color={!isProfileValid ? colors.textTertiary : "#fff"} />
          )}
        </Pressable>
      </View>

      <Modal visible={showAddCustomModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
                Add Custom {customCategory === "body" ? "Body Measurement" : "Vital Sign"}
              </Text>
              <Pressable onPress={() => setShowAddCustomModal(false)} hitSlop={8}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingBottom: 20 }}>
              <View>
                <Text style={[styles.modalLabel, { color: colors.textSecondary, fontFamily: "Inter_500Medium" }]}>Name</Text>
                <TextInput
                  style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border, fontFamily: "Inter_400Regular" }]}
                  value={customLabel}
                  onChangeText={setCustomLabel}
                  placeholder="e.g., Upper Arm"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
              <View>
                <Text style={[styles.modalLabel, { color: colors.textSecondary, fontFamily: "Inter_500Medium" }]}>Unit</Text>
                <TextInput
                  style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border, fontFamily: "Inter_400Regular" }]}
                  value={customUnit}
                  onChangeText={setCustomUnit}
                  placeholder="e.g., in, cm, bpm"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
              <Pressable
                onPress={() => { setCustomHasLR(!customHasLR); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                style={styles.modalCheckRow}
              >
                <View style={[styles.checkbox, { backgroundColor: customHasLR ? colors.tint : "transparent", borderColor: customHasLR ? colors.tint : colors.border }]}>
                  {customHasLR && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
                <Text style={[{ color: colors.text, fontFamily: "Inter_500Medium", fontSize: 14 }]}>
                  Has Left / Right sides
                </Text>
              </Pressable>
              <View>
                <Text style={[styles.modalLabel, { color: colors.textSecondary, fontFamily: "Inter_500Medium" }]}>
                  How to measure (instructions)
                </Text>
                <TextInput
                  style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border, fontFamily: "Inter_400Regular", minHeight: 80, textAlignVertical: "top" }]}
                  value={customHowTo}
                  onChangeText={setCustomHowTo}
                  placeholder="Describe how to take this measurement..."
                  placeholderTextColor={colors.textTertiary}
                  multiline
                />
              </View>
              <Pressable
                onPress={handleAddCustomMeasurement}
                disabled={!customLabel.trim()}
                style={[styles.modalSaveBtn, { backgroundColor: customLabel.trim() ? colors.tint : colors.surfaceSecondary }]}
              >
                <Text style={[styles.modalSaveBtnText, { color: customLabel.trim() ? "#fff" : colors.textTertiary, fontFamily: "Inter_600SemiBold" }]}>
                  Add Measurement
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showAddRatioModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
                Create Custom Ratio
              </Text>
              <Pressable onPress={() => setShowAddRatioModal(false)} hitSlop={8}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingBottom: 20 }}>
              <View>
                <Text style={[styles.modalLabel, { color: colors.textSecondary, fontFamily: "Inter_500Medium" }]}>Ratio Name</Text>
                <TextInput
                  style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border, fontFamily: "Inter_400Regular" }]}
                  value={ratioLabel}
                  onChangeText={setRatioLabel}
                  placeholder="e.g., Arm to Waist"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
              <View>
                <Text style={[styles.modalLabel, { color: colors.textSecondary, fontFamily: "Inter_500Medium" }]}>Numerator (top)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                  {allMeasForPicker.map((m) => (
                    <Pressable
                      key={m.id}
                      onPress={() => setRatioNumId(m.id)}
                      style={[styles.pickerChip, { backgroundColor: ratioNumId === m.id ? colors.tint : colors.surfaceSecondary }]}
                    >
                      <Text style={[styles.pickerChipText, { color: ratioNumId === m.id ? "#fff" : colors.text, fontFamily: "Inter_500Medium" }]}>
                        {m.label}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
              <View>
                <Text style={[styles.modalLabel, { color: colors.textSecondary, fontFamily: "Inter_500Medium" }]}>Denominator (bottom)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                  {allMeasForPicker.map((m) => (
                    <Pressable
                      key={m.id}
                      onPress={() => setRatioDenId(m.id)}
                      style={[styles.pickerChip, { backgroundColor: ratioDenId === m.id ? colors.tint : colors.surfaceSecondary }]}
                    >
                      <Text style={[styles.pickerChipText, { color: ratioDenId === m.id ? "#fff" : colors.text, fontFamily: "Inter_500Medium" }]}>
                        {m.label}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
              <Pressable
                onPress={() => { setRatioIsSymmetry(!ratioIsSymmetry); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                style={styles.modalCheckRow}
              >
                <View style={[styles.checkbox, { backgroundColor: ratioIsSymmetry ? colors.tint : "transparent", borderColor: ratioIsSymmetry ? colors.tint : colors.border }]}>
                  {ratioIsSymmetry && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
                <Text style={[{ color: colors.text, fontFamily: "Inter_500Medium", fontSize: 14 }]}>
                  Symmetry comparison (L vs R)
                </Text>
              </Pressable>
              <Pressable
                onPress={handleAddCustomRatio}
                disabled={!ratioLabel.trim() || !ratioNumId || !ratioDenId}
                style={[styles.modalSaveBtn, { backgroundColor: ratioLabel.trim() && ratioNumId && ratioDenId ? colors.info : colors.surfaceSecondary }]}
              >
                <Text style={[styles.modalSaveBtnText, { color: ratioLabel.trim() && ratioNumId && ratioDenId ? "#fff" : colors.textTertiary, fontFamily: "Inter_600SemiBold" }]}>
                  Create Ratio
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showAddTempSiteModal} animationType="fade" transparent>
        <Pressable style={styles.modalOverlay} onPress={() => setShowAddTempSiteModal(false)}>
          <Pressable style={[styles.smallModalContent, { backgroundColor: colors.surface }]} onPress={() => {}}>
            <Text style={[styles.modalTitle, { color: colors.text, fontFamily: "Inter_700Bold", marginBottom: 12 }]}>
              Add Custom Temperature Site
            </Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border, fontFamily: "Inter_400Regular" }]}
              value={newTempSiteLabel}
              onChangeText={setNewTempSiteLabel}
              placeholder="e.g., Scrotal, Behind Knee"
              placeholderTextColor={colors.textTertiary}
              autoFocus
            />
            <Pressable
              onPress={handleAddTempSite}
              disabled={!newTempSiteLabel.trim()}
              style={[styles.modalSaveBtn, { backgroundColor: newTempSiteLabel.trim() ? colors.tint : colors.surfaceSecondary, marginTop: 12 }]}
            >
              <Text style={[styles.modalSaveBtnText, { color: newTempSiteLabel.trim() ? "#fff" : colors.textTertiary, fontFamily: "Inter_600SemiBold" }]}>
                Add Site
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  progressBar: { height: 3, backgroundColor: "rgba(0,0,0,0.06)", marginHorizontal: 20, borderRadius: 2, overflow: "hidden", marginBottom: 8 },
  progressFill: { height: "100%", borderRadius: 2 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 12 },
  stepHeader: { alignItems: "center", marginBottom: 28, gap: 8 },
  stepTitle: { fontSize: 26, textAlign: "center", marginTop: 8 },
  stepSubtitle: { fontSize: 15, textAlign: "center", lineHeight: 21 },
  formGroup: { marginBottom: 20 },
  label: { fontSize: 14, marginBottom: 8 },
  input: { height: 48, borderRadius: 12, paddingHorizontal: 16, fontSize: 16, borderWidth: 1 },
  segmentRow: { flexDirection: "row", gap: 10 },
  segmentBtn: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, alignItems: "center" },
  segmentText: { fontSize: 14 },
  heightRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  heightLabel: { fontSize: 16 },
  sectionTitle: { fontSize: 20, marginBottom: 14 },
  measurementGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  measurementCard: { width: (SCREEN_WIDTH - 50) / 2, borderRadius: 14, padding: 14, gap: 10 },
  measurementCardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  checkboxRow: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  measurementLabel: { fontSize: 14, flex: 1 },
  variationRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  variationTag: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 8, flexDirection: "row", alignItems: "center", gap: 4 },
  variationTagText: { fontSize: 12 },
  subSiteGroupLabel: { fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 },
  addCustomInline: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderStyle: "dashed", alignSelf: "flex-start" },
  addCustomInlineText: { fontSize: 11 },
  ratioCard: { width: (SCREEN_WIDTH - 50) / 2, borderRadius: 14, padding: 14, gap: 4 },
  ratioLabel: { fontSize: 14 },
  ratioFormula: { fontSize: 12 },
  addCustomBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderStyle: "dashed", marginTop: 12 },
  addCustomBtnText: { fontSize: 14 },
  bottomBar: { flexDirection: "row", gap: 12, paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1 },
  backBtn: { width: 48, height: 48, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  nextBtn: { height: 48, borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  nextBtnText: { fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: "80%" },
  smallModalContent: { borderRadius: 16, padding: 20, margin: 20, marginBottom: 40 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle: { fontSize: 18 },
  modalLabel: { fontSize: 13, marginBottom: 6 },
  modalInput: { height: 44, borderRadius: 10, paddingHorizontal: 14, fontSize: 15, borderWidth: 1 },
  modalCheckRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 4 },
  modalSaveBtn: { height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  modalSaveBtnText: { fontSize: 16 },
  pickerChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  pickerChipText: { fontSize: 13 },
});
