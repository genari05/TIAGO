const axios = require("axios");
const appVersion = require("../../package.json").version;

async function getRemoteVersion() {
	const getVersion = await axios.get(
		`https://storage.codegpt.co/vscode/extension-version.json?no_cache=${new Date().getTime()}`
	);

	if (getVersion.status === 200) {
		return getVersion.data[0];
	}

	return appVersion;
}

module.exports = getRemoteVersion;
