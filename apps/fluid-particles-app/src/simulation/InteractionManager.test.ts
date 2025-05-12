import { assertEquals, assertInstanceOf } from "jsr:@std/assert@^0.218.2";
import { describe, it } from "jsr:@std/testing@^0.218.2/bdd";
import { InteractionManager } from "./InteractionManager.ts";
import * as THREE from "npm:three";

describe("InteractionManager", () => {
  it("マウス操作のテスト", () => {
    // テスト用のHTML要素を作成
    const element = document.createElement("div");
    const manager = new InteractionManager(element);

    // 初期状態のテスト
    const initialPos = manager.getMousePosition();
    assertEquals(initialPos.x, 0);
    assertEquals(initialPos.y, 0);

    // マウス移動のシミュレーション
    const mouseEvent = new MouseEvent("mousemove", {
      clientX: window.innerWidth / 2,
      clientY: window.innerHeight / 2,
    });
    element.dispatchEvent(mouseEvent);

    // 移動後の位置を確認
    const pos = manager.getMousePosition();
    assertEquals(pos.x, 0); // 中心なので0
    assertEquals(pos.y, 0); // 中心なので0

    // マウスボタン押下のシミュレーション
    const mouseDownEvent = new MouseEvent("mousedown");
    element.dispatchEvent(mouseDownEvent);

    // マウスボタンが押されている状態でのデルタを確認
    const delta = manager.getMouseDelta();
    assertInstanceOf(delta, THREE.Vector2);

    // リソースの解放
    manager.dispose();
  });

  it("タッチ操作のテスト", () => {
    // テスト用のHTML要素を作成
    const element = document.createElement("div");
    const manager = new InteractionManager(element);

    // タッチ開始のシミュレーション
    const touchStartEvent = new TouchEvent("touchstart", {
      touches: [
        {
          clientX: window.innerWidth / 2,
          clientY: window.innerHeight / 2,
        } as Touch,
      ],
    });
    element.dispatchEvent(touchStartEvent);

    // タッチ移動のシミュレーション
    const touchMoveEvent = new TouchEvent("touchmove", {
      touches: [
        {
          clientX: (window.innerWidth / 4) * 3, // 右に移動
          clientY: window.innerHeight / 2,
        } as Touch,
      ],
    });
    element.dispatchEvent(touchMoveEvent);

    // 移動後のデルタを確認
    const delta = manager.getMouseDelta();
    assertInstanceOf(delta, THREE.Vector2);

    // タッチ終了のシミュレーション
    const touchEndEvent = new TouchEvent("touchend");
    element.dispatchEvent(touchEndEvent);

    // タッチ終了後のデルタが0になることを確認
    const finalDelta = manager.getMouseDelta();
    assertEquals(finalDelta.x, 0);
    assertEquals(finalDelta.y, 0);

    // リソースの解放
    manager.dispose();
  });
});
