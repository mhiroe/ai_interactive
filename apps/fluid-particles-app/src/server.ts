console.log("Fluid Particles App server starting...");
console.log("Server running at http://localhost:8000");

// 静的ファイルを提供するディレクトリ
// 実行時のカレントディレクトリからの相対パス
const staticDir = "./static";

// デバッグ情報を表示
console.log("Current directory:", Deno.cwd());
console.log("Static directory:", staticDir);

// Content-Typeを取得する関数
function getContentType(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "html":
      return "text/html";
    case "js":
      return "application/javascript";
    case "css":
      return "text/css";
    case "json":
      return "application/json";
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "gif":
      return "image/gif";
    case "svg":
      return "image/svg+xml";
    case "frag":
      return "x-shader/x-fragment";
    case "vert":
      return "x-shader/x-vertex";
    default:
      return "application/octet-stream";
  }
}

// HTTPサーバーを起動
Deno.serve({ port: 8000 }, async (request) => {
  try {
    const url = new URL(request.url);
    let filePath = staticDir + url.pathname;

    // ルートパスの場合はindex.htmlを提供
    if (url.pathname === "/") {
      filePath += "index.html";
    }

    try {
      // ファイルを読み込む
      const file = await Deno.readFile(filePath);
      const contentType = getContentType(filePath);

      // レスポンスを返す
      return new Response(file, {
        status: 200,
        headers: {
          "content-type": contentType,
          "access-control-allow-origin": "*",
        },
      });
    } catch (e) {
      // ファイルが見つからない場合は404を返す
      return new Response("404 Not Found", {
        status: 404,
      });
    }
  } catch (e) {
    console.error(e);
    // エラーが発生した場合は500を返す
    return new Response("500 Internal Server Error", {
      status: 500,
    });
  }
});
