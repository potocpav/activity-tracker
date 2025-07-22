import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from 'react-native-paper';

// Helper to get day numbers for a week (1-7)
const getWeekRows = (weeks = 50) => {
  // 6 weeks, 7 days each
  return Array.from({ length: weeks }, (_, weekIdx) =>
    Array.from({ length: 7 }, (_, dayIdx) => dayIdx + 1)
  );
};

type CalendarProps = {
  palette: string[];
  colorIndex: number;
};

const Calendar: React.FC<CalendarProps> = ({ palette, colorIndex }) => {
  const weekRows = getWeekRows();
  const theme = useTheme();
  const dayBackground = theme.colors.surfaceVariant;
  return (
    <View style={styles.calendarContainer}>
      {weekRows.map((week, weekIdx) => (
        <View style={styles.weekRow} key={weekIdx}>
          <View style={styles.monthLabelContainer}>
            <Text style={[styles.monthLabel, { color: theme.colors.onSurfaceVariant }]}>May</Text>
          </View>
          {week.map((day, dayIdx) => (
            <TouchableOpacity
              style={[styles.daySquare, { backgroundColor: dayBackground, borderColor: theme.colors.onSurfaceVariant }]}
              key={dayIdx}
              onPress={() => console.log('Day pressed:', day)}
              activeOpacity={0.3}
            >
              <Text style={[styles.dayNumber, { color: theme.colors.onSurfaceVariant }]}>{day}</Text>
              <Text style={[styles.value, { color: theme.colors.onSurfaceVariant }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>12.5</Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  calendarContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  weekRow: {
    flexDirection: 'row',
  },
  daySquare: {
    width: 44,
    height: 56,
    borderRadius: 8,
    marginHorizontal: 2,
    marginVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1,
  },
  dayNumber: {
    fontSize: 12,
    marginBottom: 2,
  },
  value: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  monthLabelContainer: {
    width: 36,
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginRight: 4,
  },
  monthLabel: {
    fontSize: 12,
    color: '#888',
  },
});

export default Calendar; 