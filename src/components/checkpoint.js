import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, Alert, View, ScrollView, Text, TextInput, TouchableHighlight, } from 'react-native';
import { Button } from 'react-native-elements';
import DatePicker from 'react-native-datepicker'
import ModalDropdown from 'react-native-modal-dropdown';
import { Strong, getPointTypes } from '../components/utilities';
import { tagsEndpoint } from '../components/constants';

const disabledFieldBackClr = 'rgba(100,100,100,0.3)';
const enabledFieldBackClr = 'rgba(0, 0, 255, .05)';
const placeholderForeClr = 'green';

//const realm = {};

//Data mode constants
const dmNewData = 1;
const dmEditData = 2;
const dmViewData = 3;

//Data mode text constants
const dmNewDataText = 'New data';
const dmEditDataText = 'Edit data';
const dmViewDataText = 'View data';

//Data state constants
const dsNotChanged = 0;
const dsChanged = 1;

//Data state text constants
const dsNotChangedText = 'Not changed';
const dsChangedText = 'Not saved';


//This class is from https://stackoverflow.com/questions/33071950/how-would-i-grow-textinput-height-upon-text-wrapping
class AutoExpandingTextInput extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
        text: props.defaultValue,
        height: 0,
		fieldValues: [],
    };
  }

  render() {
    return (
      <TextInput
        {...this.props}
        multiline={true}
        onChangeText={(text) => {
            this.setState({ text });
			this.props.updateSavingMode(text);
        }}
        onContentSizeChange={(event) => {
            this.setState({ height: event.nativeEvent.contentSize.height })
        }}
        style={[{flex: 1, textAlign: 'left', backgroundColor: 'rgba(0, 0, 255, .05)', color: 'blue', fontSize: 15, padding:0},
				{height: Math.max(35, this.state.height)}]
		}
        value={this.state.text}
      />
    );
  }
}

class CheckpointForm extends Component {
	constructor(props) {
		super(props);

		this.state = {
			checkpointTitle: '',
			inputFieldBackgroundColor: enabledFieldBackClr,
			placeholderForegroundColor: placeholderForeClr,
			existOnMapText: 'NO',
			dataModeText: '',
			dataStateText: '',
			fieldValues: [],
		}

		this.inputs = [];
		this.inputFieldInd = 0;
		this.expeditionData;
		this.focusNextField = this.focusNextField.bind(this);
		this.setDataChanged = this.setDataChanged.bind(this);
		this.validInputData = this.validInputData.bind(this);
		this.saveCheckpoint =this.saveCheckpoint.bind(this);
		this.onExit = this.onExit.bind(this);
		this.renderCheckpoint = this.renderCheckpoint.bind(this);
		this.optTags = []; //Array for the options of the comboboxes

		/*
		this.versions;
		this.dbVerIndex = 0; //AKB-db version index
		this.dbVerAKB;
		this.typesJSON;
		this.tagsJSON;
		this.pointJSON; //Metadata for selected checkpoint
		*/
	};

