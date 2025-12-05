# JAX-FEM 核心设计理念：基于“弱形式拆解”的使用方法

JAX-FEM 的设计理念并非为某一个特定的物理问题（如线弹性）定制，而是为了解决一类广泛的偏微分方程。要理解其核函数（Kernel System）的设计，我们需要跳出具体的物理背景，从**变分法**和**弱形式**的数学结构入手。

简而言之，JAX-FEM 将所有的物理问题抽象为两类核心算子的组合。

## 1. 它是如何看待世界的：通用方程

在 JAX-FEM 的视角里，绝大多数物理平衡问题（无论力学、热学还是流体）都可以归纳为以下这个**通用 PDE 形式**：

$$
-\nabla \cdot \mathbf{A}(\boldsymbol{u}, \nabla \boldsymbol{u}, \boldsymbol{x}) + \mathbf{c}(\boldsymbol{u}, \nabla \boldsymbol{u}, \boldsymbol{x}) = \boldsymbol{f}
$$

为了在计算机上求解，我们需要将其转化为积分形式（即**弱形式**）。我们在方程两边乘以测试函数 $v$，并在全域积分。
关键的一步来了：对于第一项（散度项），我们运用分部积分（高斯定理），将微分算子转移到测试函数上。

最终，求解器真正面对的方程结构是这样的：

$$
\underbrace{\int_{\Omega} \mathbf{A}(\boldsymbol{u}, \nabla \boldsymbol{u}, \boldsymbol{x}) : \nabla \boldsymbol{v} \, dx}_{\text{Part 1: Tensor Map}} + \underbrace{\int_{\Omega} \mathbf{c}(\boldsymbol{u}, \nabla \boldsymbol{u}, \boldsymbol{x}) \cdot \boldsymbol{v} \, dx}_{\text{Part 2: Mass Map}} = \text{External Work}
$$

这个公式解释了一切。JAX-FEM 的设计哲学就是**对上述两个积分项的直接映射**。

## 2. 两大核心支柱：Tensor Map 与 Mass Map

为了描述任意物理过程，用户只需要定义公式中的 $\mathbf{A}$ 和 $\mathbf{c}$。框架根据**测试函数的形式**（是配对 $\nabla v$ 还是配对 $v$），将它们划分为两类核函数。

### (1) Tensor Map (`get_tensor_map`)
*   **数学对应**：对应公式中的 $\mathbf{A}(\boldsymbol{u}, \nabla \boldsymbol{u}, \boldsymbol{x})$。
*   **配对对象**：在积分中，它总是与测试函数的梯度 **$\nabla v$** 进行内积。
*   **物理意义**：通常代表通过边界传递的量，即 **“通量” (Flux)** 或 **“应力” (Stress)**。
    *   它描述了物理量在空间中的传递、扩散或抵抗变形的能力。
*   **典型例子**：
    *   **固体力学**：应力张量 $\boldsymbol{\sigma}$ （$A = \sigma$）。
    *   **热传导**：热通量 $\boldsymbol{q}$ （$A = -k\nabla T$）。
    *   **静电场**：电位移矢量 $\boldsymbol{D}$。

### (2) Mass Map (`get_mass_map`)
*   **数学对应**：对应公式中的 $\mathbf{c}(\boldsymbol{u}, \nabla \boldsymbol{u}, \boldsymbol{x})$。
*   **配对对象**：在积分中，它总是直接与测试函数 **$v$** 进行点积。
*   **物理意义**：通常代表在体积内部产生或消耗的量，即 **“源项” (Source)**、**“反应项”** 或 **“体积力”**。
    *   它描述了物质内部的生成、转化、惯性或对流效应。
*   **典型例子**：
    *   **动力学**：惯性项 $\rho \ddot{u}$。
    *   **化学/生物**：反应项 $R(u)$。
    *   **流体力学**：对流项 $\mathbf{v} \cdot \nabla u$（注意：虽然包含梯度，但它不通过分部积分转移，所以属于 Mass Map）。
    *   **瞬态问题**：时间导数项 $\frac{\partial u}{\partial t}$。



## 3. 全局信息的自由流动

这套设计在使用的时候，一个重要细节是：**不要被名字迷惑**。

虽然 `Tensor Map` 通常处理梯度相关项（如胡克定律），而 `Mass Map` 通常处理值相关项（如反应速率），但 JAX-FEM 在实现上给予了极大的自由度。

**这两个核函数都拥有“全知全能”的输入权限：**
$$
f(\boldsymbol{u}, \nabla \boldsymbol{u}, \boldsymbol{x}) \to \text{Output}
$$
这意味着：
*   你可以在 `Tensor Map` 中使用 $u$（例如：随温度变化的导热系数 $k(T) \nabla T$）。
*   你可以在 `Mass Map` 中使用 $\nabla u$（例如：流体对流项 $\mathbf{v} \cdot \nabla u$）。

**分类的唯一标准，仅仅是看你想让这一项在积分时乘 $\nabla v$ 还是乘 $v$。**



## 4. 这种设计带来了什么？

理解了这套数学结构，就能明白 JAX-FEM 为什么这样设计接口：

1.  **物理与数值的完美解耦**
    作为用户，不需要关心“刚度矩阵”怎么组装，也不需要关心“高斯积分”怎么做。你只需要关注物理本构，**给定状态，返回应力或源项**：
    > 给我该点的状态（$u, \nabla u$），我告诉你该点的应力（Tensor）或源项（Mass）。

2.  **自动微分的基石**
    因为 $\mathbf{A}$ 和 $\mathbf{c}$ 被定义为纯粹的数学函数，JAX 就可以利用自动微分（AD）技术：
    *   对残差求导 $\frac{\partial R}{\partial u}$，**自动生成**切线刚度矩阵。
    *   这使得从线性问题切换到高度非线性问题（如超弹性、塑性），代码结构几乎不需要任何改变。

3.  **极简的扩展性**
    想要添加一个新的物理场？
    *   如果是扩散类的（如热传导），写个 `get_tensor_map`。
    *   如果是反应类的（如化学），写个 `get_mass_map`。
    *   如果是耦合的，把它们放在一起。
    框架会自动处理剩下的所有事情。


这就是 JAX-FEM 的核心逻辑：**通过标准化的弱形式拆解，实现物理建模的模块化与可微化。**




## 5. 实战指南：如何处理复杂的 PDE 项

下面通过几个具体的物理场景，看看如何将 PDE 拆解到这两个核函数中。

### 案例 A：非线性扩散（依赖 $u$ 的扩散系数）

**方程**：

$$
-\nabla \cdot (k(u)\nabla u) = f
$$

- **分析**：这一项被散度算子 $-\nabla \cdot$ 包裹。在弱形式中，它将变为 $\int k(u)\nabla u \cdot \nabla v$。
    
- **归属**：因为与 $\nabla v$ 乘，所以属于 **Tensor Map**。
    
- **代码逻辑**：
    
    ```python
    def get_tensor_map(self):
        def flux(u, u_grad, x):
            # 在 Tensor Map 中读取 u 来计算系数
            k = 1.0 + u**2 
            return k * u_grad
        return flux
    ```
    

### 案例 B：对流项（包含 $\nabla u$ 的源项）

**方程**：

$$
\mathbf{a} \cdot \nabla u = f
$$

（$\mathbf{a}$ 为速度向量）

- **分析**：这一项没有被散度包裹。在弱形式中，它是 $\int (\mathbf{a} \cdot \nabla u)v$。
    
- **归属**：因为与 $v$ 乘，所以属于 **Mass Map**。即便它包含梯度 $\nabla u$，它依然属于 Mass Map。
    
- **代码逻辑**：
    
    ```python
    def get_mass_map(self):
        def convection(u, u_grad, x):
            # 在 Mass Map 中读取 u_grad 来计算对流
            velocity = np.array([1.0, 0.0, 0.0])
            return np.dot(velocity, u_grad)
        return convection
    ```
    

### 案例 C：反应项与双势阱

**方程**：

$$
u^3 - u = 0
$$

- **分析**：纯代数项。弱形式为 $\int (u^3 - u)v$。
    
- **归属**：与 $v$ 乘，属于 **Mass Map**。
    
- **代码逻辑**：
    
    ```python
    def get_mass_map(self):
        def reaction(u, u_grad, x):
            return u**3 - u
        return reaction
    ```
    

---

## 6. 总结表：PDE 项归类速查

在面对一个陌生的 PDE 项时，可以参照下表决定将其放入哪个核函数：

| PDE 中的项                               | 弱形式中的配对         | 应放入的核函数     | 理由                                         |
| ---------------------------------------- | ---------------------- | ------------------ | -------------------------------------------- |
| $-\nabla \cdot (k\nabla u)$              | $\dots \cdot \nabla v$ | **get_tensor_map** | 经过分部积分，配对 $\nabla v$                |
| $-\nabla \cdot (k(u)\nabla u)$           | $\dots \cdot \nabla v$ | **get_tensor_map** | 即使系数依赖 $u$，依然配对 $\nabla v$        |
| $\mathbf{a} \cdot \nabla u$ (对流)       | $\dots \cdot v$        | **get_mass_map**   | 没有分部积分，配对 $v$ (即使依赖 $\nabla u$) |
| $cu^2$ (反应)                            | $\dots \cdot v$        | **get_mass_map**   | 直接配对 $v$                                 |
| $\frac{\partial u}{\partial t}$ (时间项) | $\dots \cdot v$        | **get_mass_map**   | 直接配对 $v$                                 |

**核心要点：**  
**被散度包裹的进 Tensor Map，裸露在外面的进 Mass Map。两者都可以随意调用 $u$ 和 $\nabla u$ 的数据。**

下面我重点分析了官方文档中三个最典型的例子：**线弹性（Linear Elasticity）**、**超弹性（Hyperelasticity）** 以及 **J2塑性（J2 Plasticity）**。

JAX-FEM 的代码结构非常标准化，通过这三个例子，可以清晰地理解其背后的 FEM（有限元方法）算法逻辑以及如何利用 JAX 的自动微分特性来简化物理建模。

