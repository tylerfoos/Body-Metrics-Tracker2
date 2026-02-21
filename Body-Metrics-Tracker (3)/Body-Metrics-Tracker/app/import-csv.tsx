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
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { useThemeColors } from "@/constants/colors";
import { useAppData } from "@/contexts/AppContext";
import { parseHealthExportCsv } from "@/lib/csv-parser";

export default function ImportCsvScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = useThemeColors(isDark);
  const insets = useSafeAreaInsets();
  const { importEntries } = useAppData();

  const [fileName, setFileName] = useState<string | null>(null);
  const [previewCount, setPreviewCount] = useState(0);
  const [parsedEntries, setParsedEntries] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(false);

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["text/csv", "text/comma-separated-values", "application/csv", "*/*"],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      setFileName(asset.name);

      let csvText: string;
      if (Platform.OS === "web") {
        const response = await fetch(asset.uri);
        csvText = await response.text();
      } else {
        csvText = await FileSystem.readAsStringAsync(asset.uri);
      }

      const entries = parseHealthExportCsv(csvText);
      setParsedEntries(entries);
      setPreviewCount(entries.length);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (err) {
      console.error("File pick error:", err);
      Alert.alert("Error", "Could not read the file. Please try a different format.");
    }
  };

  const handleImport = async () => {
    if (parsedEntries.length === 0) return;
    setImporting(true);
    try {
      const added = await importEntries(parsedEntries);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDone(true);
    } catch (err) {
      console.error("Import error:", err);
      Alert.alert("Error", "Failed to import data.");
    } finally {
      setImporting(false);
    }
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
        <Text style={[styles.headerTitle, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
          Import CSV
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
      >
        {done ? (
          <View style={styles.doneState}>
            <View style={[styles.doneCircle, { backgroundColor: colors.tintLight }]}>
              <Ionicons name="checkmark-circle" size={56} color={colors.tint} />
            </View>
            <Text style={[styles.doneTitle, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
              Import Complete
            </Text>
            <Text style={[styles.doneText, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
              {previewCount} day(s) of data have been imported successfully.
            </Text>
            <Pressable
              onPress={() => router.back()}
              style={[styles.doneBtn, { backgroundColor: colors.tint }]}
            >
              <Text style={[styles.doneBtnText, { fontFamily: "Inter_600SemiBold" }]}>
                Back to Dashboard
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.infoSection}>
              <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
                <Ionicons name="information-circle" size={20} color={colors.info} />
                <Text style={[styles.infoText, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
                  Import CSV files exported from Apple Health, fitness trackers, or custom spreadsheets. The app will automatically detect and map compatible columns.
                </Text>
              </View>
            </View>

            <Pressable
              onPress={pickFile}
              style={[
                styles.uploadArea,
                {
                  backgroundColor: colors.surface,
                  borderColor: fileName ? colors.tint : colors.border,
                },
              ]}
            >
              <Ionicons
                name={fileName ? "document-text" : "cloud-upload-outline"}
                size={40}
                color={fileName ? colors.tint : colors.textTertiary}
              />
              {fileName ? (
                <>
                  <Text style={[styles.fileName, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>
                    {fileName}
                  </Text>
                  <Text style={[styles.fileInfo, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
                    {previewCount} entries found
                  </Text>
                </>
              ) : (
                <>
                  <Text style={[styles.uploadText, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>
                    Select CSV File
                  </Text>
                  <Text style={[styles.uploadSubtext, { color: colors.textTertiary, fontFamily: "Inter_400Regular" }]}>
                    Tap to browse files
                  </Text>
                </>
              )}
            </Pressable>

            {parsedEntries.length > 0 && (
              <>
                <Text style={[styles.previewTitle, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>
                  Preview
                </Text>
                {parsedEntries.slice(0, 3).map((entry, i) => (
                  <View
                    key={i}
                    style={[styles.previewCard, { backgroundColor: colors.surface }]}
                  >
                    <Text style={[styles.previewDate, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>
                      {entry.date}
                    </Text>
                    <Text style={[styles.previewValues, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
                      {Object.entries(entry.values)
                        .slice(0, 4)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(", ")}
                      {Object.keys(entry.values).length > 4
                        ? ` +${Object.keys(entry.values).length - 4} more`
                        : ""}
                    </Text>
                  </View>
                ))}
                {parsedEntries.length > 3 && (
                  <Text style={[styles.moreText, { color: colors.textTertiary, fontFamily: "Inter_400Regular" }]}>
                    ...and {parsedEntries.length - 3} more entries
                  </Text>
                )}

                <Pressable
                  onPress={handleImport}
                  disabled={importing}
                  style={[
                    styles.importBtn,
                    {
                      backgroundColor: importing ? colors.surfaceSecondary : colors.tint,
                    },
                  ]}
                >
                  <Ionicons name="download-outline" size={20} color="#fff" />
                  <Text style={[styles.importBtnText, { fontFamily: "Inter_600SemiBold" }]}>
                    {importing ? "Importing..." : `Import ${previewCount} Entries`}
                  </Text>
                </Pressable>
              </>
            )}
          </>
        )}
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
  scrollContent: { paddingHorizontal: 20, paddingTop: 20 },
  infoSection: { marginBottom: 20 },
  infoCard: {
    flexDirection: "row",
    padding: 14,
    borderRadius: 12,
    gap: 10,
    alignItems: "flex-start",
  },
  infoText: { fontSize: 13, lineHeight: 19, flex: 1 },
  uploadArea: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  uploadText: { fontSize: 16 },
  uploadSubtext: { fontSize: 13 },
  fileName: { fontSize: 15, marginTop: 4 },
  fileInfo: { fontSize: 13 },
  previewTitle: { fontSize: 16, marginBottom: 10 },
  previewCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  previewDate: { fontSize: 14, marginBottom: 4 },
  previewValues: { fontSize: 12, lineHeight: 18 },
  moreText: { fontSize: 12, textAlign: "center", marginTop: 4, marginBottom: 16 },
  importBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 52,
    borderRadius: 14,
    marginTop: 8,
  },
  importBtnText: { fontSize: 16, color: "#fff" },
  doneState: { alignItems: "center", paddingTop: 60, gap: 12 },
  doneCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  doneTitle: { fontSize: 22 },
  doneText: { fontSize: 15, textAlign: "center", lineHeight: 22 },
  doneBtn: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 32,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  doneBtnText: { fontSize: 16, color: "#fff" },
});
