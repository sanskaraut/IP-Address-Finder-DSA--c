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
    }

    cloneTree(node) {
        if (!node) return null;
        const newNode = new Node(node.value, node.ip);
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

    insert(value, ip) {
        this.steps = [];
        this.cost = 0;
        if (!this.root) {
            this.root = new Node(value, ip);
            this.recordStep(this.root, "Initial Insert", value);
            return;
        }
        this.root = this.splay(this.root, value);
        this.totalCost += this.cost;
        this.maxCost = Math.max(this.maxCost, this.cost);
        this.opCount++;
        
        if (this.root.value === value) return;
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
        this.recordStep(this.root, "Final Position", value);
    }

    search(value) {
        this.steps = [];
        this.cost = 0;
        if (!this.root) return null;
        this.recordStep(this.root, "Before Search", value);
        this.root = this.splay(this.root, value);
        this.totalCost += this.cost;
        this.maxCost = Math.max(this.maxCost, this.cost);
        this.opCount++;
        this.searchCount++;
        
        const found = this.root && this.root.value === value;
        if (found && this.root.value === value) {
            // Splay already brought it to root, but let's check if it was root BEFORE splay?
            // Actually splay tree logic: if it's searched, it becomes root.
            // A root hit in splay tree terms often means cost was minimal.
            if (this.cost <= 1) this.rootHits++;
        }
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
    for (const key of sequence) {
        // Apply to all trees
        splayTree.search(key);
        bst.search(key);
        avl.search(key);

        totals.splay += splayTree.cost;
        totals.bst += bst.cost;
        totals.avl += avl.cost;

        // Record history and draw graph (but don't animate tree to stay fast)
        updateCostData();
        
        // Small delay to keep UI responsive but fast
        if (sequence.indexOf(key) % 5 === 0) {
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
        return;
    }
    
    // 1. Update ipStore
    ipStore.set(key, { ip, dataPacket: packet, isBlacklisted: false, isWhitelisted: false });
    
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
        updateStatus(`Found ${ip} in network.`);
    } else {
        updateStatus(`${ip} not found.`);
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
    renderIPTable();
    renderAll();
    updateStatus('All data reset.');
});

document.getElementById('hotspotBtn').addEventListener('click', () => runSimulation('Hotspot'));
document.getElementById('randomBtn').addEventListener('click', () => runSimulation('Random'));
document.getElementById('seqBtn').addEventListener('click', () => runSimulation('Sequential'));

treeSelect.addEventListener('change', updateUILayout);
compareMode.addEventListener('change', updateUILayout);
window.addEventListener('resize', renderAll);

// Initial state
updateUILayout();
renderIPTable();
