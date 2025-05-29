#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <stdbool.h>
#include <ctype.h>  // For isdigit function

#define IP_LEN 20
#define MAX_INPUT 100
#define MAX_RECENT_SEARCHES 10  // Maximum number of recent searches to track
#define MAX_IP_VALUE 250  // Maximum value for IP suffix
#define FILE_IP_DATA "ip_data.txt"
#define FILE_BLACKLIST "blacklist.txt"
#define FILE_WHITELIST "whitelist.txt"

// Function to validate IP prefix format (XXX.XXX.X.)
int validateIPPrefix(const char *prefix) {
    int segments = 0;
    int digits_in_segment = 0;
    int i = 0;
    
    // Expected format: XXX.XXX.X.
    while (prefix[i] != '\0') {
        if (isdigit(prefix[i])) {
            digits_in_segment++;
            // Check if any segment has more than 3 digits
            if ((segments == 0 || segments == 1) && digits_in_segment > 3) {
                return 0;  // Invalid format
            }
            if (segments == 2 && digits_in_segment > 1) {
                return 0;  // Invalid format - third segment should be single digit
            }
        } else if (prefix[i] == '.') {
            // Check if we have a valid segment before the dot
            if (digits_in_segment == 0) {
                return 0;  // Invalid format
            }
            segments++;
            digits_in_segment = 0;
        } else {
            return 0;  // Invalid character
        }
        i++;
    }
    
    // Check if we have exactly 3 segments and ending with a dot
    if (segments != 3 || prefix[i-1] != '.') {
        return 0;  // Invalid format
    }
    
    return 1;  // Valid format
}

// IP List node structure for blacklist and whitelist
typedef struct ip_node {
    char ip[IP_LEN];
    struct ip_node *next;
} ip_node;

// Linked list structure for IP lists
typedef struct ip_list {
    ip_node *head;
    int count;
} ip_list;

// Search history node structure
typedef struct search_history_node {
    int ipSuffix;                    // IP suffix
    int count;                       // Number of times searched
    char fullIP[IP_LEN];             // Full IP address
    int dataPacket;                  // Data packet value
    struct search_history_node *next;
} search_history_node;

// Linked list for search history
typedef struct search_history_list {
    search_history_node *head;
    int count;
} search_history_list;

// Global history trackers
search_history_list *recentSearches;     // Most recently searched nodes
search_history_list *frequentSearches;   // Most frequently searched nodes

// Initialize IP list
ip_list* init_ip_list() {
    ip_list *list = malloc(sizeof(ip_list));
    list->head = NULL;
    list->count = 0;
    return list;
}

// Initialize search history list
search_history_list* init_search_history() {
    search_history_list *list = malloc(sizeof(search_history_list));
    list->head = NULL;
    list->count = 0;
    return list;
}

// Global blacklist and whitelist
ip_list *blacklist;
ip_list *whitelist;

typedef struct node
{
    int ipAdd;
    int dataPacket;
    struct node *left;
    struct node *right;
    struct node *parent;
} node;

typedef struct splay_tree
{
    struct node *root;
} splay_tree;

node *new_node(int ipAdd)
{
    node *n = malloc(sizeof(node));
    n->ipAdd = ipAdd;
    n->dataPacket = 0;  // Initialize dataPacket
    n->parent = NULL;
    n->right = NULL;
    n->left = NULL;
    return n;
}

splay_tree *new_splay_tree()
{
    splay_tree *t = malloc(sizeof(splay_tree));
    t->root = NULL;
    return t;
}

node *maximum(splay_tree *t, node *x)
{
    while (x->right != NULL)
        x = x->right;
    return x;
}

void left_rotate(splay_tree *t, node *x)
{
    node *y = x->right;
    x->right = y->left;
    if (y->left != NULL)
    {
        y->left->parent = x;
    }
    y->parent = x->parent;
    if (x->parent == NULL)
    {
        t->root = y;
    }
    else if (x == x->parent->left)
    {
        x->parent->left = y;
    }
    else
    {
        x->parent->right = y;
    }
    y->left = x;
    x->parent = y;
}

void right_rotate(splay_tree *t, node *x)
{
    node *y = x->left;
    x->left = y->right;
    if (y->right != NULL)
    {
        y->right->parent = x;
    }
    y->parent = x->parent;
    if (x->parent == NULL)
    {
        t->root = y;
    }
    else if (x == x->parent->right)
    {
        x->parent->right = y;
    }
    else
    {
        x->parent->left = y;
    }
    y->right = x;
    x->parent = y;
}