	componentWillMount() {
		realm = this.props.realm;
		this.coordinatesGPS = this.props.coordinatesGPS;
		this.accuracyGPS = this.props.accuracyGPS;
		this.checkpointType = this.props.checkpointType;

		const expeditions = realm.objects('Expedition');
		this.expeditionData = expeditions.filtered('id='+this.props.expeditionId.toString())[0];
		let dmText,dsText;
		this.dataState = dsNotChanged;
		dsText = dsNotChangedText;
		if (this.props.checkpointInd >= 0) { //Existing checkpoint
			let menuItems = getPointTypes(realm);

			const checkpointData = this.expeditionData.checkPoints[this.props.checkpointInd];
			this.coordinatesGPS = checkpointData.geoLocation.coordinates;
			this.accuracyGPS = checkpointData.geoLocation.accuracy;
			this.fieldValues = JSON.parse(checkpointData.data);
			this.checkpointType = checkpointData.type;
			this.dataMode = dmEditData;
			dmText = dmEditDataText;
			dsText = dsNotChangedText;
			this.setState({
				existOnMapText: 'YES',
				fieldValues: this.fieldValues,
			});
			for (let i=0; i<menuItems.length; i++) {
				if (menuItems[i].id == this.checkpointType) {
					this.checkpointTitle = menuItems[i].label;
					break;
				};
			};
		} else {
			this.dataMode = dmNewData;
			dmText = dmNewDataText;

			this.checkpointTitle = this.props.checkpointTitle;
			this.fieldValues = [];

			if (this.checkpointType == 19) { //checkpoint
				this.fieldValues = ['0','0','0','0','0'];
				this.dataState = dsChanged;
				dsText = dsChangedText;
			} else {
				//Define default values
				this.fieldValues = [
					this.expeditionData.leaderName,     //Team leader
					this.expeditionData.expeditionName, //Default project name == Expedition name
					new Date()							//Current date
				];
				this.dataState = dsChanged;
				dsText = dsChangedText;
			};

			if (this.checkpointType == 18) { //Leader checkpoint
				//Get values from fields of type "select", from the last Leader Checkpoint, for default
				let previousCheckpointData;
				let len = this.expeditionData.checkPoints.length;
				for (let i = len - 1; i>=0 ; i--) {
					if (this.expeditionData.checkPoints[i].type == 18) {
						previousCheckpointData = this.expeditionData.checkPoints[i];
					};
				};

				if (previousCheckpointData != undefined) {
					let fieldValsOfPChp = JSON.parse(previousCheckpointData.data); //This is an array
					this.fieldValues.push(fieldValsOfPChp[3]); //Земеползване
					this.fieldValues.push(fieldValsOfPChp[4]); //Земна покривка
					this.fieldValues.push(fieldValsOfPChp[5]); //Стратегия
					this.fieldValues.push(fieldValsOfPChp[6]); //Видимост
					this.fieldValues.push('0'); //Битова керамика - бр.
					this.fieldValues.push('0'); //Строителна керамика - бр.
					this.fieldValues.push('0'); //Мазилки - бр.
					this.fieldValues.push('0'); //Камъни - бр.
					this.fieldValues.push('0'); //Кремъци - бр.

					//this.dataState = dsChanged;
					//dsText = dsChangedText;
				};
			} else {
			};

			this.setState({
				fieldValues: this.fieldValues,
			});
		};

		this.setState({
			dataModeText: dmText,
			dataStateText: dsText,
			checkpointTitle: this.checkpointTitle
		});

		this.versions = realm.objects('AKBdbVersions')[0];
		this.dbVerIndex = this.versions.dbVersions.length - 1; //Active db version is always the last synchronized version
		this.dbVerAKB = this.versions.dbVersions[this.dbVerIndex];
		this.typesJSON = JSON.parse(this.dbVerAKB.types.strJSON);
		this.tagsJSON = JSON.parse(this.dbVerAKB.tags.strJSON);
		for(let i=0; i<this.dbVerAKB.points.length; i++) {
			//console.log('id=',this.dbVerAKB.points[i].id);
			if (this.dbVerAKB.points[i].id == this.checkpointType) {
				this.pointJSON = JSON.parse(this.dbVerAKB.points[i].strJSON);
				//console.log(this.pointJSON);
			};
		};

		//console.log('optTags',this.dbVerAKB.optTags);
		for (let i=0; i<this.pointJSON.length; i++) {
			let item = this.pointJSON[i];
			if (item.type == 'txt'  && item.properties.field == 'select') {
				let tagcode = item.properties.options.tag_code;
				let currTag;
				for (let i=0; i<this.tagsJSON.length; i++) {
					currTag = this.tagsJSON[i];
					if (currTag.code == tagcode) {
						this.optTags = JSON.parse(this.dbVerAKB.optTags);
						break;
					}
				};
			};
		};

	};

	componentDidMount() {
	}

	focusNextField(ind) {
		try {
			this.inputs[ind].focus();
		}
		catch (e) {};
	}

	onExit(responseJSON) {
		//Return answer and checkpoint data (eventually - meens Select button was pressed) on exit
		this.props.selectedCheckpoint(responseJSON);
	}

	setDataChanged() {
		this.dataState = dsChanged;
		this.setState({
			dataStateText: dsChangedText,
		});
	}

