/*
Copyright 2015 Dave Dunkin

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

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