void splay(splay_tree *t, node *n)
{
    while (n->parent != NULL)
    {
        if (n->parent == t->root)
        {
            if (n == n->parent->left)
            {
                right_rotate(t, n->parent);
            }
            else
            {
                left_rotate(t, n->parent);
            }
        }
        else
        {
            node *p = n->parent;
            node *g = p->parent;
            if (n->parent->left == n && p->parent->left == p)
            {
                right_rotate(t, g);
                right_rotate(t, p);
            }
            else if (n->parent->right == n && p->parent->right == p)
            {
                left_rotate(t, g);
                left_rotate(t, p);
            }
            else if (n->parent->right == n && p->parent->left == p)
            {
                left_rotate(t, p);
                right_rotate(t, g);
            }
            else if (n->parent->left == n && p->parent->right == p)
            {
                right_rotate(t, p);
                left_rotate(t, g);
            }
        }
    }
}

// Forward declarations for file handling functions
void saveIPToFile(int ipSuffix, int dataPacket, const char *ipPrefix);
void saveIPListToFile(ip_list *list, const char *filename);
void loadIPsFromFile(splay_tree *t, const char *filename, char *ipPrefix);
void loadIPListFromFile(ip_list *list, const char *filename);

void insert(splay_tree *t, node *n)
{
    node *y = NULL;
    node *temp = t->root;
    while (temp != NULL)
    {
        y = temp;
        if (n->ipAdd < temp->ipAdd)
            temp = temp->left;
        else
            temp = temp->right;
    }
    n->parent = y;
    if (y == NULL)
        t->root = n;
    else if (n->ipAdd < y->ipAdd)
        y->left = n;
    else
        y->right = n;
    splay(t, n);
}

// Add search to history lists
void addToSearchHistory(node *n, char *ipPrefix) {
    if (n == NULL) return;
    
    char fullIP[IP_LEN];
    sprintf(fullIP, "%s%d", ipPrefix, n->ipAdd);
    
    // Update frequent searches
    search_history_node *current = frequentSearches->head;
    search_history_node *prev = NULL;
    int found = 0;
    
    // Check if IP already exists in frequent searches
    while (current != NULL) {
        if (current->ipSuffix == n->ipAdd) {
            // Increment count
            current->count++;
            current->dataPacket = n->dataPacket;  // Update data packet value
            found = 1;
            
            // Reposition node if needed (move towards head for higher count)
            if (prev != NULL && current->count > prev->count) {
                // Remove from current position
                prev->next = current->next;
                
                // Find new position
                search_history_node *new_prev = NULL;
                search_history_node *new_pos = frequentSearches->head;
                
                while (new_pos != NULL && new_pos->count >= current->count) {
                    new_prev = new_pos;
                    new_pos = new_pos->next;
                }
                
                // Insert at new position
                if (new_prev == NULL) {
                    // Insert at head
                    current->next = frequentSearches->head;
                    frequentSearches->head = current;
                } else {
                    current->next = new_prev->next;
                    new_prev->next = current;
                }
            }
            break;
        }
        prev = current;
        current = current->next;
    }
    
    // If not found, add to frequent searches
    if (!found) {
        search_history_node *new_node = malloc(sizeof(search_history_node));
        new_node->ipSuffix = n->ipAdd;
        new_node->count = 1;
        new_node->dataPacket = n->dataPacket;
        strcpy(new_node->fullIP, fullIP);
        
        // Insert at correct position based on count
        prev = NULL;
        current = frequentSearches->head;
        
        while (current != NULL && current->count > new_node->count) {
            prev = current;
            current = current->next;
        }
        
        if (prev == NULL) {
            // Insert at head
            new_node->next = frequentSearches->head;
            frequentSearches->head = new_node;
        } else {
            // Insert after prev
            new_node->next = prev->next;
            prev->next = new_node;
        }
        
        frequentSearches->count++;
    }
    
    // Update recent searches (add to front, remove from tail if too many)
    search_history_node *new_recent = malloc(sizeof(search_history_node));
    new_recent->ipSuffix = n->ipAdd;
    new_recent->count = 1;
    new_recent->dataPacket = n->dataPacket;
    strcpy(new_recent->fullIP, fullIP);
    new_recent->next = recentSearches->head;
    recentSearches->head = new_recent;
    
    // Check if we have too many recent searches
    if (recentSearches->count >= MAX_RECENT_SEARCHES) {
        // Remove the last node
        current = recentSearches->head;
        prev = NULL;
        
        for (int i = 0; i < MAX_RECENT_SEARCHES - 1; i++) {
            prev = current;
            current = current->next;
        }
        
        if (prev != NULL) {
            prev->next = NULL;
            free(current);
        }
    } else {
        recentSearches->count++;
    }
}

node *search(splay_tree *t, node *n, int x)
{
    if (n == NULL)
        return NULL;
        
    if (x == n->ipAdd)
    {
        splay(t, n);
        return n;
    }
    else if (x < n->ipAdd && n->left != NULL)
        return search(t, n->left, x);
    else if (x > n->ipAdd && n->right != NULL)
        return search(t, n->right, x);
    else
        return NULL;
}

