//import names from './data/sidsNames.json'
import * as d3 from 'd3-fetch';
import allLayers from './index'
import uniq from 'lodash.uniq';


export default function addButton(names, allTheLayers) {

    var sidsHolder = document.getElementById('country-select');
    names.map(function(x) {
        var btn = document.createElement("option"); 
        btn.innerHTML = x.NAME_0;
        btn.classList.add('sidsb')
        btn.setAttribute('id', x.GID_0)
        sidsHolder.appendChild(btn)
    })


    d3.csv(allTheLayers).then(function(d){
        //console.log(d);
      
        d.map(function(x) {
          allLayers.push(
            {'field_name':x.Field_Name,
            'title': x.Name,
            'band': x.Band,
            'time': x.Temporal,
            'desc': x.Description, 
            'units': x.Unit,
            'desc_long':x.Desc_long, 
            'source_name': x.Source_Name, 
            'link': x.Source_Link
          })

          var uniqueNames = allLayers.map(x => x.title)
          //console.log(uniq(uniqueNames))

          var dataHolder = document.getElementById('dataDrop')
          
          var btn1 = document.createElement("option"); 
          btn1.innerHTML = x.Name + ' ' + x.Temporal;
          btn1.classList.add('data')
          btn1.setAttribute('id', x.Field_Name)
          dataHolder.appendChild(btn1)
      
        })
      /*  var dataHolder = document.getElementById('dataDrop')
        var uniqueNames = allLayers.map(x => x.title)
        //console.log(uniq(uniqueNames))
        var actualu = uniq(uniqueNames);

        for (var x in actualu) {
          //console.log(actualu[x]);
          var btn1 = document.createElement("option"); 
          btn1.innerHTML = actualu[x];
          btn1.classList.add('data')
          btn1.setAttribute('id', allLayers[x].field_name)
          dataHolder.appendChild(btn1) 


        } */

        

        

      })
      

    }