import React, { Component } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import Modal from 'react-native-modal';
import Icon from 'react-native-vector-icons/Ionicons';
import { Card, Button } from 'react-native-elements';
import { MultiSelectList } from '../components/MultiSelectList';
import { FormExpedition } from '../components/FormExpedition';
import CheckpointScreen from '../components/checkpoint';
import Menu from '../components/menu';
// функция, която връща следващ идентификатор за запис в базата
import { realm } from '../components/RealmSchema';
// функция, която връща форматирана за изобразяване дата
import { getFormattedDate, isEmpty, getPointTypes } from '../components/utilities';
import { serverIPaddr,
          typesEndpoint,
          tagsEndpoint,
          featuresEndpoint } from '../components/constants';

// props, които се подават на компонента през react-navigation:
// this.props.navigation.getParam(expeditionID) - ID на издирването в базата
// this.props.navigation.getParam(objExpedition) - обект, според схемата,
//                            съдържащ издирване със съответното ID
// this.props.navigation.getParam(titleExpedition) -  името на издирването


class CurrentExpedition extends Component {
  // Текстът-заглавие в навигационната лента (горе на екрана)
  static navigationOptions = ({ navigation }) => ({
      title: navigation.getParam('titleExpedition', 'Активно издирване'),
    });

  constructor(props) {
     super(props);

     this.state = { expeditionTitle: '',
               startDate: '',
               leaderName: '',
               recordMode: '',
               expeditionID: -1,
               tracks: [],
               regionSelected: false,
               dataModeText: '',
               dbSinchronizationText: '',
               regionCoordsStateText: '',
               regionCoordsStateColor: '',
               featuresStateText: '',
               featuresStateColor: '',
               isModalVisible: false,
               menuVisible: false,
               modalCheckpointVisible: false,
               GPScoordinates: [], // Координати на точка
               GPSaccuracy: 0, // Точност на GPS
     };

     this.areaParameters = {
             areaCoordinates: [],
             zoom: 0
     };

     this.newAKBdbVersion = {
                 version: '',
                 types: {},
                 tags: {},
                 points: [],
                 editablePoints: [],
                 optTags: '',
             };

     this.optTags = []; //temporary  array
     this.features = ''; //Container for stringified JSON-features inside the selected region
     this.dataMode = dmUndefined;
     this.setNewDatamode = this.setNewDatamode.bind(this);
     this.editPoint = this.editPoint.bind(this);
     this.regionCoordsChanged = false; //true <- if features are manually reloaded by the user
     this.featuresChanged = false; //true <- if features are manually loaded by the user
     this.checkpointId = -1; //ID of selected checkpoint
     this.menuTitle = '';
     // Заглавието на менютата за редактиране и въвеждане на данни за точки и тракове
     this.menuItems = [];
     // Масива с елементите на менютата
     this.checkpointType = -1;
      // Тип на точката
     this.checkpointTitle = '';
     //
     this.MenuSelectedItem = false;
  }

componentDidMount() {
  const { messagesChannel } = global.refToWebView;
// макетна структура с примерни данни за тест на тракове и точки
// да се изтрие при внедряване върху устройство
  const dummyGL1 = {
      coordinates: [57.15, 43.12, 67.18, 23.31],
      accuracy: 5,
  };
  const dummyGL2 = {
      coordinates: [47.15, 33.12, 57.18, 13.31],
      accuracy: 8,
  };
  this.setState({
    tracks: [
      { trackName: 'Трак 1',
        trackDate: '2017/12/18',
        geoLocations: dummyGL1 },
        { trackName: 'Трак 2',
          trackDate: '2016/12/19',
          geoLocations: dummyGL2 },
          { trackName: 'Трак 3',
            trackDate: '2017/12/20',
            geoLocations: dummyGL1 },
            { trackName: 'Трак 4',
              trackDate: '2016/12/21',
              geoLocations: dummyGL2 },
              { trackName: 'Трак 5',
                trackDate: '2017/12/22',
                geoLocations: dummyGL1 },
                { trackName: 'Трак 6',
                  trackDate: '2016/12/23',
                  geoLocations: dummyGL2 },
    ]
  });
  // макетна структура за тест на тракове и точки
  // да се изтрие при внедряване върху устройство

  if (global.activeExpedition !== -1) {
    this.dataCheck(global.activeExpedition);
  }

  this.willFocusSubscription =
      this.props.navigation.addListener('willFocus', this.willFocusHandler);
  //лисънър при добиване на фокус, напр. при превключване от таб в таб

  messagesChannel.on('json', this.messageWebHandler);
}

componentWillUnmount() {
  const { messagesChannel } = global.refToWebView;
  // messageChannel - изтрива се с метода removeListener (а не removeEventListener)
  messagesChannel.removeListener('json', this.messageWebHandler);
  this.willFocusSubscription.remove();
}

setNewDatamode() {
    console.log('Set newdata mode');
    if (global.ct !== '') { //!!! if authorized - change mechanism
        this.sinchronizeWithAKBdb(global.dbVerAKB)
        .then((flag) => {
            if (flag === true) {
                //this.clearDataField();
                this.regionCoordsDefinition(this.areaParameters.areaCoordinates.slice());
                this.loadFeatures(this.areaParameters.areaCoordinates.slice())
                .then((result) => {
                    this.features = JSON.stringify({ state: 'loaded', data: result });
                    Alert.alert('Features length = ', this.features.length.toString());
                })
                .catch((error) => {
                    this.features = JSON.stringify({ state: 'empty' });
                });

                this.setDataFieldsState(true);
                this.dataMode = dmNewData;
                //this.currExpeditionIndex = 0;
                this.setState({ dataModeText: 'New data' });
            }
        });
    } else {
        console.log('Internet connection problem');
        Alert.alert('Internet connection problem',
        'You have to login first, in order to create a new expedition.\nPlease, restore the internet connection and try again.');
    }
}

willFocusHandler = () => {
  if (global.activeExpedition !== -1) { this.dataCheck(global.activeExpedition); }
}


sinchronizeWithAKBdb = async (ver) => {
        console.log('Loading AKB database ...');
        //this.props.startProgress('Fetching AKB-db version',true);
        this.optTags = [];//Initialize temporary array with options for "select" fields.
        //Save the current AKB-db version in the global dbVerAKB-container-object
        console.log(`Версията на базата, предадена на синкронайз: ${global.dbVerAKB}`);
        this.newAKBdbVersion.version = ver;
        //IDs for "Leader checkpoint" and "Checkpoint" points only
        //this.newAKBdbVersion.editablePoints = [18,19];
        //changed conception (see below)
        //Read all AKB-db versions
        const versions = realm.objects('AKBdbVersions')[0];
        console.log('Operation: CREATE NEW AKB-db', ver);
        if (versions === undefined) {
        //Application started for the first time
            console.log('No versions available!');
            //Load types and tags
            if (await this.typesLoaded() && await this.tagsLoaded()) {
                const typesJSON = JSON.parse(this.newAKBdbVersion.types.strJSON);
                const pointIDs = [];
                for (let i = 0; i < typesJSON.length; i++) {
                    if (typesJSON[i].classification.id === 1) {
                        //console.log('i=',i, 'name=', typesJSON[i].name);
                        pointIDs.push(typesJSON[i].id);
                    }
                }
                //IDs for all points - now all points have to be editable
                this.newAKBdbVersion.editablePoints.push(...pointIDs);
                //Load points
                if (await this.pointsLoaded(pointIDs)) {
                    console.log('option tags - 1', this.optTags);
                    this.newAKBdbVersion.optTags = JSON.stringify(this.optTags);
                    const newAKBdbVersions = {
                        dbVersions: [this.newAKBdbVersion],
                        //Create versions array for the first time, including current AKB-database
                    };
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
                    }
                }
            }
        } else {
        //At least one AKB-db version already exist in the local realm database
            console.log('Available versions count:', versions.dbVersions.length);
            let i = false;
            let found = false;
            for (i = 0; i < versions.dbVersions.length; i++) {
                console.log('  version=', versions.dbVersions[i].version);
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
            }
                //Load types and tags
                if (await this.typesLoaded() && await this.tagsLoaded()) {
                    const typesJSON = JSON.parse(this.newAKBdbVersion.types.strJSON);
                    const pointIDs = [];
                    for (i = 0; i < typesJSON.length; i++) {
                        if (typesJSON[i].classification.id === 1) {
                            //console.log('i=',i, 'name=', typesJSON[i].name);
                            pointIDs.push(typesJSON[i].id);
                        }
                    }
                    //console.log(pointIDs);
                    //IDs for all points - now all points have to be editable
                    this.newAKBdbVersion.editablePoints.push(...pointIDs);
                    //Load points
                    if (await this.pointsLoaded(pointIDs)) {
                        console.log('option tags - 2a', this.optTags);
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
                            Alert.alert('Error on saving new AKB-database version!',
                              e.message.toString());
                            return false;
                        }
                    }
                }
        }
        //this.props.stopProgress();
        return false;
    }

