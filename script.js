var selected_shape  = null
function initialize()
{
    var goo             = google.maps,
        map_in          = new goo.Map(document.getElementById('map_in'),
                                      { zoom: 8,
                                        center: new goo.LatLng(-45.7775112,-68.7557955),
                                        mapTypeId: 'terrain'
                                      }),
        map_out         = new goo.Map(document.getElementById('map_out'),
                                      { zoom: 8,
                                        center: new goo.LatLng(-45.7775112,-68.7557955),
                                        mapTypeId: 'terrain'
                                      }),
        shapes          = [],
        drawman         = new goo.drawing.DrawingManager({map:map_in,markerOptions:{icon:"rig.png"}}),
        byId            = function(s){return document.getElementById(s)},
        clearSelection  = function(){
                            if(selected_shape){
                              selected_shape.set((selected_shape.type
                                                  ===
                                                  google.maps.drawing.OverlayType.MARKER
                                                 )?'draggable':'editable',false);
                              selected_shape = null;
                            }
                          },
        setSelection    = function(shape){
                            clearSelection();
                            selected_shape=shape;

                              selected_shape.set((selected_shape.type
                                                  ===
                                                  google.maps.drawing.OverlayType.MARKER
                                                 )?'draggable':'editable',true);

                          },
        clearShapes     = function(){
                            //for(var i=0;i<shapes.length;++i){
                              var index = shapes.indexOf(selected_shape)
                              if(index>-1){
                                shapes.splice(index,1)
                              }
                              selected_shape.setMap(null);

                            //}
                          };
    map_in.bindTo('center',map_out,'center');
    map_in.bindTo('zoom',map_out,'zoom');

    goo.event.addListener(drawman, 'markercomplete', function(e) {
      var shapeMarker=e
      for(var i = 0; i < shapes.length; i++){
        shape=shapes[i];
        tmp={type:IO.t_(shape.type),id:i};
        switch(tmp.type){
           case 'RECTANGLE':
           case 'CIRCLE':
              var latLngA = new google.maps.LatLng(e.position.lat(), e.position.lng());
              var bounds= shape.getBounds();
              alert(bounds.contains(latLngA));
              break;
           case 'POLYGON':
              var resultColor = google.maps.geometry.poly.containsLocation(e.position, shape) ?'red' :'green';
              alert(resultColor);
              break;
           }
      }
    });

    function attachPolygonInfoWindow(polygon,tag) {
        var infoWindow = new google.maps.InfoWindow();
        google.maps.event.addListener(polygon, 'rightclick', function (e) {
            content='<form class="PRUEBA" action="index.html" method="post"><p>  '+
                    'Latitud <input type="text" name="LATITUD" value=""><p>'+
                    'Longitud <input type="text" name="LONGITUD" value=""><p> '+
                    '<button type="button" name="BOTON">ACEPTAR</button>'+
                  '</form> ';

            //infoWindow.setContent(tag);
            infoWindow.setContent(content);
            var latLng = e.latLng;
            infoWindow.setPosition(latLng);
            infoWindow.open(map_in);
        });
    }

    goo.event.addListener(drawman, 'overlaycomplete', function(e) {
        var shape   = e.overlay;
        shape.type  = e.type;
        switch (shape.type) {
          case 'circle':
          case 'rectangle':
          case 'polygon':
            var t = $('#custom').spectrum("get");
            shape.setOptions({fillColor:t.toHexString()});
            shape.tag='Zona ';
            attachPolygonInfoWindow(shape,shape.tag);
            break;
        }
        goo.event.addListener(shape, 'click', function() {
          setSelection(this);
        });
        setSelection(shape);
        shapes.push(shape);
      });

    goo.event.addListener(map_in, 'click',clearSelection);

    goo.event.addDomListener(byId('clear_shapes'), 'click', clearShapes);

    goo.event.addDomListener(byId('save_encoded'), 'click', function(){
      var data=IO.IN(shapes,true);byId('data').value=JSON.stringify(data);});

    goo.event.addDomListener(byId('save_raw'), 'click', function(){
      var data=IO.IN(shapes,false);byId('data').value=JSON.stringify(data);});

    goo.event.addDomListener(byId('restore'), 'click', function(){
      if(this.shapes){
        for(var i=0;i<this.shapes.length;++i){
              this.shapes[i].setMap(null);
        }
      }

      this.shapes=IO.OUT(JSON.parse(byId('data').value),map_out);
    });
    google.maps.event.addListener(map_in, 'mousemove', function(event) {
          byId('latitude').value = event.latLng.lat();
          byId('longitude').value = event.latLng.lng();
    });
}


