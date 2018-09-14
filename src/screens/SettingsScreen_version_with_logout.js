import React, { Component } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Card, Avatar } from 'react-native-elements';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

class SettingsScreen extends Component {
  // Текстът-заглавие в навигационната лента (горе на екрана)
  static navigationOptions = ({ navigation }) => ({
      title: 'Настройки'
    });

    renderCardLogin() {
        return (
          <Card flexDirection='column' wrapperStyle={{ justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Avatar
                medium
                rounded
                icon={{ name: 'user', type: 'font-awesome' }}
                onPress={() => {}}
                activeOpacity={0.7}
              />
              <View style={headerContentStyle} >
                <Text style={headerTextStyle}>Вход в ГИС-АКБ:</Text>
                <Text>{ `developer@naim.bg `} { /* !!! Да се обвърже с автентицирания потребител */}</Text>
              </View>
              <TouchableOpacity onPress={() => {}}>
                <FontAwesome5
                  name={'sign-out-alt'}
                  style={activeIcon}
                  solid
                />
              </TouchableOpacity>
            </View>
          </Card>
    );
  }

  renderVisualisationOption() {
      return (
        <Card flexDirection='column' wrapperStyle={{ justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Avatar
              medium
              rounded
              icon={{ name: 'user', type: 'font-awesome' }}
              onPress={() => {}}
              activeOpacity={0.7}
            />
            <View style={headerContentStyle} >
              <Text style={headerTextStyle}>Вход в ГИС-АКБ:</Text>
              <Text>{ `developer@naim.bg `} { /* !!! Да се обвърже с автентицирания потребител */}</Text>
            </View>
            <TouchableOpacity onPress={() => {}}>
              <FontAwesome5
                name={'sign-out-alt'}
                style={activeIcon}
                solid
              />
            </TouchableOpacity>
          </View>
        </Card>
  );
}

  render() {
    return (
      <View>
        <View>
          {this.renderCardLogin()}
        </View>
        <View>
          {this.renderVisualisationOptions()}
        </View>
      </View>
    );
  }
}

const styles = {
  containerIconBox: {
     flexDirection: 'column',
     alignItems: 'center',
     justifyContent: 'center',
     margin: 4,
     padding: 4
   },
   messageIcon: {
     padding: 4,
     margin: 2,
   },
   iconLabel: {
     fontSize: 10,
     color: 'darkslategrey',
   },
  headerContentStyle: {
    flexDirection: 'column',
    justifyContent: 'space-around'
  },
  headerTextStyle: {
    fontSize: 16
  },
  thumbnailStyle: {
    height: 50,
    width: 50
  },
  activeIcon: {
      fontSize: 50,
      height: 50,
      color: 'tomato',
    },
  inactiveIcon: {
      fontSize: 50,
      height: 50,
      color: 'gray',
    },
};

const { headerContentStyle,
        headerTextStyle,
        activeIcon,
} = styles;

export { SettingsScreen };
