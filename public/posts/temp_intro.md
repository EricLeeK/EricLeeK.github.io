## 1. 它是如何看待世界的：通用方程

在 JAX-FEM 的视角里，绝大多数物理平衡问题（无论力学、热学还是流体）都可以归纳为以下这个**通用 PDE 形式**：

$$
-\nabla \cdot \mathbf{A}(\boldsymbol{u}, \nabla \boldsymbol{u}, \boldsymbol{x}) + \mathbf{c}(\boldsymbol{u}, \nabla \boldsymbol{u}, \boldsymbol{x}) - \boldsymbol{f} = 0 \tag{1}
$$

为了在计算机上求解，我们需要将其转化为积分形式（即**弱形式**）。我们在方程两边乘以测试函数 $v$，并在全域积分。
关键的一步来了：对于第一项（散度项），我们运用分部积分（高斯定理），将微分算子转移到测试函数上。

最终，求解器真正面对的方程结构是这样的（我们将其定义为**残差 $R$**，求解目标即寻找 $\boldsymbol{u}$ 使得 $R=0$）：

$$
R = \underbrace{\int_{\Omega} \mathbf{A}(\boldsymbol{u}, \nabla \boldsymbol{u}, \boldsymbol{x}) : \nabla \boldsymbol{v} \, dx}_{\text{Part 1: Tensor Map}} + \underbrace{\int_{\Omega} \mathbf{c}(\boldsymbol{u}, \nabla \boldsymbol{u}, \boldsymbol{x}) \cdot \boldsymbol{v} \, dx}_{\text{Part 2: Mass Map}} - \text{External Work} = 0 \tag{2}
$$

> **注**：公式中的冒号 $:$ 代表张量内积。根据物理量的阶数，它可能是点积（如热传导中向量与向量）或双点积（如力学中二阶张量与二阶张量）。

这个公式解释了一切。JAX-FEM 的设计哲学就是**对上述两个积分项的直接映射**。

## 2. 两大核心支柱：Tensor Map 与 Mass Map

为了描述任意物理过程，用户只需要定义公式中的 $\mathbf{A}$ 和 $\mathbf{c}$。框架根据**测试函数的形式**（是配对 $\nabla v$ 还是配对 $v$），将它们划分为两类核函数。

### (1) Tensor Map (`get_tensor_map`)
*   **数学对应**：对应公式中的 $\mathbf{A}(\boldsymbol{u}, \nabla \boldsymbol{u}, \boldsymbol{x})$。
*   **配对对象**：在积分中，它总是与测试函数的梯度 **$\nabla v$** 进行内积。
*   **物理意义**：通常代表通过边界传递的量，即**“通量” (Flux)** 或 **“应力” (Stress)**。
    *   它描述了物理量在空间中的传递、扩散或抵抗变形的能力。
*   **典型例子**：
    *   **固体力学**：应力张量 $\boldsymbol{\sigma}$ （$A = \sigma$）。
    *   **热传导**：热通量 $\boldsymbol{q}$ （$A = -k\nabla T$）。
    *   **静电场**：电位移矢量 $\boldsymbol{D}$。

### (2) Mass Map (`get_mass_map`)
> **注意**：这里的 "Mass" 是一个广义概念，**不要**将其狭隘地理解为有限元中的“质量矩阵”（Mass Matrix）。在 JAX-FEM 中，凡是**不经过分部积分、直接与测试函数 $v$ 作用**的项，统统归入 Mass Map，包括对流项、源项、甚至非线性的代数项。
*   **数学对应**：对应公式中的 $\mathbf{c}(\boldsymbol{u}, \nabla \boldsymbol{u}, \boldsymbol{x})$。
*   **配对对象**：在积分中，它总是直接与测试函数 **$v$** 进行点积。
*   **物理意义**：通常代表在体积内部产生或消耗的量，即**“源项” (Source)**、**“反应项”** 或 **“体积力”**。
    *   它描述了物质内部的生成、转化、惯性或对流效应。
*   **典型例子**：
    *   **动力学**：惯性项 $\rho \ddot{u}$。
    *   **化学/生物**：反应项 $R(u)$。
    *   **流体力学**：对流项 $\mathbf{v} \cdot \nabla u$（注意：虽然包含梯度，但它不通过分部积分转移，所以属于 Mass Map）。
    *   **瞬态问题**：时间导数项 $\frac{\partial u}{\partial t}$。

---

## 3. 全局信息的自由流动

这套设计哲学的一个重要细节是：**不要被名字迷惑**。

虽然 `Tensor Map` 通常处理梯度相关项（如胡克定律），而 `Mass Map` 通常处理值相关项（如反应速率），但 JAX-FEM 在实现上给予了极大的自由度。

**这两个核函数都拥有“全知全能”的输入权限：**

```text
Input (u, ∇u, x) 
     |
     +---> [ Tensor Map ] ---> 乘 ∇v ---> 积分 Part 1 (Flux/Stress)
     |
     +---> [  Mass Map  ] ---> 乘  v ---> 积分 Part 2 (Source/Force)
```

