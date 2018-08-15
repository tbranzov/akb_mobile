import React from 'react';
import { createStackNavigator,
          createSwitchNavigator,
          createBottomTabNavigator } from 'react-navigation';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { HomeScreen,
          SettingsScreen,
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
      Settings: { screen: SettingsScreen,
                navigationOptions: {
          tabBarLabel: 'Настройки'
          }
         },
  },
  {
     navigationOptions: ({ navigation }) => ({
       tabBarIcon: ({ focused, tintColor }) => {
         const { routeName } = navigation.state;
         let iconName;
         if (routeName === 'Home') {
           iconName = `ios-map${focused ? '' : '-outline'}`;
         } else if (routeName === 'Settings') {
           iconName = `ios-options${focused ? '' : '-outline'}`;
         } else if (routeName === 'Expeditions') {
           iconName = `ios-folder${focused ? '' : '-outline'}`;
         } else if (routeName === 'SingleExpedition') {
           iconName = `ios-bookmarks${focused ? '' : '-outline'}`;
         }
         return <Ionicons name={iconName} size={25} color={tintColor} />;
       },
     }),
     tabBarOptions: {
       activeTintColor: 'tomato',
       inactiveTintColor: 'gray',
     },
   }
);

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
