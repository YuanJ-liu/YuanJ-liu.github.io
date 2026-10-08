# 极限与连续

极限描述“无限接近”这件事，连续性则说明函数在局部没有突然跳跃。本章先把直觉翻译成严格语言，再用两个最基本的证明展示这种语言如何工作。

## 函数极限

当 (x) 越来越接近 (a) 时，如果 (f(x)) 能够任意接近某个固定值 (L)，我们就说 (f(x)) 在 (a) 点趋于 (L)。这里的关键不是“最终等于”，而是误差可以被控制到任意小。

!!! concept "定义 · 函数极限"

    设函数 (f) 在点 (a) 的某个去心邻域内有定义。若对任意 \(\varepsilon > 0\)，都存在 \(\delta > 0\)，使得

    \[
    0 < |x-a| < \delta \quad \Longrightarrow \quad |f(x)-L| < \varepsilon,
    \]

    则称 (L) 为 (f(x)) 当 (x \to a) 时的极限，记作

    \[
    \lim_{x \to a} f(x)=L.
    \]

读这个定义时，可以把 \(\varepsilon\) 看作对函数值误差的要求，把 \(\delta\) 看作我们为满足要求而给出的输入范围。

!!! concept "定理 · 极限的唯一性"

    若函数 (f(x)) 在 (x \to a) 时存在极限，则该极限唯一。

??? fold "证明"

    假设 (f(x)) 同时以 (L_1) 和 (L_2) 为极限，并且 (L_1 \ne L_2)。令

    \[
    \varepsilon=\frac{|L_1-L_2|}{3}.
    \]

    根据极限定义，当 (x) 充分接近 (a) 时，同时有

    \[
    |f(x)-L_1|<\varepsilon,
    \qquad
    |f(x)-L_2|<\varepsilon.
    \]

    由三角不等式，

    \[
    |L_1-L_2|
    \le |L_1-f(x)|+|f(x)-L_2|
    <2\varepsilon,
    \]

    这与 \(|L_1-L_2|=3\varepsilon\) 矛盾，因此极限只能有一个。

## 连续性

极限研究函数在点附近的行为。若这个极限恰好等于函数在该点的取值，函数就在该点连续。

!!! concept "定义 · 点连续"

    若函数 (f) 在点 (a) 有定义，并且

    \[
    \lim_{x \to a}f(x)=f(a),
    \]

    则称 (f) 在点 (a) 连续。

### 示例：证明平方函数连续

证明 (f(x)=x^2) 在任意点 (a\in\mathbb{R}) 连续。

??? fold "答案"

    我们需要让 \(|x^2-a^2|<\varepsilon\)。首先分解：

    \[
    |x^2-a^2|=|x-a||x+a|.
    \]

    先要求 \(|x-a|<1\)，此时 \(|x+a|<2|a|+1\)。因此取

    \[
    \delta=\min\left\{1,\frac{\varepsilon}{2|a|+1}\right\},
    \]

    当 \(|x-a|<\delta\) 时，就有

    \[
    |x^2-a^2|
    <\delta(2|a|+1)
    \le\varepsilon.
    \]

    所以 \(\lim_{x\to a}x^2=a^2=f(a)\)，平方函数在 (a) 点连续。

## 内容组件示例

### 代码块

下面的代码把证明中“选择 \(\delta\)”的过程写成一个简单函数。代码块会自动提供语法高亮、行号和复制按钮。

```python title="为平方函数选择 δ" linenums="1"
def choose_delta(a: float, epsilon: float) -> float:
    """Return a δ that guarantees |x² - a²| < ε."""
    if epsilon <= 0:
        raise ValueError("epsilon must be positive")

    return min(1.0, epsilon / (2 * abs(a) + 1))
```

### 图片

图片可以放在 `docs/images/` 中，再使用普通 Markdown 图片语法插入。SVG、PNG、JPG 和 WebP 都可以。

![平方函数的 epsilon-delta 图示](../../../images/epsilon-delta.svg)
<p class="diagram-caption">紫色区域表示输入范围 \(|x-a|&lt;\delta\)，绿色区域表示目标误差 \(|f(x)-L|&lt;\varepsilon\)。</p>

### 离散步骤标签页

点击不同标签即可在几个关键状态之间切换。以后可以把每一帧中的示意条替换成对应的手绘图片。

=== "第 1 帧 · 给定 ε"

    <span class="is-active">给定 ε</span> <span>选择 δ</span> <span>验证误差</span>
    {: .discrete-frames }

    先确定允许的函数值误差 \(\varepsilon\)，也就是证明需要达到的目标。

=== "第 2 帧 · 选择 δ"

    <span>给定 ε</span> <span class="is-active">选择 δ</span> <span>验证误差</span>
    {: .discrete-frames }

    根据 \(a\) 和 \(\varepsilon\) 选择输入范围 \(\delta\)，把不可控的 \(|x+a|\) 限制住。

=== "第 3 帧 · 验证"

    <span>给定 ε</span> <span>选择 δ</span> <span class="is-active">验证误差</span>
    {: .discrete-frames }

    最后代回不等式，验证 \(|x-a|&lt;\delta\) 确实能够推出 \(|x^2-a^2|&lt;\varepsilon\)。

## 小结

- \(\varepsilon\) 表示目标误差，\(\delta\) 表示允许的输入范围。
- 极限只由点附近的函数值决定，不要求函数在该点有定义。
- 连续性额外要求极限值等于函数在该点的实际取值。
