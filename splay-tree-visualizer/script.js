/**
 * Splay Tree Node Class
 */
class Node {
    constructor(value) {
        this.value = value;
        this.left = null;
        this.right = null;
        this.height = 1; // Used for AVL
        this.x = 0;
        this.y = 0;
    }
}

/**
 * Binary Search Tree (BST)
 */
class BST {
    constructor() {
        this.root = null;
        this.cost = 0;
    }

    insert(value) {
        this.cost = 0;
        const newNode = new Node(value);
        if (!this.root) {
            this.root = newNode;
            this.cost = 1;
            return;
        }
        let current = this.root;
        while (true) {
            this.cost++;
            if (value === current.value) return;
            if (value < current.value) {
                if (!current.left) {
                    current.left = newNode;
                    return;
                }
                current = current.left;
            } else {
                if (!current.right) {
                    current.right = newNode;
                    return;
                }
                current = current.right;
            }
        }
    }

    search(value) {
        this.cost = 0;
        let current = this.root;
        while (current) {
            this.cost++;
            if (value === current.value) return current;
            current = value < current.value ? current.left : current.right;
        }
        return null;
    }

    delete(value) {
        this.cost = 0;
        this.root = this._deleteNode(this.root, value);
    }

    _deleteNode(root, value) {
        if (!root) return null;
        this.cost++;
        if (value < root.value) {
            root.left = this._deleteNode(root.left, value);
        } else if (value > root.value) {
            root.right = this._deleteNode(root.right, value);
        } else {
            if (!root.left) return root.right;
            if (!root.right) return root.left;
            let temp = this._minValueNode(root.right);
            root.value = temp.value;
            root.right = this._deleteNode(root.right, temp.value);
        }
        return root;
    }

    _minValueNode(node) {
        let current = node;
        while (current.left) current = current.left;
        return current;
    }
}

/**
 * AVL Tree (Balanced BST)
 */
class AVLTree extends BST {
    constructor() {
        super();
    }

    getHeight(node) {
        return node ? node.height : 0;
    }

    getBalance(node) {
        return node ? this.getHeight(node.left) - this.getHeight(node.right) : 0;
    }

    updateHeight(node) {
        node.height = 1 + Math.max(this.getHeight(node.left), this.getHeight(node.right));
    }

    rightRotate(y) {
        let x = y.left;
        let T2 = x.right;
        x.right = y;
        y.left = T2;
        this.updateHeight(y);
        this.updateHeight(x);
        return x;
    }

    leftRotate(x) {
        let y = x.right;
        let T2 = y.left;
        y.left = x;
        x.right = T2;
        this.updateHeight(x);
        this.updateHeight(y);
        return y;
    }

    insert(value) {
        this.cost = 0;
        this.root = this._insertNode(this.root, value);
    }

    _insertNode(node, value) {
        if (!node) {
            this.cost++;
            return new Node(value);
        }
        this.cost++;
        if (value < node.value) {
            node.left = this._insertNode(node.left, value);
        } else if (value > node.value) {
            node.right = this._insertNode(node.right, value);
        } else return node;

        this.updateHeight(node);
        let balance = this.getBalance(node);

        // Left Left
        if (balance > 1 && value < node.left.value) return this.rightRotate(node);
        // Right Right
        if (balance < -1 && value > node.right.value) return this.leftRotate(node);
        // Left Right
        if (balance > 1 && value > node.left.value) {
            node.left = this.leftRotate(node.left);
            return this.rightRotate(node);
        }
        // Right Left
        if (balance < -1 && value < node.right.value) {
            node.right = this.rightRotate(node.right);
            return this.leftRotate(node);
        }
        return node;
    }

    delete(value) {
        this.cost = 0;
        this.root = this._deleteNode(this.root, value);
    }

    _deleteNode(root, value) {
        if (!root) return null;
        this.cost++;
        if (value < root.value) {
            root.left = this._deleteNode(root.left, value);
        } else if (value > root.value) {
            root.right = this._deleteNode(root.right, value);
        } else {
            if (!root.left || !root.right) {
                let temp = root.left ? root.left : root.right;
                if (!temp) {
                    temp = root;
                    root = null;
                } else root = temp;
            } else {
                let temp = this._minValueNode(root.right);
                root.value = temp.value;
                root.right = this._deleteNode(root.right, temp.value);
            }
        }
        if (!root) return root;

        this.updateHeight(root);
        let balance = this.getBalance(root);

        if (balance > 1 && this.getBalance(root.left) >= 0) return this.rightRotate(root);
        if (balance > 1 && this.getBalance(root.left) < 0) {
            root.left = this.leftRotate(root.left);
            return this.rightRotate(root);
        }
        if (balance < -1 && this.getBalance(root.right) <= 0) return this.leftRotate(root);
        if (balance < -1 && this.getBalance(root.right) > 0) {
            root.right = this.rightRotate(root.right);
            return this.leftRotate(root);
        }
        return root;
    }
}

