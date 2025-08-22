import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Pressable,
  useWindowDimensions,
} from "react-native";
import { Button } from 'react-native-paper';
import useStore from "./Store";
import { ActivityType, Stat } from "./StoreTypes";
import DraggableFlatList from 'react-native-draggable-flatlist'
import AntDesign from '@expo/vector-icons/AntDesign';
import { renderValueSummary } from "./ActivityData";
import { calcStatValue, getUnitSymbol } from "./ActivityUtil";
import { getTheme, getThemePalette, getThemeVariant, useWideDisplay } from "./Theme";
import { SystemBars } from "react-native-edge-to-edge";
import { SafeAreaView } from "react-native-safe-area-context";

type ActivitiesProps = {
  navigation: any;
};

const Activities: React.FC<ActivitiesProps> = ({ navigation }) => {
  const theme = getTheme();
  const themeVariant = getThemeVariant();
  const activities = useStore((state: any) => state.activities);
  const setActivities = useStore((state: any) => state.setActivities);
  const weekStart = useStore((state: any) => state.weekStart);
  
  const palette = getThemePalette();
  const wideDisplay = useWideDisplay();
  const dimensions = useWindowDimensions();
  const styles = getStyles(theme, wideDisplay, dimensions);

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
    const activity = item;
    let values = activity.stats.map((stat: Stat) => 
      ({ 
        value: calcStatValue(stat, activity, weekStart),
        symbol: getUnitSymbol(stat, activity.unit),
      }));

    if (!wideDisplay) {
      values = values.slice(0, 1);
    }

    return (
      <Pressable
        onPress={() => navigation.navigate('Activity', { activityName: activity.name })}
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
            <Text numberOfLines={1} style={[styles.activityTitle, { color: palette[activity.color] }]}>{activity.name}</Text>
          </View>
          {values.map(({value, symbol}, index) => (
            <View key={index} style={styles.activityValueContainer}>
              <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.activityValue, { color: palette[activity.color] }]}>
                {renderValueSummary(value, symbol)}
              </Text>
            </View>
          ))}
          <TouchableOpacity
            onPress={() => { navigation.navigate('EditDataPoint', { activityName: activity.name, dataPointName: null, newDataPoint: true }); }}
            style={styles.addDataPointButton}
          >
            <AntDesign name="plus" size={24} color={palette[activity.color]} />
          </TouchableOpacity>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={[styles.container]} edges={["left", "right"]}>
      <SystemBars style={themeVariant == 'light' ? "dark" : "light"} />
      {activities.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <AntDesign name="inbox" size={64} color={theme.colors.onSurfaceVariant} />
          <Text style={styles.emptyStateText}>No activities</Text>
          <Text style={styles.emptyStateSubtext}>Tap the + button to create an activity</Text>
        </View>
      ) : (
        <DraggableFlatList
          data={activities}
          onDragEnd={({ data }) => setActivities(data)}
          renderItem={renderActivity}
          keyExtractor={(item) => item.name}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
  );
};

const getStyles = (theme: any, wideDisplay: boolean, dimensions: any) => StyleSheet.create({
  menuContainer: {
    position: 'absolute',
    top: 10,
    right: 0,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.elevation.background,
    paddingTop: 2,
  },
  listContainer: {
    padding: 2,
  },
  activityCard: {
    padding: 4 * dimensions.fontScale,
    backgroundColor: theme.colors.elevation.level1,
    elevation: 1,
    margin: 2,
    borderRadius: 2,
  },
  activityRow: {
    flexDirection: 'row',
    gap: 4,
  },
  activityTitleContainer: {
    flex: 1,
    paddingLeft: 4,
    justifyContent: 'center',
  },
  activityValueContainer: {
    width: wideDisplay ? '10%' : '25%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addDataPointButton: {
    padding: 6,
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
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 50,
    backgroundColor: theme.colors.elevation.level1,
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

export default Activities; 