/**
 * デバイスモーションとジャイロスコープの処理を管理するクラス
 */
export class DeviceMotionManager {
    private isEnabled: boolean = false;
    private acceleration: { x: number; y: number; z: number } = {
        x: 0,
        y: 0,
        z: 0,
    };

    constructor() {
        this.onDeviceMotion = this.onDeviceMotion.bind(this);
    }

    /**
     * デバイスモーションの監視を開始
     */
    public enable(): void {
        if (this.isEnabled) return;

        if (typeof DeviceMotionEvent !== "undefined") {
            if (
                typeof (DeviceMotionEvent as any).requestPermission ===
                    "function"
            ) {
                // iOS 13+ では許可が必要
                (DeviceMotionEvent as any).requestPermission()
                    .then((permissionState: string) => {
                        if (permissionState === "granted") {
                            this.addListeners();
                        }
                    })
                    .catch(console.error);
            } else {
                // その他のデバイス
                this.addListeners();
            }
        }
    }

    /**
     * デバイスモーションの監視を停止
     */
    public disable(): void {
        if (!this.isEnabled) return;

        window.removeEventListener("devicemotion", this.onDeviceMotion);
        this.isEnabled = false;
    }

    /**
     * 現在の加速度を取得
     */
    public getAcceleration(): { x: number; y: number; z: number } {
        return { ...this.acceleration };
    }

    /**
     * デバイスモーションイベントのハンドラー
     */
    private onDeviceMotion(event: DeviceMotionEvent): void {
        if (event.accelerationIncludingGravity) {
            this.acceleration = {
                x: event.accelerationIncludingGravity.x || 0,
                y: event.accelerationIncludingGravity.y || 0,
                z: event.accelerationIncludingGravity.z || 0,
            };
        }
    }

    /**
     * イベントリスナーの追加
     */
    private addListeners(): void {
        window.addEventListener("devicemotion", this.onDeviceMotion);
        this.isEnabled = true;
    }

    /**
     * ジャイロスコープ機能の削除
     * @deprecated 現在は使用していない
     */
    public removeGyroscopeFunction(): void {
        // 将来的にジャイロスコープ機能が必要になった場合のために
        // メソッドのシグネチャは残しておく
        console.warn("Gyroscope functionality is not implemented");
    }
}
