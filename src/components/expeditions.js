import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, Alert, NetInfo, View, ScrollView, Text, TextInput, TouchableOpacity, FlatList, TouchableHighlight, } from 'react-native';
import { TextButton, RaisedTextButton } from 'react-native-material-buttons';
import DatePicker from 'react-native-datepicker'
import { ListItem, SearchBar } from 'react-native-elements';
import Panel from './panel.js';
import {Strong, serverIPaddr, refreshTokenEndpoint, typesEndpoint, tagsEndpoint, featuresEndpoint, isEmpty} from './utilities';

const realm = {};

//Data mode constants
const dmUndefined = 0;
const dmNewData = 1;
const dmEditData = 2;
const dmViewData = 3;

//Data state constants
const dsNotChanged = 0;
const dsChanged = 1;
const dsSaved = 2;

//Sinchronization constants
const syncNO = 0;
const syncYES = 1;
//Sinchronization text constants
const syncNOtext = 'Not sinchronized';
const syncYEStext = 'Sinchronized';

const disabledFieldBackClr = 'rgba(100,100,100,0.3)';
const placeholderForeClr = 'green';

class ExpeditionsForm extends Component {
	constructor(props) {
		super(props);

		this.state = {
			currExpeditionName: 'Expedition',
			regionCoordsStateText: '',
			regionCoordsStateColor: 'black',
			featuresStateText: 'EMPTY',
			featuresStateColor: 'red',
			dataModeText: '',
			dataStateText: 'Not changed',
			dbSinchronizationText: syncNOtext,
			expeditionSinchronizationText: syncNOtext,

			expeditionName: '',
			editExpeditionName: false,
			leaderName: '',
			editLeaderName: false,
			startDate: '',
			editStartDate: false,
			numberOfDays: '',
			editNumberOfDays: false,
			regionDescription: '',
			editRegionDescription: false,
			loadingExpeditions: false,

			inputFieldBackgroundColor: disabledFieldBackClr,
			placeholderForegroundColor: disabledFieldBackClr, //Same as inputFieldBackgroundColor in order to hide placeholder text in default datamode='Undefined'

			expeditions:[{index: 1, key: 0, name:'expedition1', date: '2017/12/18'},
						 {index: 2, key: 1, name:'expedition2', date: '2017/12/19'}],
			selectedItem: {index: 0, key: 0, name: '', date: ''},
		};

		this.getFormattedDate = this.getFormattedDate.bind(this);
		this.clearDataField = this.clearDataField.bind(this);
		this.setDataFieldsState = this.setDataFieldsState.bind(this);
		this.regionCoordsDefinition = this.regionCoordsDefinition.bind(this);
		this._setNewDatamode = this._setNewDatamode.bind(this);
		this.loadFeatures = this.loadFeatures.bind(this);
		this.readAllExpeditions = this.readAllExpeditions.bind(this);
		this._onExit = this._onExit.bind(this);
		this._onPressRegionCoordsState = this._onPressRegionCoordsState.bind(this);
		this._onPressFeaturesState = this._onPressFeaturesState.bind(this);
		this._onChangeData = this._onChangeData.bind(this);
		this.focusNextField = this.focusNextField.bind(this);
		this.getItem = this.getItem.bind(this);

		this.progressBarCaption = '';
		this.inputs = {};
		this.dataMode = dmUndefined; //0 = undefined (default), 1 = new data, 2 = edit existing data, 3 - view existing data
		this.dataState = dsNotChanged; // 0 = not changed (default), 1 = changed but not saved, 2 = saved
		this.dbSinchronization = syncNO; // 0 = not sinchronized, 1 = sinchronized
		this.expeditionSinchronization = false; // false = not sinchronized, true = sinchronized

		this.currExpeditionIndex = -1; //no expedition selected from the list (dimensions of this parameter = [0,expeditionsList.length-1])
		this.expeditionsList = []; //source array for this.state.expeditions

		this.newAKBdbVersion = {
			version: '',
			types: {},
			tags: {},
			points: [],
			editablePoints: [],
			optTags: '',
		};
		this.opTags = {}; //temporary associative array

		//Current expedition parameters
		this.currId = '';
		this.regionCoords = []; //Container for JSON-coordinates of the selected region
		this.zoom = 0;
		this.regionCoordsChanged = false; //true <- if features are manually reloaded by the user
		this.features = ''; //Container for stringified JSON-features inside the selected region
		this.featuresChanged = false; //true <- if features are manually loaded by the user
	}

	clearDataField() {
		this.dataMode = dmUndefined;
		this.dataState = dsNotChanged;
		this.setState({
			currExpeditionName: 'Expedition',
			dataModeText: 'Undefined',
			dataStateText: 'Not changed',
			expeditionName: '',
			leaderName: '',
			startDate: new Date(),
			numberOfDays: '1',
			regionDescription: '',
		});
	}

	setDataFieldsState(newState) {
		this.setState({
			editExpeditionName: newState,
			editLeaderName: newState,
			editStartDate: newState,
			editNumberOfDays: newState,
			editRegionDescription: newState,
		});

		if (newState == true) {
			this.setState({
				inputFieldBackgroundColor: 'white',
				placeholderForegroundColor: placeholderForeClr,
			});
		} else {
			this.setState({
				inputFieldBackgroundColor: disabledFieldBackClr,
				placeholderForegroundColor: disabledFieldBackClr,
			});
		}
	}

	regionCoordsDefinition = () => {
		var txt,clr;
		if (this.props.regionCoords.length == 0) {
			txt = 'UNDEFINED';
			clr = 'red';
		} else {
			txt = 'DEFINED';
			clr = 'green';
		};
		this.setState({
			regionCoordsStateText: txt,
			regionCoordsStateColor: clr,
		});
	}

