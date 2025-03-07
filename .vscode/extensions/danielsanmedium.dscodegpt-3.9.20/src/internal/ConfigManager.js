
class ConfigurationManager {
  _configUpdatedListeners = new Set()
  static defaultConfiguration = {
    debug: false,
    enable: true,
    stoppers: ['\n'],
    temperature: 0.1,
    maxTokens: 300
  }

  get config () {
    return this._configuration
  }

  _configuration = {
    ...ConfigurationManager.defaultConfiguration
  }

  updateFromPluginConfig (
    config = {}
  ) {
    const mergedConfig = {
      ...ConfigurationManager.defaultConfiguration,
      ...config
    }

    this._configuration = {
      ...mergedConfig,
      debug: String(mergedConfig.debug) === 'true',
      enable: String(mergedConfig.enable) !== 'false'
    }

    for (const listener of this._configUpdatedListeners) {
      listener()
    }
  }

  onUpdatedConfig (listener) {
    this._configUpdatedListeners.add(listener)
  }
}

module.exports = ConfigurationManager
