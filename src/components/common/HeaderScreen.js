import React, { Component } from 'react';
import { Text, View, StyleSheet, Platform, Alert, NetInfo } from 'react-native';
import { Header, Icon } from 'react-native-elements';
import { AuthHandler } from '../AuthHandler';
import { authStatusNoComm,
            authStatusSuccess,
            authStatusUnsuccess,
            authStatusInProgress,
            authStatusUnsuccessNoCred
          } from '../constants';

class HeaderScreen extends Component {
  constructor(props) {
     super(props);

      this.state = { authState:
                      { Authenticated: 0,
                        infoMessage: authStatusInProgress,
                        authCredentials: '' },
                      connectionState: '',
                    };
  }

  componentDidMount() {
    NetInfo.getConnectionInfo().then((connectionInfo) =>
            this.handleConnectivityChange(connectionInfo));
  }

  componentWillUnMount() {
     NetInfo.removeEventListener('connectionChange', this.handleConnectivityChange);
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
  }

  renderAuthState() {
    const textHeader = 'Автентикация в ГИС-АКБ:';
    switch (this.state.authState.infoMessage) {
        case authStatusInProgress:
          return message(textHeader,
            'Извършва се проверка...',
            'user',
            'yellow');
        case authStatusSuccess:
          return message(textHeader,
            `Успешна като ${this.state.authState.authCredentials}!`,
            'user',
            'teal');
        case authStatusNoComm:
          return message(textHeader,
            'Неуспешна! Не e налична свързаност с интернет. ',
            'user',
            'yellow');
        default:
          return message(textHeader,
            'Неуспешна с грешка...',
            'user',
            'tomato');
    }
  }

  renderNetworkConnection() {
    const { connectionState } = this.state;
    const textHeader = 'Свързаност с интернет:';
    switch (connectionState.type) {
        case 'none':
          return message(textHeader, 'НЯМА', 'wifi', 'tomato');
        case 'unknown':
          return message(textHeader, 'Установява се', 'wifi', 'yellow');
        case 'wifi':
          return message(textHeader, 'Безжична мрежа (WiFi)', 'wifi', 'teal');
        case 'cellular':
          return message(textHeader,
            `През мрежата на мобилния оператор (${connectionState.EffectiveConnectionType})`,
            'wifi', 'teal');
        default:
          return message(textHeader, 'Нeвъзможно да се установи ', 'wifi', 'yellow');
    }
  }

  render() {
      return (
        <Header outerContainerStyles={styles.containerHeader} >
          <View style={styles.containerInner}>
            <View>
              <Text style={styles.headerTitle}>{this.props.headerText}</Text>
            </View>
            <View>
              <Text style={styles.headerSubTitle} >{this.props.subheaderText}</Text>
            </View>
          </View>
          <AuthHandler
            Reason='Header'
            Result={this.handlerAuthResult.bind(this)}
            Comm={this.state.connectionState}
          >
            <View style={styles.containerIcons}>
               {this.renderAuthState()}
               {this.renderNetworkConnection()}
            </View>
          </AuthHandler>
        </Header>
      );
    }
  }

  let platformHeaderContainerStyles;
  if (Platform.OS === 'ios') {
    platformHeaderContainerStyles = {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: '#A7A7AA'
    };
  } else {
    platformHeaderContainerStyles = {
      shadowColor: 'black',
      shadowOpacity: 0.1,
      shadowRadius: StyleSheet.hairlineWidth,
      shadowOffset: {
        height: StyleSheet.hairlineWidth
      },
      elevation: 4
    };
  }

  const DEFAULT_HEADER_BACKGROUND_COLOR = Platform.OS === 'ios' ? '#F7F7F7' : '#FFF';
  const APPBAR_HEIGHT = Platform.OS === 'ios' ? 44 : 56;
  const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 20 : 0;
  const HEADER_HEIGHT = APPBAR_HEIGHT + STATUSBAR_HEIGHT;

  const styles = StyleSheet.create({
    containerHeader: {
      height: HEADER_HEIGHT,
      padding: 2,
      justifyContent: 'space-between',
      backgroundColor: DEFAULT_HEADER_BACKGROUND_COLOR,
      ...platformHeaderContainerStyles
    },
    containerInner: {

    },
    containerIcons: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
    headerTitle: {
      fontSize: Platform.OS === 'ios' ? 16 : 18,
      fontWeight: Platform.OS === 'ios' ? '600' : '500',
      color: 'rgba(0, 0, 0, .9)',
      marginHorizontal: 16
    },
    headerSubTitle: {
      fontSize: Platform.OS === 'ios' ? 14 : 16,
      color: 'rgba(0, 0, 0, .9)',
      marginHorizontal: 16
    },
    containerMessage: {
       flexDirection: 'row',
       alignItems: 'flex-start',
       justifyContent: 'flex-start',
       marginRight: 5,
     },
     messageIcon: {
       padding: 4,
       margin: 2,
     },
  });

  const message = (textHeader, textMessage, msgIcon, clrIcon) => (
      <View style={styles.containerMessage}>
          <Icon
            name={msgIcon}
            size={20}
            type='font-awesome'
            color={clrIcon}
            underlayColor={DEFAULT_HEADER_BACKGROUND_COLOR}
            iconStyle={styles.messageIcon}
            onPress={() => messageAlert(textHeader, textMessage)}
          />
      </View>
    );

const messageAlert = (textHeader, textMessage) => (
    Alert.alert(
       textHeader,
      textMessage,
      [
        { text: 'OK', onPress: () => {} },
      ]
    )
  );
export { HeaderScreen };