一般而言，使用 JAX-FEM 解决问题分为几个核心步骤：

1. **导入相关库**。
    
2. **定义问题的弱形式（核函数，Kernel）**：这是最核心的部分。
    
3. **定义边界条件（Boundary Conditions）**。
    
4. **求解与后处理**。
    

下面我将分三个案例详细拆解这些步骤。



<!-- TAB_BREAK: 线弹性 -->


# JAX-FEM - 1 ：线弹性问题的数学原理与代码实现

在有限元分析（FEM）中，线弹性问题是最基础也是最重要的入门案例。虽然 JAX-FEM 的代码看起来非常简洁，只有短短几十行，但其背后隐藏了完整的连续介质力学与变分原理。我们从这里开始，深入理解 JAX-FEM 的工作原理。

## 1. 从强形式到弱形式：为什么？怎么推？

### 1.1 强形式 (Strong Form)

对于一个占据空间 $\Omega$ 的弹性体，在忽略惯性力（准静态）的情况下，其控制方程（平衡方程）的**强形式**如下：

$$
-\nabla \cdot \boldsymbol{\sigma} = \boldsymbol{b} \quad \text{in } \Omega
$$

其中：
*   $\boldsymbol{\sigma}$ 是二阶柯西应力张量（Stress Tensor）。
*   $\boldsymbol{b}$ 是体力向量（Body Force，例如重力，本例中忽略，设为0）。
*   $\nabla \cdot$ 是散度算子。

**边界条件 (Boundary Conditions, BCs)**：
我们需要使得方程有唯一解，必须定义边界：
1.  **Dirichlet 边界（本质边界条件）** $\Gamma_D$：规定了位移。
    $$ \boldsymbol{u} = \boldsymbol{u}_D \quad \text{on } \Gamma_D $$
    （本例中，悬臂梁左端固定，即 $\boldsymbol{u}=\boldsymbol{0}$）。
2.  **Neumann 边界（自然边界条件）** $\Gamma_N$：规定了面力（Traction）。
    $$ \boldsymbol{\sigma} \cdot \boldsymbol{n} = \boldsymbol{t} \quad \text{on } \Gamma_N $$
    其中 $\boldsymbol{n}$ 是边界外法线方向，$\boldsymbol{t}$ 是表面受到的力向量。（本例中，悬臂梁右端受到向上的拉力）。

### 1.2 为什么要用弱形式？

强形式要求方程在定义域内的**每一个点**都严格成立。这对数值计算非常不友好，原因如下：
1.  **连续性要求太高**：强形式中包含二阶导数（因为 $\sigma \sim \nabla u$，而方程又是 $\nabla \cdot \sigma$，所以是 $\nabla \cdot \nabla u$）。这意味着位移函数必须二阶连续可导，根本无法满足强形式。
2.  **复杂几何难以求解**：对于任意形状的物体，寻找满足逐点平衡的解析解几乎不可能。

**弱形式（Weak Form）** 的思想是：我不要求方程在每一个点都严格为0，我只要求它在整个域上的**加权平均**为0。这样就降低了对解的光滑性要求，使得分段多项式（有限元）成为可能。

### 1.3 弱形式的严格推导

这是理解 JAX-FEM 核函数（Kernel）的关键步骤。

**第一步：加权积分**
在平衡方程两边同时点乘一个**测试函数（Test Function）** $\boldsymbol{v}$（也称为虚位移），并在整个体积 $\Omega$ 上积分：

$$
-\int_{\Omega} (\nabla \cdot \boldsymbol{\sigma}) \cdot \boldsymbol{v} \, dx = \int_{\Omega} \boldsymbol{b} \cdot \boldsymbol{v} \, dx
$$

这里要求测试函数 $\boldsymbol{v}$ 在 Dirichlet 边界 $\Gamma_D$ 上为 0。

**第二步：分部积分（利用高斯散度定理）**
这是最神奇的一步。利用向量恒等式 $\nabla \cdot (\boldsymbol{\sigma}^T \boldsymbol{v}) = (\nabla \cdot \boldsymbol{\sigma}) \cdot \boldsymbol{v} + \boldsymbol{\sigma} : \nabla \boldsymbol{v}$（其中 $:$ 表示双点积，即张量内积），我们可以将左边的项重写。

根据高斯散度定理 $\int_\Omega \nabla \cdot \boldsymbol{A} \, dx = \int_{\partial\Omega} \boldsymbol{A} \cdot \boldsymbol{n} \, ds$，我们有：

$$
\int_{\Omega} (\nabla \cdot \boldsymbol{\sigma}) \cdot \boldsymbol{v} \, dx = \int_{\partial\Omega} (\boldsymbol{\sigma} \cdot \boldsymbol{n}) \cdot \boldsymbol{v} \, ds - \int_{\Omega} \boldsymbol{\sigma} : \nabla \boldsymbol{v} \, dx
$$

将这个式子代回第一步的积分方程中：

$$
-\left( \int_{\partial\Omega} (\boldsymbol{\sigma} \cdot \boldsymbol{n}) \cdot \boldsymbol{v} \, ds - \int_{\Omega} \boldsymbol{\sigma} : \nabla \boldsymbol{v} \, dx \right) = \int_{\Omega} \boldsymbol{b} \cdot \boldsymbol{v} \, dx
$$

整理一下，把含有 $\boldsymbol{\sigma}$ 的体积分项移到左边：

$$
\int_{\Omega} \boldsymbol{\sigma} : \nabla \boldsymbol{v} \, dx = \int_{\Omega} \boldsymbol{b} \cdot \boldsymbol{v} \, dx + \int_{\partial\Omega} (\boldsymbol{\sigma} \cdot \boldsymbol{n}) \cdot \boldsymbol{v} \, ds
$$

**第三步：引入边界条件**
边界 $\partial\Omega$ 分为两部分：$\Gamma_D$ 和 $\Gamma_N$。
*   在 $\Gamma_D$ 上，我们规定测试函数 $\boldsymbol{v} = \boldsymbol{0}$，所以这一部分的面积分为 0。
*   在 $\Gamma_N$ 上，根据 Neumann 边界条件，我们知道 $\boldsymbol{\sigma} \cdot \boldsymbol{n} = \boldsymbol{t}$。

于是，我们得到了最终的**弱形式**：

$$
\underbrace{\int_{\Omega} \boldsymbol{\sigma}(\boldsymbol{u}) : \nabla \boldsymbol{v} \, dx}_{\text{内部虚功 (Internal Virtual Work)}} = \underbrace{\int_{\Omega} \boldsymbol{b} \cdot \boldsymbol{v} \, dx + \int_{\Gamma_N} \boldsymbol{t} \cdot \boldsymbol{v} \, ds}_{\text{外部虚功 (External Virtual Work)}}
$$

这个公式就是 JAX-FEM 求解器要解决的核心方程。

---

## 2. 本构关系：胡克定律

弱形式左边的积分项中，$\boldsymbol{\sigma}$ 是未知的。我们需要通过**本构方程**将应力 $\boldsymbol{\sigma}$ 与位移 $\boldsymbol{u}$ 联系起来。

对于线弹性材料：
1.  **几何方程（应变-位移关系）**：
    $$ \boldsymbol{\epsilon} = \frac{1}{2} (\nabla \boldsymbol{u} + (\nabla \boldsymbol{u})^T) $$
2.  **物理方程（应力-应变关系，胡克定律）**：
    $$ \boldsymbol{\sigma} = \lambda \text{tr}(\boldsymbol{\epsilon})\boldsymbol{I} + 2\mu\boldsymbol{\epsilon} $$

其中：
*   $\lambda, \mu$ 是拉梅常数（Lame parameters），由杨氏模量 $E$ 和泊松比 $\nu$ 算出。
*   $\text{tr}(\boldsymbol{\epsilon})$ 是应变张量的迹（体积应变）。
*   $\boldsymbol{I}$ 是单位张量。



## 3. 代码实现详解

JAX-FEM 的框架非常巧妙。作为用户，我们不需要去写那个积分号 $\int$，因为有限元框架会自动处理网格上的数值积分。**我们需要提供的，仅仅是积分号里面的“核函数”（Kernel）。**

### 3.1 定义体积分核 (`get_tensor_map`)

回顾弱形式左边项：$\int_{\Omega} \boldsymbol{\sigma} : \nabla \boldsymbol{v} \, dx$。
在数学上，这是一个双线性形式 $a(u, v)$。JAX-FEM 将其通用化为求解形如 $-\nabla \cdot f(\nabla u) = \dots$ 的方程。
在这里，我们需要定义从 **位移梯度** ($\nabla u$) 到 **应力** ($\sigma$) 的映射函数。

```python
# 1. 定义材料常数
E = 70e3
nu = 0.3
# 将工程常数转换为拉梅常数，对应公式中的 \mu 和 \lambda
mu = E/(2.*(1.+nu))
lmbda = E*nu/((1+nu)*(1-2*nu))

class LinearElasticity(Problem):
    def get_tensor_map(self):
        # 这个函数的输入 u_grad 就是 \nabla u (形状为 3x3 的矩阵)
        def stress(u_grad):
            # 对应几何方程：\epsilon = 0.5 * (\nabla u + \nabla u^T)
            epsilon = 0.5 * (u_grad + u_grad.T)
            
            # 对应本构方程：\sigma = \lambda * tr(\epsilon) * I + 2 * \mu * \epsilon
            # np.trace(epsilon) 计算迹
            # np.eye(self.dim) 生成单位矩阵 I
            sigma = lmbda * np.trace(epsilon) * np.eye(self.dim) + 2*mu*epsilon
            
            return sigma
        
        # 返回这个函数，JAX-FEM 会自动对其进行积分和微分操作
        return stress
```
**代码与公式的对应：**
*   `u_grad` $\leftrightarrow$ $\nabla \boldsymbol{u}$
*   `epsilon` $\leftrightarrow$ $\boldsymbol{\epsilon}$
*   `sigma` $\leftrightarrow$ $\boldsymbol{\sigma}$
*   JAX-FEM 会在后台自动拿这个 `sigma` 去和测试函数的梯度 $\nabla \boldsymbol{v}$ 做内积并积分。

