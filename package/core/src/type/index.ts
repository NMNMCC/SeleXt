export type * from "./util";
import type { Shallow, SuccessResponse, FailureResponse } from "./util";

/**
 * Array selection configuration with select criteria and optional pagination
 * @template TBaseItem - The type of items in the array
 */
export type ArraySelect<TBaseItem> = [
    select: Select<TBaseItem>,
    option?: {
        /** Starting index for array slicing */
        offset: number;
        /** Number of items to select (optional, selects to end if not specified) */
        length?: number;
    },
];

/** Select all fields at current level (shallow selection) */
export type SelectAll = "*";

/** Select all fields recursively (deep selection) */
export type SelectDeepAll = "**";

/**
 * Flexible selection type that adapts based on the base type
 * - For arrays: uses ArraySelect with pagination options
 * - For objects: allows partial field selection or wildcard selection
 * - For scalars: simple boolean selection
 * @template TBase - The base type to select from
 */
export type Select<TBase> = TBase extends object
    ? // Is Object
      TBase extends Array<infer TBaseItem>
        ? // Is Array
          ArraySelect<TBaseItem>
        : // Is Object, But Not Array
          | Partial<{ [TKey in keyof TBase]: Select<TBase[TKey]> }>
              | SelectAll
              | SelectDeepAll
    : // Is Scalar
      true;

/**
 * Result type for array selections - returns array of selected results
 * @template TBaseItem - The type of items in the source array
 * @template TSelect - The selection configuration for array items
 */
export type ArrayResult<
    TBaseItem,
    TSelect extends ArraySelect<TBaseItem>,
> = Result<TBaseItem, TSelect[0]>[];

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
export type Result<TBase, TSelect extends Select<TBase>> = TBase extends object
    ? // Is Object
      TBase extends Array<infer TBaseItem>
        ? // Is Array -> ArrayResult
          ArrayResult<
              TBaseItem,
              TSelect extends ArraySelect<TBaseItem> ? TSelect : never
          >
        : // Is Object, But Not Array
          TSelect extends SelectAll
          ? // Select All (Shallow)
            Shallow<TBase>
          : TSelect extends SelectDeepAll
            ? // Select Deep All
              TBase
            : {
                  [K in keyof TSelect as K extends keyof TBase
                      ? TSelect[K] extends Select<TBase[K]>
                          ? K
                          : never
                      : never]: K extends keyof TBase
                      ? // K Is In TBase
                        TSelect[K] extends Select<TBase[K]>
                          ? // TSelect[K] Is Select
                            Result<TBase[K], TSelect[K]>
                          : never
                      : never;
              }
    : // Is Scalar
      TBase;

/**
 * Input tuple for operations: [operation, parameters, selection]
 * @template TBase - The base data type
 * @template TOperation - The operation name/identifier
 * @template TParameter - Operation parameters object
 * @template TSelect - Selection criteria for the result
 */
export type Input<
    TBase,
    TOperation extends string,
    TParameter extends object = {},
    TSelect extends Select<TBase> = Select<TBase>,
> = [operation: TOperation, parameter: TParameter, select: TSelect];

/**
 * Output type union: either success with selected data or failure response
 * @template TBase - The base data type
 * @template TFailureResponse - Possible failure response types
 * @template TSelect - Selection criteria applied to successful results
 */
export type Output<
    TBase,
    TFailureResponse extends FailureResponse<any> = never,
    TSelect extends Select<TBase> = Select<TBase>,
> = SuccessResponse<Result<TBase, TSelect>> | TFailureResponse;

/**
 * Function signature for operations that return promises with selected data
 * @template TBase - The base data type to operate on
 * @template TOperation - The operation identifier string
 * @template TParameter - Parameters required for the operation
 * @template TFailureResponse - Possible failure response types
 */
export type Term<
    TBase,
    TOperation extends string,
    TParameter extends object = {},
    TFailureResponse extends FailureResponse<any> = never,
> = {
    <TSelect extends Select<TBase>>(
        ...input: Input<TBase, TOperation, TParameter, TSelect>
    ): Promise<Output<TBase, TFailureResponse, TSelect>>;
};

/**
 * Contract type that ensures operation keys match their Term operation types
 * Validates that each key in the contract corresponds to its Term's operation parameter
 * @template TContract - Object mapping operation names to their Term implementations
 */
export type Contract<
    TContract extends { [key: string]: Term<any, any, any, any> },
> = {
    [TKey in keyof TContract]: TContract[TKey] extends Term<
        any,
        infer TOperation,
        any,
        any
    >
        ? TKey extends TOperation
            ? TContract[TKey]
            : Term<any, TKey & string, any, any>
        : never;
};