	_setNewDatamode() {
		//this.props.startProgress('Preparing for new data mode...', true);

		console.log('Set newdata mode');
		if (global.ct != '') {
			this.sinchronizeWithAKBdb(global.dbVerAKB)
			.then((flag) => {
				if (flag == true) {
					this.clearDataField();

					this.regionCoordsDefinition();

					this.loadFeatures()
					.then( (result) => {
						this.features = JSON.stringify({state:'loaded', data: result});
					})
					.catch( (error) => {
						this.features = JSON.stringify({state:'empty'});
					});

					this.setDataFieldsState(true);
					this.dataMode = dmNewData;

					this.currExpeditionIndex = 0;

					this.setState({dataModeText: 'New data'});
				}
			});
		} else {
			console.log('Internet connection problem');
			Alert.alert('Internet connection problem', 'You have to login first, in order to create a new expedition.\nPlease, restore the internet connection and try again.');
		}

		//this.props.stopProgress();
	}

	componentDidMount() {
		const realm = this.props.realm;
		console.log('regionCoords', this.props.regionCoords);
		this.regionCoords = this.props.regionCoords.slice();
		this.zoom = this.props.regionZoom;

		this.regionCoordsDefinition();

		this.clearDataField();

		this.readAllExpeditions()
		.then( () => {
			this.setState({expeditions: this.expeditionsList});
		});

		this.setDataFieldsState(false);
	}

	typesLoaded = async() => {
		console.log('Loading types ...');
		let newTypes = {
			strJSON: '',
		};

		try {
			const types = await fetch(
				typesEndpoint,
				{
					"method": "GET",
					"t": global.ct
				});

			const typesJSON = await types.json();

			if (typesJSON.meta.success == true) {
				newTypes.strJSON = await JSON.stringify(typesJSON.data.types);
				this.newAKBdbVersion.types = newTypes; //Return the types in a global object
				return true;
			} else {
				console.log('error', typesJSON.meta.errors);
				Alert.alert(
					"Get types - unsuccess error",
					JSON.stringify(typesJSON.meta.errors)
				);
				return false;
			}
		} catch (e) {
			console.log('error', e.toString());
			Alert.alert("Get types - fetch error", e.toString());
			return false;
		}
	}

	tagsLoaded = async() => {
		console.log('Loading tags description ...');
		let newTags = {
			strJSON: '',
		};

		try {
			const tags = await fetch(
				tagsEndpoint + '0',
				{
					"method": "GET",
					"t": global.ct
				});

			const tagsJSON = await tags.json();

			if (tagsJSON.meta.success == true) {
				newTags.strJSON = await JSON.stringify(tagsJSON.data.tags);
				this.newAKBdbVersion.tags = newTags; //Return the tags in a global object
				return true;
			} else {
				console.log('error', tagsJSON.meta.errors);
				Alert.alert(
					"Get tags - unsuccess error",
					JSON.stringify(tagsJSON.meta.errors)
				);
				return false;
			}
		} catch (e) {
			console.log('error', e.toString());
			Alert.alert("Get tags - fetch error", e.toString());
			return false;
		}
	}

	pointsLoaded = async(pointIDs) => {
		console.log('Loading points ...');
		let tagsJSON = JSON.parse(this.newAKBdbVersion.tags.strJSON);

		for (let i=0; i<pointIDs.length; i++) {
			const endPoint = serverIPaddr + 'meta/1/' + pointIDs[i].toString();
			console.log('endPoint',endPoint);

			try {
				const point = await fetch(
					endPoint,
					{
						"method": "GET",
						"t": global.ct
					});

				const pointJSON = await point.json();

				if (pointJSON.meta.success == true) {
					let newPoints = {
						id: 0,
						strJSON: '',
					};

					let pointId = pointIDs[i];
					let pointMetadata = pointJSON.data.metadata;
					newPoints.id = pointId;
					newPoints.strJSON = await JSON.stringify(pointMetadata);
					//console.log('newPoints',newPoints);
					await this.newAKBdbVersion.points.push(newPoints); //Return the points in a global object

					if (this.newAKBdbVersion.editablePoints.indexOf(pointId) >= 0) {
						for (let j=0; j<pointMetadata.length; j++) {
							let item = pointMetadata[j];
							if (item.type == 'txt'  && item.properties.field == 'select') {
								let tagcode = item.properties.options.tag_code;
								let currTag;
								let downloaded = [];

								let inDownloaded = (code) => {
									for (let ii=0; ii<downloaded.length; ii++) {
										if (downloaded.indexOf(code) >= 0) return true;
									};
									return false;
								};

								for (let k=0; k<tagsJSON.length; k++) {
									currTag = tagsJSON[k];
									if (currTag.code == tagcode && !inDownloaded(tagcode)) {
										if (await this.loadTagsById(currTag.id, tagcode)) {
											downloaded.push(tagcode);
										} else {
											return false;
										};
									};
								};
							};
						};
					};

				} else {
					console.log('error: ',JSON.stringify(pointJSON.meta.errors));
					Alert.alert(
						"Get points - unsuccess error",
						JSON.stringify(pointJSON.meta.errors)
					);
					return false;
				}
			} catch (e) {
				console.log('error: ',e.toString());
				Alert.alert("Get points - fetch error", e.toString());
				return false;
			}
		}

		return true;
	}

