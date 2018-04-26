var selected_shape = null
var map_in;
var shapes = [];
function initialize() {
  map_in = new google.maps.Map(document.getElementById('map_in'),
    {
      zoom: 9,
      center: new google.maps.LatLng(-45.7775112, -68.7557955),
      mapTypeId: 'terrain'
    });
  var goo = google.maps,

    /*map_out         = new goo.Map(document.getElementById('map_out'),
                                  { zoom: 8,
                                    center: new goo.LatLng(-45.7775112,-68.7557955),
                                    mapTypeId: 'terrain'
                                  }),*/
    cargarShapes = function () {
      storageEngine.init(function () { console.log('Success Init'); }, function () { console.log('Error Init'); });
      storageEngine.initObjectStore('areas', function () { console.log('Success Init Object'); }, function () { console.log('Error Init Object'); });
      storageEngine.findAll('areas', function (storedAreas) {
        if (storedAreas.length === 0) {
          shapes = IO.OUT(retornaDatos(), map_in);
        }else{
          shapes = IO.OUT(storedAreas[0], map_in);
        }
          for (var i = 0; i < shapes.length; i++) {
            var shape;
            shape = shapes[i];
            goo.event.addListener(shape, 'click', function () {
              setSelection(this);
            });
          }
        
      },
        function () { console.log('Error finding all'); });
    },

    drawman = new goo.drawing.DrawingManager({ map: map_in, markerOptions: { icon: "img/rig.png" } }),
    byId = function (s) { return document.getElementById(s) },
    clearSelection = function () {
      if (selected_shape) {
        selected_shape.set((selected_shape.type
          ===
          google.maps.drawing.OverlayType.MARKER
        ) ? 'draggable' : 'editable', false);

      }
      byId('datosZona').style.display = 'none';
      selected_shape = null;
    },

    setSelection = function (shape) {
      clearSelection();
      selected_shape = shape;
      selected_shape.set((selected_shape.type === google.maps.drawing.OverlayType.MARKER) ? 'draggable' : 'editable', true);

      if (selected_shape.type === google.maps.drawing.OverlayType.MARKER) {   // Si hago click sobre un MARKER

        var nombrePozo = '<big><b>' + selected_shape.title + '</b></big>';
        nombrePozo = nombrePozo.concat('<br>');
        nombrePozo = nombrePozo.concat(selected_shape.customInfo);
        var infowindow = new google.maps.InfoWindow({
          content: nombrePozo
        });
        infowindow.open(map_in, selected_shape);

      } else if (selected_shape.type === google.maps.drawing.OverlayType.POLYGON) {
        show_form(byId('datosZona'));
        if (selected_shape.tag !== undefined) {
          var infowindow = new google.maps.InfoWindow({
            content: selected_shape.tag,
            position: polygonCenter(selected_shape)
          });
          infowindow.open(map_in, selected_shape);
        }
      }

    },

    clearShapes = function () {
      //for(var i=0;i<shapes.length;++i){
      var index = shapes.indexOf(selected_shape)
      if (index > -1) {
        shapes.splice(index, 1)
      }
      selected_shape.setMap(null);

      //}
    };

  //map_in.bindTo('center',map_out,'center');
  //map_in.bindTo('zoom',map_out,'zoom');

  goo.event.addListener(drawman, 'markercomplete', function (e) {
    var shapeMarker = e
    for (var i = 0; i < shapes.length; i++) {
      shape = shapes[i];
      tmp = { type: IO.t_(shape.type), id: i };
      switch (tmp.type) {
        case 'RECTANGLE':
        case 'CIRCLE':
          var latLngA = new google.maps.LatLng(e.position.lat(), e.position.lng());
          var bounds = shape.getBounds();
          if (bounds.contains(latLngA)) {
            alert(shape.tag);
          }
          break;
        case 'POLYGON':
          if (google.maps.geometry.poly.containsLocation(e.position, shape)) {
            marker.setValues({ customInfo: marker.customInfo + "<br> ZONA: " + shape.tag });
            alert(shape.tag);
          }
          break;
      }
    }
  });

  function attachPolygonInfoWindow(polygon) {

    google.maps.event.addListener(polygon, 'rightclick', function (e) {
      content = polygon.tag;
      //infoWindow.setContent(tag);
      infoWindow.setContent(content);
      var latLng = e.latLng;
      infoWindow.setPosition(latLng);
      infoWindow.open(map_in);
      show_form(byId('datosZona'));
      setSelection(polygon);
    });
  }
  google.maps.event.addListener(drawman, 'polygoncomplete', function (e) {
    /*var infoWindow = new google.maps.InfoWindow();
    content=' Nombre <input id="nombreZona" type="text"><p><button type="button" onClick="guardarNombreZona(selected_shape)">Confirmar</button>';
    infoWindow.setContent(content);
    infoWindow.setPosition(polygonCenter(e));
    infoWindow.open(map_in);*/
    /*  var myOptions = {
                   content: "Hola"
                   ,boxStyle: {
                         border: "1px solid black"
                        ,textAlign: "center"
                        ,fontSize: "8pt"
                        ,width: "50px"
                   }
                   ,disableAutoPan: true
                   ,position: polygonCenter(e)
                   ,isHidden: false
                   ,pane: "mapPane"
                   ,enableEventPropagation: true
      };
      var ibLabel = new InfoBox(myOptions);
      ibLabel.open(map_in);*/

  });

  function polygonCenter(poly) {
    var lowx,
      highx,
      lowy,
      highy,
      lats = [],
      lngs = [],
      vertices = poly.getPath();

    for (var i = 0; i < vertices.length; i++) {
      lngs.push(vertices.getAt(i).lng());
      lats.push(vertices.getAt(i).lat());
    }

    lats.sort();
    lngs.sort();
    lowx = lats[0];
    highx = lats[vertices.length - 1];
    lowy = lngs[0];
    highy = lngs[vertices.length - 1];
    center_x = lowx + ((highx - lowx) / 2);
    center_y = lowy + ((highy - lowy) / 2);
    return (new google.maps.LatLng(center_x, center_y));
  }

  goo.event.addListener(drawman, 'overlaycomplete', function (e) {
    var shape = e.overlay;
    shape.type = e.type;
    switch (shape.type) {
      case 'circle':
      case 'rectangle':
        google.maps.event.addListener(shape, 'bounds_changed', function () {
          alert("SE MODIFICOOOO");
        });
      case 'polygon':
        var t = $('#custom').spectrum("get");
        shape.setOptions({ fillColor: t.toHexString() });
        google.maps.event.addListener(shape.getPath(), 'set_at', function () {
          actualizarMarkerZona(shape);
          alert("test");
        });
        google.maps.event.addListener(shape.getPath(), 'insert_at', function () {
          actualizarMarkerZona(shape);
          alert("test");
        });
        //attachPolygonInfoWindow(shape);
        //google.maps.event.addListener(shape, 'rightclick', function (e) {
        /*var infoWindow = new google.maps.InfoWindow({
          content: shape.tag,
          position: e.latLng
        });*/
        //infoWindow.setContent(tag);
        //          infoWindow.setContent(content);
        //var latLng = e.latLng;
        //infoWindow.setPosition(latLng);
        //infoWindow.open(map_in);
        //show_form(byId('datosZona'));
        //setSelection(shape);
        //});
        break;
    }
    goo.event.addListener(shape, 'click', function () {
      setSelection(this);
    });
    setSelection(shape);
    shapes.push(shape);
    //show_form(document.getElementById('datosZona'));
    function actualizarMarkerZona(polygon) {
      for (var i = 0; i < shapes.length; i++) {
        if (shapes[i].type === goo.drawing.OverlayType.MARKER) {
          var marker = shapes[i];
          if (google.maps.geometry.poly.containsLocation(marker.position, polygon)) {
            marker.setValues({ customInfo: marker.customInfo + '<br> ZONA: ' + polygon.tag });
          } else if (marker.customInfo.indexOf('ZONA: ' + polygon.tag) > 0) {
            marker.setValues({ customInfo: marker.customInfo.substring(0, marker.customInfo.indexOf('ZONA: ' + polygon.tag)) });
          }
        }
      }
    };
  });

  goo.event.addListener(map_in, 'click', clearSelection);

  goo.event.addDomListener(byId('clear_shapes'), 'click', clearShapes);

  goo.event.addDomListener(byId('save_encoded'), 'click', function () {
    var data = IO.IN(shapes, true); byId('data').value = JSON.stringify(data);
    storageEngine.init(function () { console.log('Success Init'); }, function () { console.log('Error Init'); });
    storageEngine.initObjectStore('areas', function () { console.log('Success Init Object'); }, function () { console.log('Error Init Object'); });
    //storageEngine.delete('areas', '1', function(result){console.log('Success deleting ' + result);}, function(){console.log('Error deleting');});
    storageEngine.save('areas', data, function () { console.log('Success save'); }, function () { console.log('Error save'); });
  });

  goo.event.addDomListener(byId('save_raw'), 'click', function () {
    var data = IO.IN(shapes, false); byId('data').value = JSON.stringify(data);
  });

  /*goo.event.addDomListener(byId('restore'), 'click', function(){
    if(this.shapes){
      for(var i=0;i<this.shapes.length;++i){
            this.shapes[i].setMap(null);
      }
    }
    this.shapes=IO.OUT(JSON.parse(byId('data').value),map_out);
  }); */

  google.maps.event.addListener(map_in, 'mousemove', function (event) {
    byId('latitude').value = event.latLng.lat();
    byId('longitude').value = event.latLng.lng();
  });

  cargarShapes();
}


