'use strict';

var LogParser = require('./util').LogParser;
var File = require('./util').File;

const fs = require('fs');
const path = require('path');

module.exports = function (config) {
    var logParser = new LogParser(config.groupErrors);
    
    config.sandboxes.forEach((sb) => {
        var dirPath = path.join(process.cwd(), config.output, sb.name),
            files = fs.readdirSync(dirPath);
        
        files.forEach((file) => {
            if (config.ignoreFiles.indexOf(file) < 0) {
                console.log('Analyze... ', file);
            
                var fileData = fs.readFileSync(
                    path.join(dirPath, file),
                    {
                        encoding: 'utf8'
                    }
                );

                logParser.parse(file, fileData);
            }
        });
        
        fs.readFile(config.template, 'utf-8', (err, format) => {
            var summaries = logParser.summary(config, format);
            
            summaries.forEach((summary) => {
                var fileInstace = new File('summary.html', path.join(config.output, sb.name), summary);
        
                fileInstace.writeSync();
                fileInstace.destroy();
            });
        });
        
        var file = new File('summary.json', path.join(config.output, sb.name), JSON.stringify(logParser.errors));
        
        file.writeSync();
        file.destroy();
    });
};