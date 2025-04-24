import style from "./msw-dev-tool.css";

export const splitCSS = (css: string, chunkSize = 5000) => {
  const chunks: string[] = [];
  let currentChunk = "";
  let openBraces = 0;

  for (let i = 0; i < css.length; i++) {
    const char = css[i];
    currentChunk += char;

    if (char === "{") {
      openBraces++;
    } else if (char === "}") {
      openBraces--;
    }

    if (openBraces === 0 && currentChunk.length >= chunkSize) {
      chunks.push(currentChunk);
      currentChunk = "";
    }
  }

  if (currentChunk.trim() !== "") {
    chunks.push(currentChunk);
  }

  return chunks;
};

export const devToolStyleChunks = splitCSS(style);
