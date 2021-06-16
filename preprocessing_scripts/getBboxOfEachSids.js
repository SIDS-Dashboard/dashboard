
//import * as gjn from './data/allsids.geojson'
var fs = require('fs')
var bbox = require('@turf/bbox');
var gjn = require('../data/allsids.geojson')

var fetch = require('node-fetch')


fetch(gjn).then(function(resp){
    return resp.json();
}).then(function(data){
    console.log(data)
})
