import RNMessageChannel from 'react-native-webview-messaging';

const minAccuracy = 25;
const positionZIndex = 1;
const areapoligonZIndex = 2;
const expeditiondataZIndex = 3;
const trackpointZIndex = 4;
const checkpointZIndex = 5;

//const helloBtn = document.querySelector('#hello');
const clearBtn = document.querySelector('#clear');
const pointBtn = document.querySelector('#point');
const closeOverlayBtn = document.querySelector('#close_overlay');
//const jsonBtn = document.querySelector('#json');
//const eventBtn = document.querySelector('#event');
const messagesContainer = document.querySelector('p');
const chbPositioning = document.getElementById('start_tracking');
const chbNearestTrackPoint = document.getElementById('track_point');
const chbViewPosCoordinates = document.getElementById('view_pos_coords');
const chbViewCornerCoordinates = document.getElementById('view_corner_coords');
const chbSaveTrack = document.getElementById('save_track');
const chbViewTrack = document.getElementById('view_track');
const chbViewCheckpoints = document.getElementById('view_checkpoints');
const accuracyElement = document.getElementById('accuracy');
const onClickOverlay = document.getElementById('onclick_overlay');

function el(id) {
	return document.getElementById(id);
};

//Expedition data are all tracks and check-points
var expeditiondataLayer;
var checkpointsLayer;

var expeditiondataStyle = new ol.style.Style({
	image: new ol.style.RegularShape({
		fill: new ol.style.Fill({color: 'blue'}),
		stroke: new ol.style.Stroke({color: 'blue', width: 1}),
		points: 4,
		radius: 3,
		angle: Math.PI / 4
	})
});

/* This is fully valid snipped - checkpoint is a circle filled with red color and with blue border
var checkPointStyle = new ol.style.Style({
	image: new ol.style.Circle({
		radius: 4,
		fill: new ol.style.Fill({
			color: [255, 0, 0, 1],
		}),
		stroke: new ol.style.Stroke({
			color: [0, 0, 255, 1],
			width: 1
		})
	}),
});
*/
//https://openlayers.org/en/latest/examples/regularshape.html
var checkPointStyle = new ol.style.Style({
	image: new ol.style.RegularShape({
		radius: 10,
		radius2: 4,
		points: 5,
		angle: 0,
		fill: new ol.style.Fill({
			color: 'red'
		}),
		stroke: new ol.style.Stroke({
			color: 'blue',
			width: 1
		})
	}),
});

var checkPointStyle2 = new ol.style.Style({
	image: new ol.style.RegularShape({
		radius: 10,
		radius2: 4,
		points: 5,
		angle: 0,
		fill: new ol.style.Fill({
			color: 'blue'
		}),
		stroke: new ol.style.Stroke({
			color: 'blue',
			width: 1
		})
	}),
});

var clearExpedition = function() {
	//This operator has to be first
	if (expeditionAvailable && chbViewCornerCoordinates.checked) {
		chbViewCornerCoordinates.click(); 
	};

	messagesContainer.innerHTML = 'No expedition selected';
	expeditionAvailable = false;

	if (chbSaveTrack.checked) {
		chbSaveTrack.click();
	};
	chbSaveTrack.disabled = true;

	if (chbViewTrack.checked) {
		chbViewTrack.click();
	};
	chbViewTrack.disabled = true;

	if (chbViewCheckpoints.checked) {
		chbViewCheckpoints.click();
	};
	chbViewCheckpoints.disabled = true;

	map.removeOverlay(onclick_overlay);
	isOnclickOverlayVisible = false;
	closeOverlayBtn.disabled = true;
	pointBtn.disabled = true;

	map.removeLayer(expeditiondataLayer);

	regionCoordinates = [];
	regionZoom = 0;
	allTracksData = [];
	allTracksPoints = [];

	clearBtn.disabled = true;
};

clearBtn.addEventListener('click', () => {
	clearExpedition();

	RNMessageChannel.sendJSON({
		command: 'clear-expedition',
		payload: {},
	});
});

RNMessageChannel.on('clear-expedition', () => {
	clearExpedition();
});

var bottom_left_overlay = new ol.Overlay({
	element: el('bottomleftoverlay'),
	positioning: 'bottom-left',
});

/*
helloBtn.addEventListener('click', () => {
	RNMessageChannel.send('hello from WebView');
});
*/

var top_right_overlay = new ol.Overlay({
	element: el('toprightoverlay'),
	positioning: 'top-right',
});

