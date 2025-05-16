import { expect } from "@std/expect";
import { beforeEach, describe, it } from "@std/testing/bdd";
import { InteractionManager } from "./InteractionManager.ts";

// DOMのモック
class MockElement {
  listeners: { [key: string]: ((event: any) => void)[] } = {};
  clientWidth = 800;
  clientHeight = 600;

  addEventListener(type: string, listener: (event: any) => void) {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    this.listeners[type].push(listener);
  }

  removeEventListener(type: string, listener: (event: any) => void) {
    if (this.listeners[type]) {
      this.listeners[type] = this.listeners[type].filter((l) => l !== listener);
    }
  }

  dispatchEvent(type: string, event: any) {
    if (this.listeners[type]) {
      this.listeners[type].forEach((listener) => listener(event));
    }
  }
}

describe("InteractionManager", () => {
  let element: MockElement;
  let interactionManager: InteractionManager;

  beforeEach(() => {
    element = new MockElement();
    interactionManager = new InteractionManager(
      element as unknown as HTMLElement,
    );
  });

  it("マウス操作のテスト", () => {
    // マウスダウンイベント
    element.dispatchEvent("mousedown", {
      clientX: 100,
      clientY: 100,
      preventDefault: () => {},
    });

    // マウス移動イベント
    element.dispatchEvent("mousemove", {
      clientX: 150,
      clientY: 150,
      preventDefault: () => {},
    });

    const pos = interactionManager.getMousePosition();
    const delta = interactionManager.getMouseDelta();

    expect(pos.x).toBeDefined();
    expect(pos.y).toBeDefined();
    expect(delta.x).toBeDefined();
    expect(delta.y).toBeDefined();

    // マウスアップイベント
    element.dispatchEvent("mouseup", {
      clientX: 150,
      clientY: 150,
      preventDefault: () => {},
    });
  });

  it("タッチ操作のテスト", () => {
    // タッチスタートイベント
    element.dispatchEvent("touchstart", {
      touches: [{
        clientX: 100,
        clientY: 100,
      }],
      preventDefault: () => {},
    });

    // タッチムーブイベント
    element.dispatchEvent("touchmove", {
      touches: [{
        clientX: 150,
        clientY: 150,
      }],
      preventDefault: () => {},
    });

    const pos = interactionManager.getMousePosition();
    const delta = interactionManager.getMouseDelta();

    expect(pos.x).toBeDefined();
    expect(pos.y).toBeDefined();
    expect(delta.x).toBeDefined();
    expect(delta.y).toBeDefined();

    // タッチエンドイベント
    element.dispatchEvent("touchend", {
      touches: [],
      preventDefault: () => {},
    });
  });

  it("リソースの解放", () => {
    // disposeメソッドが例外を投げないことを確認
    expect(() => interactionManager.dispose()).not.toThrow();

    // Check that all listener arrays for registered event types are empty
    for (const type in element.listeners) {
      expect(element.listeners[type].length).toBe(0);
    }
  });
});
