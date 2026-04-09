import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { colors, gradientColors } from "../lib/colors";
import type { Item } from "../lib/types";
import { categoryEmojis } from "../lib/utils";
import Button from "./ui/Button";

// ── Types ──────────────────────────────────────────────────────────────

interface AddItemModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (item: Omit<Item, "id" | "status" | "matchedTo">) => void;
}

const KIDS_CATEGORIES = [
  { label: "Clothing", emoji: "👕" },
  { label: "Gear", emoji: "🎪" },
  { label: "Stroller", emoji: "🚼" },
  { label: "Car Seat", emoji: "🚗" },
  { label: "Books", emoji: "📚" },
  { label: "Toys", emoji: "🧸" },
];

const GENERAL_CATEGORIES = [
  { label: "Household", emoji: "🏠" },
  { label: "Outdoor", emoji: "⛺" },
  { label: "Furniture", emoji: "🛋️" },
  { label: "Electronics", emoji: "📱" },
  { label: "Other", emoji: "📦" },
];

const ALL_CATEGORIES = [...KIDS_CATEGORIES, ...GENERAL_CATEGORIES];

const GENERAL_LABELS = new Set(GENERAL_CATEGORIES.map((c) => c.label));

const AGE_RANGES = [
  "0-3mo",
  "3-6mo",
  "6-12mo",
  "12-18mo",
  "18-24mo",
  "2-3y",
  "3-5y",
  "5+y",
];

// ── Component ──────────────────────────────────────────────────────────

export default function AddItemModal({
  visible,
  onClose,
  onAdd,
}: AddItemModalProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [ageRange, setAgeRange] = useState<string | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      setName("");
      setCategory(null);
      setAgeRange(null);
      setPhotoUri(null);
    }
  }, [visible]);

  const isGeneralCategory = category !== null && GENERAL_LABELS.has(category);
  const isValid =
    name.trim().length > 0 &&
    category !== null &&
    (isGeneralCategory || ageRange !== null);

  const selectedEmoji =
    category ? (ALL_CATEGORIES.find((c) => c.label === category)?.emoji ?? "📦") : "📦";

  // Clear age range when switching to a general category
  const handleCategorySelect = (label: string) => {
    setCategory(label);
    if (GENERAL_LABELS.has(label)) {
      setAgeRange(null);
    }
  };

  const handlePickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleAdd = () => {
    if (!isValid || !category) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onAdd({
      name: name.trim(),
      category,
      ageRange: ageRange ?? "",
      emoji: selectedEmoji,
      isBundle: category === "Clothing",
      ...(photoUri ? { hasPhoto: true, photoUri } : {}),
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        {/* Tap backdrop to close */}
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.sheet}>
          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Drag handle */}
            <View style={styles.handleRow}>
              <View style={styles.handle} />
            </View>

            {/* Title */}
            <Text style={styles.title}>Add item</Text>
            <Text style={styles.subtitle}>
              We'll track when it's time to pass it on.
            </Text>

            {/* Photo button */}
            <Pressable onPress={handlePickPhoto} style={styles.photoButton}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.photoImage} />
              ) : (
                <>
                  <Text style={styles.photoEmoji}>📷</Text>
                  <Text style={styles.photoLabel}>optional</Text>
                </>
              )}
            </Pressable>

            {/* Name input */}
            <Text style={styles.fieldLabel}>What is it?</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Bugaboo stroller"
              placeholderTextColor={colors.textLight}
              value={name}
              onChangeText={setName}
              autoCapitalize="sentences"
            />

            {/* Category chips */}
            <Text style={styles.fieldLabel}>Category</Text>
            <View style={styles.chipGrid}>
              {ALL_CATEGORIES.map((cat) => {
                const active = category === cat.label;
                if (active) {
                  return (
                    <Pressable
                      key={cat.label}
                      onPress={() => handleCategorySelect(cat.label)}
                    >
                      <LinearGradient
                        colors={gradientColors.button}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.chip}
                      >
                        <Text style={styles.chipTextActive}>
                          {cat.emoji} {cat.label}
                        </Text>
                      </LinearGradient>
                    </Pressable>
                  );
                }
                return (
                  <Pressable
                    key={cat.label}
                    onPress={() => handleCategorySelect(cat.label)}
                    style={[styles.chip, styles.chipInactive]}
                  >
                    <Text style={styles.chipTextInactive}>
                      {cat.emoji} {cat.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Age range chips — only for kids categories */}
            {!isGeneralCategory && (
              <>
                <Text style={styles.fieldLabel}>Age range</Text>
                <View style={styles.chipGrid}>
                  {AGE_RANGES.map((age) => {
                    const active = ageRange === age;
                    if (active) {
                      return (
                        <Pressable key={age} onPress={() => setAgeRange(age)}>
                          <LinearGradient
                            colors={gradientColors.button}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.chip}
                          >
                            <Text style={styles.chipTextActive}>{age}</Text>
                          </LinearGradient>
                        </Pressable>
                      );
                    }
                    return (
                      <Pressable
                        key={age}
                        onPress={() => setAgeRange(age)}
                        style={[styles.chip, styles.chipInactive]}
                      >
                        <Text style={styles.chipTextInactive}>{age}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}

            {/* Spacer before buttons */}
            <View style={{ height: 20 }} />

            {/* Add button */}
            <Button
              variant="primary"
              size="lg"
              title={
                isValid
                  ? `Add ${selectedEmoji} ${name.trim()}`
                  : "Add item"
              }
              onPress={handleAdd}
              disabled={!isValid}
              style={styles.addButton}
            />

            {/* Cancel */}
            <Button
              variant="ghost"
              size="md"
              title="Cancel"
              onPress={onClose}
              style={styles.cancelButton}
            />

            {/* Bottom safe area spacer */}
            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: { flex: 1 },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    paddingHorizontal: 20,
  },

  // Handle
  handleRow: { alignItems: "center", paddingTop: 12, paddingBottom: 8 },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1D1D6",
  },

  // Title
  title: { fontSize: 22, fontWeight: "700", color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.textMuted, marginBottom: 20 },

  // Photo
  photoButton: {
    width: 72,
    height: 72,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#D1D1D6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    overflow: "hidden",
  },
  photoEmoji: { fontSize: 24 },
  photoLabel: { fontSize: 11, color: colors.textLight, marginTop: 2 },
  photoImage: { width: 72, height: 72, borderRadius: 12 },

  // Input
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#F5F5F3",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text,
    marginBottom: 20,
  },

  // Chips
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  chipInactive: { backgroundColor: "#F0F0ED" },
  chipTextActive: { fontSize: 14, fontWeight: "600", color: "#FFFFFF" },
  chipTextInactive: { fontSize: 14, fontWeight: "600", color: colors.textMuted },

  // Buttons
  addButton: { width: "100%" },
  cancelButton: { alignSelf: "center", marginTop: 8 },
});
