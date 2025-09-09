import { View, Text, StyleSheet } from "react-native";
import { getTheme } from "../Theme";
import { MD3Theme } from "react-native-paper";


const Hint = ({ hint }: { hint: string }) => {
  const theme = getTheme();
  const styles = getStyles(theme);
  
  return (
    <View style={styles.hintContainer}>
      <Text style={styles.hintText}>{hint}</Text>
    </View>
  );
};

const getStyles = (theme: MD3Theme) => StyleSheet.create({
  hintContainer: {
    backgroundColor: theme.colors.primary,
    padding: 10,
    borderRadius: 10,
    margin: 10,
    elevation: 5,
  },
  hintText: {
    color: "white",
  },
});

export default Hint;