import { bundle } from "https://deno.land/x/emit@0.31.1/mod.ts";

const result = await bundle(new URL("./src/app.ts", import.meta.url));
await Deno.writeTextFile("./dist/bundle.js", result.code);
console.log("Bundle created successfully!");
