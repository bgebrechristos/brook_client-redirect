var chalk = require('chalk');
var colors = require("colors");

exports.output = function (links) {
	var count = links.length;
	var placeHolder =[];
	console.log(("-------------------RESULT-------------------\t").inverse);
	links.forEach(function(item) {
		if (item.clientRedirect === true) {
			console.log("\tPage --> " + chalk.bold.red(item.source) + " has a client-side redirect");
			console.log("\tRidrects to --> " + item.redirectValue);
		} else {		
			count --;
			placeHolder.push(item.source);
			 if (count === 1) {
				console.log("---------------------------------------");
				console.log(chalk.blue("\tNo client-side redirect(s) found for the following page(s):"));
				
				console.log("\t" + placeHolder.toString().split(',').join('\n\t'));
			 }
		}
	});
};