### 3.2 定义表面力核 (`get_surface_maps`)

回顾弱形式右边的边界积分项：$\int_{\Gamma_N} \boldsymbol{t} \cdot \boldsymbol{v} \, ds$。
这一项代表了 Neumann 边界条件。我们需要定义 $\boldsymbol{t}$（Traction，面力向量）。

```python
    def get_surface_maps(self):
        # 定义面力函数
        # u: 当前位移（在这个简单的 Neumann 条件中未用到，但在从动力等复杂条件中可能用到）
        # x: 空间坐标
        def surface_map(u, x):
            # 返回向量 [0, 0, 100]，对应公式中的 t
            # 表示在 Z 轴方向施加 100 的面力
            return np.array([0., 0., 100.])
        
        return [surface_map]
```

**特别注意**：这里只定义了力的大小和方向。至于这个力具体加在哪个面上（$\Gamma_N$ 在哪？），是在后续的代码中通过 `problem = LinearElasticity(..., location_fns=...)` 指定的。在官方例子中，它是通过一个 lambda 函数判断坐标是否在梁的右端面来确定的。

### 3.3 为什么没有定义体积力？

不难发现，代码中没有处理 $\int_{\Omega} \boldsymbol{b} \cdot \boldsymbol{v} \, dx$ 这一项。
这是因为在这个例子中，假设忽略重力，即 $\boldsymbol{b} = [0, 0, 0]$。如果需要加重力，JAX-FEM 中通常会有类似 `get_mass_map` 或者直接在源项中定义对应的方法。


## 4. 总结：JAX-FEM 的抽象逻辑

通过线弹性这个例子，我们看清了 JAX-FEM 的核心抽象逻辑：

1.  **物理问题**：$-\nabla \cdot \boldsymbol{\sigma} = \boldsymbol{b}$
2.  **弱形式**：$\int \boldsymbol{\sigma} : \nabla \boldsymbol{v} \, dx = \int \boldsymbol{t} \cdot \boldsymbol{v} \, ds$
3.  **代码实现**：
    *   用户不写积分，只写被积函数的核心变量。
    *   `get_tensor_map` 定义 $\nabla \boldsymbol{u} \to \boldsymbol{\sigma}$ 的物理法则（本构）。
    *   `get_surface_maps` 定义 $\boldsymbol{t}$。
    *   `JAX` 的自动微分引擎会自动计算所需的雅可比矩阵（刚度矩阵），完成 `solve` 过程。

这种设计使得从线弹性扩展到超弹性、塑性变得非常容易——只要修改 `stress(u_grad)` 里面的数学公式即可，外层的积分框架完全不用动。

<!-- TAB_BREAK: 超弹性 -->

好的，接下来我们深入解析 JAX-FEM 文档中的第二个例子：**超弹性问题（Hyperelasticity）**。

如果说线弹性是有限元的“Hello World”，那么超弹性就是展示 JAX-FEM **自动微分（Automatic Differentiation）** 核心优势的最佳舞台。

---

# JAX-FEM 深度解析（二）：超弹性问题与自动微分

## 1. 物理背景：为什么不能用线弹性了？

### 1.1 大变形与非线性
线弹性理论建立在两个假设之上：
1.  **物理线性**：应力与应变成正比（胡克定律）。
2.  **几何线性**：变形非常小，小到可以忽略变形对几何形状的影响（即 $\boldsymbol{x} \approx \boldsymbol{X}$）。

但在橡胶、生物软组织等材料中，或者当结构发生 **大变形（Finite Deformation）** 时，上述假设失效：
*   **几何非线性**：位移很大，必须区分变形前（参考构型 $\Omega_0$）和变形后（当前构型 $\Omega$）的状态。
*   **物理非线性**：应力-应变关系不再是直线的，通常由**应变能密度函数（Strain Energy Density Function）** $\Psi$ 来描述。

### 1.2 关键几何量：变形梯度
在超弹性中，核心的运动学量不再是微小应变 $\boldsymbol{\epsilon}$，而是**变形梯度张量（Deformation Gradient）** $\boldsymbol{F}$。

设 $\boldsymbol{X}$ 为物质点在参考构型的位置，$\boldsymbol{x} = \boldsymbol{X} + \boldsymbol{u}$ 为变形后的位置。
$$
\boldsymbol{F} = \frac{\partial \boldsymbol{x}}{\partial \boldsymbol{X}} = \boldsymbol{I} + \nabla \boldsymbol{u}
$$
其中 $\boldsymbol{I}$ 是单位矩阵，$\nabla \boldsymbol{u}$ 是位移梯度。

---

## 2. 强形式与弱形式

### 2.1 强形式 (Strong Form)
在参考构型（Lagrangian description）下，平衡方程通常写作：

$$
-\nabla \cdot \boldsymbol{P} = \boldsymbol{b} \quad \text{in } \Omega_0
$$

注意这里出现的应力 $\boldsymbol{P}$ 是 **第一类 Piola-Kirchhoff 应力张量 (1st PK Stress)**。
*   $\boldsymbol{P}$ 是非对称的。
*   它描述了当前构型中的力，相对于 **参考构型** 中的面积的分布情况。

### 2.2 弱形式 (Weak Form)
推导过程与线弹性几乎一致（乘以测试函数 $\boldsymbol{v}$，分部积分，应用高斯定理）。我们在参考构型 $\Omega_0$ 上积分：

$$
\int_{\Omega_0} \boldsymbol{P} : \nabla \boldsymbol{v} \, dX = \int_{\Omega_0} \boldsymbol{b} \cdot \boldsymbol{v} \, dX + \int_{\Gamma_N} \boldsymbol{t} \cdot \boldsymbol{v} \, dS
$$

看起来公式和线弹性 $\int \boldsymbol{\sigma} : \nabla \boldsymbol{v}$ 很像，因为他们的
结构是一样的。**区别在于应力 $\boldsymbol{P}$ 的计算方式变得极其复杂。**

---

## 3. 本构模型：Neo-Hookean 材料

在这个例子中，使用了**可压缩的 Neo-Hookean 模型**。超弹性材料的本构关系不是直接给出应力公式，而是先定义**应变能密度函数 $\Psi(\boldsymbol{F})$**。

### 3.1 能量函数公式
根据文档，能量函数定义如下：

$$
\Psi(\boldsymbol{F}) = \frac{\mu}{2} (J^{-2/3} I_1 - 3) + \frac{\kappa}{2} (J - 1)^2
$$

其中：
*   $J = \det(\boldsymbol{F})$：雅可比行列式，表示体积变化率（$J=1$ 表示不可压缩）。
*   $I_1 = \text{tr}(\boldsymbol{C}) = \text{tr}(\boldsymbol{F}^T \boldsymbol{F})$：右柯西-格林张量的第一不变量。
*   $\mu$：剪切模量。
*   $\kappa$：体积模量。

### 3.2 应力求导（最繁琐的一步）
我们要解若形式方程，需要的是应力 $\boldsymbol{P}$，而不是能量 $\Psi$。它们的关系是：

$$
\boldsymbol{P} = \frac{\partial \Psi}{\partial \boldsymbol{F}}
$$

**在传统的 FEM 编程中（如 C++ 或 Fortran）**，程序员必须手算这个导数。对于复杂的能量函数，推导 $\frac{\partial \Psi}{\partial \boldsymbol{F}}$ 极其繁琐且容易出错。你需要运用张量微积分，推导出类似这样的解析式：
$$ \boldsymbol{P} = \mu J^{-2/3} (\boldsymbol{F} - \frac{I_1}{3} \boldsymbol{F}^{-T}) + \kappa (J-1) J \boldsymbol{F}^{-T} $$
（这还只是简单的 Neo-Hookean，复杂的模型推导就更加艰难了）。

**在 JAX-FEM 中**，可以说这一步被自动微分彻底“降维打击”了。

---

## 4. 代码实现详解

JAX-FEM 利用 **JAX 的自动微分（AD）** 功能，让你**只定义能量 $\Psi$，不推导应力 $\boldsymbol{P}$**。

### 4.1 定义体积分核 (`get_tensor_map`)

我们需要定义映射：$\nabla \boldsymbol{u} \to \boldsymbol{P}$。

```python
class HyperElasticity(Problem):
    def get_tensor_map(self):

        # --- 步骤 1: 定义标量能量函数 Psi(F) ---
        def psi(F):
            # 材料参数
            E = 10.
            nu = 0.3
            mu = E / (2. * (1. + nu))
            kappa = E / (3. * (1. - 2. * nu))
            
            # 计算运动学量
            # J = det(F)
            J = np.linalg.det(F)
            # J^{-2/3}
            Jinv = J**(-2. / 3.)
            # I1 = tr(F.T @ F)
            I1 = np.trace(F.T @ F)
            
            # 能量密度公式（完全照抄数学公式）
            # energy = \mu/2 * (J^{-2/3}I_1 - 3) + \kappa/2 * (J-1)^2
            energy = (mu / 2.) * (Jinv * I1 - 3.) + (kappa / 2.) * (J - 1.)**2.
            return energy

        # --- 步骤 2: 自动微分求应力 ---
        # 关键一步
        # JAX 自动计算 P = d(Psi)/dF
        P_fn = jax.grad(psi)

        # --- 步骤 3: 定义从位移梯度到应力的完整映射 ---
        def first_PK_stress(u_grad):
            # 输入 u_grad 是位移梯度 \nabla u
            I = np.eye(self.dim)
            # 计算变形梯度 F = I + \nabla u
            F = u_grad + I
            
            # 调用自动微分生成的函数计算应力 P
            P = P_fn(F)
            return P

        return first_PK_stress
```

### 4.2 代码深度解析

