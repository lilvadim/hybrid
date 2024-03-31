// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

export const hybridApi = {

    // @ts-ignore
    addOption: (parameters) => console.warn('api: addOption is not initialized'),

    clearCurrentCommand: () => console.warn('api: clearCurrentCommand is not initialized'),

    // @ts-ignore
    registerCommand: (commandDescription) => console.warn('api: registerCommand is not initialized'),

    // @ts-ignore
    removeOption: (parameters) => console.warn('api: removeOption is not initialized')

};

// @ts-ignore
window.hybrid = hybridApi