[![Build Status](https://travis-ci.org/BrunoBernardino/Oikon2-Mac.svg?branch=master)](https://travis-ci.org/BrunoBernardino/Oikon2-Mac)

# Oikon 2 for Mac

https://itunes.apple.com/pt/app/oikon-2-manage-your-expenses/id1242561414

[![Showcase](https://cloud.githubusercontent.com/assets/1239616/26329899/3c987998-3f41-11e7-885f-5e8726366712.png)](https://github.com/BrunoBernardino/Oikon2-Mac/issues/1)

## Development

Requires `node` (ideally through `nvm`) >= 7.0.0, and `npm`.

Docs: http://electron.atom.io/docs

```bash
$ npm test
$ npm start
```

## Release

Don't forget to increment the `buildVersion` in `build.js` and update the `version` in `package.json`.

```bash
# To test the packaged app
$ npm run build
# To build a signed version to upload (crashes if not downloaded from the App Store)
$ export OSX_SIGN_IDENTITY='XXX' && npm run release
```

Make sure there's a valid `*.provisionprofile` file in the project directory.


To get a list of available identities:
```bash
$ security find-identity -p codesigning -v
```
