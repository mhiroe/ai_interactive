import { serveDir } from "@std/http/file_server.ts";
import { serve } from "@std/http/server.ts";

serve((req: Request) => {
  return serveDir(req, {
    fsRoot: ".",
    urlRoot: "",
    showDirListing: true,
    enableCors: true,
    quiet: false,
  });
}, { port: 8000 });

console.log("Server running at http://localhost:8000");
