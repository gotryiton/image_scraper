var sm = require('../scraper');

var sites = [
  'http://m.asos.com/mt/www.asos.com/ASOS/ASOS-Block-Colour-Cagoule/Prod/pgeproduct.aspx?iid=1919877&cid=3606&sh=0&pge=0&pgesize=12&sort=-1&clr=Blue',
  'http://m.shopbop.com/crop-skinny-jeans-7-all/vp/v=1/845524441933256.htm?folderID=2534374302064814&fm=other-shopbysize&colorId=11318',
  'http://www.zara.com/webapp/wcs/stores/servlet/product/us/en/zara-us-S2012/189506/672107/FADED%2BGREY%2BTROUSERS',
  'http://m.nordstrom.com/Product/Details/3209958?categoryid=6023607',
  'http://www.charmandchain.com/products/large-gold-hammered-teardrop-earrings'
];

var expectedResponses = [
  {'title': 'ASOS Block Colour Cagoule', 'image': 'http://images.asos.com/inv/media/7/7/8/9/1919877/blue/image1xl.jpg', 'description': null},
  {'title': '7 For All Mankind Cropped Skinny Jeans | SHOPBOP', 'image': 'http://g-ecx.images-amazon.com/images/G/01/Shopbop/p/pcs/products/seven/seven4015611318/seven4015611318_p4_1-0_254x500.jpg', 'descripiton': '7 For All Mankind Cropped Skinny Jeans at SHOPBOP.COM - FASTEST FREE SHIPPING WORLDWIDE. Buy 7 For All Mankind Online'},
  {'title': 'FADED GREY TROUSERS - Jeans - Woman - ZARA United States', 'image': 'http://static.zara.net/photos//2012/V/0/1/p/6045/042/804/6045042804_1_1_3.jpg?timestamp=1328289461558', 'descripiton': 'FADED GREY TROUSERS'},
  {'title': 'DKNY \'Sunny Escape\' Leggings | Nordstrom', 'image': 'http://g-lvl3.nordstromimage.com/ImageGallery/store/product/Medium/9/_6821389.jpg', 'descripiton': 'DKNY \'Sunny Escape\' Leggings | Nordstrom'},
  {'title': 'Large Gold Hammered Teardrop Earrings by Kenneth Jay Lane | Charm & Chain', 'image': 'http://cdn.shopify.com/s/files/1/0019/0222/products/IMG_0126_medium.jpg?106717', 'descripiton': 'Large Gold Hammered Teardrop Earrings: Thereâ€™s...'}
];

exports['test-mobile-sites'] = function(test) {
  var count = sites.length;
  sites.forEach(function(site, index) {
    var sc = new sm.scraper(site);
    sc.getData(function(data) {
      var expectedResponse = expectedResponses[index];
      test.equals(data['title'], expectedResponse['title']);
      test.equals(data['image'], expectedResponse['image']);
      // test.equals(data['descripiton'], expectedResponse['descripiton']);
      count--;
      if (count == 0) {
        test.done();
      }
    });
  });
};