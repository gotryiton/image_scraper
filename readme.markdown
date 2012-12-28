Scraper
=======

- **Image:** Picks the biggest image by file size on the page
- **Title:** OG title else title in meta tags else HTML title
- **Description:** OG description else meta description
- **Price:** Picks non-zero dollar price that matches regular expression
- **Site Name:** OG *site_name*

***Note:** Image selection takes consideration of OG image.*

Extensions
----------
- Custom user agent can be defined for PhantomJS (see their [API documentation](https://github.com/ariya/phantomjs/wiki/API-Reference) and use it in conjucation with the [NodeJS library for PhatomJS](https://github.com/sgentle/phantomjs-node).).
- Custom `element` to look for price can be specified based on domain. (See function `getPrice`.)
- Custom URL transformations (eg. from mobile to desktop) can be specified. (See functions `applyUrlRules`, `getAsosToUSFromUK`, `urbanTransformers`, `shopBigBop`.)

In general custom rules in all aspects can be specified very easily.

Limitations
-----------
PhantomJS doesn't handle refresh headers in this current version.

Pre-Requisites
--------------
 1. Install `node.js` and `npm`.
 2. Install `phantom.js` which is a head-less browser used for parsing.

Install Guide
-------------
After cloning the repo you will want to run

    npm install

Also make sure you have installed `phantom.js`.

    brew install phantomjs


Running the Server
------------------
To install the up server

	npm install -g up

From the project root directory run

	NODE_ENV=development
	up server.js

which will bring up the server on `http://localhost:3000/` and listen to post requests for the variable `url` on `http://localhost:3000/scraper` for the webpage address.

Alternatively, you can set the `NODE_ENV` variable in you bash or zsh rc so that all you have to do is run

	up server.js

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
        'description': 'Just another skirt.',
		'price': 10
        'image': 'http://path/to/biggest/image',
        'alternateImages': [
            'http://foo/bar',
            'http://for/bar/baz'
        ],
		'siteName': null,
        ‘finalDestination’: ‘http://final/redirect/url’
    }

when fetching the URL doesn't cause errors. And when it does the response would be

    {
        'status': 'error'
    }