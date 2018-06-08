import axios from 'axios';
import React, { Component } from 'react';
import { View, Text } from 'react-native';
import Modal from 'react-native-modal';
import { Container, Content, Button, Icon } from 'native-base';
import { Card, CardSection } from '../components/common';
import { SwipableExpeditionCard } from '../components/SwipableExpeditionCard';
import { FormExpedition } from '../components/FormExpedition';

class ExpeditionDetails extends Component {

  static navigationOptions = ({ navigation }) => ({
      title: navigation.getParam('headerTitle', ''),
    });

  state = { expeditions: [], isModalVisible: false };

  componentWillMount() {
    axios.get('https://rallycoding.herokuapp.com/api/music_albums')
      .then(response => this.setState({ expeditions: response.data }));
  }

  toggleModal = () =>
  this.setState({ isModalVisible: !this.state.isModalVisible });

  renderModalEditExpedition() {
      return (
      <Modal isVisible={this.state.isModalVisible}>
        <FormExpedition closeModal={this.toggleModal.bind(this)} />
      </Modal>
    );
  }

  renderCardEditExpedition() {
    const title = this.props.navigation.getParam('titleExpedition', 'NO-ID');

    return (
      <Card>
        <CardSection style={{ justifyContent: 'space-between' }}>
          <View style={thumbnailContainerStyle} >
            <Icon ios='ios-bookmark' android='md-bookmark' style={{ fontSize: 50, color: 'navy' }} />
          </View>
          <View style={headerContentStyle} >
            <Text style={headerTextStyle}>{title}</Text>
            <Text>{ 'Начало: 18.05.2018 г. '}</Text>
            <Text>{ 'Ръководител: Иван Иванов '}</Text>
          </View>
          <Button transparent onPress={this.toggleModal}>
            <Icon ios='ios-more' android='md-more' style={{ fontSize: 50, color: 'tomato' }} />
          </Button>
        </CardSection>
      </Card>
    );
  }

  renderExpeditions() {
    return this.state.expeditions.map(expedition =>
      <SwipableExpeditionCard
        key={expedition.title}
        expedition={expedition}
        navigation={this.props.navigation}
      />
    );
  }

  render() {
      return (
        <Container>
            <View>
              {this.renderCardEditExpedition()}
            </View>
            <View style={headerViewStyle}>
              <Text style={headerTextStyle}>{' Записани тракове: '}</Text>
            </View>
            <Content style={contentViewStyle}>
              {this.renderExpeditions()}
            </Content>
            <View>
              {this.renderModalEditExpedition()}
            </View>
        </Container>
    );
  }
}

const styles = {
  headerContentStyle: {
    flexDirection: 'column',
    justifyContent: 'space-around'
  },
  contentViewStyle: {
    paddingTop: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    elevation: 2,
    position: 'relative'
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
    marginLeft: 8,
    marginRight: 15
  },
};

const { headerContentStyle,
        thumbnailContainerStyle,
        headerTextStyle,
        headerViewStyle,
        iconContainerStyle,
        contentViewStyle
} = styles;

export { ExpeditionDetails };
