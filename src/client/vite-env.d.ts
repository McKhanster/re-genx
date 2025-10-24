/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_VERSION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// GLSL shader module declarations
declare module '*.glsl' {
  const value: string;
  export default value;
}

declare module '*.glsl?raw' {
  const value: string;
  export default value;
}