/**
 * Splay Tree Implementation (unchanged, but added cost tracking)
 */
class SplayTree {
    constructor() {
        this.root = null;
        this.steps = [];
        this.cost = 0;
    }

    cloneTree(node) {
        if (!node) return null;
        const newNode = new Node(node.value);
        newNode.left = this.cloneTree(node.left);
        newNode.right = this.cloneTree(node.right);
        return newNode;
    }

    recordStep(root, type, activeVal, parentVal = null, grandparentVal = null) {
        this.steps.push({
            root: this.cloneTree(root),
            type: type,
            involved: { active: activeVal, parent: parentVal, grandparent: grandparentVal }
        });
    }

    rightRotate(x) {
        let y = x.left;
        x.left = y.right;
        y.right = x;
        return y;
    }

    leftRotate(x) {
        let y = x.right;
        x.right = y.left;
        y.left = x;
        return y;
    }

    splay(root, value) {
        if (!root || root.value === value) return root;
        this.cost++;
        if (value < root.value) {
            if (!root.left) return root;
            if (value < root.left.value) {
                root.left.left = this.splay(root.left.left, value);
                root = this.rightRotate(root);
                this.recordStep(root, "Zig-Zig (Rotation 1)", value, root.right.value, null);
            } else if (value > root.left.value) {
                root.left.right = this.splay(root.left.right, value);
                if (root.left.right) {
                    root.left = this.leftRotate(root.left);
                    this.recordStep(root, "Zig-Zag (Rotation 1)", value, root.left.value, root.value);
                }
            }
            if (!root.left) return root;
            const oldParentVal = root.left.value;
            root = this.rightRotate(root);
            this.recordStep(root, "Final Rotation", value, oldParentVal, null);
            return root;
        } else {
            if (!root.right) return root;
            if (value < root.right.value) {
                root.right.left = this.splay(root.right.left, value);
                if (root.right.left) {
                    root.right = this.rightRotate(root.right);
                    this.recordStep(root, "Zag-Zig (Rotation 1)", value, root.right.value, root.value);
                }
            } else if (value > root.right.value) {
                root.right.right = this.splay(root.right.right, value);
                root = this.leftRotate(root);
                this.recordStep(root, "Zag-Zag (Rotation 1)", value, root.left.value, null);
            }
            if (!root.right) return root;
            const oldParentVal = root.right.value;
            root = this.leftRotate(root);
            this.recordStep(root, "Final Rotation", value, oldParentVal, null);
            return root;
        }
    }

    insert(value) {
        this.steps = [];
        this.cost = 0;
        if (!this.root) {
            this.root = new Node(value);
            this.recordStep(this.root, "Initial Insert", value);
            return;
        }
        this.recordStep(this.root, "Before Splay", value);
        this.root = this.splay(this.root, value);
        if (this.root.value === value) return;
        let newNode = new Node(value);
        if (value < this.root.value) {
            newNode.right = this.root;
            newNode.left = this.root.left;
            this.root.left = null;
        } else {
            newNode.left = this.root;
            newNode.right = this.root.right;
            this.root.right = null;
        }
        this.root = newNode;
        this.recordStep(this.root, "Final Position", value);
    }

    search(value) {
        this.steps = [];
        this.cost = 0;
        if (!this.root) return null;
        this.recordStep(this.root, "Before Search", value);
        this.root = this.splay(this.root, value);
        const found = this.root && this.root.value === value;
        this.recordStep(this.root, found ? "Found & Splayed" : "Not Found (Last Accessed Splayed)", value);
        return found ? this.root : null;
    }

    delete(value) {
        this.steps = [];
        this.cost = 0;
        if (!this.root) return;
        this.recordStep(this.root, "Before Delete", value);
        this.root = this.splay(this.root, value);
        if (this.root.value !== value) return;
        let temp = this.root;
        if (!this.root.left) this.root = this.root.right;
        else {
            this.root = this.splay(this.root.left, value);
            this.root.right = temp.right;
        }
        this.recordStep(this.root, "After Delete", value);
    }
}

/**
 * UI & Visualization Logic
 */