pointsLoaded = async (pointIDs) => {
        console.log('Loading points ...');
        const tagsJSON = JSON.parse(this.newAKBdbVersion.tags.strJSON);

        for (let i = 0; i < pointIDs.length; i++) {
            const endPoint = `${serverIPaddr}meta/1/${pointIDs[i].toString()}`;
            console.log('endPoint', endPoint);
            try {
                const point = await fetch(
                    endPoint,
                    {
                        method: 'GET',
                        t: global.ct
                    });

                const pointJSON = await point.json();

                if (pointJSON.meta.success === true) {
                    const newPoint = {
                        id: 0,
                        strJSON: '',
                    };
                    const pointId = pointIDs[i];
                    const pointMetadata = pointJSON.data.metadata;
                    newPoint.id = pointId;
                    newPoint.strJSON = await JSON.stringify(pointMetadata);
                    //console.log('newPoint',newPoint);
                    await this.newAKBdbVersion.points.push(newPoint);
                    //Return the point in a class accessible object
                    if (this.newAKBdbVersion.editablePoints.indexOf(pointId) >= 0) {
                        for (let j = 0; j < pointMetadata.length; j++) {
                            const item = pointMetadata[j];
                            if (item.type === 'txt' && item.properties.field === 'select') {
                                const tagcode = item.properties.options.tag_code;
                                let currTag;
                                const downloaded = [];

                                const inDownloaded = (code) => {
                                    for (let ii = 0; ii < downloaded.length; ii++) {
                                        if (downloaded.indexOf(code) >= 0) return true;
                                    }
                                    return false;
                                };

                                //Avoid tag duplicating
                                for (let k = 0; k < tagsJSON.length; k++) {
                                    currTag = tagsJSON[k];
                                    if (currTag.code === tagcode && !inDownloaded(tagcode)) {
                                        if (await this.loadTagsById(currTag.id, tagcode)) {
                                            downloaded.push(tagcode);
                                        } else {
                                            return false;
                                        }
                                    }
                                }
                            }
                        }
                    }
                } else {
                    console.log('error: ', JSON.stringify(pointJSON.meta.errors));
                    Alert.alert(
                        'Get points - unsuccess error',
                        JSON.stringify(pointJSON.meta.errors)
                    );
                    return false;
                }
            } catch (e) {
                console.log('error: ', e.toString());
                Alert.alert('Get points - fetch error', e.toString());
                return false;
            }
        }

        return true;
    }

