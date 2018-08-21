// props, които се подават на компонента:
// this.props.expeditionID - ID на експедицията в базата
// this.props.recordMode - 1 за нов запис, 2 за редакция на съществуващ
// this.props.regionZoom - zoom level, 'double'
// this.props.regionCoordinates -  'string'
// this.props.regionFeatures - 'string'
// this.props.closeModal -  затваря модалния прозорец

import React, { Component } from 'react';
import { Container,
          Content, View,
          Header, Body, Title, Subtitle,
          Button,
          Spinner,
          Form, Item, Input, Label, Text } from 'native-base';
import DatePicker from 'react-native-datepicker';
import { realm } from '../components/RealmSchema';

class FormExpedition extends Component {
  state = { expeditionTitle: '',
            leaderName: '',
            dateStart: '',
            numberOfDays: 1,
            //regionCoordinates: '',
            //regionFeatures: '',
            //zoom: 14,
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
                        //regionCoordinates: currExpedition.regionCoordinates,
                        //regionFeatures: currExpedition.regionFeatures,
                        //zoom: currExpedition.regionZoom
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
            //regionCoordinates,
            //regionFeatures,
            //regionZoom
          } = this.props;

    const expeditionData = { expeditionID,
                            expeditionTitle,
                            leaderName,
                            dateStart,
                            numberOfDays,
                            //regionCoordinates,
                            //regionFeatures,
                            //regionZoom
                          };

    this.setState({ error: '', loading: true });
    this.saveExpedition(expeditionData, recordMode);
  }

  onChangeData() {
    this.setState({ dataChanged: true });
  }

  onEditFail() {
    this.setState({ error: 'Record failed!', loading: false });
  }

  onEditSuccess(expID) {
    this.setState({
      loading: false,
      error: ''
    });
    this.props.closeModal(expID);
  }

  saveExpedition = (expeditionData, recordMode) =>
  new Promise((resolve, reject) => {
    const { expeditionID,
                  expeditionTitle,
                  leaderName,
                  dateStart,
                  numberOfDays,
                  //regionCoordinates,
                  //regionFeatures,
                  //regionZoom,
                  regionDescription } = expeditionData;

    if (recordMode === 1) { //  нов запис
      const expeditionRec = {};
      const dbVersions = realm.objects('AKBdbVersions');
      expeditionRec.dbVersionIndexAKB = dbVersions.length - 1;
      //При нова експедиция винаги трябва да се ползва последната версия на базата
      expeditionRec.regionCoordinates = '';// JSON.stringify(regionCoordinates);
      expeditionRec.regionZoom = 14;//regionZoom;
      expeditionRec.regionFeatures = '';//regionFeatures;
      expeditionRec.id = expeditionID;
      expeditionRec.userRole = 'member';
      expeditionRec.expeditionName = expeditionTitle;
      expeditionRec.leaderName = leaderName;
      expeditionRec.startDate = new Date(dateStart);
      expeditionRec.days = parseInt(numberOfDays, 10);
      expeditionRec.regionDescription = regionDescription;
      expeditionRec.tracks = [];
      expeditionRec.checkPoints = [];
      expeditionRec.photos = [];
      expeditionRec.sinchronized = false;

        try {
          realm.write(() => {
            realm.create('Expedition', expeditionRec);
          });
          resolve(this.onEditSuccess(expeditionID));
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
/*
          if (this.regionCoordsChanged === true) {
              currExpedition.regionCoordinates = JSON.stringify(regionCoordinates);
              currExpedition.regionZoom = regionZoom;
          }

          if (this.featuresChanged === true) {
              currExpedition.regionFeatures = regionFeatures;
          }
*/
          resolve(this.onEditSuccess(expeditionID));
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
            <Item stackedLabel>
              <Label>Име на експедицията</Label>
              <Input
                value={this.state.expeditionTitle}
                onChangeText={expeditionTitle => this.setState({ expeditionTitle })}
              />
            </Item>
            <Item stackedLabel>
            <Label>Ръководител</Label>
            <Input
              value={this.state.leaderName}
              onChangeText={leaderName => this.setState({ leaderName })}
            />
            </Item>
            <Item stackedLabel>
            <Label>Начална дата</Label>
              <DatePicker
                style={{ margin: 10, width: 200 }}
                date={this.state.dateStart}
                mode="date"
                placeholder="Избери начална дата"
                format="YYYY-MM-DD"
                minDate="1978-07-02"
                maxDate="2178-07-02"
                confirmBtnText="Потвърди"
                cancelBtnText="Отмени"
                customStyles={{
                  dateIcon: {
                    position: 'absolute',
                    left: 0,
                    top: 4,
                    marginLeft: 0
                  },
                  dateInput: {
                    marginLeft: 36
                  }
                }}
                onDateChange={dateStart => this.setState({ dateStart })}
              />
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
