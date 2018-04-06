const hljs = require('highlight.js');
const mdOptions = {
    html: true,
    linkify: true,
    breaks: true,
    typographer: true,
    highlight: function (str, lang) {
        if (lang && hljs.getLanguage(lang)) {
            try {
                return '<pre class="hljs"><code>' +
                    hljs.highlight(lang, str, true).value +
                    '</code></pre>';
            } catch (__) {}
        }

        return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>';
    }
};

const md = require('markdown-it')(mdOptions);
const _ = require('lodash');
const sanitize = require('sanitize-html');
const defaults = require('./defaults');

class RadarMarkdownParser {
    constructor(data, keys) {
        this.data = md.parse(data);
        this.keys = keys || defaults.defaultKeys;
        this.sanitizedData = {};
        this.tempData = {};
        // Flags
        this.isHeading = '';
        this.isTitle = false;
        this.isContent = true;
        return this.initialize();
    }
    getKeyObj(key) {
        let keyObj = {};
        _.each(this.keys, (k) => {
            if (k.name === key) {
                keyObj = k;
                return;
            }
        });
        return keyObj;
    }
    levelOneSanitizer(token) {
        if (token.type === 'heading_open') {
            this.isHeading = '';
            this.isContent = false;
            if (token.tag === 'h1') {
                this.isTitle = true;
            }
            return;
        }
        if (token.type === 'heading_close') {
            this.isContent = true;
            this.isTitle = false;
            return;
        }
        if (this.isTitle && !this.isContent && !this.sanitizedData.name) {
            this.sanitizedData.name = token.content;
            return;
        }
        if (!this.isTitle && !this.isContent) {
            const key = _.camelCase(token.content);
            this.sanitizedData[key] = [];
            this.isHeading = key;
            return;
        }
        if (this.isContent) {
            this.sanitizedData[this.isHeading].push(token);
            return;
        }
    }
    levelTwoSanitizer(value, key) {
        let keyObj = this.getKeyObj(key);
        if (keyObj.keyword === true) {
            const contentParser = (token) => {
                if (token.type === 'paragraph_open' || token.type === 'paragraph_close') {
                    return;
                }
                if (this.tempData[keyObj.name]) {
                    return;
                }
                this.tempData[keyObj.name] = _.lowerCase(token.content);
            };

            if (Array.isArray(value)) {
                _.each(value, contentParser.bind(this));
            }
        }
        return;
    }
    levelThreeSanitizer(value, key) {
        let keyObj = this.getKeyObj(key);
        if (keyObj.content === true) {
            this.tempData[keyObj.name] = sanitize(md.renderer.render(this.sanitizedData[keyObj.name], mdOptions));
        }
    }
    updateSanitizedData() {
        this.sanitizedData = Object.assign({}, this.sanitizedData, this.tempData);
        this.tempData = {};
    }
    levelOne() {
        _.each(this.data, this.levelOneSanitizer.bind(this));
        this.updateSanitizedData();
    }
    levelTwo() {
        _.each(this.sanitizedData, this.levelTwoSanitizer.bind(this));
        this.updateSanitizedData();
    }
    levelThree() {
        _.each(this.sanitizedData, this.levelThreeSanitizer.bind(this));
        this.updateSanitizedData();
    }
    initialize() {
        this.levelOne();
        this.levelTwo();
        this.levelThree();
        return this.sanitizedData;
    }
}

module.exports = RadarMarkdownParser;