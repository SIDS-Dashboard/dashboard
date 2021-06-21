import mapboxgl from "mapbox-gl";
import 'mapbox-gl/dist/mapbox-gl.css';

import { MapboxStyleDefinition, MapboxStyleSwitcherControl } from "mapbox-gl-style-switcher";
import "mapbox-gl-style-switcher/styles.css";

import names from './data/sidsNames.json'
import allTheLayers from './data/csv_data.csv'
import * as d3 from 'd3-fetch';
import Pbf from 'pbf'
import geobuf from 'geobuf';
import find from 'lodash.find'
import uniq from 'lodash.uniq'
import chroma from "chroma-js";
import addButtons from './setButtons'
import './style.css'


var allLayers = []
export default allLayers
addButtons(names, allTheLayers);


/*Initialize Map */
mapboxgl.accessToken =
  "pk.eyJ1Ijoic2ViYXN0aWFuLWNoIiwiYSI6ImNpejkxdzZ5YzAxa2gyd21udGpmaGU0dTgifQ.IrEd_tvrl6MuypVNUGU5SQ";

  const map = new mapboxgl.Map({
    container: "map", // container ID
    //style: 'mapbox://styles/mapbox/light-v10', //?optimize=true
    style: 'mapbox://styles/mapbox/satellite-v9', 
    center: [-71.4, 19.1], // starting position [lng, lat]
    zoom: 7,
    pitch: 55
  });

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

  var currentGeojsonLayers = {
    color: null,
    breaks: null,
    dataLayer: null
  };
  var legendControl;

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

    class MyCustomControl {
      onAdd(map){
        this.map = map;
        this.container = document.createElement('div');
        this.container.className = 'legend';
        this.container.id = 'legend'
        //this.container.textContent = 'Legend Here';
        return this.container;
      }
      onRemove(){
        this.container.parentNode.removeChild(this.container);
        this.map = undefined;
      }
    } 
    
    legendControl = new MyCustomControl(); 
    
    addHexSource()
    //addSidsSource()

    
  });

  
  //function taken from mapbox that extracts unique features, see comment below
  function getUniqueFeatures(array, comparatorProperty) {
    var existingFeatureKeys = {};
    // Because features come from tiled vector data, feature geometries may be split
    // or duplicated across tile boundaries and, as a result, features may appear
    // multiple times in query results.
    var uniqueFeatures = array.filter(function (el) {
    if (existingFeatureKeys[el.properties[comparatorProperty]]) {
    return false;
    } else {
    existingFeatureKeys[el.properties[comparatorProperty]] = true;
    return true;
    }
    });
     
    return uniqueFeatures;
    }

  map.on('style.load', function(){
    var layers = map.getStyle().layers;
    // Find the index of the first symbol layer in the map style
    var firstSymbolId;
    for (var i = 0; i < layers.length; i++) {
    if (layers[i].type === 'symbol') {
    firstSymbolId = layers[i].id;
    break;
    }
    }
      if(sourceData.hexSource.data != null) {

        map.addSource('hex', {
          type: "geojson",
        data: geobuf.decode(new Pbf(sourceData.hexSource.data)),
        })

        map.addLayer({
          'id': 'hex',
          'type': 'fill', 
          'source': 'hex',
          'layout': {
            'visibility': 'visible'
            },
          //'filter': ['!=', "null"],
          'paint': {
              'fill-color': [
                'interpolate',
                ['linear'],
                ['get', currentGeojsonLayers.dataLayer],
                currentGeojsonLayers.breaks[0], currentGeojsonLayers.color[0],
                currentGeojsonLayers.breaks[1], currentGeojsonLayers.color[1],
                currentGeojsonLayers.breaks[2], currentGeojsonLayers.color[2],
                currentGeojsonLayers.breaks[3], currentGeojsonLayers.color[3],
                currentGeojsonLayers.breaks[4], currentGeojsonLayers.color[4],
                ],
              'fill-opacity': 0.7,
              
              }
          }, firstSymbolId);

       /* map.addSource("allSids-source", {
          type: "geojson",
          data: geobuf.decode(new Pbf(sourceData.allSidsSource.data)),
        }); */

      }

  })


  /*****ADMIN BUTTON WRAPPER****/
  const adminWrap = document.getElementById('admin');
  adminWrap.addEventListener('click', (event) => {


    if(map.getLayer('admin')) {
      map.removeLayer('admin')
    } else {
      map.addLayer({
        id: "admin",
        type: "line",
        source: "allSids-source",
        layout: {
          visibility: "visible",
        },
        paint: {
          "line-color": "red",
          /*'line-opacity': 0.3, */
          "line-width": 2,
        },
      });
    }
    


  })

  
  const wrapper = document.getElementById('myDropdown');
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

        /*map.on('moveend', function(){

          if(map.getLayer('hex')) {
          var features = map.queryRenderedFeatures({
            layers: ['hex']
          })
      
          if(features) {
      
            var uniFeatures = getUniqueFeatures(features, 'hexid');
            //console.log(uniFeatures[0].properties._mean);
            //console.log(uniFeatures);
            var selecteData = uniFeatures.map(x => x.properties[currentGeojsonLayers.dataLayer])
            //console.log(selecteData);
            var max = Math.max(...selecteData)
            var min = Math.min(...selecteData)
      
      
            //var colorz = chroma.scale(['lightyellow', 'navy']).domain([min, max], 5, 'quantiles');
            var breaks = chroma.limits(selecteData, 'q', 4)
            //console.log(breaks)
           
            
            //console.log(colorz.classes)
          
            currentGeojsonLayers.breaks = breaks;
      
              map.setPaintProperty('hex', 'fill-color',
              [
                'interpolate',
                ['linear'],
                ['get', currentGeojsonLayers.dataLayer],
                breaks[0], currentGeojsonLayers.color[0],
                breaks[1], currentGeojsonLayers.color[1],
                breaks[2], currentGeojsonLayers.color[2],
                breaks[3], currentGeojsonLayers.color[3],
                breaks[4], currentGeojsonLayers.color[4],
                ]
              
              )
              map.setPaintProperty('hex','fill-opacity', 0.5)
              map.setFilter('hex',['has',currentGeojsonLayers.dataLayer])
              addLegend(colorRamp, breaks, currentGeojsonLayers.dataLayer)
      
              }
            }
        }) */
        //addSidsOutline(currbb.NAME_0);
    } 
   /*  else if(event.target.id.includes('pop3d')) {

        add3dHex(event.target.id)
        addLegend(event.target.id)

    } else if(event.target.id.includes('hex')) {

        addHex(event.target.id);
    } else if (event.target.id.includes('popd')) {

      addPopDen()

    } */
  })


  const dataWrapper = document.getElementById('dataDrop');
  dataWrapper.addEventListener('click', (event) => {
    const isButton = event.target.nodeName === 'BUTTON';
    if (!isButton) {
      return;
    }

    if(map.getLayoutProperty('hex', 'visibility', 'none')) {
      map.setLayoutProperty('hex','visibility','visible')
    }
    currentGeojsonLayers.dataLayer = event.target.id
    console.dir(event.target.id);

    if(map.getLayoutProperty('hex', 'visibility','visible')) {

      var features = map.queryRenderedFeatures({
        layers: ['hex']
      })
  
      if(features) {

        var uniFeatures = getUniqueFeatures(features, 'hexid');
        //console.log(uniFeatures[0].properties._mean);
        //console.log(uniFeatures);
        var selecteData = uniFeatures.map(x => x.properties[event.target.id])
        //console.log(selecteData);
        var max = Math.max(...selecteData)
        var min = Math.min(...selecteData)
  
  
        //var colorz = chroma.scale(['lightyellow', 'navy']).domain([min, max], 5, 'quantiles');
        var breaks = chroma.limits(selecteData, 'q', 4)
        //console.log(breaks)
        var colorRamp3 = chroma.scale(['#fafa6e','#2A4858']).mode('lch').colors(5)
        var colorRamp1 = ['#edf8fb', '#b2e2e2','#66c2a4','#2ca25f', '#006d2c' ]
        var colorRamp2 = ['#f2f0f7','#cbc9e2' ,'#9e9ac8' , '#756bb1' , '#54278f' ]
        var colorRamp4 = [ '#ca0020','#f4a582' ,'#f7f7f7' ,'#92c5de' ,'#0571b0' ]
        
        //console.log(colorz.classes)
        var ramps = [colorRamp1, colorRamp2, colorRamp3, colorRamp4]

        var colorRamp = ramps[Math.floor(Math.random() * 4)];

        currentGeojsonLayers.breaks = breaks;
        currentGeojsonLayers.color = colorRamp;

        if(event.target.id == '1c5') {

          function rotateCamera(timestamp) {
            // clamp the rotation between 0 -360 degrees
            // Divide timestamp by 100 to slow rotation to ~10 degrees / sec
            map.rotateTo((timestamp / 100) % 360, { duration: 0 });
            // Request the next frame of the animation.
            requestAnimationFrame(rotateCamera);
            }

          rotateCamera(0)

         /* map.easeTo({
            center: map.getCenter(),
            pitch: 55,
            bearing: 180,
            duration: 4000
        
          })*/
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
                ['get', event.target.id],
                breaks[0], colorRamp[0],
                breaks[1], colorRamp[1],
                breaks[2], colorRamp[2],
                breaks[3], colorRamp[3],
                breaks[4], colorRamp[4],
                ],
              "fill-extrusion-height": ["get", event.target.id],
              "fill-extrusion-opacity": 0.75,
            },
          });

          
    
        } else if(map.getLayer('pop3d')) {
            map.removeLayer('pop3d');
            map.easeTo({
              center: map.getCenter(),
              pitch: 0
          
            })
            
          }

        

        map.setPaintProperty('hex', 'fill-color',
        [
          'interpolate',
          ['linear'],
          ['get', event.target.id],
          breaks[0], colorRamp[0],
          breaks[1], colorRamp[1],
          breaks[2], colorRamp[2],
          breaks[3], colorRamp[3],
          breaks[4], colorRamp[4],
          ]
        
        )
        map.setPaintProperty('hex','fill-opacity', 0.5)
        map.setFilter('hex',['has',event.target.id])
        addLegend(colorRamp, breaks, event.target.id)
        
      } 
  
    } 

    //each time the map moves, repaint
   map.on('moveend', function(){

    if(map.getLayer('hex')) {
    var features = map.queryRenderedFeatures({
      layers: ['hex']
    })

    if(features) {

      var uniFeatures = getUniqueFeatures(features, 'hexid');
      //console.log(uniFeatures[0].properties._mean);
      //console.log(uniFeatures);
      var selecteData = uniFeatures.map(x => x.properties[currentGeojsonLayers.dataLayer])
      //console.log(selecteData);
      var max = Math.max(...selecteData)
      var min = Math.min(...selecteData)


      //var colorz = chroma.scale(['lightyellow', 'navy']).domain([min, max], 5, 'quantiles');
      var breaks = chroma.limits(selecteData, 'q', 4)
      //console.log(breaks)
     
      
      //console.log(colorz.classes)
    
      currentGeojsonLayers.breaks = breaks;

        map.setPaintProperty('hex', 'fill-color',
        [
          'interpolate',
          ['linear'],
          ['get', currentGeojsonLayers.dataLayer],
          breaks[0], currentGeojsonLayers.color[0],
          breaks[1], currentGeojsonLayers.color[1],
          breaks[2], currentGeojsonLayers.color[2],
          breaks[3], currentGeojsonLayers.color[3],
          breaks[4], currentGeojsonLayers.color[4],
          ]
        
        )
        map.setPaintProperty('hex','fill-opacity', 0.5)
        //map.setFilter('hex',['has',currentGeojsonLayers.dataLayer])
        addLegend(currentGeojsonLayers.color, breaks, currentGeojsonLayers.dataLayer)

        }
      }
  
})
})

