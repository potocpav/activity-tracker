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
import useStore, { GoalType } from "./Store";
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

  React.useEffect(() => {
    navigation.setOptions({
      // title: goal.name,
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
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
        style={[styles.goalCard, { backgroundColor: theme.colors.surface }]}
        onPress={() => navigation.navigate('Goal', { goalName: item.name })}
        onLongPress={drag}
        activeOpacity={0.7}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.goalTitle, { color: palette[item.color] }]}>{item.name}</Text>
          </View>
          <View style={{ marginTop: 4 }}>
              {lastDataPoint ? (
                renderValueSummary(lastDataPoint.value, item.unit, [styles.goalDescription, { color: palette[item.color] }], true)
              ) : (
                <Text style={[styles.goalDescription, { color: palette[item.color] }]}>No data</Text>
              )}
            </View>
          <TouchableOpacity
            onPress={() => { navigation.navigate('EditDataPoint', { goalName: item.name, dataPointName: null, new: true }); }}
            style={{ marginLeft: 12, padding: 8 }}
          >
            <AntDesign name="plus" size={24} color={palette[item.color]} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={{ position: 'absolute', top: 10, right: 0}}>
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={<View style={{width: 1, height: 1}}/>}
        >
            <Menu.Item onPress={() => {setMenuVisible(false); navigation.navigate('Live View')}} title="Tindeq Live View" />
            <Menu.Item onPress={() => {setMenuVisible(false); navigation.navigate('Settings')}} title="Settings" />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    margin: 10,
  },
  goalCard: {
    padding: 4,
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
});

export default Goals; 