var areaLayer;
var drawArea = function(ring) {
//https://stackoverflow.com/questions/27210362/open-layers-3-how-to-draw-a-polygon-programmically?utm_medium=organic&utm_source=google_rich_qa&utm_campaign=google_rich_qa
	var polygon = new ol.geom.Polygon([ring]);

	//If view-projection is Web Mercator
	//polygon.transform('EPSG:4326', 'EPSG:3857');

	var polygonFeature = new ol.Feature(polygon);

	var polygonSource = new ol.source.Vector();
	polygonSource.addFeature(polygonFeature);

	areaLayer = new ol.layer.Vector({
		source: polygonSource,
		zIndex: areapoligonZIndex
	});
	//areaLayer.setZIndex(zIndex);

	map.addLayer(areaLayer);
}

var createAreaPolygon = function(cornerCoords) {
	var minx = cornerCoords[0], //bottom-left longitude
		miny = cornerCoords[1], //bottom-left latitude
		maxx = cornerCoords[2], //top-right longitude
		maxy = cornerCoords[3]; //top-right latitude

	var ring = [
		[minx, maxy], // x0
		[minx, miny], // x1
		[maxx, miny], // x2
		[maxx, maxy], // x3
		[minx, maxy]  // x0
	];

	drawArea(ring);

	RNMessageChannel.sendJSON({
		command: 'save-area-coordinates',
		payload: {areaCoords: ring, zoom: map.getView().getZoom()},
	});
}

var regionVisible = false;
chbViewCornerCoordinates.addEventListener('click', () => {
	if (!regionVisible) {
		if (expeditionAvailable) {
			drawArea(regionCoordinates);
		} else {
			//calculateExtent returns an array having bottom left longitude, latitude and top right longitude and latitude.
			var extent = map.getView().calculateExtent(map.getSize());

			var coords, strCoords, element;

			coords = [extent[0],extent[1]];
			strCoords = 'lon: ' + extent[0].toString() + '<br>' + 'lat: ' + extent[1].toString(); //ol.coordinate.toStringXY(coords,9);
			element = bottom_left_overlay.getElement();
			element.innerHTML = strCoords;
			bottom_left_overlay.setPosition(coords);
			map.addOverlay(bottom_left_overlay);

			coords = [extent[2],extent[3]];
			strCoords = 'lon: ' + extent[2].toString() + '<br>' + 'lat: ' + extent[3].toString(); //ol.coordinate.toStringXY(coords,9);
			element = top_right_overlay.getElement();
			//RNMessageChannel.send('After getElement ' + element);
			element.innerHTML = strCoords;
			top_right_overlay.setPosition(coords);
			map.addOverlay(top_right_overlay);

			createAreaPolygon(extent);
		}
	} else {
		removeLayer(areaLayer);

		if (!expeditionAvailable) {
			map.removeOverlay(top_right_overlay);
			map.removeOverlay(bottom_left_overlay);

			RNMessageChannel.sendJSON({
				command: 'save-area-coordinates',
				payload: {areaCoords: []},
			});
		};
	}

	regionVisible = !regionVisible;
});

closeOverlayBtn.addEventListener('click', () => {
	isOnclickOverlayVisible = false;
	map.removeOverlay(onclick_overlay);
	closeOverlayBtn.disabled = true;
	pointBtn.disabled = false;
});

var positionChanged = false;
var userBreak;
pointBtn.addEventListener('click', () => {
	if (!chbPositioning.checked) {
		waitForProperGeolocation(); //Start after 2 secs, enough for modal panel with proggress bar to start
		chbPositioning.click();
		userBreak = false;
		RNMessageChannel.sendJSON({
			command: 'start-progress',
			payload: {indeterminate: true, caption: 'Waiting for correct GPS location...'},
		});
	} else {
		if (positionChanged) {
			var coordinates = geolocation.getPosition();
			var accuracy = geolocation.getAccuracy();
			openCheckPointForm(coordinates, accuracy);
		}
	}
});

var inProgress;
function waitForProperGeolocation() {
	//Read geolocation every 2 secs
    inProgress = setTimeout(function(){
		/* For test only
		RNMessageChannel.sendJSON({
			command: 'dummy-command',
			payload: {randomNumber: Math.floor(Math.random() * 100) + 1},
		});
		*/
		if (!positionChanged) {
			waitForProperGeolocation();
			return
		}
		var accuracy = 0;
		var coordinates = geolocation.getPosition();
		positionChanged = false;
		if (typeof coordinates === 'undefined' || coordinates === null) {
		} else {
			view.setCenter(coordinates);
			positionFeature.setGeometry(coordinates ? new ol.geom.Point(coordinates) : null);
			accuracyFeature.setGeometry(geolocation.getAccuracyGeometry());
			accuracy = geolocation.getAccuracy();
			accuracyElement.innerText = accuracy + ' [m]';
			accuracy<=minAccuracy ? accuracyElement.style.color = 'black' : accuracyElement.style.color = 'red';
		}
		if (accuracy>0 && accuracy<=minAccuracy) {
			clearTimeout(inProgress);
			RNMessageChannel.sendJSON({
				command: 'stop-progress',
				payload: {},
			});
			openCheckPointForm(coordinates, accuracy);
		} else {
			waitForProperGeolocation();
		}
	}, 2000);
} 

