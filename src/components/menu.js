import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
	Dimensions,
	StyleSheet,
	Text,
	View,
	ScrollView,
	TouchableHighlight,
} from 'react-native';
import { Button } from 'react-native-elements';

const { width, height } = Dimensions.get('window');

export default class Menu extends Component {
	static propTypes = {
		title: PropTypes.string,
		menuItems: PropTypes.arrayOf(PropTypes.object),
		onSelectMenuItem: PropTypes.func.isRequired,
	}

	static defaultProps = {
	}

	constructor(props) {
		super(props);

		this.state = {
			top: 0,
			left: -1000,
		};

		this.called = false;

		this.renderMenuItems = this.renderMenuItems.bind(this);
	}

	componentDidMount() {
	}

	onLayout = event => {
		if (this.called) return; // layout was already called
		this.called = true;
		const menuWidth = event.nativeEvent.layout.width;
		const menuHeight = event.nativeEvent.layout.height;
		this.setState({
			left: (width - menuWidth) / 2,
			top: (height - menuHeight) / 2
		});
	};

	itemPress(item) {
		let ind;
		for (let i = 0; i < this.props.menuItems.length; i++) {
			if (this.props.menuItems[i].label === item) {
				ind = i;
				break;
			}
		}

		this.props.onSelectMenuItem(ind);
	}

	renderMenuItem(itemText) {
		return (
			<TouchableHighlight
				style={{ backgroundColor: 'rgba(240, 240, 240, 1)', padding: 5, paddingLeft: 8 }}
				activeOpacity={1}
				underlayColor={'white'}
				onPress={this.itemPress.bind(this, itemText)}
			>
				<Text style={{ color: 'black', }}>
					{itemText}
				</Text>
			</TouchableHighlight>
		);
	}

	renderMenuItems() {
		return this.props.menuItems.map((item, index) => {
			return (
				<View key={index} style={{ }}>
					{this.renderMenuItem(item.label)}
				</View>
			);
		});
	}

	render() {
		return (
			<View style={{ flex: 1 },[styles.card, { marginTop: this.state.top, marginLeft: this.state.left, }]} onLayout={this.onLayout}>
				<View>
					{this.props.title === undefined ?
						null :
						<View style={{ backgroundColor: 'blue', padding: 6, }}>
							<Text style={{ color: 'white', fontWeight: 'bold' }}>
								{this.props.title}
							</Text>
						</View>
					}
				</View>
				<View style={{ height: 300 }} >
					<ScrollView>
						{this.renderMenuItems()}
					</ScrollView>
				</View>
				<Button
					onPress={() => { this.props.onSelectMenuItem(-1); }}
					title="Cancel"
					color="#841584"
				/>
			</View>
		);
	}
}

const styles = StyleSheet.create({
	card: {
		width: 200,
		borderRadius: 5,
		padding: 2,
		margin: 2,
		backgroundColor: 'black',
		justifyContent: 'space-between',
		shadowOpacity: 0.54,
		shadowRadius: 1,
		shadowOffset: { width: 0, height: 1 },
		elevation: 1,
	},
});
