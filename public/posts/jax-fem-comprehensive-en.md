# JAX-FEM Core Design Philosophy: Usage Based on "Weak Form Decomposition"

The design philosophy of JAX-FEM is not tailored for a specific physical problem (such as linear elasticity) but rather to solve a wide range of partial differential equations (PDEs). To understand the design of its Kernel System, we need to step out of specific physical contexts and start from the mathematical structure of **variational methods** and **weak forms**.

In short, JAX-FEM abstracts all physical problems into a combination of two core operators.

## 1. How It Views the World: The General Equation

From the perspective of JAX-FEM, the vast majority of physical equilibrium problems (whether mechanics, thermodynamics, or fluids) can be summarized in the following **general PDE form**:

$$
-\nabla \cdot \mathbf{A}(\boldsymbol{u}, \nabla \boldsymbol{u}, \boldsymbol{x}) + \mathbf{c}(\boldsymbol{u}, \nabla \boldsymbol{u}, \boldsymbol{x}) = \boldsymbol{f}
$$

To solve this on a computer, we need to convert it into an integral form (i.e., the **weak form**). We multiply both sides of the equation by a test function $v$ and integrate over the entire domain.
Here comes the key step: for the first term (the divergence term), we apply integration by parts (Gauss's theorem) to transfer the differential operator onto the test function.

Ultimately, the equation structure that the solver actually faces is as follows:

$$
\underbrace{\int_{\Omega} \mathbf{A}(\boldsymbol{u}, \nabla \boldsymbol{u}, \boldsymbol{x}) : \nabla \boldsymbol{v} \, dx}_{\text{Part 1: Tensor Map}} + \underbrace{\int_{\Omega} \mathbf{c}(\boldsymbol{u}, \nabla \boldsymbol{u}, \boldsymbol{x}) \cdot \boldsymbol{v} \, dx}_{\text{Part 2: Mass Map}} = \text{External Work}
$$

This formula explains everything. The design philosophy of JAX-FEM is a **direct mapping of the two integral terms above**.

## 2. Two Core Pillars: Tensor Map and Mass Map

To describe any physical process, the user only needs to define $\mathbf{A}$ and $\mathbf{c}$ in the formula. The framework classifies them into two types of kernel functions based on the **form of the test function** (whether it pairs with $\nabla v$ or $v$).

### (1) Tensor Map (`get_tensor_map`)
*   **Mathematical Correspondence**: Corresponds to $\mathbf{A}(\boldsymbol{u}, \nabla \boldsymbol{u}, \boldsymbol{x})$ in the formula.
*   **Pairing Object**: In the integral, it always performs an inner product with the gradient of the test function, **$\nabla v$**.
*   **Physical Meaning**: Usually represents a quantity transmitted through boundaries, i.e., **"Flux"** or **"Stress"**.
    *   It describes the ability of a physical quantity to transmit, diffuse, or resist deformation in space.
*   **Typical Examples**:
    *   **Solid Mechanics**: Stress tensor $\boldsymbol{\sigma}$ ($A = \sigma$).
    *   **Heat Conduction**: Heat flux $\boldsymbol{q}$ ($A = -k\nabla T$).
    *   **Electrostatics**: Electric displacement vector $\boldsymbol{D}$.

### (2) Mass Map (`get_mass_map`)
*   **Mathematical Correspondence**: Corresponds to $\mathbf{c}(\boldsymbol{u}, \nabla \boldsymbol{u}, \boldsymbol{x})$ in the formula.
*   **Pairing Object**: In the integral, it always performs a dot product directly with the test function **$v$**.
*   **Physical Meaning**: Usually represents a quantity generated or consumed within the volume, i.e., **"Source Term"**, **"Reaction Term"**, or **"Body Force"**.
    *   It describes generation, transformation, inertia, or convection effects within the material.
*   **Typical Examples**:
    *   **Dynamics**: Inertia term $\rho \ddot{u}$.
    *   **Chemistry/Biology**: Reaction term $R(u)$.
    *   **Fluid Mechanics**: Convection term $\mathbf{v} \cdot \nabla u$ (Note: Although it contains a gradient, it is not transferred via integration by parts, so it belongs to the Mass Map).
    *   **Transient Problems**: Time derivative term $\frac{\partial u}{\partial t}$.

## 3. Free Flow of Global Information

A crucial detail when using this design is: **Do not be misled by the names.**

Although `Tensor Map` usually handles gradient-related terms (like Hooke's Law) and `Mass Map` usually handles value-related terms (like reaction rates), JAX-FEM grants immense freedom in implementation.

**Both kernel functions have "omniscient" input permissions:**
$$
f(\boldsymbol{u}, \nabla \boldsymbol{u}, \boldsymbol{x}) \to \text{Output}
$$
This means:
*   You can use $u$ in a `Tensor Map` (e.g., temperature-dependent thermal conductivity $k(T) \nabla T$).
*   You can use $\nabla u$ in a `Mass Map` (e.g., fluid convection term $\mathbf{v} \cdot \nabla u$).

**The only criterion for classification is simply whether you want this term to be multiplied by $\nabla v$ or by $v$ during integration.**

## 4. What Does This Design Bring?

Understanding this mathematical structure reveals why JAX-FEM designed its interface this way:

1.  **Perfect Decoupling of Physics and Numerics**
    As a user, you don't need to care about how the "stiffness matrix" is assembled or how "Gaussian integration" is performed. You only need to focus on the physical constitutive laws—**given a state, return the stress or source term**:
    > Give me the state at this point ($u, \nabla u$), and I will tell you the stress (Tensor) or source term (Mass) at this point.

2.  **Cornerstone of Automatic Differentiation**
    Because $\mathbf{A}$ and $\mathbf{c}$ are defined as pure mathematical functions, JAX can leverage Automatic Differentiation (AD) technology:
    *   Differentiate the residual $\frac{\partial R}{\partial u}$ to **automatically generate** the tangent stiffness matrix.
    *   This makes switching from linear problems to highly nonlinear problems (like hyperelasticity, plasticity) require almost no changes to the code structure.

3.  **Minimalist Extensibility**
    Want to add a new physical field?
    *   If it's diffusion-based (like heat conduction), write a `get_tensor_map`.
    *   If it's reaction-based (like chemistry), write a `get_mass_map`.
    *   If it's coupled, put them together.
    The framework handles all the rest automatically.

This is the core logic of JAX-FEM: **Achieving modularization and differentiability of physical modeling through standardized weak form decomposition.**

## 5. Practical Guide: How to Handle Complex PDE Terms

Let's look at how to decompose PDEs into these two kernel functions through several specific physical scenarios.

### Case A: Nonlinear Diffusion (Diffusion coefficient dependent on $u$)

**Equation**:

$$
-\nabla \cdot (k(u)\nabla u) = f
$$

- **Analysis**: This term is wrapped by the divergence operator $-\nabla \cdot$. In the weak form, it becomes $\int k(u)\nabla u \cdot \nabla v$.
    
- **Classification**: Since it multiplies with $\nabla v$, it belongs to the **Tensor Map**.
    
- **Code Logic**:
    
    ```python
    def get_tensor_map(self):
        def flux(u, u_grad, x):
            # Read u in Tensor Map to calculate coefficient
            k = 1.0 + u**2 
            return k * u_grad
        return flux
    ```

### Case B: Convection Term (Source term containing $\nabla u$)

**Equation**:

$$
\mathbf{a} \cdot \nabla u = f
$$

($\mathbf{a}$ is the velocity vector)

- **Analysis**: This term is not wrapped by divergence. In the weak form, it is $\int (\mathbf{a} \cdot \nabla u)v$.
    
- **Classification**: Since it multiplies with $v$, it belongs to the **Mass Map**. Even though it contains the gradient $\nabla u$, it still belongs to the Mass Map.
    
- **Code Logic**:
    
    ```python
    def get_mass_map(self):
        def convection(u, u_grad, x):
            # Read u_grad in Mass Map to calculate convection
            velocity = np.array([1.0, 0.0, 0.0])
            return np.dot(velocity, u_grad)
        return convection
    ```

### Case C: Reaction Term and Double-Well Potential

**Equation**:

$$
u^3 - u = 0
$$

- **Analysis**: Pure algebraic term. Weak form is $\int (u^3 - u)v$.
    
- **Classification**: Multiplies with $v$, belongs to **Mass Map**.
    
- **Code Logic**:
    
    ```python
    def get_mass_map(self):
        def reaction(u, u_grad, x):
            return u**3 - u
        return reaction
    ```

---

## 6. Summary Table: PDE Term Classification Quick Reference

When facing an unfamiliar PDE term, refer to the table below to decide which kernel function to place it in:

| Term in PDE                              | Pairing in Weak Form   | Target Kernel Function | Reason                                                                     |
| ---------------------------------------- | ---------------------- | ---------------------- | -------------------------------------------------------------------------- |
| $-\nabla \cdot (k\nabla u)$              | $\dots \cdot \nabla v$ | **get_tensor_map**     | Paired with $\nabla v$ after integration by parts                          |
| $-\nabla \cdot (k(u)\nabla u)$           | $\dots \cdot \nabla v$ | **get_tensor_map**     | Still paired with $\nabla v$ even if coefficient depends on $u$            |
| $\mathbf{a} \cdot \nabla u$ (Convection) | $\dots \cdot v$        | **get_mass_map**       | No integration by parts, paired with $v$ (even if dependent on $\nabla u$) |
| $cu^2$ (Reaction)                        | $\dots \cdot v$        | **get_mass_map**       | Directly paired with $v$                                                   |
| $\frac{\partial u}{\partial t}$ (Time)   | $\dots \cdot v$        | **get_mass_map**       | Directly paired with $v$                                                   |

**Core Point:**  
**If wrapped by divergence, it goes into Tensor Map; if exposed, it goes into Mass Map. Both can access data from $u$ and $\nabla u$ freely.**

Below, I highlight the three most typical examples from the official documentation: **Linear Elasticity**, **Hyperelasticity**, and **J2 Plasticity**.

The code structure of JAX-FEM is very standardized. Through these three examples, one can clearly understand the underlying FEM (Finite Element Method) algorithm logic and how to leverage JAX's automatic differentiation features to simplify physical modeling.

Generally, solving a problem with JAX-FEM involves several core steps:

1.  **Import relevant libraries**.
2.  **Define the weak form of the problem (Kernel functions)**: This is the most critical part.
3.  **Define Boundary Conditions (BCs)**.
4.  **Solving and Post-processing**.

I will break down these steps in detail across three cases.

<!-- TAB_BREAK: Linear Elasticity -->

# JAX-FEM Deep Dive (I): Mathematical Principles and Code Implementation of Linear Elasticity

In Finite Element Analysis (FEM), the linear elasticity problem is the most basic and important introductory case. Although the JAX-FEM code looks very concise, with only a few dozen lines, it hides complete continuum mechanics and variational principles behind it. Let's start here to deeply understand how JAX-FEM works.

## 1. From Strong Form to Weak Form: Why? How to Derive?

### 1.1 Strong Form

For an elastic body occupying space $\Omega$, ignoring inertial forces (quasi-static), its governing equation (equilibrium equation) **Strong Form** is as follows:

$$
-\nabla \cdot \boldsymbol{\sigma} = \boldsymbol{b} \quad \text{in } \Omega
$$

Where:
*   $\boldsymbol{\sigma}$ is the second-order Cauchy Stress Tensor.
*   $\boldsymbol{b}$ is the Body Force vector (e.g., gravity; ignored in this example, set to 0).
*   $\nabla \cdot$ is the divergence operator.

**Boundary Conditions (BCs)**:
To ensure the equation has a unique solution, we must define boundaries:
1.  **Dirichlet Boundary (Essential Boundary Condition)** $\Gamma_D$: Prescribes displacement.
    $$ \boldsymbol{u} = \boldsymbol{u}_D \quad \text{on } \Gamma_D $$
    (In this example, the left end of the cantilever beam is fixed, i.e., $\boldsymbol{u}=\boldsymbol{0}$).
2.  **Neumann Boundary (Natural Boundary Condition)** $\Gamma_N$: Prescribes traction.
    $$ \boldsymbol{\sigma} \cdot \boldsymbol{n} = \boldsymbol{t} \quad \text{on } \Gamma_N $$
    Where $\boldsymbol{n}$ is the boundary outward normal, and $\boldsymbol{t}$ is the force vector on the surface. (In this example, the right end of the cantilever beam is subjected to an upward pulling force).

### 1.2 Why Use Weak Form?

The strong form requires the equation to hold strictly at **every point** in the domain. This is very unfriendly for numerical computation because:
1.  **Continuity requirements are too high**: The strong form contains second-order derivatives (since $\sigma \sim \nabla u$, and the equation is $\nabla \cdot \sigma$, so it is $\nabla \cdot \nabla u$). This means the displacement function must be twice continuously differentiable, which is impossible to satisfy strictly.
2.  **Complex geometries are hard to solve**: Finding an analytical solution that satisfies point-wise equilibrium for arbitrarily shaped objects is nearly impossible.

The idea of the **Weak Form** is: I don't require the equation to be strictly 0 at every point; I only require its **weighted average** over the entire domain to be 0. This lowers the smoothness requirement for the solution, making piecewise polynomials (finite elements) possible.

### 1.3 Rigorous Derivation of Weak Form

This is the key step to understanding the JAX-FEM Kernel.

![Integration by Parts Geometric Illustration](/images/Integration%20by%20Parts%20Geometric%20Illustration.avif)

**Step 1: Weighted Integration**
Dot product both sides of the equilibrium equation with a **Test Function** $\boldsymbol{v}$ (also called virtual displacement) and integrate over the entire volume $\Omega$:

$$
-\int_{\Omega} (\nabla \cdot \boldsymbol{\sigma}) \cdot \boldsymbol{v} \, dx = \int_{\Omega} \boldsymbol{b} \cdot \boldsymbol{v} \, dx
$$

Here, we require the test function $\boldsymbol{v}$ to be 0 on the Dirichlet boundary $\Gamma_D$.

**Step 2: Integration by Parts (Using Gauss's Divergence Theorem)**
This is the magic step. Using the vector identity $\nabla \cdot (\boldsymbol{\sigma}^T \boldsymbol{v}) = (\nabla \cdot \boldsymbol{\sigma}) \cdot \boldsymbol{v} + \boldsymbol{\sigma} : \nabla \boldsymbol{v}$ (where $:$ denotes the double dot product, i.e., tensor inner product), we can rewrite the term on the left.

According to Gauss's Divergence Theorem $\int_\Omega \nabla \cdot \boldsymbol{A} \, dx = \int_{\partial\Omega} \boldsymbol{A} \cdot \boldsymbol{n} \, ds$, we have:

$$
\int_{\Omega} (\nabla \cdot \boldsymbol{\sigma}) \cdot \boldsymbol{v} \, dx = \int_{\partial\Omega} (\boldsymbol{\sigma} \cdot \boldsymbol{n}) \cdot \boldsymbol{v} \, ds - \int_{\Omega} \boldsymbol{\sigma} : \nabla \boldsymbol{v} \, dx
$$

Substitute this back into the integral equation from Step 1:

$$
-\left( \int_{\partial\Omega} (\boldsymbol{\sigma} \cdot \boldsymbol{n}) \cdot \boldsymbol{v} \, ds - \int_{\Omega} \boldsymbol{\sigma} : \nabla \boldsymbol{v} \, dx \right) = \int_{\Omega} \boldsymbol{b} \cdot \boldsymbol{v} \, dx
$$

Rearrange to move the volume integral term containing $\boldsymbol{\sigma}$ to the left:

$$
\int_{\Omega} \boldsymbol{\sigma} : \nabla \boldsymbol{v} \, dx = \int_{\Omega} \boldsymbol{b} \cdot \boldsymbol{v} \, dx + \int_{\partial\Omega} (\boldsymbol{\sigma} \cdot \boldsymbol{n}) \cdot \boldsymbol{v} \, ds
$$

**Step 3: Introduce Boundary Conditions**
The boundary $\partial\Omega$ is divided into two parts: $\Gamma_D$ and $\Gamma_N$.
*   On $\Gamma_D$, we prescribed the test function $\boldsymbol{v} = \boldsymbol{0}$, so the surface integral on this part is 0.
*   On $\Gamma_N$, according to the Neumann boundary condition, we know $\boldsymbol{\sigma} \cdot \boldsymbol{n} = \boldsymbol{t}$.

Thus, we obtain the final **Weak Form**:

$$
\underbrace{\int_{\Omega} \boldsymbol{\sigma}(\boldsymbol{u}) : \nabla \boldsymbol{v} \, dx}_{\text{Internal Virtual Work}} = \underbrace{\int_{\Omega} \boldsymbol{b} \cdot \boldsymbol{v} \, dx + \int_{\Gamma_N} \boldsymbol{t} \cdot \boldsymbol{v} \, ds}_{\text{External Virtual Work}}
$$

This formula is the core equation that the JAX-FEM solver needs to solve.

---

## 2. Constitutive Relation: Hooke's Law

In the integral term on the left side of the weak form, $\boldsymbol{\sigma}$ is unknown. We need to relate stress $\boldsymbol{\sigma}$ to displacement $\boldsymbol{u}$ through **constitutive equations**.

For linear elastic materials:
1.  **Geometric Equation (Strain-Displacement Relation)**:
    $$ \boldsymbol{\epsilon} = \frac{1}{2} (\nabla \boldsymbol{u} + (\nabla \boldsymbol{u})^T) $$
2.  **Physical Equation (Stress-Strain Relation, Hooke's Law)**:
    $$ \boldsymbol{\sigma} = \lambda \text{tr}(\boldsymbol{\epsilon})\boldsymbol{I} + 2\mu\boldsymbol{\epsilon} $$

Where:
*   $\lambda, \mu$ are Lame parameters, calculated from Young's modulus $E$ and Poisson's ratio $\nu$.
*   $\text{tr}(\boldsymbol{\epsilon})$ is the trace of the strain tensor (volumetric strain).
*   $\boldsymbol{I}$ is the identity tensor.

## 3. Detailed Code Implementation

The framework of JAX-FEM is very ingenious. As users, we don't need to write the integral sign $\int$ because the finite element framework automatically handles numerical integration on the mesh. **What we need to provide is simply the "Kernel Function" inside the integral sign.**

### 3.1 Defining the Volume Integral Kernel (`get_tensor_map`)

Recall the term on the left side of the weak form: $\int_{\Omega} \boldsymbol{\sigma} : \nabla \boldsymbol{v} \, dx$.
Mathematically, this is a bilinear form $a(u, v)$. JAX-FEM generalizes it to solve equations of the form $-\nabla \cdot f(\nabla u) = \dots$.
Here, we need to define the mapping function from **displacement gradient** ($\nabla u$) to **stress** ($\sigma$).

```python
# 1. Define material constants
E = 70e3
nu = 0.3
# Convert engineering constants to Lame parameters, corresponding to \mu and \lambda in the formula
mu = E/(2.*(1.+nu))
lmbda = E*nu/((1+nu)*(1-2*nu))

class LinearElasticity(Problem):
    def get_tensor_map(self):
        # The input u_grad to this function is \nabla u (a 3x3 matrix)
        def stress(u_grad):
            # Corresponds to geometric equation: \epsilon = 0.5 * (\nabla u + \nabla u^T)
            epsilon = 0.5 * (u_grad + u_grad.T)
            
            # Corresponds to constitutive equation: \sigma = \lambda * tr(\epsilon) * I + 2 * \mu * \epsilon
            # np.trace(epsilon) calculates the trace
            # np.eye(self.dim) generates identity matrix I
            sigma = lmbda * np.trace(epsilon) * np.eye(self.dim) + 2*mu*epsilon
            
            return sigma
        
        # Return this function, JAX-FEM will automatically integrate and differentiate it
        return stress
```
**Correspondence between code and formula:**
*   `u_grad` $\leftrightarrow$ $\nabla \boldsymbol{u}$
*   `epsilon` $\leftrightarrow$ $\boldsymbol{\epsilon}$
*   `sigma` $\leftrightarrow$ $\boldsymbol{\sigma}$
*   JAX-FEM will automatically take this `sigma` in the background to perform the inner product with the test function's gradient $\nabla \boldsymbol{v}$ and integrate.

### 3.2 Defining the Surface Force Kernel (`get_surface_maps`)

Recall the boundary integral term on the right side of the weak form: $\int_{\Gamma_N} \boldsymbol{t} \cdot \boldsymbol{v} \, ds$.
This term represents the Neumann boundary condition. We need to define $\boldsymbol{t}$ (Traction vector).

```python
    def get_surface_maps(self):
        # Define surface force function
        # u: current displacement (unused in this simple Neumann condition, but may be used in complex conditions like follower loads)
        # x: spatial coordinates
        def surface_map(u, x):
            # Return vector [0, 0, 100], corresponding to t in the formula
            # Represents applying a surface force of 100 in the Z-axis direction
            return np.array([0., 0., 100.])
        
        return [surface_map]
```

**Special Note**: Only the magnitude and direction of the force are defined here. As for which surface this force is applied to (where $\Gamma_N$ is), it is specified in subsequent code via `problem = LinearElasticity(..., location_fns=...)`. In the official example, it is determined by a lambda function checking if the coordinates are on the right end face of the beam.

### 3.3 Why is no Body Force defined?

It is easy to notice that the code does not handle the term $\int_{\Omega} \boldsymbol{b} \cdot \boldsymbol{v} \, dx$.
This is because in this example, gravity is assumed to be ignored, i.e., $\boldsymbol{b} = [0, 0, 0]$. If gravity needs to be added, JAX-FEM usually has similar `get_mass_map` methods or defines it directly in the source term.

## 4. Summary: JAX-FEM Abstraction Logic

Through the linear elasticity example, we see the core abstraction logic of JAX-FEM:

1.  **Physical Problem**: $-\nabla \cdot \boldsymbol{\sigma} = \boldsymbol{b}$
2.  **Weak Form**: $\int \boldsymbol{\sigma} : \nabla \boldsymbol{v} \, dx = \int \boldsymbol{t} \cdot \boldsymbol{v} \, ds$
3.  **Code Implementation**:
    *   The user does not write the integral, only the core variables of the integrand function.
    *   `get_tensor_map` defines the physical law (constitutive) of $\nabla \boldsymbol{u} \to \boldsymbol{\sigma}$.
    *   `get_surface_maps` defines $\boldsymbol{t}$.
    *   `JAX`'s automatic differentiation engine automatically calculates the required Jacobian matrix (stiffness matrix) to complete the `solve` process.

This design makes extending from linear elasticity to hyperelasticity or plasticity very easy—just modify the mathematical formula inside `stress(u_grad)`, and the outer integration framework remains completely unchanged.

<!-- TAB_BREAK: Hyperelasticity -->

Okay, next we delve into the second example in the JAX-FEM documentation: **Hyperelasticity**.

If linear elasticity is the "Hello World" of finite elements, then hyperelasticity is the best stage to demonstrate the core advantage of JAX-FEM: **Automatic Differentiation (AD)**.

---

# JAX-FEM Deep Dive (II): Hyperelasticity and Automatic Differentiation

## 1. Physical Background: Why Can't We Use Linear Elasticity Anymore?

### 1.1 Large Deformation and Nonlinearity
Linear elasticity theory is built on two assumptions:
1.  **Physical Linearity**: Stress is proportional to strain (Hooke's Law).
2.  **Geometric Linearity**: Deformation is very small, small enough to ignore the effect of deformation on geometry (i.e., $\boldsymbol{x} \approx \boldsymbol{X}$).

However, in materials like rubber, biological soft tissues, or when structures undergo **Finite Deformation (Large Deformation)**, the above assumptions fail:
*   **Geometric Nonlinearity**: Displacements are large, and one must distinguish between the state before deformation (reference configuration $\Omega_0$) and after deformation (current configuration $\Omega$).
*   **Physical Nonlinearity**: The stress-strain relationship is no longer a straight line and is usually described by a **Strain Energy Density Function** $\Psi$.

### 1.2 Key Geometric Quantity: Deformation Gradient
In hyperelasticity, the core kinematic quantity is no longer the infinitesimal strain $\boldsymbol{\epsilon}$, but the **Deformation Gradient Tensor** $\boldsymbol{F}$.

Let $\boldsymbol{X}$ be the position of a material point in the reference configuration, and $\boldsymbol{x} = \boldsymbol{X} + \boldsymbol{u}$ be the position after deformation.
$$
\boldsymbol{F} = \frac{\partial \boldsymbol{x}}{\partial \boldsymbol{X}} = \boldsymbol{I} + \nabla \boldsymbol{u}
$$
Where $\boldsymbol{I}$ is the identity matrix, and $\nabla \boldsymbol{u}$ is the displacement gradient.

![Lagrangian vs Eulerian Kinematic Description](/images/Lagrangian%20vs%20Eulerian%20Kinematic%20Description.avif)

---

## 2. Strong Form and Weak Form

### 2.1 Strong Form
In the reference configuration (Lagrangian description), the equilibrium equation is usually written as:

$$
-\nabla \cdot \boldsymbol{P} = \boldsymbol{b} \quad \text{in } \Omega_0
$$

Note that the stress $\boldsymbol{P}$ appearing here is the **First Piola-Kirchhoff Stress Tensor (1st PK Stress)**.
*   $\boldsymbol{P}$ is non-symmetric.
*   It describes the force in the current configuration relative to the area in the **reference configuration**.

### 2.2 Weak Form
The derivation process is almost identical to linear elasticity (multiply by test function $\boldsymbol{v}$, integration by parts, apply Gauss's theorem). We integrate over the reference configuration $\Omega_0$:

$$
\int_{\Omega_0} \boldsymbol{P} : \nabla \boldsymbol{v} \, dX = \int_{\Omega_0} \boldsymbol{b} \cdot \boldsymbol{v} \, dX + \int_{\Gamma_N} \boldsymbol{t} \cdot \boldsymbol{v} \, dS
$$

The formula looks very similar to linear elasticity $\int \boldsymbol{\sigma} : \nabla \boldsymbol{v}$ because their structure is the same. **The difference lies in the calculation method of stress $\boldsymbol{P}$ becoming extremely complex.**

---

## 3. Constitutive Model: Neo-Hookean Material

In this example, a **compressible Neo-Hookean model** is used. The constitutive relation of hyperelastic materials does not give the stress formula directly but first defines the **Strain Energy Density Function $\Psi(\boldsymbol{F})$**.

### 3.1 Energy Function Formula
According to the documentation, the energy function is defined as:

$$
\Psi(\boldsymbol{F}) = \frac{\mu}{2} (J^{-2/3} I_1 - 3) + \frac{\kappa}{2} (J - 1)^2
$$

Where:
*   $J = \det(\boldsymbol{F})$: Jacobian determinant, representing the volume change ratio ($J=1$ means incompressible).
*   $I_1 = \text{tr}(\boldsymbol{C}) = \text{tr}(\boldsymbol{F}^T \boldsymbol{F})$: The first invariant of the Right Cauchy-Green tensor.
*   $\mu$: Shear modulus.
*   $\kappa$: Bulk modulus.

### 3.2 Stress Derivation (The Most Tedious Step)
To solve the weak form equation, we need stress $\boldsymbol{P}$, not energy $\Psi$. Their relationship is:

$$
\boldsymbol{P} = \frac{\partial \Psi}{\partial \boldsymbol{F}}
$$

**In traditional FEM programming (like C++ or Fortran)**, programmers must calculate this derivative by hand. For complex energy functions, deriving $\frac{\partial \Psi}{\partial \boldsymbol{F}}$ is extremely tedious and error-prone. You need to use tensor calculus to derive an analytical expression like this:
$$ \boldsymbol{P} = \mu J^{-2/3} (\boldsymbol{F} - \frac{I_1}{3} \boldsymbol{F}^{-T}) + \kappa (J-1) J \boldsymbol{F}^{-T} $$
(This is just simple Neo-Hookean; deriving for complex models is even harder).

**In JAX-FEM**, this step is essentially "dimensionally reduced" by automatic differentiation.

---

## 4. Detailed Code Implementation

JAX-FEM utilizes **JAX's Automatic Differentiation (AD)** feature, allowing you to **only define energy $\Psi$ without deriving stress $\boldsymbol{P}$**.

### 4.1 Defining the Volume Integral Kernel (`get_tensor_map`)

We need to define the mapping: $\nabla \boldsymbol{u} \to \boldsymbol{P}$.

```python
class HyperElasticity(Problem):
    def get_tensor_map(self):

        # --- Step 1: Define scalar energy function Psi(F) ---
        def psi(F):
            # Material parameters
            E = 10.
            nu = 0.3
            mu = E / (2. * (1. + nu))
            kappa = E / (3. * (1. - 2. * nu))
            
            # Calculate kinematic quantities
            # J = det(F)
            J = np.linalg.det(F)
            # J^{-2/3}
            Jinv = J**(-2. / 3.)
            # I1 = tr(F.T @ F)
            I1 = np.trace(F.T @ F)
            
            # Energy density formula (copying the mathematical formula exactly)
            # energy = \mu/2 * (J^{-2/3}I_1 - 3) + \kappa/2 * (J-1)^2
            energy = (mu / 2.) * (Jinv * I1 - 3.) + (kappa / 2.) * (J - 1.)**2.
            return energy

        # --- Step 2: Automatic differentiation to find stress ---
        # Crucial step
        # JAX automatically computes P = d(Psi)/dF
        P_fn = jax.grad(psi)

        # --- Step 3: Define complete mapping from displacement gradient to stress ---
        def first_PK_stress(u_grad):
            # Input u_grad is displacement gradient \nabla u
            I = np.eye(self.dim)
            # Calculate deformation gradient F = I + \nabla u
            F = u_grad + I
            
            # Call the function generated by automatic differentiation to calculate stress P
            P = P_fn(F)
            return P

        return first_PK_stress
```

### 4.2 Code Deep Dive

1.  **`psi(F)`**: Just translate the physical energy formula into Python code. No need to consider how to differentiate.
2.  **`jax.grad(psi)`**:
    *   The input of `psi` is a $3\times3$ matrix $\boldsymbol{F}$, and the output is a scalar Energy.
    *   `jax.grad` automatically generates a new function `P_fn`.
    *   The input of `P_fn` is $\boldsymbol{F}$, and the output is $\nabla_{\boldsymbol{F}} \Psi$, which is the $3\times3$ stress tensor $\boldsymbol{P}$.
    *   All of this is done at compile time, with extremely high execution efficiency.
3.  **`first_PK_stress`**: This is the final kernel passed to the FEM solver. It bridges from $\nabla \boldsymbol{u}$ to $\boldsymbol{F}$ and then to $\boldsymbol{P}$.

![JAX Automatic Differentiation Workflow](/images/JAX%20Automatic%20Differentiation%20Workflow.avif)

### 4.3 Why is this better than traditional methods?
*   **Zero Derivation Cost**: If you want to switch to a different material model (e.g., Mooney-Rivlin or Ogden model), you only need to rewrite the few lines of code in the `psi` function. No need to re-derive stress formulas.
*   **Not Just First Derivative**: Solving nonlinear equations (Newton-Raphson method) requires the Tangent Stiffness Matrix, which is the derivative of stress with respect to strain (second derivative). JAX-FEM can obtain the stiffness matrix inside the solver via `jax.jacfwd` or `jax.hessian` **using automatic differentiation again**. This means the stiffness matrix doesn't need to be handwritten either.

---

## 5. Boundary Condition Settings

This example is a pure displacement control problem:
*   **Right Surface** ($\Gamma_{D1}, x=1$): Fixed, $u=0$.
*   **Left Surface** ($\Gamma_{D2}, x=0$): Apply a specific displacement field.

In the code, this is set via `get_dirichlet_topologies` and `get_dirichlet_bcs`. The complex formula mentioned here:

$$
u_{D2} = \begin{bmatrix} 0 \\ 0.5 + (x_2-0.5)\cos(\frac{\pi}{3}) - (x_3-0.5)\sin(\frac{\pi}{3}) - x_2 \\ \dots \end{bmatrix}
$$

Essentially, this makes the points on the left surface rotate 60 degrees ($\pi/3$) around the central axis and twist.

Since these are Dirichlet boundary conditions, they do not appear in the integral terms of the weak form (or rather, the corresponding test function $v$ is 0 on the boundary, making the boundary integral term vanish), but directly constrain the values of the solution vector.

---

## 6. Summary: Hyperelasticity Problem

Through this example, we understand:

1.  **Physically**: Hyperelasticity handles large deformations, requiring the use of $\boldsymbol{P}$ (1st Piola-Kirchhoff) stress and $\boldsymbol{F}$ (deformation gradient).
2.  **Mathematically**: Stress is the derivative of the energy function $\boldsymbol{P} = \partial \Psi / \partial \boldsymbol{F}$.
3.  **JAX-FEM Implementation**:
    *   Use `jax.grad` to automatically obtain the stress function from the energy function.
    *   Avoid tedious and error-prone tensor derivative derivation.
    *   The integral structure of the weak form $\int \boldsymbol{P}:\nabla \boldsymbol{v}$ remains highly consistent with linear elasticity, reflecting the universality of the framework.

Next, we will enter the most complex **Elastoplasticity problem**, where there is not only nonlinearity but also history dependence (state variable updates).

This is a very critical issue. If you don't understand why the **Newton-Raphson Method** is used, you can't understand the essence of nonlinear finite elements, nor can you appreciate what makes JAX-FEM, a framework based on automatic differentiation, so "powerful."

This section will specifically explain: **The essential difference between linear and nonlinear**, and **how the Newton-Raphson method solves nonlinear problems**.

---

# II. Appendix: What are Nonlinear Solving and the Newton-Raphson Method?

In the previous section on **Linear Elasticity**, it seemed that we just listed the equations and the program solved them in one step.
However, in **Hyperelasticity** (and the subsequent Elastoplasticity) problems, the solver must approximate the true solution layer by layer, like peeling an onion. This is the role of the Newton-Raphson method.

## 1. Why is it called "Nonlinear"?

To understand nonlinearity, first look at what is linear.

### 1.1 Why is Linear Elasticity "Linear"?
In linear elasticity problems, we have two core assumptions:
1.  **Constitutive Linearity**: Stress $\sigma$ is proportional to strain $\epsilon$ (Hooke's Law $\sigma = E \epsilon$).
2.  **Geometric Linearity**: Displacement is extremely small, and the relationship between strain $\epsilon$ and displacement $u$ is linear ($\epsilon \approx \nabla u$).

If we denote the stiffness matrix of the entire system as $K$, the unknown displacement vector as $U$, and the external force vector as $F_{ext}$, then the entire system of equations can be written as:
$$
K \cdot U = F_{ext}
$$
Here $K$ is a **Constant Matrix**. It depends only on the material's initial $E, \nu$ and initial shape. No matter how much force you apply, $K$ does not change.
This is like solving the equation $ax = b$, the solution is $x = b/a$. **Because $K$ is a known constant, $U$ can be calculated with just one matrix inversion (or linear solve).**

### 1.2 Why is Hyperelasticity "Nonlinear"?
In hyperelasticity problems, the situation changes completely:

1.  **Geometric Nonlinearity (Large Deformation)**:
    Deformation gradient $\boldsymbol{F} = \boldsymbol{I} + \nabla \boldsymbol{u}$.
    Strain measure (e.g., Green-Lagrange strain) $\boldsymbol{E} = \frac{1}{2}(\boldsymbol{F}^T\boldsymbol{F} - \boldsymbol{I})$.
    Did you notice? **A quadratic term of $\boldsymbol{u}$ appears here**. It's as if the equation became $ax^2 + bx = c$; you can't solve it directly with division.

2.  **Material Nonlinearity**:
    Stress $\boldsymbol{P}$ is the derivative of the energy function $\Psi$. For example, the Neo-Hookean model contains complex nonlinear functions like $\ln(J)$ or $J^{-2/3}$.
    This means: **Stiffness is no longer constant; stiffness depends on the current state of deformation.** It gets stiffer (or softer) as you pull.

**Conclusion**:
At this point, the equilibrium equation is no longer $K \cdot U = F_{ext}$, but is written in the form of "internal force equals external force":
$$
R(U) = F_{int}(U) - F_{ext} = 0
$$
Where $F_{int}(U)$ is the **Internal Force Vector**, which is a complex nonlinear function of displacement $U$.
We are solving a root-finding problem: **Find a $U$ such that the residual $R(U)$ goes to zero.**

---

## 2. Nonlinear Problem Solver: Newton-Raphson Method

Since we can't solve it in one step, we approximate it through **iterative approximation**. Newton's method is the most powerful tool for finding roots of nonlinear equations.

### 2.1 Intuitive Understanding of the Algorithm (1D Analogy)
Imagine you are looking for the way down a mountain in thick fog (finding the point where $f(x)=0$).
1.  You stand at the current position $x_n$.
2.  You can't see the destination, but you can see the slope under your feet (derivative $f'(x_n)$).
3.  You assume the slope is constant and walk along the tangent direction to where the tangent intersects $0$, taking this as the next position $x_{n+1}$.
4.  Repeat this process until you are stepping on the $0$ line.

![Newton-Raphson Method](/images/NFM.jpg)

### 2.2 Mathematical Derivation (FEM Version)
Our goal is to solve $R(U) = 0$. Assume the solution at step $n$ is $U_n$, but it's not accurate enough; the true solution is $U_n + \Delta U$.
We perform a **Taylor expansion** of $R$ at $U_n$ (ignoring higher-order terms):

$$
R(U_n + \Delta U) \approx R(U_n) + \frac{\partial R}{\partial U}\bigg|_{U_n} \cdot \Delta U = 0
$$

To make $R(U_n + \Delta U) = 0$, we need to solve for the correction $\Delta U$:

$$
\underbrace{\frac{\partial R}{\partial U}\bigg|_{U_n}}_{K_T} \cdot \Delta U = - R(U_n)
$$

Here appears an extremely important matrix — the **Tangent Stiffness Matrix** $K_T$:
$$
K_T = \frac{\partial R}{\partial U} = \frac{\partial F_{int}(U)}{\partial U}
$$
It represents the tangent stiffness of the structure in the **current deformation state**.

### 2.3 Iteration Process
When JAX-FEM solves hyperelasticity problems, this loop is actually running in the background:

1.  **Initialization**: Set $U_0 = 0$.
2.  **Start Iteration** ($k = 0, 1, 2, \dots$):
    *   **Calculate Residual**: Calculate the difference between internal force and external force at the current state $R_k = F_{int}(U_k) - F_{ext}$.
    *   **Check Convergence**: If $||R_k||$ is very small (close to 0), stop and output $U_k$ as the solution.
    *   **Calculate Tangent Stiffness Matrix**: $K_T = \frac{\partial R}{\partial U}\big|_{U_k}$.
    *   **Solve Linear System**: Solve $K_T \cdot \Delta U = -R_k$ to get the increment $\Delta U$.
    *   **Update Displacement**: $U_{k+1} = U_k + \Delta U$.

---

## 3. Core Advantage of JAX-FEM: Automatic Differentiation for $K_T$

When explaining the hyperelasticity code earlier, you might have noticed that we only defined the energy function $\Psi$ and then differentiated it once to get stress $\boldsymbol{P}$.
So, where did the **Tangent Stiffness Matrix $K_T$** (i.e., the second derivative $\frac{\partial^2 \Psi}{\partial \boldsymbol{F}^2}$) needed by Newton's method go?

**In Traditional FEM**:
This is the most headache-inducing part. After deriving the formula for stress $\boldsymbol{P}$, you have to continue differentiating it to derive the Consistent Tangent Modulus. This is a fourth-order tensor with an extremely complex formula; a slight error will cause the program not to converge.

**In JAX-FEM**:
The framework uses automatic differentiation to do it for you!

*   **1st Differentiation**: $\text{Energy} \xrightarrow{\text{grad}} \text{Stress} (\boldsymbol{P})$.
    Corresponding code: `P_fn = jax.grad(psi)`
*   **2nd Differentiation**: $\text{Stress} (\boldsymbol{P}) \xrightarrow{\text{jacobian}} \text{Stiffness} (K_T)$.

Although this step is not explicitly written in the code, when you call JAX-FEM's nonlinear solver (like `solver.solve`), it uses automatic differentiation (usually `jax.jacfwd` or `jax.hessian`) on your residual function $R(U)$ again in the background to **automatically generate** the tangent stiffness matrix $K_T$.

**This is why the stiffness matrix assembly process is completely invisible in the code.**

## 4. Summary: Why Must We Use Newton's Method?

1.  **Nature of Nonlinearity**: The force-displacement relationship in hyperelasticity problems is a curved line, not a straight line. A one-time solution like $K \cdot U = F$ can only solve straight-line problems.
2.  **Linearization Approximation**: Newton's method approximates the curve locally as a straight line via "tangents" ($K_T \cdot \Delta U = -R$), thereby transforming a large nonlinear problem into a series of small linear problems to solve.
3.  **JAX-FEM Advantage**: Newton's method requires derivatives (tangent stiffness). Traditional methods require manual derivation; JAX-FEM relies on automatic differentiation for fully automatic calculation, greatly lowering the threshold for nonlinear finite elements.

---

Thus, the code logic for the hyperelasticity part is complete:
**Physical Modeling (Define $\Psi$) $\to$ Automatic Differentiation (Get $P$ and $K_T$) $\to$ Mathematical Solution (Newton Iteration)**.

<!-- TAB_BREAK: Elastoplasticity -->

This is the final chapter of the JAX-FEM tutorial series, and also the most hardcore part—**J2 Plasticity**.

If hyperelasticity is the introduction to "nonlinearity," then elastoplasticity is the complete form of "nonlinearity." It not only includes material nonlinearity but also introduces **Path Dependence (History Dependence)** and **Inequality Constraints**.

---

# JAX-FEM Deep Dive (III): Elastoplasticity and Return Mapping Algorithm

## 1. Physical Background: Why is Plasticity So Hard?

### 1.1 History Dependence
Linear elasticity and hyperelasticity have one thing in common: **As long as the current deformation (strain) is determined, the current stress is also determined.** They are like springs; pull them apart and let go, and they spring back completely.

But plastic materials (like metals) have "memory."
When you bend a wire (causing plastic deformation) and let go, it doesn't return to its original shape. This means:
**The current stress state depends not only on the current strain but also on what happened before (history variables).**

### 1.2 Core of J2 Plasticity Model
We use the classic **J2 Flow Theory (von Mises Yield Criterion)**.
Core assumptions:
1.  **Strain Decomposition**: Total strain = Elastic strain + Plastic strain
    $$ \boldsymbol{\epsilon} = \boldsymbol{\epsilon}^e + \boldsymbol{\epsilon}^p $$
2.  **Yield Surface**: The standard for judging whether the material enters plasticity.
    $$ f(\boldsymbol{\sigma}) = \sigma_{eq} - \sigma_Y \le 0 $$
    Where $\sigma_{eq}$ is the equivalent stress (Von Mises stress), and $\sigma_Y$ is the yield strength.
    *   $f < 0$: Elastic state.
    *   $f = 0$: Plastic flow.
    *   $f > 0$: **Illegal state** (Stress cannot go outside the yield surface; it must be pulled back).

---

## 2. Algorithm Core: Return Mapping

To solve this inequality constraint problem on a computer, we adopt the **Predictor-Corrector** strategy, also called **Radial Return Mapping Algorithm**.

![J2 Yield Surface Radial Return Corrected](/images/J2%20Yield%20Surface%20Radial%20Return%20Corrected.avif)

This is a two-step logic:

*   **Step 1: Elastic Predictor**
    Assume this step is entirely elastic deformation, ignoring plasticity. Calculate a "trial stress" $\boldsymbol{\sigma}^{trial}$.
*   **Step 2: Plastic Corrector**
    Check if $\boldsymbol{\sigma}^{trial}$ exceeds the yield surface?
    *   **Not exceeded**: Assumption correct, true stress equals trial stress.
    *   **Exceeded**: Plastic yielding occurred. We need to **pull** the stress back to the yield surface along the radial direction.

---

## 3. Detailed Code Implementation

In JAX-FEM, the implementation of elastoplasticity demonstrates how to handle **internal state variables**.

### 3.1 Initialize History Variables (`custom_init`)

Because plasticity depends on history, we need to store the **state at the previous moment** for every integration point.

```python
class Plasticity(Problem):
    def custom_init(self):
        # Get finite element space info
        self.fe = self.fes[0]
        # Initialize strain (epsilons_old) and stress (sigmas_old) from the previous step
        # Shape is (num_cells, num_quads, vector_dim...)
        self.epsilons_old = np.zeros((len(self.fe.cells), self.fe.num_quads, self.fe.vec, self.dim))
        self.sigmas_old = np.zeros_like(self.epsilons_old)
        
        # Register as internal variables for easy updates later
        self.internal_vars = [self.sigmas_old, self.epsilons_old]
```

### 3.2 Defining the Return Mapping Kernel (`get_tensor_map`)

This is the heart of the algorithm. We need to define a function:
**Input**: Current displacement gradient $\nabla u$, and history variables $\boldsymbol{\sigma}_{n-1}, \boldsymbol{\epsilon}_{n-1}$.
**Output**: Current true stress $\boldsymbol{\sigma}_n$.

```python
    def get_maps(self):
        # Helper functions: safe math operations (for numerical stability of auto-diff)
        # Because sqrt(0) gives infinity (1/0) during differentiation, special handling is needed
        def safe_sqrt(x):
            return np.where(x > 0., np.sqrt(x), 0.)

        def safe_divide(x, y):
            return np.where(y == 0., 0., x/y)

        # Core algorithm: Return Mapping
        def stress_return_map(u_grad, sigma_old, epsilon_old):
            sig0 = 250. # Yield strength
            
            # 1. Calculate current total strain
            epsilon_crt = 0.5 * (u_grad + u_grad.T)
            
            # 2. Calculate strain increment d_epsilon
            epsilon_inc = epsilon_crt - epsilon_old
            
            # 3. [Predictor Step] Calculate trial stress sigma_trial
            # Assume increment is all elastic: sigma_trial = sigma_old + D : d_epsilon
            # stress() function is Hooke's Law
            sigma_trial = stress(epsilon_inc) + sigma_old
            
            # 4. Calculate deviatoric stress of trial stress s
            s_dev = sigma_trial - 1./self.dim*np.trace(sigma_trial)*np.eye(self.dim)
            # Calculate von Mises equivalent stress
            s_norm = safe_sqrt(3./2.*np.sum(s_dev*s_dev))
            
            # 5. [Yield Judgment]
            # f_yield > 0 means outside the yield surface
            f_yield = s_norm - sig0
            
            # 6. [Stress Correction]
            # If f_yield > 0, enable correction; otherwise keep as 0
            # f_yield_plus is the distance to return
            f_yield_plus = np.where(f_yield > 0., f_yield, 0.)
            
            # Radial return formula:
            # sigma_new = sigma_trial - (return amount * return direction)
            # Return direction is s_dev / s_norm
            sigma = sigma_trial - safe_divide(f_yield_plus*s_dev, s_norm)
            
            return sigma
            
        return strain, stress_return_map
```

**Code Analysis:**
*   **Tensor Map Classification**: This function ultimately returns `sigma`, which pairs with $\nabla v$ in the weak form, so it belongs to `Tensor Map`.
*   **Differentiability**: The code uses `np.where` (equivalent to `if-else`). In JAX, `where` is differentiable (derivative is like a step function), which allows Newton's method to still calculate the so-called "Algorithmic Consistent Tangent Modulus." **You don't need to hand-derive this extremely complex tangent modulus formula; JAX calculates it automatically.**

### 3.3 State Update (`update_stress_strain`)

Elastoplastic solving is incremental (Time Stepping). Whenever we finish solving a time step (i.e., Newton's method converges, $\text{Residual} \approx 0$), we need to archive the "current state" as the "old state" for use in the next step.

```python
    def update_stress_strain(self, sol):
        # 1. Extract displacement gradients from solution sol
        u_grads = self.fe.sol_to_grad(sol)
        
        # 2. Get vectorized (vmap) stress calculation functions
        vmap_strain, vmap_stress_rm = self.stress_strain_fns()
        
        # 3. Calculate true stress and strain after convergence of this step
        # Note: The calculated new values are assigned to self.sigmas_old here
        self.sigmas_old = vmap_stress_rm(u_grads, self.sigmas_old, self.epsilons_old)
        self.epsilons_old = vmap_strain(u_grads)
        
        # 4. Update internal variable list
        self.internal_vars = [self.sigmas_old, self.epsilons_old]
```

---

## 4. Solving Process Summary

For elastoplastic problems, the outer loop of JAX-FEM (in the main script) typically looks like this:

1.  **Load Loop**: Set a series of boundary conditions (e.g., displacement $0 \to 0.1 \to 0$).
2.  **Newton Iteration** (Inside solver):
    *   Guess displacement $u$.
    *   Call `stress_return_map(u, sigma_old, ...)` to calculate current stress.
    *   JAX automatic differentiation calculates residual $R$ and stiffness matrix $K$.
    *   Update $u$ until equilibrium.
3.  **State Update**:
    *   After Newton's method converges, call `problem.update_stress_strain(sol)`.
    *   Solidify current $\sigma, \epsilon$ as $\sigma_{old}, \epsilon_{old}$.
4.  **Next Load Step**.

---

## 5. Summary: The Advanced Path of Three Examples

Through these three examples, we can clearly see how the capability boundary of JAX-FEM expands:

1.  **Linear Elasticity**:
    *   *Physics*: Linear, $f(\nabla u) = C:\nabla u$.
    *   *JAX Advantage*: Concise code, automatic matrix assembly.
    *   *Map Type*: Pure Tensor Map.

2.  **Hyperelasticity**:
    *   *Physics*: Nonlinear, $\boldsymbol{P} = \partial \Psi / \partial \boldsymbol{F}$.
    *   *JAX Advantage*: **Auto-diff for first derivative** (get stress) and **second derivative** (get tangent stiffness), avoiding tedious derivation.
    *   *Map Type*: Pure Tensor Map.

3.  **Elastoplasticity**:
    *   *Physics*: Nonlinear + History Dependence + Inequality Constraints.
    *   *JAX Advantage*:
        *   **Handling State Variables**: Passing `sigma_old`.
        *   **Differentiation Logic**: Even with `if-else` (yield judgment) and complex radial return algorithms, JAX can still differentiate automatically, obtaining the correct tangent stiffness to ensure Newton's method convergence.
    *   *Map Type*: Tensor Map (with state variables).

At this point, the core logic of JAX-FEM in handling problems from simple to extremely complex mechanics has been clarified. Its core logic remains unchanged: **Define the physical core (Kernel) well, and leave the rest to the framework and automatic differentiation.**

---
Below is a **super detailed** algorithm flowchart for solving **J2 Elastoplasticity problems** with JAX-FEM.

To clearly see how data flows, I divided the process into three levels:
1.  **Outermost Layer**: Time step loop (Loading process).
2.  **Middle Layer**: Newton-Raphson Nonlinear Solver.
3.  **Innermost Layer**: Physical Kernel / Constitutive Law, where JAX automatic differentiation happens.

![Elastoplastic FEM Flowchart Cartoon Version](/images/Elastoplastic%20FEM%20Flowchart%20Cartoon%20Version.avif)

### 2. Detailed Step Analysis

#### **Phase 1: Initialization**
This is preparation work, run only once.
*   **Key Point**: Space must be allocated in memory to store **State Variables**.
    *   `sigma_old`: Stress after convergence of the previous time step.
    *   `epsilon_old`: Strain after convergence of the previous time step.
    *   At the initial moment, they are all zero matrices (assuming no residual stress).

#### **Phase 2: Global Time Stepping**
Because plasticity is **path-dependent**, we cannot calculate the final solution in one step; we must chop the large load (e.g., stretching 0.1mm) into many small steps (e.g., 20 steps, 0.005mm each).
*   **Input**: Boundary conditions for this step (e.g., `u_dirichlet = 0.05`).
*   **Note**: At the start of this step, `sigma_old` is **fixed** (result from the previous step).

#### **Phase 3: Newton-Raphson Solver**
This is the most time-consuming loop. The goal is to find the displacement field $u$ that satisfies force equilibrium ($R=0$) under the current boundary conditions and historical state.
*   **Step 3.1: Calculate Residual $R$**
    The solver "asks" the physical kernel: "If under the current $u$, what is the stress inside the structure? Do the internal forces generated by these stresses balance the external forces?"
*   **Step 3.2: Automatic Differentiation to Calculate Stiffness Matrix $K$**
    *   $K = \frac{\partial R}{\partial u}$.
    *   **JAX's Auto-Diff Capability**: You don't need to write any code to calculate $K$. JAX tracks the entire calculation process from $u$ to $\sigma$ to $R$ (including the `if-else` logic inside), automatically calculating this derivative.
*   **Step 3.3: Linear Solve and Update**
    Solve $K \Delta u = -R$, correct the displacement guess.

#### **Phase 4: Physical Kernel (Return Mapping)**
This is the code we wrote in `get_tensor_map`, and also the **core subgraph** in the diagram.
This process is executed in parallel **for every integration point** (via `vmap`).

1.  **Calculate Increment**: Calculate the total strain caused by the current guess $u$, subtract `epsilon_old`, to get the "trial strain increment" for this step.
2.  **Elastic Predictor**: First assume the material is purely elastic, calculate `sigma_trial`.
3.  **Yield Check**: Calculate von Mises stress, see if it exceeds yield strength $\sigma_0$.
4.  **Plastic Corrector**:
    *   If not exceeded: True stress = Trial stress.
    *   If exceeded: Pull the stress back to the yield surface along the radial direction (stress decreases), this part of the reduced stress converts to plastic strain.

#### **Phase 5: Update State**
**Extremely important step!**
*   When Newton's method converges ($|R| \approx 0$), it means we found the true $u_n$.
*   At this point, we call the kernel again to calculate the final $\sigma_n$ and $\epsilon_n$.
*   **Overwrite Old Data**: Update `sigma_old` to $\sigma_n$, update `epsilon_old` to $\epsilon_n$.
*   Thus, when the next time step starts, calculation will continue based on this new state.

---

### 3. Data Flow Perspective: How do State Variables Change?

To prevent confusion about the `sigma_old` variable during first-time learning, let me explain:

1.  **Before Time Step $n$ starts**: `sigma_old` is the value at time $t_{n-1}$.
2.  **During Newton Iteration (Inner Loop)**:
    *   `sigma_old` **remains unchanged!** It is a constant input.
    *   The kernel calculates `sigma_current`, which changes constantly with the iteration of $u$.
    *   Residual $R$ is calculated based on `sigma_current`.
3.  **After Time Step $n$ ends**:
    *   `sigma_old` is **overwritten** by `sigma_current`.
    *   It becomes the starting point for the next time step.

This is why there is a dedicated `update_stress_strain` function in the JAX-FEM code, which must be manually called after `solver.solve` succeeds.

---

### 4. Q&A on Difficulties (AI Assisted)

---

### Do Phase 3 and Phase 4 form a loop under the same boundary condition? It feels like they shouldn't. Just judge once if it yields, and if it yields, pull it back to the yield surface directly via that formula and it's done.

---
**Ans:** This is a very sharp and deep intuition! You actually touched upon the core contradiction between **"Local"** and **"Global"** levels in Finite Element Method (FEM).

Direct answer to your question:
**Yes, Phase 3 (Newton Solver) and Phase 4 (Physical Kernel) must form a loop. Doing it just once is not enough.**

Although for a **single point (Local)**, given a strain, you can indeed calculate the stress by "pulling back" once (you are right);
However, **this strain itself is wrong** (this is why we loop).

Let me break down this misconception with an intuitive example.

---

#### 1. Core of the Misconception: You think strain is known, but it's not

Your intuition is:
> Input displacement $u$ $\to$ Calculate strain $\epsilon$ $\to$ Discover yield $\to$ Pull back to yield surface $\to$ Get stress $\sigma$. End.

**If this were a "displacement-controlled" and "uniformly distributed" simple tension test, you would be right.**
But in complex finite element structures, we are solving the equation $K(u) \cdot u = F_{ext}$.

##### Scenario Deduction: Why is once not enough?

Suppose we are applying a force $F$ to a cantilever beam, and we want to find the displacement $u$.

1.  **First Guess (Newton Iteration 0)**:
    *   We don't know exactly how much plastic deformation will occur, so the solver usually assumes the structure is **fully elastic** first (or uses the stiffness from the previous step).
    *   The solver guesses a displacement $u_0$.

2.  **Physical Kernel Calculation (Phase 4)**:
    *   Based on $u_0$, we calculate strain $\epsilon_0$.
    *   **Yield Judgment**: Discover $\epsilon_0$ is large, calculated trial stress $\sigma_{trial}$ far exceeds yield point.
    *   **Pull Back Operation**: You force the stress back to the yield surface via the algorithm, getting true stress $\sigma_{true}$.
    *   **Here comes the key point**: Because you pulled the stress back (it became smaller), **this causes $\sigma_{true}$ to be much smaller than expected.**

3.  **Global Equilibrium Check (Phase 3 Check)**:
    *   We integrate the reduced $\sigma_{true}$ over the whole field to get the structure's current internal force $F_{int}$.
    *   Because plastic yielding occurred (softening), the stress was capped, so **internal force $F_{int}$ is far less than external force $F_{ext}$**.
    *   Equation $F_{int} - F_{ext} \neq 0$. **Equilibrium not satisfied!**

4.  **Conclusion**:
    *   Although you calculated the stress "correctly" (satisfied constitutive law), this stress cannot withstand the external force.
    *   The structure is "too soft" and cannot support $F_{ext}$ under the current displacement $u_0$.
    *   **The structure must deform more (increase $u$) to achieve equilibrium.**

This is why we must enter the next loop: The solver discovers the residual is large, must calculate a new tangent stiffness (softened stiffness), calculate $\Delta u$, let the structure deform more, until internal force equals external force again.

---

#### 2. Illustration: What happens without looping?

Imagine a stress-strain curve.

*   **Ideal Situation**: We need to find a point on the curve such that the force corresponding to the stress equals the external force.
*   **No Loop (Do only one step)**:
    1.  You run along the elastic line to a very high point (trial point).
    2.  You find it exceeded, pull vertically back to the yield plateau (pull back operation).
    3.  **At this moment**: Your stress is correct (on the curve), but the corresponding **external force** is wrong! Because your displacement was estimated based on elastic stiffness, it is too small.

**The role of the Newton loop** is to continuously correct displacement $u$ along the tangent direction until finding that point which is **both on the stress-strain curve (satisfies constitutive law) and satisfies force equilibrium (satisfies equation)**.

![Why Newton Iteration Must Loop with Plasticity](/images/Why%20Newton%20Iteration%20Must%20Loop%20with%20Plasticity.avif)

#### 3. Specific Manifestation in JAX-FEM

In the code logic of JAX-FEM:

1.  **Phase 4 (Kernel)**: Responsible for ensuring **the point is on the curve**.
    *   No matter what $u$ is passed in, the $\sigma$ I calculate definitely satisfies $f(\sigma) \le 0$.
    *   This is local consistency.

2.  **Phase 3 (Newton)**: Responsible for ensuring **force equilibrium**.
    *   It discovers the integrated internal force of the current $\sigma$ is too small.
    *   It utilizes the **Tangent Stiffness Matrix $K_T$** calculated by JAX auto-diff (this matrix became "softer" due to plasticity).
    *   It calculates the correction $\Delta u$, telling the system: "Because you yielded and aren't that stiff anymore, you have to deform a bit more!"

#### Summary

*   **If** the problem is "known strain, find stress," then **no loop is needed**, you are right.
*   **But** the FEM problem is "known external force, find displacement," strain itself is unknown.
*   Plasticity causes stiffness drop $\to$ Same force requires larger displacement $\to$ **Must loop iteratively to find this larger displacement**.

So, Phase 3 and Phase 4 are inseparable: **Every time Newton's method changes a guess (Phase 3), the physical kernel must perform a "pull back judgment" again (Phase 4) to see if the new guess satisfies equilibrium.**

---
### **Follow-up Question:** Meaning, after Phase 3 corrects, it enters Phase 4 again to see if it yields. If it still yields, what happens? Does it correct again, then calculate residual stress, then adjust displacement again?

---
**Yes, absolutely correct! Your understanding is spot on!**

Be sure to distinguish between **"Material Level Correction"** and **"Structural Level Correction"**. This is the core logic of finite element solving for nonlinear problems.

Let's break down the process you described and see what happens if it "still yields":

#### 1. Core Logic: Not to "Eliminate Yielding", but to "Match External Force"

First, correct a minor concept:
The goal of the solver is **not** to make the material not yield (because plastic analysis intends for it to yield).
The solver's goal is: **"Since you yielded (became soft), my original displacement guess was too small. I have to increase the displacement until I pull you to the point where internal force can counter external force."**

#### 2. Detailed "Correction Loop" Deduction

Suppose we apply a large tensile force $F_{ext} = 1000N$.

##### **Loop 1 (Iteration 1)**
1.  **Newton Solver (Phase 3)**:
    *   Guess a displacement based on elasticity first, say $u = 1mm$.
2.  **Physical Kernel (Phase 4)**:
    *   Calculate strain.
    *   **Yield Judgment**: Discover yielded!
    *   **Pull Back Correction**: Force stress back to yield surface (e.g., stress after pull back corresponds to $500N$).
    *   **Output**: Tell solver current internal force is only $500N$.
3.  **Residual Check**:
    *   $R = 500N - 1000N = -500N$.
    *   **Unbalanced!** Structure too soft, can't hold it.

##### **Loop 2 (Iteration 2)**
1.  **Newton Solver (Phase 3)**:
    *   Because it knows the material yielded (tangent stiffness decreased), it says: "Then 1mm is definitely not enough, gotta try harder, let's try $u = 2mm$."
2.  **Physical Kernel (Phase 4)**:
    *   Calculate new strain (corresponding to 2mm).
    *   **Yield Judgment**: **Definitely still yielding!** (Because pulled longer).
    *   **Pull Back Correction**: Pull stress back to yield surface again (Note: J2 models usually have hardening; the longer you pull, the yield surface might expand slightly, or stress slides on the yield surface).
    *   **Output**: Stress calculated this time corresponds to internal force $800N$.
3.  **Residual Check**:
    *   $R = 800N - 1000N = -200N$.
    *   **Still unbalanced!** But closer.

##### **Loop 3 (Iteration 3)**
1.  **Newton Solver (Phase 3)**:
    *   "Still need more! Try $u = 2.5mm$."
2.  **Physical Kernel (Phase 4)**:
    *   Calculate strain.
    *   **Yield Judgment**: **Still yielding!**
    *   **Pull Back Correction**: Execute pull back algorithm again.
    *   **Output**: Internal force this time is $998N$.
3.  **Residual Check**:
    *   $R = -2N \approx 0$.
    *   **Converged!**

---

#### 3. Summary

Answering your question: **"What if it still yields?"**

The answer is: **Then let it yield!**
In Phase 4, we recalculate the "pull back correction" every time.
*   As long as it yields, we pull it back to the yield surface.
*   This causes the calculated stress to be smaller.
*   Causes insufficient internal force.
*   Causes the solver to increase displacement in the next round.

**This loop continues until finding that displacement $u$ which is "both on the yield surface (satisfies material constitutive) and produces enough internal force (satisfies force equilibrium)."**

The power of JAX-FEM lies in that **in every round, even if drastic nonlinear operations like "pull back" occur, JAX can automatically calculate accurate derivatives (tangent stiffness)**, telling the solver how much to adjust displacement in the next round, allowing this loop to converge quickly.

---
### **Still don't get it:** How exactly does it try? It definitely isn't adding a random number, right?

---
It is absolutely not trying randomly. This is the most fascinating and exquisite part of the **Newton-Raphson Method**.

It not only knows "need to try harder," but also calculates **"exactly how much to add"** through precise mathematical calculation.

Simply put, it performs a simple division:
$$ \text{Displacement to add} = \frac{\text{How much force is missing}}{\text{Current Stiffness}} $$

---

#### 1. Intuitive Physical Logic: How much force missing? How much stiffness left?

Back to the example:
*   **External Force** $F_{ext} = 1000N$
*   **Step 1 Displacement** $u_1 = 1mm$
*   **Step 1 Internal Force** $F_{int} = 500N$ (Because yielded, not that large)

##### Step 1: Calculate "How much force is missing" (Residual)
The solver first calculates residual $R$:
$$ R = F_{int} - F_{ext} = 500 - 1000 = -500N $$
Meaning: **"I still owe 500N force to balance."**

##### Step 2: Look at "What is the current stiffness" (Tangent Stiffness)
This is the most critical step. The solver asks the physical kernel (via JAX auto-diff):
> **"In this current yielded state, if I pull you a bit more, how much resistance force can you provide?"**

*   If **Elastic State**, stiffness is high (e.g., $K_{elastic} = 1000 N/mm$).
*   But! Because **Yielded** (entered plastic flow plateau), material softened.
*   JAX automatically calculates this softened **Tangent Stiffness $K_T$**. Assume now $K_T$ is only $500 N/mm$ (stiffness dropped by half).

##### Step 3: Calculate "How much displacement to add" (Update)
The solver uses linear equation $K \cdot \Delta u = -R$ to calculate correction:

$$ \Delta u = \frac{\text{Owed Force}}{\text{Current Stiffness}} = \frac{500N}{500 N/mm} = 1mm $$

The solver finds: **"Because you became soft (stiffness only 500), and I still owe 500N, I must pull you another 1mm to be enough!"**

So, the new displacement is:
$$ u_{new} = u_{old} + \Delta u = 1mm + 1mm = 2mm $$

---

#### 2. Contrast: Why does plasticity make it "take bigger steps"?

If **No Yielding** (assume still elastic), what happens?

1.  **Owed Force**: Assume still owe 500N.
2.  **Stiffness**: Because didn't yield, stiffness is high, still $1000 N/mm$.
3.  **Correction**:
    $$ \Delta u = \frac{500N}{1000 N/mm} = 0.5mm $$
    
**See the difference?**
*   **When not yielded**: Stiffness large, solver thinks "force will come up with just a little pull," so only adds **0.5mm**.
*   **When yielded**: Stiffness small (softened), solver thinks "you are too soft now, I have to **pull hard** to get force up," so adds **1mm**.

This is why the solver can **intelligently** adjust step size. It's not guessing blindly; it decides how big the next step should be based on **current material softness/hardness (Tangent Stiffness $K_T$)**.

#### 3. Black Tech of JAX-FEM

In traditional finite elements, to calculate that "softened stiffness" $K_T$ (that 500 number), programmers need to hand-derive extremely complex derivative formulas, differentiating all the `if-else`, square roots, and tensor operations in the return mapping algorithm.

**In JAX-FEM:**
You do nothing.
When you write that function with `if f_yield > 0`, the solver calls in the background:
`K = jax.jacfwd(residual_function)(u)`

JAX automatically penetrates that `if` condition, discovers: "Oh, it took the plastic branch here, slope flattened," and then directly returns the correct, reduced stiffness value $K_T$ to you.

This is why Newton's method works efficiently under this framework.

---
### **Last Detail:** So what is u_grad in the first step? I didn't see the definition of this number.

---

This is an extremely sharp **code perspective** question! You didn't see its definition because—**it's not defined by you at all, but "fed" to you by the framework.**

This is like buying a juicer (the kernel function you wrote). You only need to specify "turn fruit (`u_grad`) into juice (`sigma`)". As for who put the fruit in? It's put in by you (or the machine's automatic feeder) when you press the switch.

In JAX-FEM, the source path of `u_grad` is as follows:

#### 1. Source of Data: Nodal Displacements
For all finite element solvers, the core variable to solve is the **displacement vector at mesh nodes**, denoted as $\boldsymbol{U}_{nodes}$.
*   **Step 0**: Solver initializes, usually guesses $\boldsymbol{U}_{nodes} = 0$ (or inherits result from previous step).
*   **During Iteration**: Newton's method calculates correction, updates $\boldsymbol{U}_{nodes}$.

**This $\boldsymbol{U}_{nodes}$ is the source data.**

#### 2. Intermediate Processing: Shape Function Interpolation
This is the bottom-layer "magic" of Finite Element Method (FEM). The framework silently does this in the background:

It uses derivatives of **Shape Functions** $N$ to convert displacement at **nodes** into displacement gradient at **integration points** (Gauss points).

Mathematical formula is:
$$ \nabla \boldsymbol{u} (\text{integration point}) = \sum_{i} \boldsymbol{U}_i (\text{node}) \cdot \nabla N_i (\text{integration point}) $$

In JAX-FEM's underlying code (where you don't see), there is logic similar to this:
```python
# Pseudo-code: JAX-FEM underlying logic
def compute_residual(U_nodes):
    # 1. Interpolation: Calculate gradient at integration points from nodal displacements
    # This is the birthplace of u_grad!
    u_grad = jnp.einsum('...ij, ...k -> ...ik', shape_grads, U_nodes) 
    
    # 2. Call your kernel function
    # Framework passes the u_grad just calculated to you
    sigma = your_kernel_function(u_grad, ...)
    
    # ... Subsequent integration ...
```

#### 3. Your Perspective: Passive Reception
Back to the code you wrote:

```python
def stress_return_map(u_grad, sigma_old, epsilon_old):
    # ...
```

Here `u_grad` is a **Function Argument**.
*   You don't need to assign a value to it.
*   You only need to tell the framework: "**Suppose** give me a `u_grad`, how should I calculate `sigma`".
*   When the solver runs, **JAX automatically fills this argument with the gradient value calculated in the current iteration step**.

#### 4. So what is the specific value for the "First Step"?

Back to the first step you care about:
1.  **Initial Moment**:
    Usually displacement field is initialized to 0.
    So the passed in `u_grad` is all **0**.
2.  **First Calculation**:
    *   Pass in `u_grad = 0`.
    *   Your function calculates `sigma = 0` (assuming no initial stress).
    *   Residual $R = 0 - F_{ext}$.
    *   Newton's method finds unbalance, calculates $\Delta U$.
3.  **Second Calculation (First Correction)**:
    *   Displacement changed, framework calculates **new** `u_grad` (no longer 0).
    *   Call your function again, passing in this non-zero `u_grad`.

#### Summary

`u_grad` is not a fixed number, it is a **variable**.
*   **Who defined it?** Calculated by framework from nodal displacements via shape functions.
*   **What is the value?** Depends on which step the current Newton iteration is at (whatever the solver guesses the current displacement is, it is that value).

You are only responsible for **"Processing"** (writing function logic), the framework is responsible for **"Feeding"** (passing actual arguments).

---
### Below is a list of J2 Elastoplasticity calculation formulas completely following **JAX-FEM Code Logic**.

**Setting Background**:
*   We are in a certain **Load Step (Time Step)**.
*   Known history variables after convergence of previous load step: **Old Stress $\boldsymbol{\sigma}_{old}$** and **Old Strain $\boldsymbol{\epsilon}_{old}$**.
*   We need to find the equilibrium solution for the current step via **Newton-Raphson Iteration**.

We use subscripts $0, 1, \dots, n$ to denote **Newton Iteration Count**.

---

### First Round Iteration (Iteration $k=0$)

**1. Solver Guesses Displacement**
Solver gives initial guess displacement $\boldsymbol{u}_0$ for current load step (usually inherited from previous step's solution).

**2. Calculate Geometric Equation (Strain)**
Obtain displacement gradient $\nabla \boldsymbol{u}_0$ at integration points via shape function interpolation, calculate current total strain:
$\boldsymbol{\epsilon}_0 = \frac{1}{2} (\nabla \boldsymbol{u}_0 + (\nabla \boldsymbol{u}_0)^T)$

**3. Calculate Strain Increment**
Subtract historical strain of previous load step from current total strain:
$\Delta \boldsymbol{\epsilon}_0 = \boldsymbol{\epsilon}_0 - \boldsymbol{\epsilon}_{old}$

**4. Elastic Predictor**
Assume increment is totally elastic, calculate trial stress according to Hooke's Law ($\mathbb{C}$):
$\boldsymbol{\sigma}^{trial}_0 = \boldsymbol{\sigma}_{old} + \lambda \text{tr}(\Delta \boldsymbol{\epsilon}_0)\boldsymbol{I} + 2\mu \Delta \boldsymbol{\epsilon}_0$

**5. Calculate Deviatoric Stress**
$\boldsymbol{s}^{trial}_0 = \boldsymbol{\sigma}^{trial}_0 - \frac{1}{3} \text{tr}(\boldsymbol{\sigma}^{trial}_0) \boldsymbol{I}$

**6. Calculate Equivalent Stress (Von Mises Stress)**
$s^{norm}_0 = \sqrt{\frac{3}{2} \boldsymbol{s}^{trial}_0 : \boldsymbol{s}^{trial}_0}$

**7. Yield Function Judgment**
$\sigma_Y$ is yield strength:
$f_0 = s^{norm}_0 - \sigma_Y$

**8. Stress Correction (Radial Return)**
Use Ramp function $\langle x \rangle = \max(x, 0)$ to unify elastic and plastic cases.
If $f_0 \le 0$, return amount is 0; if $f_0 > 0$, need to return:
$\boldsymbol{\sigma}_0 = \boldsymbol{\sigma}^{trial}_0 - \frac{\langle f_0 \rangle}{s^{norm}_0} \boldsymbol{s}^{trial}_0$
*(Note: This is the true stress returned by current kernel function)*

**9. Global Residual and Stiffness Calculation (JAX Auto-Diff)**
Calculate global residual force (Internal Force - External Force):
$\boldsymbol{R}_0 = \int_{\Omega} \boldsymbol{\sigma}_0 : \nabla \boldsymbol{v} \, dx - \boldsymbol{F}_{ext}$
Calculate Tangent Stiffness Matrix (Auto-Diff):
$\boldsymbol{K}_0 = \frac{\partial \boldsymbol{R}_0}{\partial \boldsymbol{u}_0}$

**10. Solve Correction Amount**
$\Delta \boldsymbol{u} = - \boldsymbol{K}_0^{-1} \boldsymbol{R}_0$

**11. Update Displacement**
$\boldsymbol{u}_1 = \boldsymbol{u}_0 + \Delta \boldsymbol{u}$

---

### Second Round Iteration (Iteration $k=1$)
*(At this time displacement has changed to $\boldsymbol{u}_1$, repeat kernel calculation above)*

**1. Calculate Geometric Equation (Strain)**
$\boldsymbol{\epsilon}_1 = \frac{1}{2} (\nabla \boldsymbol{u}_1 + (\nabla \boldsymbol{u}_1)^T)$

**2. Calculate Strain Increment**
*(Note: Still subtract the SAME old history variable)*
$\Delta \boldsymbol{\epsilon}_1 = \boldsymbol{\epsilon}_1 - \boldsymbol{\epsilon}_{old}$

**3. Elastic Predictor**
$\boldsymbol{\sigma}^{trial}_1 = \boldsymbol{\sigma}_{old} + \lambda \text{tr}(\Delta \boldsymbol{\epsilon}_1)\boldsymbol{I} + 2\mu \Delta \boldsymbol{\epsilon}_1$

**4. Calculate Deviatoric Stress**
$\boldsymbol{s}^{trial}_1 = \boldsymbol{\sigma}^{trial}_1 - \frac{1}{3} \text{tr}(\boldsymbol{\sigma}^{trial}_1) \boldsymbol{I}$

**5. Calculate Equivalent Stress**
$s^{norm}_1 = \sqrt{\frac{3}{2} \boldsymbol{s}^{trial}_1 : \boldsymbol{s}^{trial}_1}$

**6. Yield Function Judgment**
$f_1 = s^{norm}_1 - \sigma_Y$

**7. Stress Correction**
$\boldsymbol{\sigma}_1 = \boldsymbol{\sigma}^{trial}_1 - \frac{\langle f_1 \rangle}{s^{norm}_1} \boldsymbol{s}^{trial}_1$

**8. Global Residual and Stiffness Calculation**
$\boldsymbol{R}_1 = \int_{\Omega} \boldsymbol{\sigma}_1 : \nabla \boldsymbol{v} \, dx - \boldsymbol{F}_{ext}$
$\boldsymbol{K}_1 = \frac{\partial \boldsymbol{R}_1}{\partial \boldsymbol{u}_1}$

**9. Solve Correction Amount and Update Displacement**
$\Delta \boldsymbol{u} = - \boldsymbol{K}_1^{-1} \boldsymbol{R}_1$
$\boldsymbol{u}_2 = \boldsymbol{u}_1 + \Delta \boldsymbol{u}$

---

### ... (Loop Iteration) ...

---

### N-th Round Iteration (Iteration $k=n$, Converged)
*(Assume residual $||\boldsymbol{R}_n|| < \text{tol}$ now, iteration ends)*

**1. Final Displacement Confirmation**
$\boldsymbol{u}_{final} = \boldsymbol{u}_n$

**2. Final Kernel Calculation (For Updating State)**
$\boldsymbol{\epsilon}_{final} = \frac{1}{2} (\nabla \boldsymbol{u}_{final} + (\nabla \boldsymbol{u}_{final})^T)$

$\Delta \boldsymbol{\epsilon}_{final} = \boldsymbol{\epsilon}_{final} - \boldsymbol{\epsilon}_{old}$

$\boldsymbol{\sigma}^{trial}_{final} = \boldsymbol{\sigma}_{old} + \lambda \text{tr}(\Delta \boldsymbol{\epsilon}_{final})\boldsymbol{I} + 2\mu \Delta \boldsymbol{\epsilon}_{final}$

$\boldsymbol{s}^{trial}_{final} = \boldsymbol{\sigma}^{trial}_{final} - \frac{1}{3} \text{tr}(\boldsymbol{\sigma}^{trial}_{final}) \boldsymbol{I}$

$s^{norm}_{final} = \sqrt{\frac{3}{2} \boldsymbol{s}^{trial}_{final} : \boldsymbol{s}^{trial}_{final}}$

$\boldsymbol{\sigma}_{final} = \boldsymbol{\sigma}^{trial}_{final} - \frac{\langle s^{norm}_{final} - \sigma_Y \rangle}{s^{norm}_{final}} \boldsymbol{s}^{trial}_{final}$

**3. Update History Variables (Enter Next Load Step)**
Save result of current converged step as "Old Variables" for use in $t+1$ step:
$\boldsymbol{\sigma}_{old} \leftarrow \boldsymbol{\sigma}_{final}$
$\boldsymbol{\epsilon}_{old} \leftarrow \boldsymbol{\epsilon}_{final}$


## At this point, the core basic teaching of JAX-FEM is completely finished