var openCheckPointForm = function (coordinates, accuracy) {
	var datamode = 'new';

	/*      Calculate if overlay is on the map
	var overlay_position = onclick_overlay.getPosition(); //"undefined" before first visualisation
	var view_extent = view.calculateExtent(map.getSize());
	var bool = ol.extent.containsCoordinate(view_extent, overlay_position);
	*/

	if (!isOnclickOverlayVisible && chbNearestTrackPoint.checked) {
		var i;
		var trackPointCoordinates;
		var x, y, distance = 0.0;
		var minDistance = 100000.0;
		var minTrackLocationIndex;
		
		/* OpenLayers example: Get Coordinates of drawn features
		// Get the array of features
		var features = vector.getSource().getFeatures(); // In this case the vector is trackpointsLayer itself
		// Go through this array and get coordinates of their geometry.
		features.forEach(function(feature) {
			alert(feature.getGeometry().getCoordinates());
		});
		*/
		
		for ( i = 0; i < trackPoints.length; i++ ) {
			// Calculate the distance from current GPS-location to the nearest track-location.
			trackPointCoordinates = trackPoints[i].getGeometry().getCoordinates();
			x = trackPointCoordinates[0] - coordinates[0];
			y = trackPointCoordinates[1] - coordinates[1];
			distance = Math.sqrt( (x*x) + (y*y) );

			//Adjust minDistance
			if (distance < minDistance) {
				minDistance = distance;
				minTrackLocationIndex = i;
			}
		}
		//Get the coordinates of the nearest track-point as current data
		coordinates = trackPoints[minTrackLocationIndex].getGeometry().getCoordinates();
		accuracy = trackPointsAccuracy[minTrackLocationIndex];
	} 

	//Check for existing check-point coinsiding with the current
	// 1. track-point (if checkbox chbNearestTrackPoint is checked) or
	// 2. geolocation (if chbNearestTrackPoint is NOT checked)
	var checkPointCoordinates;
	var checkpointId = -1;
	for ( i = 0; i < checkPoints.length; i++ ) {
		checkPointCoordinates = checkPoints[i].getGeometry().getCoordinates();
		if (checkPointCoordinates[0] == coordinates[0] && checkPointCoordinates[1] == coordinates[1]) {
			datamode = 'edit';
			checkpointId = i;
			break;
		}
	};

	RNMessageChannel.sendJSON({
		command: 'execute',
		payload: {
			functionName: 'pointControl',
			geolocation: {
				coordinates: coordinates,
				accuracy: accuracy,
			},
			datamode: datamode,
			checkpointId: checkpointId,
		},
	});
}	

/*
jsonBtn.addEventListener('click', () => {
  RNMessageChannel.sendJSON({
    payload: 'hello'
  });
});

eventBtn.addEventListener('click', () => {
  RNMessageChannel.emit('greetingFromWebview', {
    payload: 'hello'
  });
});
*/

RNMessageChannel.on('text', text => {
  messagesContainer.innerHTML = `Received text from RN: ${text}`;
});

RNMessageChannel.on('json', text => {
  messagesContainer.innerHTML = `Received json from RN: ${JSON.stringify(text)}`;
});

RNMessageChannel.on('greetingFromRN', event => {
  messagesContainer.innerHTML = `Received "greetingFromRN" event: ${JSON.stringify(event)}`;
});

var initialZoom = 19;

var expeditionAvailable = false;
var expeditionName = '';
var regionCoordinates = [];
var regionZoom = 0;
var allTracksPoints = [];//Array for track points of all displaied tracks only
var allTracksData = []; //Array of objects for displaied tracks only

var trackAvailable = false;
var trackPoints = []; //Array of current track point-coordinates in form of OpenLayers features
var trackPointsAccuracy = []; //Twin-array for trackPoints - contains the accuracy of the coordinates for one and the same index
var trackName = ''; //current track name

var checkPoints = [];

