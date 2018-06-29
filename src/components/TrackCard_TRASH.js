import React from 'react';
import { Card, CardItem, Text, Body } from 'native-base';


const TrackCard = ({ id, track, navigation }) => {
  const { trackName, trackDate } = track;

  return (
      <Card>
        <CardItem bordered>
          <Body>
            <Text>{trackName}</Text>
          </Body>
        </CardItem>
        <CardItem footer bordered>
          <Text>{trackDate}</Text>
        </CardItem>
      </Card>
  );
};


export { TrackCard };
