import React, { Component } from 'react';
import { Container,
          Content, View,
          Header, Body, Title, Subtitle,
          Button,
          Spinner, DatePicker,
          Form, Item, Input, Label, Text } from 'native-base';

class FormExpedition extends Component {
  state = { expeditionTitle: 'Име на експедицията',
            leaderName: '',
            dateStart: '',
            regionCoordinates: '',
            regionFeatures: '',
            error: '',
            loading: false };

  onButtonPress() {
    const { expeditionTitle,
            leaderName,
            dateStart,
            regionCoordinates,
            regionFeatures } = this.state;

    this.setState({ error: '', loading: true });

    //some code to put data in db
    //this.onEditFail.bind(this);
    //this.onEditSuccess.bind(this);
  }

  onEditFail() {
    this.setState({ error: 'Record failed!', loading: false });
  }

  onEditSuccess() {
    this.setState({
      loading: false,
      error: ''
    });
  }

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
