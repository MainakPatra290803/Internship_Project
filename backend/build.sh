#!/usr/bin/env bash
# exit on error
set -o errexit

# Install dependencies
pip install -r requirements.txt

# Create required directories
mkdir -p uploads
mkdir -p models

# Download YOLO models if they don't exist
if [ ! -f models/yolov3-tiny.cfg ]; then
    echo "Downloading YOLO config..."
    curl -o models/yolov3-tiny.cfg https://raw.githubusercontent.com/pjreddie/darknet/master/cfg/yolov3-tiny.cfg
fi

if [ ! -f models/yolov3-tiny.weights ]; then
    echo "Downloading YOLO weights..."
    curl -o models/yolov3-tiny.weights https://pjreddie.com/media/files/yolov3-tiny.weights
fi

if [ ! -f models/coco.names ]; then
    echo "Downloading COCO names..."
    curl -o models/coco.names https://raw.githubusercontent.com/pjreddie/darknet/master/data/coco.names
fi

echo "Build completed successfully."
