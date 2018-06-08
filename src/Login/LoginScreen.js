//https://github.com/dwicao/react-native-login-screen

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
	StyleSheet,
	Text,
	View,
	Image,
	KeyboardAvoidingView,
	TouchableOpacity,
	TextInput,
	Animated,
	Easing,
	Alert,
	Dimensions,
} from 'react-native';
//import Dimensions from 'Dimensions';

import logoImg from './images/ban-logo.png';
import spinner from './images/loading.gif';
import usernameImg from './images/username.png';
import passwordImg from './images/password.png';
import eyeImg from './images/eye_black.png';
import closedeyeImg from './images/closedeye_black.png';
import bgSrc from './images/wallpaper.png';
import arrowImg from './images/left-arrow.png';

const DEVICE_WIDTH = Dimensions.get('window').width;
const DEVICE_HEIGHT = Dimensions.get('window').height;
const MARGIN = 40;

//let loginResponseCache = {};

class ButtonSubmit extends Component {
	constructor(props) {
		super(props);

		this.state = {
			isLoading: false,
			isLogged: false,
		};

		this.buttonAnimated = new Animated.Value(0);
		this.growAnimated = new Animated.Value(0);
		this._onPress = this._onPress.bind(this);
	}

	_onPress() {
		//console.log(this.props.userName);
		if (this.state.isLoading) return;

		let url = this.props.serverIPAddress + "login";

		fetch(
			url,
		    { method: "POST",
			  body: JSON.stringify({"email": this.props.userName, "password": this.props.password})
			}
		)
        .then((response) => response.json())
        .then((responseJson) => {
			///loginResponseCache = responseJson;
			responseJson.meta.accessTokenBeginTime = (new Date()).getTime();
			if (responseJson.meta.success == true) {
				this.setState({ isLoading: true });

				Animated.timing(
					this.buttonAnimated,
					{
						toValue: 1,
						duration: 200,
						easing: Easing.linear
					}
				).start();

				setTimeout(() => { this._onGrow();}, 2000);

				setTimeout(() => {
					//this.setState({ isLogged: false });
					//Actions.secondScreen();
					//this.setState({ isLoading: false });
					this.buttonAnimated.setValue(0);
					this.growAnimated.setValue(0);
					this.props.credentials(responseJson); // Return response and close login form
				}, 2300);
			}
			else {
				Alert.alert(
					"Error",
					JSON.stringify(responseJson.meta.errors)
				);
			}
        })
		.catch((error) => {
			Alert.alert(
                "Login POST Response",
                error);
		});
	}

	_onGrow() {
		Animated.timing(
			this.growAnimated,
			{
				toValue: 1,
				duration: 200,
				easing: Easing.linear
			}
		).start();
	}

	render() {
		const changeWidth = this.buttonAnimated.interpolate({
			inputRange: [0, 1],
			outputRange: [DEVICE_WIDTH - MARGIN, MARGIN]
		});
		const changeScale = this.growAnimated.interpolate({
			inputRange: [0, 1],
			outputRange: [1, MARGIN]
		});

		return (
		<View>
		{ /* <TouchableWithoutFeedback onPress={KeyboardAvoidingView.dismiss}>  за скриване на клавиатурата при натискане на бутона*/ }
			<View style={buttonsubmitStyles.container}>
				<Animated.View style={{width: changeWidth}}>
					<TouchableOpacity style={buttonsubmitStyles.button}
						onPress={this._onPress}
						activeOpacity={1} >
							{this.state.isLoading ?
								<Image source={spinner} style={buttonsubmitStyles.image} />
								:
								<Text style={buttonsubmitStyles.text}>LOGIN</Text>
							}
					</TouchableOpacity>
					<Animated.View style={[ buttonsubmitStyles.circle, {transform: [{scale: changeScale}]} ]} />
				</Animated.View>
			</View>
			<View>
				{ /* <Text>Loading -> {this.showBoolean(this.state.isLoading)}</Text>
				<Text>Logged  -> {this.showBoolean(this.state.isLogged)}</Text> */ }
			</View>
		{ /* </TouchableWithoutFeedback> */ }
		</View>
		);
	}
}

const buttonsubmitStyles = StyleSheet.create({
	container: {
		marginBottom: 80,
		alignItems: 'center',
		justifyContent: 'flex-start',
	},
	button: {
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#F035E0',
		height: MARGIN,
		borderRadius: 20,
		zIndex: 100,
	},
	circle: {
		height: MARGIN,
		width: MARGIN,
		marginTop: -MARGIN,
		borderWidth: 1,
		borderColor: '#F035E0',
		borderRadius: 100,
		alignSelf: 'center',
		zIndex: 99,
		backgroundColor: '#F035E0',
	},
	text: {
		color: 'white',
		backgroundColor: 'transparent',
	},
	image: {
		width: 24,
		height: 24,
	},
});