	renderCheckpoint() {
		return this.pointJSON.map( (item, index) => {
			const len = Object.keys(this.pointJSON).length;
			let inputField = null;
			if (item.type == 'txt' && item.properties.field == 'text') {
				let fieldInd = this.inputFieldInd;
				this.inputFieldInd++;
				let nextFieldInd = this.inputFieldInd;
				inputField = <TextInput
					style={[styles.inputField, {backgroundColor: this.state.inputFieldBackgroundColor},]}
					editable = {true}
					//maxLength = {8}
					placeholder={'Please enter...'}
					placeholderTextColor={this.state.placeholderForegroundColor}
					blurOnSubmit={ true }
					onSubmitEditing={() => {this.focusNextField(nextFieldInd);}}
					value={this.state.fieldValues[index]}
					onChangeText={ value => {
						this.fieldValues[index] = value;
						this.setState({fieldValues : this.fieldValues});
						this.setDataChanged();
					}}
					secureTextEntry={false}
					autoCorrect={false}
					autoCapitalize={'none'}
					//keyboardType='numeric'
					returnKeyType={'next'}
					underlineColorAndroid='transparent'
					ref={ input => {this.inputs[fieldInd] = input;}}
				/>
			} else {
				if (item.type == 'int' && item.properties.field == 'int') {
					let fieldInd = this.inputFieldInd;
					this.inputFieldInd++;
					let nextFieldInd = this.inputFieldInd;
					inputField = <TextInput
						style={[styles.inputField, {backgroundColor: this.state.inputFieldBackgroundColor},]}
						defaultValue={'0'}
						//editable = {this.state.editNumberOfDays}
						maxLength = {5}
						placeholder={'Please enter...'}
						placeholderTextColor={this.state.placeholderForegroundColor}
						blurOnSubmit={ true }
						value={this.state.fieldValues[index]}
						secureTextEntry={false}
						autoCorrect={false}
						autoCapitalize={'none'}
						keyboardType='numeric'
						returnKeyType={'next'}
						underlineColorAndroid='transparent'
						onFocus={ () => {
							if (this.dataMode == dmNewData && this.fieldValues[index] == '0') {
								this.fieldValues[index] = '';
								this.state.fieldValues[index] = '';
								this.forceUpdate();
							};
						}}
						onChangeText={ (value) => {
							this.fieldValues[index] = value;
							this.setState({fieldValues: this.fieldValues});
							this.setDataChanged();
						}}
						onSubmitEditing={() => {
							if (this.fieldValues[index] == '' || this.fieldValues[index] == null) {
								this.fieldValues[index] = '0';
								this.state.fieldValues[index] = '0';
							};

							this.focusNextField(nextFieldInd);  //This is where re-rendering happaned
						}}
						onEndEditing={ () => {
							if (this.fieldValues[index] == '' || this.fieldValues[index] == null) {
								this.fieldValues[index] = '0';
								this.setState({fieldValues: this.fieldValues});
								this.setDataChanged();
							};
						}}
						ref={ input => this.inputs[fieldInd] = input }
					/>
				} else {
					if (item.type == 'dt') {
						inputField = <DatePicker
							//enabled={this.state.editStartDate}
							style={{width: 200, backgroundColor: this.state.inputFieldBackgroundColor}}
							date={this.state.fieldValues[index]}
							mode="date"
							placeholder="select date"
							format="YYYY-MM-DD"
							minDate="2018-01-01"
							maxDate="2099-12-31"
							confirmBtnText="OK"
							cancelBtnText="Cancel"
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
							onDateChange={(date) => {
								this.fieldValues[index] = date;
								this.setState({fieldValues : this.fieldValues});
								this.setDataChanged();
							}}
						/>

					} else {
						if (item.type == 'txt' && item.properties.field == 'select') {
							let tagcode = item.properties.options.tag_code;
							let tagsArray;
							let len = this.optTags.length;
							for (let i=0; i<len; i++) {
								if (this.optTags[i].id == tagcode) {
									if (tagsArray === undefined) tagsArray = [];
									tagsArray.push(this.optTags[i].values);
								}
							};
							inputField = <ModalDropdown
								textStyle={[styles.dropDownText, {backgroundColor: this.state.inputFieldBackgroundColor}]}
								options={tagsArray}
								//defaultIndex={} //This only change the highlight of the dropdown row
								defaultValue={this.state.fieldValues[index]}
								animated={false}
								onSelect={
									(idx, value) => {
										this.fieldValues[index] = value;
										this.setState({fieldValues : this.fieldValues});
										this.setDataChanged();
									}
								}
							/>
						} else {
							if (item.type == 'txt' && item.properties.field == 'textarea') {
								inputField = <AutoExpandingTextInput
									editable={true}
									backgroundColor={this.state.inputFieldBackgroundColor}
									placeholder={'Please enter...'}
									placeholderTextColor={this.state.placeholderForegroundColor}
									defaultValue={this.state.fieldValues[index]}
									blurOnSubmit={ true }
									onChangeText={ value => {
										Alert.alert('AutoExpandingTextInput','Text changed');
									}}
									updateSavingMode={(text) => {
										this.fieldValues[index] = text;
										this.setState({fieldValues : this.fieldValues});
										this.setDataChanged();
									}}
									secureTextEntry={false}
									autoCorrect={false}
									autoCapitalize={'none'}
									underlineColorAndroid='transparent'
								/>
							} //Полета от типове arr и geo засега не се обработват
						};
					};
				};
			};

			return (
				<View key={index} style={{ flex: 1, }}>
					{
						item.type != 'arr' &&
						item.type != 'geo' &&
						<Text style={styles.label}>{index+1}. {item.label} {item.properties.required && '*'}</Text>
					}
					{inputField}
				</View>
			);
		});
	}

