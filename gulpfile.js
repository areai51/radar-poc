const gulp = require('gulp');
const map = require('map-stream');
const RadarMarkdownParser = require('./utils/parser');
const gulpSequence = require('gulp-sequence');
const path = require('path');
const Vinyl = require('vinyl');
const data = [];

// Thanks to https://stackoverflow.com/questions/23230569/how-do-you-create-a-file-from-a-string-in-gulp/24451738
function string_src(filename, string) {
    var src = require('stream').Readable({
        objectMode: true
    });
    src._read = function () {
        this.push(new Vinyl({
            cwd: process.cwd(),
            base: './',
            path: filename,
            contents: new Buffer(string)
        }));
        this.push(null);
    };
    return src;
}

gulp.task('write', function () {
    return string_src('output.json', JSON.stringify(data, null, 2))
    .pipe(gulp.dest('build/'));
});

gulp.task('build', function () {
    return gulp.src(['./src/docs/*.md'])
        .pipe(map(function (file, done) {
            data.push(new RadarMarkdownParser(file.contents.toString('utf8'), path.basename(file.path)));
            done();
        }))
        .pipe(gulp.dest('./dist/temp'));
});

gulp.task('default', gulpSequence('build', 'write'));