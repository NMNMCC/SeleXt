import { build } from "tsup";
import { readdir } from "node:fs/promises";
import { existsSync } from "node:fs";

import "dotenv/config";

const main = async () => {
    const packageNames = await readdir("package");

    for (const packageName of packageNames) {
        const packageBasePath = `package/${packageName}`;
        const packageEntryPath = `${packageBasePath}/src/index.ts`;

        if (!existsSync(packageEntryPath)) {
            console.warn("Skip:", packageEntryPath);
            continue;
        }

        await build({
            entry: [packageEntryPath],
            format: ["esm"],
            sourcemap: true,
            dts: true,
            outDir: `${packageBasePath}/dist`,
            clean: true,
        });
    }
};

main();
