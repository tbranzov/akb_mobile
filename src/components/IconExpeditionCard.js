import React, { Component } from 'react';
import { Text, View, Image, TouchableOpacity, LayoutAnimation } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Card, CardSection } from './common';

class IconExpeditionCard extends Component {
  state = { expanded: false };

  ComponentWillUpdate() {
    LayoutAnimation.spring();
  }

  toggle() {
    this.setState({
        expanded: !this.state.expanded
    });
  }

  render() {
      const { title, artist, thumbnail_image } = this.props.expedition;

      if (this.state.expanded) {
        return (
          <TouchableOpacity onPress={this.toggle.bind(this)} >
            <Card>
              <CardSection>
                <View style={thumbnailContainerStyle} >
                  <Image
                    style={thumbnailStyle}
                    source={{ uri: thumbnail_image }}
                  />
                </View>
                <View style={headerContentStyle} >
                  <Text style={headerTextStyle}>{title}</Text>
                  <Text>{artist}</Text>
                </View>
                <View style={thumbnailContainerStyle} >
                  <Ionicons name={'ios-add'} size={50} color={'tomato'} />
                </View>
              </CardSection>
            </Card>
          </TouchableOpacity>
        );
      }

      return (
        <TouchableOpacity onPress={this.toggle.bind(this)} >
          <Card>
            <CardSection>
              <View style={thumbnailContainerStyle} >
                <Image style={thumbnailStyle} source={{ uri: thumbnail_image }} />
              </View>
              <View style={headerContentStyle} >
                <Text style={headerTextStyle}>{title}</Text>
                <Text>{artist}</Text>
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
    marginLeft: 4,
    marginRight: 15
  }
};

const { thumbnailStyle,
        headerContentStyle,
        thumbnailContainerStyle,
        headerTextStyle,
} = styles;

export { IconExpeditionCard };