var IO = {
  //returns array with storable google.maps.Overlay-definitions
  IN: function (arr,//array with google.maps.Overlays
    encoded//boolean indicating whether pathes should be stored encoded
  ) {
    var shapes = [],
      goo = google.maps,
      shape, tmp;

    for (var i = 0; i < arr.length; i++) {
      shape = arr[i];
      var color = shape.fillColor;
      tmp = { type: this.t_(shape.type), id: i, fillColor: color, customInfo: shape.customInfo, title: shape.title, tag: shape.tag };


      switch (tmp.type) {
        case 'CIRCLE':
          tmp.radius = shape.getRadius();
          tmp.geometry = this.p_(shape.getCenter());
          break;
        case 'MARKER':
          tmp.geometry = this.p_(shape.getPosition());
          break;
        case 'RECTANGLE':
          tmp.geometry = this.b_(shape.getBounds());
          break;
        case 'POLYLINE':
          tmp.geometry = this.l_(shape.getPath(), encoded);
          break;
        case 'POLYGON':
          tmp.geometry = this.m_(shape.getPaths(), encoded);

          break;
      }
      shapes.push(tmp);
    }


    return shapes;
  },
  //returns array with google.maps.Overlays
  OUT: function (arr,//array containg the stored shape-definitions
    map//map where to draw the shapes
  ) {
    var shapes = [],
      goo = google.maps,
      map = map || null,
      shape, tmp;

    for (var i = 0; i < arr.length; i++) {
      shape = arr[i];

      switch (shape.type) {
        case 'circle':
        case 'CIRCLE':
          tmp = new goo.Circle({ radius: Number(shape.radius), center: this.pp_.apply(this, shape.geometry), type: 'circle' });
          break;
        case 'MARKER':
          if (shape.geometry == undefined) {
            tmp = new goo.Marker({ position: shape.position, type: 'marker', icon: "img/rig.png", customInfo: shape.customInfo, title: shape.title });
          }
          else {
            tmp = new goo.Marker({ position: this.pp_.apply(this, shape.geometry), type: 'marker', icon: "img/rig.png", customInfo: shape.customInfo, title: shape.title });
          }
          break;
        case 'RECTANGLE':
          tmp = new goo.Rectangle({ bounds: this.bb_.apply(this, shape.geometry), type: 'rectangle' });
          break;
        case 'POLYLINE':
          tmp = new goo.Polyline({ path: this.ll_(shape.geometry), type: 'polyline' });
          break;
        case 'POLYGON':
          tmp = new goo.Polygon({ paths: this.mm_(shape.geometry), type: 'polygon', tag: shape.tag });
          break;
      }
      tmp.setValues({ map: map, id: shape.id, fillColor: shape.fillColor })
      shapes.push(tmp);
    }
    return shapes;
  },
  l_: function (path, e) {
    path = (path.getArray) ? path.getArray() : path;
    if (e) {
      return google.maps.geometry.encoding.encodePath(path);
    } else {
      var r = [];
      for (var i = 0; i < path.length; ++i) {
        r.push(this.p_(path[i]));
      }
      return r;
    }
  },
  ll_: function (path) {
    if (typeof path === 'string') {
      return google.maps.geometry.encoding.decodePath(path);
    }
    else {
      var r = [];
      for (var i = 0; i < path.length; ++i) {
        r.push(this.pp_.apply(this, path[i]));
      }
      return r;
    }
  },

  m_: function (paths, e) {
    var r = [];
    paths = (paths.getArray) ? paths.getArray() : paths;
    for (var i = 0; i < paths.length; ++i) {
      r.push(this.l_(paths[i], e));
    }
    return r;
  },
  mm_: function (paths) {
    var r = [];
    for (var i = 0; i < paths.length; ++i) {
      r.push(this.ll_.call(this, paths[i]));

    }
    return r;
  },
  p_: function (latLng) {
    return ([latLng.lat(), latLng.lng()]);
  },
  pp_: function (lat, lng) {
    return new google.maps.LatLng(lat, lng);
  },
  b_: function (bounds) {
    return ([this.p_(bounds.getSouthWest()),
    this.p_(bounds.getNorthEast())]);
  },
  bb_: function (sw, ne) {
    return new google.maps.LatLngBounds(this.pp_.apply(this, sw),
      this.pp_.apply(this, ne));
  },
  t_: function (s) {
    var t = ['CIRCLE', 'MARKER', 'RECTANGLE', 'POLYLINE', 'POLYGON', 'circle', 'marker', 'rectangle', 'polyline', 'polygon'];
    for (var i = 0; i < t.length; ++i) {
      if (s === google.maps.drawing.OverlayType[t[i]]) {
        return t[i];
      }
    }
  }
}

