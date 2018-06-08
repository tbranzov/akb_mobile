import React, { Component } from 'react';
import { Alert } from 'react-native';
import { View, Thumbnail, SwipeRow, Text, Icon, Button, H3 } from 'native-base';

class SwipableExpeditionCard extends Component {
  state = { expanded: false };

  render() {
      const { title, artist, thumbnail_image } = this.props.expedition;

      return (
            <SwipeRow
              leftOpenValue={75}
              rightOpenValue={-75}

              left={
                <Button success onPress={() => Alert.alert('Add')}>
                  <Icon active name="add" />
                </Button>
              }
              body={
                <View style={containerStyle}>
                  <Thumbnail square source={{ uri: thumbnail_image }} />
                  <View style={columnStyle}>
                    <H3>{title}</H3>
                    <Text>{artist}</Text>
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
