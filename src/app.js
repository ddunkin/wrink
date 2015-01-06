var UI = require('ui');
var ajax = require('ajax');
var Settings = require('settings');

Settings.config({
  url: 'https://ddunkin.github.io/wrink/config.html'
  },
  function(e) {
    console.log('Got config: ' + JSON.stringify(e.options));
    if (e.failed) {
      console.log(e.response);
    }
  }
);

var accessToken = Settings.option('accessToken');
if (!accessToken) {
  var loadingCard = new UI.Card({
    title: 'Sign In',
    body: 'Please sign in to Wink in the app settings.'
  });
  loadingCard.show();
} else {
  var loadingCard = new UI.Card({
    title: 'Wrink',
    subtitle: 'Wink on your wrist',
    body: 'Loading...'
  });
  loadingCard.show();
  
  var deviceData = null;
  var authHeaders = { 'Authorization': 'Bearer ' + accessToken};

  var deviceMenu = new UI.Menu();
  deviceMenu.on('select', function(e) {
    console.log('Selected item #' + e.itemIndex + ' of section #' + e.sectionIndex);
  
    var deviceIndex = e.itemIndex;
    var device = deviceData[deviceIndex];
    console.log(JSON.stringify(device));
//     if (device.object_type == 'light_bulb') {
    if (device.light_bulb_id) {
      var itemMenu = new UI.Menu({
        sections: [{
          title: device.name,
          items: [{
            title: 'High',
          }, {
            title: 'Medium',
          }, {
            title: 'Low',
          }, {
            title: 'Off',
          }]
        }]
      });
      itemMenu.on('select', function(e) {
        ajax({
          url: 'https://winkapi.quirky.com/light_bulbs/' + device.light_bulb_id,
          method: 'put',
          type: 'json',
          headers: authHeaders,
          data: {
            "nonce": (Math.random() * 1000000000).toString(),
            "desired_state": {
              "powered": e.itemIndex != 3,
              "powered_updated_at": Date.now(),
              "brightness": e.itemIndex === 0 ? 1 :
              e.itemIndex == 1 ? 0.4 :
              e.itemIndex == 2 ? 0 :
              1
            }
          }
        },
        function(data) {
          console.log(JSON.stringify(data));
          // update our device data
          device = data.data;
          if (device) {
            deviceData[deviceIndex] = device;
          }
        },
        function(error) {
          var errorCard = new UI.Card({
            title: 'Error',
            body: error
          });
          errorCard.show();
        });
      });
      itemMenu.show();
    }
  });
  
  // load device data
  ajax({
      url: 'https://winkapi.quirky.com/users/me/wink_devices',
      type: 'json',
      headers: authHeaders
    },
    function(data) {
      console.log('Got device data');
      
      deviceData = data.data;
          
      loadingCard.hide();
  
      var section = {
        title: 'Wink Devices',
        items: deviceData.map(function(obj) {
          return { title: obj.name };
        })
      };
      deviceMenu.section(0, section);
      deviceMenu.show();
    },
    function(error) {
      console.log('Error getting device data: ' + error);
      
      loadingCard.hide();
      
      var errorCard = new UI.Card({
        title: 'Error',
        body: error
      });
      errorCard.show();
    }
  );
}
