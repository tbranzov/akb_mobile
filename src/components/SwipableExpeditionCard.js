import React, { Component } from 'react';
import { Alert } from 'react-native';
import { View, Thumbnail, SwipeRow, Text, Icon, Button, H3 } from 'native-base';
import { getFormattedDate } from '../components/utilities';

// props, които се подават на компонента:
// this.props.key - expeditionID - ID на експедицията в базата
// this.props.expedition - expedition обекта от базата
// this.props.navigation - референция към навигатора на компонента, който е извикал

class SwipableExpeditionCard extends Component {
  state = { expanded: false };

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
                <Button danger onPress={() => { Alert.alert('You tapped the button!'); }}>
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
