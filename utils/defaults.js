const defaultKeys = [{
    name: 'name'
}, {
    name: 'description',
    content: true
}, {
    name: 'resources',
    content: true
}, {
    name: 'github',
    content: true
}, {
    name: 'quadrant',
    keyword: true
}, {
    name: 'type',
    keyword: true
}, {
    name: 'platform',
    tags: true
}];

const whitelistedKeys = ['filename', 'name', 'quadrant', 'type', 'platform'];

module.exports = {
    defaultKeys,
    whitelistedKeys
};