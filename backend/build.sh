#!/usr/bin/env bash
# exit on error
set -o errexit

# Install dependencies
pip install -r requirements.txt

# Run any migrations if needed
# python manage.py migrate
# (For FastAPI with SQLAlchemy on Render, we use Base.metadata.create_all() in main.py)

echo "Build completed successfully."
