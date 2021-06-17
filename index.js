import mapboxgl from "mapbox-gl";
import 'mapbox-gl/dist/mapbox-gl.css';

import { MapboxStyleDefinition, MapboxStyleSwitcherControl } from "mapbox-gl-style-switcher";
import "mapbox-gl-style-switcher/styles.css";

import names from './data/sidsNames.json'
import * as d3 from 'd3-fetch';
import Pbf from 'pbf'
import geobuf from 'geobuf';
import find from 'lodash.find'
import uniq from 'lodash.uniq'

import './style.css'


var sidsHolder = document.getElementById('sids');
names.map(function(x) {

    var btn = document.createElement("BUTTON"); 
    btn.innerHTML = x.NAME_0;
    btn.classList.add('sidsb')
    btn.setAttribute('id', x.GID_0)
    sids.appendChild(btn)
})

mapboxgl.accessToken =
  "pk.eyJ1Ijoic2ViYXN0aWFuLWNoIiwiYSI6ImNpejkxdzZ5YzAxa2gyd21udGpmaGU0dTgifQ.IrEd_tvrl6MuypVNUGU5SQ";

  const map = new mapboxgl.Map({
    container: "map", // container ID
    //style: 'mapbox://styles/mapbox/light-v10', //?optimize=true
    style: 'mapbox://styles/mapbox/satellite-v9',
    center: [0, 0], // starting position [lng, lat]
    zoom: 2, // starting zoom
  });

  //var sources = ['pop3d', 'allSids-source']

  var sourceData = {
      hexSource: {
        name: 'hex-source',
        data: null
      },

      allSidsSource: {
        name: 'allSids-source',
        data: [],
        lastName: null
      }


  }

  var currentGeojsonLayers = []

  map.on("load", function () {

    

    var nav = new mapboxgl.NavigationControl({
        visualizePitch: true
    });
    map.addControl(nav, 'top-left');

    const styles = [
      {title: "Satellite Imagery", uri: "mapbox://styles/mapbox/satellite-v9",},
      {title: "Light",uri: "mapbox://styles/mapbox/light-v10?optimize=true",},
      {title: "Satellite With Labels",uri: "mapbox://styles/mapbox/satellite-streets-v11",},
    ];
    
    map.addControl(new MapboxStyleSwitcherControl(styles), 'top-right');

    
    addHexSource()
    addSidsSource()

    
  });

  map.on('style.load', function(){
      
      if(sourceData.hexSource.data != null) {

        map.addSource('hex', {
          type: "geojson",
        data: geobuf.decode(new Pbf(sourceData.hexSource.data)),
        })

        map.addSource("allSids-source", {
          type: "geojson",
          data: geobuf.decode(new Pbf(sourceData.allSidsSource.data)),
        });

      }
      for (var x in currentGeojsonLayers) {
        if (currentGeojsonLayers[x] === 'hex') {
          addHex();
        }
        if(currentGeojsonLayers[x] === 'outline') {
          addSidsOutline(sourceData.allSidsSource.lastName)
          //console.log('hi')
        }
        if(currentGeojsonLayers[x] === 'pop3d') {

          add3dHex();
        }
        if(currentGeojsonLayers[x] === 'popDen') {
          addPopDen();
        }

      }

  })

  function addHexSource() {
    const hexTest = "https://sebastian-ch.github.io/sidsDataTest/data/hex.pbf";

    d3.buffer(hexTest).then(function (data) {
      map.addSource('hex', {
        type: "geojson",
        data: geobuf.decode(new Pbf(data)),
      });
      sourceData.hexSource.data = data;
    });


  }

  function addSidsSource() {

    const allSids = "https://sebastian-ch.github.io/sidsDataTest/data/allSids.pbf";

    d3.buffer(allSids).then(function (data) {
        map.addSource("allSids-source", {
          type: "geojson",
          data: geobuf.decode(new Pbf(data)),
        });

        sourceData.allSidsSource.data = data;
      });
  }

  const wrapper = document.getElementById('sids');

  wrapper.addEventListener('click', (event) => {
    const isButton = event.target.nodeName === 'BUTTON';
    if (!isButton) {
      return;
    }

    console.dir(event.target.id);

    if(!event.target.id.includes('data')) {

        

        var currbb = find(names, ['GID_0', event.target.id ])

        sourceData.allSidsSource.lastName = currbb.NAME_0;

        var v2 = new mapboxgl.LngLatBounds([currbb.bb[0], currbb.bb[1]])
          map.fitBounds(v2, {
          linear: true,
          padding: {top: 10, bottom:25, left: 15, right: 5},
          pitch: 0
        });
        addSidsOutline(currbb.NAME_0);
    } 
     else if(event.target.id.includes('pop3d')) {

        add3dHex(event.target.id)

    } else if(event.target.id.includes('hex')) {

        addHex(event.target.id);
    } else if (event.target.id.includes('popd')) {

      addPopDen()

    }
  })


