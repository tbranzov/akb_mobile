import React, { Component } from 'react';
import { StyleSheet } from 'react-native';
import { Container,
          Content,
          Button,
          Form,
          Item,
          Label,
          Input, Text, Spinner } from 'native-base';
import { realm } from '../components/RealmSchema';
import { loginURL } from '../components/constants';

class ScreenLogin extends Component {
  state = { email: '', password: '', error: '', loading: false };


  onButtonPress() {
    const { email, password } = this.state;

    this.setState({ error: '', loading: true });
    console.log(`Email: ${email}`);
    console.log(`Pass: ${password}`);

		fetch(
			loginURL,
		    { method: 'POST',
          body: JSON.stringify({ 'email': email, 'password': password })
			}
		)
        .then((response) => response.json())
        .then((responseJson) => {
			///loginResponseCache = responseJson;
			//responseJson.meta.accessTokenBeginTime = (new Date()).getTime();
			if (responseJson.meta.success === true) {
					this.loginCredentials(responseJson);
          this.onLoginSuccess();
			}	else {
				console.log('Error in login after successful connection: ',
        JSON.stringify(responseJson.meta.errors));
			}
        })
		.catch((error) => {
        this.setState({ error, loading: false });
        console.log('Login POST Response', error);
		});
  }

  onLoginFail() {
    this.setState({ error: 'Authetication failed!', loading: false });
  }

  onLoginSuccess() {
    this.setState({
      email: '',
      password: '',
      loading: false,
      error: ''
    });
    this.props.navigation.navigate('App');
  }

  readCredentials = () => {
      console.log('Reading credentials from Realm database ...');
      return new Promise((resolve, reject) => {
          try {
              const credentials = realm.objects('UserCredentials');
              resolve(credentials[0]);
          } catch (e) {
              reject(e);
          }
      });
   }

   saveCredentials = (name, rt, t, ver) => {
       console.log('Saving credentials ...');
       const newCredentials = {
           userName: name,
           rt,
           t,
       };

       return new Promise((resolve, reject) => {
           try {
                 const oldCredentials = realm.objects('UserCredentials');

                 realm.write(() => {
                     realm.delete(oldCredentials); // Deletes old credentials
                 });

                 const pars = {
                     refreshToken: rt,
                     accessToken: t,
                     dbVersion: ver,
                 };

                 realm.write(() => {
                     realm.create('UserCredentials', newCredentials);
                 });
                 console.log('Parameters: ', pars);
                 resolve(pars);
               } catch (e) {
                 reject(e);
           }
       });
    }

  loginCredentials = (response) => {
        this.saveCredentials(
          response.data.user.email,
          response.data.rt,
          response.data.t,
          response.meta.version)
        .then((params) => {
            //Initialize global variables
            global.crt = params.refreshToken;
            global.ct = params.accessToken;
            global.dbVerAKB = params.dbVersion;
        })
        .catch((error) => {
            console.log('loginCredentials',
            `Error on saving new credentials!\n${error.toString()}`);
        });
  }

  renderButton() {
    if (this.state.loading) {
      return <Spinner />;
    }

      return (
        <Button bordered block onPress={this.onButtonPress.bind(this)} >
          <Text>Вход в АКБ </Text>
        </Button>
      );
  }

  render() {
    return (
      <Container style={styles.ContainerStyle}>
        <Content padder>
            <Form>
              <Item inlineLabel>
                <Label>Email: </Label>
                <Input
                  value={this.state.email}
                  autoCapitalize='none'
                  onChangeText={email => this.setState({ email })}
                />
              </Item>
              <Item inlineLabel>
                <Label>Парола: </Label>
                <Input
                  secureTextEntry
                  value={this.state.password}
                  onChangeText={password => this.setState({ password })}
                />
              </Item>
            </Form>
            <Text>
              {this.state.error}
            </Text>
            {this.renderButton()}
          </Content>
      </Container>
    );
  }
}

const styles = StyleSheet.create(
{
  ContainerStyle: {
    backgroundColor: '#fff',
  },
});

export { ScreenLogin };