RNMessageChannel.on('transferExpeditionData', expedition => {
	if (expedition.payload.expeditionId == 0) {
		//chbViewCornerCoordinates.disabled = false;
	} else {
		if (chbPositioning.checked) {
			chbPositioning.click();
		};

		removeLayer(trackpointsLayer);
		trackPoints = [];
		trackPointsAccuracy = [];
		trackAvailable = false;

		if (chbViewCornerCoordinates.checked) {
			chbViewCornerCoordinates.click();
		};
		chbViewCornerCoordinates.checked = true;

		expeditionAvailable = true;
		expeditionName = expedition.payload.expeditionName;
		messagesContainer.innerHTML = expedition.payload.expeditionName;
		regionCoordinates = expedition.payload.regionCoords;
		regionZoom = expedition.payload.regionZoom;
		allTracksData = expedition.payload.allTracksData;

		view.setZoom(regionZoom);

		var x0 = regionCoordinates[0];
		var x2 = regionCoordinates[2];
		var center = [(x2[0]+x0[0])/2, (x2[1]+x0[1])/2];
		view.setCenter(center);

		drawArea(regionCoordinates);
		regionVisible = true;

		var len = expedition.payload.tracks.length; //Number of tracks in current expedition

		removeLayer(expeditiondataLayer);
		expeditiondataLayer = new ol.layer.Vector();
		if (len > 0) {
			allTracksPoints = [];
			var pFeature;
			var trPoints = [];
			for (var i=0; i<len; i++) {
				trPoints = expedition.payload.tracks[i];
				for (var j=0; j<trPoints.length; j++) {
					pFeature = new ol.Feature({ 
						geometry: new ol.geom.Point([trPoints[j][0], trPoints[j][1]])
					});
					pFeature.setStyle(expeditiondataStyle);
					allTracksPoints.push(pFeature);
				};
			};
			var expeditiondataSource = new ol.source.Vector({ features: allTracksPoints });
			expeditiondataLayer.setSource(expeditiondataSource);
			expeditiondataLayer.setZIndex(expeditiondataZIndex);
			map.addLayer(expeditiondataLayer);
		};

		chbViewCheckpoints.disabled = false;
		chbViewCheckpoints.checked = true;
		removeLayer(checkpointsLayer);
		checkPoints = [];
		
		var point_feature, coords;
		for (var i=0; i<expedition.payload.checkpoints.length; i++){
			coords = [expedition.payload.checkpoints[i][0], expedition.payload.checkpoints[i][1]];
			point_feature = new ol.Feature({
				geometry: new ol.geom.Point(coords)
			});
			point_feature.setStyle(checkPointStyle2);
			checkPoints.push(point_feature);
		};
		
		checkpointsLayer = new ol.layer.Vector();
		var source = new ol.source.Vector({ features: checkPoints });
		checkpointsLayer.setSource(source);
		checkpointsLayer.setZIndex(checkpointZIndex);
		map.addLayer(checkpointsLayer);
		
		clearBtn.disabled = false;
		pointBtn.disabled = false;
	};
});

RNMessageChannel.on('transferTrackData', track => {
	chbSaveTrack.disabled = false;
	chbViewTrack.disabled = false;
	chbViewTrack.checked = true;

	var i;
	var trackGeolocationData = {};

	//messagesContainer.innerHTML = `Track: ${JSON.stringify(track)}`;
	if (track.payload.emptyTrack) {
		var source = expeditiondataLayer.getSource();
		if (track.payload.delAllTracks) {
			source.clear();
			allTracksPoints = [];
			source = new ol.source.Vector({ features: allTracksPoints });
			expeditiondataLayer.setSource(s);
		} else {
			var features = source.getFeatures();
			var tracksCnt = allTracksData.length;
			var currTrackData;
			for (i=0; i<tracksCnt; i++) {
				currTrackData = allTracksData[i];
				if (currTrackData.trackName == trackName) {
					var fpInd, border;
					fpInd = currTrackData.firstPointIndex;
					border = fpInd + currTrackData.pointsCount;

					for (var j=fpInd; j<border; j++) {
						source.removeFeature( allTracksPoints[j], {silent: true} );
					};

					allTracksPoints.splice(fpInd, currTrackData.pointsCount);
					break;
				};
			};
		};
		trackName = '';
		messagesContainer.innerHTML = expeditionName;
	} else {
		trackName = track.payload.trackName;
		messagesContainer.innerHTML = expeditionName + ', ' + trackName + ' (' + track.payload.trackDate + ')';
		//messagesContainer.innerHTML = `Track: ${JSON.stringify(track.payload.geoLocations)}`;
	};

	trackGeolocationData = track.payload.geoLocations;
	
	trackAvailable = !track.payload.emptyTrack;

	removeLayer(trackpointsLayer);
	trackPoints = [];
	trackPointsAccuracy = [];
	createTrackpointsLayer();
	
	var geolocationsCount =  Object.keys(trackGeolocationData).length;
	
	/*	Show coordinates - for test purposes only
	var text = "Geolocations <br>";
	for (i = 0; i < geolocationsCount; i++) {
		text += i.toString() +
				" lon = " + JSON.stringify(trackGeolocationData[i].coordinates[0]) +
				" lat = " + JSON.stringify(trackGeolocationData[i].coordinates[1]) +
				"<br>";
	};
	messagesContainer.innerHTML = text;
	*/
	
	if (geolocationsCount > 0) {
		addPointToTrack(firstPointStyle, [trackGeolocationData[0].coordinates[0], trackGeolocationData[0].coordinates[1]]);
		trackPointsAccuracy[0] = trackGeolocationData[0].accuracy;
	}
	
	for (i = 1; i < geolocationsCount; i++) {
		addPointToTrack(trackPointStyle, [trackGeolocationData[i].coordinates[0], trackGeolocationData[i].coordinates[1]]);
		trackPointsAccuracy[i] = trackGeolocationData[i].accuracy;
	};

	var s = new ol.source.Vector({ features: trackPoints });
	trackpointsLayer.setSource(s);
	addPointLayer(trackpointsLayer);
	
	view.setZoom(regionZoom);

	if (geolocationsCount > 0) {
		if (track.payload.centerAtFirstPoint) {
			//Center the view at the first point of the track
			view.setCenter([trackGeolocationData[0].coordinates[0], trackGeolocationData[0].coordinates[1]]);
		};
		
		chbNearestTrackPoint.disabled = false;
	} else { 
		chbNearestTrackPoint.disabled = true;
	}
});

