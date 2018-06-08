import React from 'react';
import { Text, View, Image, TouchableOpacity } from 'react-native';
import { Card, CardSection } from './common';

const ExpeditionCard = ({ expedition, navigation }) => {
  const { id, name } = expedition;
  const { thumbnailStyle,
          headerContentStyle,
          thumbnailContainerStyle,
          headerTextStyle,
  } = styles;

  return (
    <TouchableOpacity
    onPress={() => {
               navigation.navigate('Details', {
                  titleExpedition: name,
              });
            }}
    >
      <Card>
        <CardSection>
          {//<View style={thumbnailContainerStyle} >
          //  <Image style={thumbnailStyle} source={{ uri: thumbnail_image }} />
          //</View>
          }
          <View style={headerContentStyle} >
            <Text style={headerTextStyle}>{name}</Text>
            <Text>{id}</Text>
          </View>
        </CardSection>
      </Card>
    </TouchableOpacity>
  );
};

const styles = {
  headerContentStyle: {
    flexDirection: 'column',
    justifyContent: 'space-around'
  },
  headerTextStyle: {
    fontSize: 18
  },
  thumbnailStyle: {
    height: 50,
    width: 50
  },
  thumbnailContainerStyle: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
    marginRight: 10
  }
};

export default ExpeditionCard;
