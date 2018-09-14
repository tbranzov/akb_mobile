import RNMessageChannel from 'react-native-webview-messaging';

/*
var fontAwesome = new FontFace('FontAwesome', 'url(FontAwesome.ttf)');
fontAwesome.load().then(function(font){
  // with canvas, if this is ommited won't work
  document.fonts.add(font);
});
*/

const minAccuracy = 5; //Has to be equal to const in pointControlAt function in App.js
const hitTOLERANCE = 1;
const tilesZIndex = 0;
const positionZIndex = 2;
const areapoligonZIndex = 3;
const featuresZIndex = 4;
const expeditiondataZIndex = 5;
const trackpointZIndex = 6;
const checkpointZIndex = 7;

//const helloBtn = document.querySelector('#hello');
const clearBtn = document.querySelector('#clear');
//const pointBtn = document.querySelector('#point');
const changeEPSGBtn = document.querySelector('#epsg');
//const jsonBtn = document.querySelector('#json');
//const eventBtn = document.querySelector('#event');
const messagesContainer = document.querySelector('#title');
const chbPositioning = document.getElementById('start_tracking');
const chbNearestTrackPoint = document.getElementById('track_point');
const chbViewPosCoordinates = document.getElementById('view_pos_coords');
const chbViewCornerCoordinates = document.getElementById('view_corner_coords');
const chbSaveTrack = document.getElementById('save_track');
const chbViewTrack = document.getElementById('view_track');
//const chbViewCheckpoints = document.getElementById('view_checkpoints');
//const chbZoomTreshold = document.getElementById('zoom_treshold');
const accuracyElement = document.getElementById('accuracy');
const zoomElement = document.getElementById('zoom');
const onClickOverlay = document.getElementById('onclick_overlay');
const movePointOverlayElement = document.getElementById('movepoint_overlay');

const zoomTreshold = 15;
const coordSofia = [2601359.913790558, 5262826.329090097];

var coordType = 'EPSG-4326'; //EPSG-4326 <- Geographic coordinates; EPSG-3857 <- projection coords
var viewPoints = false;
var zoomTresholdActive = false;

var accessToken = '';
var sourceTopo50K = new ol.source.TileWMS({
					url: 'http://93.152.172.53/wms?t=' + accessToken,
					params: {
						'LAYERS': 'bgtopo50k',
						'TILED': true,
						'FORMAT': 'image/png',
						'TRANSPARENT': false,
						'MAP': 'raster.map'
					}
				});
var sourceOSM = new ol.source.OSM();

RNMessageChannel.on('transferAccessToken', (data) => {
	accessToken = data.payload.accessToken;
	sourceTopo50K.setUrl('http://93.152.172.53/wms?t=' + accessToken);
	// Change to xyz url..
	//sourceTopo50K.setUrl('http://otile1.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.jpg');
	//see also https://stackoverflow.com/questions/46032026/how-to-change-a-open-layer-tile-source
});

var coordiatesToString = function(coords, rows) {
	var coordStr;
	if (coordType == 'EPSG-4326') {
		// transform it to decimal degrees
		var degrees = ol.proj.transform(coords, 'EPSG:3857', 'EPSG:4326');
		degrees[0] = degrees[0].toFixed(5);
		degrees[1] = degrees[1].toFixed(5);
		if (rows === 1) {
			coordStr = degrees.toString();
		} else {
			coordStr = degrees[0].toString() + '<br>' + degrees[1].toString();
		}
		// format a human readable version (example:  42° 15' 27'')
		//coordStr = ol.coordinate.toStringHDMS(degrees);
	} else {
		coordStr = ol.coordinate.toStringXY(coords,9);
	};
	return coordStr;
};

function el(id) {
	return document.getElementById(id);
};

changeEPSGBtn.addEventListener('click', () => {
	if (coordType == 'EPSG-4326') {
		coordType = 'EPSG-3857';
	} else {
		coordType = 'EPSG-4326';
	};
});

//Expedition data are all tracks and check-points
var expeditiondataLayer;
var checkpointsLayer;

var expeditiondataStyle = new ol.style.Style({
	image: new ol.style.RegularShape({
		fill: new ol.style.Fill({color: 'green'}),
		stroke: new ol.style.Stroke({color: 'green', width: 1}),
		points: 4,
		radius: 3,
		angle: Math.PI / 4
	})
});