RNMessageChannel.on('createCheckpoint', payload => {
	if (payload.checkpoint.create) {
		// Add checkpoint to checkpoint vector layer
		var point_geom = new ol.geom.Point(payload.checkpoint.coordinates);
		var point_feature = new ol.Feature({
			geometry: point_geom
		});
		point_feature.setStyle(checkPointStyle);
		checkpointsLayer.getSource().addFeature( point_feature );
		checkPoints.push(point_feature);
	}

	//Remove overlay, no matter how checkpoint was created
	map.removeOverlay(onclick_overlay);
	isOnclickOverlayVisible = false;
	closeOverlayBtn.disabled = true;
	pointBtn.disabled = false;
});

RNMessageChannel.on('removeCheckpoint', payload => {
	if (payload.checkpoint.remove) {
	//Remove only if checkpoint has been created
		var i;
		var checkPointCoordinates, coordinates;
		for ( i=0; i<checkPoints.length; i++ ) {
			checkPointCoordinates = checkPoints[i].getGeometry().getCoordinates();
			coordinates = payload.checkpoint.coordinates;
			if (checkPointCoordinates[0] == coordinates[0] && checkPointCoordinates[1] == coordinates[1]) {
				checkpointsLayer.getSource().removeFeature( checkPoints[i], {silent: true} ); // Remove from layer
				checkPoints.splice(i, 1); // Remove from array
				break;
			}
		}
	}

	map.removeOverlay(onclick_overlay); //Remove overlay, no matter if checkpoint was existed
	isOnclickOverlayVisible = false;
	closeOverlayBtn.disabled = true;
	pointBtn.disabled = false;
});

RNMessageChannel.on('progressEnded', (payload) => {
	clearTimeout(inProgress); //Waiting-procedure was canceled by user
	accuracyFeature.setGeometry(null);
	positionFeature.setGeometry(null);
});

var positionFeature = new ol.Feature();
// This style can be skipped in order to use default style
positionFeature.setStyle(new ol.style.Style({
	image: new ol.style.Circle({
				radius: 6,
				fill: new ol.style.Fill({
					color: '#3399CC'
				}),
				stroke: new ol.style.Stroke({
					color: '#fff',
					width: 2
				}),
			})
    })
);
/* It is fully valid snipped - geoposition is a star. See https://openlayers.org/en/latest/examples/regularshape.html
positionFeature.setStyle(new ol.style.Style({
	image: new ol.style.RegularShape({
		radius: 10,
		radius2: 4,
		points: 5,
		angle: 0,
		fill: new ol.style.Fill({
			color: '#fff'
		}),
		stroke: new ol.style.Stroke({
			color: '#658acf',
			width: 2
		})
	}),
}));
*/

var trackPointStyle = new ol.style.Style({
	image: new ol.style.Circle({
		radius: 2,
		fill: new ol.style.Fill({
			color: [255, 0, 0, 1]  //color: [255, 204, 102, 1]
		}),
		stroke: new ol.style.Stroke({
			color: [255, 0, 0, 1],  //color: [255, 204, 102, 1],
			width: 1
		})
	}),
	zIndex: trackpointZIndex
});

var firstPointStyle = new ol.style.Style({
	image: new ol.style.Circle({
		radius: 2,
		fill: new ol.style.Fill({
			color: [255, 255, 0, 1]  //color: [255, 204, 102, 1]
		}),
		stroke: new ol.style.Stroke({
			color: [0, 0, 255, 1],  //color: [255, 204, 102, 1],
			width: 1
		})
	}),
});