1.  **`psi(F)`**: 只需要把物理中的能量公式翻译成 Python 代码。不需要考虑如何求导。
2.  **`jax.grad(psi)`**:
    *   `psi` 的输入是 $3\times3$ 矩阵 $\boldsymbol{F}$，输出是标量 Energy。
    *   `jax.grad` 会自动生成一个新的函数 `P_fn`。
    *   `P_fn` 的输入是 $\boldsymbol{F}$，输出是 $\nabla_{\boldsymbol{F}} \Psi$，即 $3\times3$ 的应力张量 $\boldsymbol{P}$。
    *   这一切都是在编译时完成的，执行效率极高。
3.  **`first_PK_stress`**: 这是最终传给 FEM 求解器的核。它完成了从 $\nabla \boldsymbol{u}$ 到 $\boldsymbol{F}$ 再到 $\boldsymbol{P}$ 的桥接。

### 4.3 为什么这比传统方法强？
*   **零推导成本**：如果你想换一个材料模型（比如 Mooney-Rivlin 或 Ogden 模型），你只需要改写 `psi` 函数那几行代码。不需要重新推导应力公式。
*   **不仅是一阶导**：求解非线性方程（牛顿-拉夫逊法）需要切线刚度矩阵（Tangent Stiffness Matrix），即应力对应变的导数（二阶导）。JAX-FEM 在求解器内部可以通过 `jax.jacfwd` 或 `jax.hessian` **再一次自动微分** 得到刚度矩阵。这意味着刚度矩阵也不用手写。

---

## 5. 边界条件设置

本例是一个纯位移控制的问题：
*   **右表面** ($\Gamma_{D1}, x=1$)：固定，$u=0$。
*   **左表面** ($\Gamma_{D2}, x=0$)：施加一个特定的位移场。

代码中通过 `get_dirichlet_topologies` 和 `get_dirichlet_bcs` 来设置。这里提到的复杂公式：

$$
u_{D2} = \begin{bmatrix} 0 \\ 0.5 + (x_2-0.5)\cos(\frac{\pi}{3}) - (x_3-0.5)\sin(\frac{\pi}{3}) - x_2 \\ \dots \end{bmatrix}
$$

这本质上是让左表面的点绕着中心轴旋转 60 度 ($\pi/3$) 并发生扭转。

由于是 Dirichlet 边界条件，它们不出现在弱形式的积分项中（或者说，对应的测试函数 $v$ 在边界上为 0，使得边界积分项消失），而是直接强行约束解向量的值。

---

## 6. 总结：超弹性问题

通过这个例子，我们理解了：

1.  **物理上**：超弹性处理大变形，需要使用 $\boldsymbol{P}$ (1st Piola-Kirchhoff) 应力和 $\boldsymbol{F}$ (变形梯度)。
2.  **数学上**：应力是能量函数的导数 $\boldsymbol{P} = \partial \Psi / \partial \boldsymbol{F}$。
3.  **JAX-FEM 实现上**：
    *   利用 `jax.grad` 自动从能量函数得到应力函数。
    *   避免了繁琐且易错的张量求导推导。
    *   弱形式的积分结构 $\int \boldsymbol{P}:\nabla \boldsymbol{v}$ 与线弹性保持高度一致，体现了框架的通用性。

接下来，我们将进入最复杂的**弹塑性问题**，那里不仅有非线性，还有历史依赖性（状态变量更新）。

这是一个非常关键的问题。如果不理解为什么要用**牛顿-拉夫逊法（Newton-Raphson Method）**，就无法理解非线性有限元的本质，也无法体会 JAX-FEM 这种基于自动微分的框架到底“厉害”在哪里。

这一节我们将专门讲解：**线性与非线性的本质区别**，以及**牛顿-拉夫逊法是如何求解非线性问题的**。

---

# 二·附录 ：什么是非线性求解与牛顿-拉夫逊法

在上一节的**线弹性**问题中，我们似乎只要把方程列出来，程序一下就解出来了，只用了一步。
但在**超弹性**（以及后面的弹塑性）问题中，求解器必须像剥洋葱一样，一层一层地通过迭代逼近真解。这就是牛顿-拉夫逊法的作用。

## 1. 为什么说它是“非线性”的？

要理解非线性，先看什么是线性。

### 1.1 线弹性为什么是“线性”的？
在线弹性问题中，我们有两个核心假设：
1.  **本构线性**：应力 $\sigma$ 和应变 $\epsilon$ 成正比（胡克定律 $\sigma = E \epsilon$）。
2.  **几何线性**：位移极小，应变 $\epsilon$ 和位移 $u$ 是线性关系（$\epsilon \approx \nabla u$）。

如果我们把整个系统的刚度矩阵记为 $K$，未知的位移向量记为 $U$，外力向量记为 $F_{ext}$，那么整个方程组可以写成：
$$
K \cdot U = F_{ext}
$$
这里的 $K$ 是一个**常数矩阵**（Constant Matrix）。它只取决于材料初始的 $E, \nu$ 和初始形状。无论你施加多大的力，$K$ 都不变。
这就像解方程 $ax = b$，解就是 $x = b/a$。**因为 $K$ 是已知的常数，所以只需一步矩阵求逆（或线性求解）就能算出 $U$。**

### 1.2 超弹性为什么是“非线性”的？
在超弹性问题中，情况完全变了：

1.  **几何非线性（大变形）**：
    变形梯度 $\boldsymbol{F} = \boldsymbol{I} + \nabla \boldsymbol{u}$。
    应变度量（如格林-拉格朗日应变） $\boldsymbol{E} = \frac{1}{2}(\boldsymbol{F}^T\boldsymbol{F} - \boldsymbol{I})$。
    注意到了吗？**这里出现了 $\boldsymbol{u}$ 的二次项**。这就好比方程变成了 $ax^2 + bx = c$，你不能直接用除法解了。

2.  **材料非线性**：
    应力 $\boldsymbol{P}$ 是能量函数 $\Psi$ 的导数。比如 Neo-Hookean 模型中包含 $\ln(J)$ 或者 $J^{-2/3}$ 这种复杂的非线性函数。
    这意味着：**刚度不再是常数，刚度取决于当前的变形状态。** 越拉越硬（或越软）。

**结论**：
此时的平衡方程不再是 $K \cdot U = F_{ext}$，而是写成“内力等于外力”的形式：
$$
R(U) = F_{int}(U) - F_{ext} = 0
$$
其中 $F_{int}(U)$ 是**内力向量**，它是位移 $U$ 的复杂非线性函数。
我们要解的是方程根的问题：**找一个 $U$，使得残差 $R(U)$ 归零。**

---

## 2. 非线性问题解法：牛顿-拉夫逊法 (Newton-Raphson Method)

既然不能一步求解，我们就通过**迭代逼近**来逼近。牛顿法是求解非线性方程根最强大的工具。

### 2.1 算法直观理解（一维类比）
想象你在大雾中找下山的路（找 $f(x)=0$ 的点）。
1.  你站在当前位置 $x_n$。
2.  你看不到终点，但你能看到脚下的坡度（导数 $f'(x_n)$）。
3.  你假设坡度不变，沿着切线方向走，走到切线与 $0$ 相交的地方，作为下一个位置 $x_{n+1}$。
4.  重复这个过程，直到你踩在 $0$ 线为止。

========放图片！！！！！！！！！！=========

### 2.2 数学推导（FEM 版）
我们的目标是解 $R(U) = 0$。假设第 $n$ 步的解是 $U_n$，但它还不够准，真正的解是 $U_n + \Delta U$。
我们在 $U_n$ 处对 $R$ 进行**泰勒展开**（忽略高阶项）：

$$
R(U_n + \Delta U) \approx R(U_n) + \frac{\partial R}{\partial U}\bigg|_{U_n} \cdot \Delta U = 0
$$

为了让 $R(U_n + \Delta U) = 0$，我们需要解出修正量 $\Delta U$：

$$
\underbrace{\frac{\partial R}{\partial U}\bigg|_{U_n}}_{K_T} \cdot \Delta U = - R(U_n)
$$

这里出现了一个极其重要的矩阵 —— **切线刚度矩阵 (Tangent Stiffness Matrix)** $K_T$：
$$
K_T = \frac{\partial R}{\partial U} = \frac{\partial F_{int}(U)}{\partial U}
$$
它代表了结构在**当前变形状态下**的切线刚度。

### 2.3 迭代流程
JAX-FEM 在求解超弹性问题时，后台实际上在跑这个循环：

1.  **初始化**：令 $U_0 = 0$。
2.  **开始迭代** ($k = 0, 1, 2, \dots$)：
    *   **计算残差**：算出当前状态下内力和外力的差 $R_k = F_{int}(U_k) - F_{ext}$。
    *   **检查收敛**：如果 $||R_k||$ 非常小（接近0），停止，输出 $U_k$ 作为解。
    *   **计算切线刚度矩阵**：$K_T = \frac{\partial R}{\partial U}\big|_{U_k}$。
    *   **求解线性方程组**：解 $K_T \cdot \Delta U = -R_k$ 得到增量 $\Delta U$。
    *   **更新位移**：$U_{k+1} = U_k + \Delta U$。

---

## 3. JAX-FEM 的核心优势：自动微分计算 $K_T$

在前面讲解超弹性代码时，你可能注意到了，我们只定义了能量函数 $\Psi$，然后求了一次导得到应力 $\boldsymbol{P}$。
那么，牛顿法需要的那个**切线刚度矩阵 $K_T$** （也就是二阶导数 $\frac{\partial^2 \Psi}{\partial \boldsymbol{F}^2}$）去哪了？

**在传统的 FEM 中**：
这是最头疼的部分。你推导出了应力 $\boldsymbol{P}$ 的公式后，还得继续对它求偏导，推导出一致切线刚度模量（Consistent Tangent Modulus）。这是一个四阶张量，公式极其复杂，写错一点程序就会不收敛。

**在 JAX-FEM 中**：
框架利用自动微分帮你做了！

*   **第 1 次微分**：$\text{Energy} \xrightarrow{\text{grad}} \text{Stress} (\boldsymbol{P})$。
    对应代码：`P_fn = jax.grad(psi)`