	loadTagsById = async(id, tagcode) => {
		console.log('Load tags by Id...');
		try {
			const result = await fetch(
				tagsEndpoint + id.toString(),
				{
					//"method": "GET",
					//"t": global.ct
					method: 'GET',
					headers: {
						Accept: 'application/json',
						'Content-Type': 'application/vnd.api+json; charset=utf-8',
					},
					"t": global.ct,
				}
			);

			const resultJSON = await result.json();

			if (resultJSON.meta.success == true) {
				tagsJSON = resultJSON.data.tags;
				//await Alert.alert('fetch result:', JSON.stringify(tagsJSON));
				let currTag;
				let tags;
				for (let i=0; i<tagsJSON.length; i++) {
					tags = {};
					currTag = tagsJSON[i];
					tags.id = tagcode;
					tags.values = currTag.name + ' / ' + currTag.code;
					await this.optTags.push(tags);
				};
				//await Alert.alert('tags:', JSON.stringify(tags));
				//await Alert.alert('this.optTags:', JSON.stringify(this.optTags));
				return true;
			} else {
				console.log('loadTagsById', tagsJSON.meta.errors);
				Alert.alert(
					"loadTagsById - unsuccess error",
					JSON.stringify(tagsJSON.meta.errors)
				);
				return false;
			}
		} catch (e) {
			console.log('error', e.toString());
			Alert.alert("loadTagsById - fetch error", e.toString());
			return false;
		}
	}

	sinchronizeWithAKBdb = async(ver) => {
		console.log('Loading AKB database ...');
		//this.props.startProgress('Fetching AKB-db version',true);

		this.optTags = [];  //Initialize temporary associative array for options.

		//Save the current AKB-db version in the global dbVerAKB-container-object
		this.newAKBdbVersion.version = ver;

		//IDs for "Laeder checkpoint" and "Checkpoint" points
		this.newAKBdbVersion.editablePoints = [18,19];

		//Read all AKB-db versions
		let versions = realm.objects('AKBdbVersions')[0];

		console.log('Operation: CREATE NEW AKB-db', ver);
		if (versions === undefined) {
		//Application started for the first time
			console.log('No versions available!');
			//Load types and tags
			if (await this.typesLoaded() && await this.tagsLoaded()) {
				const typesJSON = JSON.parse(this.newAKBdbVersion.types.strJSON);

				let pointIDs = [];
				for (let i=0; i<typesJSON.length; i++) {
					if (typesJSON[i].classification.id === 1) {
						//console.log('i=',i, 'name=', typesJSON[i].name);
						pointIDs.push(typesJSON[i].id);
					}
				}

				//Load points
				if (await this.pointsLoaded(pointIDs)) {
					console.log('option tags - 1',this.optTags);
					this.newAKBdbVersion.optTags = JSON.stringify(this.optTags);
					let newAKBdbVersions = {
						dbVersions: [this.newAKBdbVersion], //Create versions array for the first time, including current AKB-database
					}

					//Save the newly fetched AKB-database
					try {
						realm.write(() => {
							realm.create('AKBdbVersions', newAKBdbVersions);
						});
						this.dbSinchronization = syncYES;
						this.setState({ dbSinchronizationText: 'Sinchronized' });
						//this.props.stopProgress();
						console.log('OK');
						return true;
					} catch (e) {
						console.log('Error', e.toString());
						Alert.alert('Error on creating AKB-database!', e.message.toString());
					};
				}
			}
		} else {
		//At least one AKB-db version already exist in the local realm database
			console.log('Available versions count:',versions.dbVersions.length);
			let i, found = false;
			for (i=0; i<versions.dbVersions.length; i++) {
				console.log('  version=',versions.dbVersions[i].version);
				if (versions.dbVersions[i].version === ver) {
					found = true;
					console.log('Existing version! Operation rejected.');
					//console.log(JSON.stringify(JSON.parse(versions.dbVersions[i].tags.strJSON),null,2));
					//iterate(JSON.parse(versions.dbVersions[i].tags.strJSON));
					//iterate(JSON.parse(versions.dbVersions[i].types.strJSON));
					//iterate(JSON.parse(versions.dbVersions[i].points[0].strJSON));
					//No need of break - it is always the last version, that exists
					//break;
				}
			}

			if (found) {
				this.dbSinchronization = syncYES;
				this.setState({ dbSinchronizationText: 'Sinchronized' });
				//this.props.stopProgress();
				console.log('Database is sinchronized');
				return true;
			} else {
				//Load types and tags
				if (await this.typesLoaded() && await this.tagsLoaded()) {
					const typesJSON = JSON.parse(this.newAKBdbVersion.types.strJSON);

					let pointIDs = [];
					for (let i=0; i<typesJSON.length; i++) {
						if (typesJSON[i].classification.id === 1) {
							//console.log('i=',i, 'name=', typesJSON[i].name);
							pointIDs.push(typesJSON[i].id);
						}
					}
					//console.log(pointIDs);

					//Load points
					if (await this.pointsLoaded(pointIDs)) {
						console.log('option tags - 2a',this.optTags);
						this.newAKBdbVersion.optTags = await JSON.stringify(this.optTags);

						//Save the newly fetched AKB-database as last element in the versions array
						try {
							realm.write(() => {
								versions.dbVersions.push(this.newAKBdbVersion);
								//console.log(this.newAKBdbVersion);
							});
							this.dbSinchronization = syncYES;
							this.setState({ dbSinchronizationText: 'Sinchronized' });
							//this.props.stopProgress();
							console.log('Database is sinchronized');
							return true;
						} catch (e) {
							console.log('Error', e.toString());
							Alert.alert('Error on saving new AKB-database version!', e.message.toString());
							return false;
						};
					}
				}
			}
		}
		//this.props.stopProgress();
		return false;
	}

