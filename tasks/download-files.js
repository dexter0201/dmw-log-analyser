'use strict';

const https = require('https');
const util = require('./util');
const fs = require('fs');
const path = require('path');

module.exports = function (config, callback) {
    var dateFilter = util.getDate(new Date());
    
    config.sandboxes.forEach((sb) => {
        https.get({
            rejectUnauthorized: false,
            host: sb.url,
            path: config.logPath,
            auth: sb.username + ':' + sb.password
        }, (res) => {
            var result = '';
            
            res.on('data', (data) => {
                result += data;
            });
            
            res.on('end', () => {
                if (result.indexOf(config.serverCodes['401']) > -1) {
                    throw new Error(config.serverCodes['401']);
                }
                
                var fileEntries = [],
                    regx = /a href="[^"]*\/([a-z\-]*error[a-z0-9\-]+\.log|quota-blade[a-z0-9\-]+\.log)"[\s\S]+?([0-9\.]+) kb/g,
                    matches = [],
                    match;
                
                do {
                    match = regx.exec(result);
                    
                    if (match) {
                        matches.push(match);
                    }
                } while (match);
                
                matches.forEach((match) => {
                    var filename = match[1];
                    
                    if (filename.indexOf(dateFilter) > -1) {
                        fileEntries.push({
                            name: filename,
                            size: parseFloat(match[2])
                        });
                    }
                });
                
                fileEntries.forEach((file) => {
                    getErrorLog(file.name, sb, (data) => {
                        console.log('Writing log... ', file.name);
                        var fileInstance = new util.File(file.name, path.join(config.output, sb.name), data);
                        
                        fileInstance.writeSync();
                        fileInstance.destroy();
                    });
                });
                
                callback = callback || function () {};
                callback(fileEntries);
            });
        }).on('error', (e) => {
            console.log('error: ', e);
        });
    });
    
    function getErrorLog(filename, sb, callback) {
        https.get({
            rejectUnauthorized: false,
            host: sb.url,
            path: config.logPath + '/' + filename,
            auth: sb.username + ':' + sb.password
        }, (res) => {
            var rs = '';
            
            res.on('data', (data) => {
                rs += data;
            });
            
            res.on('end', () => {
                callback(rs);
            });
        }).on('error', (e) => {
            console.log(e);
            callback(e);
        });
    }
};