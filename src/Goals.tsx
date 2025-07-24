import React from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from "react-native";
import { Menu, useTheme } from 'react-native-paper';
import { Button } from 'react-native-paper';
import useStore from "./Store";
import { GoalType } from "./StoreTypes";
import DraggableFlatList from 'react-native-draggable-flatlist'
import AntDesign from '@expo/vector-icons/AntDesign';
import { renderValueSummary } from "./GoalData";
import { lightPalette, darkPalette } from "./Color";

type GoalsProps = {
  navigation: any;
};

const Goals: React.FC<GoalsProps> = ({ navigation }) => {
  const theme = useTheme();
  const goals = useStore((state: any) => state.goals);
  const setGoals = useStore((state: any) => state.setGoals);
  const [menuVisible, setMenuVisible] = React.useState(false);
  const themeState = useStore((state: any) => state.theme);
  const palette = themeState === "dark" ? darkPalette : lightPalette;
  const styles = getStyles(theme);

  React.useEffect(() => {
    navigation.setOptions({
      // title: goal.name,
      headerRight: () => (
        <View style={styles.headerRightContainer}>
          <Button compact={true} onPress={() => navigation.navigate('EditGoal', { goalName: null })}>
            <AntDesign name="plus" size={24} color={theme.colors.onSurface} />
          </Button>
          <Button compact={true} onPress={() => setMenuVisible(!menuVisible)}>
            <AntDesign name="bars" size={24} color={theme.colors.onSurface} />
          </Button>
        </View>
      ),
    });
  }, [navigation, menuVisible, theme]);

  const renderGoal = ({ item, drag }: { item: GoalType, drag: () => void }) => {
    const lastDataPoint = item.dataPoints && item.dataPoints.length > 0 ? item.dataPoints[item.dataPoints.length - 1] : null;
    return (
      <TouchableOpacity
        style={[styles.goalCard, styles.goalCardSurface]}
        onPress={() => navigation.navigate('Goal', { goalName: item.name })}
        onLongPress={drag}
        activeOpacity={0.7}
      >
        <View style={styles.goalRow}>
          <View style={styles.goalTitleContainer}>
            <Text style={[styles.goalTitle, { color: palette[item.color] }]}>{item.name}</Text>
          </View>
          <View style={styles.goalDescriptionContainer}>
            <Text style={[styles.goalDescription, { color: palette[item.color] }]}>
              {renderValueSummary(lastDataPoint?.value, item.unit)}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => { navigation.navigate('EditDataPoint', { goalName: item.name, dataPointName: null, new: true }); }}
            style={styles.addDataPointButton}
          >
            <AntDesign name="plus" size={24} color={palette[item.color]} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, styles.background]}>
      <View style={styles.menuContainer}>
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={<View style={styles.menuAnchor} />}
        >
          <Menu.Item onPress={() => { setMenuVisible(false); navigation.navigate('Live View') }} title="Tindeq Live View" />
          <Menu.Item onPress={() => { setMenuVisible(false); navigation.navigate('Settings') }} title="Settings" />
        </Menu>
      </View>
      <DraggableFlatList
        data={goals}
        onDragEnd={({ data }) => setGoals(data)}
        renderItem={renderGoal}
        keyExtractor={(item) => item.name}
        contentContainerStyle={styles.listContainer}
      />
    </SafeAreaView>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    backgroundColor: theme.colors.background,
  },
  listContainer: {
    margin: 10,
  },
  goalCard: {
    padding: 4,
  },
  goalCardSurface: {
    backgroundColor: theme.colors.surface,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  goalTitleContainer: {
    flex: 1,
  },
  goalDescriptionContainer: {
    marginTop: 4,
  },
  addDataPointButton: {
    marginLeft: 12,
    padding: 8,
  },
  goalTitle: {
    fontSize: 16,
    width: '60%',
  },
  goalDescription: {
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuContainer: {
    position: 'absolute',
    top: 10,
    right: 0,
  },
  menuAnchor: {
    width: 1,
    height: 1,
  },
});

export default Goals; 