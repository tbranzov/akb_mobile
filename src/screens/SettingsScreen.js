import React, { Component } from 'react';
import { View, Text, Button } from 'react-native';

class SettingsScreen extends Component {
  render() {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Settings!</Text>
        <Button
          title="Go to details"
          onPress={() => this.props.navigation.navigate('Details')}
        />
      <Text> Логин форма.</Text>
      </View>
    );
  }
}

export { SettingsScreen };
