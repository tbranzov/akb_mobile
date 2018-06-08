import RNMessageChannel from 'react-native-webview-messaging';

const helloBtn = document.querySelector('#hello');
const pointBtn = document.querySelector('#point');
const closeOverlayBtn = document.querySelector('#close_overlay');
//const jsonBtn = document.querySelector('#json');
//const eventBtn = document.querySelector('#event');
const messagesContainer = document.querySelector('p');
const positioningCheckbox = document.getElementById('start_tracking');
const chbNearestTrackPoint = document.getElementById('track_point');
const chbViewPosCoordinates = document.getElementById('view_pos_coords');
const chbViewCornerCoordinates = document.getElementById('view_corner_coords');
const chbSaveTrack = document.getElementById('save_track');
const accuracyElement = document.getElementById('accuracy');
const onClickOverlay = document.getElementById('onclick_overlay');

function el(id) {
	return document.getElementById(id);
}

var bottom_left_overlay = new ol.Overlay({
	element: el('bottomleftoverlay'),
	positioning: 'bottom-left',
});

helloBtn.addEventListener('click', () => {
	RNMessageChannel.send('hello from WebView');
});

var top_right_overlay = new ol.Overlay({
	element: el('toprightoverlay'),
	positioning: 'top-right',
});

var cornerCoordsVisible = false;
chbViewCornerCoordinates.addEventListener('click', () => {
	if (!cornerCoordsVisible) {

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
	} else {
		map.removeOverlay(top_right_overlay);
		map.removeOverlay(bottom_left_overlay);
	}

	cornerCoordsVisible = !cornerCoordsVisible;
});

closeOverlayBtn.addEventListener('click', () => {
	isOnclickOverlayVisible = false;
	map.removeOverlay(onclick_overlay);
	closeOverlayBtn.disabled = true;
	pointBtn.disabled = false;
});

