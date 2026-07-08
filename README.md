# Gravity Doctors Project Suite

This repository contains two main tools:

1. **BigQuery Release Notes Explorer** (Python Flask Web App) - A modern, dark-themed dashboard to search, filter, and share Google Cloud BigQuery release updates.
2. **Google News CLI** (Node.js Command Line Interface) - An elegant terminal tool to fetch and query Google News headlines.

---

## 🌐 1. BigQuery Release Notes Explorer (Flask Web App)

A web interface that parses the official Google Cloud BigQuery RSS feed, segments daily updates, normalizes category colors, and integrates with Twitter/X for easy sharing.

### Prerequisites

- Python 3.10 or higher
- Flask and BeautifulSoup4 (`pip install flask beautifulsoup4`)

### Installation & Run

1. Navigate to the project root directory:
   ```bash
   cd /Users/elenadalbonidarocha/Documents/gravity_doctors
   ```
2. Start the Flask application server:
   ```bash
   python3 agy-cli-projects/app.py
   ```
3. Open your browser and go to:
   **[http://127.0.0.1:5001](http://127.0.0.1:5001)**

### Features
- **Categorization & Mapping:** Raw XML feed update types are normalized to match frontend themes (`Update`, `Deprecation`, `Announcement`, `Feature`, `Issue`).
- **Interactive Filtering:** Instant client-side filters by category.
- **Visual Tweet Composer:** Slide-out drawer with a character counter conforming to Twitter's URL-length rules.
- **Skeleton Loaders & Spinner:** Smooth UI transitions and async refresh.

---

## 💻 2. Google News CLI (Node.js Command Line Utility)

A quick-access command-line tool to query top news stories and specific topics from Google News directly inside your terminal.

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18.0.0 or higher)

### Installation

1. Install package dependencies:
   ```bash
   npm install
   ```

### Usage

Run the script using `node`:

```bash
# Fetch and display the top stories (default is 10 stories)
node index.js

# Limit the number of stories displayed
node index.js --limit 5

# Search for stories about a specific topic
node index.js --search "AI startups"

# Disable color output (helpful for scripts or plain text redirects)
node index.js --no-color

# View the CLI help menu
node index.js --help
```

### Global Installation (Optional)

Link this package globally to run it from anywhere in your shell as `google-news`:

```bash
npm link
```

After linking, you can run:
```bash
google-news --search "artificial intelligence"
```
