import { pathToFileURL, fileURLToPath } from "url";
import { join, extname, dirname } from "path";
import { readdir } from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function loadPlugins(): Promise<void> {
    const pluginsDir = join(__dirname, "./cmd");

    const files = await readdir(pluginsDir, { withFileTypes: true });
    await Promise.all(
        files.map(async (file) => {
            const fullPath: string = join(pluginsDir, file.name);
            if (extname(file.name) === ".mjs") {
                try {
                    const fileUrl: string = pathToFileURL(fullPath).href;
                    await import(fileUrl);
                } catch (err) {
                    console.log("ERROR", `${file.name}: ${(err as Error).message}`);
                }
            }
        })
    );
    console.log("Plugins Synced");
}
