const fs = require('fs');

const MANIFEST_PATH = './dist/omnibookmarks-firefox/manifest.json';

const manifestText = fs.readFileSync(MANIFEST_PATH);
const manifestOverridesText = fs.readFileSync('./manifest-v2-overrides.json');
const manifest = JSON.parse(manifestText);
const overrides = JSON.parse(manifestOverridesText);
Object.assign(manifest, overrides);
fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