//addLegend()
//add the legend
function addLegend(colors, breaks, current) {

  //console.log(allLayers)
  
  var legData = find(allLayers, ['field_name', current])
  //console.log(legData)

  if(!map.hasControl(legendControl)) {
    map.addControl(legendControl, 'bottom-right')
  }
var infoBox = document.getElementById('infoBox')
  infoBox.style.display = "block";

  infoBox.innerHTML = '<h2>'+ legData.title + '</h2><p>'+ legData.desc_long + '</p>' +
   '<b>Reference: </b>' + legData.source_name + ' - ' +
    legData.link.link();
  

  //console.log('hi')

  //map.addControl(legendControl, 'bottom-left')
  var legend = document.getElementById('legend');
  legend.innerHTML = '';
  legend.innerHTML = '<h3>' + legData.units + '</h3>';
  for (var x in colors) {
    legend.innerHTML+= '<span style="background:'+ colors[x] + '"></span>' +
    '<label>'+ Number.parseFloat(breaks[x]).toFixed(3)+'</label>'

  }
    
}


//3d function
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
          '#253494',
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

  //console.log(map.getCenter())

  map.easeTo({
    center: map.getCenter(),
    pitch: 55

  })
  //map.setPitch(55);


}


function addSidsSource() {

    const allSids = "https://sebastian-ch.github.io/sidsDataTest/data/gadm1.pbf";

    d3.buffer(allSids).then(function (data) {
        map.addSource("allSids-source", {
          type: "geojson",
          data: geobuf.decode(new Pbf(data)),
        });

        sourceData.allSidsSource.data = data;
      });
  }


  //add sources

  function addHexSource() {
    const hexTest = "https://sebastian-ch.github.io/sidsDataTest/data/hex5u.pbf";

    d3.buffer(hexTest).then(function (data) {
      map.addSource('hex', {
        type: "geojson",
        data: geobuf.decode(new Pbf(data)),
      });
      sourceData.hexSource.data = data;

      map.addLayer({
        'id': 'hex',
        'type': 'fill', 
        'source': 'hex',
        'layout': {
          'visibility': 'visible'
          },
        
        'paint': {
            'fill-color': 'blue',
            'fill-opacity': 0,
            
            }
        });
    });
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


