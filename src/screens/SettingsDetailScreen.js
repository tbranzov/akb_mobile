import React, { Component } from 'react';
import { View, Text, Switch } from 'react-native';
import { Card } from 'react-native-elements';

class SettingsDetailScreen extends Component {
  // Текстът-заглавие в навигационната лента (горе на екрана)
  static navigationOptions = ({ navigation }) => ({
      title: navigation.getParam('titleSettings', 'Настройки'),
    });

    constructor(props) {
       super(props);

       this.state = {
         settingsTitle: this.props.navigation.getParam('titleSettings'),
         chkEPSG: false,

       };
    }

  onPressEPSG = () => {
    this.setState({ chkEPSG: !this.state.chkEPSG });
  }

  renderVisualisationOptions() {
      return (
        <Card
          title='Координатна система'
          flexDirection='column'
        >
            <Text style={{ marginBottom: 10 }}>
              Настройки на координатната система
            </Text>
            <View style={settingsCardStyle}>
              <Text style={{ marginBottom: 10 }}>
                EPSG стандарт (децимални)
              </Text>
              <Switch
                onValueChange={this.onPressEPSG}
                value={this.state.chkEPSG}
              />
            </View>
        </Card>
  );
}

  render() {
    return (
      <View style={{ flex: 1 }}>
        <View style={{ flex: 1 }} >
          {this.renderVisualisationOptions()}
        </View>
      </View>
    );
  }
}

const styles = {
  settingsCardStyle: {
    width: '99%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    padding: 7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
  },
};

const { settingsCardStyle,
} = styles;

export { SettingsDetailScreen };
