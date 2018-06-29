import React, { PureComponent } from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import { Card, CardSection } from './common';

class FlatListCard extends PureComponent {
  onButtonPress = () => {
    this.props.onPressItem(this.props.id);
  };

  render() {
    const textColor = this.props.selected ? 'red' : 'black';
    const { trackDate } = this.props.track;
    const trackName = `Трак ${this.props.id + 1}`;

    return (
      <TouchableOpacity onPress={this.onButtonPress}>
        <Card>
          <CardSection>
              <View style={styles.headerContentStyle} >
                <Text style={{ color: textColor, fontSize: 18 }}>{trackName}</Text>
                <Text>{trackDate}</Text>
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
