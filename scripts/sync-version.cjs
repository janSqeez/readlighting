#!/usr/bin/env node
// Single source of truth is the root package.json "version" field. This
// script propagates it to the Android and Electron platform projects, and
// bumps Android's versionCode (which must strictly increase on every build,
// independent of the human-readable versionName) so each APK build is
// distinguishable even between same-versionName rebuilds.
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const { version } = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf-8'));

// electron/package.json
const electronPkgPath = path.join(root, 'electron', 'package.json');
const electronPkg = JSON.parse(fs.readFileSync(electronPkgPath, 'utf-8'));
electronPkg.version = version;
fs.writeFileSync(electronPkgPath, JSON.stringify(electronPkg, null, 2) + '\n');

// android/app/build.gradle
const gradlePath = path.join(root, 'android', 'app', 'build.gradle');
let gradle = fs.readFileSync(gradlePath, 'utf-8');
const versionCodeMatch = gradle.match(/versionCode\s+(\d+)/);
if (!versionCodeMatch) {
  throw new Error('Could not find versionCode in android/app/build.gradle');
}
const nextVersionCode = Number(versionCodeMatch[1]) + 1;
gradle = gradle.replace(/versionCode\s+\d+/, `versionCode ${nextVersionCode}`);
gradle = gradle.replace(/versionName\s+"[^"]*"/, `versionName "${version}"`);
fs.writeFileSync(gradlePath, gradle);

console.log(`Synced version ${version} (Android versionCode ${nextVersionCode}) to electron/ and android/.`);