// Check if IP is in the specified list
int isInList(ip_list *list, const char ip[]) {
    ip_node *current = list->head;
    while (current != NULL) {
        if (strcmp(current->ip, ip) == 0) {
            return 1;
        }
        current = current->next;
    }
    return 0;
}

// Add IP to the specified list using suffix only
void addToList(ip_list *list, const char *ipPrefix, int suffix) {
    char fullIP[IP_LEN];
    sprintf(fullIP, "%s%d", ipPrefix, suffix);
    
    // Don't add if already in the list
    if (isInList(list, fullIP)) {
        printf("IP %s is already in the list\n", fullIP);
        return;
    }
    
    // Create new node
    ip_node *new_ip = malloc(sizeof(ip_node));
    if (new_ip == NULL) {
        fprintf(stderr, "Memory allocation failed\n");
        return;
    }
    
    strcpy(new_ip->ip, fullIP);
    new_ip->next = list->head;
    list->head = new_ip;
    list->count++;
    
    // Determine which file to save to
    const char *filename;
    if (list == blacklist) {
        filename = FILE_BLACKLIST;
    } else if (list == whitelist) {
        filename = FILE_WHITELIST;
    } else {
        return; // Not a list we're tracking
    }
    
    // Save the updated list to file
    saveIPListToFile(list, filename);
    
    printf("Added %s to the list\n", fullIP);
}

// Remove IP from the specified list
void removeFromList(ip_list *list, const char ip[]) {
    ip_node *current = list->head;
    ip_node *prev = NULL;
    
    // Find the node to remove
    while (current != NULL) {
        if (strcmp(current->ip, ip) == 0) {
            // If it's the head node
            if (prev == NULL) {
                list->head = current->next;
            } else {
                prev->next = current->next;
            }
            free(current);
            list->count--;
            
            // Determine which file to save to
            const char *filename;
            if (list == blacklist) {
                filename = FILE_BLACKLIST;
            } else if (list == whitelist) {
                filename = FILE_WHITELIST;
            } else {
                return; // Not a list we're tracking
            }
            
            // Save the updated list to file
            saveIPListToFile(list, filename);
            
            printf("Removed %s from the list\n", ip);
            return;
        }
        prev = current;
        current = current->next;
    }
    printf("IP %s not found in the list\n", ip);
}

// Remove IP from the specified list using suffix only
void removeFromListBySuffix(ip_list *list, const char *ipPrefix, int suffix) {
    char fullIP[IP_LEN];
    sprintf(fullIP, "%s%d", ipPrefix, suffix);
    removeFromList(list, fullIP);
}

// Print all IPs in a list
void printList(ip_list *list, const char *listName) {
    printf("\n%s (%d entries):\n", listName, list->count);
    if (list->head == NULL) {
        printf("  [Empty]\n");
        return;
    }
    
    ip_node *current = list->head;
    while (current != NULL) {
        printf("  %s\n", current->ip);
        current = current->next;
    }
}

// Print recent searches
void printRecentSearches() {
    printf("\nMOST RECENT SEARCHES (%d entries):\n", recentSearches->count);
    if (recentSearches->head == NULL) {
        printf("  [No searches yet]\n");
        return;
    }
    
    search_history_node *current = recentSearches->head;
    int count = 1;
    printf("  [Rank] IP Address -> Data Packet\n");
    while (current != NULL && count <= MAX_RECENT_SEARCHES) {
        printf("  [%2d] %s -> %d\n", count, current->fullIP, current->dataPacket);
        current = current->next;
        count++;
    }
}

// Print frequent searches
void printFrequentSearches() {
    printf("\nMOST FREQUENTLY SEARCHED IPs (%d entries):\n", frequentSearches->count);
    if (frequentSearches->head == NULL) {
        printf("  [No searches yet]\n");
        return;
    }
    
    search_history_node *current = frequentSearches->head;
    int count = 1;
    printf("  [Rank] IP Address -> Data Packet (Search Count)\n");
    while (current != NULL) {
        printf("  [%2d] %s -> %d (searched %d times)\n", 
               count, current->fullIP, current->dataPacket, current->count);
        current = current->next;
        count++;
    }
}

// Free memory used by an IP list
void freeIPList(ip_list *list) {
    ip_node *current = list->head;
    ip_node *next;
    
    while (current != NULL) {
        next = current->next;
        free(current);
        current = next;
    }
    
    free(list);
}

// Free memory used by search history
void freeSearchHistory(search_history_list *list) {
    search_history_node *current = list->head;
    search_history_node *next;
    
    while (current != NULL) {
        next = current->next;
        free(current);
        current = next;
    }
    
    free(list);
}

