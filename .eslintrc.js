module.exports = {
    extends: 'expensify',
    settings: {
        'import/resolver': {
            node: {
                extensions: ['.js', '.native.js', '.web.js'],
            },
        },
    },
};
