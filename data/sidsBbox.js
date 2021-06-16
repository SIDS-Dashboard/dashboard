fetch(gjn)
.then(function(resp) {
  return resp.json()
}).then(function(data) {
  getBboxData(data);
})

function getBboxData(data) {
  for(var x in data.features) {
    console.log(data.features[x].properties.NAME_0 + ' : ' + bbox(data.features[x].geometry) + ',')
  }
  //console.log(data);
}