// Convert node's IP address to full IP string
void getFullIP(char *prefix, int suffix, char *fullIP) {
    sprintf(fullIP, "%s%d", prefix, suffix);
}

// Parse IP to get suffix
int getIPSuffix(const char *ip, const char *prefix) {
    // Check if the IP starts with the prefix
    size_t prefixLen = strlen(prefix);
    if (strncmp(ip, prefix, prefixLen) == 0) {
        // Convert the suffix part to integer
        return atoi(ip + prefixLen);
    }
    return -1; // Invalid IP or doesn't match prefix
}

// Delete a node with the given IP address from the splay tree
node* delete_node(splay_tree *t, int ipAdd) {
    node *temp = search(t, t->root, ipAdd);
    
    // If node not found, return NULL
    if (temp == NULL) {
        return NULL;
    }
    
    splay(t, temp); // Bring the node to be deleted to the root
    
    // If root has no children, just delete the root
    if (temp->left == NULL && temp->right == NULL) {
        t->root = NULL;
        return temp;
    }
    
    // If only right child exists
    if (temp->left == NULL) {
        t->root = temp->right;
        temp->right->parent = NULL;
        return temp;
    }
    
    // If only left child exists
    if (temp->right == NULL) {
        t->root = temp->left;
        temp->left->parent = NULL;
        return temp;
    }
    
    // If both children exist
    node *left_subtree = temp->left;
    node *right_subtree = temp->right;
    
    // Disconnect both subtrees from the node to be deleted
    left_subtree->parent = NULL;
    right_subtree->parent = NULL;
    
    // Find the largest node in the left subtree
    node *max_in_left = maximum(t, left_subtree);
    
    // Splay the maximum node to the root of left subtree
    splay(t, max_in_left);
    
    // Now max_in_left is the root of left subtree
    // Attach right subtree as the right child of max_in_left
    max_in_left->right = right_subtree;
    if (right_subtree != NULL) {
        right_subtree->parent = max_in_left;
    }
    
    // Set the new root
    t->root = max_in_left;
    
    return temp;
}

// Print node info with status
void printNodeInfo(node *n, char *prefix, char *fullIP) {
    // Print status indicators for blacklisted/whitelisted IPs
    if (isInList(blacklist, fullIP)) {
        printf("[X] %s -> %d (BLACKLISTED)\n", fullIP, n->dataPacket);
    } else if (isInList(whitelist, fullIP)) {
        printf("[+] %s -> %d (WHITELISTED)\n", fullIP, n->dataPacket);
    } else {
        printf("[ ] %s -> %d\n", fullIP, n->dataPacket);
    }
}

// Inorder traversal function
void inorder(splay_tree *t, node *n, char *prefix)
{
    if (n != NULL) {
        inorder(t, n->left, prefix);
        
        char fullIP[IP_LEN];
        getFullIP(prefix, n->ipAdd, fullIP);
        printNodeInfo(n, prefix, fullIP);
        
        inorder(t, n->right, prefix);
    }
}

// Preorder traversal function
void preorder(splay_tree *t, node *n, char *prefix)
{
    if (n != NULL) {
        char fullIP[IP_LEN];
        getFullIP(prefix, n->ipAdd, fullIP);
        printNodeInfo(n, prefix, fullIP);
        
        preorder(t, n->left, prefix);
        preorder(t, n->right, prefix);
    }
}

// Postorder traversal function
void postorder(splay_tree *t, node *n, char *prefix)
{
    if (n != NULL) {
        postorder(t, n->left, prefix);
        postorder(t, n->right, prefix);
        
        char fullIP[IP_LEN];
        getFullIP(prefix, n->ipAdd, fullIP);
        printNodeInfo(n, prefix, fullIP);
    }
}

// Save IP to file
void saveIPToFile(int ipSuffix, int dataPacket, const char *ipPrefix) {
    FILE *file = fopen(FILE_IP_DATA, "a");
    if (file == NULL) {
        fprintf(stderr, "Error opening file %s for writing\n", FILE_IP_DATA);
        return;
    }
    
    // Format: ipPrefix ipSuffix dataPacket
    fprintf(file, "%s %d %d\n", ipPrefix, ipSuffix, dataPacket);
    fclose(file);
}

// Save entire tree to file (recursive helper)
void saveTreeToFileHelper(FILE *file, node *n, const char *ipPrefix) {
    if (n != NULL) {
        // Save current node
        fprintf(file, "%s %d %d\n", ipPrefix, n->ipAdd, n->dataPacket);
        
        // Recursively save left and right subtrees
        saveTreeToFileHelper(file, n->left, ipPrefix);
        saveTreeToFileHelper(file, n->right, ipPrefix);
    }
}

