import React from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
} from "react-native";
import { useTheme } from 'react-native-paper';
import StatusBar from "./StatusBar";
import useStore from "./Store";

type MeasurementOption = {
  id: string;
  title: string;
  description: string;
};

type MainPageProps = {
  navigation: any;
};

const MainPage: React.FC<MainPageProps> = ({ navigation }) => {
  const theme = useTheme();
  const resetGoals = useStore((state: any) => state.resetGoals);

  const measurementOptions: MeasurementOption[] = [
    {
      id: "live-view",
      title: "Live View",
      description: "Real-time weight measurement and control",
    },
    {
      id: "goals",
      title: "Goals",
      description: "View your training goals and progress tracking",
    },
  ];

  const renderOption = ({ item }: { item: MeasurementOption }) => (
    <TouchableOpacity
      style={[styles.optionCard, { backgroundColor: theme.colors.surface }]}
      onPress={() => {
        if (item.id === "live-view") {
          navigation.navigate('Live View');
        } else if (item.id === "goals") {
          navigation.navigate('Goals');
        }
      }}
    >
      <Text style={[styles.optionTitle, { color: theme.colors.onSurface }]}>{item.title}</Text>
      <Text style={[styles.optionDescription, { color: theme.colors.onSurfaceVariant }]}>{item.description}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.surfaceVariant }]}>      
      <FlatList
        data={measurementOptions}
        renderItem={renderOption}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
      <View style={styles.resetButtonContainer}>
        <TouchableOpacity
          style={[styles.resetButton, { backgroundColor: theme.colors.error }]}
          onPress={resetGoals}
        >
          <Text style={[styles.resetButtonText, { color: theme.colors.onError }]}>Reset Data</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  listContainer: {
    padding: 20,
  },
  optionCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 16,
    lineHeight: 22,
  },
  resetButtonContainer: {
    padding: 20,
    paddingBottom: 30,
  },
  resetButton: {
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default MainPage; 