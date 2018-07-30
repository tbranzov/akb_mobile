/* Usage:

Екранът, зареждан при стартиране на приложението. Извиква се от навигатора ( виж Nav.js)

*/

import React, { Component } from 'react';
import { AppState, NetInfo, View, Image } from 'react-native';
import { Button, Text, Icon } from 'react-native-elements';
import { AuthHandler } from '../components/AuthHandler';
import { authStatusNoComm,
            authStatusSuccess,
            authStatusUnsuccess,
            authStatusInProgress,
            authStatusUnsuccessNoCred
          } from '../components/constants';


class ScreenSplash extends Component {
  // Текстът-заглавие в навигационната лента (горе на екрана)
  static navigationOptions = ({ navigation }) => ({
      title: 'Моби АКБ'
    });

  state = { appState: '',
            connectionState: '',
            authState: { Authenticated: 0,
              infoMessage: authStatusInProgress,
              authCredentials: '' },
            loggin: 'busy' }

  componentDidMount() {
    this.subs = [
      this.props.navigation.addListener('didFocus', this.SetStateListeners),
      this.props.navigation.addListener('willBlur', this.RemoveStateListeners),
    ];
  }

  onButtonPress() {
    this.props.navigation.navigate('App');
  }

  onLoginFail() {
    const openLogin = () => {
        this.props.navigation.navigate('Auth');
    };
    this.setState({ loggin: 'idle' });
    openLogin();
  }

  onLoginSuccess() {
    this.setState({
      loggin: 'idle'
    });
  }

  componentWillUnMount() {
    this.subs.forEach(sub => sub.remove());
  }

  SetStateListeners = () => {
    AppState.addEventListener('change', this.handleAppStateChange);
    NetInfo.getConnectionInfo().then((connectionInfo) =>
            this.handleConnectivityChange(connectionInfo));
  }

  RemoveStateListeners = () => {
    AppState.removeEventListener('change', this.handleAppStateChange);
    NetInfo.removeEventListener('connectionChange', this.handleConnectivityChange);
  }

  //Event listener for app's state (AppState component)
  handleAppStateChange = (nextAppState) => {
      this.setState({ appState: nextAppState });
   }

   //Event listener for NetInfo component
   handleConnectivityChange = (connectionInfo) => {
      this.setState({ connectionState: connectionInfo });
      NetInfo.removeEventListener('connectionChange', this.handleConnectivityChange);
      NetInfo.addEventListener('connectionChange', this.handleConnectivityChange);
   }

  handlerAuthResult(Result) {
    console.log(`Handler Auth: ${Result.infoMessage}`);
     this.setState({ authState:
                       { Authenticated: Result.Authenticated,
                         infoMessage: Result.infoMessage,
                         authCredentials: Result.authCredentials }
                       });
    console.log(`Съобщение за статуса на автентикацията: ${this.state.authState.infoMessage}`);
     if (Result.Authenticated === -1) {
        this.onLoginFail();
     } else {
        this.onLoginSuccess();
     }
  }

  renderNetworkConnection() {
    const { connectionState } = this.state;
    const textHeader = 'Свързаност с интернет:';
    switch (connectionState.type) {
        case 'none':
          return message(textHeader, 'НЯМА', 'ios-wifi', 'tomato');
        case 'unknown':
          return message(textHeader, 'Установява се', 'ios-wifi', 'yellow');
        case 'wifi':
          return message(textHeader, 'Безжична мрежа (WiFi)', 'ios-wifi', 'teal');
        case 'cellular':
          return message(textHeader,
            `През мрежата на мобилния оператор (${connectionState.EffectiveConnectionType})`,
            'ios-wifi', 'teal');
        default:
          return message(textHeader, 'Нeвъзможно да се установи ', 'ios-wifi', 'yellow');
    }
  }

  renderAuthState() {
    const textHeader = 'Автентикация в АКБ-ГИС:';
    switch (this.state.authState.infoMessage) {
        case authStatusInProgress:
          return message(textHeader,
            'Извършва се проверка...',
            'ios-person',
            'yellow');
        case authStatusSuccess:
          return message(textHeader,
            `Успешна като ${this.state.authState.authCredentials}!`,
            'ios-person',
            'teal');
        case authStatusNoComm:
          return message(textHeader,
            'Неуспешна! Не e налична свързаност с интернет. ',
            'ios-person',
            'yellow');
        default:
          return message(textHeader,
            'Неуспешна с грешка...',
            'ios-person',
            'tomato');
    }
  }

  renderButton() {
    if (this.state.loggin === 'busy' || this.state.authState.infoMessage === authStatusInProgress) {
       return (
         <Button
            backgroundColor='#03A9F4'
            title='Проверка на състоянието'
            loading
         />
      );
    }

     return (
       <Button
          backgroundColor='#03A9F4'
          buttonStyle={{ borderRadius: 0, marginLeft: 0, marginRight: 0, marginBottom: 0 }}
          onPress={this.onButtonPress.bind(this)}
          title={this.state.authState.authCredentials ?
          `Продължи като ${this.state.authState.authCredentials}` :
          'Продължи без разпознаване в АКБ'}
       />
      );
}

  render() {
      return (
        <View style={styles.container}>
          <View style={styles.containerImage}>
            <Image
              source={require('../img/museumFront.jpg')}
              style={{ width: '100%', padding: 25, margin: 10 }}
              resizeMode='contain'
            />
          </View>
          <View style={styles.containerData}>

            {this.renderNetworkConnection()}

            <AuthHandler
              Reason='SplashScreen'
              Result={this.handlerAuthResult.bind(this)}
              Comm={this.state.connectionState.type}
            >
               {this.renderAuthState()}
            </AuthHandler>
          </View>
          <View style={styles.containerButton}>
                {this.renderButton()}
          </View>
        </View>
    );
  }
}

const styles = {
  container: {
     flex: 1,
     flexDirection: 'column',
     alignItems: 'flex-start',
     justifyContent: 'flex-start',
     backgroundColor: 'ghostwhite',
     margin: 0,
     padding: 0
   },
   containerImage: {
      flex: 2,
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      marginTop: 40,
      marginBottom: 40,
    },
   containerData: {
      flex: 4,
      width: '100%',
      alignItems: 'flex-start',
      justifyContent: 'flex-end',
      backgroundColor: 'ghostwhite',
      margin: 0,
      padding: 2
    },
    containerButton: {
       flex: 1,
       width: '100%',
       alignItems: 'center',
       justifyContent: 'center',
       backgroundColor: 'ghostwhite',
       margin: 0,
       padding: 0
     },
     containerMessage: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        margin: 10,
        marginLeft: 1,
        padding: 4
      },
      textMessage: {
        color: 'lightslategray',
        fontSize: 18,
       },
      headerMessage: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'darkslategrey',
      },
      messageIcon: {
        padding: 4,
        margin: 2,
      },
};

const message = (textHeader, textMessage, msgIcon, clrIcon) => (
    <View style={styles.containerMessage}>
      <View>
        <Icon
          name={msgIcon}
          size={40}
          type='ionicon'
          color={clrIcon}
          iconStyle={styles.messageIcon}
        />
      </View>
      <View>
        <Text style={styles.headerMessage}> {textHeader} </Text>
        <Text style={styles.textMessage}> {textMessage} </Text>
      </View>
    </View>
  );

export { ScreenSplash };