const splayTree = new SplayTree();
const bst = new BST();
const avl = new AVLTree();

// Cost history for graph
let costHistory = {
    splay: [],
    bst: [],
    avl: []
};

const views = {
    splay: { tree: splayTree, svgId: 'splay-svg', viewId: 'splay-view', metricsId: 'splay-metrics' },
    bst: { tree: bst, svgId: 'bst-svg', viewId: 'bst-view', metricsId: 'bst-metrics' },
    avl: { tree: avl, svgId: 'avl-svg', viewId: 'avl-view', metricsId: 'avl-metrics' }
};

const emptyState = document.getElementById('empty-state');
const statusText = document.getElementById('status-text');
const nodeInput = document.getElementById('nodeValue');
const treeSelect = document.getElementById('treeSelect');
const compareMode = document.getElementById('compareMode');
const buttons = document.querySelectorAll('.btn');
const canvas = document.getElementById('costGraph');
const ctx = canvas.getContext('2d');

const NODE_RADIUS = 22;
const VERTICAL_SPACING = 70;
const ANIMATION_DELAY = 600;

function updateStatus(message) { statusText.textContent = message; }
function setButtonsDisabled(disabled) { buttons.forEach(btn => btn.disabled = disabled); }

function getActiveTrees() {
    if (compareMode.checked) return Object.values(views);
    return [views[treeSelect.value]];
}

function updateUILayout() {
    const isCompare = compareMode.checked;
    const selected = treeSelect.value;
    
    Object.keys(views).forEach(key => {
        const view = views[key];
        const visible = isCompare || key === selected;
        document.getElementById(view.viewId).style.display = visible ? 'flex' : 'none';
    });
    
    treeSelect.disabled = isCompare;
    renderAll();
}

/**
 * Helper Metrics Functions
 */
function calculateHeight(node) {
    if (!node) return 0;
    return 1 + Math.max(calculateHeight(node.left), calculateHeight(node.right));
}

function countNodes(node) {
    if (!node) return 0;
    return 1 + countNodes(node.left) + countNodes(node.right);
}

function updateMetrics() {
    Object.values(views).forEach(view => {
        const height = calculateHeight(view.tree.root);
        const nodes = countNodes(view.tree.root);
        const cost = view.tree.cost || 0;
        document.getElementById(view.metricsId).textContent = `H: ${height} | N: ${nodes} | Cost: ${cost}`;
    });
}

/**
 * Graph Rendering
 */
function updateCostData() {
    costHistory.splay.push(splayTree.cost || 0);
    costHistory.bst.push(bst.cost || 0);
    costHistory.avl.push(avl.cost || 0);
    drawGraph();
}

function drawGraph() {
    const width = canvas.width = canvas.clientWidth;
    const height = canvas.height = canvas.clientHeight;
    
    ctx.clearRect(0, 0, width, height);
    
    const dataPoints = costHistory.splay.length;
    if (dataPoints < 1) return;
    
    // Scale calculation
    const maxCost = Math.max(
        ...costHistory.splay, 
        ...costHistory.bst, 
        ...costHistory.avl, 
        5 // Minimum scale
    );
    
    const xStep = dataPoints > 1 ? (width - 40) / (dataPoints - 1) : 0;
    const yBaseline = height - 20;
    const yAvailable = height - 40;
    
    // Draw grid
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, 10);
    ctx.lineTo(20, yBaseline);
    ctx.lineTo(width - 20, yBaseline);
    ctx.stroke();

    // Helper to draw a line graph
    const drawLine = (data, color) => {
        if (data.length === 0) return;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        data.forEach((val, i) => {
            const x = 20 + i * xStep;
            const y = yBaseline - (val / maxCost) * yAvailable;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
            
            // Draw point
            ctx.fillStyle = color;
            ctx.fillRect(x - 2, y - 2, 4, 4);
        });
        ctx.stroke();
    };
    
    drawLine(costHistory.splay, '#6366f1');
    drawLine(costHistory.bst, '#f59e0b');
    drawLine(costHistory.avl, '#10b981');
}

/**
 * Rendering
 */
function renderAll() {
    const active = getActiveTrees();
    const hasAnyNodes = active.some(v => v.tree.root !== null);
    emptyState.style.display = hasAnyNodes ? 'none' : 'block';
    
    active.forEach(view => {
        renderTree(view.tree.root, view.svgId);
    });
    updateMetrics();
    drawGraph();
}

