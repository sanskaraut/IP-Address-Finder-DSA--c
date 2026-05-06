/**
 * Splay Tree Node Class
 */
class Node {
    constructor(key, ip) {
        this.value = key; // Numeric value for tree comparisons
        this.ip = ip;    // IP string for display
        this.left = null;
        this.right = null;
        this.height = 1; // Used for AVL
        this.x = 0;
        this.y = 0;
    }
}

/**
 * IP Metadata Store
 * Maps numeric key -> { ip, dataPacket, isBlacklisted, isWhitelisted }
 */
const ipStore = new Map();

/**
 * Convert IPv4 to numeric value (Base 256)
 */
function ipToNumber(ip) {
    const parts = ip.split('.').map(Number);
    return (parts[0] * Math.pow(256, 3)) + 
           (parts[1] * Math.pow(256, 2)) + 
           (parts[2] * 256) + 
           parts[3];
}

/**
 * Basic IPv4 format validation
 */
function isValidIP(ip) {
    const pattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return pattern.test(ip);
}

/**
 * Binary Search Tree (BST)
 */
class BST {
    constructor() {
        this.root = null;
        this.cost = 0;
        this.totalCost = 0;
        this.maxCost = 0;
        this.opCount = 0;
    }

    insert(value, ip) {
        this.cost = 0;
        const newNode = new Node(value, ip);
        if (!this.root) {
            this.root = newNode;
            this.cost = 1;
            this.totalCost += this.cost;
            this.maxCost = Math.max(this.maxCost, this.cost);
            this.opCount++;
            return;
        }
        let current = this.root;
        while (true) {
            this.cost++;
            if (value === current.value) return;
            if (value < current.value) {
                if (!current.left) {
                    current.left = newNode;
                    break;
                }
                current = current.left;
            } else {
                if (!current.right) {
                    current.right = newNode;
                    break;
                }
                current = current.right;
            }
        }
        this.totalCost += this.cost;
        this.maxCost = Math.max(this.maxCost, this.cost);
        this.opCount++;
    }

