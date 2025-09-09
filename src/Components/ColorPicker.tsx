import React from 'react';
import { View } from 'react-native';
import { Dialog, Button } from 'react-native-paper';
import AntDesign from '@expo/vector-icons/AntDesign';

interface ColorPickerProps {
  visible: boolean;
  palette: string[];
  selectedColor: number;
  onSelect: (colorIx: number) => void;
  onDismiss: () => void;
  theme: any;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ visible, palette, selectedColor, onSelect, onDismiss, theme }) => (
  <Dialog visible={visible} onDismiss={onDismiss}>
    <Dialog.Title>Pick a color</Dialog.Title>
    <Dialog.Content>
      <View style={{ flexDirection: 'column', alignItems: 'center' }}>
        {[0, 1, 2, 3, 4].map(row => (
          <View key={row} style={{ flexDirection: 'row', marginBottom: 8 }}>
            {palette.slice(row * 4, row * 4 + 4).map((color, idx) => (
              <Button
                key={idx}
                mode="contained"
                compact={true}
                onPress={() => onSelect(row * 4 + idx)}
                style={{
                  backgroundColor: color,
                  marginHorizontal: 4,
                  width: 40,
                  height: 40,
                  borderRadius: 15,
                  borderWidth: selectedColor === row * 4 + idx ? 2 : 1,
                  borderColor: selectedColor === row * 4 + idx ? theme.colors.onSurface : theme.colors.onSurfaceVariant,
                  justifyContent: 'center',
                  alignItems: 'center',
                  elevation: 2,
                }}
                contentStyle={{ width: 40, height: 40 }}
              >
                {selectedColor === row * 4 + idx ? <AntDesign name="check" size={20} color={theme.colors.surface} /> : null}
              </Button>
            ))}
          </View>
        ))}
      </View>
    </Dialog.Content>
  </Dialog>
);

export default ColorPicker; 