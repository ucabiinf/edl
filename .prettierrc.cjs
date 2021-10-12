module.exports = {
    endOfLine: 'lf',
    useTabs: false,
    tabWidth: 4,
    singleQuote: true,
    trailingComma: 'all',
    semi: true,
    printWidth: 120,
    proseWrap: 'always',
    arrowParens: 'always',
    bracketSpacing: true,
    quoteProps: 'as-needed',
    htmlWhitespaceSensitivity: 'css',
    overrides: [
        {
            files: ['*.html', '*.css', '*.scss', '*.yaml'],
            options: {
                tabWidth: 2,
            },
        },
    ],
};
