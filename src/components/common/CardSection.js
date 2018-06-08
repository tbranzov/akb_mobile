import React, { Component } from 'react';
import { View } from 'react-native';

class CardSection extends Component {

render() {
    return (
      <View style={[styles.containerStyle, this.props.style]}>
        {this.props.children}
      </View>
    );
  }
}

const styles = {
  containerStyle: {
    borderBottomWidth: 2,
    padding: 5,
    backgroundColor: '#fff',
    justifyContent: 'flex-start',
    flexDirection: 'row',
    borderColor: '#ddd',
    position: 'relative'
  }
};

export { CardSection };
