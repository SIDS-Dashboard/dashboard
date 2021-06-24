
import mapboxgl from "mapbox-gl";
import 'mapbox-gl/dist/mapbox-gl.css';

import { MapboxStyleDefinition, MapboxStyleSwitcherControl } from "mapbox-gl-style-switcher";
import "mapbox-gl-style-switcher/styles.css";

import names from './data/sidsNames.json'

import * as d3 from 'd3-fetch';
import Pbf from 'pbf'
import geobuf from 'geobuf';
import find from 'lodash.find'
/* import bbox from '@turf/bbox'
import bboxPolygon from "@turf/bbox-polygon";
import hexGrid from "@turf/hex-grid"; */
//import addHexSource from './AddingSources'
import './style.css'
//import fetch from "node-fetch";


mapboxgl.accessToken =
  "pk.eyJ1Ijoic2ViYXN0aWFuLWNoIiwiYSI6ImNpejkxdzZ5YzAxa2gyd21udGpmaGU0dTgifQ.IrEd_tvrl6MuypVNUGU5SQ";


//const map = new mapboxgl.Map({
const map = new mapboxgl.Map({
  container: "map", // container ID
  //style: 'mapbox://styles/mapbox/light-v10', //?optimize=true
  style: 'mapbox://styles/mapbox/satellite-v9',
  center: [-172.14, -13.79], // starting position [lng, lat]
  zoom: 3, // starting zoom
});

//const admin1Regions = 'https://sebastian-ch.github.io/sidsDataTest/data/gadm1.pbf';

map.on('load', function() {

  /********ADD BASEMAP SWITCHER *******/

  const styles =[
    {
        title: "Satellite Imagery",
        uri:'mapbox://styles/mapbox/satellite-v9'
    },
    {
        title: "Light",
        uri:'mapbox://styles/mapbox/light-v10?optimize=true'
    },
    {
      title: "Satellite With Labels",
      uri: 'mapbox://styles/mapbox/satellite-streets-v11'
    }
  ];

  map.addControl(new MapboxStyleSwitcherControl(styles), 'top-left');

  /**** CREATE COUNTRY DROP DOWN  */

  const countryDrop = document.getElementById('countryDrop')
  names.map(function(x) {
    //console.log(x.GID_0)
    var btn = document.createElement("BUTTON"); 
    btn.innerHTML = x.NAME_0;
    //btn.classList.add(x.GID_0.toString())
    btn.setAttribute('id', x.GID_0)
    countryDrop.appendChild(btn)
  } )

/******* BUTTON FUNCTIONALITY ************************/

  const wrapper = document.getElementById('buttonWrap');

  wrapper.addEventListener('click', (event) => {
    const isButton = event.target.nodeName === 'BUTTON';
    if (!isButton) {
      return;
    }

    console.dir(event.target.id);
    if (event.target.id === 'EEZ') {
      allEez();
      
    } if (event.target.id === 'hex') {
      addHex(event.target.id);
      
    } if (event.target.id === 'hex1') {

      addHex(event.target.id)

    } if (event.target.id === 'pop') {

      addHex(event.target.id)

    } if(event.target.id ==='pop3d') {
      add3dHex()
    }
    
    else {
        var currbb = find(names, ['GID_0', event.target.id ])
        var v2 = new mapboxgl.LngLatBounds([currbb.bb[0], currbb.bb[1]])
          map.fitBounds(v2, {
          linear: true,
          padding: {top: 10, bottom:25, left: 15, right: 5}
        });
  
        addSidOutline(currbb.NAME_0);
      
    }

  }) 

  //const admin1Regions = 'https://sebastian-ch.github.io/sidsDataTest/data/gadm1.pbf';
  const EEZlines = 'https://sebastian-ch.github.io/sidsDataTest/data/eezlines.pbf';
  const allSids = 'https://sebastian-ch.github.io/sidsDataTest/data/allSids.pbf';
  const hexTest = 'https://sebastian-ch.github.io/sidsDataTest/data/hex.pbf';

  
  var files = [allSids, hexTest]

  var promises = [];

  files.forEach(function(url) {
    promises.push(d3.buffer(url))
  }) 

  Promise.all(promises).then(function(allData) {

    //var admin1 = ['admin-source', allData[0]];
    //var EEZ = ['eez-source', allData[0]];
    var allSids = ['allSids-source', allData[0]];
    var hexes = ['hex-source', allData[1]];

    //var allGjns = [EEZ, allSids, hexes]
    var allGjns = [allSids, hexes]
    addAllSources(allGjns)

  })
  
})

function addAllSources(allGjns) {

  //console.log(allGjns)

  for (var x in allGjns) {

    map.addSource(allGjns[x][0], {
      'type': 'geojson',
      'data': geobuf.decode(new Pbf(allGjns[x][1]))
    })
  }

  if(map.getSource('allSids-source')) {
    document.getElementById('loader').remove()
  }


}

