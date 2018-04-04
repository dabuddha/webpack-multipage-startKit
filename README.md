# Webpack 4 starter kit for multipage static websites
* Modern JavaScript (eslint, babel)
* PostCSS

.
├── README.md
├── createPage.js
├── package.json
├── postcss.config.js
├── node_modules
├── src
│   ├── favicon
│   │   └── favicon.png
│   ├── fonts
│   │   ├── OpenSans-Regular.woff
│   │   └── OpenSans-Regular.woff2
│   ├── html
│   │   ├── includes
│   │   │   ├── footer.art
│   │   │   └── header.art
│   │   └── views
│   │       └── report
│   │           ├── index
│   │           │   ├── index.art
│   │           │   ├── index.css
│   │           │   └── index.js
│   │           └── success
│   │               ├── index.art
│   │               ├── index.css
│   │               └── index.js
│   ├── img
│   │   └── image.png
│   ├── js
│   │   ├── hello-world.js
│   │   └── index.js
│   └── style
│       ├── base
│       │   ├── _base.css
│       │   ├── _color.css
│       │   ├── _fn.css
│       │   ├── _mixin.css
│       │   └── _reset.css
│       └── common.css
├── test.js
├── webpack.config.js
└── yarn.lock


## Installation
> yarn

## New Page
> yarn new {directory}/{page}
> (示例) yarn new report/index
## Development
> yarn dev

if you don't need dev server then

> yarn watch
### Build
>yarn build


Based On: https://github.com/swandevv/webpack-static-html-scss