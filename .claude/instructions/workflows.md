# 📊 Workflow Patterns & Examples

*Load this file when planning multi-step projects*

## Sequential Pattern

**Use for**: Tasks with dependencies where order matters

```
Backend API → Frontend UI → Testing → Documentation
```
**Example**: Login system - Backend creates auth first, then UI

## Parallel Pattern (MapReduce)

**Use for**: Independent tasks that can run simultaneously

```
         ┌→ Component A
Split →  ├→ Component B  → Merge
         └→ Component C
```
**Example**: Building 3 dashboard widgets in parallel

## Consensus Pattern

**Use for**: Critical decisions requiring validation

```
Multiple Agents → Vote → Consensus → Proceed
```
**Example**: Architecture design validation

## Hierarchical Pattern

**Use for**: Complex projects with multiple layers

```
Studio Coach (Orchestrator)
├── Backend Team
├── Frontend Team
└── Quality Team
```
**Example**: Full e-commerce platform

## Pattern Selection Guide

| Complexity | Dependencies | Recommended Pattern |
|------------|--------------|-------------------|
| 1-3 | Linear | Sequential |
| 4-6 | Independent | Parallel |
| 7-8 | Critical | Consensus |
| 9-10 | Multi-layer | Hierarchical |
