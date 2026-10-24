# 线性代数计算器

一个运行于浏览器的线性代数计算工具，支持精确分数运算与浮点运算两种模式，覆盖行列式、矩阵运算、求逆、求秩与线性方程组求解，并逐步展示计算过程。

## 功能特性

- **九种运算**：行列式、转置、数乘、加法、减法、乘法、求逆、求秩、求解 Ax = b
- **两种计算模式**：
  - 精确分数 —— 基于分数运算，结果无舍入误差（如 `1/3` 显示为分数）
  - 浮点小数 —— 可自定义 2~10 位小数精度
- **计算步骤**：每个运算都给出化简/求解过程，适合学习与验算
- **方程组完整判定**：唯一解、无穷多解（给出特解与自由变量）、无解
- **灵活的矩阵输入**：
  - 支持 1×1 到 10×10 规模，空单元格视为 0
  - 可直接粘贴空格/逗号分隔、MATLAB（`[1 2; 3 4]`）或 LaTeX（`\begin{matrix}`）格式的矩阵
  - 一键填充单位矩阵、零矩阵，或清空
- **例题预设**：内置常见例题，一键载入
- **结果操作**：一键复制结果、把结果回填到矩阵 A 继续计算

## 技术栈

- [React](https://react.dev/) 18 + [TypeScript](https://www.typescriptlang.org/) 5
- [Vite](https://vitejs.dev/) 5 构建，[Vitest](https://vitest.dev/) 单元测试
- 计算核心（`src/engine/`）与界面解耦，可独立复用

## 快速开始

环境要求：Node.js 18+。

```bash
# 安装依赖
npm install

# 启动开发服务器（http://localhost:5173）
npm run dev

# 构建生产版本（输出到 dist/）
npm run build

# 本地预览构建产物
npm run preview

# 运行单元测试
npm test
```

## 使用说明

1. 在「矩阵 A」中输入矩阵（二元运算或解方程时会出现「矩阵 B」/「常数向量 b」输入框）
2. 选择运算（数乘需额外填写标量 k）
3. 点击「计算」，右侧面板展示结果与计算步骤
4. 可随时切换「精确分数 / 浮点小数」模式重新计算

## 项目结构

```
src/
├── App.tsx              # 主界面与交互逻辑
├── main.tsx             # 应用入口
├── styles.css           # 样式
├── components/
│   ├── MatrixInput.tsx  # 矩阵输入组件（编辑、缩放、粘贴导入）
│   └── ResultPanel.tsx  # 结果与步骤展示组件
└── engine/              # 计算核心（与 UI 解耦，含单元测试）
    ├── compute.ts       # 统一计算入口与校验
    ├── ops.ts           # 各运算实现（附计算步骤）
    ├── fraction.ts      # 分数类型与四则运算
    ├── ring.ts          # 分数/浮点统一的运算抽象
    ├── matrix.ts        # 矩阵格式化与工具函数
    ├── parse.ts         # 单元格与标量解析
    ├── importText.ts    # 粘贴文本导入（MATLAB / LaTeX 等）
    ├── examples.ts      # 例题预设
    ├── grid.ts          # 表格状态工具
    └── types.ts         # 公共类型定义
```

## 许可证

暂未设置。如需开源发布，建议添加 [MIT](https://choosealicense.com/licenses/mit/) 或其他许可证。