	loadFeatures = () => {
		console.log('Loading features from server...');
		return new Promise( (resolve,reject) => {
			/*
			let currStrCoords;
			let regionStrCoords = [];
			for (let i = 0; i<this.regionCoords.length; i++) {
				currStrCoords = [];
				currStrCoords.push(this.regionCoords[i][0]);
				currStrCoords.push(this.regionCoords[i][1]);
				regionStrCoords.push(currStrCoords);
			};
			*/
			let currStrCoords;
			let arr = [];
			let regionStrCoords = '';
			for (let i = 0; i<this.regionCoords.length; i++) {
				currStrCoords = 'geo[' + i.toString() + '][]=' + this.regionCoords[i][0].toString() +
								'&geo[' + i.toString() + '][]=' + this.regionCoords[i][1].toString();
				arr.push(currStrCoords);
			};
			regionStrCoords = arr.join('&');
			//regionStrCoords = 'geo[0][]=2595106.6010182584&geo[0][]=5257391.718720053&geo[1][]=2595106.6010182584&geo[1][]=5252791.1650801385&geo[2][]=2599888.69260035&geo[2][]=5252791.1650801385&geo[3][]=2599888.69260035&geo[3][]=5257391.718720053&geo[4][]=2595106.6010182584&geo[4][]=5257391.718720053';
			//					 geo[0][]=2601275.227449424&geo[0][]=5262877.676281186&geo[1][]=2601275.227449424&geo[1][]=5262754.361856647&geo[2][]=2601434.670313113&geo[2][]=5262754.361856647&geo[3][]=2601434.670313113&geo[3][]=5262877.676281186&geo[4][]=2601275.227449424&geo[4][]=5262877.676281186
			//					 geo[0][]=2773518.768562055&geo[0][]=5182849.4269748945&geo[1][]=2773518.768562055&geo[1][]=5179259.638434183&geo[2][]=2778160.2869173586&geo[2][]=5179259.638434183&geo[3][]=2778160.2869173586&geo[3][]=5182849.4269748945&geo[4][]=2773518.768562055&geo[4][]=5182849.4269748945
			//Alert.alert('regionStrCoords',regionStrCoords);
			console.log('regionStrCoords',regionStrCoords);

			/* This return: 'error', { '400': 'No id or geo filters provided.' }
			fetch(
				featuresEndpoint,
				{
					"method": "GET",
					"t": global.ct,
					"geo": regionStrCoords
				}
			)
			*/
			let url = featuresEndpoint + "?t=" + global.ct + "&" + encodeURIComponent(regionStrCoords);
			//console.log(url);
			fetch(
				url,
				{
					"method": "GET"
				}
			)
			.then( (features) => {
				//console.log('features',features);
				//Convert to JSON for communication error checking. It is also JSON-format validity check
				features.json()
				.then( (featuresJSON) => {
					if (featuresJSON.meta.success == true) {
						//console.log(JSON.stringify(featuresJSON.data.features,null,2));
						global.dbVerAKB = featuresJSON.meta.version; //Update the active (last) version
						this.setState({featuresStateText: 'LOADED', featuresStateColor: 'green'});
						resolve(featuresJSON.data.features);
					} else {
						this.setState({featuresStateText: 'EMPTY', featuresStateColor: 'red'});
						console.log('error', featuresJSON.meta.errors);
						Alert.alert(
							"Get tags - unsuccess error",
							JSON.stringify(featuresJSON.meta.errors)
						);

						let reason = new Error(featuresJSON.meta.errors);
						reject(reason);
					}
				})
				.catch( (e) => {
					console.log(e);
					Alert.alert('error',e.toString());
					reject(e);
				});
			})
			.catch( (e) => {
				console.log(e);
				Alert.alert('error',e.toString());
				reject(e);
			});

			console.log('end');
		});
	}

	twoDigitsFormat = (number) => {
		return number < 10 ? '0' + number : '' + number; // ('' + number) for string result
	}

	getFormattedDate = (date) => {
		let formattedDate =
			date.getFullYear().toString() + "-" +
			this.twoDigitsFormat(date.getMonth() + 1) + "-" +
			this.twoDigitsFormat(date.getDate());
		return (formattedDate);
	}

	readAllExpeditions() {
		console.log('read all expeditions');
		return new Promise( (resolve, reject) => {
			try {
				const expeditions = realm.objects('Expedition').sorted('id', true);
				//console.log('expeditions:',expeditions);
				this.expeditionsList = [];
				let expeditionItem = null;
				let i = 0;
				for (expedition in expeditions) {
					expeditionItem ={
						index: i,
						key: expeditions[expedition].id,
						name: expeditions[expedition].expeditionName,
						regionDescription: expeditions[expedition].regionDescription,
						date: this.getFormattedDate(expeditions[expedition].startDate),
					};
					this.expeditionsList.push(expeditionItem);
					i++;
				};
				resolve(true);
			} catch (e) {
				console.log(e);
				Alert.alert('Read expeditions',e.toString());
				reject(e);
			}
		});
	}