// Save entire tree to file
void saveTreeToFile(splay_tree *t, const char *filename, const char *ipPrefix) {
    FILE *file = fopen(filename, "w");
    if (file == NULL) {
        fprintf(stderr, "Error opening file %s for writing\n", filename);
        return;
    }
    
    // Save current IP prefix at the top of the file
    fprintf(file, "PREFIX %s\n", ipPrefix);
    
    // Save all nodes
    saveTreeToFileHelper(file, t->root, ipPrefix);
    
    fclose(file);
    printf("All IP data saved to file %s\n", filename);
}

// Save IP list to file
void saveIPListToFile(ip_list *list, const char *filename) {
    FILE *file = fopen(filename, "w");
    if (file == NULL) {
        fprintf(stderr, "Error opening file %s for writing\n", filename);
        return;
    }
    
    ip_node *current = list->head;
    while (current != NULL) {
        fprintf(file, "%s\n", current->ip);
        current = current->next;
    }
    
    fclose(file);
}

// Load IP data from file
void loadIPsFromFile(splay_tree *t, const char *filename, char *ipPrefix) {
    FILE *file = fopen(filename, "r");
    if (file == NULL) {
        printf("No existing IP data file found. Starting with empty tree.\n");
        return;
    }
    
    char line[MAX_INPUT];
    char filePrefix[IP_LEN];
    int ipSuffix, dataPacket;
    int count = 0;
    
    // Read line by line
    while (fgets(line, sizeof(line), file)) {
        // Check if this is a PREFIX line
        if (strncmp(line, "PREFIX ", 7) == 0) {
            sscanf(line, "PREFIX %s", filePrefix);
            strcpy(ipPrefix, filePrefix);
            printf("Loaded IP prefix: %s\n", ipPrefix);
            continue;
        }
        
        // Parse IP and data packet
        if (sscanf(line, "%s %d %d", filePrefix, &ipSuffix, &dataPacket) == 3) {
            // Create and insert node
            node *newIP = new_node(ipSuffix);
            newIP->dataPacket = dataPacket;
            insert(t, newIP);
            count++;
        }
    }
    
    fclose(file);
    printf("Loaded %d IPs from file %s\n", count, filename);
}

// Load IP list from file
void loadIPListFromFile(ip_list *list, const char *filename) {
    FILE *file = fopen(filename, "r");
    if (file == NULL) {
        printf("No existing file %s found. Starting with empty list.\n", filename);
        return;
    }
    
    char line[MAX_INPUT];
    int count = 0;
    
    // Free any existing list
    ip_node *current = list->head;
    ip_node *next;
    while (current != NULL) {
        next = current->next;
        free(current);
        current = next;
    }
    list->head = NULL;
    list->count = 0;
    
    // Read line by line
    while (fgets(line, sizeof(line), file)) {
        // Remove newline character if present
        size_t len = strlen(line);
        if (len > 0 && line[len-1] == '\n') {
            line[len-1] = '\0';
        }
        
        // Create new node
        ip_node *new_ip = malloc(sizeof(ip_node));
        if (new_ip == NULL) {
            fprintf(stderr, "Memory allocation failed\n");
            continue;
        }
        
        strcpy(new_ip->ip, line);
        new_ip->next = list->head;
        list->head = new_ip;
        list->count++;
        count++;
    }
    
    fclose(file);
    printf("Loaded %d IPs from file %s\n", count, filename);
}

// Count nodes in tree
int countNodes(node *root) {
    if (root == NULL) return 0;
    return 1 + countNodes(root->left) + countNodes(root->right);
}

// Free the tree memory recursively
void freeTree(node *root) {
    if (root == NULL) return;
    
    freeTree(root->left);
    freeTree(root->right);
    free(root);
}

// Clear screen function for better UI
void clearScreen() {
    #ifdef _WIN32
        system("cls");
    #else
        system("clear");
    #endif
}

// Function to show the main menu
void showMenu() {
    printf("\n=== IP Address Management System ===\n");
    printf("1. Add IP to Network Tree\n");
    printf("2. Remove IP from Network Tree\n");
    printf("3. Update IP Data Packet\n");
    printf("4. Add IP to Blacklist\n");
    printf("5. Add IP to Whitelist\n");
    printf("6. Remove IP from Blacklist\n");
    printf("7. Remove IP from Whitelist\n");
    printf("8. View Network Tree\n");
    printf("9. View Blacklist\n");
    printf("10. View Whitelist\n");
    printf("11. Set IP Prefix\n");
    printf("12. Generate Random IPs\n");
    printf("13. Search IP\n");
    printf("14. View Recent Searches\n");
    printf("15. View Most Frequently Searched IPs\n");
    printf("16. Save All Data to Files\n");
    printf("0. Exit\n");
    printf("Choice: ");
}

// Function to show tree view submenu
void showTreeViewMenu() {
    printf("\n--- Tree View Options ---\n");
    printf("1. Inorder Traversal\n");
    printf("2. Preorder Traversal\n");
    printf("3. Postorder Traversal\n");
    printf("Choice: ");
}

