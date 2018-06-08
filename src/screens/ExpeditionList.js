import axios from 'axios';
import React, { Component } from 'react';
import { TouchableOpacity, Text, View, ScrollView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Card, CardSection } from '../components/common';
import ExpeditionCard from '../components/ExpeditionCard';

class ExpeditionList extends Component {

  static navigationOptions = ({ navigation }) => ({
      title: navigation.getParam('headerTitle', 'Издирвания'),
    });

  state = { expeditions: [] };

  componentWillMount() {
    axios.get('https://rallycoding.herokuapp.com/api/music_albums')
      .then(response => this.setState({ expeditions: response.data }));
  }

  renderNewExpedition() {
    return (
      <TouchableOpacity
        onPress={() => {
         this.props.navigation.navigate('Details', {
            titleExpedition: 'Нова експедиция',
        });
      }}
      >
        <Card>
          <CardSection>
            <View style={thumbnailContainerStyle} >
              <Ionicons name={'ios-add'} size={50} color={'tomato'} />
            </View>
            <View style={headerContentStyle} >
              <Text style={headerTextStyle}>{' Добавете издирване '}</Text>
              <Text>{ ' Съдържа тракове и други данни '}</Text>
            </View>
          </CardSection>
        </Card>
      </TouchableOpacity>
    );
  }

  renderExpeditions() {
    return this.state.expeditions.map(expedition =>
      <ExpeditionCard
        key={expedition.title}
        expedition={expedition}
        navigation={this.props.navigation}
      />);
  }

  render() {
      return (
      <View>
        {this.renderNewExpedition()}
        <View style={headerViewStyle}>
          <Text style={headerTextStyle}>{' Записани издирвания: '}</Text>
        </View>
        <ScrollView>
            {this.renderExpeditions()}
        </ScrollView>
      </View>
    );
  }
}

const styles = {
  headerContentStyle: {
    flexDirection: 'column',
    justifyContent: 'space-around'
  },
  headerViewStyle: {
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
    height: 45,
    paddingTop: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    elevation: 2,
    position: 'relative'
  },
  headerTextStyle: {
    fontSize: 18
  },
  thumbnailStyle: {
    height: 50,
    width: 50
  },
  coverStyle: {
    height: 300,
    flex: 1,
    width: null
  },
  thumbnailContainerStyle: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
    marginRight: 15
  }
};

const { headerContentStyle,
        thumbnailContainerStyle,
        headerTextStyle,
        headerViewStyle
} = styles;

export { ExpeditionList };
