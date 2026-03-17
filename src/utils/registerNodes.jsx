import { CONFIG } from "./config.js";

// 注册X6自定义节点
export function registerX6Nodes(X6) {
  // (1) 变压器-双绕组变压器图标(2个圆圈)
  X6.Graph.registerNode("trafo-dual-winding", {
    inherit: "rect",
    width: 60,
    height: 60,
    markup: [
      { tagName: "rect", selector: "body" },
      { tagName: "circle", selector: "c_top" },
      { tagName: "circle", selector: "c_bottom" },
      { tagName: "text", selector: "label" },
    ],
    attrs: {
      body: { fill: "none", stroke: "none" },
      c_top: { r: 12, cx: 30, cy: 18, fill: "none", strokeWidth: 2 },
      c_bottom: { r: 12, cx: 30, cy: 36, fill: "none", strokeWidth: 2 },
      label: {
        fontSize: 12,
        fill: "#fff",
        fontWeight: "bold",
        textAnchor: "start",
        refX: 65,
        refY: "50%",
      },
    },
  });

  // (2) 变压器-3绕组变压器图标(3个圆圈)
  X6.Graph.registerNode("trafo-three-winding", {
    inherit: "rect",
    width: 60,
    height: 60,
    markup: [
      { tagName: "rect", selector: "body" },
      { tagName: "circle", selector: "c_top" },
      { tagName: "circle", selector: "c_left" },
      { tagName: "circle", selector: "c_right" },
      { tagName: "text", selector: "label" },
    ],
    attrs: {
      body: { fill: "none", stroke: "none" },
      c_top: { r: 12, cx: 30, cy: 18, fill: "none", strokeWidth: 2 },
      c_left: { r: 12, cx: 20, cy: 36, fill: "none", strokeWidth: 2 },
      c_right: { r: 12, cx: 40, cy: 36, fill: "none", strokeWidth: 2 },
      label: {
        fontSize: 12,
        fill: "#fff",
        fontWeight: "bold",
        textAnchor: "start",
        refX: 65,
        refY: "50%",
      },
    },
  });

  // (3) 开关节点：联络开关
  X6.Graph.registerNode("switch-liaison", {
    inherit: "rect",
    width: 14,
    height: 42,
    attrs: {
      body: {
        fill: (cell) => {
          const voltage = cell.getData()?.vn_kv;
          return voltage === 220
            ? "#C000C0"
            : voltage === 110
            ? "#008000"
            : voltage === 35
            ? "#FFCC00"
            : "#B94842";
        },
        stroke: "none",
        rx: 0,
        ry: 0,
      },
      label: {
        fontSize: 11,
        fill: "#ddd",
        refY: 48,
        refX: 7,
        textAnchor: "middle",
        lineHeight: 12,
        fontFamily: "Arial",
      },
    },
  });
  
  // (4) 开关节点：分段开关
  X6.Graph.registerNode("switch-section", {
    inherit: "rect",
    width: 14,
    height: 42,
    attrs: {
      body: {
        fill: "none",
        stroke: (cell) => {
          const voltage = cell.getData()?.vn_kv;
          return voltage === 220
            ? "#C000C0"
            : voltage === 110
            ? "#008000"
            : voltage === 35
            ? "#FFCC00"
            : "#B94842";
        },
        strokeWidth: 2,
        rx: 1,
        ry: 1,
      },
      label: {
        fontSize: 11,
        fill: "#ddd",
        refY: 48,
        refX: 7,
        textAnchor: "middle",
        lineHeight: 12,
        fontFamily: "Arial",
      },
    },
  });

  // (4) 叶子节点母线 (短横杠)
  X6.Graph.registerNode("leaf-terminal", {
    inherit: "rect",
    width: 14,
    height: 3,
    attrs: {
      body: {
        fill: (cell) => {
          const voltage = cell.getData()?.vn_kv;
          return voltage === 220
            ? "#C000C0"
            : voltage === 110
            ? "#008000"
            : voltage === 35
            ? "#FFCC00"
            : "#B94842";
        },
        stroke: "none",
      },
      label: {
        fontSize: 12,
        fill: "#eee",
        refY: 15,
        refX: 8,
        textAnchor: "start",
        style: {
          writingMode: "vertical-rl",
          textOrientation: "mixed",
          letterSpacing: "1px",
        },
      },
    },
  });
}
