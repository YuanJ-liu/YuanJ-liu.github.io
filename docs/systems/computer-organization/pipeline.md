# 流水线

单周期处理器必须等一条指令完成全部工作后，才能开始下一条指令。流水线把执行过程拆成多个阶段，使不同指令能够在同一时刻占用不同硬件，从而提高吞吐率。

## 五级流水线

``` mermaid
flowchart LR
  IF["① IF<br/>取指"] --> ID["② ID<br/>译码"]
  ID --> EX["③ EX<br/>执行"]
  EX --> MEM["④ MEM<br/>访存"]
  MEM --> WB["⑤ WB<br/>写回"]
```

<p class="diagram-caption">图 1：经典五级流水线。箭头表示一条指令在相邻时钟周期之间的推进方向。</p>

1. **IF · 取指**：根据程序计数器从指令存储器读取指令。
2. **ID · 译码**：解释操作码，并从寄存器堆读取操作数。
3. **EX · 执行**：由 ALU 完成算术、逻辑运算或地址计算。
4. **MEM · 访存**：加载或存储指令访问数据存储器。
5. **WB · 写回**：把结果写回目标寄存器。

图中的箭头只描述**单条指令**的旅程。流水线的关键在于，多条指令可以同时处于不同阶段。

## 时空图

下面假设每个阶段恰好占用一个时钟周期，并且暂时不考虑任何冒险。

| 指令 / 周期 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| I₁ | IF | ID | EX | MEM | WB |  |  |
| I₂ |  | IF | ID | EX | MEM | WB |  |
| I₃ |  |  | IF | ID | EX | MEM | WB |

<p class="diagram-caption">图 2：三条指令在五级流水线中的重叠执行。每向右移动一格表示经过一个时钟周期。</p>

流水线并没有缩短单条指令从 IF 到 WB 的时间，但在填满之后，理想情况下每个周期都能完成一条指令。

## 分步骤观察

点击不同周期，观察三条指令如何逐步进入流水线。

=== "周期 1"

    <div class="pipeline-snapshot" aria-label="周期 1 流水线状态">
      <div class="pipeline-stage is-active"><strong>IF</strong><span>I₁</span></div>
      <div class="pipeline-stage"><strong>ID</strong><span>—</span></div>
      <div class="pipeline-stage"><strong>EX</strong><span>—</span></div>
      <div class="pipeline-stage"><strong>MEM</strong><span>—</span></div>
      <div class="pipeline-stage"><strong>WB</strong><span>—</span></div>
    </div>

    第一条指令 I₁ 进入取指阶段，其他阶段暂时空闲。

=== "周期 3"

    <div class="pipeline-snapshot" aria-label="周期 3 流水线状态">
      <div class="pipeline-stage is-active"><strong>IF</strong><span>I₃</span></div>
      <div class="pipeline-stage is-active"><strong>ID</strong><span>I₂</span></div>
      <div class="pipeline-stage is-active"><strong>EX</strong><span>I₁</span></div>
      <div class="pipeline-stage"><strong>MEM</strong><span>—</span></div>
      <div class="pipeline-stage"><strong>WB</strong><span>—</span></div>
    </div>

    三条指令已经同时执行，但各自占据不同阶段，因此不会争用同一流水级。

=== "周期 5"

    <div class="pipeline-snapshot" aria-label="周期 5 流水线状态">
      <div class="pipeline-stage"><strong>IF</strong><span>—</span></div>
      <div class="pipeline-stage"><strong>ID</strong><span>—</span></div>
      <div class="pipeline-stage is-active"><strong>EX</strong><span>I₃</span></div>
      <div class="pipeline-stage is-active"><strong>MEM</strong><span>I₂</span></div>
      <div class="pipeline-stage is-active"><strong>WB</strong><span>I₁</span></div>
    </div>

    I₁ 即将完成，I₂ 和 I₃ 紧随其后。从下一个周期开始，会连续得到完成的指令。

## 流水线冒险

理想时空图假设每条指令都能顺利前进。真实程序中，这个假设经常被破坏。

!!! concept "定义 · 流水线冒险"

    导致下一条指令无法在预定周期进入目标流水级的情况称为流水线冒险。通常分为结构冒险、数据冒险和控制冒险。

例如，下列第二条指令立即使用第一条指令尚未写回的结果：

``` asm
add x1, x2, x3
sub x4, x1, x5
```

如果没有额外机制，`sub` 在 ID 阶段读到的可能还是 `x1` 的旧值。处理器可以通过**转发**把 ALU 结果直接送到下一条指令，或者插入停顿等待数据可用。

??? fold "为什么转发能够减少停顿？"

    `add` 的计算结果在 EX 阶段结束时已经产生，只是还没有走到 WB 阶段写回寄存器堆。转发路径绕过正常写回流程，直接把这个结果送到 `sub` 的 EX 输入，因此不必等待完整的两个后续阶段。

## 小结

- 流水线提高的是指令吞吐率，而不是单条指令的执行延迟。
- 时空图能同时表示“指令随时间推进”和“各流水级当前处理哪条指令”。
- 分步骤快照适合观察某一个周期的横截面。
- 冒险处理决定了真实流水线距离理想吞吐率有多远。
