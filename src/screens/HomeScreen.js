import React, { Component } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview-messaging/WebView';
import { MainHTML } from '../components/constants';

class HomeScreen extends Component {
  render() {
    return (
      <View style={{ flex: 3 }}>
        <WebView
            //source={{ html: HTML1, baseUrl: 'web/' }}
            source={MainHTML}
            style={{ flex: 1 }}
        />
      </View>
    );
  }
}

export { HomeScreen };
