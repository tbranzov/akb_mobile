var style = {
    fillColor: '#000',
    fillOpacity: 0.1,
    strokeWidth: 0
};

/*
var map = new OpenLayers.Map('map');
var layer = new OpenLayers.Layer.OSM( "Simple OSM Map");
var vector = new OpenLayers.Layer.Vector('vector');
map.addLayers([layer, vector]);
*/
var map = new ol.Map({target: 'map'});	  

var osmSource = new ol.source.OSM();	  

var layer = new ol.layer.Tile({source: osmSource});

map.addLayer(layer);

var view = new ol.View({
          center: ol.proj.fromLonLat([25.00, 42.69]),
          zoom: 8
        });
		
map.setView(view);
 
/* 
map.setCenter(
    new ol.LonLat(-71.147, 42.472).transform(
        new ol.Projection("EPSG:4326"),
        map.getProjectionObject()
    ), 12
);
*/

var pulsate = function(feature) {
    var point = feature.geometry.getCentroid(),
        bounds = feature.geometry.getBounds(),
        radius = Math.abs((bounds.right - bounds.left)/2),
        count = 0,
        grow = 'up';

    var resize = function(){
        if (count>16) {
            clearInterval(window.resizeInterval);
        }
        var interval = radius * 0.03;
        var ratio = interval/radius;
        switch(count) {
            case 4:
            case 12:
                grow = 'down'; break;
            case 8:
                grow = 'up'; break;
        }
        if (grow!=='up') {
            ratio = - Math.abs(ratio);
        }
        feature.geometry.resize(1+ratio, point);
        vector.drawFeature(feature);
        count++;
    };
    window.resizeInterval = window.setInterval(resize, 50, point, radius);
};

/*
var geolocate = new ol.Control.Geolocate({
    bind: false,
    geolocationOptions: {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 7000
    }
});
*/
var geolocate = new ol.Geolocation({
  // take the projection to use from the map's view
  projection: view.getProjection(),
  geolocationOptions: {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 7000
    }
});

map.addControl(geolocate);

var firstGeolocation = true;

geolocate.events.register("locationupdated",geolocate,function(e) {
    vector.removeAllFeatures();
    var circle = new ol.Feature.Vector(
        ol.Geometry.Polygon.createRegularPolygon(
            new ol.Geometry.Point(e.point.x, e.point.y),
            e.position.coords.accuracy/2,
            40,
            0
        ),
        {},
        style
    );
    vector.addFeatures([
        new ol.Feature.Vector(
            e.point,
            {},
            {
                graphicName: 'cross',
                strokeColor: '#f00',
                strokeWidth: 2,
                fillOpacity: 0,
                pointRadius: 10
            }
        ),
        circle
    ]);
    if (firstGeolocation) {
        map.zoomToExtent(vector.getDataExtent());
        pulsate(circle);
        firstGeolocation = false;
        this.bind = true;
    }
});
geolocate.events.register("locationfailed",this,function() {
    ol.Console.log('Location detection failed');
});
document.getElementById('locate').onclick = function() {
    vector.removeAllFeatures();
    geolocate.deactivate();
    document.getElementById('track').checked = false;
    geolocate.watch = false;
    firstGeolocation = true;
    geolocate.activate();
};
document.getElementById('track').onclick = function() {
    vector.removeAllFeatures();
    geolocate.deactivate();
    if (this.checked) {
        geolocate.watch = true;
        firstGeolocation = true;
        geolocate.activate();
    }
};
document.getElementById('track').checked = false;
