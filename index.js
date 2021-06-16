
import mapboxgl from "mapbox-gl";
import 'mapbox-gl/dist/mapbox-gl.css';

import { MapboxStyleDefinition, MapboxStyleSwitcherControl } from "mapbox-gl-style-switcher";
import "mapbox-gl-style-switcher/styles.css";

//import gjn from './data/allsids.geojson'

import names from './data/sidsNames.json'

import * as d3 from 'd3-fetch';
import Pbf from 'pbf'
import geobuf from 'geobuf';
import _ from 'lodash';
import bbox from '@turf/bbox'
import bboxPolygon from "@turf/bbox-polygon";
import hexGrid from "@turf/hex-grid";

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



//console.log(names);//

//const admin1Regions = 'https://sebastian-ch.github.io/sidsDataTest/data/gadm1.pbf';

map.on('load', function() {

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


    if(event.target.id !== 'EEZ') {
      var currbb = _.find(names, ['GID_0', event.target.id ])
      var v2 = new mapboxgl.LngLatBounds([currbb.bb[0], currbb.bb[1]])
      //map.fitBounds(getAndFixBbox(), {
        console.log(v2)
        map.fitBounds(v2, {
        linear: true,
        padding: {top: 10, bottom:25, left: 15, right: 5}
      });

      addSidOutline(currbb.NAME_0);
    }

    if (event.target.id === 'EEZ') {
      allEez();
      
    }

   /* if(event.target.id ==='admin') {
      d3.buffer(admin1Regions).then(function(data) {
        addAdminToMap(geobuf.decode(new Pbf(data)))
      })
    } */

  }) 

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

  /*const samoaUrl = 'https://sebastian-ch.github.io/sidsDataTest/data/sa.pbf';
  const fijiUrl = 'https://sebastian-ch.github.io/sidsDataTest/data/fiji.pbf'; */

  const admin1Regions = 'https://sebastian-ch.github.io/sidsDataTest/data/gadm1.pbf';
  const allSids = 'https://sebastian-ch.github.io/sidsDataTest/data/allSids.pbf';
  const EEZlines = 'https://sebastian-ch.github.io/sidsDataTest/data/eezlines.pbf';
  
  var files = [
    allSids,
    EEZlines
    
  ];

  var promises = [];


  files.forEach(function(url) {
    promises.push(d3.buffer(url))
  
  }) 

  Promise.all(promises).then(function(allData) {
    
    var allSids = geobuf.decode(new Pbf(allData[0]));
    var eezlines_gjn = geobuf.decode(new Pbf(allData[1]));
    
    //console.log(fiji)
    //addToMap(samoa, fiji, saEez, fEez)
    //addSamoa(samoa)
    //allSidsToMap(eezlines_gjn)


    addSources(allSids, eezlines_gjn);

  })
})

function addSources(sids, eez) {
  //console.log(sids);
  var sidsSourceName = 'allsids-source';
  var eezSourceName = 'eez-source'

  map.addSource(sidsSourceName, {
    'type': 'geojson', 
    'data': sids
  });

  map.addSource(eezSourceName, {
    'type': 'geojson',
    'data': eez
  })

}


function addSidOutline(name) {

  //console.log(map.getStyle().sources)

  if (map.getLayer('outline')) {
    map.removeLayer('outline');
  }

  map.addLayer({
    'id': 'outline',
    'type': 'line', 
    'source': 'allsids-source',
    'layout': {
      'visibility': 'visible'
      },
    'filter': ['==', 'NAME_0', name],
    'paint': {
        'line-color': 'red',
        /*'line-opacity': 0.3, */
        'line-width': 2
        }
    },
    
);

}



/*map.on('style.load', function() {
  addSamoa(x)
  map.addControl(new mapboxgl.Minimap(), 'bottom-right');
}) */



function allEez() {

  if (map.getLayer('eez-layer')) {
    map.removeLayer('eez-layer');
    map.removeLayer('disputed');
  } else {

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


  

}



  map.fitBounds(bbox(samoa), {
    linear: true,
    padding: {top: 10, bottom:25, left: 15, right: 5}
  });


   


  function addAdminToMap(data) {

    console.log(data);
    var sourceName = 'adminregions';
    var layerName = data.name+ '-layer';

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
          'fill-color': 'orange',
          'fill-opacity': 0.5,
          'fill-outline-color': 'black'
          }
      },
      'aeroway-line' 
  );


  }


function getAndFixBbox(data) {

  var theBbox = bbox(data);
  for (var x in theBbox) {
    if(theBbox[x] > 0) {
      theBbox[x] = theBbox[x] - 360;
    };

  }

  return theBbox



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



