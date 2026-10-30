import base64
import io
import urllib.request

import numpy as np
import torch
from PIL import Image, ImageOps
from transformers import AutoImageProcessor, ViTForImageClassification

PROCESSOR_REPO = "wambugu71/crop_leaf_diseases_vit"
MODEL_REPO = "wambugu1738/crop_leaf_diseases_vit"

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
feature_extractor = AutoImageProcessor.from_pretrained(PROCESSOR_REPO)
model = ViTForImageClassification.from_pretrained(
    MODEL_REPO,
    ignore_mismatched_sizes=True,
).to(device)
model.eval()


def _open_image(source):
    if isinstance(source, Image.Image):
        return ImageOps.exif_transpose(source).convert("RGB")

    if source.startswith("data:image"):
        _, encoded = source.split(",", 1)
        image_data = base64.b64decode(encoded, validate=True)
        image_source = io.BytesIO(image_data)
    elif source.startswith(("http://", "https://")):
        request = urllib.request.Request(
            source,
            headers={"User-Agent": "Mozilla/5.0"},
        )
        with urllib.request.urlopen(request, timeout=30) as response:
            image_source = io.BytesIO(response.read())
    else:
        image_source = source

    with Image.open(image_source) as image:
        return ImageOps.exif_transpose(image).convert("RGB")


def predict_class(image_source):
    image = _open_image(image_source)
    inputs = feature_extractor(images=image, return_tensors="pt")
    inputs = {name: tensor.to(device) for name, tensor in inputs.items()}

    with torch.inference_mode():
        outputs = model(**inputs)

    predicted_class_idx = outputs.logits.argmax(-1).item()
    label = model.config.id2label[predicted_class_idx]
    return get_crop_disease(label)


def get_crop_disease(label):
    if "___" not in label:
        raise ValueError("The classifier could not identify a supported crop leaf.")
    return tuple(label.split("___", 1))


def get_best_img(image_sources):
    if not image_sources:
        raise ValueError("At least one image is required.")
    if len(image_sources) == 1:
        return image_sources[0]
    return max(image_sources, key=compute_sharpness)


def compute_sharpness(image_source):
    pixels = np.asarray(_open_image(image_source).convert("L"), dtype=np.float32)
    if pixels.shape[0] < 3 or pixels.shape[1] < 3:
        return 0.0
    laplacian = (
        pixels[:-2, 1:-1]
        + pixels[2:, 1:-1]
        + pixels[1:-1, :-2]
        + pixels[1:-1, 2:]
        - 4 * pixels[1:-1, 1:-1]
    )
    return float(np.var(laplacian))