    search(value) {
        this.cost = 0;
        let current = this.root;
        while (current) {
            this.cost++;
            if (value === current.value) {
                this.totalCost += this.cost;
                this.maxCost = Math.max(this.maxCost, this.cost);
                this.opCount++;
                return current;
            }
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
            root.ip = temp.ip; // Also copy IP string
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

    insert(value, ip) {
        this.cost = 0;
        this.root = this._insertNode(this.root, value, ip);
        this.totalCost += this.cost;
        this.maxCost = Math.max(this.maxCost, this.cost);
        this.opCount++;
    }

    _insertNode(node, value, ip) {
        if (!node) {
            this.cost++;
            return new Node(value, ip);
        }
        this.cost++;
        if (value < node.value) {
            node.left = this._insertNode(node.left, value, ip);
        } else if (value > node.value) {
            node.right = this._insertNode(node.right, value, ip);
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
                root.ip = temp.ip; // Also copy IP string
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
        this.totalCost = 0;
        this.maxCost = 0;
        this.opCount = 0;
        this.searchCount = 0;
        this.rootHits = 0;
        
        // Extended metrics for Phase 3
        this.metrics = {
            rotations: 0,
            zig: 0,
            zigZig: 0,
            zagZag: 0,
            zigZag: 0,
            zagZig: 0,
            depthBefore: 0,
            depthAfter: 0
        };
    }

    cloneTree(node) {
        if (!node) return null;
        const newNode = new Node(node.value, node.ip);
        newNode.left = this.cloneTree(node.left);
        newNode.right = this.cloneTree(node.right);
        return newNode;
    }

    getDepth(root, value, depth = 0) {
        if (!root) return depth;
        if (root.value === value) return depth;
        if (value < root.value) return this.getDepth(root.left, value, depth + 1);
        return this.getDepth(root.right, value, depth + 1);
    }

    recordStep(root, type, activeVal, parentVal = null, grandparentVal = null, explanation = "") {
        this.steps.push({
            root: this.cloneTree(root),
            type: type,
            involved: { active: activeVal, parent: parentVal, grandparent: grandparentVal },
            explanation: explanation
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
                this.metrics.rotations++;
                this.metrics.zigZig++;
                this.recordStep(root, "Zig-Zig (Rotation 1)", value, root.right?.value, null, "Zig-Zig (Left-Left): Node is the left child of its parent, which is also a left child. Performing first right rotation on the grandparent.");
            } else if (value > root.left.value) {
                root.left.right = this.splay(root.left.right, value);
                if (root.left.right) {
                    root.left = this.leftRotate(root.left);
                    this.metrics.rotations++;
                    this.metrics.zigZag++;
                    this.recordStep(root, "Zig-Zag (Rotation 1)", value, root.left.value, root.value, "Zig-Zag (Left-Right): Node is the right child of its parent, which is a left child. Performing first left rotation on the parent.");
                }
            }
            if (!root.left) return root;
            const oldParentVal = root.left.value;
            root = this.rightRotate(root);
            this.metrics.rotations++;
            
            // If it was just a simple Zig without the recursive Zig-Zig/Zig-Zag above
            if (value === oldParentVal && this.cost === 1) {
                this.metrics.zig++;
                this.recordStep(root, "Zig", value, oldParentVal, null, "Zig (Left): Node is the left child of the root. Performing right rotation.");
            } else {
                this.recordStep(root, "Final Rotation", value, oldParentVal, null, "Completing the second step of the splay operation with a right rotation.");
            }
            return root;
        } else {
            if (!root.right) return root;
            if (value < root.right.value) {
                root.right.left = this.splay(root.right.left, value);
                if (root.right.left) {
                    root.right = this.rightRotate(root.right);
                    this.metrics.rotations++;
                    this.metrics.zagZig++;
                    this.recordStep(root, "Zag-Zig (Rotation 1)", value, root.right.value, root.value, "Zag-Zig (Right-Left): Node is the left child of its parent, which is a right child. Performing first right rotation on the parent.");
                }
            } else if (value > root.right.value) {
                root.right.right = this.splay(root.right.right, value);
                root = this.leftRotate(root);
                this.metrics.rotations++;
                this.metrics.zagZag++;
                this.recordStep(root, "Zag-Zag (Rotation 1)", value, root.left?.value, null, "Zag-Zag (Right-Right): Node is the right child of its parent, which is also a right child. Performing first left rotation on the grandparent.");
            }
            if (!root.right) return root;
            const oldParentVal = root.right.value;
            root = this.leftRotate(root);
            this.metrics.rotations++;
            
            if (value === oldParentVal && this.cost === 1) {
                this.metrics.zig++;
                this.recordStep(root, "Zag", value, oldParentVal, null, "Zag (Right): Node is the right child of the root. Performing left rotation.");
            } else {
                this.recordStep(root, "Final Rotation", value, oldParentVal, null, "Completing the second step of the splay operation with a left rotation.");
            }
            return root;
        }
    }

    insert(value, ip) {
        this.steps = [];
        this.cost = 0;
        this.metrics.depthBefore = this.getDepth(this.root, value);
        
        if (!this.root) {
            this.root = new Node(value, ip);
            this.metrics.depthAfter = 0;
            this.recordStep(this.root, "Initial Insert", value, null, null, "Tree was empty. Node inserted directly as root.");
            return;
        }
        
        this.recordStep(this.root, "Before Splay", value, null, null, "Locating position and beginning splay process.");
        this.root = this.splay(this.root, value);
        this.metrics.depthAfter = 0;
        
        this.totalCost += this.cost;
        this.maxCost = Math.max(this.maxCost, this.cost);
        this.opCount++;
        
        if (this.root.value === value) {
            this.recordStep(this.root, "Found", value, null, null, "Node already exists. Brought to root.");
            return;
        }
        
        let newNode = new Node(value, ip);
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
        this.recordStep(this.root, "Final Position", value, null, null, "Splay complete. Node inserted at root.");
    }

    search(value) {
        this.steps = [];
        this.cost = 0;
        this.metrics.depthBefore = this.getDepth(this.root, value);
        
        if (!this.root) {
            this.recordStep(null, "Not Found", value, null, null, "Tree is empty.");
            return null;
        }
        
        this.recordStep(this.root, "Before Search", value, null, null, "Beginning search and splay process.");
        this.root = this.splay(this.root, value);
        this.metrics.depthAfter = 0;
        
        this.totalCost += this.cost;
        this.maxCost = Math.max(this.maxCost, this.cost);
        this.opCount++;
        this.searchCount++;
        
        const found = this.root && this.root.value === value;
        if (found && this.cost <= 1) this.rootHits++;
        
        this.recordStep(this.root, found ? "Found & Splayed" : "Not Found (Last Accessed Splayed)", value, null, null, found ? "Node found and successfully splayed to root." : "Node not found. Last accessed node splayed to root.");
        return found ? this.root : null;
    }

    delete(value) {
        this.steps = [];
        this.cost = 0;
        this.metrics.depthBefore = this.getDepth(this.root, value);
        
        if (!this.root) return;
        this.recordStep(this.root, "Before Delete", value, null, null, "Splaying the node to be deleted to the root.");
        
        this.root = this.splay(this.root, value);
        
        if (this.root.value !== value) {
            this.recordStep(this.root, "Not Found", value, null, null, "Node to delete was not found. Last accessed node splayed to root.");
            return;
        }
        
        let temp = this.root;
        if (!this.root.left) {
            this.root = this.root.right;
        } else {
            this.recordStep(this.root.left, "Splay Max of Left", value, null, null, "Node deleted. Now splaying the maximum node of the left subtree to the root.");
            this.root = this.splay(this.root.left, value);
            this.root.right = temp.right;
        }
        this.metrics.depthAfter = 0; // Technically it's deleted, but the new root is at 0.
        this.recordStep(this.root, "After Delete", value, null, null, "Deletion complete. Left subtree maximum is the new root.");
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
let treeSnapshots = [];

const views = {
    splay: { tree: splayTree, svgId: 'splay-svg', viewId: 'splay-view', metricsId: 'splay-metrics' },
    bst: { tree: bst, svgId: 'bst-svg', viewId: 'bst-view', metricsId: 'bst-metrics' },
    avl: { tree: avl, svgId: 'avl-svg', viewId: 'avl-view', metricsId: 'avl-metrics' }
};

const emptyState = document.getElementById('empty-state');
const statusText = document.getElementById('status-text');
const ipInput = document.getElementById('ipInput');
const packetInput = document.getElementById('packetInput');
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
    
    // When comparison mode is enabled, rebuild trees to ensure sync
    if (isCompare) {
        syncAllTreesFromStore();
    } else {
        renderAll();
    }
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

/**
 * Helper: Format IP for node display (Shortened but Unique)
 */
function formatIP(ip) {
    const parts = ip.split('.');
    return `..${parts[2]}.${parts[3]}`;
}

/**
 * Helper: Sync all trees using data from ipStore
 */
function syncAllTreesFromStore() {
    // Clear all trees
    Object.values(views).forEach(v => {
        v.tree.root = null;
        // Don't reset historical metrics here, just the structure
    });

    const sortedIPs = Array.from(ipStore.values()).sort((a, b) => ipToNumber(a.ip) - ipToNumber(b.ip));
    
    // Insert into all trees
    sortedIPs.forEach(data => {
        const key = ipToNumber(data.ip);
        splayTree.insert(key, data.ip);
        bst.insert(key, data.ip);
        avl.insert(key, data.ip);
    });
    
    renderAll();
}

function updateMetrics() {
    Object.keys(views).forEach(key => {
        const view = views[key];
        const tree = view.tree;
        const container = document.getElementById(view.metricsId);
        
        const height = calculateHeight(tree.root);
        const nodes = countNodes(tree.root);
        const avgCost = tree.opCount > 0 ? (tree.totalCost / tree.opCount).toFixed(2) : 0;
        const maxCost = tree.maxCost || 0;
        const lastCost = tree.cost || 0;
        
        let extraMetric = '';
        if (key === 'splay') {
            const hitRate = tree.searchCount > 0 ? ((tree.rootHits / tree.searchCount) * 100).toFixed(1) : 0;
            extraMetric = `
                <div class="metric-card">
                    <span class="label">Hit Rate</span>
                    <span class="value">${hitRate}%</span>
                </div>
            `;
        }

        container.innerHTML = `
            <div class="metric-card">
                <span class="label">Height</span>
                <span class="value">${height}</span>
            </div>
            <div class="metric-card">
                <span class="label">Nodes</span>
                <span class="value">${nodes}</span>
            </div>
            <div class="metric-card">
                <span class="label">Last Cost</span>
                <span class="value">${lastCost}</span>
            </div>
            <div class="metric-card">
                <span class="label">Avg Cost</span>
                <span class="value">${avgCost}</span>
            </div>
            <div class="metric-card">
                <span class="label">Max Cost</span>
                <span class="value">${maxCost}</span>
            </div>
            ${extraMetric}
        `;
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

let currentGraphMode = 'instant'; // instant, moving, cumulative
let graphHoverData = []; // Array to map x coordinates to op indexes

document.querySelectorAll('.graph-toggles .btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.graph-toggles .btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentGraphMode = e.target.dataset.mode;
        drawGraph();
    });
});

canvas.addEventListener('mousemove', (e) => {
    if (graphHoverData.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    
    // Find closest point
    let closest = graphHoverData[0];
    let minDist = Math.abs(x - closest.x);
    for (let i = 1; i < graphHoverData.length; i++) {
        const dist = Math.abs(x - graphHoverData[i].x);
        if (dist < minDist) {
            minDist = dist;
            closest = graphHoverData[i];
        }
    }
    
    if (minDist < 20) { // Hover threshold
        const tooltip = document.getElementById('graphTooltip');
        tooltip.style.display = 'block';
        tooltip.style.left = `${closest.x + 10}px`;
        tooltip.style.top = `${rect.top > 100 ? 50 : 10}px`; // Keep it somewhat fixed or near top
        
        let s = closest.splay.toFixed(1);
        let b = closest.bst.toFixed(1);
        let a = closest.avl.toFixed(1);
        
        tooltip.innerHTML = `
            <strong>Op: ${closest.index + 1}</strong><br>
            <span style="color:#6366f1">Splay: ${s}</span><br>
            <span style="color:#f59e0b">BST: ${b}</span><br>
            <span style="color:#10b981">AVL: ${a}</span>
        `;
    } else {
        document.getElementById('graphTooltip').style.display = 'none';
    }
});

canvas.addEventListener('mouseleave', () => {
    document.getElementById('graphTooltip').style.display = 'none';
});

function getProcessedGraphData(rawArray, mode) {
    if (mode === 'instant') return rawArray;
    
    let processed = [];
    if (mode === 'cumulative') {
        let sum = 0;
        for (let i = 0; i < rawArray.length; i++) {
            sum += rawArray[i];
            processed.push(sum);
        }
    } else if (mode === 'moving') {
        for (let i = 0; i < rawArray.length; i++) {
            let windowSize = Math.min(20, Math.max(5, Math.floor((i + 1) / 10)));
            let start = Math.max(0, i - windowSize + 1);
            let sum = 0;
            for (let j = start; j <= i; j++) sum += rawArray[j];
            processed.push(sum / (i - start + 1));
        }
    }
    return processed;
}

function drawGraph() {
    const width = canvas.width = canvas.clientWidth;
    const height = canvas.height = canvas.clientHeight;
    
    ctx.clearRect(0, 0, width, height);
    graphHoverData = [];
    
    const dataPoints = costHistory.splay.length;
    if (dataPoints < 1) return;
    
    const splayData = getProcessedGraphData(costHistory.splay, currentGraphMode);
    const bstData = getProcessedGraphData(costHistory.bst, currentGraphMode);
    const avlData = getProcessedGraphData(costHistory.avl, currentGraphMode);
    
    // Scale calculation
    const maxCost = Math.max(...splayData, ...bstData, ...avlData, 5);
    
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
    
    drawLine(splayData, '#6366f1');
    drawLine(bstData, '#f59e0b');
    drawLine(avlData, '#10b981');
    
    // Populate hover data
    for (let i = 0; i < dataPoints; i++) {
        graphHoverData.push({
            index: i,
            x: 20 + i * xStep,
            splay: splayData[i],
            bst: bstData[i],
            avl: avlData[i]
        });
    }
}

/**
 * Rendering
 */
function renderAll(involved = {}) {
    const active = getActiveTrees();
    const hasAnyNodes = active.some(v => v.tree.root !== null);
    emptyState.style.display = hasAnyNodes ? 'none' : 'block';
    
    active.forEach(view => {
        renderTree(view.tree.root, view.svgId, involved);
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

    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('class', 'node-group');

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', node.x);
    circle.setAttribute('cy', node.y);
    circle.setAttribute('r', NODE_RADIUS);
    
    const metadata = ipStore.get(node.value);
    let nodeClass = 'node-circle';
    if (metadata) {
        if (metadata.isBlacklisted) nodeClass += ' blacklisted';
        else if (metadata.isWhitelisted) nodeClass += ' whitelisted';
    }
    
    if (node.value === actualRoot?.value && !involved.active) nodeClass += ' root-node';
    if (node.value === involved.active) nodeClass += ' active-node';
    else if (node.value === involved.parent) nodeClass += ' parent-node';
    else if (node.value === involved.grandparent) nodeClass += ' grandparent-node';
    
    circle.setAttribute('class', nodeClass);
    group.appendChild(circle);

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', node.x);
    text.setAttribute('y', node.y);
    text.setAttribute('class', 'node-text');
    text.textContent = formatIP(node.ip);
    group.appendChild(text);

    // Tooltip Events
    group.onmouseenter = (e) => showTooltip(e, node.ip, metadata);
    group.onmouseleave = hideTooltip;

    svg.appendChild(group);
}

// Tooltip logic
const tooltip = document.createElement('div');
tooltip.className = 'node-tooltip';
document.body.appendChild(tooltip);

function showTooltip(e, ip, metadata) {
    tooltip.style.display = 'block';
    tooltip.style.left = `${e.pageX + 10}px`;
    tooltip.style.top = `${e.pageY + 10}px`;
    
    const status = metadata?.isBlacklisted ? 'Blacklisted' : (metadata?.isWhitelisted ? 'Whitelisted' : 'Normal');
    tooltip.innerHTML = `
        <strong>IP:</strong> ${ip}<br>
        <strong>Packets:</strong> ${metadata?.dataPacket || 0}<br>
        <strong>Status:</strong> ${status}
    `;
}

function hideTooltip() {
    tooltip.style.display = 'none';
}

function createLine(x1, y1, x2, y2, svg) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1); line.setAttribute('y1', y1);
    line.setAttribute('x2', x2); line.setAttribute('y2', y2);
    line.setAttribute('class', 'tree-link');
    svg.appendChild(line);
}

async function playSplayAnimation(involvedAtEnd = {}) {
    setButtonsDisabled(true);
    for (const step of splayTree.steps) {
        await new Promise(r => setTimeout(r, ANIMATION_DELAY));
        renderTree(step.root, 'splay-svg', step.involved);
        updateStatus(step.type);
    }
    setButtonsDisabled(false);
    renderAll(involvedAtEnd);
}

/**
 * Workload Simulation Mode
 */
async function runSimulation(type) {
    if (ipStore.size === 0) {
        updateStatus("Add some IPs first to run simulation!");
        return;
    }

    const keys = Array.from(ipStore.keys());
    let sequence = [];
    const OP_COUNT = 50;

    updateStatus(`Running ${type} Simulation...`);
    setButtonsDisabled(true);
    
    // Generate sequence based on type
    if (type === 'Hotspot') {
        // Select 3 random hotspot keys
        const hotspots = [];
        for(let i=0; i<Math.min(3, keys.length); i++) {
            hotspots.push(keys[Math.floor(Math.random() * keys.length)]);
        }
        for(let i=0; i<OP_COUNT; i++) {
            // 80% chance to pick a hotspot
            if (Math.random() < 0.8) {
                sequence.push(hotspots[Math.floor(Math.random() * hotspots.length)]);
            } else {
                sequence.push(keys[Math.floor(Math.random() * keys.length)]);
            }
        }
    } else if (type === 'Random') {
        for(let i=0; i<OP_COUNT; i++) {
            sequence.push(keys[Math.floor(Math.random() * keys.length)]);
        }
    } else if (type === 'Sequential') {
        const sortedKeys = [...keys].sort((a,b) => a-b);
        for(let i=0; i<OP_COUNT; i++) {
            sequence.push(sortedKeys[i % sortedKeys.length]);
        }
    }

    let totals = { splay: 0, bst: 0, avl: 0 };

    // Execute sequence
    for (let i = 0; i < sequence.length; i++) {
        const key = sequence[i];
        
        const metadata = ipStore.get(key);
        if (metadata) metadata.simSearchFrequency++;

        // Apply to all trees
        splayTree.search(key);
        bst.search(key);
        avl.search(key);

        totals.splay += splayTree.cost;
        totals.bst += bst.cost;
        totals.avl += avl.cost;

        // Record history and draw graph (but don't animate tree to stay fast)
        updateCostData();
        
        // Capture Tree Snapshot every 10 ops
        if ((i + 1) % 10 === 0) {
            treeSnapshots.push({
                opCount: i + 1,
                root: splayTree.cloneTree(splayTree.root)
            });
            if (document.getElementById('tab-analytics').style.display === 'flex') {
                renderSnapshotsTimeline();
            }
        }
        
        // Small delay to keep UI responsive but fast
        if (i % 5 === 0) {
            await new Promise(r => setTimeout(r, 10));
        }
    }

    // Show results
    document.getElementById('sim-results').style.display = 'block';
    document.getElementById('sim-type-text').textContent = type;
    document.getElementById('splay-avg').textContent = (totals.splay / OP_COUNT).toFixed(2);
    document.getElementById('bst-avg').textContent = (totals.bst / OP_COUNT).toFixed(2);
    document.getElementById('avl-avg').textContent = (totals.avl / OP_COUNT).toFixed(2);

    setButtonsDisabled(false);
    renderAll();
    updateStatus(`${type} Simulation Complete.`);
    
    // Update dashboard if active
    if (document.getElementById('tab-analytics').style.display === 'flex') {
        updateAnalyticsDashboard();
    }
}

/**
 * IP Management Logic
 */
function renderIPTable() {
    const tbody = document.getElementById('ipTableBody');
    tbody.innerHTML = '';
    
    // Sort IPs by numeric value for the table
    const sortedIPs = Array.from(ipStore.values()).sort((a, b) => ipToNumber(a.ip) - ipToNumber(b.ip));
    
    sortedIPs.forEach(data => {
        const tr = document.createElement('tr');
        
        let statusClass = 'status-normal';
        let statusText = 'Normal';
        if (data.isBlacklisted) {
            statusClass = 'status-blacklisted';
            statusText = 'Blacklisted';
        } else if (data.isWhitelisted) {
            statusClass = 'status-whitelisted';
            statusText = 'Whitelisted';
        }
        
        tr.innerHTML = `
            <td>${data.ip}</td>
            <td>${data.dataPacket}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

// IP Management Handlers
document.getElementById('addIPBtn').addEventListener('click', async () => {
    const ip = ipInput.value.trim();
    const packet = parseInt(packetInput.value) || 0;
    
    if (!isValidIP(ip)) {
        updateStatus("Invalid IPv4 format.");
        return;
    }
    
    const key = ipToNumber(ip);
    if (ipStore.has(key)) {
        updateStatus("IP already exists in registry.");
        showToast("IP already exists in registry.", 'warning');
        return;
    }
    
    // 1. Update ipStore
    ipStore.set(key, { ip, dataPacket: packet, isBlacklisted: false, isWhitelisted: false, realSearchFrequency: 0, simSearchFrequency: 0 });
    
    // 2. Update all active trees
    const active = getActiveTrees();
    active.forEach(v => v.tree.insert(key, ip));
    
    ipInput.value = '';
    packetInput.value = '';
    renderIPTable();
    
    if (active.some(v => v.tree === splayTree)) {
        await playSplayAnimation();
    } else {
        renderAll();
    }
    updateStatus(`Added ${ip} to network.`);
    showToast(`Added ${ip} to network.`, 'success');
});

document.getElementById('searchIPBtn').addEventListener('click', async () => {
    const ip = ipInput.value.trim();
    if (!isValidIP(ip)) {
        updateStatus("Invalid IPv4 format.");
        return;
    }
    
    const key = ipToNumber(ip);
    const active = getActiveTrees();
    
    active.forEach(v => v.tree.search(key));
    updateCostData();
    
    if (active.some(v => v.tree === splayTree)) {
        await playSplayAnimation();
    } else {
        renderAll();
    }
    
    if (ipStore.has(key)) {
        const data = ipStore.get(key);
        data.realSearchFrequency++;
        
        updateStatus(`Found ${ip} in network.`);
        showToast(`Found ${ip}`, 'success');
        
        // Update dashboard if we are on that tab
        if (document.getElementById('tab-analytics').style.display === 'flex') {
            updateAnalyticsDashboard();
        }
    } else {
        updateStatus(`${ip} not found.`);
        showToast(`${ip} not found`, 'warning');
    }
});

document.getElementById('deleteIPBtn').addEventListener('click', async () => {
    const ip = ipInput.value.trim();
    if (!isValidIP(ip)) {
        updateStatus("Invalid IPv4 format.");
        return;
    }
    
    const key = ipToNumber(ip);
    if (!ipStore.has(key)) {
        updateStatus("IP not found in registry.");
        return;
    }
    
    // 1. Remove from ipStore
    ipStore.delete(key);
    
    // 2. Remove from all trees
    const active = getActiveTrees();
    active.forEach(v => v.tree.delete(key));
    
    ipInput.value = '';
    renderIPTable();
    
    if (active.some(v => v.tree === splayTree)) {
        await playSplayAnimation();
    } else {
        renderAll();
    }
    updateStatus(`Deleted ${ip} from network.`);
    showToast(`Deleted ${ip}`, 'success');
});

document.getElementById('updatePacketBtn').addEventListener('click', () => {
    const ip = ipInput.value.trim();
    const packet = parseInt(packetInput.value);
    
    if (!isValidIP(ip)) {
        updateStatus("Invalid IPv4 format.");
        return;
    }
    if (isNaN(packet)) {
        updateStatus("Please enter a valid packet value.");
        return;
    }
    
    const key = ipToNumber(ip);
    if (!ipStore.has(key)) {
        updateStatus("IP not found.");
        return;
    }
    
    const data = ipStore.get(key);
    data.dataPacket = packet;
    ipStore.set(key, data);
    
    renderIPTable();
    updateStatus(`Updated data packet for ${ip}.`);
});

document.getElementById('blacklistBtn').addEventListener('click', () => {
    const ip = ipInput.value.trim();
    if (!isValidIP(ip)) return;
    
    const key = ipToNumber(ip);
    if (!ipStore.has(key)) return;
    
    const data = ipStore.get(key);
    data.isBlacklisted = !data.isBlacklisted;
    if (data.isBlacklisted) data.isWhitelisted = false; // Mutual exclusivity
    
    ipStore.set(key, data);
    renderIPTable();
    renderAll();
    updateStatus(data.isBlacklisted ? `${ip} Blacklisted.` : `${ip} removed from Blacklist.`);
});

document.getElementById('whitelistBtn').addEventListener('click', () => {
    const ip = ipInput.value.trim();
    if (!isValidIP(ip)) return;
    
    const key = ipToNumber(ip);
    if (!ipStore.has(key)) return;
    
    const data = ipStore.get(key);
    data.isWhitelisted = !data.isWhitelisted;
    if (data.isWhitelisted) data.isBlacklisted = false; // Mutual exclusivity
    
    ipStore.set(key, data);
    renderIPTable();
    renderAll();
    updateStatus(data.isWhitelisted ? `${ip} Whitelisted.` : `${ip} removed from Whitelist.`);
});

document.getElementById('resetBtn').addEventListener('click', () => {
    Object.values(views).forEach(v => {
        v.tree.root = null;
        v.tree.cost = 0;
        if (v.tree.steps) v.tree.steps = [];
    });
    ipStore.clear();
    costHistory = { splay: [], bst: [], avl: [] };
    treeSnapshots = [];
    renderIPTable();
    renderAll();
    updateAnalyticsDashboard();
    updateStatus('All data reset.');
});

document.getElementById('hotspotBtn').addEventListener('click', () => {
    treeSnapshots = [];
    runSimulation('Hotspot');
});
document.getElementById('randomBtn').addEventListener('click', () => {
    treeSnapshots = [];
    runSimulation('Random');
});
document.getElementById('seqBtn').addEventListener('click', () => {
    treeSnapshots = [];
    runSimulation('Sequential');
});

treeSelect.addEventListener('change', updateUILayout);
compareMode.addEventListener('change', updateUILayout);
window.addEventListener('resize', renderAll);


// Initial state
updateUILayout();
renderIPTable();

/**
 * ==========================================
 * PHASE 1 & 2: SIMULATION ENGINE
 * ==========================================
 */

// Tab Switching Logic
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.style.display = 'none');
        
        btn.classList.add('active');
        document.getElementById(btn.dataset.target).style.display = 'flex';
        
        if (btn.dataset.target === 'tab-simulation') {
            renderSimTree();
        } else {
            renderAll();
        }
    });
});

// Toast Feedback System
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Icons based on type
    let icon = '✓';
    if (type === 'error') icon = '✕';
    if (type === 'warning') icon = '⚠';
    
    toast.innerHTML = `<strong>${icon}</strong> <span>${message}</span>`;
    container.appendChild(toast);
    
    // Remove after animation completes (3.3s total)
    setTimeout(() => {
        if (container.contains(toast)) {
            container.removeChild(toast);
        }
    }, 3500);
}

// Sandbox Tree
const simSplayTree = new SplayTree();

// Placeholder render for sim tree
function renderSimTree() {
    const svg = document.getElementById('sim-splay-svg');
    const emptyState = document.getElementById('sim-empty-state');
    
    if (!simSplayTree.root) {
        svg.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    renderTree(simSplayTree.root, 'sim-splay-svg', {});
}

// Basic hooking of sim inputs to sim tree (Phase 1)
// We will replace these with the full playback engine logic.

let simPlayback = {
    steps: [],
    currentIndex: -1,
    isPlaying: false,
    timer: null,
    targetIP: null
};

function updateSimMetrics() {
    const m = simSplayTree.metrics;
    document.getElementById('simMetricRotations').textContent = m.rotations;
    document.getElementById('simMetricDepthBefore').textContent = m.depthBefore;
    document.getElementById('simMetricDepthAfter').textContent = m.depthAfter;
    document.getElementById('simMetricDepthImprov').textContent = (m.depthBefore - m.depthAfter);
    document.getElementById('simMetricZig').textContent = m.zig;
    document.getElementById('simMetricZigZig').textContent = m.zigZig;
    document.getElementById('simMetricZagZag').textContent = m.zagZag;
    document.getElementById('simMetricZigZag').textContent = m.zigZag;
    document.getElementById('simMetricZagZig').textContent = m.zagZig;
}

function updateSimUI() {
    const prevBtn = document.getElementById('simPrevBtn');
    const nextBtn = document.getElementById('simNextBtn');
    const autoBtn = document.getElementById('simAutoBtn');
    const resetBtn = document.getElementById('simResetBtn');
    
    if (simPlayback.steps.length === 0) {
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        autoBtn.disabled = true;
        resetBtn.disabled = true;
        document.getElementById('simStepCounter').textContent = "Step: - / -";
        document.getElementById('simOperationText').textContent = "Ready for simulation.";
        document.getElementById('simExplanationText').textContent = "";
        return;
    }

    resetBtn.disabled = false;
    autoBtn.disabled = false;
    
    if (simPlayback.currentIndex <= 0) {
        prevBtn.disabled = true;
    } else {
        prevBtn.disabled = false;
    }

    if (simPlayback.currentIndex >= simPlayback.steps.length - 1) {
        nextBtn.disabled = true;
        if (simPlayback.isPlaying) toggleAutoPlay(); // stop auto play if reached end
    } else {
        nextBtn.disabled = false;
    }
    
    // Update Explanation Panel
    const step = simPlayback.steps[simPlayback.currentIndex] || simPlayback.steps[0];
    const displayIndex = Math.max(0, simPlayback.currentIndex) + 1;
    
    document.getElementById('simStepCounter').textContent = `Step: ${displayIndex} / ${simPlayback.steps.length}`;
    document.getElementById('simOperationText').textContent = step.type;
    document.getElementById('simExplanationText').textContent = step.explanation;
}

function renderSimStep(index) {
    if (index < 0 || index >= simPlayback.steps.length) return;
    const step = simPlayback.steps[index];
    const svg = document.getElementById('sim-splay-svg');
    const emptyState = document.getElementById('sim-empty-state');
    
    if (!step.root) {
        svg.innerHTML = '';
        emptyState.style.display = 'block';
    } else {
        emptyState.style.display = 'none';
        renderTree(step.root, 'sim-splay-svg', step.involved);
    }
    updateSimUI();
}

function executeSimOperation(operation, ip) {
    const key = ipToNumber(ip);
    
    // Reset playback state
    if (simPlayback.isPlaying) toggleAutoPlay();
    
    if (operation === 'insert') {
        const existed = simSplayTree.searchCount > 0 ? (simSplayTree.search(key), simSplayTree.root && simSplayTree.root.value === key) : false; // Quick existence check, but actually we just call insert
        simSplayTree.insert(key, ip);
    } else if (operation === 'search') {
        simSplayTree.search(key);
    } else if (operation === 'delete') {
        simSplayTree.delete(key);
    }
    
    simPlayback.steps = simSplayTree.steps;
    simPlayback.currentIndex = 0;
    simPlayback.targetIP = ip;
    
    updateSimMetrics();
    renderSimStep(0);
}

// Controls
document.getElementById('simInsertBtn').addEventListener('click', () => {
    const ip = document.getElementById('simIpInput').value.trim();
    if (!isValidIP(ip)) return showToast('Invalid IP format', 'error');
    executeSimOperation('insert', ip);
    showToast(`Simulation started: Insert ${ip}`, 'success');
});

document.getElementById('simSearchBtn').addEventListener('click', () => {
    const ip = document.getElementById('simIpInput').value.trim();
    if (!isValidIP(ip)) return showToast('Invalid IP format', 'error');
    executeSimOperation('search', ip);
    showToast(`Simulation started: Search ${ip}`, 'success');
});

document.getElementById('simDeleteBtn').addEventListener('click', () => {
    const ip = document.getElementById('simIpInput').value.trim();
    if (!isValidIP(ip)) return showToast('Invalid IP format', 'error');
    executeSimOperation('delete', ip);
    showToast(`Simulation started: Delete ${ip}`, 'success');
});

document.getElementById('simNextBtn').addEventListener('click', () => {
    if (simPlayback.currentIndex < simPlayback.steps.length - 1) {
        simPlayback.currentIndex++;
        renderSimStep(simPlayback.currentIndex);
    }
});

document.getElementById('simPrevBtn').addEventListener('click', () => {
    if (simPlayback.currentIndex > 0) {
        simPlayback.currentIndex--;
        renderSimStep(simPlayback.currentIndex);
    }
});

function toggleAutoPlay() {
    const btn = document.getElementById('simAutoBtn');
    if (simPlayback.isPlaying) {
        simPlayback.isPlaying = false;
        clearInterval(simPlayback.timer);
        btn.textContent = 'Auto Play';
        btn.classList.replace('btn-danger', 'btn-secondary');
    } else {
        if (simPlayback.currentIndex >= simPlayback.steps.length - 1) {
            simPlayback.currentIndex = 0; // reset if at end
        }
        simPlayback.isPlaying = true;
        btn.textContent = 'Pause';
        btn.classList.replace('btn-secondary', 'btn-danger');
        simPlayback.timer = setInterval(() => {
            if (simPlayback.currentIndex < simPlayback.steps.length - 1) {
                simPlayback.currentIndex++;
                renderSimStep(simPlayback.currentIndex);
            } else {
                toggleAutoPlay();
            }
        }, 1200);
    }
}

document.getElementById('simAutoBtn').addEventListener('click', toggleAutoPlay);

document.getElementById('simResetBtn').addEventListener('click', () => {
    if (simPlayback.isPlaying) toggleAutoPlay();
    simPlayback.currentIndex = 0;
    renderSimStep(0);
});

document.getElementById('simClearTreeBtn').addEventListener('click', () => {
    if (simPlayback.isPlaying) toggleAutoPlay();
    simSplayTree.root = null;
    simSplayTree.steps = [];
    simSplayTree.metrics = { rotations: 0, zig: 0, zigZig: 0, zagZag: 0, zigZag: 0, zagZig: 0, depthBefore: 0, depthAfter: 0 };
    simPlayback.steps = [];
    simPlayback.currentIndex = -1;
    updateSimMetrics();
    renderSimTree();
    updateSimUI();
    showToast('Simulation tree cleared', 'success');
});

/**
 * ==========================================
 * PHASE 3: ANALYTICS DASHBOARD
 * ==========================================
 */

function getTopKLocalityScore(ips, trafficProperty) {
    if (ips.length === 0) return { percent: 0, kPercent: 0 };
    
    // Sort descending by traffic
    let sorted = [...ips].sort((a,b) => b[trafficProperty] - a[trafficProperty]);
    let totalTraffic = sorted.reduce((sum, item) => sum + item[trafficProperty], 0);
    
    if (totalTraffic === 0) return { percent: 0, kPercent: 0 };
    
    // Top 20%
    let k = Math.max(1, Math.ceil(sorted.length * 0.2));
    let topKTraffic = 0;
    for (let i = 0; i < k; i++) topKTraffic += sorted[i][trafficProperty];
    
    return {
        percent: ((topKTraffic / totalTraffic) * 100).toFixed(1),
        kPercent: ((k / sorted.length) * 100).toFixed(1)
    };
}

let isSimTrafficView = false;
document.getElementById('btnRealIPs')?.addEventListener('click', (e) => {
    isSimTrafficView = false;
    e.target.classList.add('active');
    document.getElementById('btnSimIPs').classList.remove('active');
    updateAnalyticsDashboard();
});
document.getElementById('btnSimIPs')?.addEventListener('click', (e) => {
    isSimTrafficView = true;
    e.target.classList.add('active');
    document.getElementById('btnRealIPs').classList.remove('active');
    updateAnalyticsDashboard();
});

document.getElementById('academicModeToggle')?.addEventListener('change', () => {
    updateAnalyticsDashboard();
});

function generateInsights(isAcademic) {
    const panel = document.getElementById('insightsPanel');
    if (splayTree.opCount === 0 || bst.opCount === 0) {
        panel.innerHTML = '<p class="text-muted">Run a simulation or perform operations to generate insights.</p>';
        return;
    }

    const splayAvg = splayTree.totalCost / splayTree.opCount;
    const bstAvg = bst.totalCost / bst.opCount;
    const hitRate = (splayTree.rootHits / Math.max(1, splayTree.searchCount)) * 100;
    const reduction = ((bstAvg - splayAvg) / bstAvg * 100).toFixed(1);
    
    const trafficProp = isSimTrafficView ? 'simSearchFrequency' : 'realSearchFrequency';
    const locality = getTopKLocalityScore(Array.from(ipStore.values()), trafficProp);

    let html = '';
    
    if (isAcademic) {
        // Academic Mode
        html = `
            <div style="font-size: 0.9rem; line-height: 1.5; color: var(--text-muted);">
                <p style="margin-bottom: 0.5rem;"><strong style="color: var(--primary);">Amortized Complexity:</strong> The Splay Tree demonstrated an amortized cost reduction of <strong>${reduction > 0 ? reduction + '%' : '0%'}</strong> compared to the standard BST. This validates the $O(\\log n)$ amortized bound.</p>
                <p style="margin-bottom: 0.5rem;"><strong style="color: var(--primary);">Temporal Locality:</strong> With a root hit rate of <strong>${hitRate.toFixed(1)}%</strong>, the splaying heuristic successfully maintained frequently accessed elements near the root, optimizing for skewed access patterns.</p>
                <p><strong style="color: var(--primary);">Adaptive Balancing:</strong> ${locality.percent && locality.percent > 50 ? `The access distribution was highly skewed (Top ${locality.kPercent}% of IPs received ${locality.percent}% of traffic). Splay dynamically restructured to serve this hotspot efficiently.` : 'The workload was relatively uniform, requiring more structural rotations, yet Splay maintained competitive bounds.'}</p>
            </div>
        `;
    } else {
        // Beginner Mode
        html = `
            <div style="font-size: 0.95rem; line-height: 1.5; color: var(--text-muted);">
                <p style="margin-bottom: 0.5rem;"><strong>Splay Tree vs BST:</strong> By automatically moving recently searched IPs to the top, the Splay Tree reduced the average search cost by <strong>${reduction > 0 ? reduction + '%' : '0%'}</strong>!</p>
                <p style="margin-bottom: 0.5rem;"><strong>Quick Access:</strong> <strong>${hitRate.toFixed(1)}%</strong> of the time, the IP you searched for was already right at the top of the tree, taking only 1 step to find.</p>
                <p><strong>Workload Pattern:</strong> ${locality.percent && locality.percent > 50 ? `Your searches were very focused on a few IPs (Top ${locality.kPercent}% got ${locality.percent}% of searches). Splay is perfect for this "Hotspot" pattern.` : 'Your searches were spread out randomly. Splay still managed to keep up by constantly adjusting its shape.'}</p>
            </div>
        `;
    }
    panel.innerHTML = html;
}

function updateAnalyticsDashboard() {
    if (document.getElementById('tab-analytics').style.display !== 'flex') return;

    // 1. Comparative Bars
    const maxPossCost = Math.max(splayTree.maxCost, bst.maxCost, avl.maxCost, 1);
    const renderBar = (id, sVal, bVal, aVal, maxVal, isPercent = false) => {
        const el = document.getElementById(id);
        if (!el) return;
        
        const sW = (sVal / maxVal) * 100;
        const bW = (bVal / maxVal) * 100;
        const aW = (aVal / maxVal) * 100;
        
        const fmt = (v) => isPercent ? v.toFixed(1) + '%' : (Number.isInteger(v) ? v : v.toFixed(2));
        
        el.innerHTML = `
            <div class="comp-bar-row"><div class="comp-bar-name">Splay</div><div class="comp-bar-track"><div class="comp-bar-fill splay" style="width: ${sW}%"></div></div><div class="comp-bar-val">${fmt(sVal)}</div></div>
            <div class="comp-bar-row"><div class="comp-bar-name">BST</div><div class="comp-bar-track"><div class="comp-bar-fill bst" style="width: ${bW}%"></div></div><div class="comp-bar-val">${fmt(bVal)}</div></div>
            <div class="comp-bar-row"><div class="comp-bar-name">AVL</div><div class="comp-bar-track"><div class="comp-bar-fill avl" style="width: ${aW}%"></div></div><div class="comp-bar-val">${fmt(aVal)}</div></div>
        `;
    };

    const sAvg = splayTree.opCount ? splayTree.totalCost / splayTree.opCount : 0;
    const bAvg = bst.opCount ? bst.totalCost / bst.opCount : 0;
    const aAvg = avl.opCount ? avl.totalCost / avl.opCount : 0;
    const maxAvg = Math.max(sAvg, bAvg, aAvg, 1);
    
    renderBar('bar-avg-cost', sAvg, bAvg, aAvg, maxAvg);
    renderBar('bar-max-cost', splayTree.maxCost, bst.maxCost, avl.maxCost, maxPossCost);
    
    // Depth (using calculateHeight as approximation for this simplified view)
    const sDepth = calculateHeight(splayTree.root);
    const bDepth = calculateHeight(bst.root);
    const aDepth = calculateHeight(avl.root);
    const maxDepth = Math.max(sDepth, bDepth, aDepth, 1);
    renderBar('bar-avg-depth', sDepth, bDepth, aDepth, maxDepth);
    
    // Root hits (Splay only, others 0)
    const sHitRate = splayTree.searchCount ? (splayTree.rootHits / splayTree.searchCount) * 100 : 0;
    renderBar('bar-root-hits', sHitRate, 0, 0, 100, true);

    // 2. Tree Health Metrics
    const isAcademic = document.getElementById('academicModeToggle')?.checked;
    
    const trafficProp = isSimTrafficView ? 'simSearchFrequency' : 'realSearchFrequency';
    const locality = getTopKLocalityScore(Array.from(ipStore.values()), trafficProp);
    document.getElementById('healthLocality').textContent = locality.percent ? `${locality.percent}%` : '-';
    
    // Balance Score = optimal height / actual height
    const n = countNodes(splayTree.root);
    const optH = n > 0 ? Math.max(1, Math.floor(Math.log2(n)) + 1) : 1;
    const balScore = ((optH / Math.max(1, sDepth)) * 100).toFixed(0);
    document.getElementById('healthBalance').textContent = sDepth > 0 ? `${balScore}%` : '-';
    
    const adaptScore = splayTree.searchCount ? (((splayTree.rootHits * 2) + splayTree.searchCount) / (splayTree.searchCount * 3) * 100).toFixed(0) : 0;
    document.getElementById('healthAdaptive').textContent = adaptScore > 0 ? `${adaptScore}%` : '-';

    // 3. Top IPs
    renderTopIPsDashboard();
    
    // 4. Insights
    generateInsights(isAcademic);
    
    // Graph is updated live via updateCostData already, but we ensure it's sized right
    drawGraph();
}

function renderTopIPsDashboard() {
    const container = document.getElementById('topIpsContainer');
    if (!container) return;
    
    const trafficProp = isSimTrafficView ? 'simSearchFrequency' : 'realSearchFrequency';
    const ips = Array.from(ipStore.values());
    
    let sorted = ips.filter(a => a[trafficProp] > 0).sort((a,b) => b[trafficProp] - a[trafficProp]).slice(0, 5);
    
    if (sorted.length === 0) {
        container.innerHTML = '<p class="text-muted">No data available for this view.</p>';
        return;
    }
    
    const maxTraffic = sorted[0][trafficProp];
    
    let html = '';
    sorted.forEach(item => {
        const width = (item[trafficProp] / maxTraffic) * 100;
        html += `
            <div class="top-ip-row">
                <div class="top-ip-label" title="${item.ip}">${formatIP(item.ip)}</div>
                <div class="top-ip-track"><div class="top-ip-fill" style="width: ${width}%"></div></div>
                <div class="top-ip-val">${item[trafficProp]}</div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function renderSnapshotsTimeline() {
    const container = document.getElementById('snapshotsContainer');
    if (!container) return;
    
    if (treeSnapshots.length === 0) {
        container.innerHTML = '<div class="text-muted" style="padding: 2rem; text-align: center;">Run a simulation to capture snapshots.</div>';
        return;
    }
    
    // Render
    let html = '';
    treeSnapshots.forEach((snap, idx) => {
        html += `
            <div class="snapshot-card">
                <div class="snapshot-title">Op ${snap.opCount}</div>
                <svg id="snap-svg-${idx}" class="snapshot-svg"></svg>
            </div>
        `;
    });
    container.innerHTML = html;
    
    // Wait for DOM to insert SVGs, then draw
    setTimeout(() => {
        treeSnapshots.forEach((snap, idx) => {
            const svg = document.getElementById(`snap-svg-${idx}`);
            if (svg && snap.root) {
                drawMiniTree(snap.root, svg);
            }
        });
    }, 50);
}

function drawMiniTree(node, svg) {
    const w = 130;
    const miniSpacing = 20;
    const miniRadius = 5;
    
    function assignCoords(n, depth, xMin, xMax) {
        if (!n) return;
        n.mx = (xMin + xMax) / 2;
        n.my = 15 + depth * miniSpacing;
        if (n.left) assignCoords(n.left, depth + 1, xMin, n.mx);
        if (n.right) assignCoords(n.right, depth + 1, n.mx, xMax);
    }
    
    function drawE(n) {
        if (!n) return;
        if (n.left) {
            const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            l.setAttribute('x1', n.mx); l.setAttribute('y1', n.my);
            l.setAttribute('x2', n.left.mx); l.setAttribute('y2', n.left.my);
            l.setAttribute('stroke', 'rgba(255,255,255,0.2)');
            svg.appendChild(l);
            drawE(n.left);
        }
        if (n.right) {
            const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            l.setAttribute('x1', n.mx); l.setAttribute('y1', n.my);
            l.setAttribute('x2', n.right.mx); l.setAttribute('y2', n.right.my);
            l.setAttribute('stroke', 'rgba(255,255,255,0.2)');
            svg.appendChild(l);
            drawE(n.right);
        }
    }
    
    function drawN(n, isRoot) {
        if (!n) return;
        const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        c.setAttribute('cx', n.mx);
        c.setAttribute('cy', n.my);
        c.setAttribute('r', miniRadius);
        c.setAttribute('fill', isRoot ? '#6366f1' : '#334155');
        if (isRoot) {
            c.setAttribute('stroke', 'white');
            c.setAttribute('stroke-width', '1');
        }
        svg.appendChild(c);
        drawN(n.left, false);
        drawN(n.right, false);
    }
    
    assignCoords(node, 0, 10, w - 10);
    drawE(node);
    drawN(node, true);
}
