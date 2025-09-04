import React from "react";
import {
  StyleSheet,
  Text,
  View,
} from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';
import { getTheme } from "./Theme";

const ITEM_HEIGHT = 60;

const EmptyPagePlaceholder = ({ title, subtext }: { title: string, subtext: string }) => {
  const theme = getTheme();
  const styles = getStyles(theme);

  return (
          <View style={styles.emptyStateContainer}>
            <AntDesign name="inbox" size={64} color={theme.colors.onSurfaceVariant} />
            <Text style={styles.emptyStateText}>{title}</Text>
            <Text style={styles.emptyStateSubtext}>{subtext}</Text>
          </View>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    paddingTop: 100,
  },
  emptyStateText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.onSurfaceVariant,
    marginTop: 10,
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    marginTop: 5,
    textAlign: 'center',
  },
});

export default EmptyPagePlaceholder; 