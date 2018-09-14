// props, които се подават на компонента:
// this.props.headerText - заглавен текст (обикновено, име на експедицията)
// this.props.callbackOnPressLeft - колбек за ляв бутон

import React, { Component } from 'react';
import { Text, View, StyleSheet, Platform } from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { Header, Button } from 'react-native-elements';

class HeaderScreen extends Component {
  constructor(props) {
     super(props);

     this.state = {
       someState: '',
     };
  }

renderLeftButton = (callback, headerText) => (
    <View>
      <Button
        title='<'
        onPress={callback}
      />
      <View>
        <Text style={styles.headerTitle} >{headerText}</Text>
      </View>
    </View>
  )

renderFullBar = (headerText, textAccuracy, textZoom) => (
    <View style={styles.containerHeaderRow}>
      <View>
        <Text style={styles.headerTitle} >{headerText}</Text>
      </View>
      <View style={styles.containerSecondRow}>
        <View style={styles.containerSRIcons}>
          {IconNet}
          {IconLoggedIn}
        </View>
        <View>
          <Text>{headerText}</Text>
        </View>
        <View>
          <Text>Т: {textAccuracy}</Text>
          <Text>У: {textZoom}</Text>
        </View>
      </View>
    </View>
  )

renderCenter = (headerText) => (
    <View>
      <Text style={styles.headerTitle} >{headerText}</Text>
    </View>
  )

renderFactory(settings) {
  if (settings.callbackOnPressLeft !== undefined) {
      return (
      this.renderLeftButton(settings.callbackOnPressLeft, settings.headerText)
    );
  }

  if (settings.textAccuracy !== undefined) {
      return (
      this.renderFullBar(settings.headerText, settings.textAccuracy, settings.textZoom)
    );
  }

  return (
    this.renderCenter(settings.headerText)
  );
}

render() {
    return (
      <Header outerContainerStyles={styles.containerHeader} >
          {
            this.renderFactory({
              headerText: this.props.headerText,
              callbackOnPressLeft: this.props.callbackOnPressLeft,
              textAccuracy: this.props.textAccuracy,
              textZoom: this.props.textZoom,
             })
         }
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

const ICON_FONT_SIZE = 14;
const ICON_HEIGHT = 14;
const DEFAULT_HEADER_BACKGROUND_COLOR = Platform.OS === 'ios' ? '#F7F7F7' : '#FFF';
const APPBAR_HEIGHT = Platform.OS === 'ios' ? 44 : 56;
const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 20 : 0;
const ROW_HEIGHT = Platform.OS === 'ios' ? 30 : 33;
const HEADER_HEIGHT = APPBAR_HEIGHT + STATUSBAR_HEIGHT;
const HEADER_TWOROW_HEIGHT = HEADER_HEIGHT + ROW_HEIGHT;

const styles = StyleSheet.create({
  containerHeader: {
    height: HEADER_TWOROW_HEIGHT,
    alignItems: 'center',
    backgroundColor: DEFAULT_HEADER_BACKGROUND_COLOR,
    ...platformHeaderContainerStyles
  },
  containerHeaderRow: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  containerSecondRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  containerSRIcons: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 5,
  },
  headerTitle: {
    fontSize: Platform.OS === 'ios' ? 17 : 20,
    fontWeight: Platform.OS === 'ios' ? '600' : '500',
    color: 'rgba(0, 0, 0, .9)',
    marginHorizontal: 16
  },
  activeIcon: {
    fontSize: ICON_FONT_SIZE,
    height: ICON_HEIGHT,
    marginBottom: 4,
    color: 'tomato',
  },
  inactiveIcon: {
    fontSize: ICON_FONT_SIZE,
    height: ICON_HEIGHT,
    color: 'gray',
  },
});

const IconNet = (<FontAwesome5 name='wifi' style={styles.activeIcon} solid />);
const IconLoggedIn = (<FontAwesome5 name='user' style={styles.activeIcon} solid />);
const IconNotLoggedIn = (<FontAwesome5 name='user' style={styles.inactiveIcon} />);

export { HeaderScreen };