loadTagsById = async (id, tagcode) => {
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
                t: global.ct,
            }
        );

        const resultJSON = await result.json();

        if (resultJSON.meta.success === true) {
            const tagsJSON = resultJSON.data.tags;
            //await Alert.alert('fetch result:', JSON.stringify(tagsJSON));
            let currTag;
            let tags;
            for (let i = 0; i < tagsJSON.length; i++) {
                tags = {};
                currTag = tagsJSON[i];
                tags.id = tagcode;
                tags.values = currTag.name; // + ' / ' + currTag.code;
                await this.optTags.push(tags);
            }
            //await Alert.alert('tags:', JSON.stringify(tags));
            //await Alert.alert('this.optTags:', JSON.stringify(this.optTags));
            return true;
        }
        console.log('loadTagsById', resultJSON.data.tags.meta.errors);
        Alert.alert(
            'loadTagsById - unsuccess error',
            JSON.stringify(resultJSON.data.tags.meta.errors)
        );
        return false;
    } catch (e) {
        console.log('error', e.toString());
        Alert.alert('loadTagsById - fetch error', e.toString());
        return false;
    }
}

loadFeatures = (regionCoords) => {
    console.log('Loading features from server...');
    return new Promise((resolve, reject) => {
        let currStrCoords;
        const arr = [];
        //const regionCoords = this.areaParameters.areaCoordinates;
        console.log(`regionCoords value: ${regionCoords}`);
        let regionStrCoords = '';
        for (let i = 0; i < regionCoords.length; i++) {
            currStrCoords = `geo[${i.toString()}][]=${regionCoords[i][0].toString()}&geo[${i.toString()}][]=${regionCoords[i][1].toString()}`;
            arr.push(currStrCoords);
        }
        regionStrCoords = arr.join('&');

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
        //let url = featuresEndpoint + "?t=" + global.ct + "&" + encodeURIComponent(regionStrCoords);
        const url = `${featuresEndpoint}?t=${global.ct}&${regionStrCoords}`;
        console.log(url);
        fetch(
            url,
            {
                method: 'GET'
            }
        )
        .then((features) => {
            console.log('features', features);
            //Convert to JSON for communication error checking.
            //It is also JSON-format validity check
            features.json()
            .then((featuresJSON) => {
                if (featuresJSON.meta.success === true) {
                    //console.log(JSON.stringify(featuresJSON.data.features,null,2));
                    global.dbVerAKB = featuresJSON.meta.version; //Update the active (last) version
                    this.setState({ featuresStateText: 'LOADED', featuresStateColor: 'green' });
                    this.featuresChanged = true;
                    resolve(featuresJSON.data.features);
                } else {
                    this.setState({ featuresStateText: 'EMPTY', featuresStateColor: 'red' });
                    console.log('error', featuresJSON.meta.errors);
                    Alert.alert(
                        'Get tags - unsuccess error',
                        JSON.stringify(featuresJSON.meta.errors)
                    );

                    const reason = new Error(featuresJSON.meta.errors);
                    reject(reason);
                }
            })
            .catch((e) => {
                console.log(e);
                Alert.alert('error', e.toString());
                reject(e);
            });
        })
        .catch((e) => {
            console.log(e);
            Alert.alert('error', e.toString());
            reject(e);
        });

        console.log('end');
    });
}

