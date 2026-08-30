import React from "react";
import { StyleSheet, Text, View } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useAppTheme } from "../Model/Theme";

const ITEM_HEIGHT = 60;

const EmptyPagePlaceholder = ({ title, subtext }: { title: string; subtext: string }) => {
  const theme = useAppTheme();
  const styles = getStyles(theme);

  return (
    <View style={styles.emptyStateContainer}>
      <MaterialCommunityIcons name="inbox" size={64} color={theme.onSurfaceVariant} />
      <Text style={styles.emptyStateText}>{title}</Text>
      <Text style={styles.emptyStateSubtext}>{subtext}</Text>
    </View>
  );
};

const getStyles = (theme: any) =>
  StyleSheet.create({
    emptyStateContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
      paddingBottom: 100,
    },
    emptyStateText: {
      fontSize: 24,
      fontWeight: "bold",
      color: theme.onSurfaceVariant,
      marginTop: 10,
    },
    emptyStateSubtext: {
      fontSize: 16,
      color: theme.onSurfaceVariant,
      marginTop: 5,
      textAlign: "center",
    },
  });

export default EmptyPagePlaceholder;
