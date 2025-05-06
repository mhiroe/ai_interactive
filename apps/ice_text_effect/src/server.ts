import { serveDir } from "https://deno.land/std@0.180.0/http/file_server.ts";
import { serve } from "https://deno.land/std@0.180.0/http/server.ts";

const PORT = 8000;

console.log(`🧊 アイステキスト流体効果サーバーを起動中...`);
console.log(`http://localhost:${PORT} でサーバーが実行されます`);

await serve(
  (req) => {
    const url = new URL(req.url);

    // APIエンドポイントがある場合はここで処理
    if (url.pathname.startsWith("/api/")) {
      return new Response(JSON.stringify({ status: "ok" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // 静的ファイルの提供
    return serveDir(req, {
      fsRoot: "./src",
      urlRoot: "",
      showDirListing: true,
      enableCors: true,
    });
  },
  { port: PORT }
);
