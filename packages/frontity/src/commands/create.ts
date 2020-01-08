import chalk from "chalk";
import { emitter } from "../utils/eventEmitter";
import { Options } from "../steps/create/types";
import {
  normalizeOptions,
  ensureProjectDir,
  createPackageJson,
  createFrontitySettings,
  cloneStarterTheme,
  installDependencies,
  downloadFavicon,
  revertProgress
} from "../steps/create";

const defaultOptions: Options = {
  path: process.cwd(),
  typescript: false,
  packages: [
    // "@frontity/wp-source"
  ],
  theme: "@frontity/mars-theme"
};

const emit = (message: string, step?: Promise<void>) => {
  emitter.emit("cli:create:message", message, step);
};

export default async (passedOptions?: Options) => {
  let options: Options;
  let step: Promise<any>;
  let dirExisted: boolean;

  process.on("SIGINT", async () => {
    if (typeof dirExisted !== "undefined")
      await revertProgress(dirExisted, options);
  });

  try {
    // 1. Parses and validates options.
    options = normalizeOptions(defaultOptions, passedOptions);

    const { name, theme, path } = options;

    // 2. Ensures that the project dir exists and is empty.
    step = ensureProjectDir(path);
    emit(`Ensuring ${chalk.yellow(options.path)} directory.`, step);
    dirExisted = await step;

    // 3. Creates `package.json`.
    step = createPackageJson(name, theme, path);
    emit(`Creating ${chalk.yellow("package.json")}.`, step);
    await step;

    // 4. Creates `frontity.settings`.
    const extension = options.typescript ? "ts" : "js";
    step = createFrontitySettings(extension, name, path);
    emit(`Creating ${chalk.yellow(`frontity.settings.${extension}`)}.`, step);
    await step;

    // 5. Clones `@frontity/mars-theme` inside `packages`.
    step = cloneStarterTheme(options);
    emit(`Cloning ${chalk.green(options.theme)}.`, step);
    await step;

    // 6. Installs dependencies.
    step = installDependencies(options);
    emit(`Installing dependencies.`, step);
    await step;

    // 7. Download favicon.
    step = downloadFavicon(options);
    emit(`Downloading ${chalk.yellow("favicon.ico")}.`, step);
    await step;
  } catch (error) {
    if (typeof dirExisted !== "undefined")
      await revertProgress(dirExisted, options);

    if (emitter) emitter.emit("cli:create:error", error);
    else throw error;
  }
};