function addPopDen() {

  currentGeojsonLayers = uniq(currentGeojsonLayers)
  
  if(map.getLayer('popDen')) {
      var thisIndex = currentGeojsonLayers.indexOf('popDen');
      if (thisIndex > -1) {
        currentGeojsonLayers.splice(thisIndex, 1);
      } 

      map.removeLayer('popDen')
      console.log(currentGeojsonLayers)
  } else {

      currentGeojsonLayers.push('popDen')
      console.log(currentGeojsonLayers)

      map.addLayer({
          'id': 'popDen',
          'type': 'fill', 
          'source': 'hex',
          'layout': {
            'visibility': 'visible'
            },
          
          'paint': {
              'fill-color': [
                'interpolate',
                ['linear'],
                ['get', '_mean'],
                0,
                '#ffffcc',
                345,
                '#c7e9b4',
                2408,
                '#7fcdbb',
                7190,
                '#41b6c4',
                19764,
                '#2c7fb8',
                58223,
                '#B86B25',
                ],
              'fill-opacity': 0.5,
              
              }
          });
  }

  map.easeTo({
    center: map.getCenter(),
    pitch: 0

  })

}

function addHex(name) {

    currentGeojsonLayers = uniq(currentGeojsonLayers)
  
    if(map.getLayer('hex')) {
        var thisIndex = currentGeojsonLayers.indexOf('hex');
        if (thisIndex > -1) {
          currentGeojsonLayers.splice(thisIndex, 1);
        } 

        map.removeLayer('hex')
        console.log(currentGeojsonLayers)
    } else {

        currentGeojsonLayers.push('hex')
        console.log(currentGeojsonLayers)

        var style1 = [
            'match',
            ['get', 'rando_3'],
            1, 'red',
            2, 'blue',
            3, 'yellow',
            4, 'orange',
            5, 'gray', 'green'
          ]

        map.addLayer({
            'id': 'hex',
            'type': 'fill', 
            'source': 'hex',
            'layout': {
              'visibility': 'visible'
              },
            
            'paint': {
                'fill-color': style1,
                'fill-opacity': 0.5,
                
                }
            });
    }


    map.easeTo({
      center: map.getCenter(),
      pitch: 0
  
    })

}

function add3dHex() {

  currentGeojsonLayers = uniq(currentGeojsonLayers)
  

  if (map.getLayer('pop3d')) {
    var thisIndex = currentGeojsonLayers.indexOf('pop3d');
        if (thisIndex > -1) {
          currentGeojsonLayers.splice(thisIndex, 1);
        }
    map.removeLayer('pop3d');
  } else {
    currentGeojsonLayers.push('pop3d')
    map.addLayer({
      id: 'pop3d',
      type: "fill-extrusion",
      source: 'hex',
      layout: {
        visibility: "visible",
      },
      paint: {
        "fill-extrusion-color": [
          'interpolate',
          ['linear'],
          ['get', '_mean'],
          0,
          '#ffffcc',
          345,
          '#c7e9b4',
          2408,
          '#7fcdbb',
          7190,
          '#41b6c4',
          19764,
          '#2c7fb8',
          58223,
          '#B86B25',
          ],
        "fill-extrusion-height": ["get", "_mean"],
        "fill-extrusion-opacity": 0.75,
      },
    });
  }
  var v2 = new mapboxgl.LngLatBounds([
    [103.60905, 1.16639],
    [104.0858, 1.47139],
  ]);
  /*map.fitBounds(v2, {
    linear: true,
    padding: { top: 10, bottom: 25, left: 15, right: 5 },
    pitch: 55,
    }); */

  console.log(map.getCenter())

  map.easeTo({
    center: map.getCenter(),
    pitch: 55

  })
  //map.setPitch(55);


}



function addSidsOutline(name) {

  console.log(name)
  currentGeojsonLayers = uniq(currentGeojsonLayers)
  

  if (map.getLayer("outline")) {
    map.setFilter("outline", ["==", "NAME_0", name]);
   

  } else {

    currentGeojsonLayers.push('outline')
    console.log(currentGeojsonLayers)

    map.addLayer({
      id: "outline",
      type: "line",
      source: "allSids-source",
      layout: {
        visibility: "visible",
      },
      filter: ["==", "NAME_0", name],
      paint: {
        "line-color": "red",
        /*'line-opacity': 0.3, */
        "line-width": 2,
      },
    });

  }
}
    



