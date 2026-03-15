// Ensure the global `Express` namespace exists so @types/multer can augment it.
// @types/multer declares `namespace Express { namespace Multer { ... } }`.
// Without this, TypeScript may report "Cannot find namespace 'Express'".

declare global {
  namespace Express {}
}

export {};