var IO={
  //returns array with storable google.maps.Overlay-definitions
  IN:function(arr,//array with google.maps.Overlays
              encoded//boolean indicating whether pathes should be stored encoded
              ){
      var shapes     = [],
          goo=google.maps,
          shape,tmp;

      for(var i = 0; i < arr.length; i++)
      {
        shape=arr[i];
        var color=shape.fillColor;
        tmp={type:this.t_(shape.type),id:i,fillColor:color};


        switch(tmp.type){
           case 'CIRCLE':
              tmp.radius=shape.getRadius();
              tmp.geometry=this.p_(shape.getCenter());
            break;
           case 'MARKER':
              tmp.geometry=this.p_(shape.getPosition());
            break;
           case 'RECTANGLE':
              tmp.geometry=this.b_(shape.getBounds());
             break;
           case 'POLYLINE':
              tmp.geometry=this.l_(shape.getPath(),encoded);
             break;
           case 'POLYGON':
              tmp.geometry=this.m_(shape.getPaths(),encoded);

             break;
       }
       shapes.push(tmp);
    }

    return shapes;
  },
  //returns array with google.maps.Overlays
  OUT:function(arr,//array containg the stored shape-definitions
               map//map where to draw the shapes
               ){
      var shapes     = [],
          goo=google.maps,
          map=map||null,
          shape,tmp;

      for(var i = 0; i < arr.length; i++)
      {
        shape=arr[i];

        switch(shape.type){
           case 'CIRCLE':
              tmp=new goo.Circle({radius:Number(shape.radius),center:this.pp_.apply(this,shape.geometry)});
            break;
           case 'MARKER':
              tmp=new goo.Marker({position:this.pp_.apply(this,shape.geometry)});
            break;
           case 'RECTANGLE':
              tmp=new goo.Rectangle({bounds:this.bb_.apply(this,shape.geometry)});
             break;
           case 'POLYLINE':
              tmp=new goo.Polyline({path:this.ll_(shape.geometry)});
             break;
           case 'POLYGON':
              tmp=new goo.Polygon({paths:this.mm_(shape.geometry)});

             break;
       }
       tmp.setValues({map:map,id:shape.id,fillColor:shape.fillColor})
       shapes.push(tmp);
    }
    return shapes;
  },
  l_:function(path,e){
    path=(path.getArray)?path.getArray():path;
    if(e){
      return google.maps.geometry.encoding.encodePath(path);
    }else{
      var r=[];
      for(var i=0;i<path.length;++i){
        r.push(this.p_(path[i]));
      }
      return r;
    }
  },
  ll_:function(path){
    if(typeof path==='string'){
      return google.maps.geometry.encoding.decodePath(path);
    }
    else{
      var r=[];
      for(var i=0;i<path.length;++i){
        r.push(this.pp_.apply(this,path[i]));
      }
      return r;
    }
  },

  m_:function(paths,e){
    var r=[];
    paths=(paths.getArray)?paths.getArray():paths;
    for(var i=0;i<paths.length;++i){
        r.push(this.l_(paths[i],e));
      }
     return r;
  },
  mm_:function(paths){
    var r=[];
    for(var i=0;i<paths.length;++i){
        r.push(this.ll_.call(this,paths[i]));

      }
     return r;
  },
  p_:function(latLng){
    return([latLng.lat(),latLng.lng()]);
  },
  pp_:function(lat,lng){
    return new google.maps.LatLng(lat,lng);
  },
  b_:function(bounds){
    return([this.p_(bounds.getSouthWest()),
            this.p_(bounds.getNorthEast())]);
  },
  bb_:function(sw,ne){
    return new google.maps.LatLngBounds(this.pp_.apply(this,sw),
                                        this.pp_.apply(this,ne));
  },
  t_:function(s){
    var t=['CIRCLE','MARKER','RECTANGLE','POLYLINE','POLYGON'];
    for(var i=0;i<t.length;++i){
       if(s===google.maps.drawing.OverlayType[t[i]]){
         return t[i];
       }
    }
  }
}
google.maps.event.addDomListener(window, 'load', initialize);