	saveExpedition = (expeditionData) => {
		return new Promise( (resolve,reject) => {
			if (expeditionData.startDate == '') {
				var reason = new Error('Enter date, please!');
				reject(reason);
			};

			if (expeditionData.numberOfDays == '') {
				expeditionData.numberOfDays = '0';
			};

			if (expeditionData.expeditionName != '') {
				const expeditions = realm.objects('Expedition');
				const expeditionRec = {};
				let expId;
				if (this.dataMode == dmNewData) {
					const lastExpedition = expeditions.sorted('id',true)[0];
					if (lastExpedition == undefined) {
						expId = 1;
					} else {
						expId = lastExpedition.id + 1;
					};
					console.log('save new expedition, id',expId);

					const dbVersions = realm.objects('AKBdbVersions');
					expeditionRec.dbVersionIndexAKB = dbVersions.length - 1; //Always use the last db-version for new expedition

					expeditionRec.regionCoordinates = JSON.stringify(expeditionData.regionCoordinates);
					expeditionRec.regionZoom = expeditionData.regionZoom;
					expeditionRec.regionFeatures = this.features;
					expeditionRec.id = expId;
					expeditionRec.expeditionName = expeditionData.expeditionName;
					expeditionRec.leaderName = expeditionData.leaderName;
					expeditionRec.startDate = new Date(expeditionData.startDate);
					expeditionRec.days = parseInt(expeditionData.numberOfDays, 10);
					expeditionRec.regionDescription = expeditionData.regionDescription;
					expeditionRec.tracks = [];
					expeditionRec.checkPoints = [];
					expeditionRec.sinchronized = false;

					try {
						realm.write(() => {
							realm.create('Expedition', expeditionRec );
						});

						resolve(expeditionRec);
					} catch (e) {
						reject(e);
					}
				} else {
					expId = this.state.expeditions[this.currExpeditionIndex].key;

					try {
						const currExpedition = expeditions.filtered('id='+expId.toString())[0];
						realm.write(() => {
							currExpedition.expeditionName = expeditionData.expeditionName;
							currExpedition.leaderName = expeditionData.leaderName;
							currExpedition.startDate = new Date(expeditionData.startDate);
							currExpedition.days = parseInt(expeditionData.numberOfDays, 10);
							currExpedition.regionDescription = expeditionData.regionDescription;

							if (this.regionCoordsChanged == true) {
								currExpedition.regionCoordinates = JSON.stringify(expeditionData.regionCoordinates);
								currExpedition.regionZoom = expeditionData.regionZoom;
							};

							if (this.featuresChanged == true) {
								currExpedition.regionFeatures = this.features;
							};
						});

						resolve({});
					} catch (e) {
						reject(e);
					}
				};

			} else {
				this.focusNextField('1');
				var reason = new Error('Please, enter expedition name!');
				reject(reason);
			}
		});
	}

	_onPressRegionCoordsState() {
		if (this.state.regionCoordsStateText == 'UNDEFINED') {
		} else {
			var msgText = '';
			for (var i = 0; i<this.regionCoords.length; i++) {
				msgText += JSON.stringify(this.regionCoords[i]) + ',\n';
			}
			msgText += 'Zoom: ' + this.zoom.toString();
			Alert.alert(
				'Region coordinates:',
				msgText,
				[
					(this.dataMode == dmEditData) && (!isEmpty(this.props.regionCoords)) && (JSON.stringify(this.regionCoords) != JSON.stringify(this.props.regionCoords)) && { text : 'Redefine', onPress: () => {
						this.regionCoords = this.props.regionCoords.slice();
						this.zoom = this.props.regionZoom;
						this.regionCoordsChanged = true;
						this._onChangeData();
					}},
					{ text: 'Close', style: 'cancel'},
				],
				{ cancelable: false }
			);
		}
	}

	_onPressFeaturesState() {
		if (this.state.featuresStateText == 'LOADED') {
			Alert.alert(
				'Attention',
				'This may take a long time.\nMay be some times you will have to answer "wait"\nAre you sure?',
				[
					{text: 'Yes', onPress: () => {
						Alert.alert(
							'Features',
							this.features,
							[
								{text: 'OK'},
							],
							{ cancelable: false }
						);
					}},
					{text: 'No', onPress: () => {return}, style: 'cancel'},
					{text: 'Reload', onPress: () => {
						if (this.expeditionSinchronization == false) {
							if (global.ct != '') {
								this.loadFeatures()
								.then( (result) => {
									try {
										this.features = JSON.stringify({state:'loaded', data: result});
										this.featuresChanged = true;
										this._onChangeData();
									} catch (e) {}
								})
								.catch( (e) => {
									Alert.alert('Reload features', e.toString());
								});
							} else {
								Alert.alert('Reload features','No intenet connection!');
							}
						}
					}},
				],
				{ cancelable: true }
			);
		} else {
		}
	}

	_onChangeData() {
		this.dataState = dsChanged;
		this.setState({dataStateText : 'Data not saved'});
	}

	focusNextField(id) {
		this.inputs[id].focus();
	}

	_onChangeSearchText = (searchText) => {
		{/*
		Alert.alert(
			'Information',
			`search text:   ${searchText}`,
			[{text: 'OK', onPress: () => {}},],
			{ cancelable: true }
		);
		*/}

		if (searchText) {
			//this.setState({searchClearIcon: theme.searchClearIcon})
		} else {
			//this.setState({searchClearIcon: false})
		}
	}

	_renderSeparator = () => {
		return (
			<View
				style={{
					height: 1,
					//width: "86%",
					backgroundColor: "#CED0CE",
					//marginLeft: "14%"
				}}
			/>
		);
	}

	_renderHeader = () => {
		return <SearchBar noIcon={true} placeholder="search..." lightTheme round
			onChangeText={this._onChangeSearchText}
			//value={'track'}
			ref={search => this.searchBarRef = search} />;
		//return null;
	}

	_renderFooter = () => {
		if (!this.state.loadingExpeditions) return null;

		return (
			<View
				style={{
					paddingVertical: 20,
					borderTopWidth: 1,
					borderColor: "#CED0CE"
				}}
			>
				<ActivityIndicator animating size="large" />
			</View>
		);
	}

