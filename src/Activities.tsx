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
import { ActivityType } from "./StoreTypes";
import DraggableFlatList from 'react-native-draggable-flatlist'
import AntDesign from '@expo/vector-icons/AntDesign';
import { renderValueSummary } from "./ActivityData";
import { lightPalette, darkPalette } from "./Color";
import { calcStatValue } from "./ActivityUtil";

type ActivitiesProps = {
  navigation: any;
};

const Activities: React.FC<ActivitiesProps> = ({ navigation }) => {
  const theme = useTheme();
  const activities = useStore((state: any) => state.activities);
  const setActivities = useStore((state: any) => state.setActivities);
  const [menuVisible, setMenuVisible] = React.useState(false);
  const themeState = useStore((state: any) => state.theme);
  const palette = themeState === "dark" ? darkPalette : lightPalette;
  const styles = getStyles(theme);

  React.useEffect(() => {
    navigation.setOptions({
      // title: activity.name,
      headerRight: () => (
        <View style={styles.headerRightContainer}>
          <Button compact={true} onPress={() => navigation.navigate('EditActivity', { activityName: null })}>
            <AntDesign name="plus" size={24} color={theme.colors.onSurface} />
          </Button>
          <Button compact={true} onPress={() => setMenuVisible(!menuVisible)}>
            <AntDesign name="bars" size={24} color={theme.colors.onSurface} />
          </Button>
        </View>
      ),
    });
  }, [navigation, menuVisible, theme]);

  const renderActivity = ({ item, drag }: { item: ActivityType, drag: () => void }) => {
    const value = item.stats.length > 0 && item.stats[0].length > 0 ? calcStatValue(item.stats[0][0], item) : null;
    const unit = item.stats.length > 0 && item.stats[0].length > 0 ? ["n_days", "n_points"].includes(item.stats[0][0].value) ? "" : item.unit : "";
    return (
      <TouchableOpacity
        style={[styles.activityCard, styles.activityCardSurface]}
        onPress={() => navigation.navigate('Activity', { activityName: item.name })}
        onLongPress={drag}
        activeOpacity={0.7}
      >
        <View style={styles.activityRow}>
          <View style={styles.activityTitleContainer}>
            <Text style={[styles.activityTitle, { color: palette[item.color] }]}>{item.name}</Text>
          </View>
          <View style={styles.activityDescriptionContainer}>
            <Text style={[styles.activityDescription, { color: palette[item.color] }]}>
              {renderValueSummary(value, unit)}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => { navigation.navigate('EditDataPoint', { activityName: item.name, dataPointName: null, newDataPoint: true }); }}
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
          {/* <Menu.Item onPress={() => { setMenuVisible(false); navigation.navigate('Live View') }} title="Tindeq Live View" /> */} 
          <Menu.Item onPress={() => { setMenuVisible(false); navigation.navigate('Settings') }} title="Settings" />
        </Menu>
      </View>
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
  container: {
    flex: 1,
  },
  background: {
    backgroundColor: theme.colors.background,
  },
  listContainer: {
    margin: 10,
  },
  activityCard: {
    padding: 4,
  },
  activityCardSurface: {
    backgroundColor: theme.colors.surface,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activityTitleContainer: {
    flex: 1,
  },
  activityDescriptionContainer: {
    marginTop: 4,
  },
  addDataPointButton: {
    marginLeft: 12,
    padding: 8,
  },
  activityTitle: {
    fontSize: 16,
    width: '60%',
  },
  activityDescription: {
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

export default Activities; 