function Conversor(x, y) {
  var coordWGS84 = [];
  //GSJ
  var primera = '+proj=tmerc +lat_0=-90 +lon_0=-69 +k=1 +x_0=2500000 +y_0=0 +ellps=intl +towgs84=-232.57,6.66,173.93,0,0,0,0 +units=m +no_defs';
  //NQN
  //var primera='+proj=tmerc +lat_0=-90 +lon_0=-69 +k=1 +x_0=2500000 +y_0=0 +ellps=intl +towgs84=10.04,163.97,131.72,0,0,0,0 +units=m +no_defs';
  //ACA
  //var primera = '+proj=tmerc +lat_0=-90 +lon_0=-63 +k=1 +x_0=4500000 +y_0=0 +ellps=intl +towgs84=-148.00,136.00,90.00,0,0,0,0 +units=m +no_defs';
  var segunda = '+proj=longlat +datum=WGS84 +no_defs'

  coordWGS84 = proj4(primera, segunda, [x, y]);
  return new google.maps.LatLng(coordWGS84[1], coordWGS84[0]);
}

jQuery(document).ready(function () {

  jQuery("#insertar_pozo").bind("click", function () {
    //console.log("Click");

    var lat = document.getElementById('lat').value;
    var long = document.getElementById('long').value;
    var vp = document.getElementById('listaSolicitante').value
    //Conversor(lat,long);
    var nombrePozo = document.getElementById('name').value;
    var marker = new google.maps.Marker({
      position: Conversor(lat, long),   // -45.7775112,-68.7557955
      map: map_in,
      title: nombrePozo,
      icon: "img/rig.png",
      customInfo: "X: " + lat + "; Y: " + long + "<br>" + vp,
      type: 'marker'
    });

    /*var contentString = '<div id="content" style="width: 200px; height: 200px;"><h1>Overlay</h1></div>';
    var infowindow = new google.maps.InfoWindow({
        content: contentString
    });*/

    google.maps.event.addListener(marker, 'click', function () {
      selected_shape = marker;
      var nombrePozo = '<big><b>' + selected_shape.title + '</b></big>';
      nombrePozo = nombrePozo.concat('<br>');
      nombrePozo = nombrePozo.concat(selected_shape.customInfo);
      var infowindow = new google.maps.InfoWindow({
        content: nombrePozo
      });

      infowindow.open(map_in, selected_shape);
    });
    shapes.push(marker);

    marker.setMap(map_in);
    selected_shape = marker;

    for (var i = 0; i < shapes.length; i++) {
      shape = shapes[i];
      tmp = { type: IO.t_(shape.type), id: i };
      switch (tmp.type) {
        case 'RECTANGLE':
        case 'CIRCLE':
          var latLngA = new google.maps.LatLng(marker.position.lat(), marker.position.lng());
          var bounds = shape.getBounds();
          if (bounds.contains(latLngA)) {
            alert(shape.tag);
          }
          break;
        case 'POLYGON':
          if (google.maps.geometry.poly.containsLocation(marker.position, shape)) {
            marker.setValues({ customInfo: marker.customInfo + "<br> ZONA: " + shape.tag });
            alert(shape.tag);
          }
          break;
      }
    }
  });

  jQuery("#guardar").bind("click", function () {
    selected_shape.tag = document.getElementById('zoneName').value;
    document.getElementById('zoneName').value = " ";
    if (selected_shape) {
      selected_shape.set((selected_shape.type
        ===
        google.maps.drawing.OverlayType.MARKER
      ) ? 'draggable' : 'editable', false);
      selected_shape = null;
    }
    show_form(document.getElementById('datosZona'));
  });
});

google.maps.event.addDomListener(window, 'load', initialize);