// Function to flush stdin
void flushStdin() {
    int c;
    while ((c = getchar()) != '\n' && c != EOF);
}

int main()
{
    // Initialize blacklist and whitelist
    blacklist = init_ip_list();
    whitelist = init_ip_list();
    
    // Initialize search history trackers
    recentSearches = init_search_history();
    frequentSearches = init_search_history();
    
    splay_tree *t = new_splay_tree();
    
    // Default IP prefix
    char ipPrefix[IP_LEN] = "192.168.3.";
    
    // Load data from files
    loadIPsFromFile(t, FILE_IP_DATA, ipPrefix);
    loadIPListFromFile(blacklist, FILE_BLACKLIST);
    loadIPListFromFile(whitelist, FILE_WHITELIST);
    
    int choice, running = 1;
    while (running) {
        clearScreen();
        showMenu();
        scanf("%d", &choice);
        flushStdin();
        
        switch (choice) {
            case 1: { // Add IP to Network Tree
                int ipSuffix, dataPacket;
                printf("\nEnter IP suffix (Last part of %s): ", ipPrefix);
                scanf("%d", &ipSuffix);
                flushStdin();
                
                // Validate IP suffix
                if (ipSuffix < 0 || ipSuffix > MAX_IP_VALUE) {
                    printf("Invalid IP suffix. Must be between 0 and %d.\n", MAX_IP_VALUE);
                    break;
                }
                
                // Check if IP already exists
                node *existingNode = search(t, t->root, ipSuffix);
                if (existingNode != NULL) {
                    printf("IP %s%d already exists with data packet: %d\n", 
                            ipPrefix, ipSuffix, existingNode->dataPacket);
                    printf("Use update option to change data packet value.\n");
                    break;
                }
                
                printf("Enter data packet value: ");
                scanf("%d", &dataPacket);
                flushStdin();
                
                node *n = new_node(ipSuffix);
                n->dataPacket = dataPacket;
                insert(t, n);
                
                char fullIP[IP_LEN];
                getFullIP(ipPrefix, ipSuffix, fullIP);
                printf("Added IP: %s with data packet: %d\n", fullIP, dataPacket);
                
                // Save IP to file
                saveIPToFile(ipSuffix, dataPacket, ipPrefix);
                break;
            }
            case 2: { // Remove IP from Network Tree
                int ipSuffix;
                printf("\nEnter IP suffix to remove (Last part of %s): ", ipPrefix);
                scanf("%d", &ipSuffix);
                flushStdin();
                
                // Check if IP exists
                node *existingNode = search(t, t->root, ipSuffix);
                if (existingNode == NULL) {
                    printf("IP %s%d not found in the network tree.\n", ipPrefix, ipSuffix);
                    break;
                }
                
                // Remove the node
                node *removedNode = delete_node(t, ipSuffix);
                if (removedNode != NULL) {
                    printf("Removed IP %s%d with data packet: %d\n", 
                           ipPrefix, ipSuffix, removedNode->dataPacket);
                    free(removedNode);
                    
                    // Save the updated tree to file
                    saveTreeToFile(t, FILE_IP_DATA, ipPrefix);
                } else {
                    printf("Failed to remove IP %s%d\n", ipPrefix, ipSuffix);
                }
                break;
            }
            case 3: { // Update IP Data Packet
                int ipSuffix, newDataPacket;
                printf("\nEnter IP suffix to update (Last part of %s): ", ipPrefix);
                scanf("%d", &ipSuffix);
                flushStdin();
                
                // Check if IP exists
                node *existingNode = search(t, t->root, ipSuffix);
                if (existingNode == NULL) {
                    printf("IP %s%d not found in the network tree.\n", ipPrefix, ipSuffix);
                    break;
                }
                
                printf("Current data packet value: %d\n", existingNode->dataPacket);
                printf("Enter new data packet value: ");
                scanf("%d", &newDataPacket);
                flushStdin();
                
                // Update the data packet
                existingNode->dataPacket = newDataPacket;
                
                printf("Updated IP %s%d with new data packet: %d\n", 
                       ipPrefix, ipSuffix, newDataPacket);
                
                // Add to search history
                addToSearchHistory(existingNode, ipPrefix);
                
                // Save the updated tree to file
                saveTreeToFile(t, FILE_IP_DATA, ipPrefix);
                break;
            }
            case 4: { // Add IP to Blacklist
                int ipSuffix;
                printf("\nEnter IP suffix to blacklist (Last part of %s): ", ipPrefix);
                scanf("%d", &ipSuffix);
                flushStdin();
                
                // Check if the IP exists in the tree
                node *existingNode = search(t, t->root, ipSuffix);
                if (existingNode == NULL) {
                    printf("Warning: IP %s%d not found in the network tree.\n", ipPrefix, ipSuffix);
                    printf("Do you still want to add it to blacklist? (y/n): ");
                    char confirm;
                    scanf("%c", &confirm);
                    flushStdin();
                    
                    if (confirm != 'y' && confirm != 'Y') {
                        printf("Operation cancelled.\n");
                        break;
                    }
                }
                
                // Add to blacklist
                addToList(blacklist, ipPrefix, ipSuffix);
                
                // Check if it's in whitelist and remove it if necessary
                char fullIP[IP_LEN];
                getFullIP(ipPrefix, ipSuffix, fullIP);
                if (isInList(whitelist, fullIP)) {
                    printf("IP %s was in whitelist. Removing from whitelist.\n", fullIP);
                    removeFromList(whitelist, fullIP);
                }
                break;
            }
            case 5: { // Add IP to Whitelist
                int ipSuffix;
                printf("\nEnter IP suffix to whitelist (Last part of %s): ", ipPrefix);
                scanf("%d", &ipSuffix);
                flushStdin();
                
                // Check if the IP exists in the tree
                node *existingNode = search(t, t->root, ipSuffix);
                if (existingNode == NULL) {
                    printf("Warning: IP %s%d not found in the network tree.\n", ipPrefix, ipSuffix);
                    printf("Do you still want to add it to whitelist? (y/n): ");
                    char confirm;
                    scanf("%c", &confirm);
                    flushStdin();
                    
                    if (confirm != 'y' && confirm != 'Y') {
                        printf("Operation cancelled.\n");
                        break;
                    }
                }
                
                // Add to whitelist
                addToList(whitelist, ipPrefix, ipSuffix);
                
                // Check if it's in blacklist and remove it if necessary
                char fullIP[IP_LEN];
                getFullIP(ipPrefix, ipSuffix, fullIP);
                if (isInList(blacklist, fullIP)) {
                    printf("IP %s was in blacklist. Removing from blacklist.\n", fullIP);
                    removeFromList(blacklist, fullIP);
                }
                break;
            }
            case 6: { // Remove IP from Blacklist
                int ipSuffix;
                printf("\nEnter IP suffix to remove from blacklist (Last part of %s): ", ipPrefix);
                scanf("%d", &ipSuffix);
                flushStdin();
                
                removeFromListBySuffix(blacklist, ipPrefix, ipSuffix);
                break;
            }
            case 7: { // Remove IP from Whitelist
                int ipSuffix;
                printf("\nEnter IP suffix to remove from whitelist (Last part of %s): ", ipPrefix);
                scanf("%d", &ipSuffix);
                flushStdin();
                
                removeFromListBySuffix(whitelist, ipPrefix, ipSuffix);
                break;
            }
            case 8: { // View Network Tree
                int treeNodes = countNodes(t->root);
                printf("\nNetwork Tree contains %d nodes with IP prefix %s\n", treeNodes, ipPrefix);
                
                if (treeNodes > 0) {
                    int viewChoice;
                    showTreeViewMenu();
                    scanf("%d", &viewChoice);
                    flushStdin();
                    
                    switch (viewChoice) {
                        case 1:
                            printf("\nInorder Traversal (sorted by IP):\n");
                            inorder(t, t->root, ipPrefix);
                            break;
                        case 2:
                            printf("\nPreorder Traversal:\n");
                            preorder(t, t->root, ipPrefix);
                            break;
                        case 3:
                            printf("\nPostorder Traversal:\n");
                            postorder(t, t->root, ipPrefix);
                            break;
                        default:
                            printf("Invalid choice. Showing inorder traversal.\n");
                            inorder(t, t->root, ipPrefix);
                    }
                } else {
                    printf("Network Tree is empty. No IPs to display.\n");
                }
                break;
            }
            case 9: { // View Blacklist
                printList(blacklist, "BLACKLIST");
                break;
            }
            case 10: { // View Whitelist
                printList(whitelist, "WHITELIST");
                break;
            }
            case 11: { // Set IP Prefix
                printf("\nCurrent IP prefix: %s\n", ipPrefix);
                printf("Enter new IP prefix (format XXX.XXX.X.): ");
                char newPrefix[IP_LEN];
                fgets(newPrefix, IP_LEN, stdin);
                
                // Remove newline character if present
                size_t len = strlen(newPrefix);
                if (len > 0 && newPrefix[len-1] == '\n') {
                    newPrefix[len-1] = '\0';
                }
                
                // Validate the new prefix
                if (validateIPPrefix(newPrefix)) {
                    printf("Changing IP prefix from %s to %s\n", ipPrefix, newPrefix);
                    printf("This will affect all future operations but will not modify existing data.\n");
                    printf("Do you want to continue? (y/n): ");
                    char confirm;
                    scanf("%c", &confirm);
                    flushStdin();
                    
                    if (confirm == 'y' || confirm == 'Y') {
                        strcpy(ipPrefix, newPrefix);
                        printf("IP prefix changed successfully to %s\n", ipPrefix);
                    } else {
                        printf("Operation cancelled. IP prefix remains %s\n", ipPrefix);
                    }
                } else {
                    printf("Invalid IP prefix format. Must be in format XXX.XXX.X.\n");
                    printf("Example: 192.168.1.\n");
                }
                break;
            }
            case 12: { // Generate Random IPs
                int count, minDataPacket, maxDataPacket;
                printf("\nHow many random IPs to generate? ");
                scanf("%d", &count);
                flushStdin();
                
                if (count <= 0 || count > 100) {
                    printf("Invalid count. Please enter a number between 1 and 100.\n");
                    break;
                }
                
                printf("Enter minimum data packet value: ");
                scanf("%d", &minDataPacket);
                flushStdin();
                
                printf("Enter maximum data packet value: ");
                scanf("%d", &maxDataPacket);
                flushStdin();
                
                if (minDataPacket > maxDataPacket) {
                    printf("Minimum value cannot be greater than maximum value.\n");
                    break;
                }
                
                // Seed the random number generator
                srand(time(NULL));
                
                printf("\nGenerating %d random IPs with prefix %s...\n", count, ipPrefix);
                for (int i = 0; i < count; i++) {
                    int randomSuffix = rand() % (MAX_IP_VALUE + 1); // 0 to MAX_IP_VALUE
                    int randomDataPacket = minDataPacket + rand() % (maxDataPacket - minDataPacket + 1);
                    
                    // Check if this IP already exists
                    node *existingNode = search(t, t->root, randomSuffix);
                    if (existingNode != NULL) {
                        printf("IP %s%d already exists. Skipping.\n", ipPrefix, randomSuffix);
                        continue;
                    }
                    
                    // Create and insert new node
                    node *n = new_node(randomSuffix);
                    n->dataPacket = randomDataPacket;
                    insert(t, n);
                    
                    char fullIP[IP_LEN];
                    getFullIP(ipPrefix, randomSuffix, fullIP);
                    printf("Added random IP: %s with data packet: %d\n", fullIP, randomDataPacket);
                    
                    // Save IP to file
                    saveIPToFile(randomSuffix, randomDataPacket, ipPrefix);
                }
                break;
            }
            case 13: { // Search IP
                printf("Enter the last part of the IP address to search: ");
                int suffix;
                if (scanf("%d", &suffix) != 1) {
                    printf("Invalid input. Please enter a number.\n");
                    flushStdin();
                    break;
                }
                flushStdin();
                
                node *found = search(t, t->root, suffix);
                if (found != NULL) {
                    char fullIP[IP_LEN];
                    getFullIP(ipPrefix, suffix, fullIP);
                    
                    printf("\nIP FOUND!\n");
                    printNodeInfo(found, ipPrefix, fullIP);
                    
                    // Add to search history
                    addToSearchHistory(found, ipPrefix);
                    
                    // Display that the node is now at the root
                    printf("\nNode with IP %s%d is now at the root of the tree.\n", ipPrefix, suffix);
                    
                    // Perform preorder traversal to show the updated tree structure
                    printf("\nPreorder traversal after splaying:\n");
                    preorder(t, t->root, ipPrefix);
                } else {
                    printf("IP %s%d not found in the tree\n", ipPrefix, suffix);
                }
                break;
            }
            case 14: { // View Recent Searches
                printRecentSearches();
                break;
            }
            case 15: { // View Most Frequently Searched IPs
                printFrequentSearches();
                break;
            }
            case 16: { // Save All Data to Files
                saveTreeToFile(t, FILE_IP_DATA, ipPrefix);
                saveIPListToFile(blacklist, FILE_BLACKLIST);
                saveIPListToFile(whitelist, FILE_WHITELIST);
                printf("All data saved to files successfully.\n");
                break;
            }
            case 0: { // Exit
                printf("\nExiting program...\n");
                printf("Saving data to files...\n");
                saveTreeToFile(t, FILE_IP_DATA, ipPrefix);
                saveIPListToFile(blacklist, FILE_BLACKLIST);
                saveIPListToFile(whitelist, FILE_WHITELIST);
                running = 0;
                break;
            }
            default:
                printf("Invalid choice. Please try again.\n");
        }
        
        if (running) {
            printf("\nPress Enter to continue...");
            getchar();
        }
    }
    
    // Clean up memory
    freeTree(t->root);
    free(t);
    freeIPList(blacklist);
    freeIPList(whitelist);
    freeSearchHistory(recentSearches);
    freeSearchHistory(frequentSearches);
    
    return 0;
}