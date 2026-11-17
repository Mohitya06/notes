# Data Structures & Algorithms (DSA)

## Complexity Analysis

### Big O Notation
Time Complexity (from best to worst):
- O(1) - Constant
- O(log n) - Logarithmic
- O(n) - Linear
- O(n log n) - Linearithmic
- O(n²) - Quadratic
- O(n³) - Cubic
- O(2ⁿ) - Exponential
- O(n!) - Factorial

---

## Arrays & Strings

### 1. Two Sum
**Problem:** Find two numbers that add up to target.

```javascript
// Brute Force - O(n²)
function twoSum(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] + nums[j] === target) {
        return [i, j];
      }
    }
  }
  return [];
}

// Optimized with Map - O(n)
function twoSum(nums, target) {
  const map = new Map();
  
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}
```

---

### 2. Contains Duplicate
**Problem:** Check if array has duplicates.

```javascript
// Hash Set - O(n)
function containsDuplicate(nums) {
  const seen = new Set();
  for (const num of nums) {
    if (seen.has(num)) return true;
    seen.add(num);
  }
  return false;
}

// Sorting - O(n log n)
function containsDuplicate(nums) {
  nums.sort((a, b) => a - b);
  for (let i = 0; i < nums.length - 1; i++) {
    if (nums[i] === nums[i + 1]) return true;
  }
  return false;
}
```

---

### 3. Valid Anagram
**Problem:** Check if two strings are anagrams.

```javascript
// Character count - O(n)
function isAnagram(s, t) {
  if (s.length !== t.length) return false;
  
  const count = {};
  for (const char of s) {
    count[char] = (count[char] || 0) + 1;
  }
  
  for (const char of t) {
    if (!count[char]) return false;
    count[char]--;
  }
  
  return true;
}

// Sorting - O(n log n)
function isAnagram(s, t) {
  return s.split('').sort().join('') === t.split('').sort().join('');
}
```

---

### 4. Longest Substring Without Repeating Characters
**Problem:** Find longest substring with no duplicate characters.

```javascript
// Sliding Window - O(n)
function lengthOfLongestSubstring(s) {
  const charMap = new Map();
  let maxLength = 0;
  let start = 0;
  
  for (let end = 0; end < s.length; end++) {
    if (charMap.has(s[end])) {
      start = Math.max(start, charMap.get(s[end]) + 1);
    }
    charMap.set(s[end], end);
    maxLength = Math.max(maxLength, end - start + 1);
  }
  
  return maxLength;
}
```

---

## Linked List

### 1. Reverse Linked List
**Problem:** Reverse a singly linked list.

```javascript
function reverse(head) {
  let prev = null;
  let current = head;
  
  while (current) {
    const next = current.next;
    current.next = prev;
    prev = current;
    current = next;
  }
  
  return prev;
}
```

---

### 2. Detect Cycle
**Problem:** Check if linked list has a cycle.

```javascript
// Floyd's Algorithm - O(n), O(1) space
function hasCycle(head) {
  let slow = head;
  let fast = head;
  
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
    
    if (slow === fast) return true;
  }
  
  return false;
}
```

---

## Stack & Queue

### 1. Valid Parentheses
**Problem:** Check if parentheses are balanced.

```javascript
// Stack - O(n)
function isValid(s) {
  const stack = [];
  const pairs = { ')': '(', '}': '{', ']': '[' };
  
  for (const char of s) {
    if (char === '(' || char === '{' || char === '[') {
      stack.push(char);
    } else {
      if (!stack.length || stack.pop() !== pairs[char]) {
        return false;
      }
    }
  }
  
  return stack.length === 0;
}
```

---

### 2. Implement Queue using Stacks
**Problem:** Implement FIFO queue with two stacks.

```javascript
class Queue {
  constructor() {
    this.inStack = [];
    this.outStack = [];
  }
  
  push(x) {
    this.inStack.push(x);
  }
  
  pop() {
    this.peek();
    return this.outStack.pop();
  }
  
  peek() {
    if (this.outStack.length === 0) {
      while (this.inStack.length > 0) {
        this.outStack.push(this.inStack.pop());
      }
    }
    return this.outStack[this.outStack.length - 1];
  }
  
  empty() {
    return this.inStack.length === 0 && this.outStack.length === 0;
  }
}
```

---

## Trees

### 1. Binary Search Tree Traversal
**Problem:** Traverse BST in different orders.

