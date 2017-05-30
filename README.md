[![Build Status](https://travis-ci.org/BrunoBernardino/Oikon2-Mac.svg?branch=master)](https://travis-ci.org/BrunoBernardino/Oikon2-Mac)

# Oikon 2 for Mac

https://oikon.net

[![Showcase](https://cloud.githubusercontent.com/assets/1239616/26329899/3c987998-3f41-11e7-885f-5e8726366712.png)](https://github.com/BrunoBernardino/Oikon2-Mac/issues/1)

## Development

Requires `node` (ideally through `nvm`) >= 7.0.0, and `npm`.

Docs: http://electron.atom.io/docs

```bash
$ npm install
$ npm start
$ npm run lint
$ npm test
```

## To-dos
- [ ] [Fix DB error after packaging app](https://github.com/nolanlawson/pouchdb-electron/issues/9).

## Release

```bash
# To test the packaged app
$ npm run build
# To build a signed version to upload (crashes if not downloaded from the App Store)
$ npm run release
```
