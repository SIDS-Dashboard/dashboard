import mapboxgl from "mapbox-gl";
import 'mapbox-gl/dist/mapbox-gl.css';

import * as d3 from 'd3-fetch';
import Pbf from 'pbf'
import geobuf from 'geobuf';
import bbox from '@turf/bbox'
import bboxPolygon from "@turf/bbox-polygon";
import hexGrid from "@turf/hex-grid";

import './style.css'


mapboxgl.accessToken =
  "pk.eyJ1Ijoic2ViYXN0aWFuLWNoIiwiYSI6ImNpejkxdzZ5YzAxa2gyd21udGpmaGU0dTgifQ.IrEd_tvrl6MuypVNUGU5SQ";


const map = new mapboxgl.Map({
  container: "map", // container ID
  //style: 'mapbox://styles/mapbox/light-v10?optimize=true', //?optimize=true
  style: 'mapbox://styles/mapbox/satellite-v9',
  center: [-172.14, -13.79], // starting position [lng, lat]
  zoom: 8, // starting zoom
});



map.on('load', function() {


  const samoaUrl = 'https://sebastian-ch.github.io/sidsDataTest/data/sa.pbf';
  const fijiUrl = 'https://sebastian-ch.github.io/sidsDataTest/data/fiji.pbf';
  const samoaEez = 'https://sebastian-ch.github.io/sidsDataTest/data/samoaEEZ.pbf';
  const fijiEez = 'https://sebastian-ch.github.io/sidsDataTest/data/fijieez.pbf'

  var files = [
    samoaUrl,
    fijiUrl,
    samoaEez,
    fijiEez
  ];

  var promises = [];

  files.forEach(function(url) {
    promises.push(d3.buffer(url))
    
  })

  /* d3.buffer(dataUrl).then(function(data) {
    var gjn = geobuf.decode(new Pbf(data));
    addToMap(gjn)
  }) */

  Promise.all(promises).then(function(allData) {
    //console.log(allData)
    var samoa = geobuf.decode(new Pbf(allData[0]));
    var fiji = geobuf.decode(new Pbf(allData[1]));
    var saEez = geobuf.decode(new Pbf(allData[2]));
    var fEez = geobuf.decode(new Pbf(allData[3]));

    //console.log(fiji)

    addToMap(samoa, fiji, saEez, fEez)

  })


})