```javascript
// In-order (Left, Root, Right) - Sorted
function inorder(root) {
  const result = [];
  function traverse(node) {
    if (!node) return;
    traverse(node.left);
    result.push(node.val);
    traverse(node.right);
  }
  traverse(root);
  return result;
}

// Pre-order (Root, Left, Right)
function preorder(root) {
  const result = [];
  function traverse(node) {
    if (!node) return;
    result.push(node.val);
    traverse(node.left);
    traverse(node.right);
  }
  traverse(root);
  return result;
}

// Post-order (Left, Right, Root)
function postorder(root) {
  const result = [];
  function traverse(node) {
    if (!node) return;
    traverse(node.left);
    traverse(node.right);
    result.push(node.val);
  }
  traverse(root);
  return result;
}

// Level-order (BFS) - O(n)
function levelOrder(root) {
  if (!root) return [];
  
  const result = [];
  const queue = [root];
  
  while (queue.length) {
    const level = [];
    const levelSize = queue.length;
    
    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift();
      level.push(node.val);
      
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    
    result.push(level);
  }
  
  return result;
}
```

---

### 2. Lowest Common Ancestor
**Problem:** Find LCA of two nodes in BST.

```javascript
// BST - O(log n) average
function lowestCommonAncestor(root, p, q) {
  if (p.val < root.val && q.val < root.val) {
    return lowestCommonAncestor(root.left, p, q);
  }
  if (p.val > root.val && q.val > root.val) {
    return lowestCommonAncestor(root.right, p, q);
  }
  return root;
}

// Binary Tree - O(n)
function lowestCommonAncestor(root, p, q) {
  if (!root || root === p || root === q) return root;
  
  const left = lowestCommonAncestor(root.left, p, q);
  const right = lowestCommonAncestor(root.right, p, q);
  
  if (left && right) return root;
  return left || right;
}
```

---

## Sorting & Searching

### 1. Binary Search
**Problem:** Find element in sorted array.

```javascript
// Iterative - O(log n)
function binarySearch(arr, target) {
  let left = 0, right = arr.length - 1;
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  
  return -1;
}

// Recursive
function binarySearchRecursive(arr, target, left = 0, right = arr.length - 1) {
  if (left > right) return -1;
  
  const mid = Math.floor((left + right) / 2);
  if (arr[mid] === target) return mid;
  if (arr[mid] < target) return binarySearchRecursive(arr, target, mid + 1, right);
  return binarySearchRecursive(arr, target, left, mid - 1);
}
```

---

### 2. Merge Sort
**Problem:** Sort array efficiently.

```javascript
// Merge Sort - O(n log n)
function mergeSort(arr) {
  if (arr.length <= 1) return arr;
  
  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));
  
  return merge(left, right);
}

function merge(left, right) {
  const result = [];
  let i = 0, j = 0;
  
  while (i < left.length && j < right.length) {
    if (left[i] <= right[j]) {
      result.push(left[i++]);
    } else {
      result.push(right[j++]);
    }
  }
  
  return result.concat(left.slice(i)).concat(right.slice(j));
}
```

---

### 3. Quick Sort
**Problem:** Efficient sorting with partition.

```javascript
// Quick Sort - O(n log n) average
function quickSort(arr, left = 0, right = arr.length - 1) {
  if (left < right) {
    const pi = partition(arr, left, right);
    quickSort(arr, left, pi - 1);
    quickSort(arr, pi + 1, right);
  }
  return arr;
}

function partition(arr, left, right) {
  const pivot = arr[right];
  let i = left - 1;
  
  for (let j = left; j < right; j++) {
    if (arr[j] < pivot) {
      i++;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
  
  [arr[i + 1], arr[right]] = [arr[right], arr[i + 1]];
  return i + 1;
}
```

---

## Dynamic Programming

### 1. Fibonacci
**Problem:** Find nth Fibonacci number.

```javascript
// Brute Force - O(2ⁿ)
function fib(n) {
  if (n <= 1) return n;
  return fib(n - 1) + fib(n - 2);
}

// Memoization - O(n)
function fib(n, memo = {}) {
  if (n in memo) return memo[n];
  if (n <= 1) return n;
  
  memo[n] = fib(n - 1, memo) + fib(n - 2, memo);
  return memo[n];
}

// Tabulation - O(n), O(n) space
function fib(n) {
  if (n <= 1) return n;
  
  const dp = [0, 1];
  for (let i = 2; i <= n; i++) {
    dp[i] = dp[i - 1] + dp[i - 2];
  }
  return dp[n];
}

// Space Optimized - O(n), O(1) space
function fib(n) {
  if (n <= 1) return n;
  
  let a = 0, b = 1;
  for (let i = 2; i <= n; i++) {
    [a, b] = [b, a + b];
  }
  return b;
}
```

---

### 2. Coin Change
**Problem:** Minimum coins needed for amount.

```javascript
// DP - O(amount × coins.length)
function coinChange(coins, amount) {
  const dp = Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  
  for (let i = 1; i <= amount; i++) {
    for (const coin of coins) {
      if (coin <= i) {
        dp[i] = Math.min(dp[i], dp[i - coin] + 1);
      }
    }
  }
  
  return dp[amount] === Infinity ? -1 : dp[amount];
}
```

---

### 3. Longest Increasing Subsequence
**Problem:** Find length of LIS.

