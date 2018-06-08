import React from 'react';
import { createStackNavigator,
          createSwitchNavigator,
          createBottomTabNavigator } from 'react-navigation';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { HomeScreen,
          SettingsScreen,
          CommunicationScreen,
          ExpeditionList, ExpeditionDetails, ScreenSplash, ScreenLogin } from './screens';

const stackExpeditions = createStackNavigator({
  Expeditions: ExpeditionList,
  Details: ExpeditionDetails,
});

const stackAuth = createStackNavigator({
  Login: ScreenLogin,
});

const stackSplash = createStackNavigator(
  {
  SplashScreen: { screen: ScreenSplash }
  });

const stackTab = createBottomTabNavigator(
  {
      Home: { screen: HomeScreen },
      Expeditions: stackExpeditions,
      Communication: { screen: CommunicationScreen },
      Settings: { screen: SettingsScreen },
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
         } else if (routeName === 'Communication') {
           iconName = `ios-cloud-upload${focused ? '' : '-outline'}`;
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