	renderSeparator() {
		return <View style={{marginTop: 4, borderBottomColor: 'black', borderBottomWidth: 2,}} />
	}

	validInputData() {
		let result = true;
		let messages = [];
		for (let index=0; index<this.pointJSON.length; index++) {
			let i = index + 1;
			let item = this.pointJSON[index];
			if ((item.type == 'txt' || item.type == 'dt') && item.properties.required) {
				if (this.state.fieldValues[index] == '' || this.state.fieldValues[index] == undefined) {
					messages.push('Missing value in field № '+(i).toString());
					result = false;
				};
			};
			if (item.type == 'int' && item.properties.required) {
				if (this.state.fieldValues[index] == '' || this.state.fieldValues[index] == undefined) {
					messages.push('Missing value in field № '+(i).toString());
					result = false;
				} else {
					if (this.state.fieldValues[index] === parseInt(this.state.fieldValues[index],10).toString()) {
					} else {
						messages.push('Incorrect value in field № '+(i).toString());
						result = false;
					};
				};
			};
		};
		if (!result) {
			Alert.alert('Input control',messages.join('\n'));
		};
		return result;
	}

	saveCheckpoint() {
		let checkpointObj = {
			type: this.checkpointType,
			date: new Date(),
			geoLocation: {
				coordinates: this.coordinatesGPS,
				accuracy: this.accuracyGPS,
			},
			data: JSON.stringify(this.state.fieldValues),
      photos: [],
      featureId: -1,
		};

		try {
			realm.write(() => {
				if (this.dataMode == dmNewData) {
					this.expeditionData.checkPoints.push(checkpointObj);
				} else {
					this.expeditionData.checkPoints[this.props.checkpointInd] = checkpointObj;
				};
			});
			return true;
		} catch (e) {
			Alert.alert('Saving checkpoint...', e.toString());
			return false;
		}
	}

