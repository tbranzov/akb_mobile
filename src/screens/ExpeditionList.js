import React, { Component } from 'react';
import { TouchableOpacity, Text, View, ScrollView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Card, CardSection } from '../components/common';
import { SwipableExpeditionCard } from '../components/SwipableExpeditionCard';
import { realm } from '../components/RealmSchema';

class ExpeditionList extends Component {
  static navigationOptions = ({ navigation }) => ({
      title: navigation.getParam('headerTitle', 'Издирвания'),
  });

  state = { expeditions: [], isModalVisible: false };

componentDidMount() {
  //console.log('regionCoords', this.props.regionCoords);
  //this.regionCoords = this.props.regionCoords.slice();
  //this.zoom = this.props.regionZoom;

  //this.regionCoordsDefinition();

  this.willFocusSubscription();
}

componentWillUnMount() {
  this.willFocusSubscription.remove();
}

willFocusSubscription = () => {
    this.props.navigation.addListener(
    'willFocus',
    () => { this.readAllExpeditions(); }
  );
}

readAllExpeditions() {
  console.log('read all expeditions');
  return new Promise((resolve, reject) => {
    try {
      const expeditions = realm.objects('Expedition').sorted('id', true);
      console.log('expeditions:', expeditions);
      this.setState({ expeditions });
      resolve(true);
    } catch (e) {
      console.log(e);
      reject(e);
    }
  });
}

  renderNewExpedition() {
    return (
      <TouchableOpacity
        onPress={() => {
         this.props.navigation.navigate('Details', {
            titleExpedition: 'Ново издирване',
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
              <Text>{ ' Съдържа тракове, точки и други данни '}</Text>
            </View>
          </CardSection>
        </Card>
      </TouchableOpacity>
    );
  }

  renderExpeditions() {
    return this.state.expeditions.map(expedition =>
      <SwipableExpeditionCard
        key={expedition.id}
        expedition={expedition}
        navigation={this.props.navigation}
        fieldChange={this.readAllExpeditions.bind(this)}
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