*   **第 2 次微分**：$\text{Stress} (\boldsymbol{P}) \xrightarrow{\text{jacobian}} \text{Stiffness} (K_T)$。

虽然在代码里没显式写这一步，但当你调用 JAX-FEM 的非线性求解器（如 `solver.solve`）时，它在后台会对你的残差函数 $R(U)$ 再次使用自动微分（通常是 `jax.jacfwd` 或 `jax.hessian`），**自动生成**切线刚度矩阵 $K_T$。

**这就是为什么代码里完全看不到刚度矩阵组装过程的原因。**

## 4. 总结：为什么必须要用牛顿法？

1.  **非线性本质**：超弹性问题的力与位移关系是弯曲的曲线，不是直线。$K \cdot U = F$ 这种一次性求解只能解直线问题。
2.  **线性化近似**：牛顿法通过“切线”把曲线在局部近似为直线（$K_T \cdot \Delta U = -R$），从而把一个非线性大问题，转化为一系列线性小问题来求解。
3.  **JAX-FEM 优势**：牛顿法需要导数（切线刚度）。传统方法需要人手推导，JAX-FEM 依靠自动微分全自动计算，极大地降低了非线性有限元的门槛。

---

这样一来，超弹性部分的代码逻辑就完整了：
**物理建模 (定义 $\Psi$) $\to$ 自动微分 (得到 $P$ 和 $K_T$) $\to$ 数学求解 (牛顿法迭代)**。

<!-- TAB_BREAK: 弹塑性 -->

这是 JAX-FEM 系列教程的最终章，也是最硬核的部分——**J2 塑性（J2 Plasticity）**。

如果说超弹性是“非线性”的入门，那么弹塑性就是“非线性”的完全体。它不仅包含材料非线性，更引入了**历史依赖性（Path Dependence）**和**不等式约束（Inequality Constraint）**。

---

# JAX-FEM 深度解析（三）：弹塑性与回退映射算法

## 1. 物理背景：为什么塑性这么难？

### 1.1 历史依赖性
线弹性和超弹性有一个共同点：**只要当前的变形（应变）确定了，当前的应力也就确定了。** 它们像弹簧一样，拉开再松手，完全回弹。

但塑性材料（如金属）有“记忆”。
当你把一根铁丝弯折（发生塑性变形）后再松手，它回不到原来的样子。这意味着：
**当前的应力状态，不仅取决于当前的应变，还取决于之前发生过什么（历史变量）。**

### 1.2 J2 塑性模型核心
我们使用的是经典的 **J2 流动理论（von Mises 屈服准则）**。
核心假设：
1.  **应变分解**：总应变 = 弹性应变 + 塑性应变
    $$ \boldsymbol{\epsilon} = \boldsymbol{\epsilon}^e + \boldsymbol{\epsilon}^p $$
2.  **屈服面**：判断材料是否进入塑性的标准。
    $$ f(\boldsymbol{\sigma}) = \sigma_{eq} - \sigma_Y \le 0 $$
    其中 $\sigma_{eq}$ 是等效应力（Von Mises 应力），$\sigma_Y$ 是屈服强度。
    *   $f < 0$：弹性状态。
    *   $f = 0$：塑性流动。
    *   $f > 0$：**非法状态**（应力不能跑出屈服面，必须被拉回来）。

---

## 2. 算法核心：回退映射 (Return Mapping)

为了在计算机中求解这个不等式约束问题，我们采用 **Predictor-Corrector（预测-校正）** 策略，也叫 **Radial Return Mapping（径向回退算法）**。

这是一个两步走的逻辑：

*   **Step 1: 弹性试算 (Elastic Predictor)**
    假设这一步全是弹性变形，不管塑性。算出一个“试算应力” $\boldsymbol{\sigma}^{trial}$。
*   **Step 2: 塑性校正 (Plastic Corrector)**
    检查 $\boldsymbol{\sigma}^{trial}$ 是否超出了屈服面？
    *   **没超**：假设正确，真应力就等于试算应力。
    *   **超了**：说明发生了塑性屈服。我们需要把应力沿着径向**拉回**到屈服面上。

---

## 3. 代码实现详解

在 JAX-FEM 中，弹塑性的实现展示了如何处理**内部状态变量（State Variables）**。

### 3.1 初始化历史变量 (`custom_init`)

因为塑性依赖历史，我们需要存储每一个积分点上的**上一时刻状态**。

```python
class Plasticity(Problem):
    def custom_init(self):
        # 获取有限元空间信息
        self.fe = self.fes[0]
        # 初始化上一时刻的应变 (epsilons_old) 和 应力 (sigmas_old)
        # 形状是 (单元数, 积分点数, 变量维度...)
        self.epsilons_old = np.zeros((len(self.fe.cells), self.fe.num_quads, self.fe.vec, self.dim))
        self.sigmas_old = np.zeros_like(self.epsilons_old)
        
        # 注册为内部变量，方便后续更新
        self.internal_vars = [self.sigmas_old, self.epsilons_old]
```

### 3.2 定义回退映射核 (`get_tensor_map`)

这是整个算法的心脏。我们需要定义一个函数：
**输入**：当前位移梯度 $\nabla u$，以及历史变量 $\boldsymbol{\sigma}_{n-1}, \boldsymbol{\epsilon}_{n-1}$。
**输出**：当前真实应力 $\boldsymbol{\sigma}_n$。

```python
    def get_maps(self):
        # 辅助函数：安全的数学运算（为了自动微分的数值稳定性）
        # 因为 sqrt(0) 在求导时会出现无穷大 (1/0)，所以需要特殊处理
        def safe_sqrt(x):
            return np.where(x > 0., np.sqrt(x), 0.)

        def safe_divide(x, y):
            return np.where(y == 0., 0., x/y)

        # 核心算法：回退映射
        def stress_return_map(u_grad, sigma_old, epsilon_old):
            sig0 = 250. # 屈服强度
            
            # 1. 计算当前总应变
            epsilon_crt = 0.5 * (u_grad + u_grad.T)
            
            # 2. 计算应变增量 d_epsilon
            epsilon_inc = epsilon_crt - epsilon_old
            
            # 3. 【试算步】计算试算应力 sigma_trial
            # 假设增量全是弹性的：sigma_trial = sigma_old + D : d_epsilon
            # stress() 函数就是胡克定律
            sigma_trial = stress(epsilon_inc) + sigma_old
            
            # 4. 计算试算应力的偏张量 (Deviatoric Stress) s
            s_dev = sigma_trial - 1./self.dim*np.trace(sigma_trial)*np.eye(self.dim)
            # 计算 von Mises 等效应力
            s_norm = safe_sqrt(3./2.*np.sum(s_dev*s_dev))
            
            # 5. 【屈服判断】
            # f_yield > 0 表示超出了屈服面
            f_yield = s_norm - sig0
            
            # 6. 【应力修正】
            # 如果 f_yield > 0，开启校正；否则保持为 0
            # f_yield_plus 就是需要回退的距离
            f_yield_plus = np.where(f_yield > 0., f_yield, 0.)
            
            # 径向回退公式：
            # sigma_new = sigma_trial - (回退量 * 回退方向)
            # 回退方向是 s_dev / s_norm
            sigma = sigma_trial - safe_divide(f_yield_plus*s_dev, s_norm)
            
            return sigma
            
        return strain, stress_return_map
```

**代码解析：**
*   **Tensor Map 归属**：这个函数最终返回 `sigma`，它在弱形式中与 $\nabla v$ 配对，所以它属于 `Tensor Map`。
*   **可微性**：代码中使用了 `np.where`（相当于 `if-else`）。在 JAX 中，`where` 是可微的（导数类似于阶跃函数），这使得牛顿法依然可以计算出所谓的“算法一致切线模量”（Algorithmic Consistent Tangent）。**你不需要手推这个极其复杂的切线模量公式，JAX 自动算出来了。**

### 3.3 状态更新 (`update_stress_strain`)

弹塑性求解是增量步进的（Time Stepping）。每当我们解完一个时间步（即牛顿法收敛，$\text{Residual} \approx 0$），我们需要把“当前状态”存档为“旧状态”，供下一步使用。

```python
    def update_stress_strain(self, sol):
        # 1. 从求解结果 sol 中提取位移梯度
        u_grads = self.fe.sol_to_grad(sol)
        
        # 2. 获取向量化（vmap）后的应力计算函数
        vmap_strain, vmap_stress_rm = self.stress_strain_fns()
        
        # 3. 计算这一步收敛后的真实应力和应变
        # 注意：这里把计算出的新值赋给了 self.sigmas_old
        self.sigmas_old = vmap_stress_rm(u_grads, self.sigmas_old, self.epsilons_old)
        self.epsilons_old = vmap_strain(u_grads)
        
        # 4. 更新内部变量列表
        self.internal_vars = [self.sigmas_old, self.epsilons_old]
```

---

## 4. 求解流程总结

对于弹塑性问题，JAX-FEM 的外层循环（在主脚本中）通常是这样的：

1.  **加载循环**：设定一系列边界条件（如位移 $0 \to 0.1 \to 0$）。
2.  **牛顿迭代**（求解器内部）：
    *   猜测位移 $u$。
    *   调用 `stress_return_map(u, sigma_old, ...)` 计算当前应力。
    *   JAX 自动微分计算残差 $R$ 和刚度矩阵 $K$。
    *   更新 $u$，直到平衡。
3.  **状态更新**：
    *   牛顿法收敛后，调用 `problem.update_stress_strain(sol)`。
    *   将当前的 $\sigma, \epsilon$ 固化为 $\sigma_{old}, \epsilon_{old}$。
4.  **下一步加载**。

---

## 5. 总结：三个例子的进阶之路

通过这三个例子，我们可以清晰地看到 JAX-FEM 的能力边界是如何扩展的：

