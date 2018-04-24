var selected_shape = null
var map_in;
var shapes = [];
function initialize() {
  map_in = new google.maps.Map(document.getElementById('map_in'),
    {
      zoom: 8,
      center: new google.maps.LatLng(-45.7775112, -68.7557955),
      mapTypeId: 'terrain'
    });
  var goo = google.maps,

    /*map_out         = new goo.Map(document.getElementById('map_out'),
                                  { zoom: 8,
                                    center: new goo.LatLng(-45.7775112,-68.7557955),
                                    mapTypeId: 'terrain'
                                  }),*/

    drawman = new goo.drawing.DrawingManager({ map: map_in, markerOptions: { icon: "rig.png" } }),
    byId = function (s) { return document.getElementById(s) },
    clearSelection = function () {
      if (selected_shape) {
        selected_shape.set((selected_shape.type
          ===
          google.maps.drawing.OverlayType.MARKER
        ) ? 'draggable' : 'editable', false);
        selected_shape = null;
      }
    },
    setSelection = function (shape) {
      clearSelection();
      selected_shape = shape;

      selected_shape.set((selected_shape.type
        ===
        google.maps.drawing.OverlayType.MARKER
      ) ? 'draggable' : 'editable', true);

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
          alert(bounds.contains(latLngA));
          break;
        case 'POLYGON':
          var resultColor = google.maps.geometry.poly.containsLocation(e.position, shape) ? 'red' : 'green';
          alert(resultColor);
          break;
      }
    }
  });

  function attachPolygonInfoWindow(polygon) {
    var infoWindow = new google.maps.InfoWindow();
    google.maps.event.addListener(polygon, 'rightclick', function (e) {
      content = polygon.tag;
      //infoWindow.setContent(tag);
      infoWindow.setContent(content);
      var latLng = e.latLng;
      infoWindow.setPosition(latLng);
      infoWindow.open(map_in);
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
      case 'polygon':
        var t = $('#custom').spectrum("get");
        shape.setOptions({ fillColor: t.toHexString() });
        attachPolygonInfoWindow(shape);
        break;
    }
    goo.event.addListener(shape, 'click', function () {
      setSelection(this);
    });
    //setSelection(shape);
    shapes.push(shape);
  });

  goo.event.addListener(map_in, 'click', clearSelection);

  goo.event.addDomListener(byId('clear_shapes'), 'click', clearShapes);

  goo.event.addDomListener(byId('save_encoded'), 'click', function () {
    var data = IO.IN(shapes, true); byId('data').value = JSON.stringify(data);
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
  });*/
  google.maps.event.addListener(map_in, 'mousemove', function (event) {
    byId('latitude').value = event.latLng.lat();
    byId('longitude').value = event.latLng.lng();
  });
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
      tmp = { type: this.t_(shape.type), id: i, fillColor: color };


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
        case 'CIRCLE':
          tmp = new goo.Circle({ radius: Number(shape.radius), center: this.pp_.apply(this, shape.geometry) });
          break;
        case 'MARKER':
          tmp = new goo.Marker({ position: this.pp_.apply(this, shape.geometry) });
          break;
        case 'RECTANGLE':
          tmp = new goo.Rectangle({ bounds: this.bb_.apply(this, shape.geometry) });
          break;
        case 'POLYLINE':
          tmp = new goo.Polyline({ path: this.ll_(shape.geometry) });
          break;
        case 'POLYGON':
          tmp = new goo.Polygon({ paths: this.mm_(shape.geometry) });

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
    var t = ['CIRCLE', 'MARKER', 'RECTANGLE', 'POLYLINE', 'POLYGON'];
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
    //Conversor(lat,long);
    var nombrePozo = document.getElementById('name').value;
    var marker = new google.maps.Marker({
      position: Conversor(lat, long),   // -45.7775112,-68.7557955
      map: map_in,
      title: nombrePozo,
      icon: "rig.png"
    });

    /*var contentString = '<div id="content" style="width: 200px; height: 200px;"><h1>Overlay</h1></div>';
    var infowindow = new google.maps.InfoWindow({
        content: contentString
    });*/

    google.maps.event.addListener(marker, 'click', function () {
      selected_shape = marker;
    });
    shapes.push(marker);

    // To add the marker to the map, call setMap();
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
          alert(bounds.contains(latLngA));
          break;
        case 'POLYGON':
          var resultColor = google.maps.geometry.poly.containsLocation(marker.position, shape) ? 'red' : 'green';
          alert(resultColor);
          break;
      }
    }
  });
});

google.maps.event.addDomListener(window, 'load', initialize);
