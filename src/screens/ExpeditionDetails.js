import React, { Component } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Modal from 'react-native-modal';
import Icon from 'react-native-vector-icons/Ionicons';
import { Card } from 'react-native-elements';
import { MultiSelectList } from '../components/MultiSelectList';
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
// макетна структура с примерни данни за тест на тракове и точки
// да се изтрие при внедряване върху устройство
  const dummyGL1 = {
      coordinates: [57.15, 43.12, 67.18, 23.31],
      accuracy: 5,
  };
  const dummyGL2 = {
      coordinates: [47.15, 33.12, 57.18, 13.31],
      accuracy: 8,
  };
  this.setState({
    tracks: [
      { trackName: 'Трак 1',
        trackDate: '2017/12/18',
        geoLocations: dummyGL1 },
        { trackName: 'Трак 2',
          trackDate: '2016/12/19',
          geoLocations: dummyGL2 },
          { trackName: 'Трак 3',
            trackDate: '2017/12/20',
            geoLocations: dummyGL1 },
            { trackName: 'Трак 4',
              trackDate: '2016/12/21',
              geoLocations: dummyGL2 },
              { trackName: 'Трак 5',
                trackDate: '2017/12/22',
                geoLocations: dummyGL1 },
                { trackName: 'Трак 6',
                  trackDate: '2016/12/23',
                  geoLocations: dummyGL2 },
    ]
  });
  // макетна структура за тест на тракове и точки
  // да се изтрие при внедряване върху устройство

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
      <Card flexDirection='row' wrapperStyle={{ justifyContent: 'space-between' }}>
          <View style={thumbnailContainerStyle} >
            <Icon
              name={'ios-bookmark'}
              md={'md-bookmark'}
              size={50}
              color={'navy'}
            />
          </View>
          <View style={headerContentStyle} >
            <Text style={headerTextStyle}>{expeditionTitle}</Text>
            <Text>{ `Начало: ${startDate}`}</Text>
            <Text>{ `Ръководител: ${leaderName}`}</Text>
          </View>
          <TouchableOpacity onPress={this.toggleModal}>
            <Icon
              name={'ios-more'}
              md={'md-more'}
              size={50}
              color={'tomato'}
            />
          </TouchableOpacity>
      </Card>
    );
  }

renderTracks() {
    if (this.state.tracks) {
      return (
        <Card
          titleStyle={{ paddingTop: 12 }}
          dividerStyle={{ marginBottom: 2, marginLeft: 10, marginRight: 10 }}
          containerStyle={{ padding: 0, margin: 0, marginTop: 15 }}
          title='Записани тракове: '
        >
          <MultiSelectList data={this.state.tracks} />
        </Card>
      );
    }
  }

render() {
      return (
        <View>
           <View>
             {this.renderCardEditExpedition()}
           </View>
           <View>
             {this.renderTracks()}
           </View>
           <View>
             <Modal
             isVisible={this.state.isModalVisible}
             onModalHide={() => this.renderTracks()}
             >
               {this.renderModalEditExpedition()}
             </Modal>
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