```javascript
// DP - O(n²)
function lengthOfLIS(nums) {
  if (nums.length === 0) return 0;
  
  const dp = Array(nums.length).fill(1);
  
  for (let i = 1; i < nums.length; i++) {
    for (let j = 0; j < i; j++) {
      if (nums[j] < nums[i]) {
        dp[i] = Math.max(dp[i], dp[j] + 1);
      }
    }
  }
  
  return Math.max(...dp);
}

// Binary Search - O(n log n)
function lengthOfLIS(nums) {
  const tails = [];
  
  for (const num of nums) {
    let left = 0, right = tails.length;
    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (tails[mid] < num) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }
    tails[left] = num;
  }
  
  return tails.length;
}
```

---

### 4. 0/1 Knapsack
**Problem:** Maximum value with weight constraint.

```javascript
// DP - O(n × capacity)
function knapsack(weights, values, capacity) {
  const dp = Array(capacity + 1).fill(0);
  
  for (let i = 0; i < weights.length; i++) {
    for (let w = capacity; w >= weights[i]; w--) {
      dp[w] = Math.max(dp[w], dp[w - weights[i]] + values[i]);
    }
  }
  
  return dp[capacity];
}
```

---

## Graph Algorithms

### 1. BFS (Breadth-First Search)
**Problem:** Traverse graph level by level.

```javascript
// BFS - O(V + E)
function bfs(graph, start) {
  const visited = new Set();
  const queue = [start];
  const result = [];
  
  while (queue.length > 0) {
    const node = queue.shift();
    
    if (visited.has(node)) continue;
    visited.add(node);
    result.push(node);
    
    for (const neighbor of graph[node]) {
      if (!visited.has(neighbor)) {
        queue.push(neighbor);
      }
    }
  }
  
  return result;
}
```

---

### 2. DFS (Depth-First Search)
**Problem:** Traverse graph depth first.

```javascript
// DFS Recursive - O(V + E)
function dfs(graph, node, visited = new Set(), result = []) {
  visited.add(node);
  result.push(node);
  
  for (const neighbor of graph[node]) {
    if (!visited.has(neighbor)) {
      dfs(graph, neighbor, visited, result);
    }
  }
  
  return result;
}

// DFS Iterative
function dfs(graph, start) {
  const visited = new Set();
  const stack = [start];
  const result = [];
  
  while (stack.length > 0) {
    const node = stack.pop();
    
    if (visited.has(node)) continue;
    visited.add(node);
    result.push(node);
    
    for (const neighbor of graph[node].reverse()) {
      if (!visited.has(neighbor)) {
        stack.push(neighbor);
      }
    }
  }
  
  return result;
}
```

---

### 3. Dijkstra's Algorithm
**Problem:** Shortest path from source.

```javascript
// Dijkstra - O((V + E) log V)
function dijkstra(graph, start) {
  const distances = {};
  const visited = new Set();
  const pq = [[0, start]]; // [distance, node]
  
  for (const node in graph) {
    distances[node] = Infinity;
  }
  distances[start] = 0;
  
  while (pq.length > 0) {
    pq.sort((a, b) => a[0] - b[0]);
    const [dist, node] = pq.shift();
    
    if (visited.has(node)) continue;
    visited.add(node);
    
    for (const [neighbor, weight] of graph[node]) {
      const newDist = dist + weight;
      if (newDist < distances[neighbor]) {
        distances[neighbor] = newDist;
        pq.push([newDist, neighbor]);
      }
    }
  }
  
  return distances;
}
```

---

## Backtracking

### 1. N-Queens Problem
**Problem:** Place N queens without attacking each other.

```javascript
function solveNQueens(n) {
  const result = [];
  const board = Array(n).fill().map(() => Array(n).fill('.'));
  
  function isSafe(row, col) {
    // Check column
    for (let i = 0; i < row; i++) {
      if (board[i][col] === 'Q') return false;
    }
    
    // Check diagonal
    for (let i = row, j = col; i >= 0 && j >= 0; i--, j--) {
      if (board[i][j] === 'Q') return false;
    }
    for (let i = row, j = col; i >= 0 && j < n; i--, j++) {
      if (board[i][j] === 'Q') return false;
    }
    
    return true;
  }
  
  function backtrack(row) {
    if (row === n) {
      result.push(board.map(r => r.join('')));
      return;
    }
    
    for (let col = 0; col < n; col++) {
      if (isSafe(row, col)) {
        board[row][col] = 'Q';
        backtrack(row + 1);
        board[row][col] = '.';
      }
    }
  }
  
  backtrack(0);
  return result;
}
```

---

### 2. Permutations
**Problem:** Generate all permutations.

```javascript
function permute(nums) {
  const result = [];
  
  function backtrack(path) {
    if (path.length === nums.length) {
      result.push([...path]);
      return;
    }
    
    for (let i = 0; i < nums.length; i++) {
      if (!path.includes(nums[i])) {
        path.push(nums[i]);
        backtrack(path);
        path.pop();
      }
    }
  }
  
  backtrack([]);
  return result;
}
```