function addToMap(samoa, fiji, saEez, fEez) {

  const both = [samoa, fiji];

  both.forEach(function(x) {

    var sourceName = x.name + '-source';
    var layerName = x.name + '-layer';

    map.addSource(sourceName, {
      'type': 'geojson', 
      'data': x
    });

    map.addLayer({
      'id': layerName,
      'type': 'fill', 
      'source': sourceName,
      'layout': {
        'visibility': 'visible'
        },
      'paint': {
          'fill-color': 'purple',
          'fill-opacity': 0.5
          }
      },
      //'aeroway-line' 
  );


  })

  map.fitBounds(bbox(samoa), {
    linear: true,
    padding: {top: 10, bottom:25, left: 15, right: 5}
  });

  
  document.getElementById('samoa').addEventListener('click', function() {
    map.fitBounds(bbox(samoa), {
      linear: true,
      padding: {top: 10, bottom:25, left: 15, right: 5}
    });
  })

  document.getElementById('fiji').addEventListener('click', function() {
    map.easeTo({
      center: [179, -18.1],
      zoom: 6,
      linear: true,
      speed: 3
    })
  })

  document.getElementById('samoa-pur').addEventListener('click', function() {

    var currentLayout = map.getLayer('samoa-layer').visibility;
    console.log(currentLayout)

    if(currentLayout === 'visible') {
      map.setLayoutProperty('samoa-layer', 'visibility','none');
      document.getElementById('samoa-pur').innerHTML = 'turn purple on';
    } else {
      map.setLayoutProperty('samoa-layer', 'visibility','visible');
      document.getElementById('samoa-pur').innerHTML = 'turn purple off';
    }
    
  })

  document.getElementById('fiji-pur').addEventListener('click', function() {

    var currentLayout = map.getLayer('fiji-layer').visibility;
    console.log(currentLayout)

    if(currentLayout === 'visible') {
      map.setLayoutProperty('fiji-layer', 'visibility','none');
      document.getElementById('fiji-pur').innerHTML = 'turn purple on';
    } else {
      map.setLayoutProperty('fiji-layer', 'visibility','visible');
      document.getElementById('fiji-pur').innerHTML = 'turn purple off';
    }
    
  })

  document.getElementById('bounding-box').addEventListener('click', function(){

    if(!map.getLayer('bbox-layer')) {
      addBoundingBoxToMap(bbox(samoa))
    } else {
      map.removeLayer('bbox-layer')
      map.removeSource('bbox-source')

    }
    
  })



document.getElementById('hexgrid').addEventListener('click', function() {

  if(!map.getLayer('hex-layer')) {
    addHexToMap(bbox(samoa))
  } else {
    map.removeLayer('hex-layer')
    map.removeSource('hex-source')

  }



})

document.getElementById('samoa-EEZ').addEventListener('click', function() {

  if(!map.getLayer('samoaEEZ-layer')) {
    addEezToMap(saEez, 'samoaEEZ')
    document.getElementById('samoa-EEZ').innerHTML = 'Remove EEZ';
  } else {
    map.removeLayer('samoaEEZ-layer')
    map.removeSource('samoaEEZ-source')
    document.getElementById('samoa-EEZ').innerHTML = 'Add EEZ';

  }
})


document.getElementById('fiji-EEZ').addEventListener('click', function() {

  if(!map.getLayer('fijiEEZ-layer')) {
    addEezToMap(fEez, 'fijiEEZ')
    document.getElementById('fiji-EEZ').innerHTML = 'Remove EEZ';
  } else {
    map.removeLayer('fijiEEZ-layer')
    map.removeSource('fijiEEZ-source')
    document.getElementById('fiji-EEZ').innerHTML = 'Add EEZ';

  }
})

}



function addHexToMap(data) {
  
  var hexx = hexGrid(data, 5, { units: 'kilometers'})

  map.addSource('hex-source', {
    'type': 'geojson', 
    'data': hexx
  });

  map.addLayer({
    'id': 'hex-layer',
    'type': 'fill', 
    'source': 'hex-source',
    'layout': {
      'visibility': 'visible'
      },
    'paint': {
        'fill-color': 'green',
        'fill-opacity': 0.3
        }
    },
    'samoa-layer' 
);


}



function addEezToMap(data, name) {

  

  var sourceName = name + '-source';
  var layerName = name + '-layer';

  if (name === 'samoaEEZ') {
    var layerBehind = 'samoa-layer'
    map.fitBounds(bbox(data), {
      linear: true,
      padding: {top: 10, bottom:25, left: 15, right: 5}
    });
  } else {
    var layerBehind = 'fiji-layer'
  }

  map.addSource(sourceName, {
    'type': 'geojson', 
    'data': data
  });

  map.addLayer({
    'id': layerName,
    'type': 'fill', 
    'source': sourceName,
    'layout': {
      'visibility': 'visible'
      },
    'paint': {
        'fill-color': 'blue',
        'fill-opacity': 0.5
        }
    },
    layerBehind
);




}





function addBoundingBoxToMap(data) {

  data = bboxPolygon(data)

  map.addSource('bbox-source', {
    'type': 'geojson', 
    'data': data
  });

  map.addLayer({
    'id': 'bbox-layer',
    'type': 'fill', 
    'source': 'bbox-source',
    'layout': {
      'visibility': 'visible'
      },
    'paint': {
        'fill-color': 'red',
        'fill-opacity': 0.3
        }
    },
    'samoa-layer' 
);


}



