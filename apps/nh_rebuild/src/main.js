(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [792],
  {
    // ... 前回までのモジュール ...

    // URL Parsing Module
    9960: (e, t, r) => {
      "use strict";
      Object.defineProperty(t, "__esModule", { value: !0 });
      Object.defineProperty(t, "parseRelativeUrl", {
        enumerable: !0,
        get: function () {
          return a;
        },
      });

      let n = r(8407),
        o = r(7139);

      function a(e, t, r = !0) {
        let a = new URL((0, n.getLocationOrigin)()),
          i = t
            ? new URL(t, a)
            : e.startsWith(".")
            ? new URL(window.location.href)
            : a,
          {
            pathname: l,
            searchParams: u,
            search: s,
            hash: c,
            href: f,
            origin: d,
          } = new URL(e, i);

        if (d !== a.origin)
          throw Object.defineProperty(
            Error("invariant: invalid relative URL, router received " + e),
            "__NEXT_ERROR_CODE",
            { value: "E159", enumerable: !1, configurable: !0 }
          );

        return {
          pathname: l,
          query: r ? (0, o.searchParamsToUrlQuery)(u) : void 0,
          search: s,
          hash: c,
          href: f.slice(d.length),
        };
      }
    },

    // Router HOC Module
    8538: (e, t, r) => {
      "use strict";
      Object.defineProperty(t, "__esModule", { value: !0 });
      Object.defineProperty(t, "default", {
        enumerable: !0,
        get: function () {
          return a;
        },
      });

      r(4252);
      let n = r(7876);
      r(4232);
      let o = r(8253);

      function a(e) {
        function t(t) {
          return (0, n.jsx)(e, {
            router: (0, o.useRouter)(),
            ...t,
          });
        }
        return (
          (t.getInitialProps = e.getInitialProps),
          (t.origGetInitialProps = e.origGetInitialProps),
          t
        );
      }
    },

    // Event Emitter Module
    8460: (e, t) => {
      "use strict";
      function r() {
        let e = Object.create(null);
        return {
          on(t, r) {
            (e[t] || (e[t] = [])).push(r);
          },
          off(t, r) {
            e[t] && e[t].splice(e[t].indexOf(r) >>> 0, 1);
          },
          emit(t, ...r) {
            (e[t] || []).slice().map((e) => {
              e(...r);
            });
          },
        };
      }
      Object.defineProperty(t, "__esModule", { value: !0 });
      Object.defineProperty(t, "default", {
        enumerable: !0,
        get: function () {
          return r;
        },
      });
    },

    // Browser Support Module
    877: (e) => {
      "use strict";
      e.exports = [
        "chrome 64",
        "edge 79",
        "firefox 67",
        "opera 51",
        "safari 12",
      ];
    },

    // Client Entry Point
    2193: (e, t, r) => {
      "use strict";
      Object.defineProperty(t, "__esModule", { value: !0 });
      r(6919);

      let n = r(6656);

      window.next = {
        version: n.version,
        get router() {
          return n.router;
        },
        emitter: n.emitter,
      };

      (0, n.initialize)({})
        .then(() => (0, n.hydrate)())
        .catch(console.error);
    },
  },
]);
