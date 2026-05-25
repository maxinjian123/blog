//#region src/utils/promise.d.ts
declare function promiseWithResolver<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
};
//#endregion
export { promiseWithResolver };