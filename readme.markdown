Image Scraper
=====
Node.js server written to pick Facebook Open Graph Protocol image. If that isn't available it picks out the largest image on the page.

Install Guide
=====

Makes sure you have `node.js` and `npm` installed beforehand.

After cloning the repo you will want to run

    npm install

to install all dependencies.

Running the Server
-----

From the project directory run

    node biggest_image.js

which will bring up the server on `http://localhost:1337/` and listen to post requests for the variable `url` on `http://localhost:1337/biggest-image` for the webpage address.