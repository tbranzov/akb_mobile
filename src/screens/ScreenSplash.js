import React, { Component } from 'react';
import { AppState, NetInfo, Alert, StyleSheet, Text, Platform } from 'react-native';
import { Container, Content, Spinner } from 'native-base';
import { realm } from '../components/RealmSchema';
import { refreshTokenEndpoint } from '../components/constants';

class ScreenSplash extends Component {

  state = { appState: '', connectionState: '', authState: '' }

  componentDidMount() {
    AppState.addEventListener('change', this.handleAppStateChange);
    NetInfo.addEventListener('connectionChange', this.handleConnectivityChange);
  }

  componentWillUnMount() {
    AppState.removeEventListener('change', this.handleAppStateChange);
    NetInfo.removeEventListener('connectionChange', this.handleConnectivityChange);
    console.log('Loading Screen Unmount');
  }

  //Event listener for app's state (AppState component)
  //https://stackoverflow.com/questions/38962034/how-to-detect-when-a-react-native-app-is-closed-not-suspended
   handleAppStateChange = (nextAppState) => {
      this.setState({ appState: nextAppState });
   }

   handleAuthStateChange = (currentAuthState) => {
      this.setState({ authState: currentAuthState });
      console.log('Auth state changed to:' + currentAuthState);
   }

   //Event listener for NetInfo component
   handleConnectivityChange = (connectionInfo) => {
      //console.log('Connectivity change: type=' + connectionInfo.type + ', effective type='
      //+ connectionInfo.effectiveType);
      //netInfo = connectionInfo;
      this.setState({ connectionState: connectionInfo });
      //For development purposes only - да се замени с икона

      if (this.connected()) {    // there is internet connection
          this.doAccessTokenRefresh('handleConnectivityChange');
      } else {
          global.ct = '';  //Flag for closed communication chanel to AKB GIS
      }
   }

   connected = () =>
       //Return true, if there is internet connection
        !(this.state.connectionState.type === 'none' ||
          this.state.connectionState.type === 'unknown')

  doAccessTokenRefresh = (callFrom) => {
     const refreshAT = (refreshToken) => {
         this.refreshAccessToken(refreshToken);
     };

     const openLogin = () => {
         this.props.navigation.navigate('Auth');
     };

     //Read user credentials from Realm database to get refresh token for access token
     //refreshing purpose
     this.readCredentials()
         .then((credentials) => {
             if (credentials === undefined) {
                 //This happens to application on first start only
                 console.log('Open Login screen ...');
                 openLogin(); //Important: refreshAccessToken is NOT visible here
             } else {
                 //No matter if access token is valid or not, always update access token
                 //on application start
                 refreshAT(credentials.rt); //Important: this.setState is NOT visible here
             }
         })
         .catch((err) => {
             console.log('Error on reading credentials!', err.toString());
             Alert.alert(callFrom, `Error on reading credentials!\n${err.toString()}`);
         });
  }

  readCredentials = () => {
      console.log('Reading credentials from Realm database ...');
      return new Promise((resolve, reject) => {
          try {
              const credentials = realm.objects('UserCredentials');
              resolve(credentials[0]);
          } catch (e) {
              reject(e);
          }
      });
   }

   saveCredentials = (name, rt, t, ver) => {
       console.log('Saving credentials ...');
       const newCredentials = {
           userName: name,
           rt,
           t,
       };

       return new Promise((resolve, reject) => {
           try {
                 const oldCredentials = realm.objects('UserCredentials');

                 realm.write(() => {
                     realm.delete(oldCredentials); // Deletes old credentials
                 });

                 const pars = {
                     refreshToken: rt,
                     accessToken: t,
                     dbVersion: ver,
                 };

                 realm.write(() => {
                     realm.create('UserCredentials', newCredentials);
                 });

                 resolve(pars);
               } catch (e) {
                 reject(e);
           }
       });
  }

  refreshAccessToken = (rt) => {
    console.log('Refreshing access token ...');
    this.handleAuthStateChange('ongoing');

     global.ct = '';
     global.crt = '';

     //Alert.alert('Before Fetch');
     console.log(`RefreshTokenEndpoint: ${refreshTokenEndpoint}`);
     console.log(`RefreshToken: ${rt}`);

     fetch(refreshTokenEndpoint, {
             method: 'PUT',
             headers: {
                 Accept: 'application/json',
                 'Content-Type': 'application/json',
             },
             body: JSON.stringify({ rt })
         }
     )
     .then(response => response.json())
     .then((responseJSON) => {
         console.log('Refresh token available...');
         console.log(JSON.stringify(responseJSON));

         const bodyJSON = responseJSON;

         if (bodyJSON.meta.success === true) {
             bodyJSON.meta.accessTokenBeginTime = (new Date()).getTime(); //Future use
             this.saveCredentials(bodyJSON.data.user.email,
                                   bodyJSON.data.rt,
                                   bodyJSON.data.t,
                                   bodyJSON.meta.version)
             .then((params) => {
                 //Initialize global variables
                 global.crt = params.refreshToken;
                 global.ct = params.accessToken;
                 global.dbVerAKB = params.dbVersion;
                 console.log(`Global credentials state:\n ct=${global.ct},\n crt=${global.crt}`);
                 this.handleAuthStateChange('authenticated');
                 this.props.navigation.navigate('App');
             })
             .catch((error) => {
                 console.log(`Error on saving new credentials! ${error.toString()}`);
             });
         } else {
            console.log(`Refresh token error! ${JSON.stringify(bodyJSON.meta.errors)}`);
            this.props.navigation.navigate('Auth');
         }
     })

     .catch((e) => {
         console.log(`Refresh token error response: ${e.toString()}`);
     });
  }

  renderNetworkConnection() {
    switch (this.state.connectionState.type) {
        case 'none' || 'unknown':
          return <Text>  Връзка с интернет: НЯМА </Text>;
        case 'wifi':
          return <Text>  Връзка с интернет: Безжична мрежа (WiFi) </Text>;
        case 'cellular':
          return (<Text> Връзка с интернет: През мрежата на мобилния оператор
            ({this.state.connectionState.EffectiveConnectionType}) </Text>);
        default:
          return <Text>  Връзка с интернет: Нeвъзможно да се установи </Text>;
    }
  }

  renderAuthState() {
    switch (this.state.authState) {
        case 'ongoing':
        return <Text>  Автентикация за АКБ: Извършва се проверка... </Text>;
        case 'authenticated':
          return <Text>  Автентикация за АКБ: Успешна! </Text>;
        default:
          return <Text>  Автентикация за АКБ: Неуспешна с грешка... </Text>;
    }
  }

  render() {
      return (
        <Container style={styles.classMainContainer}>
          <Content style={styles.classView}>
            <Spinner color='white' />
            {this.renderNetworkConnection()}
            {this.renderAuthState()}
          </Content>
        </Container>
    );
  }

}

//const realm = this.props.navigation.getParam(realm);

const styles = StyleSheet.create(
{
    classMainContainer:
    {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: (Platform.OS === 'ios') ? 20 : 0
    },

    classView:
    {
        backgroundColor: 'powderblue',
        //justifyContent: 'center',
        flex: 1,
        margin: 10,
        position: 'absolute',
        width: '100%',
        height: '100%',
    },

});

export { ScreenSplash };
