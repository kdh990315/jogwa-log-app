const { withMainApplication } = require("@expo/config-plugins");
const { withMainActivity } = require("@expo/config-plugins");

const restoreCall = "    clearExpoActivityResultStore()\n";

const restoreFunction = `  private fun clearExpoActivityResultStore() {
    // Work around expo-modules-core restoring ActivityResult with a boot class loader,
    // which can crash before JS handles image picker recovery.
    getSharedPreferences("expo.modules.kotlin.PersistentDataManager", MODE_PRIVATE)
      .edit()
      .clear()
      .commit()
  }
`;

const activityRestoreFunction = `  private fun clearExpoActivityResultStore() {
    // Prevent expo-modules-core from restoring stale ActivityResult parcels with
    // a boot class loader after camera/image-picker Activity recreation.
    getSharedPreferences("expo.modules.kotlin.PersistentDataManager", MODE_PRIVATE)
      .edit()
      .clear()
      .commit()
  }
`;

function withClearExpoActivityResultStore(config) {
  config = withMainApplication(config, (config) => {
    if (config.modResults.language !== "kt") {
      return config;
    }

    let contents = config.modResults.contents;

    if (!contents.includes("clearExpoActivityResultStore()")) {
      contents = contents.replace("    super.onCreate()\n", `    super.onCreate()\n${restoreCall}`);
    }

    if (!contents.includes("private fun clearExpoActivityResultStore()")) {
      contents = contents.replace(
        "\n  override fun onConfigurationChanged",
        `\n${restoreFunction}\n  override fun onConfigurationChanged`,
      );
    }

    config.modResults.contents = contents;
    return config;
  });

  return withMainActivity(config, (config) => {
    if (config.modResults.language !== "kt") {
      return config;
    }

    let contents = config.modResults.contents;

    if (!contents.includes("clearExpoActivityResultStore()")) {
      contents = contents.replace(
        "  override fun onCreate(savedInstanceState: Bundle?) {\n",
        `  override fun onCreate(savedInstanceState: Bundle?) {\n${restoreCall}`,
      );
    }

    if (!contents.includes("private fun clearExpoActivityResultStore()")) {
      contents = contents.replace(
        "\n  /**\n   * Returns the name of the main component",
        `\n${activityRestoreFunction}\n  /**\n   * Returns the name of the main component`,
      );
    }

    config.modResults.contents = contents;
    return config;
  });
}

module.exports = withClearExpoActivityResultStore;
