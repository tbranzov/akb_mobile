import React, { Component } from 'react';
import { AppState, NetInfo, } from 'react-native';
import { View } from 'native-base';
//import { realm } from './components/RealmSchema';
import Nav from './Nav';
//import '../ReactotronConfig';

class App extends Component {

  constructor() {
      super();
      //Defining global variables
      global.ct = ''; //Current access token. This is also flag for valid credentials
      global.crt = ''; //Current refresh token
      global.dbVerAKB = ''; //The actual (last) databse version of AKB-GIS
      this.state = { appState: '',
                      connectionState: '' };
  }

  componentDidMount() {
    AppState.addEventListener('change', this.handleAppStateChange);
    NetInfo.addEventListener('connectionChange', this.handleConnectivityChange);
  }

  componentWillUnMount() {
    AppState.removeEventListener('change', this.handleAppStateChange);
    NetInfo.removeEventListener('connectionChange', this.handleConnectivityChange);
    console.log('App Unmount');
  }

  //Event listener for app's state (AppState component)
  //https://stackoverflow.com/questions/38962034/how-to-detect-when-a-react-native-app-is-closed-not-suspended
   handleAppStateChange = (nextAppState) => {
      this.setState({ appState: nextAppState });
   }

   //Event listener for NetInfo component
   handleConnectivityChange = (connectionInfo) => {
      //console.log('Connectivity change: type=' + connectionInfo.type + ', effective type='
      //+ connectionInfo.effectiveType);
      //netInfo = connectionInfo;
      this.setState({ connectionState: connectionInfo });
      //For development purposes only - да се замени с икона

      if (this.connected()) {    // there is internet connection
          // this.doAccessTokenRefresh('handleConnectivityChange');
      } else {
          global.ct = '';  //Flag for closed communication chanel to AKB GIS
      }
   }

   connected = () =>
       //Return true, if there is internet connection
        !(this.state.connectionState.type === 'none' ||
          this.state.connectionState.type === 'unknown')

    render() {
      return (
        <View style={{ flex: 1 }}>
          <Nav />
        </View>
    );
  }
}

export default App;
