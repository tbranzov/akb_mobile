import React, { Component } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview-messaging/WebView';
import { MainHTML } from '../components/constants';

class HomeScreen extends Component {
  constructor(props) {
     super(props);

     this.state = {
         anystate: ''
     };
   }

componentDidMount() {
 if (global.activeExpedition === -1) this.props.navigation.navigate('SingleExpedition');
}

  refWebView = (webview) => {
     //this.webview = webview;
     global.refToWebView = webview;
  }

  render() {
    return (
      <View style={{ flex: 3 }}>
        <WebView
            //replace source with MainHTML constant
            //source={require('../../dist/index.html')}
            source={MainHTML}
            style={{ flex: 1 }}
            ref={this.refWebView}
        />
      </View>
    );
  }
}

export { HomeScreen };
