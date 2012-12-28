Scraper
=======
Image: Picks the biggest image in size on the page
Title: OG title else title in meta tags else HTML title
Description: OG description else meta description

***Note:** Image selection takes consideration of OG image.*

Pre-Requisites
--------------
 1. Install `node.js` and `npm`.
 2. Install `phantom.js` which is a head-less browser used for parsing.

Install Guide
-------------
After cloning the repo you will want to run

    npm install

Also make sure you have installed `phantom.js`.

Testing
-------
For testing you would need to install `nodeunit` which is a part of `devDependencies`. To access `nodeunit` from the shell you can download from [source](https://github.com/caolan/nodeunit) and `make && sudo make install`.

To run tests simply point `nodeunit` to the test file.

    nodeunit ./test/test-scraper.js

Response
--------
Sample response would look like

    {
        'status': 'ok',
        'title': 'Black skirt - GAP',
        'description': null,
        'image': 'http://path/to/biggest/image',
        'alternateImages': [
            'http://foo/bar',
            'http://for/bar/baz'
        ],
        ‘finalDestination’: ‘http://final/redirect/url’
    }

when fetching the URL doesn't cause errors. And when it does the response would be

    {
        'status': 'error'
    }