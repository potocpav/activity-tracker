import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { CheckIcon } from "./Element";

const COLUMNS = 4;
const SWATCH_SIZE = 40;

interface ColorPickerProps {
  visible: boolean;
  palette: string[];
  selectedColor: number;
  onSelect: (colorIx: number) => void;
  onDismiss: () => void;
  theme: any;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ visible, palette, selectedColor, onSelect, onDismiss, theme }) => {
  const rows: number[][] = [];
  for (let start = 0; start < palette.length; start += COLUMNS) {
    rows.push(palette.map((_, ix) => ix).slice(start, start + COLUMNS));
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      backdropColor={"rgba(0, 0, 0, 0.0)"}
      onRequestClose={onDismiss}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />
      <View style={styles.centered} pointerEvents="box-none">
        <View style={[styles.card, { backgroundColor: theme.elevation3 }]}>
          <Text style={[styles.title, { color: theme.onSurface }]}>Pick a color</Text>
          <View style={styles.grid}>
            {rows.map((row, rowIx) => (
              <View key={rowIx} style={styles.row}>
                {row.map((colorIx) => {
                  const selected = selectedColor === colorIx;
                  return (
                    <Pressable
                      key={colorIx}
                      onPress={() => onSelect(colorIx)}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      android_ripple={{ foreground: true, color: theme.elevation3 }}
                      style={({ pressed }) => [
                        styles.swatch,
                        {
                          backgroundColor: palette[colorIx],
                          borderWidth: selected ? 2 : 1,
                          borderColor: selected ? theme.onSurface : theme.onSurfaceVariant,
                          opacity: pressed ? 0.7 : 1,
                        },
                      ]}
                    >
                      {selected ? <CheckIcon color={theme.surface} /> : null}
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    borderRadius: 28,
    paddingVertical: 24,
    paddingHorizontal: 24,
    maxWidth: 400,
    elevation: 24,
    shadowColor: "#000000",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  title: {
    fontSize: 24,
    lineHeight: 32,
    marginBottom: 20,
  },
  grid: {
    flexDirection: "column",
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    marginBottom: 8,
  },
  swatch: {
    width: SWATCH_SIZE,
    height: SWATCH_SIZE,
    marginHorizontal: 4,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    elevation: 2,
  },
});

export default ColorPicker;
