const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
  packagerConfig: {
    asar: true,
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {},
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-webpack',
      config: {
        mainConfig: './webpack.main.config.js',
        renderer: {
	    config: './webpack.renderer.config.js',
	    entryPoints: [
	    {
		html: './src/html/index.html',
		js: './src/renderer/renderer.js',
		name: 'main_window',
		preload: {
		    js: './src/preload/preload.js',
		},
	    },
	    {
		html: './src/html/form.html',
		js: './src/renderer/formRenderer.js',
		name: 'form_window',
		preload: {
		    js: './src/preload/formPreload.js',
		}
	    },
          ],
        },
      },
    },
  ],
};
