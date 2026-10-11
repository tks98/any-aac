declare module '@diffusionstudio/piper-wasm/build/piper_phonemize.js' {
  /** Emscripten factory for piper-phonemize (eSpeak NG). */
  const createPiperPhonemize: (options: {
    print?: (line: string) => void;
    printErr?: (line: string) => void;
    locateFile?: (file: string) => string;
  }) => Promise<unknown>;
  export default createPiperPhonemize;
}
