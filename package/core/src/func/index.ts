import type {
    Select,
    Result,
    Contract,
    UnionToIntersection,
    Input,
    Term,
    ArraySelect,
} from "../type";

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
export const applySelection = <TBase, TSelect extends Select<TBase>>(
    base: TBase,
    select: TSelect,
): Result<TBase, TSelect> => {
    if (base === null || base === undefined || typeof base !== "object") {
        return base as Result<TBase, TSelect>;
    }

    if (Array.isArray(base)) {
        const arraySelect = select as ArraySelect<any>;
        if (!Array.isArray(arraySelect)) {
            return base as Result<TBase, TSelect>;
        }

        const [itemSelect, options] = arraySelect;
        const offset = options?.offset || 0;
        const length = options?.length;

        const slicedArray =
            length !== undefined
                ? base.slice(offset, offset + length)
                : base.slice(offset);

        return slicedArray.map((item) =>
            applySelection(item, itemSelect),
        ) as Result<TBase, TSelect>;
    }

    if (select === "*") {
        const result: any = {};
        for (const key in base) {
            if (base.hasOwnProperty(key)) {
                const value = (base as any)[key];
                if (
                    value === null ||
                    value === undefined ||
                    typeof value !== "object"
                ) {
                    result[key] = value;
                }
            }
        }
        return result as Result<TBase, TSelect>;
    }

    if (select === "**") {
        return base as Result<TBase, TSelect>;
    }

    if (typeof select === "object" && !Array.isArray(select)) {
        const result: any = {};
        const selectObj = select as Record<string, any>;

        for (const key in selectObj) {
            if (selectObj.hasOwnProperty(key) && key in base) {
                const selectValue = selectObj[key];
                const baseValue = (base as any)[key];

                if (selectValue === true) {
                    result[key] = baseValue;
                } else {
                    result[key] = applySelection(baseValue, selectValue);
                }
            }
        }
        return result as Result<TBase, TSelect>;
    }

    return base as Result<TBase, TSelect>;
};

/**
 * Creates a unified contract function from multiple Term operations
 * The resulting function can dispatch to any operation in the contract based on the operation name
 * Ensures type safety by validating that contract keys match their Term operation types
 * @template TContract - Object mapping operation names to Term implementations
 * @param contract - The contract object containing all available operations
 * @returns A unified function that can execute any operation from the contract
 * @throws Error when attempting to call an unknown operation
 */
export const createContract = <
    const TContract extends { [key: string]: Term<any, any, any, any> },
>(
    contract: TContract & Contract<TContract>,
): UnionToIntersection<TContract[keyof TContract]> =>
    ((input: Input<any, any, any, any>) => {
        const term = contract[input[0]];
        if (term === undefined) {
            throw new Error(`Unknown operation: ${input[0]}`);
        }
        return term(...input);
    }) as any;