	getItem (item) {
		console.log('get item index', item.index);
		this.currExpeditionIndex = item.index;
		this.currId = item.key;
		const allExpeditions = realm.objects('Expedition');
		const selectedExpedition = allExpeditions.filtered('id=' + item.key )[0];
		this.regionCoords = JSON.parse(selectedExpedition.regionCoordinates);
		this.zoom = selectedExpedition.regionZoom;
		this.features = selectedExpedition.regionFeatures;

		let dmText = '';
		if (selectedExpedition.sinchronized == true) {
			this.expeditionSinchronization = true;
			this.setState({expeditionSinchronizationText: syncYEStext});
			this.dataMode = dmViewData;
			dmText = 'View data';
		} else {
			this.dataMode = dmEditData;
			dmText = 'Edit data';
		};

		this.dataState = dsNotChanged;

		this.setState({
			currExpeditionName: 'Expedition: ' + selectedExpedition.expeditionName,
			regionCoordsStateText: 'DEFINED',
			regionCoordsStateColor: 'green',
			featuresStateText: 'LOADED',
			featuresStateColor: 'green',
			expeditionName: item.name,
			leaderName: selectedExpedition.leaderName,
			startDate: item.date,
			numberOfDays: selectedExpedition.days.toString(),
			regionDescription: selectedExpedition.regionDescription,
			dataModeText: dmText,
			dataStateText: 'Not changed'
		});
		this.setDataFieldsState(!selectedExpedition.sinchronized);
	}

	_onExit(responseJSON) {
		//Return answer and expedition data (eventually - meens Select button was pressed) on exit
		this.props.expeditionData(responseJSON);
	}

	render() {
		return (
			<View style={styles.pageContainer}>
				<ScrollView
					style={styles.scroll}
				>
					<Panel title={this.state.currExpeditionName}>
						<View style={styles.card}>
							<View style={styles.cardTitle}>
								<Text style={styles.cardTitleText}>Data</Text>
							</View>
							<View style={{flex: 1, flexDirection: 'row', }}>
								<Text style={styles.label}>Region coordinates : </Text>
								<TouchableOpacity
									onPress={this._onPressRegionCoordsState}
									activeOpacity={1} >
									<Text style={{color: this.state.regionCoordsStateColor, fontWeight: 'bold',}}>
										{this.state.regionCoordsStateText}
									</Text>
								</TouchableOpacity>
							</View>
							<View style={{flex: 1, flexDirection: 'row', }}>
								<Text style={styles.label}>Region features : </Text>
								<TouchableOpacity
									onPress={this._onPressFeaturesState}
									activeOpacity={1} >
									<Text style={{color: this.state.featuresStateColor, fontWeight: 'bold',}}>
										{this.state.featuresStateText}
									</Text>
								</TouchableOpacity>
							</View>
							<View style={{flex: 1,}}>
								<Text style={styles.label}>Project name : </Text>
								<TextInput
									style={[styles.inputField, {backgroundColor: this.state.inputFieldBackgroundColor},]}
									editable = {this.state.editExpeditionName}
									//maxLength = {8}
									placeholder={'Please enter...'}
									placeholderTextColor={this.state.placeholderForegroundColor}
									blurOnSubmit={ true }
									onSubmitEditing={() => {this.focusNextField('2');}}
									value={this.state.expeditionName}
									onChangeText={ (value) => {
										this.setState({ expeditionName: value })
										this._onChangeData();
									}}
									secureTextEntry={false}
									autoCorrect={false}
									autoCapitalize={'none'}
									//keyboardType='numeric'
									returnKeyType={'next'}
									underlineColorAndroid='transparent'
									ref={ input => {this.inputs['1'] = input;}}
								/>
							</View>
							<View style={{flex: 1,}}>
								<Text style={styles.label}>Leader name : </Text>
								<TextInput
									style={[styles.inputField, {backgroundColor: this.state.inputFieldBackgroundColor},]}
									editable = {this.state.editLeaderName}
									//maxLength = {8}
									placeholder={'Please enter...'}
									placeholderTextColor={this.state.placeholderForegroundColor}
									blurOnSubmit={ true }
									onSubmitEditing={() => {this.focusNextField('3');}}
									value={this.state.leaderName}
									onChangeText={ (value) => {
										this.setState({ leaderName: value })
										this._onChangeData();
									}}
									secureTextEntry={false}
									autoCorrect={false}
									autoCapitalize={'none'}
									//keyboardType='numeric'
									returnKeyType={'next'}
									underlineColorAndroid='transparent'
									ref={ input => {this.inputs['2'] = input;}}
								/>
							</View>
							<View style={{flex: 1,}}>
								<Text style={styles.label}>Start date : </Text>
								<DatePicker
									enabled={this.state.editStartDate}
									style={{width: 200}}
									date={this.state.startDate}
									mode="date"
									placeholder="select date"
									format="YYYY-MM-DD"
									minDate="2018-04-01"
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
										this.setState({startDate: date});
										this._onChangeData();
									}}
								/>
							</View>
							<View style={{flex: 1,}}>
								<Text style={styles.label}>Number of days : </Text>
								<TextInput
									style={[styles.inputField, {backgroundColor: this.state.inputFieldBackgroundColor},]}
									editable = {this.state.editNumberOfDays}
									maxLength = {5}
									placeholder={'Please enter...'}
									placeholderTextColor={this.state.placeholderForegroundColor}
									blurOnSubmit={ true }
									onSubmitEditing={() => {this.focusNextField('4');}}
									value={this.state.numberOfDays}
									onChangeText={ (value) => {
										this.setState({ numberOfDays: value })
										this._onChangeData();
									}}
									secureTextEntry={false}
									autoCorrect={false}
									autoCapitalize={'none'}
									keyboardType='numeric'
									returnKeyType={'next'}
									underlineColorAndroid='transparent'
									ref={ input => {this.inputs['3'] = input;}}
								/>
							</View>
							<View style={{flex: 1,}}>
								<Text style={styles.label}>Region description : </Text>
								<TextInput
									style={[styles.inputField, {backgroundColor: this.state.inputFieldBackgroundColor},]}
									editable = {this.state.editRegionDescription}
									//maxLength = {8}
									placeholder={'Please enter...'}
									placeholderTextColor={this.state.placeholderForegroundColor}
									blurOnSubmit={ true }
									//onSubmitEditing={() => {this.focusNextField('2');}}
									value={this.state.regionDescription}
									onChangeText={ (value) => {
										this.setState({ regionDescription: value })
										this._onChangeData();
									}}
									secureTextEntry={false}
									autoCorrect={false}
									autoCapitalize={'none'}
									//keyboardType='numeric'
									returnKeyType={'done'}
									underlineColorAndroid='transparent'
									ref={ input => {this.inputs['4'] = input;}}
								/>
							</View>
						</View>
					</Panel>
					<View style={[styles.card, {marginTop: -4}]}>
						<View style={styles.cardTitle}>
							<Text style={styles.cardTitleText}>Data state</Text>
							<Text>Mode: <Strong>{this.state.dataModeText}</Strong></Text>
							{this.dataMode != dmUndefined && <Text>State: <Strong>{this.state.dataStateText}</Strong></Text>}
							{this.dataMode == dmNewData &&	<Text>Database: <Strong>{this.state.dbSinchronizationText}</Strong></Text>}
							<Text>Expedition: <Strong>{this.state.expeditionSinchronizationText}</Strong></Text>
						</View>

