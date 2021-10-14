let Parser = require('rss-parser');
let parser = new Parser();

(async () => {
    const url = 'https://www.econlib.org/feed/main';
    let feed = await parser.parseURL(url);
    console.log(feed.title);

    feed.items.forEach(item => {
      console.log(item.title)
    });

    console.log(feed.items.length)


})();
