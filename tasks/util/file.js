'use strict';

const fs = require('fs');
const path = require('path');

function File(filename, fileDir, data) {
    if (!filename || !fileDir) {
        throw new Error('Cannot create File instance without filename && filedir');
    }
    
    this.filename = filename;
    this.fileDir = fileDir;
    this.format = 'utf8';
    this.data = data || '';
}

File.prototype.destroy = function () {
    this.data = null;
    this.filename = null;
    this.fileDir = null;
    this.format = null;
};

File.prototype.readSync = function () {
    try {
        this.data = fs.readFilesync(path.join(process.cwd(), this.fileDir, this.filename));
        
        return this.data;
    } catch (e) {
        throw new Error(e);
    }
};

File.prototype.read = function (options, callback) {
    options = options || options;
    callback = callback || function () {};
    
    try {
        this.data = fs.readFile(
            path.join(process.cwd(), this.fileDir, this.filename),
            options.format || this.format, callback.bind(null)
        );
    } catch (e) {
        throw new Error(e);
    }
};

File.prototype.write = function (options) {
    options = options || {};
    
    // @TODO: implement
};

File.prototype.writeSync = function () {
    try {
        fs.writeFileSync(path.join(process.cwd(), this.fileDir, this.filename), this.data || '');
    } catch (e) {
        throw new Error(e);
    }
};

module.exports = File;