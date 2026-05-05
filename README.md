# IP Address Finder & Network Manager (DSA)

A robust console-based application implemented in C that manages a network of IP addresses using a **Splay Tree** data structure. This project demonstrates the application of self-adjusting binary search trees in network management scenarios.

## 🚀 Key Features

- **Splay Tree Implementation**: Uses splaying logic (rotations) to move frequently and recently accessed IPs to the root of the tree, optimizing search times for repeated queries.
- **IP Management**:
  - Insert, Delete, and Search IP addresses.
  - Custom IP Prefix validation (e.g., `192.168.1.`).
  - Associate and update "Data Packet" values for each node.
- **Filtering System**:
  - **Blacklist**: Block or flag specific IP addresses.
  - **Whitelist**: Maintain a list of trusted IP addresses.
  - Automatic cross-list consistency (removes IP from one list if added to the other).
- **Search Analytics**:
  - **Recent Searches**: Tracks the 10 most recently searched IP addresses.
  - **Frequent Searches**: Ranks IPs based on search frequency.
- **Persistence Layer**: Automatically saves and loads data from `ip_data.txt`, `blacklist.txt`, and `whitelist.txt`.
- **Random Generator**: Tool to generate multiple random IP addresses with custom data packet ranges for testing.

## 🛠️ Technical Details

- **Data Structure**: Splay Tree (Binary Search Tree with splaying).
- **Complexity**: $O(\log n)$ amortized time for search, insert, and delete operations.
- **Language**: Standard C (C99/C11).

## 📂 Project Structure

- `test.c`: The core implementation containing tree logic, list management, and the CLI menu.
- `ip_data.txt`: Persistent storage for the IP network tree.
- `blacklist.txt` & `whitelist.txt`: Storage for filtered IP lists.

## 🖥️ How to Run

1. Compile the source code:
   ```bash
   gcc test.c -o ip_finder
   ```
2. Run the executable:
   ```bash
   ./ip_finder
   ```

## 📊 Menu Options

The application provides a comprehensive interface with over 16 options, including:
- Adding/Searching/Deleting IPs.
- Managing Blacklists and Whitelists.
- Viewing tree traversals (Inorder, Preorder, Postorder).
- Generating random test data.
- Viewing search analytics.