$$
f(\boldsymbol{u}, \nabla \boldsymbol{u}, \boldsymbol{x}) \to \text{Output} \tag{3}
$$
这意味着：
*   你可以在 `Tensor Map` 中使用 $u$（例如：随温度变化的导热系数 $k(T) \nabla T$）。
*   你可以在 `Mass Map` 中使用 $\nabla u$（例如：流体对流项 $\mathbf{v} \cdot \nabla u$）。

**分类的唯一标准，仅仅是看你想让这一项在积分时乘 $\nabla v$ 还是乘 $v$。**

---

## 4. 这种设计带来了什么？

理解了这套数学结构，就能明白 JAX-FEM 为什么这样设计接口：

1.  **物理与数值的完美解耦**
    作为用户，你不需要关心“刚度矩阵”怎么组装，也不需要关心“高斯积分”怎么做。你只需要关注物理本构：
    > “给我该点的状态（$u, \nabla u$），我告诉你该点的应力（Tensor）或源项（Mass）。”

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


这就是 JAX-FEM 的核心哲学：**通过标准化的弱形式拆解，实现物理建模的模块化与可微化。**


---


## 5. 实战指南：如何处理复杂的 PDE 项

让我们通过几个具体的物理场景，看看如何将 PDE 拆解到这两个核函数中。

### 案例 A：非线性扩散（依赖 $u$ 的扩散系数）

**方程**：

$$
-\nabla \cdot (k(u)\nabla u) = f \tag{4}
$$

- **分析**：这一项被散度算子 $-\nabla \cdot$ 包裹。在弱形式中，它将变为 $\int k(u)\nabla u \cdot \nabla v$。
    
- **归属**：因为与 $\nabla v$ 乘，所以属于 **Tensor Map**。
    
- **代码逻辑**：
    
    ```python
    def get_tensor_map(self):
        def flux(u, u_grad, x):
            # u shape: (1,), u_grad shape: (dim,)
            # 在 Tensor Map 中读取 u 来计算系数
            k = 1.0 + u**2 
            return k * u_grad
        return flux
    ```
    

### 案例 B：对流项（包含 $\nabla u$ 的源项）

**方程**：

$$
\mathbf{a} \cdot \nabla u = f \tag{5}
$$

（$\mathbf{a}$ 为速度向量）

- **分析**：这一项没有被散度包裹。在弱形式中，它是 $\int (\mathbf{a} \cdot \nabla u)v$。
    
- **归属**：因为与 $v$ 乘，所以属于 **Mass Map**。即便它包含梯度 $\nabla u$，它依然属于 Mass Map。
    
- **代码逻辑**：
    
    ```python
    def get_mass_map(self):
        def convection(u, u_grad, x):
            # u_grad shape: (dim,)
            # 在 Mass Map 中读取 u_grad 来计算对流
            velocity = np.array([1.0, 0.0, 0.0])
            return np.dot(velocity, u_grad)
        return convection
    ```
    

### 案例 C：反应项与双势阱

**方程**：

$$
u^3 - u = 0 \tag{6}
$$

- **分析**：纯代数项。弱形式为 $\int (u^3 - u)v$。
    
- **归属**：与 $v$ 乘，属于 **Mass Map**。
    
- **代码逻辑**：
    
    ```python
    def get_mass_map(self):
        def reaction(u, u_grad, x):
            # u shape: (1,)
            return u**3 - u
        return reaction
    ```
    

---

## 6. 总结表：PDE 项归类速查

在面对一个陌生的 PDE 项时，请参照下表决定将其放入哪个核函数：

| PDE 中的项                               | 弱形式中的配对         | 应放入的核函数     | 核心特征 (判据)                             |
| ---------------------------------------- | ---------------------- | ------------------ | ------------------------------------------- |
| $-\nabla \cdot (k\nabla u)$              | $\dots \cdot \nabla v$ | **get_tensor_map** | **被散度 $\nabla \cdot$ 包裹** (需分部积分) |
| $-\nabla \cdot (k(u)\nabla u)$           | $\dots \cdot \nabla v$ | **get_tensor_map** | 同上 (系数非线性不影响归类)                 |
| $\mathbf{a} \cdot \nabla u$ (对流)       | $\dots \cdot v$        | **get_mass_map**   | **裸露在外** (虽含 $\nabla u$ 但不分部积分) |
| $cu^2$ (反应/源)                         | $\dots \cdot v$        | **get_mass_map**   | **裸露在外** (直接作用于体积元)             |
| $\frac{\partial u}{\partial t}$ (时间项) | $\dots \cdot v$        | **get_mass_map**   | **裸露在外** (时间导数视为标量场)           |

**核心口诀：**  
**被散度包裹的进 Tensor Map，裸露在外面的进 Mass Map。两者都可以随意调用 $u$ 和 $\nabla u$ 的数据。**