1.  **线弹性**：
    *   *物理*：线性，$f(\nabla u) = C:\nabla u$。
    *   *JAX优势*：代码简洁，自动组装矩阵。
    *   *Map类型*：纯 Tensor Map。

2.  **超弹性**：
    *   *物理*：非线性，$\boldsymbol{P} = \partial \Psi / \partial \boldsymbol{F}$。
    *   *JAX优势*：**自动微分求一阶导**（得应力）和**二阶导**（得切线刚度），免去繁琐推导。
    *   *Map类型*：纯 Tensor Map。

3.  **弹塑性**：
    *   *物理*：非线性 + 历史依赖 + 不等式约束。
    *   *JAX优势*：
        *   **处理状态变量**：传递 `sigma_old`。
        *   **微分逻辑**：即使包含 `if-else` (屈服判断) 和复杂的径向回退算法，JAX 依然能自动微分，获得正确的切线刚度，保证牛顿法收敛。
    *   *Map类型*：Tensor Map (带状态变量)。

至此，已经阐明了 JAX-FEM 处理从简单到极其复杂力学问题的核心逻辑。它的核心逻辑始终不变：**定义好物理核心（Kernel），剩下的交给框架和自动微分。**

---
下面是一个**超详细**的 JAX-FEM 求解 **J2 弹塑性问题** 的算法流程图。

为了彻底看清数据是如何流动的，我将流程分为了三个层级：
1.  **最外层**：时间步循环（加载过程）。
2.  **中间层**：牛顿-拉夫逊非线性求解（Newton-Raphson Solver）。
3.  **最内层**：物理内核（Kernel / Constitutive Law），即 JAX 自动微分发生的地方。

---

=======放流程图！！！！！！！！！！！！！！============

### 2. 详细步骤解析

#### **阶段 1：初始化 (Initialization)**
这是准备工作，只运行一次。
*   **关键点**：必须在内存中开辟空间存储 **历史变量 (State Variables)**。
    *   `sigma_old`：上一时间步收敛后的应力。
    *   `epsilon_old`：上一时间步收敛后的应变。
    *   初始时刻它们都是全零矩阵（假设无残余应力）。

#### **阶段 2：时间步/加载步 (Global Time Stepping)**
因为塑性是**路径依赖**的，我们不能一步求出最终解，必须把大加载（例如拉伸 0.1mm）切分成很多小步（例如 20 步，每步 0.005mm）。
*   **输入**：这一步的边界条件（例如 `u_dirichlet = 0.05`）。
*   **注意**：在这一步开始时，`sigma_old` 是**固定**的（来自上一步的结果）。

#### **阶段 3：牛顿-拉夫逊求解器 (Newton-Raphson Solver)**
这是最耗时的循环。目的是在当前边界条件和历史状态下，找到满足力平衡（$R=0$）的位移场 $u$。
*   **Step 3.1: 计算残差 $R$**
    求解器会“询问”物理内核：“如果在当前 $u$ 下，结构内部的应力是多少？这些应力产生的内力与外力平衡吗？”
*   **Step 3.2: 自动微分计算刚度矩阵 $K$**
    *   $K = \frac{\partial R}{\partial u}$。
    *   **JAX 的自动微分能力**：你不需要写任何代码来计算 $K$。JAX 追踪了从 $u$ 到 $\sigma$ 再到 $R$ 的所有计算过程（包括里面的 `if-else` 判断），自动算出了这个导数。
*   **Step 3.3: 线性求解与更新**
    解 $K \Delta u = -R$，修正位移猜测。

#### **阶段 4：物理内核 (The Kernel / Return Mapping)**
这是我们在 `get_tensor_map` 里写的代码，也是图中的**核心子图**。
这个过程是**针对每一个积分点**并行执行的（通过 `vmap`）。

1.  **计算增量**：算出当前猜测的 $u$ 导致的总应变，减去 `epsilon_old`，得到这一步的“试探应变增量”。
2.  **弹性试算 (Predictor)**：先假设材料是铁打的（纯弹性），算出 `sigma_trial`。
3.  **屈服裁决 (Check)**：计算 von Mises 应力，看它是否超过屈服强度 $\sigma_0$。
4.  **塑性校正 (Corrector)**：
    *   如果没超：真应力 = 试算应力。
    *   如果超了：把应力沿着径向拉回屈服面上（应力减小），这部分减小的应力转化为了塑性应变。

#### **阶段 5：状态更新 (Update State)**
**极其重要的一步！**
*   当牛顿法收敛（$|R| \approx 0$）后，说明我们找到了真实的 $u_n$。
*   此时，我们再次调用内核，计算出最终的 $\sigma_n$ 和 $\epsilon_n$。
*   **覆盖旧数据**：将 `sigma_old` 更新为 $\sigma_n$，将 `epsilon_old` 更新为 $\epsilon_n$。
*   这样，下一个时间步开始时，就会基于这个新的状态继续计算。

---

### 3. 数据流视角：State Variable 怎么变？

为了防止第一次学习的时候，被 `sigma_old` 这个变量迷惑，我来解释一下：

1.  **在时间步 $n$ 开始前**：`sigma_old` 是 $t_{n-1}$ 时刻的值。
2.  **在牛顿迭代中 (Inner Loop)**：
    *   `sigma_old` **保持不变！** 它是常量输入。
    *   内核计算的是 `sigma_current`，它随着 $u$ 的迭代不断变化。
    *   残差 $R$ 是基于 `sigma_current` 算的。
3.  **在时间步 $n$ 结束后**：
    *   `sigma_old` 被 `sigma_current` **覆盖**。
    *   它变成了下个时间步的起点。

这就是为什么 JAX-FEM 代码里有一个专门的 `update_stress_strain` 函数，它必须在 `solver.solve` 成功之后手动调用。

---
### 4. 几个疑难解答（利用AI解答）

阶段三和阶段四在同一个边界条件下是循环吗，感觉不是吧，只需要判断一步是否屈服不就行了，即使屈服也就直接通过那个算式拉回屈服面上就没了。

---
**Ans：** 这是一个非常敏锐且极具深度的直觉！你其实触碰到了有限元（FEM）中**“局部（Local）”**与**“全局（Global）”**两个层面的核心矛盾。

直接回答你的问题：
**是的，阶段三（牛顿求解）和阶段四（物理内核）必须构成循环。仅做一次是不够的。**

虽然对于**单点（局部）**来说，给定一个应变，你确实可以通过一次“拉回”算出应力（你是对的）；
但是，**这个应变本身是错的**（这就是为什么要循环）。

让我用一个直观的例子来拆解这个误区。

---

#### 1. 误区的核心：你以为应变是已知的，但它不是

你的直觉是这样的：
> 输入位移 $u$ $\to$ 算出应变 $\epsilon$ $\to$ 发现屈服 $\to$ 拉回屈服面 $\to$ 得到应力 $\sigma$。结束。

**如果这是一个“位移控制”且“全场均匀”的简单拉伸实验，你是对的。**
但在复杂的有限元结构中，我们求解的是方程 $K(u) \cdot u = F_{ext}$。

##### 场景推演：为什么一次不行？

假设我们正在对一个悬臂梁施加力 $F$，我们想求位移 $u$。

1.  **第一次猜测 (Newton Iteration 0)**：
    *   我们不知道到底会发生多少塑性变形，所以求解器通常先假设结构是**全弹性**的（或者沿用上一步的刚度）。
    *   求解器猜了一个位移 $u_0$。

2.  **物理内核计算 (Phase 4)**：
    *   基于 $u_0$，我们算出应变 $\epsilon_0$。
    *   **屈服判断**：发现 $\epsilon_0$ 很大，算出的试算应力 $\sigma_{trial}$ 远超屈服点。
    *   **拉回操作**：你通过算法把应力强行拉回屈服面，得到真应力 $\sigma_{true}$。
    *   **关键点来了**：因为你把应力拉回去了（变小了），**这导致 $\sigma_{true}$ 比预想的要小很多。**

3.  **全局平衡检查 (Phase 3 Check)**：
    *   我们把全场变小了的 $\sigma_{true}$ 积分起来，得到结构目前的内力 $F_{int}$。
    *   因为发生了塑性屈服（软化），应力被削顶了，所以 **内力 $F_{int}$ 远小于外力 $F_{ext}$**。
    *   方程 $F_{int} - F_{ext} \neq 0$。**平衡不满足！**

4.  **结论**：
    *   虽然你把应力算“对”了（符合本构），但这个应力扛不住外力。
    *   结构“太软了”，在当前的位移 $u_0$ 下根本支撑不住 $F_{ext}$。
    *   **结构必须变形得更厉害（增加 $u$）才能达到平衡。**

这就是为什么要进入下一次循环：求解器发现残差很大，必须计算新的切线刚度（变软了的刚度），计算出 $\Delta u$，让结构继续变大变形，直到内力再次等于外力。

---

#### 2. 图解：不循环会发生什么？

想象一下应力-应变曲线。

*   **理想情况**：我们需要找到曲线上的一个点，使得应力对应的力等于外力。
*   **不循环（只做一步）**：
    1.  你沿着弹性直线跑，跑到了一个很高的点（试算点）。
    2.  你发现超了，垂直拉回到屈服平台上（拉回操作）。
    3.  **此时**：你的应力是对的（在曲线上），但对应的**外力**不对！因为你的位移是按弹性刚度估算的，偏小。

**牛顿循环的作用**就是沿着切线方向，不断修正位移 $u$，直到找到那个**既在应力-应变曲线上（满足本构），又满足力平衡（满足方程）**的点。

#### 3. JAX-FEM 中的具体体现

在 JAX-FEM 的代码逻辑中：

1.  **阶段四（Kernel）**：负责保证 **点在曲线上**。
    *   不管传入什么 $u$，我算出的 $\sigma$ 一定满足 $f(\sigma) \le 0$。
    *   这是局部的一致性。

2.  **阶段三（Newton）**：负责保证 **力平衡**。
    *   它发现当前的 $\sigma$ 集成的内力太小了。
    *   它会利用 JAX 自动微分算出的 **切线刚度矩阵 $K_T$**（这个矩阵因为塑性而变“软”了）。
    *   它计算出修正量 $\Delta u$，告诉系统：“因为你屈服了，没那么硬了，所以你得再多变形一点！”