						<View style={{ flexDirection: 'row', justifyContent: 'center' }}>
							<RaisedTextButton
								title='new'
								style={styles.button}
								rippleDuration={600}
								rippleOpacity={0.54}
								color='rgba(52, 52, 52, 0.5)'
								//disabled={}
								titleColor='white'
								onPress={ () => {
									if (isEmpty(this.props.regionCoords)) {
										Alert.alert('Warning', 'You must set region coordinates first!');
									} else {
										this._setNewDatamode();
									}
								}}
							/>
							<RaisedTextButton
								title='save'
								style={styles.button}
								rippleDuration={600}
								rippleOpacity={0.54}
								color='red'
								disabled={!(this.dataState == dsChanged)}
								titleColor='white'
								onPress={ () => {
									const expeditionObj = {
										expeditionName: this.state.expeditionName,
										leaderName: this.state.leaderName,
										startDate: this.state.startDate,
										numberOfDays: this.state.numberOfDays,
										regionDescription: this.state.regionDescription,
										regionCoordinates: this.regionCoords,
										regionZoom: this.zoom,
									}

									this.saveExpedition(expeditionObj)
									.then( (result) => {
										if (this.dataMode == dmNewData) {
											//Make a room for index 0, the index of the first (top) item
											for (let i=0; i<this.expeditionsList.length; i++) {
												this.expeditionsList[i].index++;
											};
											console.log('save new index:', this.currExpeditionIndex);
											const newItem = {
												index: this.currExpeditionIndex, //Set to 0 in func _setNewDatamode
												key: result.id,
												name: result.expeditionName,
												regionDescription: result.regionDescription,
												date: this.getFormattedDate(result.startDate)
											};
											const startIndex = 0;
											const numOfItemsToRemove = 0;
											this.expeditionsList.splice(startIndex, numOfItemsToRemove, newItem);//because of sorting, appended the new expedition on top of items
											this.currId = result.id;
										} else {
											//Update current item in expeditions list
											console.log('save existing index:', this.currExpeditionIndex);
											this.expeditionsList[this.currExpeditionIndex].name = expeditionObj.expeditionName;
											this.expeditionsList[this.currExpeditionIndex].date = expeditionObj.startDate;
											this.expeditionsList[this.currExpeditionIndex].regionDescription = expeditionObj.regionDescription;
										};

										this.dataMode = dmEditData;
										this.dataState = dsSaved;
										this.regionCoordsChanged = false;
										this.featuresChanged = false;
										this.setState({
											currExpeditionName: 'Expedition: ' + expeditionObj.expeditionName,
											expeditions: this.expeditionsList, //re-render expeditions list
											dataModeText: 'Edit data',
											dataStateText: 'Data saved'
										});
									})
									.catch( (error) => {
										console.log('saving error:', error);
										Alert.alert('Saving',error.toString());
									});
								}}
							/>
							<RaisedTextButton
								title='select'
								style={styles.button}
								rippleDuration={600}
								rippleOpacity={0.54}
								color='green'
								disabled={(this.dataMode != dmEditData) || (this.dataState == dsChanged)}
								titleColor='white'
								onPress={ () => {
									let dataObj = {};
									dataObj.expeditionId = this.currId;
									dataObj.regionCoords = this.regionCoords.slice();
									dataObj.regionZoom = this.zoom;
									//dataObj.regionFeatures = this.features;
									dataObj.expeditionName = this.state.expeditionName;
									let responseJSON = {
										exitState: 'select',
										obj: dataObj,
									};
									this._onExit(responseJSON);
								}}
							/>
						</View>
						<View style={{ flexDirection: 'row', justifyContent: 'center' }}>
							<RaisedTextButton
								title='sync'
								style={styles.button}
								rippleDuration={600}
								rippleOpacity={0.54}
								color='rgba(255, 0, 255, 1)'
								disabled={this.dataMode != dmEditData || this.dataState == dsChanged}
								titleColor='white'
								onPress={ () => {
									Alert.alert(
										'Warning',
										'After sinchronization the data become immutable!\n' +
										'Transfer current expedition data to server?',
										[
											//{text: 'Ask me later', onPress: () => console.log('Ask me later pressed')},
											{text: 'Yes', onPress: () => {
											}},
											{text: 'No', onPress: () => {return}, style: 'cancel'},
										],
										{ cancelable: false }
									);
								}}
							/>
							<RaisedTextButton
								title='delete'
								style={styles.button}
								rippleDuration={600}
								rippleOpacity={0.54}
								color='black'
								disabled={this.dataMode != dmEditData}
								titleColor='yellow'
								onPress={ () => {
									console.log('delete current index:', this.currExpeditionIndex);
									Alert.alert(
										'Warning',
										'Delete current expedition?',
										[
											//{text: 'Ask me later', onPress: () => console.log('Ask me later pressed')},
											{text: 'Yes', onPress: () => {
												const allExpeditions = realm.objects('Expedition');
												let currExpedition = allExpeditions.filtered('id='+this.currId)[0];

												realm.write(() => {
													realm.delete(currExpedition); // Delete current expedition from database
												});

												this.expeditionsList.splice(this.currExpeditionIndex, 1); //remove current expedition from the source

												//Re-arrange indices
												let border = this.expeditionsList.length;
												let currIndex = this.currExpeditionIndex;
												while (currIndex < border) {
													this.expeditionsList[currIndex].index--;
													currIndex++;
												};

												this.clearDataField();

												this.regionCoordsDefinition();

												this.currExpeditionIndex = -1;
												this.setState({
													featuresStateText: 'EMPTY',
													featuresStateColor: 'red',
													expeditions: this.expeditionsList, //re-render expeditions list
												});

												this.currId = '';
												this.regionCoords = this.props.regionCoords.slice();
												this.zoom = this.props.regionZoom;
												this.features = '';
												this.regionCoordsChanged = false;
												this.featuresChanged = false;
											}},
											{text: 'No', onPress: () => {return}, style: 'cancel'},
										],
										{ cancelable: false }
									);
								}}
							/>
							<RaisedTextButton
								title='close'
								style={styles.button}
								rippleDuration={600}
								rippleOpacity={0.54}
								color='blue'
								//disabled={}
								titleColor='white'
								onPress={ () => {
									let responseJSON = {
										exitState: 'close',
									};
									this._onExit(responseJSON);
								}}
							/>
						</View>
					</View>
					<Panel title='Expeditions list'>
						<View style={styles.card}>
							<View style={styles.cardTitle}>
								{/*<Text style={styles.cardTitleText}>Expeditions list</Text>*/}
								<FlatList
									data={this.state.expeditions}
									//Simplest render item -> renderItem={({item}) => <Text>{item.key}   {item.name}</Text>}
									renderItem={({ item }) => (
										//For ListItem props see https://react-native-training.github.io/react-native-elements/API/lists/
										<ListItem
											//roundAvatar
											title={`${item.name}     ${item.date}`}
											subtitle={`ID: ${item.key},     Region: ${item.regionDescription}`}
											//avatar={{ uri: item.picture.thumbnail }}
											//avatar={require('../images/avatar1.jpg')}
											containerStyle={{ borderBottomWidth: 0, height: 50 }}
											component={TouchableHighlight}
											underlayColor={'rgba(0,0,255,0.2)'}
											onPress={() => this.getItem(item)}
											selected={this.state.selectedItem}
											hideChevron={this.dataMode == dmEditData && this.currExpeditionIndex != item.index}
											badge={{ value: `${this.expeditionsList.length - item.index}`, textStyle: { color: 'orange' }, containerStyle: { marginTop: 5 } }}
										/>
									)}
									//keyExtractor={item => item.name}
									ItemSeparatorComponent={this._renderSeparator}
									ListHeaderComponent={this._renderHeader}
									ListFooterComponent={this._renderFooter}
									extraData={this.state}  // to enable trackList re-rendering
								/>

