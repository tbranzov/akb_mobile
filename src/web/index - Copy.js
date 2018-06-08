import RNMessageChannel from 'react-native-webview-messaging';

const helloBtn = document.querySelector('#hello');
const jsonBtn = document.querySelector('#json');
const eventBtn = document.querySelector('#event');
const messagesContainer = document.querySelector('p');

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

RNMessageChannel.on('text', text => {
  messagesContainer.innerHTML = `Received text from RN: ${text}`;
});

RNMessageChannel.on('json', text => {
  messagesContainer.innerHTML = `Received json from RN: ${JSON.stringify(text)}`;
});

RNMessageChannel.on('greetingFromRN', event => {
  messagesContainer.innerHTML = `Received "greetingFromRN" event: ${JSON.stringify(event)}`;
});

var trackAvailable = false;
var icons = [];
var isFirstTrackPoint = true;

RNMessageChannel.on('transferTrackFromRN', track => {
	var trackGeolocationData = {};

	//messagesContainer.innerHTML = `Track: ${JSON.stringify(track)}`;
	
	messagesContainer.innerHTML = track.payload.trackName + ' (' + track.payload.trackDate + ')';
	trackGeolocationData = track.payload.geoLocations;
	//messagesContainer.innerHTML = `Track: ${JSON.stringify(track.payload.geoLocations)}`;
	
	trackAvailable = !track.payload.emptyTrack; //track.payload.trackName.slice(0,18) == 'Empty track object';

	removeLayer(pointLayer);
	icons = [];
	cratePointLayer();
	
	/*	Show coordinates
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
	showTrack(trackGeolocationData);
});

var iconStyle = new ol.style.Style({
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
  zIndex: 1
});

var pointLayer;
function cratePointLayer(){
  pointLayer = new ol.layer.Vector({ 
    source: new ol.source.Vector({ features: icons }) 
  })
}

var view = new ol.View({
		center: [0, 0], //or center: ol.proj.transform([2.1833, 41.3833], 'EPSG:4326', 'EPSG:3857'),
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
			maximumAge: 2000
		}
	});

function el(id) {
	return document.getElementById(id);
}

el('track').addEventListener('change', function() {
	if (!trackAvailable) {
		alert('No track available!');
		return;
	}
	
	/* Use this if have to clear old track data
    if (this.checked) {
		if (confirm("Attention!\nAll track data will be lost!\nContinue?") == true) {
			removeLayer(pointLayer);
			icons = [];
			cratePointLayer();
		} else {
			this.suspendEvents(false); // Stop all events. Be careful with it. Dont forget resume events!
			this.setValue(false);
			this.resumeEvents(); // resume events
		}
    };
	*/
	
	if (this.checked) {
		removeLayer(pointLayer);
		cratePointLayer();
		addPointLayer(pointLayer);
		isFirstTrackPoint = true;
	} else {
		accuracyFeature.setGeometry(null);
		positionFeature.setGeometry(null);
	}
	
	geolocation.setTracking(this.checked);
});

el('view_track').addEventListener('change', function() {
	if (this.checked) {
		//alert("Point layer added");
		addPointLayer(pointLayer);
	} else {
		//alert("Point layer removed");
		removeLayer(pointLayer);
	};
});

// update the HTML page when the position changes.
geolocation.on('change', function() {
	var accuracy = geolocation.getAccuracy();
	  
	el('accuracy').innerText = accuracy + ' [m]';
	//RNMessageChannel.send(String(accuracy));

	el('altitude').innerText = geolocation.getAltitude() + ' [m]';
	el('altitudeAccuracy').innerText = geolocation.getAltitudeAccuracy() + ' [m]';
	el('heading').innerText = geolocation.getHeading() + ' [rad]';
	el('speed').innerText = geolocation.getSpeed() + ' [m/s]';
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

var positionFeature = new ol.Feature();
positionFeature.setStyle(new ol.style.Style({
	image: new ol.style.Circle({
				radius: 6,
				fill: new ol.style.Fill({
					color: '#3399CC'
				}),
				stroke: new ol.style.Stroke({
					color: '#fff',
					width: 2
				})
			})
    })
);

function addPointToTrack(coords) {
	var iconFeature;
	iconFeature = new ol.Feature({ 
		//geometry: new ol.geom.Point(ol.proj.transform(coords, 'EPSG:4326', 'EPSG:3857'))
		geometry: new ol.geom.Point(coords)
	});
	iconFeature.setStyle(iconStyle);
	icons.push(iconFeature);
}

geolocation.on('change:position', function() {
	var coordinates = geolocation.getPosition();

	RNMessageChannel.sendJSON(coordinates);

	/* This snippet works fine but it works more slowly then next one
	addPointToTrack(coordinates);
	var s = new ol.source.Vector({ features: icons });
	pointLayer.setSource(s);
	*/
	var point_geom = new ol.geom.Point(coordinates);
	var point_feature = new ol.Feature({
		geometry: point_geom
	});
	point_feature.setStyle(iconStyle);
	pointLayer.getSource().addFeature( point_feature );

	view.setCenter(coordinates);
	
	if (isFirstTrackPoint) {
		view.setZoom(19);
		isFirstTrackPoint = false;
	}

	positionFeature.setGeometry(coordinates ? new ol.geom.Point(coordinates) : null);
});

new ol.layer.Vector({
		map: map,
		source: new ol.source.Vector({
			features: [accuracyFeature, positionFeature]
		})
	});

function showTrack(locations) {
	icons = [];
	var i;
	
	for (i = 0; i < Object.keys(locations).length; i++) {
		addPointToTrack([locations[i].coordinates[0], locations[i].coordinates[1]]);
	};
	
	//Center view at the first point of the track
	view.setCenter([locations[0].coordinates[0], locations[0].coordinates[1]]);
	view.setZoom(19);
	cratePointLayer();
	addPointLayer(pointLayer);
	
	var chbViewTrack = el('view_track');
	chbViewTrack.suspendEvents(false); // Stop all events. Be careful with it. Dont forget resume events!
	chbViewTrack.setValue(true);
	chbViewTrack.resumeEvents(); // resume events
}

function addPointLayer(points){
  map.addLayer(points);
}

function removeLayer(points){
  map.removeLayer(points);
}
