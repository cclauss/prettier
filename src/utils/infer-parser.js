import getInterpreter from "./get-interpreter.js";

// Didn't use `path.basename` since this module need work in browsers too
// And `file` can be a `URL`
const getFileBasename = (file) => String(file).split(/[/\\]/).pop();

function getLanguageByFileName(languages, file) {
  if (!file) {
    return;
  }

  const basename = getFileBasename(file).toLowerCase();

  return languages.find(
    (language) =>
      language.extensions?.some((extension) => basename.endsWith(extension)) ||
      language.filenames?.some((name) => name.toLowerCase() === basename),
  );
}

function getLanguageByName(languages, languageName) {
  if (!languageName) {
    return;
  }

  return (
    languages.find(({ name }) => name.toLowerCase() === languageName) ??
    languages.find(({ aliases }) => aliases?.includes(languageName)) ??
    languages.find(({ extensions }) => extensions?.includes(`.${languageName}`))
  );
}

function getLanguageByInterpreter(languages, file) {
  if (
    process.env.PRETTIER_TARGET === "universal" ||
    !file ||
    getFileBasename(file).includes(".")
  ) {
    return;
  }

  const interpreter = getInterpreter(file);

  if (!interpreter) {
    return;
  }

  return languages.find((language) =>
    language.interpreters?.includes(interpreter),
  );
}

/**
 * @param {import("../index.js").Options} options
 * @param {{physicalFile?: string | URL, file?: string | URL, language?: string}} fileInfo
 * @returns {string | void} matched parser name if found
 */
function inferParser(options, fileInfo) {
  const languages = options.plugins.flatMap(
    (plugin) =>
      // @ts-expect-error -- Safe
      plugin.languages ?? [],
  );

  // If the file has no extension, we can try to infer the language from the
  // interpreter in the shebang line, if any; but since this requires FS access,
  // do it last.
  const language =
    getLanguageByName(languages, fileInfo.language) ??
    getLanguageByFileName(languages, fileInfo.physicalFile) ??
    getLanguageByFileName(languages, fileInfo.file) ??
    getLanguageByInterpreter(languages, fileInfo.physicalFile);

  return language?.parsers[0];
}

export default inferParser;
