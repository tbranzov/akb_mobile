/* Usage:

<AuthHandler
  Reason={constReason}
  Result={handlerAuth} // JSON обект   { Authenticated: 0,
                                      infoMessage: authStatusInProgress,
                                      authCredentials: '' },
  Comm={connectionState}
/>

*/

import React, { Component } from 'react';
import { Alert, View } from 'react-native';
import { realm } from '../components/RealmSchema';
import { refreshTokenEndpoint,
            authStatusNoComm,
            authStatusSuccess,
            authStatusUnsuccess,
            authStatusInProgress,
            authStatusUnsuccessNoCred
          } from '../components/constants';

class AuthHandler extends Component {
  state = { authState:
            { Authenticated: 0,
              infoMessage: authStatusInProgress,
              authCredentials: '' },
        };

  componentDidMount() {
    this.doAccessTokenRefresh('componentDidMount');
  }

  componentDidUpdate(prevProps) {
    if (this.props.Comm !== prevProps.Comm) {
           console.log(`Communication:${this.props.Comm} vs ${prevProps.Comm}`);
       this.doAccessTokenRefresh('componentDidUpdate');
    }
  }

  handleAuthStateChange = (currentAuthState) => {
     this.setState({ authState:
                       { Authenticated: currentAuthState.Authenticated,
                         infoMessage: currentAuthState.infoMessage,
                         authCredentials: currentAuthState.authCredentials }
                       });
      console.log(`Auth state changed to:${this.state.authState.Authenticated}`);
     this.props.Result(currentAuthState);
  }

  doAccessTokenRefresh = (callFrom) => {
    const { Comm } = this.props;
    if (Comm === undefined || Comm === 'none' || Comm === 'unknown') {
      this.handleAuthStateChange({ Authenticated: 0,
                    infoMessage: authStatusNoComm });
     } else {
       const refreshAT = (refreshToken) => {
           this.refreshAccessToken(refreshToken);
       };

       //Read user credentials from Realm database to get refresh token for access token
       //refreshing purpose
       this.readCredentials()
           .then((credentials) => {
               if (credentials === undefined) {
                this.handleAuthStateChange({ Authenticated: -1,
                              infoMessage: authStatusUnsuccessNoCred });
                // Хендлъра трябва да извика логин формата
               } else {
                refreshAT(credentials.rt);
               }
           })
           .catch((err) => {
               console.log('Error on reading credentials!', err.toString());
               Alert.alert(callFrom, `Error on reading credentials!\n${err.toString()}`);
           });
    }
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
    this.handleAuthStateChange({ Authenticated: 0,
                  infoMessage: authStatusInProgress });

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
                 this.handleAuthStateChange({ Authenticated: 1,
                               infoMessage: authStatusSuccess,
                                authCredentials: bodyJSON.data.user.email });
             })
             .catch((error) => {
                 console.log(`Error on saving new credentials! ${error.toString()}`);
             });
         } else {
            console.log(`Refresh token error! ${JSON.stringify(bodyJSON.meta.errors)}`);
            this.handleAuthStateChange({ Authenticated: -1,
                          infoMessage: authStatusUnsuccess });
            // Хендлъра трябва да извика логин формата
         }
     })

     .catch((e) => {
         console.log(`Refresh token error response: ${e.toString()}`);
         if (e.message === 'Network request failed') {
         this.handleAuthStateChange({ Authenticated: 0,
                       infoMessage: authStatusNoComm });
         } else if (e.message === 'SyntaxError: Unexpected token < in JSON at position 0') {
           if (this.props.Comm !== 'none' && this.props.Comm !== 'unknown') {
            this.doAccessTokenRefresh('componentDidUpdate');
           }
         }
     });
  }

  render() {
    return (
      <View>
        {this.props.children}
      </View>
    );
  }
}

export { AuthHandler };