#### 总结

*   **如果**问题是“已知应变求应力”，那**不需要循环**，你是对的。
*   **但是** FEM 的问题是“已知外力求位移”，应变本身是未知的。
*   塑性导致刚度下降 $\to$ 同样的力需要更大的位移 $\to$ **必须循环迭代来找到这个更大的位移**。

所以，阶段三和阶段四是如影随形的：**牛顿法没改一次猜测（阶段三），物理内核就得重新做一次“拉回判决”（阶段四），看新的猜测是否满足平衡。**

---
**继续提问：** 意思是，阶段三修正了之后再次进入阶段4看是否屈服，如果还是屈服怎么办，还要修正，然后再算残余应力，再调整位移吗?

---
**是的，完全正确！你的理解非常到位！**

一定要区分清楚 **“材料层面的修正”** 和 **“结构层面的修正”**。这就是有限元求解非线性问题的核心逻辑。

让我们把你描述的过程拆解开，看看如果“还是屈服”会发生什么：

#### 1. 核心逻辑：不是为了“消除屈服”，而是为了“匹配外力”

首先要纠正一个微小的概念：
求解器的目的**不是**为了让材料不屈服（因为塑性分析本来就是要让它屈服的）。
求解器的目的是：**“既然你屈服了（变软了），那我原来的位移猜小了，我得加大位移，直到把你拉到内力能够抗衡外力为止。”**

#### 2. 详细的“修正循环”推演

假设我们施加一个很大的拉力 $F_{ext} = 1000N$。

##### **第一轮循环 (Iteration 1)**
1.  **牛顿求解器（阶段三）**：
    *   先按弹性瞎猜一个位移，比如 $u = 1mm$。
2.  **物理内核（阶段四）**：
    *   算出应变。
    *   **屈服判断**：发现屈服了！
    *   **拉回修正**：强行把应力拉回屈服面（比如拉回后应力对应 $500N$）。
    *   **输出**：告诉求解器，现在的内力只有 $500N$。
3.  **残差检查**：
    *   $R = 500N - 1000N = -500N$。
    *   **不平衡！** 结构太软了，扛不住。

##### **第二轮循环 (Iteration 2)**
1.  **牛顿求解器（阶段三）**：
    *   因为它知道材料屈服了（切线刚度变小了），它会说：“那 1mm 肯定不够，得加把劲，试下 $u = 2mm$。”
2.  **物理内核（阶段四）**：
    *   算出新的应变（对应 2mm）。
    *   **屈服判断**：**肯定还是屈服的！**（因为拉得更长了）。
    *   **拉回修正**：再次把应力拉回屈服面（注意：J2模型通常有硬化，拉得越长，屈服面可能稍微扩大一点，或者应力在屈服面上滑动）。
    *   **输出**：这次算出的应力对应内力 $800N$。
3.  **残差检查**：
    *   $R = 800N - 1000N = -200N$。
    *   **还是不平衡！** 但接近了。

##### **第三轮循环 (Iteration 3)**
1.  **牛顿求解器（阶段三）**：
    *   “还要加！试下 $u = 2.5mm$。”
2.  **物理内核（阶段四）**：
    *   算出应变。
    *   **屈服判断**：**依然屈服！**
    *   **拉回修正**：再次执行拉回算法。
    *   **输出**：这次内力是 $998N$。
3.  **残差检查**：
    *   $R = -2N \approx 0$。
    *   **收敛！**

---

#### 3. 总结

回答你的问题：**“如果还是屈服怎么办？”**

答案是：**那就让它屈服！**
我们在阶段四里，每一次都会重新算一遍“拉回修正”。
*   只要它还屈服，我们就把它拉回到屈服面上。
*   这导致算出来的应力偏小。
*   导致内力不足。
*   导致求解器在下一轮增加位移。

**这个循环会一直进行，直到找到那个“既在屈服面上（满足材料本构），又能产生足够内力（满足力平衡）”的位移 $u$ 为止。**

JAX-FEM 的强大之处在于，**在每一轮中，即使发生了“拉回”这种剧烈的非线性操作，JAX 都能自动算出准确的导数（切线刚度）**，告诉求解器下一轮位移该调整多少，从而让这个循环快速收敛。

---
**还没明白：** 具体是怎么试的，肯定不是随机加上个数吧

---
这绝对不是随机试的，这是 **牛顿-拉夫逊法（Newton-Raphson）** 最迷人、最精妙的地方。

它不仅知道“得加把劲”，它还通过精确的数学计算，算出 **“具体应该加多少”** 。

简单来说，它做了一个简单的除法：
$$ \text{需要增加的位移} = \frac{\text{还缺多少力}}{\text{当前的刚度}} $$

---

#### 1. 直观物理逻辑：缺多少力？刚度剩多少？

回到刚才的例子：
*   **外力** $F_{ext} = 1000N$
*   **第一步位移** $u_1 = 1mm$
*   **第一步内力** $F_{int} = 500N$ （因为屈服了，没那么大）

##### 第一步：算“还缺多少力” (Residual)
求解器先算残差 $R$：
$$ R = F_{int} - F_{ext} = 500 - 1000 = -500N $$
意思是：**“我现在还欠 500N 的力才能平衡。”**

##### 第二步：看“现在的刚度是多少” (Tangent Stiffness)
这是最关键的一步。求解器会问物理内核（通过 JAX 的自动微分）：
> **“在当前这个屈服的状态下，如果我再拉你一下，你还能提供多大的抵抗力？”**

*   如果是**弹性状态**，刚度很大（比如 $K_{elastic} = 1000 N/mm$）。
*   但是！因为**屈服了**（进入了塑性流动平台），材料变软了。
*   JAX 会自动算出这个变软后的**切线刚度 $K_T$**。假设现在 $K_T$ 只有 $500 N/mm$ 了（刚度掉了一半）。

##### 第三步：算“该加多少位移” (Update)
求解器利用线性方程组 $K \cdot \Delta u = -R$ 来计算修正量：

$$ \Delta u = \frac{\text{欠的力}}{\text{当前的刚度}} = \frac{500N}{500 N/mm} = 1mm $$

求解器发现：**“因为你变软了（刚度只有500），而我还欠500N，所以我必须再拉你 1mm 才够！”**

于是，新的位移就是：
$$ u_{new} = u_{old} + \Delta u = 1mm + 1mm = 2mm $$

---

#### 2. 对比：为什么塑性会让它“步子迈得更大”？

如果**没有屈服**（假设还是弹性），会发生什么？

1.  **欠的力**：假设还是欠 500N。
2.  **刚度**：因为没屈服，刚度很高，还是 $1000 N/mm$。
3.  **修正量**：
    $$ \Delta u = \frac{500N}{1000 N/mm} = 0.5mm $$
    
**看出来了吗？**
*   **没屈服时**：刚度大，求解器觉得“稍微再拉一点点力就上来了”，所以只加 **0.5mm**。
*   **屈服后**：刚度变小（变软），求解器觉得“你现在太软了，我得**狠狠拉一把**力才能上来”，所以加了 **1mm**。

这就是为什么求解器能**智能地**调整步长。它不是在瞎猜，它是根据**当前材料的软硬程度（切线刚度 $K_T$）**来决定下一步迈多大。

#### 3. JAX-FEM 的黑科技

在传统有限元里，为了算出那个“变软了的刚度” $K_T$（也就是 $500$ 那个数），程序员需要手推极其复杂的导数公式，要把回退映射算法里的 `if-else`、平方根、张量运算全部微分一遍。

**在 JAX-FEM 里：**
你什么都不用做。
当你写好那个带有 `if f_yield > 0` 的函数后，求解器在后台直接调用：
`K = jax.jacfwd(residual_function)(u)`

JAX 会自动穿透那个 `if` 判断，发现：“哦，这里走的是塑性分支，斜率变平了”，然后直接给你返回正确的、变小了的刚度值 $K_T$。

这就是为什么牛顿法能在这个框架下高效工作的原因。

---
**最后一个细节：** 那第一步的u_grad是啥，我咋没看到定义这个数?

---

这是一个极其敏锐的**代码视角**问题！你没看到它的定义是因为——**它根本不是你定义的，而是框架“喂”给你的。**

这就好比你买了一个榨汁机（你写的核函数），你只需要规定“把水果（`u_grad`）变成汁（`sigma`）”。至于水果是谁放进来的？是你在按下开关时，你自己（或者机器的自动进料口）放进来的。

在 JAX-FEM 中，`u_grad` 的来源路径如下：

#### 1. 数据的源头：节点位移 (Nodal Displacements)
所有的有限元求解器，解的核心变量都是**网格节点上的位移向量**，记为 $\boldsymbol{U}_{nodes}$。
*   **第 0 步**：求解器初始化，通常猜 $\boldsymbol{U}_{nodes} = 0$（或者继承上一步的结果）。
*   **迭代中**：牛顿法算出修正量，更新 $\boldsymbol{U}_{nodes}$。

**这个 $\boldsymbol{U}_{nodes}$ 就是源头数据。**

#### 2. 中间加工：形函数插值 (Shape Function Interpolation)
这是有限元（FEM）最底层的“魔法”。框架在后台默默做了这件事：

它利用**形函数（Shape Functions）** $N$ 的导数，把**节点**上的位移，转化为了**积分点**（高斯点）上的位移梯度。

数学公式是：
$$ \nabla \boldsymbol{u} (\text{积分点}) = \sum_{i} \boldsymbol{U}_i (\text{节点}) \cdot \nabla N_i (\text{积分点}) $$

