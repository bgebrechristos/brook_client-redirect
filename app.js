var request = require("request");
var chalk = require("chalk");
var fs = require("fs");
var program = require("commander");
var prompt = require("prompt");
var cheerio = require("cheerio");
var URL = require("url");
var ProgressBar = require("progress");
var terminal = require("./terminal.js");

program
	.usage('\<[options] file\>')
	.option('-F, --file <item>', 'Path to a file, containing a newline separated list of URLs')
	.parse(process.argv);


var AUTH_PROMPT = {
	properties : {
		user : { description: "Username:".blue, required: true },
		pass : { description : "Password:".blue, required:true, hidden:true }
	}
};

var counter = 0;
var re = /setTimeout\(\"?window\.location\.replace\([\'*|\"*](.*)[\'*|\"*]\)/g;


if (process.argv.length <= 2) {
	print(chalk.red("Come on really? You have to enter atleast one option"));
	program.help();
	program.exit();
} else {
	if(program.file) {
		getFileContent(program.file).then(function(lines) {
			return checkForAuth(lines);
		}, function(err) {
			if(err.message.indexOf("ENOENT") > -1) {
				error("File not found, get it together :) !");
			} else {
				error(err.message);
			}
		}).then(function(links) {
			//console.log(JSON.stringify(links, null, 4));
			terminal.output(links);
		});
		
	} //end of program.file if
	
} //close main else


function getFileContent(file) {
	return new Promise(function(resolve, reject) {
		fs.readFile(file, function(err, listOfLines) {
			if (err){
				reject(err);
			} else {
				var lines = listOfLines.toString().split('\n').map(function(item) {
					return item.trim();
				}).filter(function(item) {
					return item.length;
				});
				resolve(lines);
			}
		})
	}); //end of Promise
}// end of getFileContent

function checkForAuth(urls) {
	return new Promise(function(resolve, reject) {
		request(urls[0], function(err, res) {
			if(err) return reject(err);
			if(res.statusCode === 401) {
				promptForAuth(urls[0]).then(function(creds) {
					return checkForRedirect(urls, creds);
				}, function(err) {
					return reject(err);
				}).then(function(links) {
					resolve(links);
				});  
			} else {
				checkForRedirect(urls, null).then(function(links) {
					resolve(links);
				}, function(err) {
					reject(err);
				});
			}
		});
	});
	
}//end of checkForAuth


function promptForAuth(url) {
	return new Promise(function(resolve, reject) {
		prompt.start();
		prompt.message = null;
		prompt.delimiter = "";
		prompt.get(AUTH_PROMPT, function(err, creds) {
			if (err) return reject(err);
			request(url, { auth: creds }, function (err, res) {
				if(err) return reject(err);
				if(res.statusCode !== 401) {
					resolve(creds);
				} else {
					counter ++;
					if(counter < 3) {
						error("Invalid credential, please try again");
						promptForAuth(url);
					} else {
						counter = 0;
						error(chalk.red("Please check if you have access to this server, exiting app! "));
						process.exit(0);
					}
				}
			});
		});
	});
} //end of promptForAuth


function checkForRedirect(urls, creds) {
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
				var $ = cheerio.load(html);
				var script = $('script').text();
				script.replace(re, "$1");
				if(script.match(re)) {
					obj.clientRedirect = true;
					obj.redirectValue = URL.resolve(url, RegExp.$1);
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
	
} //end of checkForredirect

function print(msg) {
	console.log(msg);
}

function error(msg) {
	console.log(chalk.red(msg));
}
