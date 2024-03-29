var request     = require('request'),
    phantom     = require('phantom'),
    u           = require('url');

var Scraper = function(url) {
    this.url           = unescape(url);
    this.minImageSize  = 10240/2;

    this.imageUrlRules = {
        'www.shopbop.com': this.shopBigBop,
        'images.urbanoutfitters.com': this.urbanTransformers
    };
    this.pageUrlRules  = {
        'm.asos.com': this.getAsosToUSFromUK
    };
};

Scraper.prototype.getMetaData = function() {
    var title = null;
    var description = null;
    var ogImage = null;
    var siteName = null;

    var metaElements = document.getElementsByTagName('meta');
    for (var i = 0; i < metaElements.length; i++) {
        // TODO: Break early?
        var element = metaElements[i];

        // Handle OpenGraph elements
        var property = element.getAttribute('property');
        console.log(property);
        if (property !== null) {
            switch(property) {
                case 'og:title':
                    title = element.getAttribute('content');
                    break;
                case 'og:description':
                    description = element.getAttribute('content');
                    break;
                case 'og:image':
                    ogImage = element.getAttribute('content');
                    break;
                case 'og:site_name':
                    siteName = element.getAttribute('content');
                    break;
            }
        }

        // Handle general meta information
        var name = element.getAttribute('name');
        if (name !== null) {
            switch(name) {
                case 'title':
                    title = title || element.getAttribute('content');
                    break;
                case 'description':
                    description = description || element.getAttribute('content');
                    break;
            }
        }
    }

    if (ogImage !== null) this.ogImage = ogImage;
    title = title || document.title;

    return {
        title: title,
        description: description,
        siteName: siteName,
        finalDestination: document.URL
    };
};

Scraper.prototype.getPrice = function() {
    var string = document.body.textContent;
    var regex = /(\$\s*[\d,]+\.\d+)|([\d,]+\.\d+\s*USD)/g;

    // Replace the element (string) or the regex that's used on per domain basis
    switch(window.location.hostname) {
        case 'www.gap.com':
        case 'bananarepublic.gap.com':
        case 'oldnavy.gap.com':
        case 'piperlime.gap.com':
        case 'athleta.gap.com':
            string = document.getElementById('addToBagContent').textContent;
            break;

        case 'www.jcrew.com':
            var stringElement = document.getElementById('product_details_form') || document.body;
            string = stringElement.textContent;
            break;

        default:
            break;
    }

    var matches = string.match(regex);
    if (matches === null) {
        return null;
    }
    // return first non-zero price
    for(var i = 0; i < matches.length; i++) {
        var price = matches[i];

        // clearn price
        price = price.replace(' ', '');
        price = price.replace(',', '');
        price = price.replace('$', '');
        price = price.replace('USD', '');
        price = price.replace('>', '');

        if (price > 0) {
            return price;
        }
    }
    return null;
};

