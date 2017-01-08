'use strict';

const fs = require('fs');

function Util() {
}

Util.getDate = function (date, splitChar) {
    date = date || new Date();
    splitChar = splitChar || '';
    
    var year = date.getFullYear(),
        month = date.getMonth() + 1,
        day = date.getDate();
    
    if (month < 10) {
        month = '0' + month;
    }
    
    if (day < 10) {
        day = '0' + day;
    }
    
    return [
        year,
        month,
        day
    ].join(splitChar);
};

function LogParser(groupErrors) {
    this.errors = [];
    this.MAX_ERRORS = 10000;
    this.groupErrors = groupErrors;
}

LogParser.prototype.parse = function (filename, contents) {
    var errors = parseLog(filename, contents, this.groupErrors);
    
    errors.forEach((error) => {
        this.errors.push(error);
    });
    
    return this.errors.length;
};

LogParser.prototype.summary = function (config, jsonFormatter) {
    var templates = [];
    
    config.sandboxes.forEach((sb) => {
        var template = fs.readFileSync(config.summaryTemplate).toString();

        template.replace('${json-formatter}', jsonFormatter);
        template.replace('${serverName}', sb.name);
        template.replace('${logDate}', Util.getDate(new Date(), '/'));
        template.replace('${totalErrors}', this.errors.length);
        template.replace('${summaryJson}', this.errors.length);
        
        templates.push(template);
    });
    
    return templates;
};

function parseLog(filename, contents, groupErrors) {
    var errorRegex = /^\[([^\]]*)\]([^\|]*)\|([^\|]*)\|([^\|]*)\|([^\|]*)\|([^\|]*)\|(.*)$/gm,
        match,
        matches = [],
        errors = [],
        normalizedErrors = [],
        isQuotaFile = filename.indexOf('quota') === 0;

    do {
        match = errorRegex.exec(contents);

        if (match) {
            matches.push(match);
        }
    } while (match);

    matches.forEach((match) => {
        var website = match[4].trim(),
            pipeline = match[5].trim(),
            errorMessage = match[7].trim().replace(/\r/g, ''),
            sessionid = match[3].trim();

        if (website.substr(0, 6).toLowerCase() === 'sites-') {
            errors.push({
                index: match.index,
                match: match[0],
                errorDate:match[1],
                errorSource: match[2].trim(),
                sessionid: sessionid,
                website: website,
                controller: pipeline,
                errorMessage: errorMessage
            });
        } else {
            errors.push({
                index: match.index,
                match: match[0],
                errorDate: match[1],
                errorSource: match[2].trim(),
                sessionid: '',
                website: 'System',
                controller: '---',
                errorMessage: match[0]
            });
        };
    });

    errors.forEach((error, index) => {
        var start = error.index + error.match.length,
            length = 0;

        if ((index + 1) < errors.length) {
            length = errors[index + 1].index - start;
        } else {
            length = contents.length;
        };

        error.errorDetail = contents.substr(start, length).trim().replace(/\r$/g, '');
        var findErroMessage = /(?:.*? ){9}(.*)/.exec(error.errorMessage);
        error.errorKey = findErroMessage ? findErroMessage[1] : error.errorMessage;

        if (error.website === 'System') {
            var end = error.errorKey.search(/\[\d/);

            if (end > 0) {
                error.errorKey = error.errorKey.substring(0, end - 1);
            }
        }

        var isInternalQuotaError = error.errorKey.indexOf('(internal') > -1

        if (isQuotaFile && isInternalQuotaError) {
            delete errors[index];
        }

        errors = errors.filter(function (error) {
            return !!error;
        });

//        if (groupErrors) {
//            errors.forEach(function(e, index) {
//                var errorParts = e.errorKey ? e.errorKey.split(' ') : [];
//
//                for (var i = 0; i < errors.length; i++) {
//                    if (i !== index) {
//                        var differences = 0;
//                        var normalizedParts = errors[i].errorKey ? errors[i].errorKey.split(' ') : [];
//                        if (errorParts.length === normalizedParts.length) {
//                            for (var j = 0; j < errorParts.length; j++) {
//                                if (errorParts[j] !== normalizedParts[j]) {
//                                    differences++;
//                                }
//                            }
//
//                            if (differences === 1) {
//                                for (var k = 0; k < errorParts.length; k++) {
//                                    if (errorParts[k] !== normalizedParts[k]) {
//                                        errorParts[k] = '---';
//                                        normalizedParts[k] = '---';
//                                    }
//                                };
//                                e.errorKey = errorParts.join(' ');
//                                errors[i].errorKey = normalizedParts.join(' ');
//                            }
//                        }
//                    }
//                }
//            });
//        }

        return error;
    });
    
    return errors;
}

Util.File = require('./file');
Util.LogParser = LogParser;

module.exports = Util;