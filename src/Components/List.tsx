import React from "react";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MD3Theme } from "react-native-paper/lib/typescript/types";
import { useAppTheme } from "../Model/Theme";

// Settings-style list rows: a leading icon, a title with an optional description, and
// optional trailing content. Rows are a single flat row of padding rather than Paper's
// nested container/row/item boxes, so the vertical rhythm is set in one place.

export type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

export const ListIcon = ({ name, color }: { name: IconName; color?: string }) => {
  const theme = useAppTheme();
  return <MaterialCommunityIcons name={name} size={24} color={color ?? theme.colors.onSurfaceVariant} />;
};

export const ListSection = ({ title, children }: { title?: string; children: React.ReactNode }) => {
  const theme = useAppTheme();
  const styles = getStyles(theme);
  return (
    <View style={styles.section}>
      {title !== undefined && <Text style={styles.subheader}>{title}</Text>}
      {children}
    </View>
  );
};

type ListItemProps = {
  title: string;
  description?: string | null;
  icon?: IconName;
  titleColor?: string;
  right?: React.ReactNode;
  onPress?: () => void;
};

export const ListItem = ({ title, description, icon, titleColor, right, onPress }: ListItemProps) => {
  const theme = useAppTheme();
  const styles = getStyles(theme);
  return (
    <Pressable
      onPress={onPress}
      disabled={onPress === undefined}
      accessibilityRole="button"
      android_ripple={{ foreground: true }}
      style={styles.row}
    >
      {icon !== undefined && <ListIcon name={icon} />}
      <View style={styles.content}>
        <Text style={[styles.title, titleColor !== undefined && { color: titleColor }]}>{title}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
      {right}
    </Pressable>
  );
};

export const ListAccordion = ({
  title,
  description,
  icon,
  expanded,
  onPress,
  children,
}: Omit<ListItemProps, "right"> & { expanded: boolean; children: React.ReactNode }) => {
  const theme = useAppTheme();
  const styles = getStyles(theme);
  return (
    <View>
      <ListItem
        title={title}
        description={description}
        icon={icon}
        onPress={onPress}
        right={<ListIcon name={expanded ? "chevron-up" : "chevron-down"} />}
      />
      {expanded && <View style={styles.accordionBody}>{children}</View>}
    </View>
  );
};

const getStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    section: {
      marginVertical: 8,
    },
    subheader: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 14,
      fontWeight: "500",
      color: theme.colors.primary,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    content: {
      flex: 1,
    },
    title: {
      fontSize: 16,
      color: theme.colors.onSurface,
    },
    description: {
      marginTop: 2,
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },
    accordionBody: {
      paddingHorizontal: 16,
      paddingBottom: 12,
    },
  });
