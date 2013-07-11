#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var rest = require('restler');
var program = require('commander');
var cheerio = require('cheerio');
var HTMLFILE_DEFAULT = "not-provided";
var HTMLURL_DEFAULT = "not-provided";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var assertUrlValid = function(url) {
	var urlStr = url.toString();
	var re = /^http/;
	if(!urlStr.match(re)) {
		concole.log("%s is not a valid URL. Exiting.", urlStr);
		process.exit(1);
	}
	return urlStr;
}

var buildfn = function(checkFile) {
    var response2console = function(result, response) {
        if (result instanceof Error) {
            console.error('Error: ' + util.format(response.message));
        } else {
			//console.error("Wrote to file: temp");
			fs.writeFileSync("temp", result);
    		var checkJson = checkHtmlFile("temp", checkFile);
    		var outJson = JSON.stringify(checkJson, null, 4);
    		console.log(outJson);
        }
    };
    return response2console;
};

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile) {
    $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

if(require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
        .option('-u, --url <URL>', 'URL to index.html', clone(assertUrlValid), HTMLURL_DEFAULT)
        .parse(process.argv);
	
	if(program.file == "not-provided" && program.url == "not-provided") {
		console.log("Either file or url needs to be provided");
		process.exit(1);
	} else if(program.file != "not-provided") {
    	var checkJson = checkHtmlFile(program.file, program.checks);
    	var outJson = JSON.stringify(checkJson, null, 4);
    	console.log(outJson);
	} else {
		rest.get(program.url).on("complete", buildfn(program.checks));
	}
} else {
    exports.checkHtmlFile = checkHtmlFile;
}