openPointForm(geolocation, datamode) {
    console.log('Open point data screen ...');

    this.setState({
        GPScoordinates: geolocation.coordinates,
        GPSaccuracy: geolocation.accuracy,
        checkPointDataMode: datamode,
        // Да се въведе съобщение за потребителите, когато данните бъдат записани
        //selectedNotes: [],
        //checkpointPhotos: [],
    });

    Alert.alert(
        'Select',
        'Point operation',
        [
            { text: 'Move', onPress: () => { } },
            { text: 'Edit',
              onPress: () => {
                Alert.alert(
                    'Select',
                    'Modal panel type for point data',
                    [
                        {
                          text: 'Old',
                          onPress: () => this.setState({ modalPointControlVisible: true })
                        },
                        {
                        text: 'New',
                        onPress: () => {
                            if (datamode === 'new') {
                                this.processMenuItem = this.editPoint;
                                this.menuTitle = 'Create point of type';
                                this.menuItems = getPointTypes(realm);
                                this.setState({ menuVisible: true });
                            } else {
                                this.checkpointType = -1; //Read the type from DB
                                this.setState({ modalCheckpointVisible: true });
                            }
                        } },
                        { text: 'Cancel', onPress: () => { }, style: 'cancel' },
                    ],
                    { cancelable: false }
                );
            } },
            { text: 'Cancel', onPress: () => { }, style: 'cancel' },
        ],
        { cancelable: false }
    );
 }

pointControlAt(geolocation, datamode) {
  if (geolocation.accuracy > 25) {
    Alert.alert(
      'Warning',
      'Bad accuracy.\nProceed on your own responsibility ?',
      [
          { text: 'Cancel', onPress: () => { }, style: 'cancel' },
          { text: 'OK', onPress: () => this.openPointForm(geolocation, datamode) },
      ],
      { cancelable: false }
    );
  } else {
      this.openPointForm(geolocation, datamode);
  }
}

processMenuItem = (index) => {}

editPoint(index) {
  this.setState({ menuVisible: false });
  this.MenuSelectedItem = false;

  if (index >= 0) {
      this.checkpointType = this.menuItems[index].id;
      this.checkpointTitle = this.menuItems[index].label;
      this.MenuSelectedItem = true;
  }
}

messageWebHandler = (jsonObject) => {
    switch (jsonObject.command) {
      case 'execute':
          if (jsonObject.payload.functionName === 'pointControl') {
              this.checkpointId = jsonObject.payload.checkpointId;
              this.pointControlAt(jsonObject.payload.geolocation, jsonObject.payload.datamode);
          }
          /*
                  if (jsonObject.payload.functionName === 'saveGeolocation') {
                      this.saveGeolocation(this.state.trackName, jsonObject.payload.geolocation);
                  }
                  if (jsonObject.payload.functionName === 'featureInfo') {
                      if (jsonObject.payload.featureId !== undefined) {
                          this.showFeature(jsonObject.payload.featureId);
                      }
                  }
                  if (jsonObject.payload.functionName === 'featureMenu') {
                      this.showMenu(jsonObject.payload.features);
                  }
            */
          break;
        default: // 'save-area-coordinates':
            this.areaParameters.areaCoordinates = jsonObject.payload.areaCoords;
            this.areaParameters.zoom = jsonObject.payload.zoom;
            console.log('area polygon point count: ', this.areaParameters.areaCoordinates.length);
            this.setState({ regionSelected: true });
            this.regionCoordsChanged = true;
            break;
      }
}

