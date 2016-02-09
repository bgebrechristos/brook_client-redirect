var request = require("request");
var cheerio = require("cheerio");
var URL = require("url");


//setTimeout("window.location.replace('/iphone/')",0)

var re = /setTimeout\(\"?window\.location\.replace\([\'*|\"*](.*)[\'*|\"*]\)/g;


 
request('https://www.apple.com/', function(err, res, html) {
	if(err) {
		console.log(err);
	} else {
		var $ = cheerio.load(html);
		var script = $('script').text();
		console.log(script.match(re));
 		script.replace(re, "$1");
		console.log("------");
		console.log(URL.resolve("http://www.apple.com", RegExp.$1));
		
	}	
});


