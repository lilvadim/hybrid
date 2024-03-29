#!/usr/bin/env sh

# Electron's version.
export npm_config_target=13.6.9

# export npm_config_arch=arm64
# export npm_config_target_arch=arm64
# Download headers for Electron.
export npm_config_disturl=https://electronjs.org/headers
# Tell node-pre-gyp that we are building for Electron.
export npm_config_runtime=electron
# Tell node-pre-gyp to build module from source code.
export npm_config_build_from_source=true
# Install all dependencies, and store cache to ~/.electron-gyp.
HOME=~/.electron-gyp npm ci --cpu x64 --os darwin