regionCoordsDefinition = (regionCoords) => {
        let txt;
        let clr;
        if (regionCoords.length === 0) {
            txt = 'UNDEFINED';
            clr = 'red';
        } else {
            txt = 'DEFINED';
            clr = 'green';
        }

        this.setState({
            regionCoordsStateText: txt,
            regionCoordsStateColor: clr,
        });
    }

dataCheck(expedition) {
  //expedition == id на издирване
  const allExpeditions = realm.objects('Expedition');
  const currExpedition = allExpeditions.filtered(`id=${expedition}`)[0];
    this.setState({ startDate: getFormattedDate(currExpedition.startDate),
                    leaderName: currExpedition.leaderName,
                    expeditionID: currExpedition.id,
                    expeditionTitle: currExpedition.expeditionName,
                    recordMode: 2,
     });
     this.features = currExpedition.regionFeatures;
     this.areaParameters.areaCoordinates = JSON.parse(currExpedition.regionCoordinates);
     this.areaParameters.zoom = currExpedition.regionZoom;
}

typesLoaded = async () => {
    console.log('Loading types ...');
    const newTypes = {
        strJSON: '',
    };

    try {
        const types = await fetch(
            typesEndpoint,
            {
                method: 'GET',
                t: global.ct
            });

        const typesJSON = await types.json();

        if (typesJSON.meta.success === true) {
            newTypes.strJSON = await JSON.stringify(typesJSON.data.types);
            this.newAKBdbVersion.types = newTypes; //Save the types in a class accessible object
            return true;
        }

        console.log('error', typesJSON.meta.errors);
        Alert.alert(
            'Get types - unsuccess error',
            JSON.stringify(typesJSON.meta.errors)
        );
        return false;
    } catch (e) {
        console.log('error', e.toString());
        Alert.alert('Get types - fetch error', e.toString());
        return false;
    }
}

tagsLoaded = async () => {
    console.log('Loading tags description ...');
    const newTags = {
        strJSON: '',
    };

    try {
        const tags = await fetch(
            `${tagsEndpoint}0`,
            {
                method: 'GET',
                t: global.ct
            });

        const tagsJSON = await tags.json();

        if (tagsJSON.meta.success === true) {
            newTags.strJSON = await JSON.stringify(tagsJSON.data.tags);
            this.newAKBdbVersion.tags = newTags; //Return the tags in a global object
            return true;
        }

        console.log('error', tagsJSON.meta.errors);
        Alert.alert(
            'Get tags - unsuccess error',
            JSON.stringify(tagsJSON.meta.errors)
        );
        return false;
    } catch (e) {
        console.log('error', e.toString());
        Alert.alert('Get tags - fetch error', e.toString());
        return false;
    }
}