var trackpointsLayer;  //Layer for current track only
function createTrackpointsLayer(){
  trackpointsLayer = new ol.layer.Vector({ 
    source: new ol.source.Vector({ features: trackPoints }),
	zIndex: trackpointZIndex
  })
}

var view = new ol.View({
		center: [0, 0], //or center: ol.proj.transform([2.1833, 41.3833], 'EPSG:4326', 'EPSG:3857'),
		rotation: 0,
		enableRotation: false,
		zoom: 2
	});

var map = new ol.Map({
		target: 'map', // The DOM element that will contains the map
		renderer: 'canvas', // Force the renderer to be used. 'canvas' is default
		layers: [
			new ol.layer.Tile({
				source: new ol.source.OSM()
			})
		],
		controls: ol.control.defaults({
			attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
				collapsible: false
			})
		}),
		view: view
	});

var geolocation = new ol.Geolocation({
		projection: view.getProjection(),
		tracking: false,
		trackingOptions: {
			enableHighAccuracy: true,
			timeout: Infinity,
			maximumAge: 0
		}
	});

chbNearestTrackPoint.addEventListener('change', function() {
	if (this.checked && isOnclickOverlayVisible && trackPoints.length>0) {
		var i;
		var trackPointCoordinates;
		var x, y, distance = 0.0;
		var minDistance = 100000.0;
		var minTrackLocationIndex;

		for ( i = 0; i < trackPoints.length; i++ ) {
			// Calculate the distance from current GPS-location to the nearest track-location.
			trackPointCoordinates = trackPoints[i].getGeometry().getCoordinates();
			x = trackPointCoordinates[0] - onClickOverlayCoordinates[0];
			y = trackPointCoordinates[1] - onClickOverlayCoordinates[1];
			distance = Math.sqrt( (x*x) + (y*y) );

			//Adjust minDistance
			if (distance < minDistance) {
				minDistance = distance;
				minTrackLocationIndex = i;
			}
		}
		//Get the coordinates of the nearest track-point as current onclick_overlay data
		onClickOverlayCoordinates = trackPoints[minTrackLocationIndex].getGeometry().getCoordinates();
		//accuracy = trackPointsAccuracy[minTrackLocationIndex];

		var hdms = ol.coordinate.toStringXY(onClickOverlayCoordinates,9);
		var element = onclick_overlay.getElement();
		element.innerHTML = hdms;
		onclick_overlay.setPosition(onClickOverlayCoordinates);
	}
});

chbPositioning.addEventListener('change', function() {
	/* Use this in case you have to clear old track data, before adding new track points
    if (this.checked) {
		if (confirm("Attention!\nAll track data will be lost!\nContinue?") == true) {
			removeLayer(trackpointsLayer);
			trackPoints = [];
			trackPointsAccuracy = [];
			createTrackpointsLayer();
			//send message here to delete track data from realm database
		} else {
			this.suspendEvents(false); // Stop all events. Be careful with it. Dont forget resume events!
			this.setValue(false);
			this.resumeEvents(); // resume events
		}
    };
	*/
	//var pointButton = el('point');
	if (this.checked) {
		//pointButton.disabled = false;
		positionChanged = false;
		removeLayer(trackpointsLayer);
		createTrackpointsLayer();
		addPointLayer(trackpointsLayer);
		RNMessageChannel.sendJSON(
			{
				command: 'set-primary-key',      //in general, this is the primary key of the schema TrackSchema
				payload: {trackName: trackName}, //in now days this is trackName
			}
		);
		RNMessageChannel.sendJSON({
			command: 'disable-button',
			payload: {buttonName: 'TrackControl'},
		});
	} else {
		//pointButton.disabled = true;
		chbSaveTrack.checked = false;
		accuracyFeature.setGeometry(null);
		positionFeature.setGeometry(null);
		accuracyElement.innerText = '';
		map.removeOverlay(coord_overlay);
		RNMessageChannel.sendJSON(
			{
				command: 'enable-button',
				payload: {buttonName: 'TrackControl'},
			}
		);
	}
	
	geolocation.setTracking(this.checked);
});

chbSaveTrack.addEventListener('change', function() {
	if (!trackAvailable) {
		if (this.checked) {
			this.checked = false;
			alert('No track available!');
		}
		return;
	}
	
	if (!chbPositioning.checked) {
		if (this.checked) {
			this.checked = false;
			alert('Start geolocation first!');
		}
		return;
	}
});

chbViewTrack.addEventListener('change', function() {
	if (this.checked) {
		addPointLayer(trackpointsLayer);
	} else {
		removeLayer(trackpointsLayer);
	};
});