class LoginForm extends Component {
	constructor(props) {
		super(props);
		this.state = {
			showPass: true,
			press: false,
			userName: '',
			passw: '',
		};
		this.showPass = this.showPass.bind(this);
		this.showInfo = this.showInfo.bind(this);
		this.showEye = this.showEye.bind(this);
	}

	showPass() {
		this.state.press === false ? this.setState({ showPass: false, press: true }) :this.setState({ showPass: true, press: false });
	}

	showInfo() {
		Alert.alert('НАИМ-БАН','Национален Археологически Институт с Музей\nкъм Българска Академия на Науките');
	}

	showEye() {
		if (this.state.showPass) {
			return (<Image source={eyeImg} style={formStyles.iconEye} /> );
		}
		else {
			return (<Image source={closedeyeImg} style={formStyles.iconEye} /> );
		}
	}

	render() {
		return (
			<KeyboardAvoidingView behavior='padding' style={formStyles.container}>
				<View style={logoStyles.container}>
					<Image source={logoImg} style={logoStyles.image} />
					<Text style={logoStyles.text} onPress={this.showInfo}>АКБ-ГИС</Text>
				</View>

				<View style={inputStyles.inputWrapper}>
					<Image source={usernameImg} style={inputStyles.inlineImg} />
					<TextInput style={inputStyles.input}
						placeholder={'Username'}
						onChangeText={value => this.setState({ userName: value })}
						value={this.state.userName}
						secureTextEntry={false}
						autoCorrect={false}
						autoCapitalize={'none'}
						returnKeyType={'done'}
						placeholderTextColor='white'
						underlineColorAndroid='transparent' />
				</View>

				<View style={inputStyles.inputWrapper}>
					<Image source={passwordImg} style={inputStyles.inlineImg} />
					<TextInput style={inputStyles.input}
						placeholder={'Password'}
						onChangeText={value => this.setState({ passw: value })}
						value={this.state.passw}
						secureTextEntry={this.state.showPass}
						autoCorrect={false}
						autoCapitalize={'none'}
						returnKeyType={'done'}
						placeholderTextColor='white'
						underlineColorAndroid='transparent' />
				</View>


				<TouchableOpacity
					activeOpacity={0.7}
					hitSlop={{top: 20, bottom: 20, left: 20, right: 20}}
					style={formStyles.btnEye}
					onPress={this.showPass}
				>
					{this.showEye()}
				</TouchableOpacity>
				<ButtonSubmit {...this.props} userName={this.state.userName} password={this.state.passw} />
			</KeyboardAvoidingView>
		);
	}
}

const logoStyles = StyleSheet.create({
	container: {
		marginTop: 20,
		marginBottom: 80,
		alignItems: 'center',
		justifyContent: 'center',
	},
	image: {
		width: 200,
		height: 90,
	},
	text: {
		color: 'white',
		fontFamily: 'arial',
		fontSize: 30,
		fontWeight: 'bold',
		backgroundColor: 'transparent',
		marginTop: 20,
	}
});

const inputStyles = StyleSheet.create({
	inputWrapper: {
		marginTop: 5,
		marginBottom: 5,
	},
	inlineImg: {
		position: 'absolute',
		zIndex: 99,
		width: 22,
		height: 22,
		left: 35,
		top: 9,
	},
	input: {
		backgroundColor: 'rgba(255, 255, 255, 0.4)',
		width: DEVICE_WIDTH - 40,
		height: 40,
		marginHorizontal: 20,
		paddingLeft: 45,
		borderRadius: 20,
		color: '#ffffff',
	},
});

const formStyles = StyleSheet.create({
	container: {
		flex: 1,
		position: 'absolute',
		top: 0,
		left: 0,
		width: DEVICE_WIDTH,
		height: DEVICE_HEIGHT,
		alignItems: 'center',
	},
	btnEye: {
		//position: 'absolute',
		top: -38,
		left: 222,
		//backgroundColor: 'green',
	},
	iconEye: {
		width: 25,
		height: 25,
		tintColor: 'rgba(0,0,0,0.2)',
	},
});


class Wallpaper extends Component {
	render() {
		return (
			<View style={wallpaperStyles.container}>
				<Image style={wallpaperStyles.picture} source={bgSrc} />
				{this.props.children}
			</View>
		);
	}
}

const wallpaperStyles = StyleSheet.create({
	container: {
		flex: 1,
		position: 'absolute',
		backgroundColor: 'transparent',
	},
	picture: {
		width: DEVICE_WIDTH,
		height: DEVICE_HEIGHT,
	},
});


export default class LoginScreen extends Component {
	static propTypes = {
		serverIPAddress: PropTypes.string.isRequired,
		credentials: PropTypes.func.isRequired,
	}

	static defaultProps = {
		serverIPAddress: 'http://93.152.172.53/',
	}

	constructor(props) {
		super(props);
	}

	render() {
		return (
			<Wallpaper>
				<LoginForm {...this.props} />
			</Wallpaper>
		);
	}
}