function renderTree(root, svgId, involved = {}) {
    const svg = document.getElementById(svgId);
    if (!svg) return;
    svg.innerHTML = '';
    if (!root) return;

    const width = svg.clientWidth;
    assignCoordinates(root, 0, 40, width - 40);
    drawEdges(root, svg);
    drawNodes(root, svg, involved, root);
}

function assignCoordinates(node, depth, xMin, xMax) {
    if (!node) return;
    node.x = (xMin + xMax) / 2;
    node.y = 40 + depth * VERTICAL_SPACING;
    if (node.left) assignCoordinates(node.left, depth + 1, xMin, node.x);
    if (node.right) assignCoordinates(node.right, depth + 1, node.x, xMax);
}

function drawEdges(node, svg) {
    if (!node) return;
    if (node.left) {
        createLine(node.x, node.y, node.left.x, node.left.y, svg);
        drawEdges(node.left, svg);
    }
    if (node.right) {
        createLine(node.x, node.y, node.right.x, node.right.y, svg);
        drawEdges(node.right, svg);
    }
}

function drawNodes(node, svg, involved, actualRoot) {
    if (!node) return;
    drawNodes(node.left, svg, involved, actualRoot);
    drawNodes(node.right, svg, involved, actualRoot);

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', node.x);
    circle.setAttribute('cy', node.y);
    circle.setAttribute('r', NODE_RADIUS);
    
    let nodeClass = 'node-circle';
    if (node.value === actualRoot?.value && !involved.active) nodeClass += ' root-node';
    if (node.value === involved.active) nodeClass += ' active-node';
    else if (node.value === involved.parent) nodeClass += ' parent-node';
    else if (node.value === involved.grandparent) nodeClass += ' grandparent-node';
    
    circle.setAttribute('class', nodeClass);
    svg.appendChild(circle);

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', node.x);
    text.setAttribute('y', node.y);
    text.setAttribute('class', 'node-text');
    text.textContent = node.value;
    svg.appendChild(text);
}

function createLine(x1, y1, x2, y2, svg) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1); line.setAttribute('y1', y1);
    line.setAttribute('x2', x2); line.setAttribute('y2', y2);
    line.setAttribute('class', 'tree-link');
    svg.appendChild(line);
}

async function playSplayAnimation() {
    setButtonsDisabled(true);
    for (const step of splayTree.steps) {
        await new Promise(r => setTimeout(r, ANIMATION_DELAY));
        renderTree(step.root, 'splay-svg', step.involved);
        updateStatus(step.type);
    }
    setButtonsDisabled(false);
    renderAll();
}

// Event Listeners
document.getElementById('insertBtn').addEventListener('click', async () => {
    const val = parseInt(nodeInput.value);
    if (isNaN(val)) return;
    nodeInput.value = '';
    
    const active = getActiveTrees();
    active.forEach(v => v.tree.insert(val));
    updateCostData();
    
    if (active.some(v => v.tree === splayTree)) {
        await playSplayAnimation();
    } else {
        renderAll();
    }
});

document.getElementById('searchBtn').addEventListener('click', async () => {
    const val = parseInt(nodeInput.value);
    if (isNaN(val)) return;
    nodeInput.value = '';
    
    const active = getActiveTrees();
    active.forEach(v => v.tree.search(val));
    updateCostData();
    
    if (active.some(v => v.tree === splayTree)) {
        await playSplayAnimation();
    } else {
        renderAll();
    }
});

document.getElementById('deleteBtn').addEventListener('click', async () => {
    const val = parseInt(nodeInput.value);
    if (isNaN(val)) return;
    nodeInput.value = '';
    
    const active = getActiveTrees();
    active.forEach(v => v.tree.delete(val));
    updateCostData();
    
    if (active.some(v => v.tree === splayTree)) {
        await playSplayAnimation();
    } else {
        renderAll();
    }
});

document.getElementById('resetBtn').addEventListener('click', () => {
    Object.values(views).forEach(v => {
        v.tree.root = null;
        v.tree.cost = 0;
        if (v.tree.steps) v.tree.steps = [];
    });
    costHistory = { splay: [], bst: [], avl: [] };
    renderAll();
    updateStatus('All trees reset.');
});

treeSelect.addEventListener('change', updateUILayout);
compareMode.addEventListener('change', updateUILayout);
window.addEventListener('resize', renderAll);

// Initial state
updateUILayout();

treeSelect.addEventListener('change', updateUILayout);
compareMode.addEventListener('change', updateUILayout);
window.addEventListener('resize', renderAll);

// Initial state
updateUILayout();