selectedExpedition = (data) => {
    console.log('Close expeditions screen ...');
    if (data.exitState === 'select') {
        //this.setState({ expeditionID: data.obj.expeditionId });
        this.readExpeditionTracks(data.obj.expeditionId)
        .then((tracks) => {
            //On the map all points from all tracks are in one layer,
            //so here we are creating array (allTracksCoords) with united coordinates
            const tracksCount = tracks.length;
            const allTracksCoords = [];
            let currTrackCoords;
            let coords;
            const allTracksData = [];
            let currTrackData;
            let notEmptyTrack;
            let globalIndex = 0;
            for (let i = 0; i < tracksCount; i++) {
                currTrackCoords = [];
                currTrackData = {};
                const len = tracks[i].geoLocations.length;
                notEmptyTrack = len > 0;
                for (let j = 0; j < len; j++) {
                    coords = [];
                    coords.push(tracks[i].geoLocations[j].coordinates[0]);
                    coords.push(tracks[i].geoLocations[j].coordinates[1]);
                    currTrackCoords.push(coords);
                    if (j === 0 && notEmptyTrack) {
                        currTrackData.trackName = tracks[i].trackName;
                        currTrackData.firstPointIndex = globalIndex;
                        currTrackData.pointsCount = len;
                    }
                    globalIndex++;
                }
                allTracksCoords.push(currTrackCoords);
                allTracksData.push(currTrackData);
            }

            data.obj.tracks = allTracksCoords;
            data.obj.allTracksData = allTracksData;

            this.readExpeditionCheckpoints(data.obj.expeditionId)
            .then((checkpoints) => {
                const chptsCoords = [];
                for (let i = 0; i < checkpoints.length; i++) {
                    chptsCoords.push(checkpoints[i].geoLocation.coordinates);
                }
                data.obj.checkpoints = chptsCoords;

                const featuresJSON = JSON.parse(data.obj.regionFeatures);
                //console.log('features', featuresJSON);
                const processedFeatures = []; //Some id data and coordinates only
                featuresJSON.data.map((currFeature) => {
                    //if (currFeature.classification == 3) { // 1=Point, 2=LineString, 3=Polygon
                        //if (currFeature.type == 14) { // 14 е от type listing
                            currFeature.metadata.map((currField) => {
                                //if (currField.type == 'geo' && currField.value.type == 'Polygon') {
                                if (currField.type === 'geo') {
                                    const newFeature = {
                                        type: 'Feature',
                                        id: currFeature.id,
                                        geometry: {},
                                        properties: { editable: false }
                                    };

                                    /*  currField.value = {
                                            type = 'Point', 'Polygon' или 'LineString'
                                            coordinates = ...
                                        }
                                        и е готов обект за използване в GeoJSON-структурата
                                    */
                                    newFeature.geometry = currField.value;
                                    processedFeatures.push(newFeature);
                                }
                            });
                        //};
                    //};
                });
                //data.obj.regionFeatures = '';
                data.obj.regionFeatures = {
                    type: 'FeatureCollection',
                    crs: {
                        type: 'name',
                        properties: {
                            name: 'EPSG:3857'
                        }
                    },
                    features: processedFeatures
                };
                //console.log("Features's data",data.obj.features);

                this.emitTransferExpeditionData(data.obj);
            })
            .catch((err) => {
                console.log('read expedition checkpoints', err);
                Alert.alert('Read checkpoints', err.toString());
                return;
            });
        })
        .catch((err) => {
            console.log('read expedition tracks', err);
            Alert.alert('Read tracks', err.toString());
        });
    } else { //data.exitState == 'close'
        const expeditions = realm.objects('Expedition');
        const expedition = expeditions.filtered(
          `id=${this.state.expeditionID.toString()}`)[0];
        //if active expedition was deleted
        if (expedition === undefined) {
            this.setState({ expeditionID: 0 });
            global.refToWebView.emit('clear-expedition', { payload: {} });
        }
    }
 }

 selectedCheckpoint = (data) => {
     console.log('Close checkpoint data screen ...');
     this.setState({ modalCheckpointVisible: false });

     if (data.exitState === 'remove') {
         this.emitRemoveCheckpoint(data.obj.coordinates, data.obj.remove);
     } else { //data.exitState == 'exit'
         this.emitCreateCheckpoint(
             this.state.GPScoordinates,
             this.state.GPSaccuracy,
             data.obj.createCheckpointMark
         );
     }
  }

emitCreateCheckpoint = (coordinates, accuracy, create) => {
    const checkpointData = { coordinates, accuracy, create };
    global.refToWebView.emit('createCheckpoint', { checkpoint: checkpointData });
 }

 emitRemoveCheckpoint = (coordinates, remove) => {
    const checkpointData = { coordinates, remove };
    global.refToWebView.emit('removeCheckpoint', { checkpoint: checkpointData });
 }

 readExpeditionTracks = (expeditionId) => {
     return new Promise((resolve, reject) => {
         try {
             const expeditions = realm.objects('Expedition');
             const expedition = expeditions.filtered(`id=${expeditionId}`)[0];
             resolve(expedition.tracks);
         } catch (e) {
             reject(e);
         }
     });
  }

readExpeditionCheckpoints = (expeditionId) => {
    return new Promise((resolve, reject) => {
        try {
            const expeditions = realm.objects('Expedition');
            const expedition = expeditions.filtered(`id=${expeditionId}`)[0];
            resolve(expedition.checkPoints);
        } catch (e) {
            reject(e);
        }
    });
 }

