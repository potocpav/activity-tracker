import React from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Pressable,
  Dimensions,
} from "react-native";
import { Button } from 'react-native-paper';
import useStore from "./Store";
import { ActivityType } from "./StoreTypes";
import DraggableFlatList from 'react-native-draggable-flatlist'
import AntDesign from '@expo/vector-icons/AntDesign';
import { renderValueSummary } from "./ActivityData";
import { calcStatValue, getUnitSymbol } from "./ActivityUtil";
import { getTheme, getThemePalette } from "./Theme";

type ActivitiesProps = {
  navigation: any;
};

const Activities: React.FC<ActivitiesProps> = ({ navigation }) => {
  const theme = getTheme();
  const activities = useStore((state: any) => state.activities);
  const setActivities = useStore((state: any) => state.setActivities);
  const weekStart = useStore((state: any) => state.weekStart);
  
  const palette = getThemePalette();
  const styles = getStyles(theme);

  const dimensions = Dimensions.get('window');

  React.useEffect(() => {
    navigation.setOptions({
      // title: activity.name,
      headerRight: () => (
        <View style={styles.headerRightContainer}>
          <Button compact={true} onPress={() => navigation.navigate('EditActivity', { activityName: null })}>
            <AntDesign name="plus" size={24} color={theme.colors.onSurface} />
          </Button>
          <Button compact={true} onPress={() => navigation.navigate('Settings')}>
            <AntDesign name="setting" size={24} color={theme.colors.onSurface} />
          </Button>
        </View>
      ),
    });
  }, [navigation, theme]);

  const renderActivity = ({ item, drag }: { item: ActivityType, drag: () => void }) => {
    const value = item.stats.length > 0 && item.stats[0].length > 0 ? calcStatValue(item.stats[0][0], item, weekStart) : null;
    const unitSymbol = item.stats.length > 0 && item.stats[0].length > 0 ? 
      getUnitSymbol(item.stats[0][0], item.unit) : "";

    return (
      <Pressable
        // style={[styles.activityCard, styles.activityCardSurface]}
        onPress={() => navigation.navigate('Activity', { activityName: item.name })}
        onLongPress={drag}
        style={({ pressed }) => [
          styles.activityCard,
          {
            opacity: pressed ? 0.5 : 1,
          },
        ]}
      >
        <View style={styles.activityRow}>
          <View style={styles.activityTitleContainer}>
            <Text numberOfLines={1} style={[styles.activityTitle, { color: palette[item.color] }]}>{item.name}</Text>
          </View>
          <View style={styles.activityValueContainer}>
            <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.activityValue, { color: palette[item.color] }]}>
              {renderValueSummary(value, unitSymbol)}
            </Text>
          </View>
          {/* <View style={styles.activityValueContainer}>
            <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.activityValue, { color: palette[item.color] }]}>
              {renderValueSummary(value, unitSymbol)}
            </Text>
          </View>
          <View style={styles.activityValueContainer}>
            <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.activityValue, { color: palette[item.color] }]}>
              {renderValueSummary(value, unitSymbol)}
            </Text>
          </View> */}
          <TouchableOpacity
            onPress={() => { navigation.navigate('EditDataPoint', { activityName: item.name, dataPointName: null, newDataPoint: true }); }}
            style={styles.addDataPointButton}
          >
            <AntDesign name="plus" size={24} color={palette[item.color]} />
          </TouchableOpacity>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={[styles.container]}>
      <DraggableFlatList
        data={activities}
        onDragEnd={({ data }) => setActivities(data)}
        renderItem={renderActivity}
        keyExtractor={(item) => item.name}
        contentContainerStyle={styles.listContainer}
      />
    </SafeAreaView>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  menuContainer: {
    position: 'absolute',
    top: 10,
    right: 0,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.elevation.level1,
    paddingTop: 2,
  },
  listContainer: {
    padding: 2,
  },
  activityCard: {
    padding: 4,
    backgroundColor: theme.colors.surface,
    margin: 2,
    borderRadius: 2,

    elevation: 1,
  },
  activityRow: {
    flexDirection: 'row',
    gap: 4,
    // alignItems: 'center',
    // justifyContent: 'space-between',
  },
  activityTitleContainer: {
    // flex: 6,
    flex: 1,
    // width: '50%',
    // backgroundColor: 'blue',
    paddingLeft: 4,
    justifyContent: 'center',
  },
  activityValueContainer: {
    // flex: 1,
    width: '25%',
    // backgroundColor: 'red',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addDataPointButton: {
    padding: 8,
    flexShrink: 0,
  },
  activityTitle: {
    fontSize: 16,
    width: '60%',
  },
  activityValue: {
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
  menuAnchor: {
    width: 1,
    height: 1,
  },
});

export default Activities; 