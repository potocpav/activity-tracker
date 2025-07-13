import React from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
} from "react-native";
import StatusBar from "./StatusBar";

type MeasurementOption = {
  id: string;
  title: string;
  description: string;
};

type MainPageProps = {
  navigation: any;
};

const MainPage: React.FC<MainPageProps> = ({ navigation }) => {

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
      style={styles.optionCard}
      onPress={() => {
        if (item.id === "live-view") {
          navigation.navigate('Live View');
        } else if (item.id === "goals") {
          navigation.navigate('Goals');
        }
      }}
    >
      <Text style={styles.optionTitle}>{item.title}</Text>
      <Text style={styles.optionDescription}>{item.description}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>      
      <FlatList
        data={measurementOptions}
        renderItem={renderOption}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f2",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#666666",
  },
  listContainer: {
    padding: 20,
  },
  optionCard: {
    backgroundColor: '#ffffff',
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
    color: "#333333",
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 16,
    color: "#666666",
    lineHeight: 22,
  },
});

export default MainPage; 