import React, { Component } from 'react';
import { AppState, NetInfo, } from 'react-native';
import { Alert } from 'native-base';
import Modal from 'react-native-modal';
import { realm } from '../components/RealmSchema';
import LoginScreen from './LoginScreen';
import { serverIPaddr, refreshTokenEndpoint } from '../components/constants';

let netInfo = '';

class LoginScript extends Component {

  state = { modalLogin: false }

  //Event listener for NetInfo component
  handleConnectivityChange = (connectionInfo) => {
     //console.log('Connectivity change: type=' + connectionInfo.type + ', effective type='
     //+ connectionInfo.effectiveType);
     let clr = 'green';
     if (connectionInfo.type === 'none') {
         clr = 'black';
     } else if (connectionInfo.type === 'unknown') { clr = 'red'; }

     netInfo = connectionInfo;
     this.setState({ connectionStateColor: clr });
     //For development purposes only - да се замени с икона

     if (this.connected()) {    // there is internet connection
         this.doAccessTokenRefresh('handleConnectivityChange');
     } else {
         global.ct = '';  //Flag for closed communication chanel to AKB GIS
     }
  }

  //Return true, if there is internet connection
  connected = () =>
       !(netInfo.type === 'none' || netInfo.type === 'unknown')

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

   loginCredentials = (response) => {
       console.log('Close Login screen ...');
       this.setState({ modalLogin: false }); // Close LoginScreen

       /*
       var fnLoadDB = (ver) => {
           this.sinchronizeWithAKBdb(ver);
       }
       */

       this.saveCredentials(
         response.data.user.email,
         response.data.rt,
         response.data.t,
         response.meta.version)
       .then((params) => {
           //Initialize global variables
           global.crt = params.refreshToken;
           global.ct = params.accessToken;
           global.dbVerAKB = params.dbVersion;

           //For development purposes only - This must by executed in option NEW EXPEDITION
           //fnLoadDB(response.meta.version);
           //Important: sinchronizeWithAKBdb is NOT visible here!
       })
       .catch((error) => {
           Alert.alert('loginCredentials',
           `Грешка при съхраняване на новите данни за вход в АКБ!\n${error.toString()}`);
       });
    }

    refreshAccessToken = (rt) => {
       console.log('Refreshing access token ...');

       global.ct = '';
       global.crt = '';

         //Alert.alert('Before Fetch');
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
                })
                .catch((error) => {
                    console.log(`Error on saving new credentials! ${error.toString()}`);
                });
            } else {
                console.log(`Refresh token error! ${JSON.stringify(bodyJSON.meta.errors)}`);
            }
        })

        .catch((e) => {
            console.log(`Refresh token error response: ${e.toString()}`);
        });
    }

    doAccessTokenRefresh = (callFrom) => {
      const refreshAT = (refreshToken) => {
          this.refreshAccessToken(refreshToken);
      };

      const openLogin = () => {
          this.setState({ modalLogin: true });
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

    render() {
      return (
          <Modal     // Modal panel for login form
              animationType="none"
              transparent
              visible={this.state.modalLogin}
              onRequestClose={() => {}}
          >
            <LoginScreen serverIPAddress={serverIPaddr} credentials={this.loginCredentials} />
          </Modal>
    );
  }

}

export { LoginScript };