							</View>
						</View>
					</Panel>
				</ScrollView>
				{/*
				<TouchableOpacity
					onPress={ () => {
						//this._onExit
						let versions = realm.objects('AKBdbVersions')[0];
						try {
							realm.write(() => {
								realm.delete(versions.dbVersions);
							});
						}
						catch (err) {
							console.log(err.toString());
						}
					}}
					activeOpacity={1} >
					<Text>Delete AKB db versions</Text>
				</TouchableOpacity>
				*/}
			</View>
		)
	}
}

const styles = StyleSheet.create({
	pageContainer: {
		flex: 1, backgroundColor: 'white'
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
		color: 'blue',
		fontSize: 16,
		fontWeight: 'bold',
	},
	label: {
		backgroundColor: 'rgba(0, 0, 255, .05)',
		color: 'black',
		fontSize: 15,
	},
	inputField: {
		textAlign: 'left',
		color: 'blue',
		fontSize: 16,
		padding:0,
	},
	button: {
		margin: 4,
		borderRadius: 5,
	},
});

export default class ExpeditionsScreen extends Component {
	static propTypes = {
		realm: PropTypes.object.isRequired,
		regionCoords: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)).isRequired,
		regionZoom: PropTypes.number.isRequired,
		expeditionData: PropTypes.func.isRequired,
		startProgress: PropTypes.func.isRequired,
		stopProgress: PropTypes.func.isRequired,
	}

	static defaultProps = {
		regionZoom: 0,
	}

	constructor(props) {
		super(props);
	}

	render() {
		return (
			<ExpeditionsForm {...this.props} />
		);
	}
}