function addHex(name) {

  if(map.getLayer('3d')) {
    map.removeLayer('3d')
  }

  var style1 = []

  if (name === 'hex'){

    style1 =
      [
        'interpolate',
        ['linear'],
        ['get', 'rando_1'],
        0,
        '#f7fcfd',
        100,
        '#e0ecf4',
        300,
        '#bfd3e6',
        400,
        '#8c96c6',
        500,
        '#8c6bb1',
        700,
        '#6e016b'
        ]

  } else if (name === 'hex1') {

    style1 = [
      'match',
      ['get', 'rando_3'],
      1, 'red',
      2, 'blue',
      3, 'yellow',
      4, 'orange',
      5, 'gray', 'green'
    ]

  } else if (name === 'pop') {

    style1 = [
      'interpolate',
      ['linear'],
      ['get', '_mean'],
      0,
      '#eff3ff',
      553,
      '#c6dbef',
      2302,
      '#9ecae1',
      5544,
      '#6baed6',
      12070,
      '#3182bd',
      33737,
      '#08519c'
      ]
  }

  if(map.getLayer('hex')) {
    map.setPaintProperty('hex', 'fill-color', style1)
  }
  else {

  
    map.addLayer({
      'id': 'hex',
      'type': 'fill', 
      'source': 'hex-source',
      'layout': {
        'visibility': 'visible'
        },
      
      'paint': {
          'fill-color': style1,
          'fill-opacity': 0.5,
          
          }
      });

    }

}


function add3dHex() {

  if(map.getSource('hex-source')) {
    addLayer()
  } else {

    const hexTest = 'https://sebastian-ch.github.io/sidsDataTest/data/hex.pbf';

    d3.buffer(hexTest).then(function(data){

        map.addSource('hex-source', {
            'type': 'geojson',
            'data': geobuf.decode(new Pbf(data))
        })

        addLayer()

    })
    

  }

  


function addLayer() {

  map.removeLayer('hex');

  map.addLayer({
    'id': '3d',
    'type': 'fill-extrusion', 
    'source': 'hex-source',
    'layout': {
      'visibility': 'visible'
      },
    'paint': {
      'fill-extrusion-color': 'purple',
      'fill-extrusion-height': ['get', '_mean'],
        'fill-extrusion-opacity': 0.75
        
        }
    },
    
);


}


}


function addSidOutline(name) {

  if (map.getLayer('outline')) {
    map.setFilter('outline',['==', 'NAME_0', name])

  } else {

          map.addLayer({
            'id': 'outline',
            'type': 'line', 
            'source': 'allSids-source',
            'layout': {
              'visibility': 'visible'
              },
            'filter': ['==', 'NAME_0', name],
            'paint': {
                'line-color': 'red',
                /*'line-opacity': 0.3, */
                'line-width': 2
                }
            });        

}
}


function allEez() {

  const EEZlines = 'https://sebastian-ch.github.io/sidsDataTest/data/eezlines.pbf';

  if (map.getLayer('eez-layer')) {
    map.removeLayer('eez-layer');
    map.removeLayer('disputed');
  } else {

    d3.buffer(EEZlines).then(function(data){

      var gjn = geobuf.decode(new Pbf(data));

      map.addSource('eez-source', {
        'type': 'geojson',
        'data': gjn
      })

    map.addLayer({
      'id': 'eez-layer',
      'type': 'line', 
      'source': 'eez-source',
      'layout': {
        'visibility': 'visible',
        'line-join': 'round',
        'line-cap': 'round'
        },
        'filter': ["all",
      ["!in", 'LINE_TYPE', 'Unsettled', 'Unsettled median line']
      ],
      'paint': {
       /* 'line-color': [
          'match',
          ['get', 'LINE_TYPE'],
          'Treaty', 'blue',
          'Unsettled median line', 'red',
          'green'
        ], */
        'line-color': 'blue',
        'line-width': 1,
        /*'line-dasharray': [5,5] */
          
      }
      },
  );
  
  map.addLayer({
    'id': 'disputed',
    'type': 'line', 
    'source': 'eez-source',
    'layout': {
      'visibility': 'visible',
      'line-join': 'round',
      'line-cap': 'round'
      },
      //'filter': ['==', 'LINE_TYPE', 'Unsettled median line']
      'filter': ["all",
      ["in", 'LINE_TYPE', 'Unsettled', 'Unsettled median line']
      ],
      
    'paint': {
     /* 'line-color': [
        'match',
        ['get', 'LINE_TYPE'],
        'Treaty', 'blue',
        'Unsettled median line', 'red',
        'green'
      ], */
      'line-color': 'red',
      'line-width': 3,
      'line-dasharray': [2,4]
        
    }
    },
  );
  }
    )}
}
