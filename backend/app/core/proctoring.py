import cv2
import numpy as np
import os
import urllib.request
import logging

logger = logging.getLogger(__name__)

# Model directories and URLs
MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "models")
os.makedirs(MODEL_DIR, exist_ok=True)

YOLO_CFG_URL = "https://raw.githubusercontent.com/pjreddie/darknet/master/cfg/yolov3-tiny.cfg"
YOLO_WEIGHTS_URL = "https://pjreddie.com/media/files/yolov3-tiny.weights"
COCO_NAMES_URL = "https://raw.githubusercontent.com/pjreddie/darknet/master/data/coco.names"

YOLO_CFG_PATH = os.path.join(MODEL_DIR, "yolov3-tiny.cfg")
YOLO_WEIGHTS_PATH = os.path.join(MODEL_DIR, "yolov3-tiny.weights")
COCO_NAMES_PATH = os.path.join(MODEL_DIR, "coco.names")

def download_file(url, path):
    if not os.path.exists(path):
        logger.info(f"Downloading {url} to {path}...")
        try:
            # Using Request with User-Agent to avoid blocks and handle redirects
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req) as response:
                with open(path, 'wb') as out_file:
                    out_file.write(response.read())
            logger.info(f"Download complete: {path}")
        except Exception as e:
            logger.error(f"Failed to download {url}: {e}")

# Download models - wrap in try-except to prevent app crash
try:
    download_file(YOLO_CFG_URL, YOLO_CFG_PATH)
    download_file(YOLO_WEIGHTS_URL, YOLO_WEIGHTS_PATH)
    download_file(COCO_NAMES_URL, COCO_NAMES_PATH)
except Exception as e:
    logger.error(f"Model initialization error: {e}")

# Initialize OpenCV Haar cascade for face detection
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

# Initialize YOLO for phone detection
yolo_net = None
classes = []

if os.path.exists(COCO_NAMES_PATH):
    with open(COCO_NAMES_PATH, "r") as f:
        classes = [line.strip() for line in f.readlines()]

if os.path.exists(YOLO_CFG_PATH) and os.path.exists(YOLO_WEIGHTS_PATH):
    try:
        yolo_net = cv2.dnn.readNetFromDarknet(YOLO_CFG_PATH, YOLO_WEIGHTS_PATH)
        yolo_net.setPreferableBackend(cv2.dnn.DNN_BACKEND_OPENCV)
        yolo_net.setPreferableTarget(cv2.dnn.DNN_TARGET_CPU)
    except Exception as e:
        logger.error(f"Failed to load YOLO model: {e}")

def analyze_frame(image_bytes: bytes) -> dict:
    """
    Analyzes a raw bytes image for proctoring.
    Returns a dict with 'faces_detected', 'phone_detected'.
    """
    detected_faces = 0
    phone_detected = False

    try:
        # Convert bytes to numpy array then to OpenCV image
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            return {"faces_detected": 0, "phone_detected": False, "error": "Invalid image bytes"}

        # 1. Face detection using Haar Cascade
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(
            gray, 
            scaleFactor=1.1, 
            minNeighbors=5, 
            minSize=(30, 30)
        )
        detected_faces = len(faces)

        # 2. Cell phone detection using YOLOv3-tiny
        if yolo_net is not None and len(classes) > 0:
            blob = cv2.dnn.blobFromImage(img, 1/255.0, (416, 416), swapRB=True, crop=False)
            yolo_net.setInput(blob)
            
            # Get output layer names
            layer_names = yolo_net.getLayerNames()
            output_layers = [layer_names[i - 1] for i in yolo_net.getUnconnectedOutLayers()]
            outs = yolo_net.forward(output_layers)

            for out in outs:
                for detection in out:
                    scores = detection[5:]
                    class_id = np.argmax(scores)
                    confidence = scores[class_id]

                    if confidence > 0.4:
                        label = classes[class_id].lower()
                        if 'cell phone' in label or 'remote' in label:
                            phone_detected = True
                            break
                if phone_detected:
                    break

    except Exception as e:
        logger.error(f"Error analyzing frame: {e}")

    return {
        "faces_detected": detected_faces,
        "phone_detected": phone_detected
    }
