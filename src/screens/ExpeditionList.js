import React, { Component } from 'react';
import { TouchableOpacity, Alert, Text, View } from 'react-native';
import { ListItem, Card } from 'react-native-elements';
import FontAwesome5Pro from 'react-native-vector-icons/FontAwesome5Pro';
import { SwipeListView } from 'react-native-swipe-list-view';
import { realm } from '../components/RealmSchema';
// функция, която връща форматирана за изобразяване дата
import { getFormattedDate } from '../components/utilities';

class ExpeditionList extends Component {
  static navigationOptions = ({ navigation }) => ({
      title: navigation.getParam('headerTitle', ' Архив на издирвания'),
  });

  state = { expeditions: [], isModalVisible: false };

componentDidMount() {
  //console.log('regionCoords', this.props.regionCoords);
  //this.regionCoords = this.props.regionCoords.slice();
  //this.zoom = this.props.regionZoom;

  //this.regionCoordsDefinition();

  this.willFocusSubscription =
      this.props.navigation.addListener('willFocus', this.willFocusHandler);
}

onPressListItem = ({ item }) => {
   this.props.navigation.navigate('Details', {
      titleExpedition: item.expeditionName,
      expID: item.id,
  });
}

componentWillUnMount() {
  this.willFocusSubscription.remove();
}

willFocusHandler = () => {
  //Alert.alert('ExpeditionList', 'willFocusHandler');
  this.readAllExpeditions();
}

readAllExpeditions() {
  //console.log('read all expeditions');
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

deleteData(id) {
    console.log('delete current index:', id);
    const allExpeditions = realm.objects('Expedition');
    const currExpedition = allExpeditions.filtered(`id=${id}`)[0];
    realm.write(() => {
      realm.delete(currExpedition); // Delete current expedition from database
    this.readAllExpeditions();
    global.refToWebView.emit('clear-expedition', { payload: {} });
  }
  );
}

renderDeleteAlert(expeditionID) {
  Alert.alert(
    'Внимание!',
    'СИГУРНИ ли сте, че желаете да изтриете избраното издирване, заедно с всички данни?',
    [
      { text: 'Yes', onPress: () => { this.deleteData(expeditionID); } },
      { text: 'No', onPress: () => {}, style: 'cancel' },
    ],
    { cancelable: false }
  );
}

renderNewExpedition() {
  return (
    <TouchableOpacity
      onPress={() => {
       this.props.navigation.navigate('NewExpedition', {
          titleExpedition: 'Ново издирване',
      });
    }}
    >
      <Card flexDirection='row'>
          <View style={thumbnailContainerStyle} >
            <FontAwesome5Pro
              name={'add'}
              size={35}
              color={'tomato'}
            />
          </View>
          <View style={headerContentStyle} >
            <Text style={headerTextStyle}>{' Добавете  ново издирване '}</Text>
            <Text>{ ' Съдържа тракове, точки и други данни '}</Text>
          </View>
      </Card>
    </TouchableOpacity>
  );
}

renderListItem = ({ rowData, rowMap }) => (
      <ListItem
        containerStyle={styles.rowFront}
        title={rowData.item.expeditionName}
        subtitle={getFormattedDate(rowData.item.startDate)}
        onPress={() => this.onPressListItem(rowData)}
      />
  );

  renderListHiddenItem = ({ rowData, rowMap }) => (
      <View style={styles.rowBack}>
          <TouchableOpacity onPress={() => this.renderDeleteAlert(rowData.item.id)}>
            <FontAwesome5Pro
              light
              name={'trash-alt'}
              size={35}
              color={'tomato'}
            />
          </TouchableOpacity>
      </View>
    );

  renderExpeditions() {
      return (
        <Card
          titleStyle={{ paddingTop: 12 }}
          dividerStyle={{ height: 3, marginBottom: 2, marginLeft: 10, marginRight: 10 }}
          containerStyle={{ padding: 0, margin: 0, marginTop: 0 }}
          title='Записани издирвания: '
        >
          <SwipeListView
            useFlatList
            data={this.state.expeditions}
            renderItem={(rowData, rowMap) => this.renderListItem({ rowData, rowMap })}
            renderHiddenItem={(rowData, rowMap) => this.renderListHiddenItem({ rowData, rowMap })}
            leftOpenValue={75}
            disableLeftSwipe
            onRowOpen={(rowKey, rowMap) => {
                setTimeout(() => {
                    if (rowMap[rowKey] !== null) rowMap[rowKey].closeRow();
                }, 5000);
            }}
            keyExtractor={item => `${item.id}`}
          />
        </Card>
    );
  }

  render() {
      return (
      <View>
        {this.renderExpeditions()}
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
    marginTop: 10,
    marginBottom: 10,
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
  },
  rowFront: {
    backgroundColor: 'white',
  },
  rowBack: {
    alignItems: 'center',
    backgroundColor: 'antiquewhite',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 15,
  },
};

const { headerContentStyle,
        thumbnailContainerStyle,
        headerTextStyle,
        headerViewStyle
} = styles;

export { ExpeditionList };
