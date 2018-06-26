import React, { Component } from 'react';
import { Container,
          Content, View,
          Header, Body, Title, Subtitle,
          Button,
          Spinner, DatePicker,
          Form, Item, Input, Label, Text } from 'native-base';
import Realm from 'realm';
import { realm } from '../components/RealmSchema';

// props, които се подават на компонента:
// this.props.expeditionID - ID на експедицията в базата
// this.props.recordMode - 1 за нов запис, 2 за редакция на съществуващ
// this.props.regionZoom - zoom level, 'double'
// this.props.regionCoordinates -  'string'
// this.props.regionFeatures - 'string'
// this.props.closeModal -  затваря модалния прозорец

class FormExpedition extends Component {
  state = { expeditionTitle: '',
            leaderName: '',
            dateStart: '',
            numberOfDays: '',
            regionCoordinates: '',
            regionFeatures: '',
            regionDescription: '',
            dataMode: '',
            dataChanged: false,
            error: '',
            loading: false };

  componentDidMount() {
    if (this.props.recordMode === 2) {
      try {
        const currExpedition =
        realm.objects('Expedition').filtered(`id=${this.props.expeditionID.toString()}`)[0];
        this.setState({ error: '',
                        loading: false,
                        expeditionTitle: currExpedition.expeditionName,
                        leaderName: currExpedition.leaderName,
                        dateStart: currExpedition.startDate,
                        numberOfDays: parseInt(currExpedition.days, 10),
                        regionDescription: currExpedition.regionDescription,
                       });
      } catch (e) {
        console.log(e);
      }
    }
  }

  onButtonPress() {
    const { expeditionTitle,
            leaderName,
            dateStart,
            numberOfDays,
           } = this.state;

    const { expeditionID,
            recordMode,
            regionCoordinates,
            regionFeatures,
            regionZoom } = this.props;

    const expeditionData = { expeditionID,
                            expeditionTitle,
                            leaderName,
                            dateStart,
                            numberOfDays,
                            regionCoordinates,
                            regionFeatures,
                            regionZoom };

    this.setState({ error: '', loading: true });
    this.saveExpedition(expeditionData, recordMode);

    //some code to put data in db
    //this.onEditFail.bind(this);
    //this.onEditSuccess.bind(this);
  }

  onChangeData() {
    this.setState({ dataChanged: true });
  }

  onEditFail() {
    this.setState({ error: 'Record failed!', loading: false });
  }

  onEditSuccess(expData) {
    this.setState({
      loading: false,
      error: ''
    });
    this.props.closeModal(expData);
  }

  saveExpedition = (expeditionData, recordMode) =>
  new Promise((resolve, reject) => {
    const { expeditionID,
                  expeditionTitle,
                  leaderName,
                  dateStart,
                  numberOfDays,
                  regionCoordinates,
                  regionFeatures,
                  regionZoom,
                  regionDescription } = expeditionData;

    if (recordMode === 1) { //  нов запис
      const expeditionRec = {};
      const dbVersions = realm.objects('AKBdbVersions');
      expeditionRec.dbVersionIndexAKB = dbVersions.length - 1;
      //При нова експедиция винаги трябва да се ползва последната версия на базата
      expeditionRec.regionCoordinates = JSON.stringify(regionCoordinates);
      expeditionRec.regionZoom = regionZoom;
      expeditionRec.regionFeatures = regionFeatures;
      expeditionRec.id = expeditionID;
      expeditionRec.expeditionName = expeditionTitle;
      expeditionRec.leaderName = leaderName;
      expeditionRec.startDate = new Date(dateStart);
      expeditionRec.days = parseInt(numberOfDays, 10);
      expeditionRec.regionDescription = regionDescription;
      expeditionRec.tracks = [];
      expeditionRec.checkPoints = [];
      expeditionRec.sinchronized = false;

        try {
          realm.write(() => {
            realm.create('Expedition', expeditionRec);
          });
          resolve(this.onEditSuccess(expeditionRec));
            } catch (e) {
              reject(this.onEditFail());
        }
      } else { // редакция на съществуващ запис
        try {
          const currExpedition =
          realm.objects('Expedition').filtered(`id=${expeditionID.toString()}`)[0];
          realm.write(() => {
            currExpedition.expeditionName = expeditionTitle;
            currExpedition.leaderName = leaderName;
            currExpedition.startDate = new Date(dateStart);
            currExpedition.days = parseInt(numberOfDays, 10);
            currExpedition.regionDescription = regionDescription;
          });
          resolve(this.onEditSuccess(currExpedition));
        } catch (e) {
          reject(e);
        }
      }
  })

  renderButton() {
    if (this.state.loading) {
      return <Spinner color='blue' />;
    }

      return (
        <View style={buttonRowStyle}>
          <Button bordered primary onPress={this.onButtonPress.bind(this)}>
            <Text> Запиши </Text>
          </Button>
          <Button bordered danger onPress={() => this.props.closeModal()}>
            <Text> Откажи </Text>
          </Button>
        </View>
      );
  }

  render() {
    return (
      <Container style={containerStyle}>
        <Header>
          <Body>
            <Title>{this.state.expeditionTitle}</Title>
            <Subtitle>Редактирайте данните</Subtitle>
          </Body>
        </Header>
        <Content>
          <Form>
            <Item floatingLabel>
              <Label>Име на експедицията</Label>
              <Input
                value={this.state.expeditionTitle}
                onChangeText={expeditionTitle => this.setState({ expeditionTitle })}
              />
            </Item>
            <Item floatingLabel last>
            <Label>Ръководител</Label>
            <Input
              value={this.state.leaderName}
              onChangeText={leaderName => this.setState({ leaderName })}
            />
            </Item>
            <Item stackedLabel>
              <Label>Начална дата:</Label>
              <Input
                value={this.state.dateStart}
                onChangeText={dateStart => this.setState({ dateStart })}
              />
            </Item>
            <Item fixedLabel last>
              <Label>{this.props.regionCoordinates}</Label>
              <Label>{this.props.regionFeatures}</Label>
            </Item>
          </Form>


          <Text>
            {this.state.error}
          </Text>
        </Content>

        <Content>
          {this.renderButton()}
        </Content>

      </Container>
     );
  }

}

const styles = {
  containerStyle: {
    backgroundColor: '#F8F8F8',
    padding: 5,
  },
  buttonRowStyle: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 5,
  },
};

const { containerStyle,
        buttonRowStyle,
} = styles;

export { FormExpedition };
