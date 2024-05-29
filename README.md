# HybridTerm

**Hybrid** is a terminal that allows load HTML frames that provide GUI for shell command

## Configuration

You can configure app using `~/.hybrid/hybrid_config.json` file

### Description and Default Values

```json
{
    "terminalControl": { // configure terminal command line processing
        "syncOnSpace": true, // send synchronization events to frames only when count of words changed
    },
    "commandFrameProvider": { // configure command frames loading
        "htmlFramesPaths": [], // additional paths to lookup for command frame
        "cache": true, // cache loaded command frames (if false command frame is being loaded from file every time)
        "builtinFrames": true // use builtin frames (you can observe them in Resources folder of package)
    },
    "shellLaunchConfig": { // configure shell 
        "executable": "zsh", // executable to use 
        "env": {} // environment variables override 
    }
}
```