chbViewCheckpoints.addEventListener('change', function() {
	if (this.checked) {
		addPointLayer(checkpointsLayer);
	} else {
		removeLayer(checkpointsLayer);
	};
});

var isOnclickOverlayVisible = false;
var isOnclickOverlayReady = true;
function allowOnclickOverlay() {
    isOnclickOverlayReady = true;
};

var onClickOverlayCoordinates;
onClickOverlay.addEventListener('click',
	function() {
		if (expeditionAvailable && isOnclickOverlayReady) {
			RNMessageChannel.sendJSON({
				command: 'execute',
				payload: {
					functionName: 'pointControl',
					geolocation: {
						coordinates: onClickOverlayCoordinates,
						accuracy: 0
					},
					datamode: 'new',
					checkpointId: -1,
				},
			});
		}
	}
);
/*
onClickOverlay.addEventListener('dblclick', function () {
	alert('Double click over overlay');
});
*/

chbViewPosCoordinates.addEventListener('click', function() {
	if (!this.checked) {
		// Hide coord_overlay
		map.removeOverlay(coord_overlay); //coord_overlay.setPosition(undefined);
	};
});

// update the HTML page when the position changes.
geolocation.on('change', function() {
	positionChanged = true;
	var accuracy = geolocation.getAccuracy();
	  
	accuracyElement.innerText = accuracy + ' [m]';
	accuracy<=minAccuracy ? accuracyElement.style.color = 'black' : accuracyElement.style.color = 'red';
	//RNMessageChannel.send(String(accuracy));

	//el('altitude').innerText = geolocation.getAltitude() + ' [m]';
	//el('altitudeAccuracy').innerText = geolocation.getAltitudeAccuracy() + ' [m]';
	//el('heading').innerText = geolocation.getHeading() + ' [rad]';
	//el('speed').innerText = geolocation.getSpeed() + ' [m/s]';
});

// handle geolocation error.
geolocation.on('error', function(error) {
	var info = document.getElementById('info');
	info.innerHTML = error.message;
	info.style.display = '';
});

var accuracyFeature = new ol.Feature();
geolocation.on('change:accuracyGeometry', function() {
	accuracyFeature.setGeometry(geolocation.getAccuracyGeometry());
});

function addPointToTrack(style,coords) {
	var trackPointFeature = new ol.Feature({ 
		//geometry: new ol.geom.Point(ol.proj.transform(coords, 'EPSG:4326', 'EPSG:3857'))
		geometry: new ol.geom.Point(coords)
	});
	trackPointFeature.setStyle(style);
	trackPoints.push(trackPointFeature);
}

geolocation.once('change:position', function() {
	//view.setCenter(geolocation.getPosition());
	view.setZoom(initialZoom);
});

var coord_overlay = new ol.Overlay({
	element: el('coordinate-overlay'),
});

var onclick_overlay = new ol.Overlay({
		element: onClickOverlay,
		positioning: 'bottom-left',
		//Overlay positioning: 'bottom-left', 'bottom-center', 'bottom-right', 'center-left', 'center-center', 'center-right', 'top-left', 'top-center', 'top-right'
		//Remark: bottom-center has a bug - when is on the right-half of the screen, the tapped location is not exactly under bottom-center of the overlay
});

geolocation.on('change:position', function() {
	var coordinates = geolocation.getPosition();
	var accuracy = geolocation.getAccuracy();

	if (chbSaveTrack.checked) {
		RNMessageChannel.sendJSON({
			command: 'execute',
			payload: {functionName: 'saveGeolocation', geolocation: {coordinates: coordinates, accuracy: accuracy}},
		});

		/* This snippet works fine but it works more slowly then the next one
		addPointToTrack(trackPointStyle,coordinates);
		trackPointsAccuracy.push(accuracy);
		var s = new ol.source.Vector({ features: trackPoints });
		trackpointsLayer.setSource(s);
		*/
		// This snippet replace the upper one
		// begin
		var point_geom = new ol.geom.Point(coordinates);
		var point_feature = new ol.Feature({
			geometry: point_geom
		});
		point_feature.setStyle(trackPointStyle);
		trackpointsLayer.getSource().addFeature( point_feature );
		// end
		
		//addPointToTrack(trackPointStyle,coordinates);
		trackPoints.push(point_feature);
		trackPointsAccuracy.push(accuracy);
		
		chbNearestTrackPoint.disabled = false;
	}
	
	if (chbViewPosCoordinates.checked) {
		// transform it to decimal degrees
		//var degrees = ol.proj.transform(coordinates, 'EPSG:3857', 'EPSG:4326');
		// format a human readable version
		//var hdms = ol.coordinate.toStringHDMS(degrees);
		var hdms = ol.coordinate.toStringXY(coordinates,9);
		// update the coord_overlay element's content
		var element = coord_overlay.getElement();
		element.innerHTML = hdms;
		// position the element (using the coordinate in the map's projection)
		/*
		var glbox = map.getView().calculateExtent(map.getSize()); // doesn't look as expected.
		//var box = ol.proj.transformExtent(glbox,'EPSG:3857','EPSG:4326'); // this looked like what I expected.
		var box = [glbox[0],glbox[1]];
		coord_overlay.setPosition(glbox);
		*/
		coord_overlay.setPosition(coordinates);
		// and add it to the map
		map.addOverlay(coord_overlay);
	};

	view.setCenter(coordinates);

	positionFeature.setGeometry(coordinates ? new ol.geom.Point(coordinates) : null);
});

