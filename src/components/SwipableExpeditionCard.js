import React, { Component } from 'react';
import { Alert } from 'react-native';
import { View, SwipeRow, Text, Icon, Button, H3 } from 'native-base';
import { getFormattedDate } from '../components/utilities';
import { realm } from '../components/RealmSchema';

// props, които се подават на компонента:
// * this.props.key - expeditionID - ID на експедицията в базата
// * this.props.expedition - expedition обекта от базата
// * this.props.navigation - референция към навигатора на компонента, който е извикал
// * this.props.fieldChange от екрана със списъка с издирванията
//      - изчита отново списъка с експедициите от базата и ререндва

class SwipableExpeditionCard extends Component {
  state = { expanded: false };

  deleteData(id) {
      console.log('delete current index:', id);
      const allExpeditions = realm.objects('Expedition');
      const currExpedition = allExpeditions.filtered(`id=${id}`)[0];
      realm.write(() => {
        realm.delete(currExpedition); // Delete current expedition from database
      this.props.fieldChange();
    }
    );
  }

  renderDeleteAlert() {
    Alert.alert(
      'Внимание!',
      'СИГУРНИ ли сте, че желаете да изтриете избраното издирване, заедно с всички данни?',
      [
        //{text: 'Ask me later', onPress: () => console.log('Ask me later pressed')},
        { text: 'Yes', onPress: () => { this.deleteData(this.props.expedition.id); } },
        { text: 'No', onPress: () => {}, style: 'cancel' },
      ],
      { cancelable: false }
    );
  }

  render() {
      const { expeditionName, leaderName, startDate, id } = this.props.expedition;

      return (
            <SwipeRow
              leftOpenValue={75}
              rightOpenValue={-75}

              left={
                <Button
                success
                onPress={() => {
                   this.props.navigation.navigate('Details', {
                      titleExpedition: expeditionName,
                      expID: id,
                      objExpedition: this.props.expedition,
                  });
                }}
                >
                  <Icon active name="add" />
                </Button>
              }
              body={
                <View style={containerStyle}>
                  <View style={columnStyle}>
                    <H3>{getFormattedDate(startDate)}</H3>
                  </View>
                  <View style={columnStyle}>
                    <H3>{expeditionName}</H3>
                    <Text>{leaderName}</Text>
                  </View>
                </View>
              }
              right={
                <Button danger onPress={() => this.renderDeleteAlert()}>
                  <Icon active name="trash" />
                </Button>
              }
            />
      );
  }
}

const styles = {
  containerStyle: {
    padding: 5,
    backgroundColor: '#fff',
    justifyContent: 'flex-start',
    flexDirection: 'row',
    position: 'relative'
  },
  columnStyle: {
    padding: 5,
    backgroundColor: '#fff',
    justifyContent: 'flex-start',
    flexDirection: 'column',
    position: 'relative'
  },
};

const { containerStyle,
        columnStyle,
} = styles;

export { SwipableExpeditionCard };
