import React from 'react';
import { StyleSheet } from 'react-native';
import { createStackNavigator,
          createSwitchNavigator,
          createBottomTabNavigator } from 'react-navigation';
import FontAwesome5Pro from 'react-native-vector-icons/FontAwesome5Pro';
import { HomeScreen,
          SettingsScreen, SettingsDetailScreen,
          CurrentExpedition, NewExpeditionScreen,
          ExpeditionList, ExpeditionDetailsScreen, ScreenSplash, ScreenLogin } from './screens';

const stackExpeditions = createStackNavigator({
  Expeditions: ExpeditionList,
  Details: ExpeditionDetailsScreen,
  NewExpedition: NewExpeditionScreen,
});

const stackSingleExpedition = createStackNavigator({
  Expedition: CurrentExpedition,
  NewExpedition: NewExpeditionScreen,
});

const stackAuth = createStackNavigator({
  Login: { screen: ScreenLogin }
});

const stackSplash = createStackNavigator({
  SplashScreen: { screen: ScreenSplash }
  });

const stackSettings = createStackNavigator({
  Settings: { screen: SettingsScreen },
  SettingsDetail: { screen: SettingsDetailScreen }
  });

const stackTab = createBottomTabNavigator(
  {
      Home: { screen: HomeScreen,
              navigationOptions: {
        tabBarLabel: 'Карта'
        }
       },
      SingleExpedition: { screen: stackSingleExpedition,
                navigationOptions: {
          tabBarLabel: 'Издирване'
          }
         },
       Expeditions: { screen: stackExpeditions,
                 navigationOptions: {
           tabBarLabel: 'Архив'
           }
          },
      Settings: { screen: stackSettings,
                navigationOptions: {
          tabBarLabel: 'Настройки'
          }
         },
  },
  {
     navigationOptions: ({ navigation }) => ({
       tabBarIcon: ({ focused, tintColor }) => {
         const { routeName } = navigation.state;
         let iconRender;
         if (routeName === 'Home') {
           iconRender = focused ? IconMap : IconMapOutlined;
         } else if (routeName === 'Settings') {
           iconRender = focused ? IconSettings : IconSettingsOutlined;
         } else if (routeName === 'Expeditions') {
           iconRender = focused ? IconArchive : IconArchiveOutlined;
         } else if (routeName === 'SingleExpedition') {
           iconRender = focused ? IconExp : IconExpOutlined;
         }
         //return <Ionicons name={iconName} size={25} color={tintColor} />;
        return iconRender;
       },
     }),
     tabBarOptions: {
       activeTintColor: 'tomato',
       inactiveTintColor: 'gray',
     },
   }
);

const styles = StyleSheet.create({
  activeIcon: {
    fontSize: 25,
    height: 25,
    color: 'tomato',
  },
  inactiveIcon: {
    fontSize: 25,
    height: 25,
    color: 'gray',
  },
});

const IconMap = (<FontAwesome5Pro name='map' style={styles.activeIcon} solid />);
const IconMapOutlined = (<FontAwesome5Pro name='map' style={styles.inactiveIcon} light />);
const IconExp = (<FontAwesome5Pro name='file-alt' style={styles.activeIcon} solid />);
const IconExpOutlined = (<FontAwesome5Pro name='file-alt' style={styles.inactiveIcon} light />);
const IconArchive = (<FontAwesome5Pro name='folder-open' style={styles.activeIcon} solid />);
const IconArchiveOutlined = (<FontAwesome5Pro name='folder-open' style={styles.inactiveIcon} light />);
const IconSettings = (<FontAwesome5Pro name='sliders-h' style={styles.activeIcon} light />);
const IconSettingsOutlined = (<FontAwesome5Pro name='sliders-h' style={styles.inactiveIcon} light />);

const Nav = createSwitchNavigator(
  {
    Splash: stackSplash,
    App: stackTab,
    Auth: stackAuth,
  },
  {
    initialRouteName: 'Splash',
  }
);

export default Nav;
