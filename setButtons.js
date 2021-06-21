//import names from './data/sidsNames.json'
import * as d3 from 'd3-fetch';
import allLayers from './index'

export default function addButton(names, allTheLayers) {

    var sidsHolder = document.getElementById('myDropdown');
    names.map(function(x) {
        var btn = document.createElement("BUTTON"); 
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
            'desc': x.Description, 
            'units': x.Unit,
            'desc_long':x.Desc_long, 
            'source_name': x.Source_Name, 
            'link': x.Source_Link
          })
      
          var dataHolder = document.getElementById('dataDrop')
      
          var btn1 = document.createElement("BUTTON"); 
          btn1.innerHTML = x.Name;
          btn1.classList.add('data')
          btn1.setAttribute('id', x.Field_Name)
          dataHolder.appendChild(btn1)
      
        })
        
      })
      



}