var positionLayer;
positionLayer = new ol.layer.Vector({
	map: map,
	source: new ol.source.Vector({
		features: [accuracyFeature, positionFeature]
	}),
	zIndex: positionZIndex
});

function addPointLayer(points){
	map.addLayer(points);
}

function removeLayer(points){
	map.removeLayer(points);
}

// register an event handler for the on-map-click event
map.on('click', function(event) {
	if (isOnclickOverlayReady) {
		isOnclickOverlayReady = false;
		if (isOnclickOverlayVisible) {
			isOnclickOverlayVisible = false;
			map.removeOverlay(onclick_overlay);
			closeOverlayBtn.disabled = true;
			pointBtn.disabled = false;
		} else {
			isOnclickOverlayVisible = true;
			// extract the spatial coordinate of the click event in map projection units
			var coords = event.coordinate;

			var accuracy = 0;
			var minDistance = 5.0;
			var i;

			if (chbNearestTrackPoint.checked) {
				var trackPointCoordinates;
				var x, y, distance = 0.0;
				var minDist = 100000.0; //Local min distance
				var minTrackLocationIndex;

				for ( i = 0; i < trackPoints.length; i++ ) {
					// Calculate the distance from current GPS-location to the nearest track-location.
					trackPointCoordinates = trackPoints[i].getGeometry().getCoordinates();
					x = trackPointCoordinates[0] - coords[0];
					y = trackPointCoordinates[1] - coords[1];
					distance = Math.sqrt( (x*x) + (y*y) );

					//Adjust minDist
					if (distance < minDist) {
						minDist = distance;
						minTrackLocationIndex = i;
					}
				}
				//Get the coords of the nearest track-point as current data
				coords = trackPoints[minTrackLocationIndex].getGeometry().getCoordinates();
				accuracy = trackPointsAccuracy[minTrackLocationIndex];
				minDistance = 0.0;
			}
			onClickOverlayCoordinates = coords;  //Save for global use

			var found = false;
			if (checkPoints.length > 0) {
			//Check if check-point is tapped
				var checkPointCoordinates;
				var x, y, distance = 0.0;

				for ( i=checkPoints.length-1; i>=0 ; i-- ) {
					// Calculate the distance from current GPS-location to the nearest check-point.
					checkPointCoordinates = checkPoints[i].getGeometry().getCoordinates();
					x = checkPointCoordinates[0] - coords[0];
					y = checkPointCoordinates[1] - coords[1];
					distance = Math.sqrt( (x*x) + (y*y) );

					if (distance <= minDistance) {
						found = true;
						RNMessageChannel.sendJSON(
							{
								command: 'execute',
								payload: {
									functionName: 'pointControl',
									geolocation: {
										coordinates: checkPointCoordinates,
										accuracy: accuracy
									},
									datamode: 'edit',
									checkpointId: i,
								},
							}
						);
						break;
					}
				}
			}
			
			if (!found) {
				// transform it to decimal degrees
				//var degrees = ol.proj.transform(coords, 'EPSG:3857', 'EPSG:4326');
				// format a human readable version
				//var hdms = ol.coordinate.toStringHDMS(degrees);
				var hdms = ol.coordinate.toStringXY(coords,9);
				// update the onclick_overlay element's content
				var element = onclick_overlay.getElement();
				element.innerHTML = hdms;
				// position the element (using the coordinate in the map's projection)
				onclick_overlay.setPosition(coords);

				// and add it to the map
				map.addOverlay(onclick_overlay);
				closeOverlayBtn.disabled = false;
				pointBtn.disabled = true;
			}
		}
		setTimeout(allowOnclickOverlay, 700); //Timeout needed to avoid second touch immediately after the first one
	}
});

/*
map.on('dblclick', function(event) {
  console.log('doubled');
  var feature = map.forEachFeatureAtPixel(event.pixel,
    function(feature, layer) {
      // do stuff here
    });
});
*/

map.getView().on('change:resolution', function() {
	el('zoom').innerText = map.getView().getZoom();
});
