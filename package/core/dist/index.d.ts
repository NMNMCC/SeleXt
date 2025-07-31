type Shallow<T> = T extends object ? {
    [K in keyof T as T[K] extends object ? never : K]: T[K];
} : T;
type DeepPartial<T> = T extends object ? Partial<{
    [K in keyof T]: DeepPartial<T[K]>;
}> : T;
type Response<TType extends string, TResult> = [type: TType, result: TResult];
type SuccessResponse<TResult> = Response<"success", TResult>;
type FailureResponse<TResult> = Response<"failure", TResult>;
type Exact<T, U> = T extends U ? (U extends T ? T : never) : never;
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

/**
 * Array selection configuration with select criteria and optional pagination
 * @template TBaseItem - The type of items in the array
 */
type ArraySelect<TBaseItem> = [
    select: Select<TBaseItem>,
    option?: {
        /** Starting index for array slicing */
        offset: number;
        /** Number of items to select (optional, selects to end if not specified) */
        length?: number;
    }
];
/** Select all fields at current level (shallow selection) */
type SelectAll = "*";
/** Select all fields recursively (deep selection) */
type SelectDeepAll = "**";
/**
 * Flexible selection type that adapts based on the base type
 * - For arrays: uses ArraySelect with pagination options
 * - For objects: allows partial field selection or wildcard selection
 * - For scalars: simple boolean selection
 * @template TBase - The base type to select from
 */
type Select<TBase> = TBase extends object ? TBase extends Array<infer TBaseItem> ? ArraySelect<TBaseItem> : Partial<{
    [TKey in keyof TBase]: Select<TBase[TKey]>;
}> | SelectAll | SelectDeepAll : true;
/**
 * Result type for array selections - returns array of selected results
 * @template TBaseItem - The type of items in the source array
 * @template TSelect - The selection configuration for array items
 */
type ArrayResult<TBaseItem, TSelect extends ArraySelect<TBaseItem>> = Result<TBaseItem, TSelect[0]>[];
/**
 * Transforms base type according to selection criteria
 * - Arrays: returns ArrayResult with selected items
 * - Objects with "*": returns shallow copy (non-object fields only)
 * - Objects with "**": returns complete deep copy
 * - Objects with field selection: returns object with only selected fields
 * - Scalars: returns original type unchanged
 * @template TBase - The base type to transform
 * @template TSelect - The selection criteria
 */
type Result<TBase, TSelect extends Select<TBase>> = TBase extends object ? TBase extends Array<infer TBaseItem> ? ArrayResult<TBaseItem, TSelect extends ArraySelect<TBaseItem> ? TSelect : never> : TSelect extends SelectAll ? Shallow<TBase> : TSelect extends SelectDeepAll ? TBase : {
    [K in keyof TSelect as K extends keyof TBase ? TSelect[K] extends Select<TBase[K]> ? K : never : never]: K extends keyof TBase ? TSelect[K] extends Select<TBase[K]> ? Result<TBase[K], TSelect[K]> : never : never;
} : TBase;
/**
 * Input tuple for operations: [operation, parameters, selection]
 * @template TBase - The base data type
 * @template TOperation - The operation name/identifier
 * @template TParameter - Operation parameters object
 * @template TSelect - Selection criteria for the result
 */
type Input<TBase, TOperation extends string, TParameter extends object = {}, TSelect extends Select<TBase> = Select<TBase>> = [operation: TOperation, parameter: TParameter, select: TSelect];
/**
 * Output type union: either success with selected data or failure response
 * @template TBase - The base data type
 * @template TFailureResponse - Possible failure response types
 * @template TSelect - Selection criteria applied to successful results
 */
type Output<TBase, TFailureResponse extends FailureResponse<any> = never, TSelect extends Select<TBase> = Select<TBase>> = SuccessResponse<Result<TBase, TSelect>> | TFailureResponse;
/**
 * Function signature for operations that return promises with selected data
 * @template TBase - The base data type to operate on
 * @template TOperation - The operation identifier string
 * @template TParameter - Parameters required for the operation
 * @template TFailureResponse - Possible failure response types
 */
type Term<TBase, TOperation extends string, TParameter extends object = {}, TFailureResponse extends FailureResponse<any> = never> = {
    <TSelect extends Select<TBase>>(...input: Input<TBase, TOperation, TParameter, TSelect>): Promise<Output<TBase, TFailureResponse, TSelect>>;
};
/**
 * Contract type that ensures operation keys match their Term operation types
 * Validates that each key in the contract corresponds to its Term's operation parameter
 * @template TContract - Object mapping operation names to their Term implementations
 */
type Contract<TContract extends {
    [key: string]: Term<any, any, any, any>;
}> = {
    [TKey in keyof TContract]: TContract[TKey] extends Term<any, infer TOperation, any, any> ? TKey extends TOperation ? TContract[TKey] : Term<any, TKey & string, any, any> : never;
};

/**
 * Applies selection criteria to transform data according to the specified selection rules
 * - Handles arrays with pagination (offset/length) and recursive item selection
 * - Supports shallow selection (*) that excludes nested objects
 * - Supports deep selection (**) that returns complete data
 * - Performs selective field extraction for object selections
 * - Returns scalars unchanged
 * @template TBase - The base data type to select from
 * @template TSelect - The selection criteria to apply
 * @param base - The source data to transform
 * @param select - The selection configuration
 * @returns Transformed data matching the selection criteria
 */
declare const applySelection: <TBase, TSelect extends Select<TBase>>(base: TBase, select: TSelect) => Result<TBase, TSelect>;
/**
 * Creates a unified contract function from multiple Term operations
 * The resulting function can dispatch to any operation in the contract based on the operation name
 * Ensures type safety by validating that contract keys match their Term operation types
 * @template TContract - Object mapping operation names to Term implementations
 * @param contract - The contract object containing all available operations
 * @returns A unified function that can execute any operation from the contract
 * @throws Error when attempting to call an unknown operation
 */
declare const createContract: <const TContract extends {
    [key: string]: Term<any, any, any, any>;
}>(contract: TContract & Contract<TContract>) => UnionToIntersection<TContract[keyof TContract]>;

export { type ArrayResult, type ArraySelect, type Contract, type DeepPartial, type Exact, type FailureResponse, type Input, type Output, type Response, type Result, type Select, type SelectAll, type SelectDeepAll, type Shallow, type SuccessResponse, type Term, type UnionToIntersection, applySelection, createContract };
