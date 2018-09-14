import React, { Component } from 'react';
import { Alert, View, Text, TouchableOpacity } from 'react-native';
import Modal from 'react-native-modal';
import { EventRegister } from 'react-native-event-listeners';
import FontAwesome5Pro from 'react-native-vector-icons/FontAwesome5Pro';
import { Card } from 'react-native-elements';
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
  this.willFocusSubscription =
      this.props.navigation.addListener('willFocus', this.willFocusHandler);
  //лисънър при добиване на фокус, напр. при превключване от таб в таб
}

componentWillUnmount() {
  this.willFocusSubscription.remove();
}

willFocusHandler = () => {
  //Alert.alert('ExpeditionDetailsScreen', 'willFocusHandler');
  this.dataCheckID(this.state.expeditionID);
}

readExpeditionTracks = (expeditionId) => {
  //console.log(`readExpeditionTracks ID: ${expeditionId}`);
  return new Promise((resolve, reject) => {
      try {
          const expeditions = realm.objects('Expedition');
          const expedition = expeditions.filtered(`id=${expeditionId}`)[0];
          resolve(expedition.tracks);
      } catch (e) {
          reject(e);
      }
  });
}

dataCheckID(expedition) {
  //Променя състоянието в зависимост от стойностите в подадения обект
  const selectedExpedition =
    realm.objects('Expedition').filtered(`id=${expedition.toString()}`)[0];

  const tracks = [];
  const tracksCnt = selectedExpedition.tracks.length;
  for (let i = 0; i < tracksCnt; i++) {
    const track = {};
    const currTrack = selectedExpedition.tracks[i];
    track.trackName = currTrack.trackName;
    track.trackDate = getFormattedDate(currTrack.trackDate);
    console.log('track.trackDate', track.trackDate);
    track.geoLocations = currTrack.geoLocations;
    track.photos = currTrack.photos;
    track.featureId = currTrack.featureId;
    tracks.push(track);
  }

  this.setState({
    startDate: getFormattedDate(selectedExpedition.startDate),
    leaderName: selectedExpedition.leaderName,
    expeditionID: selectedExpedition.id,
    expeditionTitle: selectedExpedition.expeditionName,
    tracks
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

closeActiveExpedition() {
  Alert.alert(
		'Приключване на издирването',
		'След приключване, данните за издирването записани на това устройство ще са достъпни САМО за разглеждане !\n Моля, потвърдете.',
		[
			//{text: 'Ask me later', onPress: () => console.log('Ask me later pressed')},
			{ text: 'Cancel', onPress: () => {}, style: 'cancel' },
      {
        text: 'OK',
        onPress: () => {
          const expeditions = realm.objects('Expedition');
          const expedition = expeditions.filtered(`id=${this.state.expeditionID}`)[0];

          try {
            realm.write(() => {
              expedition.sinchronized = true;
            });
            EventRegister.emit('expeditionStateChanged', this.state.expeditionID);
          } catch (e) {
            console.log('Error', e.toString());
            Alert.alert('Грешка при приключване на издирването!',
              e.message.toString());
          }
        }
      },
    ],
    { cancelable: false }
  );
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

  // Рендва карта с инструментални бутони
  renderCardTools() {
      return (
        <Card flexDirection='row' wrapperStyle={{ justifyContent: 'space-between' }}>
          {iconBox({ light: 'light' }, 'Направи активно', 'play', 'navy', this.makeActiveExpedition.bind(this))}
          {iconBox({ light: 'light' }, 'Качи в ГИС АКБ', 'cloud-upload-alt', 'navy', () => console.log('hello'))}
          {iconBox({ light: 'light' }, 'Приключи издирване', 'archive', 'tomato', () => this.closeActiveExpedition.bind(this))}
        </Card>
      );
    }

  // Рендва карта за вход във формата за редактиране на данните за издиравне
  renderCardEditExpedition() {
      const { expeditionTitle, startDate, leaderName } = this.state;
      return (
        <Card flexDirection='column' wrapperStyle={{ justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={headerContentStyle} >
              <Text style={headerTextStyle}>{expeditionTitle}</Text>
              <Text>{ `Начало: ${startDate}`}</Text>
              <Text>{ `Ръководител: ${leaderName}`}</Text>
            </View>
            <TouchableOpacity onPress={this.toggleModal}>
              <FontAwesome5Pro
                light
                name={'pencil-alt'}
                size={30}
                color={'navy'}
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
      flex: 1,
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

const iconFAButton = (typeIcon, msgIcon, clrIcon, sizeIcon, underlayColor, onPressHandler, contStyle) => (
    <TouchableOpacity
     style={[{ padding: 3, marginRight: 7 }, contStyle]}
     onPress={onPressHandler}
    >
      <FontAwesome5Pro
        name={msgIcon}
        size={sizeIcon}
        color={clrIcon}
        {...typeIcon}
      />
    </TouchableOpacity>
  );

const iconBox = (typeIcon, textLabel, msgIcon, clrIcon, onPressHandler) => (
    <View style={styles.containerIconBox}>
      {iconFAButton(
          typeIcon,
          msgIcon,
          clrIcon,
          30,
          'rgba(0, 0, 0, .05)',
          onPressHandler,
          styles.messageIcon
         )}
      <View>
        <Text style={styles.iconLabel}> {textLabel} </Text>
      </View>
    </View>
  );

export { ExpeditionDetailsScreen };
