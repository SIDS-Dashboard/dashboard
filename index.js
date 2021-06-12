import mapboxgl from "mapbox-gl";
import 'mapbox-gl/dist/mapbox-gl.css';

import './style.css'


mapboxgl.accessToken =
  "pk.eyJ1Ijoic2ViYXN0aWFuLWNoIiwiYSI6ImNpejkxdzZ5YzAxa2gyd21udGpmaGU0dTgifQ.IrEd_tvrl6MuypVNUGU5SQ";


const map = new mapboxgl.Map({
  container: "map", // container ID
  style: 'mapbox://styles/mapbox/satellite-v9', //?optimize=true
  center: [-169.53, 16.73], // starting position [lng, lat]
  zoom: 13, // starting zoom
});