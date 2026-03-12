#!/bin/bash
# preflight.sh — Verify your environment is ready to build
# Run this before a workshop or if something isn't working.

PASS="✓"
FAIL="✗"
WARN="⚠"
ALL_GOOD=true

echo ""
echo "  Preflight Check"
echo "  Verifying your development environment..."
echo ""

# 1. Node.js
if command -v node &> /dev/null; then
  NODE_VERSION=$(node --version)
  echo "  $PASS  Node.js installed ($NODE_VERSION)"
else
  echo "  $FAIL  Node.js not found — run: bash install.sh"
  ALL_GOOD=false
fi

# 2. npm
if command -v npm &> /dev/null; then
  NPM_VERSION=$(npm --version)
  echo "  $PASS  npm installed ($NPM_VERSION)"
else
  echo "  $FAIL  npm not found — install Node.js first"
  ALL_GOOD=false
fi

# 3. Dependencies installed
if [ -d node_modules ]; then
  echo "  $PASS  Dependencies installed (node_modules/ exists)"
else
  echo "  $FAIL  Dependencies not installed — run: npm install"
  ALL_GOOD=false
fi

# 4. Claude Code installed
if command -v claude &> /dev/null; then
  echo "  $PASS  Claude Code installed"
else
  echo "  $FAIL  Claude Code not found — run: npm install -g @anthropic-ai/claude-code"
  ALL_GOOD=false
fi

# 5. Claude Code authenticated
if command -v claude &> /dev/null; then
  # Try to check auth by running claude with a quick test
  if claude --version &> /dev/null; then
    echo "  $PASS  Claude Code responds"
  else
    echo "  $WARN  Claude Code installed but may not be authenticated"
    echo "         Run: claude (and follow the login prompts)"
  fi
fi

# 6. CLAUDE.md exists
if [ -f CLAUDE.md ]; then
  echo "  $PASS  CLAUDE.md exists"
else
  echo "  $WARN  CLAUDE.md not found — run: bash install.sh (it generates one)"
fi

# 7. Git configured
if git config user.name &> /dev/null && git config user.email &> /dev/null; then
  GIT_NAME=$(git config user.name)
  GIT_EMAIL=$(git config user.email)
  echo "  $PASS  Git configured ($GIT_NAME <$GIT_EMAIL>)"
else
  echo "  $WARN  Git not configured with name/email"
  echo "         Run: git config --global user.name \"Your Name\""
  echo "         Run: git config --global user.email \"you@example.com\""
fi

# 8. Dev server starts (quick test — start and kill)
if [ -f package.json ] && command -v node &> /dev/null && [ -d node_modules ]; then
  # Try to start vite and see if it binds a port
  npx vite --port 3099 &>/dev/null &
  VITE_PID=$!
  sleep 2
  if kill -0 $VITE_PID 2>/dev/null; then
    echo "  $PASS  Dev server starts successfully"
    kill $VITE_PID 2>/dev/null
    wait $VITE_PID 2>/dev/null
  else
    echo "  $FAIL  Dev server failed to start"
    ALL_GOOD=false
  fi
fi

# Summary
echo ""
if [ "$ALL_GOOD" = true ]; then
  echo "  All checks passed. You're ready to build."
else
  echo "  Some checks failed. Fix the issues above and run preflight.sh again."
fi
echo ""
