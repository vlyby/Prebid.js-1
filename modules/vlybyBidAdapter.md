# Overview

```
Module Name: Vlyby Bidder Adapter
Module Type: Bidder Adapter
Maintainer: support@vlyby.com
```

# Description

Module to use the Vlyby Player with prebid.js

# Test Parameters
```
    var adUnits = [
           {
                code: "test-div-1", //slot div id
                sizes: [[300, 250]],
                bids: [{
                   bidder: "vlyby",
                   params: {
                       placementId: 'Default',
                       pubId: 'f363eb2b75459b34592cc4'
                   }
                }]
           }
       ];
```
