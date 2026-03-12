#!/bin/bash
# make-it-mine.sh — Transform this scaffold into your project
# Run this once after cloning to personalize the project and configure your AI agent.

set -e

echo ""
echo "  Make It Mine"
echo "  Turn this scaffold into your project."
echo ""

# ── Project Name ──────────────────────────────────────────

read -p "  Project name (e.g., my-cool-app): " PROJECT_NAME

if [ -z "$PROJECT_NAME" ]; then
  echo "  No project name provided. Exiting."
  exit 1
fi

# Slugify the name for package.json (lowercase, dashes)
SLUG=$(echo "$PROJECT_NAME" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd 'a-z0-9-')

echo ""
echo "  Setting up: $PROJECT_NAME ($SLUG)"

# 1. Update package.json name
if [ -f package.json ]; then
  node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    pkg.name = '$SLUG';
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
  "
  echo "  Updated package.json name to: $SLUG"
fi

# ── Agent Identity ────────────────────────────────────────

if [ -f CLAUDE.md ]; then
  echo ""
  echo "  Agent Setup"
  echo "  Give your AI assistant a name and personality."
  echo ""

  # Agent name
  read -p "  Agent name (e.g., Atlas, Nova, Kit): " AGENT_NAME
  if [ -z "$AGENT_NAME" ]; then
    AGENT_NAME="Assistant"
  fi

  # Pronouns
  echo ""
  echo "  Pronouns:"
  echo "    1) he/him"
  echo "    2) she/her"
  echo "    3) they/them"
  read -p "  Choose (1-3, default 3): " PRONOUN_CHOICE
  case "$PRONOUN_CHOICE" in
    1) PRONOUNS="he/him" ;;
    2) PRONOUNS="she/her" ;;
    *) PRONOUNS="they/them" ;;
  esac

  # Role
  echo ""
  read -p "  Agent role (e.g., frontend engineer, full-stack developer): " AGENT_ROLE
  if [ -z "$AGENT_ROLE" ]; then
    AGENT_ROLE="developer"
  fi

  # Operator name
  echo ""
  read -p "  Your name (the operator): " OPERATOR_NAME
  if [ -z "$OPERATOR_NAME" ]; then
    OPERATOR_NAME="the operator"
  fi

  # Model for co-authored-by
  echo ""
  echo "  Claude model for commit co-authorship:"
  echo "    1) Claude Opus 4.6"
  echo "    2) Claude Sonnet 4.6"
  echo "    3) Claude Haiku 4.5"
  read -p "  Choose (1-3, default 1): " MODEL_CHOICE
  case "$MODEL_CHOICE" in
    2) MODEL="Claude Sonnet 4.6" ;;
    3) MODEL="Claude Haiku 4.5" ;;
    *) MODEL="Claude Opus 4.6" ;;
  esac

  # Apply replacements using node (cross-platform, handles special characters safely)
  AGENT_NAME="$AGENT_NAME" \
  PRONOUNS="$PRONOUNS" \
  AGENT_ROLE="$AGENT_ROLE" \
  PROJECT_NAME="$PROJECT_NAME" \
  OPERATOR_NAME="$OPERATOR_NAME" \
  MODEL="$MODEL" \
  node -e "
    const fs = require('fs');
    let md = fs.readFileSync('CLAUDE.md', 'utf8');

    const name = process.env.AGENT_NAME;
    const pronouns = process.env.PRONOUNS;
    const role = process.env.AGENT_ROLE;
    const roleTitle = role.replace(/\b\w/g, c => c.toUpperCase());
    const project = process.env.PROJECT_NAME;
    const operator = process.env.OPERATOR_NAME;
    const model = process.env.MODEL;

    md = md.split('[Agent Name]').join(name);
    md = md.split('[he/him | she/her | they/them]').join(pronouns);
    md = md.split('[Role]').join(roleTitle);
    md = md.split('[role]').join(role);
    md = md.split('[project name]').join(project);
    md = md.split('[Operator Name]').join(operator);
    md = md.split('[Model]').join(model);

    fs.writeFileSync('CLAUDE.md', md);
  "

  echo ""
  echo "  Agent configured:"
  echo "    Name:     $AGENT_NAME"
  echo "    Pronouns: $PRONOUNS"
  echo "    Role:     $AGENT_ROLE"
  echo "    Operator: $OPERATOR_NAME"
  echo "    Model:    $MODEL"
  echo ""
  echo "  Open CLAUDE.md to fill in the remaining sections:"
  echo "    - Voice and personality"
  echo "    - Domain responsibilities"
  echo "    - Working style and technical patterns"
  echo "    - Operator preferences"
fi

# ── Git & GitHub ──────────────────────────────────────────

echo ""
read -p "  Reset git history? This gives you a clean start. (y/N): " RESET_GIT

if [ "$RESET_GIT" = "y" ] || [ "$RESET_GIT" = "Y" ]; then
  # Ensure .gitignore exists — dotfiles often get lost when copying repos
  if [ ! -f .gitignore ]; then
    cat > .gitignore << 'GITIGNORE'
node_modules/
dist/
.env
.env.local
.DS_Store
*.log
GITIGNORE
    echo "  Created .gitignore"
  fi
  rm -rf .git
  git init
  git add .
  git commit -m "Initial commit — $PROJECT_NAME, built on Investiture"
  echo "  Fresh git history created"
fi

echo ""
if command -v gh &> /dev/null; then
  # gh exists — check if it's authenticated
  if gh auth status &> /dev/null; then
    read -p "  Create a GitHub repo for $SLUG? (y/N): " CREATE_REPO

    if [ "$CREATE_REPO" = "y" ] || [ "$CREATE_REPO" = "Y" ]; then
      read -p "  Public or private? (public/private): " VISIBILITY
      VISIBILITY=${VISIBILITY:-private}
      gh repo create "$SLUG" --"$VISIBILITY" --source=. --push
      echo "  GitHub repo created and pushed"
    fi
  else
    echo "  GitHub CLI is installed but not authenticated."
    echo "  To connect later, run:  gh auth login"
    echo "  Then:  gh repo create $SLUG --private --source=. --push"
  fi
else
  echo "  GitHub repo creation (optional):"
  echo "    Install the GitHub CLI:  https://cli.github.com"
  echo "    Then run:  gh auth login"
  echo "    Then run:  gh repo create $SLUG --private --source=. --push"
  echo ""
  echo "  Or push manually:"
  echo "    1. Create a repo at https://github.com/new"
  echo "    2. git remote add origin git@github.com:YOUR_USERNAME/$SLUG.git"
  echo "    3. git push -u origin main"
fi

# ── Done ──────────────────────────────────────────────────

echo ""
echo "  Your project $PROJECT_NAME is ready."
echo ""
echo "  Next steps:"
echo "    bash start.sh          — Launch your app and open Claude Code"
echo "    Open CLAUDE.md         — Fill in voice, domain, and working style sections"
echo ""