/* This is a fully valid style - checkpoint is a circle filled with red color and with blue border
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
/* Valid style - star
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
*/

//This style is for newly created points (before selecting a new active expedition)
var checkPointStyle = new ol.style.Style({
	text: new ol.style.Text({
		text: '\uf041',
		font: 'normal 24px "FontAwesome"',
		textBaseline: 'bottom',
		fill: new ol.style.Fill({
			color: 'rgb(255,0,255)',
		})
	})
	/* When image file is used
	image: new ol.style.Icon(({
		anchor: [0.5, 256],
		//anchorOrigin: 'bottom-left',
		scale: 0.15,
		anchorXUnits: 'fraction',
		anchorYUnits: 'pixels',
		//opacity: 0.75,
		src: 'marker1.png'
	}))
	*/
});

/* Valid style - star
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
*/

//This style is for already existing points
var checkPointStyle2 = new ol.style.Style({
	text: new ol.style.Text({
		text: '\uf041', //f3c5
		font: 'normal 24px "FontAwesome"',
		textBaseline: 'bottom',
		fill: new ol.style.Fill({
			color: 'green',
		})
	})
	/* When image file is used
	image: new ol.style.Icon(({
		anchor: [0.5, 256],
		//anchorOrigin: 'bottom-left',
		scale: 0.15,
		anchorXUnits: 'fraction',
		anchorYUnits: 'pixels',
		//opacity: 0.75,
		src: 'marker1.png'
	}))
	*/
});

/* Second variant
var checkPointStyle2 = new ol.style.Style({});
var img1 = new Image();
img1.onload = function(evt) {
	checkPointStyle2.setImage(new ol.style.Icon({
		anchor: [0, 0],
		imgSize:[img1.width,img1.height],
		scale: 0.1,
		anchorXUnits: 'fraction',
		anchorYUnits: 'pixels',
		//opacity: 0.75,
		img: img1
	}))
};
img1.src = 'marker1.png';
*/