emitTransferExpeditionData = (obj) => {
   const maxLen = 524288; // 0.5 MB = 524288 Bytes
   const objStr = JSON.stringify(obj);
   console.log(`Expedition object to WebView: ${objStr}`);
   const len = objStr.length;
   if (len < maxLen) {
       //Alert.alert('Transfer the whole data', 'Length = ' + objStr.length.toString());
       global.refToWebView.emit('transferExpeditionData', { payload: obj });
   } else {
       let intPart = parseInt(len / maxLen, 10);
       if ((len / maxLen) % 1 > 0) intPart++;
       //Alert.alert('Transfer partial data', intPart.toString() + ' parts');
       const initObj = {
           dataType: 'JSON', //JSON or string only
           partsCount: intPart,
       };
       global.refToWebView.emit('initPartialTransfer', { payload: initObj });

       for (let i = 0; i < intPart; i++) {
           const partData = {
               ind: i,
               partData: objStr.slice(maxLen * i, maxLen * (i + 1))
           };
           global.refToWebView.emit('partialTransfer', { payload: partData });
       }
   }
}

toggleModalwithDataCheck(expRec) {
    if (expRec) { // ако е подаден аргумент прави проверка на полето данни и ререндва
        this.dataCheck(expRec);
        this.featuresChanged = false;
        this.regionCoordsChanged = false;
    }

    this.toggleModal();
}

// Превключва модален прозорец
toggleModal = () =>
  this.setState({ isModalVisible: !this.state.isModalVisible });

// Определя параметри и подава към форма за редактиране на данните
// за издирването(модален прозорец)
renderModalEditExpedition() {
    return (
      <FormExpedition
        closeModal={this.toggleModalwithDataCheck.bind(this)}
        expeditionID={this.state.expeditionID}
        recordMode={this.state.recordMode}
        regionZoom={this.areaParameters.zoom}
        regionCoordinates={JSON.stringify(this.areaParameters.areaCoordinates)}
        regionFeatures={this.features}
      />
  );
}

// Рендва карта за избор на регион на експедицията
renderCardRegionSelect() {
    const { regionSelected } = this.state;
    return (
      <Card flexDirection='row' wrapperStyle={{ justifyContent: 'space-between' }}>
          <View style={thumbnailContainerStyle} >
            <Icon
              name={'ios-bookmark'}
              md={'md-bookmark'}
              size={50}
              color={'navy'}
            />
          </View>
          <View style={headerContentStyle} >
            <Text style={headerTextStyle}>Избери регион</Text>
            <Text>{ `Избран регион: ${regionSelected ? 'Успешно избран' : 'Неизбран'}`}</Text>
          </View>
          <TouchableOpacity onPress={() => this.props.navigation.navigate('Home')}>
            <Icon
              name={'ios-more'}
              md={'md-more'}
              size={50}
              color={'tomato'}
            />
          </TouchableOpacity>
      </Card>
    );
  }

// Рендва карта с инструментални бутони
renderCardTools() {
    return (
      <Card flexDirection='row' wrapperStyle={{ justifyContent: 'space-between' }}>
        {iconBox('Избери регион', 'ios-map', 'navy')}
        {iconBox('Зареди фичъри', 'ios-cloud-download', 'navy')}
        {iconBox('Запази промените', 'ios-archive', 'navy')}
      </Card>
    );
  }

// Рендва карта за вход във формата за редактиране на данните за издиравне
renderCardEditExpedition() {
    const { expeditionTitle, startDate, leaderName } = this.state;
    return (
      <Card flexDirection='column' wrapperStyle={{ justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={headerContentStyle} >
            <Text style={headerTextStyle}>{expeditionTitle}</Text>
            <Text>{ `Начало: ${startDate}`}</Text>
            <Text>{ `Ръководител: ${leaderName}`}</Text>
          </View>
          <TouchableOpacity onPress={this.toggleModal}>
            <Icon
              name={'ios-more'}
              md={'md-more'}
              size={50}
              color={'tomato'}
            />
          </TouchableOpacity>
        </View>
      </Card>
    );
  }

renderTracks() {
    if (this.state.tracks) {
      return (
        <Card
          titleStyle={{ paddingTop: 12 }}
          dividerStyle={{ marginBottom: 2, marginLeft: 5, marginRight: 5 }}
          containerStyle={{ alignItems: 'center', padding: 0, margin: 0, marginTop: 15 }}
          title='Записани тракове и точки: '
        >
          <MultiSelectList data={this.state.tracks} />
        </Card>
      );
    }
  }

renderNoSelectedExpedition() {
  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.headerMessage}>Не е избрано издирване!</Text>
      </View>
      <Button
        large
        backgroundColor='#03A9F4'
        leftIcon={{ name: 'ios-bookmarks', type: 'ionicon' }}
        containerViewStyle={styles.containerButton}
        title='Стартирай ново издирване'
        onPress={() => this.props.navigation.navigate('NewExpedition')}
      />
      <Button
      large
        leftIcon={{ name: 'ios-folder', type: 'ionicon' }}
        containerViewStyle={styles.containerButton}
        title='Избери издирване от архива'
        onPress={() => this.props.navigation.navigate('Expeditions')}
      />
    </View>
  );
}

