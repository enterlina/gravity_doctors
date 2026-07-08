# Google News CLI

A simple and elegant command-line interface (CLI) tool written in Node.js to fetch and read the latest news headlines from Google News.

## Prerequisites

- [Node.js](https://nodejs.org/) (version 18.0.0 or higher)

## Installation

1. Navigate to the project directory:
   ```bash
   cd /Users/elenadalbonidarocha/Documents/gravity_doctors
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

## Usage

Run the tool using `node`:

```bash
# Fetch and display the top stories (default is 10 stories)
node index.js

# Limit the number of stories displayed (e.g., show only 5 stories)
node index.js --limit 5

# Search for stories about a specific topic (e.g., "AI startups")
node index.js --search "AI startups"

# Disable color output (if needed for scripts or simple logs)
node index.js --no-color

# View the CLI help menu
node index.js --help
```

### Global Installation (Optional)

You can link this package globally to run it from anywhere on your system as `google-news`:

```bash
npm link
```

After linking, you can run:
```bash
google-news --search "artificial intelligence"
```
