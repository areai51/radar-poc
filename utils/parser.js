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
const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const sanitize = require('sanitize-html');

function markdownParser(input) {

    const inputData = md.parse(input);
    let sanitizedData = {};
    // flags
    let isHeading = null;
    let isTitle = false;
    let isContent = true;

    function levelOneParser(token, index) {
        if (token.type === 'heading_open') {
            isHeading = null;
            isContent = false;
            if (token.tag === 'h1') {
                isTitle = true;
            }
            return;
        }
        if (token.type === 'heading_close') {
            isContent = true;
            isTitle = false;
            return;
        }
        if (isTitle && !isContent) {
            if (!sanitizedData.name) {
                sanitizedData.name = token.content;
            }
        }
        if (!isTitle && !isContent) {
            const key = _.camelCase(token.content) + '_temp';
            sanitizedData[key] = [];
            isHeading = key;
        }
        if (isContent) {
            sanitizedData[isHeading].push(token);
        }

    }

    function levelTwoParser(token, index) {
        if (token.type === 'paragraph_open' || token.type === 'paragraph_close') {
            return;
        }
        const key = isHeading.replace(/_temp/, '');
        if (sanitizedData[key]) {
            return;
        }
        sanitizedData[key] = _.lowerCase(token.content);
    }

    // Sanitize the data
    inputData.forEach(levelOneParser);
    // Type information
    isHeading = 'type_temp';
    sanitizedData[isHeading].forEach(levelTwoParser);
    // Quadrant information
    isHeading = 'quadrant_temp';
    sanitizedData[isHeading].forEach(levelTwoParser);
    // Iteration
    Object.keys(sanitizedData).forEach(function (key) {
        if (key.match(/_temp/)) {
            const newKey = key.replace(/_temp/, '');
            if (!sanitizedData[newKey]) {
                sanitizedData[newKey] = sanitize(md.renderer.render(sanitizedData[key], mdOptions));
            }
        }
    });
    // Clean up
    Object.keys(sanitizedData).forEach(function (key) {
        if (key.match(/_temp/)) {
            delete(sanitizedData[key]);
        }
    });

    return sanitizedData;
}

module.exports = markdownParser;