Scraper.prototype.getPotentialImageUrls = function() {
    var imgElements = document.images;
    var imageUrls = Array.prototype.slice.call(imgElements).map(function(element) {
        return element.src;
    });

    switch(window.location.hostname) {
        case 'www.zara.com':
            var extraLargeImageElements = Array.prototype.slice.call(document.getElementsByClassName('pAuxMZoom'));
            var extraLargeImages = extraLargeImageElements.map(function(element) {
                return element.getAttribute('value');
            });
            imageUrls = imageUrls.concat(extraLargeImages);
            break;
        case 'www.neimanmarcus.com':
            var largeImage = document.getElementsByClassName('img-wrap')[0].getElementsByTagName('img')[0].dataset.zoomUrl;
            imageUrls.push(largeImage);
            break;

        default:
            break;
    }

    var aElements = document.links;
    var aUrls = Array.prototype.slice.call(aElements).map(function(element) {
        return element.href;
    });

    // Modified version of Gruber's regexp
    var regexp = /\b((?:https?:(?:\/{1,2}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/gi;

    var scriptElements = document.scripts;
    var scriptUrls = [];
    for (var i = 0; i < scriptElements.length; i++) {
        element = scriptElements[i];
        var urls = element.textContent.match(regexp);
        if (urls !== null) scriptUrls = scriptUrls.concat(urls);
    }

    var urls = [].concat(imageUrls, aUrls, scriptUrls);
    urls.push(this.ogImage);
    urls = urls.filter(function(e) { return e ? true : false; });
    return urls;
};

Scraper.prototype.getImage = function(images, callback) {
    // This can be a single pass if integrated with line 134
    images = this.uniqueArray(images);
    var biggestSize = this.minImageSize;
    var biggestImage = null;
    var alternateImages = [];
    var count = images.length;
    var scraper = this;

    if (!count) {
        callback(biggestImage, alternateImages);
        return;
    }

    images.forEach(function(image) {
        scraper.getImageSize(image, function(url, size) {
            if (size > scraper.minImageSize) {
                if (size > biggestSize) {
                    if (biggestImage !== null) {
                        alternateImages.push({url: biggestImage, size: biggestSize});
                    }
                    biggestSize = size;
                    biggestImage = url;
                } else {
                    alternateImages.push({url: url, size: size});
                }
            }
            if (!--count) {
                callback(biggestImage, scraper.convertToSortedUrlsArray(alternateImages));
            }
        });
    });
};

Scraper.prototype.getImageSize = function(imageUrl, callback) {
    var options = this.getRequestOptions(imageUrl);
    var parsedUrl = u.parse(options.url);
    var host = parsedUrl.host;

    if (typeof host === 'undefined') {
        callback(imageUrl, -1);
        return;
    }
    if (parsedUrl.protocol != 'http:' && parsedUrl.protol != 'https:') {
        callback(imageUrl, -2);
        return;
    }

    console.log('Attempting Content-Length for', imageUrl);
    request(options, function (error, response, body) {
        if (error || response.statusCode != 200) {
            callback(imageUrl, -1);
            console.log('Error requesting', imageUrl);
            return;
        }
        if (typeof response.headers['content-type'] !== 'undefined' && response.headers['content-type'].substr(0, 5) != 'image') {
            callback(imageUrl, -1);
            return;
        }
        var range = response.headers['content-length'];
        var size = parseInt(range, 10);
        callback(imageUrl, size);
    });
};

Scraper.prototype.getRequestOptions = function(url) {
    // Uses the host of the page URL and not that of the image URL
    var host = u.parse(this.url).host;

    var methodRules = {
        'm.shopbop.com': 'GET',
        'www.shopbop.com': 'GET'
    };

    var method = methodRules[host] || 'HEAD';

    // Setting up the options
    var options = {
        url: url,
        method: method,
        timeout: 2000
    };

    return options;
};

Scraper.prototype.convertToSortedUrlsArray = function(alternateImages) {
    alternateImages.sort(function(a, b) {
        return a.size > b.size ? (a.size == b.size ? 0 : -1) : 1;
    });
    var imageUrls = [];

    var count = alternateImages.length;
    for(var i = 0; i < count; i++) {
        imageUrls.push(alternateImages[i].url);
    }
    return imageUrls;
};

Scraper.prototype.uniqueArray = function(a) {
    var seen = {};
    var b = [];
    for (var i = 0, l = a.length; i < l; i++) {
        if (seen.hasOwnProperty(a[i])) {
            continue;
        }
        b.push(a[i]);
        seen[a[i]] = true;
    }
    return b;
};

Scraper.prototype.getData = function(callback) {
    var scraper = this;
    phantom.create('--load-images=no', function(ph) {
        ph.createPage(function(page) {
            page.set('onConsoleMessage', function(msg) {
                // console.log(msg);
            });
            page.open(scraper.applyUrlRules(scraper.url, 'page'), function(status) {
                if (status == 'fail') {
                    callback({
                        'status': 'error'
                    });
                    // Exit PhantomJS
                    ph.exit();
                    return;
                }

                var semaphore = 3;
                var callbackMetaData;
                var callbackPrice;
                var callbackImage;
                var callbackAlternateImages;

                var sendCallback = function() {
                    if (!--semaphore) {
                        callback({
                            status: 'ok',
                            title: callbackMetaData.title,
                            description: callbackMetaData.description,
                            image: callbackImage,
                            alternateImages: callbackAlternateImages,
                            price: callbackPrice,
                            siteName: callbackMetaData.siteName,
                            finalDestination: callbackMetaData.finalDestination
                        });
                        // Exit PhantomJS
                        ph.exit();
                    }
                }

                // Get title, description and the OpenGraph image
                page.evaluate(scraper.getMetaData, function(metaData) {
                    callbackMetaData = metaData;
                    sendCallback();
                });
                // Get price
                page.evaluate(scraper.getPrice, function(price) {
                    callbackPrice = price;
                    sendCallback();
                });
                // Get images
                page.evaluate(scraper.getPotentialImageUrls, function(potentialImageUrls) {
                    scraper.getImage(potentialImageUrls, function(image, alternateImages) {
                        callbackImage = image;
                        callbackAlternateImages = alternateImages;
                        sendCallback();
                    });
                });
            });
        });
    });
};

Scraper.prototype.applyUrlRules = function(url, type) {
    var rules;
    if (type == 'page') {
        rules = this.pageUrlRules;
    } else if (type == 'image') {
        rules = this.imageUrlRules;
    }
    // Host of requested page
    var host = u.parse(this.url).host;
    rule = rules[host];
    return rule ? rule(url) : url;
};

Scraper.prototype.getAsosToUSFromUK = function(url) {
    url = url.replace('http://m.asos.com/mt/www.asos.com/countryid/2/', 'http://m.asos.com/mt/www.asos.com/');
    url = url.replace('http://m.asos.com/mt/www.asos.com/', 'http://m.asos.com/mt/www.asos.com/countryid/2/');
    return url;
};

Scraper.prototype.urbanTransformers = function(url) {
    var hackedUrl = url.replace('$cat$', '$zoom$');
    hackedUrl = hackedUrl.replace('$detailthumb$', '$zoom$');
    return hackedUrl;
};

Scraper.prototype.shopBigBop = function(url) {
    return url.replace('p1_1-0_254x500.jpg', 'q1_1-0.jpg');
};

exports.scraper = Scraper;
