import React, { PureComponent } from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import { Card, CardSection } from './common';
import { getType, getFormattedDate } from '../components/utilities';

class FlatListCard extends PureComponent {
  onButtonPress = () => {
    this.props.onPressItem(this.props.id);
  };

  render() {
    const textColor = this.props.selected ? 'red' : 'black';
    const trackName = `Трак ${this.props.id + 1}`;
    const trackDate = this.props.track.trackDate;
    let trackDateStr;
    if (getType(trackDate) === 'Date') {
      trackDateStr = getFormattedDate(this.props.track.trackDate);
    } else {
      trackDateStr = trackDate;
    }

    return (
      <TouchableOpacity onPress={this.onButtonPress}>
        <Card>
          <CardSection>
              <View style={styles.headerContentStyle} >
                <Text style={{ color: textColor, fontSize: 18 }}>{trackName}</Text>
                <Text>{trackDateStr}</Text>
              </View>
          </CardSection>
        </Card>
      </TouchableOpacity>
    );
  }
}

const styles = {
  headerContentStyle: {
    flexDirection: 'column',
    justifyContent: 'space-around'
  },
};

export { FlatListCard };
