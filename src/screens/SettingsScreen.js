import React, { Component } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Card, Avatar, List, ListItem } from 'react-native-elements';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

class SettingsScreen extends Component {
  // Текстът-заглавие в навигационната лента (горе на екрана)
  static navigationOptions = ({ navigation }) => ({
      title: 'Настройки'
    });

    onPressMap = () => {
      this.props.navigation.navigate('SettingsDetail', {
         titleSettings: 'Настройки на картата',
     });
    }

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

  renderVisualisationOptions() {
      const list = [
        {
          title: 'Карта',
          icon: 'globe',
          handler: this.onPressMap
        },
        {
          title: 'Test',
          icon: 'lightbulb-o',
          handler: () => {}
        },
      ];
      return (
        <Card title='Визуализация'>
          <View style={{ flexDirection: 'column', justifyContent: 'space-between' }}>
            <Text style={{ marginBottom: 10 }}>
              Настройки на параметри свързани с визуализацията на данни и друга информация в приложението.
            </Text>
            <List>
              {
                list.map((item) => (
                  <ListItem
                    key={item.title}
                    title={item.title}
                    leftIcon={{ name: item.icon, type: 'font-awesome' }}
                    onPress={item.handler}
                  />
                ))
              }
            </List>
          </View>
        </Card>
  );
}

  render() {
    return (
      <View>
        <View>
          {this.renderVisualisationOptions()}
        </View>
      </View>
    );
  }
}

const styles = {
  headerContentStyle: {
    flexDirection: 'column',
    justifyContent: 'space-around'
  },
  headerTextStyle: {
    fontSize: 16
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
