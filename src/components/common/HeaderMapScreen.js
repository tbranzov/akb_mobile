import React from 'react';
import { Text, View, StyleSheet, Platform } from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { Header } from 'react-native-elements';

const HeaderScreen = (props) => (
    <Header outerContainerStyles={styles.containerHeader} >
      <View>
        <View>
          <Text style={styles.headerTitle} >{props.headerText}</Text>
        </View>
        <View>
          <Text style={styles.headerTitle} >{props.headerText}</Text>
        </View>
      </View>
    </Header>
  );

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
      backgroundColor: DEFAULT_HEADER_BACKGROUND_COLOR,
      ...platformHeaderContainerStyles
    },
    headerTitle: {
      fontSize: Platform.OS === 'ios' ? 17 : 20,
      fontWeight: Platform.OS === 'ios' ? '600' : '500',
      color: 'rgba(0, 0, 0, .9)',
      marginHorizontal: 16
    }
  });

export { HeaderScreen };
