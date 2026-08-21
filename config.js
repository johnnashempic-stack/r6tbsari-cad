// ================================
// BFP / FD MDT Configuration
// ================================
// 1. Create a free account at https://jsonbin.io
// 2. Create a new Private Bin and paste the initial JSON from README
// 3. Replace the two values below with your Bin ID and Master Key

const JSONBIN_BIN_ID = "YOUR_BIN_ID_HERE";          // e.g. "67a1b2c3d4e5f6789012345"
const JSONBIN_API_KEY = "YOUR_MASTER_KEY_HERE";     // e.g. "$2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

// Polling interval in milliseconds (6000 = 6 seconds)
const SYNC_INTERVAL = 6000;

// Default map center (Philippines - Manila area, change if needed)
const MAP_CENTER = [14.5995, 120.9842];
const MAP_ZOOM = 12;