	render() {
		return (
			<View style={styles.pageContainer}>
				<View style={styles.cardTitle}>
					<Text style={styles.cardTitleText}>{this.state.checkpointTitle}</Text>
				</View>
				<ScrollView	style={styles.scroll}>
					<View style={styles.card}>
						<Text>GPS coordinates : <Strong>{this.coordinatesGPS[0]}, {this.coordinatesGPS[1]}</Strong></Text>
						<Text>Accuracy : <Strong>{this.accuracyGPS}</Strong></Text>

						{this.renderSeparator()}

						<View>
							{this.renderCheckpoint()}
              {console.log(`Рендър метода на чекпойнта`)}
						</View>
					</View>
				</ScrollView>

				<View style={styles.card}>
					<View>
						<Text style={styles.display}>State and buttons</Text>
						<Text><Strong>Exist on map: {this.state.existOnMapText}</Strong></Text>
						<Text><Strong>Data mode: {this.state.dataModeText}</Strong></Text>
						<Text><Strong>State: {this.state.dataStateText}</Strong></Text>
					</View>

					{this.renderSeparator()}

					<View style={{ flexDirection: 'row', justifyContent: 'center' }}>
						<Button
							title='save'
							style={styles.button}
							color='red'
							disabled={this.dataState == dsNotChanged}
							titleColor='white'
							onPress={() => {
								if (this.validInputData() && this.saveCheckpoint()) {
									this.dataMode = dmEditData;
									this.dataState = dsNotChanged;
									this.setState({
										dataModeText: dmEditDataText,
										dataStateText: dsNotChangedText,
									});
								};
							}}
						/>
						<Button
							title='remove'
							style={styles.button}
							disabled={this.dataMode == dmNewData}
							color='#0277BD'
							titleColor='yellow'
							onPress={
								() => {
									//Alert.alert('state.fieldValues',JSON.stringify(this.state.fieldValues));
									//return;
									Alert.alert(
										'Warning',
										'Remove current checkpoint ?',
										[
											//{text: 'Ask me later', onPress: () => console.log('Ask me later pressed')},
											{text: 'Cancel', onPress: () => { }, style: 'cancel'},
											{text: 'OK', onPress: () => {
												realm.write(() => {
													//Delete current checkpoint from database
													this.expeditionData.checkPoints.splice(this.props.checkpointInd, 1);
												});

												let responseJSON = {
													exitState: 'remove',
													obj: {
														coordinates: this.coordinatesGPS,
														remove: this.state.existOnMapText == 'YES'
													},
												};
												this.onExit(responseJSON);
											}},
										],
										{ cancelable: false }
									);
								}
							}
						/>
						<Button
							title='exit'
							style={styles.button}
							onPress={ () => {
								let createCheckpoint = this.dataMode == dmEditData && this.state.existOnMapText == 'NO'
								let responseJSON = {
									exitState: 'exit',
									obj: {createCheckpointMark: createCheckpoint},
								};
								this.onExit(responseJSON);
							}}
							color='#0277BD'
							titleColor='white' />
					</View>
				</View>

			</View>
		);
	};

}

const styles = StyleSheet.create({
	pageContainer: {
		flex: 1,
    backgroundColor: 'white',
		//backgroundColor: 'rgba(52, 52, 52, 1)',
	},
	scroll: {
		backgroundColor: 'rgba(52, 52, 52, 0.5)',
	},
	card: {
		borderRadius: 5,
		padding: 4,
		margin: 4,
		backgroundColor: 'rgba(255, 255, 255, 1)',
		//minHeight: 100,
		justifyContent: 'space-between',
		shadowOpacity: 0.54,
		shadowRadius: 1,
		shadowOffset: { width: 0, height: 1 },
		elevation: 1,
	},
	cardTitle: {
		marginTop: 5,
		marginBottom: 5,
	},
	cardTitleText: {
		color: 'yellow',
		fontSize: 16,
		fontWeight: 'bold',
		marginLeft: 5,
	},
	label: {
		backgroundColor: disabledFieldBackClr,
		color: 'black',
		fontSize: 15,
	},
	inputField: {
		textAlign: 'left',
		color: 'blue',
		fontSize: 16,
		padding: 0,
		margin: 0,
	},
	dropDownText: {
		//padding: 8, //never enable padding - working bad with animated panels
		fontSize: 16,
		color: 'blue',
	},
	button: {
		margin: 4,
		borderRadius: 5,
	},
});

export default class CheckpointScreen extends Component {
	static propTypes = {
		realm: PropTypes.object.isRequired,
		expeditionId: PropTypes.number.isRequired,
		checkpointType: PropTypes.number.isRequired,
		checkpointTitle: PropTypes.string.isRequired,
		checkpointInd: PropTypes.number.isRequired,
		coordinatesGPS: PropTypes.arrayOf(PropTypes.number).isRequired,
		accuracyGPS: PropTypes.number,
		selectedCheckpoint: PropTypes.func.isRequired,
	}

	static defaultProps = {
		expeditionId: 0,
		checkpointType: -1,
		checkpointTitle: '',
		checkpointInd: -1,
		accuracyGPS: 0,
	}

	constructor(props) {
		super(props);
	}

	render() {
		return (
			<CheckpointForm {...this.props} />
		);
	}
}
