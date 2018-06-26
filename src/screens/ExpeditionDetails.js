import React, { Component } from 'react';
import { View, Text } from 'react-native';
import Modal from 'react-native-modal';
import { Container, Content, Button, Icon } from 'native-base';
import { Card, CardSection } from '../components/common';
import { FormExpedition } from '../components/FormExpedition';
// функция, която връща следващ идентификатор за запис в базата
import { NewExpeditionID } from '../components/RealmSchema';
// функция, която връща форматирана за изобразяване дата
import { getFormattedDate } from '../components/utilities';


// props, които се подават на компонента през react-navigation:
// this.props.navigation.getParam(expeditionID) - ID на издирването в базата
// this.props.navigation.getParam(objExpedition) - обект, според схемата,
//                            съдържащ издирване със съответното ID
// this.props.navigation.getParam(titleExpedition) -  името на издирването


class ExpeditionDetails extends Component {
  // Текстът-заглавие в навигационната лента (горе на екрана)
  static navigationOptions = ({ navigation }) => ({
      title: navigation.getParam('titleExpedition', 'Ново издирване'),
    });

  state = { expeditionTitle: '',
            startDate: '',
            leaderName: '',
            recordMode: '',
            expeditionID: '',
            tracks: [],
            isModalVisible: false };

componentDidMount() {
  const titleExpedition = this.props.navigation.getParam('titleExpedition', 'Ново издирване');

  if (titleExpedition === 'Ново издирване') {
    //expeditionID: NewExpeditionID() // взема следващ идентификатор за запис в базата
    this.setState({ expeditionID: NewExpeditionID(),
                    recordMode: 1,
                    expeditionTitle: 'Ново издирване'
     });
  } else {
    const expedition = this.props.navigation.getParam('objExpedition');
    //Поема обект от типа Expedition, подаден за редакция на запис в базата
    this.dataCheck(expedition);
  }
}

dataCheck(expedition) {
    //Променя състоянието в зависимост от стойностите в подадения обект
    this.setState({ startDate: getFormattedDate(expedition.startDate),
                    leaderName: expedition.leaderName,
                    expeditionID: expedition.id,
                    expeditionTitle: expedition.expeditionName,
                    recordMode: 2,
     });
}

toggleModalwithDataCheck(expRec) {
    if (expRec) { // ако е подаден аргумент прави проверка на полето данни и ререндва
        this.dataCheck(expRec);
    }
    this.toggleModal();
}

// Превключва модален прозорец
toggleModal = () =>
  this.setState({ isModalVisible: !this.state.isModalVisible });

// Определя параметри и подава към форма за редактиране на данните
// за издирването(модален прозорец)
renderModalEditExpedition() {
    return (
      <FormExpedition
        closeModal={this.toggleModalwithDataCheck.bind(this)}
        expeditionID={this.state.expeditionID}
        recordMode={this.state.recordMode}
        regionZoom={regionZoom}
        regionCoordinates={regionCoordinates}
        regionFeatures={regionFeatures}
      />
  );
}

// Рендва карта за вход във формата за редактиране на данните за издиравне
renderCardEditExpedition() {
    const { expeditionTitle, startDate, leaderName } = this.state;
    return (
      <Card>
        <CardSection style={{ justifyContent: 'space-between' }}>
          <View style={thumbnailContainerStyle} >
            <Icon
              ios='ios-bookmark'
              android='md-bookmark'
              style={{ fontSize: 50, color: 'navy' }}
            />
          </View>
          <View style={headerContentStyle} >
            <Text style={headerTextStyle}>{expeditionTitle}</Text>
            <Text>{ `Начало: ${startDate}`}</Text>
            <Text>{ `Ръководител: ${leaderName}`}</Text>
          </View>
          <Button transparent onPress={this.toggleModal}>
            <Icon
              ios='ios-more'
              android='md-more'
              style={{ fontSize: 50, color: 'tomato' }}
            />
          </Button>
        </CardSection>
      </Card>
    );
  }

renderTracks() {
    if (this.state.tracks) {
      //return this.state.tracks.map(track =>
        //<SwipableExpeditionCard
        //  key={track.id}
        //  expedition={expedition}
        //  navigation={this.props.navigation}
        ///>
      //);
    }
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
              {this.renderTracks()}
            </Content>
            <View>
              <Modal
              isVisible={this.state.isModalVisible}
              onModalHide={() => this.renderTracks()}
              >
                {this.renderModalEditExpedition()}
              </Modal>
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

const regionZoom = 5;
const regionCoordinates = '';
const regionFeatures = '';

const { headerContentStyle,
        thumbnailContainerStyle,
        headerTextStyle,
        headerViewStyle,
        iconContainerStyle,
        contentViewStyle
} = styles;

export { ExpeditionDetails };
