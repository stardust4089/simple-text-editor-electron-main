module.exports = {
  
  packagerConfig: {
    asar: true,
    icon: 'images/icon' // no file extension required
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
    // {
    //   name: '@electron-forge/maker-dmg',
    //   config: {
    //     background: './assets/dmg-background.png',
    //     format: 'ULFO'
    //   }
    // },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
  ],
};

