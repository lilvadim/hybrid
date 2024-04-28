export class EnvironmentUtils {
	private constructor() {}

	static isDev = process.env['WEBPACK_SERVE'] === 'true'
	static resourcePath = !this.isDev ? process.resourcesPath : './'
}