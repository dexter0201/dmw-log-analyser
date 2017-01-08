'use strict';

const gulp = require('gulp');
const fs = require('fs');
const tasks = require('./tasks');

const CONFIG = JSON.parse(fs.readFileSync('./config.json'));

gulp.task('download-files', () => {
    tasks.downloadFiles(CONFIG);
});

gulp.task('analyze', () => {
    tasks.analyze(CONFIG);
});