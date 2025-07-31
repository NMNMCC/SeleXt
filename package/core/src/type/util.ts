export type Shallow<T> = T extends object
  ? {
      [K in keyof T as T[K] extends object ? never : K]: T[K];
    }
  : T;

export type DeepPartial<T> = T extends object
  ? Partial<{
      [K in keyof T]: DeepPartial<T[K]>;
    }>
  : T;

export type Response<TType extends string, TResult> = [type: TType, result: TResult];
export type SuccessResponse<TResult> = Response<"success", TResult>;
export type FailureResponse<TResult> = Response<"failure", TResult>;

export type Exact<T, U> = T extends U ? (U extends T ? T : never) : never;

export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;
