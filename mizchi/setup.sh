# 必ず親ディレクトリから実行して展開する
# > ./mizchi/setup.sh

TEMPLATE_FILES=(.cline .clineignore .gemini .github .hooks .vscode modules .clinerules .clineignore .roomodes deno.jsonc deno.lock __deprecated)

for file in ${TEMPLATE_FILES[@]}
do
    ln -snfv "$(pwd)/mizchi/$file" ./$file
done
