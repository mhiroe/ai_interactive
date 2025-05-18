/**
 * SVGレンダリングを管理するクラス
 */
export class SVGRenderer {
    private svg: SVGSVGElement | null = null;
    private container: HTMLElement | null = null;

    /**
     * SVGレンダラーを初期化
     * @param containerId SVGを配置するコンテナのID
     */
    constructor(containerId?: string) {
        if (containerId) {
            this.container = document.getElementById(containerId);
        }
        this.initSVG();
    }

    /**
     * SVG要素の初期化
     */
    private initSVG(): void {
        this.svg = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "svg",
        );
        this.svg.setAttribute("width", "100%");
        this.svg.setAttribute("height", "100%");
        this.svg.setAttribute("viewBox", "0 0 100 100");
        this.svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

        if (this.container) {
            this.container.appendChild(this.svg);
        }
    }

    /**
     * SVGのレンダリング
     * @param data レンダリングするデータ
     */
    public render(data?: any): void {
        if (!this.svg) return;

        // 現在は空の実装
        // 将来的にSVGレンダリングが必要になった場合に実装
        console.warn("SVG rendering is not implemented");
    }

    /**
     * SVG要素の取得
     */
    public getSVG(): SVGSVGElement | null {
        return this.svg;
    }

    /**
     * SVG要素のクリア
     */
    public clear(): void {
        if (this.svg) {
            while (this.svg.firstChild) {
                this.svg.removeChild(this.svg.firstChild);
            }
        }
    }

    /**
     * SVGレンダラーの破棄
     */
    public dispose(): void {
        if (this.svg && this.container) {
            this.container.removeChild(this.svg);
        }
        this.svg = null;
        this.container = null;
    }
}