const minAccuracy = 25;
var positionChanged = false;
var userBreak;
pointBtn.addEventListener('click', () => {
	if (!positioningCheckbox.checked) {
		waitForProperGeolocation(); //Start after 2 secs, enough for modal panel with proggress bar to start
		positioningCheckbox.click();
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
		var features = vector.getSource().getFeatures(); // In this case the vector is pointLayer itself
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
	for ( i = 0; i < checkPoints.length; i++ ) {
		checkPointCoordinates = checkPoints[i].getGeometry().getCoordinates();
		if (checkPointCoordinates[0] == coordinates[0] && checkPointCoordinates[1] == coordinates[1]) {
			datamode = 'edit';
			break;
		}
	}

	RNMessageChannel.sendJSON({
		command: 'execute',
		payload: {functionName: 'pointControl', geolocation: {coordinates: coordinates, accuracy: accuracy}, datamode: datamode },
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
var trackAvailable = false;
var trackPoints = []; //Array of track-point coordinates in form of open layers features
var trackPointsAccuracy = []; //Twin-array for trackPoints - contains the accuracy of the coordinates for one and the same index
var trackName = ''; //current track primary index value (in this case trackName)
var checkPoints = [];

RNMessageChannel.on('transferTrackFromRN', track => {
	var trackGeolocationData = {};

	//messagesContainer.innerHTML = `Track: ${JSON.stringify(track)}`;
	
	trackName = track.payload.trackName; //Save current track primary index value (in this case trackName)
	messagesContainer.innerHTML = track.payload.trackName + ' (' + track.payload.trackDate + ')';
	trackGeolocationData = track.payload.geoLocations;
	//messagesContainer.innerHTML = `Track: ${JSON.stringify(track.payload.geoLocations)}`;
	
	trackAvailable = !track.payload.emptyTrack; //track.payload.trackName.slice(0,18) == 'Empty track object';

	removeLayer(pointLayer);
	trackPoints = [];
	trackPointsAccuracy = [];
	cratePointLayer();
	
	/*	Show coordinates - for test purposes only
	var text = "Geolocations <br>";
	var i;
	for (i = 0; i < Object.keys(trackGeolocationData).length; i++) {
		text += i.toString() +
				" lon = " + JSON.stringify(trackGeolocationData[i].coordinates[0]) +
				" lat = " + JSON.stringify(trackGeolocationData[i].coordinates[1]) +
				"<br>";
	};
	messagesContainer.innerHTML = text;
	*/
	
	var i;
	var geolocationsCount =  Object.keys(trackGeolocationData).length;
	
	if (geolocationsCount > 0) {
		addPointToTrack(firstPointStyle, [trackGeolocationData[0].coordinates[0], trackGeolocationData[0].coordinates[1]]);
		trackPointsAccuracy[0] = trackGeolocationData[0].accuracy;
	}
	
	for (i = 1; i < geolocationsCount; i++) {
		addPointToTrack(trackPointStyle, [trackGeolocationData[i].coordinates[0], trackGeolocationData[i].coordinates[1]]);
		trackPointsAccuracy[i] = trackGeolocationData[i].accuracy;
	};

	var s = new ol.source.Vector({ features: trackPoints });
	pointLayer.setSource(s);
	addPointLayer(pointLayer);
	
	//This must be moved to event listener for 'terrainInvestigation'
	//from here ...
	removeLayer(checkpointsLayer);
	checkPoints = [];
	// IMPORTANT: fill checkPoints array from payload - not done yet !!!
	crateCheckpointsLayer();
	addPointLayer(checkpointsLayer);
	// ... to here
	
	el('view_track').checked = true;
	
	view.setZoom(initialZoom);

	if (geolocationsCount > 0) {
		//Center view at the first point of the track
		view.setCenter([trackGeolocationData[0].coordinates[0], trackGeolocationData[0].coordinates[1]]);
		
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
    })
);
*/

var trackPointStyle = new ol.style.Style({
	image: new ol.style.Circle({
		radius: 2,
		fill: new ol.style.Fill({
			color: [0, 0, 255, 1]  //color: [255, 204, 102, 1]
		}),
		stroke: new ol.style.Stroke({
			color: [255, 0, 0, 1],  //color: [255, 204, 102, 1],
			width: 1
		})
	}),
	zIndex: 5
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
	zIndex: 5
});

var pointLayer;
function cratePointLayer(){
  pointLayer = new ol.layer.Vector({ 
    source: new ol.source.Vector({ features: trackPoints }) 
  })
}

/* It is fully valid snipped - checkpoint is a circle filled with red color and with blue border
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
	zIndex: 10
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


var checkpointsLayer;
function crateCheckpointsLayer(){
  checkpointsLayer = new ol.layer.Vector({ 
    source: new ol.source.Vector({ features: checkPoints }) 
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

positioningCheckbox.addEventListener('change', function() {
	/* Use this in case you have to clear old track data, before adding new track points
    if (this.checked) {
		if (confirm("Attention!\nAll track data will be lost!\nContinue?") == true) {
			removeLayer(pointLayer);
			trackPoints = [];
			trackPointsAccuracy = [];
			cratePointLayer();
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
		removeLayer(pointLayer);
		cratePointLayer();
		addPointLayer(pointLayer);
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
	
	if (!positioningCheckbox.checked) {
		if (this.checked) {
			this.checked = false;
			alert('Start geolocation first!');
		}
		return;
	}
});

el('view_track').addEventListener('change', function() {
	if (this.checked) {
		addPointLayer(pointLayer);
	} else {
		removeLayer(pointLayer);
	};
});

el('view_checkpoints').addEventListener('change', function() {
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
		if (isOnclickOverlayReady) {
			RNMessageChannel.sendJSON({
				command: 'execute',
				payload: {functionName: 'pointControl', geolocation: {coordinates: onClickOverlayCoordinates, accuracy: 0}, datamode: 'new' },
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
		pointLayer.setSource(s);
		*/
		// This snippet replace the upper one
		// begin
		var point_geom = new ol.geom.Point(coordinates);
		var point_feature = new ol.Feature({
			geometry: point_geom
		});
		point_feature.setStyle(trackPointStyle);
		pointLayer.getSource().addFeature( point_feature );
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
	})
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
			var minDistance = 2.0;
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
				var minCheckPointIndex;

				for ( i=checkPoints.length-1; i>=0 ; i-- ) {
					// Calculate the distance from current GPS-location to the nearest check-point.
					checkPointCoordinates = checkPoints[i].getGeometry().getCoordinates();
					x = checkPointCoordinates[0] - coords[0];
					y = checkPointCoordinates[1] - coords[1];
					distance = Math.sqrt( (x*x) + (y*y) );

					if (distance <= minDistance) {
						found = true;
						minCheckPointIndex = i;
						RNMessageChannel.sendJSON(
							{
								command: 'execute',
								payload: {functionName: 'pointControl', geolocation: {coordinates: checkPointCoordinates, accuracy: accuracy}, datamode: 'edit' },
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

//This must be in event listener for 'terrainInvestigation'
crateCheckpointsLayer();
addPointLayer(checkpointsLayer);
