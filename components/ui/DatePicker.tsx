import React, { useMemo } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { colors } from "../../lib/colors";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  minimumDate?: Date;
  maximumDate?: Date;
}

export default function DatePicker({
  value,
  onChange,
  minimumDate,
  maximumDate,
}: DatePickerProps) {
  const selectedMonth = value.getMonth();
  const selectedDay = value.getDate();
  const selectedYear = value.getFullYear();

  const minYear = minimumDate?.getFullYear() ?? 2020;
  const maxYear = maximumDate?.getFullYear() ?? new Date().getFullYear();

  const years = useMemo(() => {
    const arr: number[] = [];
    for (let y = maxYear; y >= minYear; y--) arr.push(y);
    return arr;
  }, [minYear, maxYear]);

  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const days = useMemo(() => {
    const arr: number[] = [];
    for (let d = 1; d <= daysInMonth; d++) arr.push(d);
    return arr;
  }, [daysInMonth]);

  const updateDate = (month: number, day: number, year: number) => {
    const maxDay = new Date(year, month + 1, 0).getDate();
    const clampedDay = Math.min(day, maxDay);
    const newDate = new Date(year, month, clampedDay);

    if (minimumDate && newDate < minimumDate) {
      onChange(minimumDate);
      return;
    }
    if (maximumDate && newDate > maximumDate) {
      onChange(maximumDate);
      return;
    }
    onChange(newDate);
  };

  return (
    <View style={styles.container}>
      {/* Month */}
      <Text style={styles.label}>Month</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.row}
        contentContainerStyle={styles.rowContent}
      >
        {MONTHS.map((m, i) => (
          <Pressable
            key={m}
            onPress={() => updateDate(i, selectedDay, selectedYear)}
            style={[styles.pill, i === selectedMonth && styles.pillSelected]}
          >
            <Text
              style={[
                styles.pillText,
                i === selectedMonth && styles.pillTextSelected,
              ]}
            >
              {m}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Year */}
      <Text style={styles.label}>Year</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.row}
        contentContainerStyle={styles.rowContent}
      >
        {years.map((y) => (
          <Pressable
            key={y}
            onPress={() => updateDate(selectedMonth, selectedDay, y)}
            style={[styles.pill, y === selectedYear && styles.pillSelected]}
          >
            <Text
              style={[
                styles.pillText,
                y === selectedYear && styles.pillTextSelected,
              ]}
            >
              {y}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Day */}
      <Text style={styles.label}>Day</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.row}
        contentContainerStyle={styles.rowContent}
      >
        {days.map((d) => (
          <Pressable
            key={d}
            onPress={() => updateDate(selectedMonth, d, selectedYear)}
            style={[
              styles.pill,
              styles.dayPill,
              d === selectedDay && styles.pillSelected,
            ]}
          >
            <Text
              style={[
                styles.pillText,
                d === selectedDay && styles.pillTextSelected,
              ]}
            >
              {d}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8, paddingVertical: 8 },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
    marginLeft: 4,
  },
  row: { flexGrow: 0 },
  rowContent: { gap: 6, paddingHorizontal: 2, paddingVertical: 2 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
  },
  dayPill: {
    paddingHorizontal: 10,
    minWidth: 40,
    alignItems: "center",
  },
  pillSelected: {
    backgroundColor: colors.violet,
  },
  pillText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
  },
  pillTextSelected: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