//This style is for moved point
var checkPointStyle3 = new ol.style.Style({
	text: new ol.style.Text({
		text: '\uf041',
		font: 'normal 24px "FontAwesome"',
		textBaseline: 'bottom',
		fill: new ol.style.Fill({
			color: 'red',
		})
	})
	/* When image file is used
	image: new ol.style.Icon(({
		anchor: [0.5, 256],
		//anchorOrigin: 'bottom-left',
		scale: 0.15,
		anchorXUnits: 'fraction',
		anchorYUnits: 'pixels',
		//opacity: 0.75,
		src: 'marker1.png'
	}))
	*/
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

	if (viewPoints) {
		triggerPointsLayer();
	};
	//chbViewCheckpoints.disabled = true;

	map.removeOverlay(onclick_overlay);
	isOnclickOverlayVisible = false;
	//pointBtn.disabled = true;

	map.removeLayer(expeditiondataLayer); //Use control which show/hide this layer
	map.removeLayer(efLayer); //Use control which show/hide this layer

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

var internetConnection = false;
RNMessageChannel.on('internetConnectionChanged', (connection) => {
	//alert(JSON.stringify(connection));
	internetConnection = connection.internet.available;
});

RNMessageChannel.on('clear-expedition', () => {
	clearExpedition();
});

var bottom_left_overlay = new ol.Overlay({
	element: el('bottomleft_overlay'),
	positioning: 'bottom-left',
});

var top_right_overlay = new ol.Overlay({
	element: el('topright_overlay'),
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

	var polygonStyle = new ol.style.Style({
	   stroke : new ol.style.Stroke({
			 color : 'rgba(0,0,255,1.0)',
			 width : 1
		 }),
	   fill : new ol.style.Fill({
			 color: 'rgba(245,245,220,0.2)'
		 })
	 });

	polygonSource.addFeature(polygonFeature);

	areaLayer = new ol.layer.Vector({
		name: 'ExpeditionArea',
		source: polygonSource,
		style: polygonStyle,
		zIndex: areapoligonZIndex
	});
	//areaLayer.setZIndex(zIndex);

	map.addLayer(areaLayer);
}

var createRing = function(cornerCoords) {
	var minx = cornerCoords[0], //bottom-left longitude
		miny = cornerCoords[1], //bottom-left latitude
		maxx = cornerCoords[2], //top-right longitude
		maxy = cornerCoords[3]; //top-right latitude

	return [
		[minx, maxy], // x0
		[minx, miny], // x1
		[maxx, miny], // x2
		[maxx, maxy], // x3
		[minx, maxy]  // x0
	];
}

var createAreaPolygon = function(cornerCoords) {
	var ring = createRing(cornerCoords);

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
			centerRegion();
		} else {
			//calculateExtent returns an array having bottom left longitude, latitude and top right longitude and latitude.
			var extent = map.getView().calculateExtent(map.getSize());

			var coords, element;
			//var strCoords;

			coords = [extent[0],extent[1]];
			element = bottom_left_overlay.getElement();
			//strCoords = 'lon: ' + extent[0].toString() + '<br>' + 'lat: ' + extent[1].toString(); //ol.coordinate.toStringXY(coords,9);
			//element.innerHTML = strCoords;
			element.innerHTML = coordiatesToString(coords, 1);
			bottom_left_overlay.setPosition(coords);
			map.addOverlay(bottom_left_overlay);

			coords = [extent[2],extent[3]];
			element = top_right_overlay.getElement();
			//strCoords = 'lon: ' + extent[2].toString() + '<br>' + 'lat: ' + extent[3].toString(); //ol.coordinate.toStringXY(coords,9);
			//element.innerHTML = strCoords;
			element.innerHTML = coordiatesToString(coords, 1);
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

var positionChanged = false;
var userBreak;
//pointBtn.addEventListener('click', () => {
//Initialise the whole process of point creation
RNMessageChannel.on('createPoint', () => {
	if (!chbPositioning.checked) {
		waitForProperGeolocation(); //Start after 2 secs, enough for modal panel with proggress bar to start
		chbPositioning.click();
		userBreak = false;
		RNMessageChannel.sendJSON({
			command: 'start-progress',
			payload: {
				caption: 'Waiting for correct GPS location...',
				indeterminate: true
			},
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
			accuracyElement.innerText = accuracy.toFixed(3) + ' [m]';
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
helloBtn.addEventListener('click', () => {
	RNMessageChannel.send('hello from WebView');
});

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

var initialZoom = 10;

var expeditionAvailable = false;
var expeditionName = '';
var regionCoordinates = [];
var regionZoom = 0;
var allTracksPoints = [];//Array for track points of all displaied tracks only
var allTracksData = []; //Array of objects for displaied tracks only

var trackAvailable = false;
var trackName = ''; //current track name
var trackPoints = []; //Array of current track point-coordinates in form of OpenLayers features
var trackPointsAccuracy = []; //Twin-array for trackPoints - contains the accuracy of the coordinates for one and the same index

var checkPoints = [];

//var expeditionFeatures = {}; //Features (in GeoJSON form) colected from other expeditions that fall into current expedition region (fully or partially).
var efLayer;

/*
var efImage = new ol.style.Circle({
	radius: 5,
	fill: null,
	stroke: new ol.style.Stroke({color: 'red', width: 1})
});
*/
var efText = new ol.style.Text({
	text: '\uf041',
	font: 'normal 24px "FontAwesome"',
	textBaseline: 'bottom',
	fill: new ol.style.Fill({
		color: 'blue',
	})
});

var efStyles = {
	'Point': new ol.style.Style({
		//image: efImage
		text: efText
	}),
	'LineString': new ol.style.Style({
		stroke: new ol.style.Stroke({
			color: 'blue',
			width: 1
		})
	}),
	'Polygon': new ol.style.Style({
		stroke: new ol.style.Stroke({
			color: 'blue',
			lineDash: [4],
			width: 2
		}),
		fill: new ol.style.Fill({
			color: 'rgba(0, 0, 255, 0)'
		})
	}),
};

var styleFunction = function(feature) {
	return efStyles[feature.getGeometry().getType()];
};

var centerRegion = function() {
	var x0 = regionCoordinates[0];
	var x2 = regionCoordinates[2];
	var center = [(x2[0]+x0[0])/2, (x2[1]+x0[1])/2];
	view.setCenter(center);
};

var processExpeditionData = function(expedition) {
	//alert(JSON.stringify(expedition));
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

		centerRegion();

		drawArea(regionCoordinates);
		regionVisible = true;

		var len = expedition.payload.tracks.length; //Number of tracks in current expedition

		removeLayer(expeditiondataLayer);
		expeditiondataLayer = new ol.layer.Vector({name: 'ExpeditionData',});
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

		//chbViewCheckpoints.disabled = false;
		viewPoints = true;
		removeLayer(checkpointsLayer);
		checkPoints = [];

		var point_feature, coords;
		const silent = true;
		for (var i=0; i<expedition.payload.checkpoints.length; i++){
			coords = [expedition.payload.checkpoints[i][0], expedition.payload.checkpoints[i][1]];
			point_feature = new ol.Feature({
				geometry: new ol.geom.Point(coords)
			});
			point_feature.setStyle(checkPointStyle2);
			point_feature.setId(i);
			point_feature.setProperties({editable: true}, silent);
			checkPoints.push(point_feature);
		};

		checkpointsLayer = new ol.layer.Vector({name: 'ExpeditionCheckpoints',});
		var source = new ol.source.Vector({ features: checkPoints });
		checkpointsLayer.setSource(source);
		checkpointsLayer.setZIndex(checkpointZIndex);
		map.addLayer(checkpointsLayer);
		RNMessageChannel.sendJSON({
			command: 'points-layer-visibility-state',
			payload: {visibilityState: viewPoints}
		});

		//expeditionFeatures = expedition.payload.features;
		//See http://openlayers.org/en/master/examples/geojson.html
		removeLayer(efLayer);
		var efSource = new ol.source.Vector({
			features: (new ol.format.GeoJSON()).readFeatures(expedition.payload.regionFeatures)
		});

		efLayer = new ol.layer.Vector({
			name: 'ExpeditionFeatures',
			source: efSource,
			style: styleFunction,
			visible: isFeaturesLayerVisible(view.getZoom())
		});
		efLayer.setZIndex(featuresZIndex);
		map.addLayer(efLayer);

		clearBtn.disabled = false;
		//pointBtn.disabled = false;
		map.removeOverlay(onclick_overlay);
		isOnclickOverlayVisible = false;
	};
};

RNMessageChannel.on('transferExpeditionData', expedition => {
	processExpeditionData(expedition);
});

var partialData = {};
RNMessageChannel.on('initPartialTransfer', data => {
	partialData = {
		dataType: data.payload.dataType,
		partsCount: data.payload.partsCount,
		transferedCount: 0,
		dataSlots: []
	};
	for (var i=0; i<data.payload.partsCount; i++) {
		partialData.dataSlots.push('empty');
	};
});

RNMessageChannel.on('partialTransfer', data => {
	partialData.transferedCount++;
	partialData.dataSlots[data.payload.ind] = data.payload.partData;

	var allPartsTransfered = function() {
		var result = true;
		for (var i=0; i<partialData.partsCount; i++) {
			if (partialData.dataSlots[i] == 'empty') {
				result = false;
				break;
			};
		};
		return(result);
	};

	var joinPartialData = function() {
		return new Promise( (resolve,reject) => {
			resolve(partialData.dataSlots.join(''));
			/* Working snipet equivalent to join('')
			var joinedData = '';
			for (var i=0; i<partialData.partsCount; i++) {
				joinedData += partialData.dataSlots[i];
			};
			resolve(joinedData);
			*/
		});
	};

	if (partialData.transferedCount == partialData.partsCount) {
		var timeout = false;

		setTimeout( function() { timeout = true }, 5000);

		do {
			var ok = allPartsTransfered();
		}
		while ((!ok) && (!timeout));

		if (timeout == true) {
			alert('Error in partial data transfer! Remain in previous expedition state.');
			return;
		};

		joinPartialData().then( function(joinedData) {
			if (partialData.dataType == 'JSON') {
				processExpeditionData({ payload: JSON.parse(joinedData) });
			} else {
				//string data type - for future use
				//function_To_Process_Str_Data({ payload: joinedData });
			};
		});
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

//Create point on map only
RNMessageChannel.on('createCheckpoint', payload => {
	if (payload.checkpoint.create) {
		// Add checkpoint to checkpoint vector layer
		var point_geom = new ol.geom.Point(payload.checkpoint.coordinates);
		var point_feature = new ol.Feature({
			geometry: point_geom
		});
		point_feature.setStyle(checkPointStyle);
		point_feature.setId(checkPoints.length);
		point_feature.setProperties({editable: true}, true);
		checkpointsLayer.getSource().addFeature( point_feature );
		checkPoints.push(point_feature);
		if (!viewPoints) triggerPointsLayer();
	}

	//Remove overlay, no matter how checkpoint was created
	map.removeOverlay(onclick_overlay);
	isOnclickOverlayVisible = false;
	//pointBtn.disabled = false;
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
	//pointBtn.disabled = false;
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
			color: [255, 0, 255, 1]  //color: [255, 204, 102, 1]
		}),
		stroke: new ol.style.Stroke({
			color: [255, 0, 255, 1],  //color: [255, 204, 102, 1],
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
function createTrackpointsLayer() {
	trackpointsLayer = new ol.layer.Vector({
		name: 'ExpeditionTracks',
		source: new ol.source.Vector({ features: trackPoints }),
		zIndex: trackpointZIndex
	})
};

var view = new ol.View({
	center: [0, 0], //or center: ol.proj.transform([2.1833, 41.3833], 'EPSG:4326', 'EPSG:3857'),
	rotation: 0,
	enableRotation: false,
	zoom: 2
});
view.setZoom(initialZoom);
view.setCenter(coordSofia);

var getLayerByName = function(layerName) {
	var layer;
	map.getLayers().forEach( function(l) {
		if (l.get('title') === layerName ) {
			layer = l;
		}
	});
	return layer;
};

var visibleTopo50K = true;

RNMessageChannel.on('changeTiles', () => {
	var layer = getLayerByName('Tiles');

	if (visibleTopo50K === true) {
		visibleTopo50K = false;
		layer.setSource(sourceOSM);
	} else {
		visibleTopo50K = true;
		layer.setSource(sourceTopo50K);
	}
});

//var zoomSlider = new ol.control.ZoomSlider();

//https://openlayers.org/en/latest/examples/scale-line.html
var scaleLineControl = new ol.control.ScaleLine();
scaleLineControl.setUnits('metric'); //degrees, imperial inch, us inch, nautical mile

var map = new ol.Map({
		target: 'map', // The DOM element that will contains the map
		renderer: 'canvas', // Force the renderer to be used. 'canvas' is default
		layers: [
			new ol.layer.Tile({
				title: 'Tiles',
				type: 'base',
				visible: true,
				preload: Infinity,
				source: sourceTopo50K,
				zIndex: tilesZIndex
			}),
		],
		controls: ol.control.defaults({
			attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
				collapsible: false
			})
		}).extend([
			//zoomSlider,
			scaleLineControl
		]),
		view: view
	});

//Also possible
//map.addControl(zoomSlider);

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

		var element = onclick_overlay.getElement();
		element.innerHTML = coordiatesToString(onClickOverlayCoordinates, 2);
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
	}
});

var triggerPointsLayer = () => {
	viewPoints = !viewPoints;
	if (viewPoints) {
		addPointLayer(checkpointsLayer);
	} else {
		removeLayer(checkpointsLayer);
	}
	RNMessageChannel.sendJSON({
		command: 'points-layer-visibility-state',
		payload: {visibilityState: viewPoints}
	});
};

//chbViewCheckpoints.addEventListener('change', triggerPointsLayer);
RNMessageChannel.on('triggerPoints', triggerPointsLayer);

//chbZoomTreshold.addEventListener('change', function() {
RNMessageChannel.on('triggerZoomTreshold', () => {
	zoomTresholdActive = !zoomTresholdActive;
	efLayer.setVisible(isFeaturesLayerVisible(view.getZoom()));
	RNMessageChannel.sendJSON({
		command: 'zoom-treshold-state',
		payload: { zoomTresholdState: zoomTresholdActive }
	});
});

var isOnclickOverlayVisible = false;
var isOnclickOverlayReady = true;

function allowOnclickOverlay() {
    isOnclickOverlayReady = true;
};

var onClickOverlayCoordinates;
var clickEvent = null;

onClickOverlay.ondblclick = function (evt) {
	if (isOnclickOverlayVisible) {
		clickEvent = null;
		alert('This is "dblclick" event.');
	};
};

onClickOverlay.onclick = function(evt) {
	clickEvent = evt;
	setTimeout(click_action, 300);
};

var click_action = function () {
    if (clickEvent == null)	return;

    var evt = clickEvent;

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
};

onClickOverlay.oncontextmenu = function(evt) {
	alert('This is "oncontextmenu" ("rightclick") event.');
    return false;
};

//Similar example, but for browser and mouse -> http://jsfiddle.net/rnzgfg89/6/
var overlayDx = null;
var overlayDy = null;
onClickOverlay.addEventListener('touchstart', function(evt) {
	var enabledTouchendEvent = false;
	function move(evt) {
		var coords = map.getEventCoordinate(evt);

		if (overlayDx == null) {
			overlayDx = coords[0] - onClickOverlayCoordinates[0];
			overlayDy = coords[1] - onClickOverlayCoordinates[1];
		};

		coords[0] -= overlayDx;
		coords[1] -= overlayDy;

		onClickOverlayCoordinates = coords;
		var element = onclick_overlay.getElement();
		element.innerHTML = coordiatesToString(onClickOverlayCoordinates, 2);
		onclick_overlay.setPosition(onClickOverlayCoordinates);
		enabledTouchendEvent = true;
	};

	function end(evt) {
		var e = evt;
		overlayDx = null;
		window.removeEventListener('touchmove', move);
		window.removeEventListener('touchend', end);

		if (enabledTouchendEvent) {
			//alert('This is "touchend" event.');
			// Do something here ...
			isOnclickOverlayReady = true;
			processMapClick(); //Remove overlay, etc
			isOnclickOverlayReady = true;
			saveMapClickEvent.coordinate = onClickOverlayCoordinates;
			saveMapClickEvent.pixel = map.getPixelFromCoordinate(onClickOverlayCoordinates);
			//alert(Object.keys(saveMapClickEvent));
			processMapClick(saveMapClickEvent);
			enabledTouchendEvent = false;
		}
	};

	window.addEventListener('touchmove', move);
	window.addEventListener('touchend', end);
});

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

	accuracyElement.innerText = accuracy.toFixed(3) + ' [m]';
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
});

var coord_overlay = new ol.Overlay({
	element: el('coordinate_overlay'),
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
			payload: {
				functionName: 'saveGeolocation',
				geolocation: {
					coordinates: coordinates,
					accuracy: accuracy
				}
			},
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
		// update the coord_overlay element's content
		var element = coord_overlay.getElement();
		element.innerHTML = coordiatesToString(coordinates, 2);
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
	name: 'GPSPosition',
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

// ======= Move Point functionality ======= begin
var movePointId = -1;
var movePointFromCoordinates;
var movePointToCoordinates;
var savedPointStyle;

var movePointOverlay = new ol.Overlay({
	element: movePointOverlayElement,
	positioning: 'top-left',
});

//movePointOverlayElement.onclick = function(evt) {
	//map.removeOverlay(movePointOverlay);
//};

movePointOverlayElement.addEventListener('touchstart', function(evt) {
	var enabledTouchendEvent = false;
	var source = checkpointsLayer.getSource();
	var lineFeature = null;
	savedPointStyle = checkPoints[movePointId].getStyle();
	checkPoints[movePointId].setStyle(checkPointStyle3); //Change to red color

	function move(evt) {
		var coords = map.getEventCoordinate(evt);

		if (overlayDx == null) {
			overlayDx = coords[0] - movePointToCoordinates[0];
			overlayDy = coords[1] - movePointToCoordinates[1];
		};

		coords[0] -= overlayDx;
		coords[1] -= overlayDy;

		movePointToCoordinates = coords;
		movePointOverlay.setPosition(movePointToCoordinates);

		if (lineFeature === null) {
			lineFeature = new ol.Feature({
				id: 'Line',
				geometry: new ol.geom.LineString([movePointFromCoordinates, movePointToCoordinates], 'XY'),
			});

			lineFeature.setStyle(new ol.style.Style({
				stroke : new ol.style.Stroke({
					color : 'red',
					lineDash: [2,4],
					//width: 1
				}),
				zIndex: checkpointZIndex
			}));

			source.addFeature( lineFeature );
		} else {
			lineFeature.getGeometry().setCoordinates([movePointFromCoordinates, movePointToCoordinates]);
		};

		enabledTouchendEvent = true;
	};

	function end(evt) {
		var e = evt;
		overlayDx = null;
		window.removeEventListener('touchmove', move);
		window.removeEventListener('touchend', end);

		if (enabledTouchendEvent) {
			//alert('This is "touchend" event.');
			// Do something here ...
			map.removeOverlay(movePointOverlay);
			source.removeFeature( lineFeature );
			source.getFeatureById(movePointId).getGeometry().setCoordinates(movePointToCoordinates);
			checkPoints[movePointId].setStyle(savedPointStyle); //Restore original point color

			RNMessageChannel.sendJSON({
				command: 'change-point-coordinates',
				payload: {
					pointId: movePointId,
					newCoords: movePointToCoordinates
				},
			});

			//savedPointStyle = null; //Release memory
			movePointId = -1; //No point for move selected
			enabledTouchendEvent = false;
		}
	};

	window.addEventListener('touchmove', move);
	window.addEventListener('touchend', end);
});

RNMessageChannel.on('move-point', (data) => {
	movePointOverlayElement.innerHTML = 'move';
	movePointId = data.payload.pointId;
	movePointFromCoordinates = data.payload.coordinates;
	movePointToCoordinates = movePointFromCoordinates;
	movePointOverlay.setPosition(movePointToCoordinates);
	map.addOverlay(movePointOverlay);
});
// ======= Move Point functionality ======= end

var processMapClick = function(event) {
	if (movePointId >= 0) {
		map.removeOverlay(movePointOverlay);

		//Restore original color for the moved point
		checkPoints[movePointId].setStyle(savedPointStyle);

		//savedPointStyle = null; //Release memory
		movePointId = -1;  //No point for move selected
	}

	if (isOnclickOverlayReady) {
		isOnclickOverlayReady = false;
		if (isOnclickOverlayVisible) {
			isOnclickOverlayVisible = false;
			map.removeOverlay(onclick_overlay);
			//pointBtn.disabled = false;
		} else {
			isOnclickOverlayVisible = true;
			// extract the spatial coordinate of the click event in map projection units
			var coords = event.coordinate;

			var accuracy = 0;
			//var minDistance = 5.0;
			var i;
			if (chbNearestTrackPoint.checked) {
				var trackPointCoordinates;
				var x, y, distance = 0.0;
				var minDist = 100000.0; //Local min distance
				var minTrackLocationIndex;
				//var line;

				for ( i = 0; i < trackPoints.length; i++ ) {
					// Calculate the distance from current GPS-location to the nearest track-location.
					trackPointCoordinates = trackPoints[i].getGeometry().getCoordinates();
					x = trackPointCoordinates[0] - coords[0];
					y = trackPointCoordinates[1] - coords[1];
					distance = Math.sqrt( (x*x) + (y*y) );
					/* Another method with absolutely the same result
					line =  new ol.geom.LineString([trackPointCoordinates, coords]);
					distance = line.getLength();
					*/
					//alert('coords=' + coords.toString() + '\nchpcoords=' + trackPointCoordinates.toString() + '\ndistance=' + distance.toString());

					//Adjust minDist
					if (distance < minDist) {
						minDist = distance;
						minTrackLocationIndex = i;
					}
				}
				//Get the coords of the nearest track-point as current data
				coords = trackPoints[minTrackLocationIndex].getGeometry().getCoordinates();
				accuracy = trackPointsAccuracy[minTrackLocationIndex];
				//minDistance = 0.0;
			}
			onClickOverlayCoordinates = coords;  //Save for global use

			var found = false;
			/*
			if (checkPoints.length > 0) {
			//Check if check-point is tapped
				var checkPointCoordinates;
				var x, y;
				var distance = 0.0;

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
			*/

			/*  Because of unstable results in calculating the distance between two points,
				next snipet replace the upper one	*/
			var layerFilter = (layer) => {
				var layerName = layer.get('name');
				return (layerName == 'ExpeditionData' || layerName == 'ExpeditionCheckpoints' ||
						layerName == 'ExpeditionTracks' || layerName == 'ExpeditionFeatures');
			};

			var features = map.getFeaturesAtPixel(event.pixel, {layerFilter, hitTolerance: hitTOLERANCE});
			/* Second method - the same result
			var features = [];
			map.forEachFeatureAtPixel(event.pixel, function(feature,null,null,layerFilter,this) {
				features.push(feature);
			});
			*/

			//Object to be send to react native
			var featuresAtPixel = {
				'pixel': event.pixel,
				'features': []
			};

			if (features != undefined) {
				features.map( (featureAtPixel) => {
					var obj = {};
					obj.type = featureAtPixel.getGeometry().getType();
					//feature has no id for track points only
					try {
						obj.id = featureAtPixel.getId();
					}
					catch (e) {};

					if (obj.id != undefined) {
						//Process checkpoints differently from features
						var isEditable = featureAtPixel.getProperties().editable == true;
						if ((!found) && obj.type == 'Point' && isEditable) {
							found = true;
							obj.coordinates = featureAtPixel.getGeometry().getCoordinates();

							RNMessageChannel.sendJSON({
								command: 'execute',
								payload: {
									functionName: 'pointControl',
									geolocation: {
										coordinates: obj.coordinates,
										accuracy: accuracy
									},
									datamode: 'edit',
									checkpointId: obj.id,
								},
							});
						};

						//Only features separation
						var isFeature = !isEditable;
						if (isFeature) {
							featuresAtPixel.features.push(obj);
						};
					};
				});
			};
			/*
			RNMessageChannel.sendJSON({
				command: 'test',
				payload: {featuresAtPixel},
			});
			*/
			if (!found) {
				//Process features
				const fLen = featuresAtPixel.features.length;
				/*
				if (fLen > 0) {
					var typeIndex;

					var typeExist = (typeName) => {
						var exist = false;
						for (let i=0; i<fLen; i++) {
							if (featuresAtPixel.features[i].type == typeName) {
								exist = true;
								typeIndex = i;
								break;
							};
						};
						return exist;
					};

					if (typeExist('Point')) {
						RNMessageChannel.sendJSON({
							command: 'execute',
							payload: {
								functionName: 'featureInfo',
								featureId: featuresAtPixel.features[typeIndex].id
							}
						});
					} else {
						if (typeExist('LineString')) {
							RNMessageChannel.sendJSON({
								command: 'execute',
								payload: {
									functionName: 'featureInfo',
									featureId: featuresAtPixel.features[typeIndex].id
								}
							});
						} else {
							if (typeExist('Polygon')) {
								RNMessageChannel.sendJSON({
									command: 'execute',
									payload: {
										functionName: 'featureInfo',
										featureId: featuresAtPixel.features[typeIndex].id
									}
								});
							};
						};
					};
				};
				*/

				// Variant 2 - no hierarchy, need menu creation

				if (fLen > 0) {
					if (fLen == 1) {
						RNMessageChannel.sendJSON({
							command: 'execute',
							payload: {
								functionName: 'featureInfo',
								featureId: featuresAtPixel.features[0].id
							}
						});
					} else {
						RNMessageChannel.sendJSON({
							command: 'execute',
							payload: {
								functionName: 'featureMenu',
								features: featuresAtPixel
							},
						});
					};
				};

				// end of variant 2
				//End of features' processing

				// update the onclick_overlay element's content
				var element = onclick_overlay.getElement();
				element.innerHTML = coordiatesToString(coords, 2);
				// position the element (using the coordinate in the map's projection)
				onclick_overlay.setPosition(coords);

				// and add it to the map
				map.addOverlay(onclick_overlay);
				//pointBtn.disabled = true;
			}
		}
		setTimeout(allowOnclickOverlay, 700); //Timeout needed to avoid second touch immediately after the first one
	}
};

// register an event handler for the on-map-click event
var saveMapClickEvent;
map.on('click', function(event) {
	saveMapClickEvent = event; //Save event structure for manual use later
	processMapClick(event);
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

//https://openlayers.org/en/latest/examples/moveend.html
function onMoveEnd(evt) {
	if (internetConnection == true && view.getZoom() >= 18) {
		//var map = evt.map;
		//var extent = map.getView().calculateExtent(map.getSize());
		var extent = view.calculateExtent(map.getSize());
		/*
		var bottomLeft = ol.proj.transform(ol.extent.getBottomLeft(extent),
			'EPSG:3857', 'EPSG:4326');
		var topRight = ol.proj.transform(ol.extent.getTopRight(extent),
			'EPSG:3857', 'EPSG:4326');
		*/
		var ring = createRing(extent);
		RNMessageChannel.sendJSON({
			command: 'extent-changed',
			payload: {ring},
		});
	}
};
map.on('moveend', onMoveEnd);

function isFeaturesLayerVisible(zoom) {
	//return (chbZoomTreshold.checked || (zoom >= zoomTreshold));
	return (zoomTresholdActive || (zoom >= zoomTreshold));
};

view.on('change:resolution', function() {
	var zoom = view.getZoom();
	zoomElement.innerText = zoom.toFixed(3);

	if (efLayer != undefined) {
		efLayer.setVisible(isFeaturesLayerVisible(zoom));
	};
});