renderSelectedExpedition() {
    return (
      <View>
        <View>
          {this.renderCardEditExpedition()}
        </View>
        <View>
          {this.renderCardTools()}
        </View>
        <View>
          {this.renderTracks()}
        </View>
        <View>
          <Modal
            isVisible={this.state.isModalVisible}
            onModalHide={() => this.renderTracks()}
          >
            {this.renderModalEditExpedition()}
          </Modal>
          { /* Modal panel menu */ }
          <Modal
              isVisible={this.state.menuVisible}
              onShow={() => {}}
              onModalHide={() => {
                    if (this.MenuSelectedItem) {
                    this.setState({ modalCheckpointVisible: true });
                  }
                }
              }
          >
              <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} >
                  <Menu
                    title={this.menuTitle}
                    menuItems={this.menuItems}
                    onSelectMenuItem={this.processMenuItem}
                  />
              </View>
          </Modal>
          { /* Modal panel for check point data */ }
          <Modal
              isVisible={this.state.modalCheckpointVisible}
              onModalHide={() => {}}
          >
              <CheckpointScreen
                  realm={realm}
                  expeditionId={this.state.expeditionID}
                  checkpointType={this.checkpointType}
                  checkpointTitle={this.checkpointTitle}
                  checkpointInd={this.checkpointId}
                  coordinatesGPS={this.state.GPScoordinates}
                  accuracyGPS={this.state.GPSaccuracy}
                  selectedCheckpoint={this.selectedCheckpoint}
              />
          </Modal>

        </View>
      </View>
  );
}

renderRouter(expSelected) {
  console.log(`Expedition ID: ${expSelected}`);

  if (expSelected === -1) {
    return this.renderNoSelectedExpedition();
  }

  return (
      this.renderSelectedExpedition()
  );
}

render() {
      return (
        this.renderRouter(this.state.expeditionID)
    );
  }
}

const styles = {
  container: {
     flex: 1,
     flexDirection: 'column',
     alignItems: 'center',
     justifyContent: 'center',
     backgroundColor: 'white',
     margin: 0,
     padding: 0
   },
   containerButton: {
    width: '90%',
    marginTop: 20,
    marginBottom: 20,
  },
  headerMessage: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'darkslategrey',
  },
  containerIconBox: {
     flexDirection: 'column',
     alignItems: 'center',
     justifyContent: 'center',
     margin: 4,
     padding: 4
   },
   messageIcon: {
     padding: 4,
     margin: 2,
   },
   iconLabel: {
     fontSize: 10,
     color: 'darkslategrey',
   },
  headerContentStyle: {
    flexDirection: 'column',
    justifyContent: 'space-around'
  },
  contentViewStyle: {
    paddingTop: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    elevation: 2,
    position: 'relative'
  },
  headerViewStyle: {
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
    height: 45,
    paddingTop: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    elevation: 2,
    position: 'relative'
  },
  headerTextStyle: {
    fontSize: 18
  },
  thumbnailStyle: {
    height: 50,
    width: 50
  },
  coverStyle: {
    height: 300,
    flex: 1,
    width: null
  },
  thumbnailContainerStyle: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    marginRight: 15
  },
};

const { headerContentStyle,
        thumbnailContainerStyle,
        headerTextStyle,
        headerViewStyle,
        iconContainerStyle,
        contentViewStyle
} = styles;

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

const iconBox = (textLabel, msgIcon, clrIcon) => (
    <View style={styles.containerIconBox}>
      <View>
        <Icon
          name={msgIcon}
          size={40}
          type='ionicon'
          color={clrIcon}
          iconStyle={styles.messageIcon}
          onPress={() => console.log('hello')}
        />
      </View>
      <View>
        <Text style={styles.iconLabel}> {textLabel} </Text>
      </View>
    </View>
  );

export { CurrentExpedition };
