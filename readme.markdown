Scraper
=======
Image: Picks Facebook Open Graph Protocol (OG) image. If that isn't available it picks out the largest image on the page.
Title: OG title else title in meta tags else HTML title
Description: OG description else meta description

Pre-Requisites
--------------
 1. Install `node.js` and `npm`.
 2. Install `libxml2` which is used for parsing.

Install Guide
-------------
After cloning the repo you will want to run

    npm install

from the root directory of the project to install all dependencies. Then:

    npm install -g up

To install the up server.

Running the Server
------------------
From the project root directory run

    NODE_ENV=development up server.js

which will bring up the server on `http://localhost:3000/` and listen to post requests for the variable `url` on `http://localhost:3000/scraper` for the webpage address.

Alternatively, you can set the NODE_ENV variable in you bash or zsh rc so that all you have to do is run:

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
        'description': null,
        'image': 'http://path/to/biggest/image',
        'potentialImages': [
            'http://foo/bar',
            'http://for/bar/baz'
        ]
    }

when fetching the URL doesn't cause errors. And when it does the response would be

    {
        'status': 'error'
    }