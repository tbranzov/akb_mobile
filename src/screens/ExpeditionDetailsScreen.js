import React, { Component } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Modal from 'react-native-modal';
import { EventRegister } from 'react-native-event-listeners';
import Icon from 'react-native-vector-icons/Ionicons';
import { Card, Button } from 'react-native-elements';
import { MultiSelectList } from '../components/MultiSelectList';
import { FormExpedition } from '../components/FormExpedition';
// функция, която връща следващ идентификатор за запис в базата
import { realm } from '../components/RealmSchema';
// функция, която връща форматирана за изобразяване дата
import { getFormattedDate } from '../components/utilities';


// props, които се подават на компонента през react-navigation:
// this.props.navigation.getParam(expID) - ID на издирването в базата
// this.props.navigation.getParam(titleExpedition) -  името на издирването


class ExpeditionDetailsScreen extends Component {
  // Текстът-заглавие в навигационната лента (горе на екрана)
  static navigationOptions = ({ navigation }) => ({
      title: navigation.getParam('titleExpedition', 'Изберете издирване'),
    });

  constructor(props) {
     super(props);

     this.state = { expeditionTitle: this.props.navigation.getParam('titleExpedition'),
               startDate: '',
               leaderName: '',
               recordMode: 2,
               expeditionID: this.props.navigation.getParam('expID'),
               tracks: [],
               isModalVisible: false
     };
  }

componentDidMount() {
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

  this.willFocusSubscription =
      this.props.navigation.addListener('willFocus', this.willFocusHandler);
  //лисънър при добиване на фокус, напр. при превключване от таб в таб
}

componentWillUnmount() {
  this.willFocusSubscription.remove();
}

willFocusHandler = () => {
   this.dataCheckID(this.state.expeditionID);
}

dataCheckID(expedition) {
    //Променя състоянието в зависимост от стойностите в подадения обект
    const selectedExpedition =
      realm.objects('Expedition').filtered(`id=${expedition.toString()}`)[0];
    this.setState({ startDate: getFormattedDate(selectedExpedition.startDate),
                    leaderName: selectedExpedition.leaderName,
                    expeditionID: selectedExpedition.id,
                    expeditionTitle: selectedExpedition.expeditionName,
     });
}

toggleModalwithDataCheck(expRec) {
    if (expRec) { // ако е подаден аргумент прави проверка на полето данни и ререндва
        this.dataCheckID(expRec);
    }

    this.toggleModal();
}

makeActiveExpedition() {
      global.activeExpedition = this.state.expeditionID;
      // Указва избраната експедиция като активна
      EventRegister.emit('expeditionStateChanged', this.state.expeditionID);
      this.props.navigation.navigate('SingleExpedition', {
         titleExpedition: this.state.expeditionName,
         expID: this.state.expeditionID,
     });
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
      />
  );
}

// Рендва карта за зареждане на фичърите от региона
renderCardTools() {
   return (
     <Card flexDirection='row' wrapperStyle={{ justifyContent: 'space-between' }}>
       {iconBox('Направи активна', 'ios-bookmarks', 'navy', this.makeActiveExpedition.bind(this))}
       {iconBox('Качи в АКБ', 'ios-cloud-upload', 'navy')}
       {iconBox('Запази промените', 'ios-archive', 'navy')}
     </Card>
   );
 }

// Рендва карта за вход във формата за редактиране на данните за издиравне
renderCardEditExpedition() {
    const { expeditionTitle, startDate, leaderName } = this.state;
    return (
      <Card flexDirection='column' wrapperStyle={{ justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
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
        </View>
      </Card>
    );
  }

renderTracks() {
    if (this.state.tracks) {
      return (
        <Card
          titleStyle={{ paddingTop: 12 }}
          dividerStyle={{ marginBottom: 2, marginLeft: 5, marginRight: 5 }}
          containerStyle={{ alignItems: 'center', padding: 0, margin: 0, marginTop: 15 }}
          title='Записани тракове и точки: '
        >
          <MultiSelectList data={this.state.tracks} />
        </Card>
      );
    }
  }

renderSelectedExpedition() {
    return (
      <View>
        <View>
          {this.renderCardEditExpedition()}
        </View>
        <View>
          {this.renderCardTools()}
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

render() {
      return (
        this.renderSelectedExpedition()
    );
  }
}

const styles = {
  container: {
     flex: 1,
     flexDirection: 'column',
     alignItems: 'center',
     justifyContent: 'center',
     backgroundColor: 'white',
     margin: 0,
     padding: 0
   },
   containerButton: {
    width: '90%',
    marginTop: 20,
    marginBottom: 20,
  },
  headerMessage: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'darkslategrey',
  },
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


const iconBox = (textLabel, msgIcon, clrIcon, onPressHandler) => (
   <View style={styles.containerIconBox}>
     <View>
       <Icon
         name={msgIcon}
         size={40}
         type='ionicon'
         color={clrIcon}
         iconStyle={styles.messageIcon}
         onPress={onPressHandler}
       />
     </View>
     <View>
       <Text style={styles.iconLabel}> {textLabel} </Text>
     </View>
   </View>
 );

export { ExpeditionDetailsScreen };