在 JAX-FEM 的底层代码（你看不到的地方），有类似这样的逻辑：
```python
# 伪代码：JAX-FEM 框架底层逻辑
def compute_residual(U_nodes):
    # 1. 插值：从节点位移算出积分点上的梯度
    # 这就是 u_grad 的出生地！
    u_grad = jnp.einsum('...ij, ...k -> ...ik', shape_grads, U_nodes) 
    
    # 2. 调用你写的核函数
    # 框架把刚才算出来的 u_grad 传给你
    sigma = your_kernel_function(u_grad, ...)
    
    # ... 后续积分 ...
```

#### 3. 你的视角：被动接收
回到你写的代码：

```python
def stress_return_map(u_grad, sigma_old, epsilon_old):
    # ...
```

这里的 `u_grad` 是一个**函数参数 (Argument)**。
*   你不需要给它赋值。
*   你只需要告诉框架：“**假设**给我一个 `u_grad`，我该怎么算出 `sigma`”。
*   当求解器跑起来的时候，**JAX 会自动把当前迭代步计算出的梯度值填入这个参数**。

#### 4. 那“第一步”的具体数值是多少？

回到你关心的第一步：
1.  **初始时刻**：
    通常位移场初始化为 0。
    所以传进来的 `u_grad` 全是 **0**。
2.  **第一步计算**：
    *   传入 `u_grad = 0`。
    *   你的函数算出 `sigma = 0`（假设没有初应力）。
    *   残差 $R = 0 - F_{ext}$。
    *   牛顿法发现不平衡，算出 $\Delta U$。
3.  **第二步计算（第一次修正）**：
    *   位移变了，框架算出**新的** `u_grad`（不再是 0 了）。
    *   再次调用你的函数，传入这个非零的 `u_grad`。

#### 总结

`u_grad` 不是一个固定的数，它是一个**变量**。
*   **谁定义的？** 框架通过形函数从节点位移算出来的。
*   **数值是多少？** 取决于当前牛顿法迭代到了哪一步（求解器猜现在的位移是多少，它就是多少）。

你只负责 **“加工”**（写函数逻辑），框架负责 **“供料”**（传入实参）。

---
### 下面是一份完全按照**JAX-FEM 代码逻辑** 梳理的 J2 弹塑性计算公式清单。

**设定背景**：
*   我们处于某一个**加载步（Time Step）**。
*   已知上一加载步收敛后的历史变量：**旧应力 $\boldsymbol{\sigma}_{old}$** 和 **旧应变 $\boldsymbol{\epsilon}_{old}$**。
*   我们需要通过 **牛顿-拉夫逊迭代（Newton-Raphson Iteration）** 找到当前步的平衡解。

我们将角标 $0, 1, \dots, n$ 用于表示 **牛顿迭代次数**。

---

### 第一轮迭代 (Iteration $k=0$)

**1. 求解器猜测位移**
求解器给出当前加载步的初始猜测位移 $\boldsymbol{u}_0$（通常继承自上一步的解）。

**2. 计算几何方程（应变）**
通过形函数插值得到积分点的位移梯度 $\nabla \boldsymbol{u}_0$，计算当前总应变：
$\boldsymbol{\epsilon}_0 = \frac{1}{2} (\nabla \boldsymbol{u}_0 + (\nabla \boldsymbol{u}_0)^T)$

**3. 计算应变增量**
用当前总应变减去上一加载步的历史应变：
$\Delta \boldsymbol{\epsilon}_0 = \boldsymbol{\epsilon}_0 - \boldsymbol{\epsilon}_{old}$

**4. 弹性试算 (Elastic Predictor)**
假设增量完全是弹性的，根据胡克定律 ($\mathbb{C}$) 计算试算应力：
$\boldsymbol{\sigma}^{trial}_0 = \boldsymbol{\sigma}_{old} + \lambda \text{tr}(\Delta \boldsymbol{\epsilon}_0)\boldsymbol{I} + 2\mu \Delta \boldsymbol{\epsilon}_0$

**5. 计算偏差应力 (Deviatoric Stress)**
$\boldsymbol{s}^{trial}_0 = \boldsymbol{\sigma}^{trial}_0 - \frac{1}{3} \text{tr}(\boldsymbol{\sigma}^{trial}_0) \boldsymbol{I}$

**6. 计算等效应力 (Von Mises Stress)**
$s^{norm}_0 = \sqrt{\frac{3}{2} \boldsymbol{s}^{trial}_0 : \boldsymbol{s}^{trial}_0}$

**7. 屈服函数判断**
$\sigma_Y$ 为屈服强度：
$f_0 = s^{norm}_0 - \sigma_Y$

**8. 应力校正 (Radial Return)**
利用 Ramp 函数 $\langle x \rangle = \max(x, 0)$ 来统一弹性与塑性情况。
如果 $f_0 \le 0$，回退量为0；如果 $f_0 > 0$，需要回退：
$\boldsymbol{\sigma}_0 = \boldsymbol{\sigma}^{trial}_0 - \frac{\langle f_0 \rangle}{s^{norm}_0} \boldsymbol{s}^{trial}_0$
*(注：这就是当前内核函数返回的真应力)*

**9. 全局残差与刚度计算 (JAX Auto-Diff)**
计算全局残差力（内力 - 外力）：
$\boldsymbol{R}_0 = \int_{\Omega} \boldsymbol{\sigma}_0 : \nabla \boldsymbol{v} \, dx - \boldsymbol{F}_{ext}$
计算切线刚度矩阵（自动微分）：
$\boldsymbol{K}_0 = \frac{\partial \boldsymbol{R}_0}{\partial \boldsymbol{u}_0}$

**10. 求解修正量**
$\Delta \boldsymbol{u} = - \boldsymbol{K}_0^{-1} \boldsymbol{R}_0$

**11. 更新位移**
$\boldsymbol{u}_1 = \boldsymbol{u}_0 + \Delta \boldsymbol{u}$

---

### 第二轮迭代 (Iteration $k=1$)
*(此时位移已变更为 $\boldsymbol{u}_1$，重复上述内核计算)*

**1. 计算几何方程（应变）**
$\boldsymbol{\epsilon}_1 = \frac{1}{2} (\nabla \boldsymbol{u}_1 + (\nabla \boldsymbol{u}_1)^T)$

**2. 计算应变增量**
*(注意：仍然是减去同一个旧历史变量)*
$\Delta \boldsymbol{\epsilon}_1 = \boldsymbol{\epsilon}_1 - \boldsymbol{\epsilon}_{old}$

**3. 弹性试算**
$\boldsymbol{\sigma}^{trial}_1 = \boldsymbol{\sigma}_{old} + \lambda \text{tr}(\Delta \boldsymbol{\epsilon}_1)\boldsymbol{I} + 2\mu \Delta \boldsymbol{\epsilon}_1$

**4. 计算偏差应力**
$\boldsymbol{s}^{trial}_1 = \boldsymbol{\sigma}^{trial}_1 - \frac{1}{3} \text{tr}(\boldsymbol{\sigma}^{trial}_1) \boldsymbol{I}$

**5. 计算等效应力**
$s^{norm}_1 = \sqrt{\frac{3}{2} \boldsymbol{s}^{trial}_1 : \boldsymbol{s}^{trial}_1}$

**6. 屈服函数判断**
$f_1 = s^{norm}_1 - \sigma_Y$

**7. 应力校正**
$\boldsymbol{\sigma}_1 = \boldsymbol{\sigma}^{trial}_1 - \frac{\langle f_1 \rangle}{s^{norm}_1} \boldsymbol{s}^{trial}_1$

**8. 全局残差与刚度计算**
$\boldsymbol{R}_1 = \int_{\Omega} \boldsymbol{\sigma}_1 : \nabla \boldsymbol{v} \, dx - \boldsymbol{F}_{ext}$
$\boldsymbol{K}_1 = \frac{\partial \boldsymbol{R}_1}{\partial \boldsymbol{u}_1}$

**9. 求解修正量与更新位移**
$\Delta \boldsymbol{u} = - \boldsymbol{K}_1^{-1} \boldsymbol{R}_1$
$\boldsymbol{u}_2 = \boldsymbol{u}_1 + \Delta \boldsymbol{u}$

---

### ... (循环迭代) ...

---

### 第 n 轮迭代 (Iteration $k=n$, 收敛)
*(假设此时残差 $||\boldsymbol{R}_n|| < \text{tol}$，迭代结束)*

**1. 最终位移确认**
$\boldsymbol{u}_{final} = \boldsymbol{u}_n$

**2. 最终内核计算 (用于更新状态)**
$\boldsymbol{\epsilon}_{final} = \frac{1}{2} (\nabla \boldsymbol{u}_{final} + (\nabla \boldsymbol{u}_{final})^T)$

$\Delta \boldsymbol{\epsilon}_{final} = \boldsymbol{\epsilon}_{final} - \boldsymbol{\epsilon}_{old}$

$\boldsymbol{\sigma}^{trial}_{final} = \boldsymbol{\sigma}_{old} + \lambda \text{tr}(\Delta \boldsymbol{\epsilon}_{final})\boldsymbol{I} + 2\mu \Delta \boldsymbol{\epsilon}_{final}$

$\boldsymbol{s}^{trial}_{final} = \boldsymbol{\sigma}^{trial}_{final} - \frac{1}{3} \text{tr}(\boldsymbol{\sigma}^{trial}_{final}) \boldsymbol{I}$

$s^{norm}_{final} = \sqrt{\frac{3}{2} \boldsymbol{s}^{trial}_{final} : \boldsymbol{s}^{trial}_{final}}$

$\boldsymbol{\sigma}_{final} = \boldsymbol{\sigma}^{trial}_{final} - \frac{\langle s^{norm}_{final} - \sigma_Y \rangle}{s^{norm}_{final}} \boldsymbol{s}^{trial}_{final}$

**3. 更新历史变量 (进入下一加载步)**
将当前收敛步的结果存为“旧变量”，供 $t+1$ 步使用：
$\boldsymbol{\sigma}_{old} \leftarrow \boldsymbol{\sigma}_{final}$
$\boldsymbol{\epsilon}_{old} \leftarrow \boldsymbol{\epsilon}_{final}$


## 至此，JAX-FEM 的 核心部分基础教学全部结束