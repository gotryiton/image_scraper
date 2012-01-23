Image Scraper
=============

Node.js server written to pick Facebook Open Graph Protocol image. If that isn't available it picks out the largest image on the page.

Pre-Requisites
--------------

 1. Install `node.js` and `npm`.
 2. Uses `libxml2` for parsing so you need this installed on the server.
 3. Needs `Image Magic` for figuring out image size and image type.

Install Guide
-------------

After cloning the repo you will want to run

    npm install

from the root directory of the project to install all dependencies.

Running the Server
------------------

From the project root directory run

    node server.js

which will bring up the server on `http://localhost:1337/` and listen to post requests for the variable `url` on `http://localhost:1337/biggest-image` for the webpage address.