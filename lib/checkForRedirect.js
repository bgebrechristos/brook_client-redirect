//var cheerio = require("cheerio");
var URL = require("url");
var chalk = require("chalk");
var prompt = require("prompt");
var request = require("request");
var ProgressBar = require("progress");


var counter = 0;
var re = /setTimeout\(\"window\.location\.replace\(['|"](.*)['|"]\)/g;

module.exports = function (urls, creds) {
	return new Promise(function(resolve, reject) {
		var auths = { auth : creds };
		var links = [];
		
		var count = urls.length;
		
		console.log(chalk.blue("Loading urls for testing ....."));
	
		var bar = new ProgressBar("Evaluating ... [:bar] :percent :etas", {
			complete: "=",
			incomplete: " ",
			width: 30,
			total: urls.length,
			stream: process.stderr
		});
		
		urls.forEach(function(url) {
			var obj = {
			source : url,
			};
			//results will have sereverSide: value , clientSide : "boolean", clientValue: value
			request(url, auths, function(err, res, html) {
				if(err) return reject(err);
                var re = /setTimeout.*replace\(['|"](.*)['|"]\)['|"]/.exec(html);
                if (re && re.length > 1) {
					obj.clientRedirect = true;
					obj.redirectValue = URL.resolve(url, re[1]);
				} else {
					obj.clientRedirect = false;
				}
				count --;
				bar.tick();
				links.push(obj);
				
				if (count === 0) {
					resolve(links);
				}
			});
		});	
	});
	
}; //end of checkForredirect