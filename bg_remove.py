# bg_remove.py
# Python script to remove background from PNGs lacking alpha using U²-Net ONNX model.
# Dependencies: onnxruntime, Pillow, numpy

import os
import sys
import argparse
from pathlib import Path
import numpy as np
from PIL import Image
import onnxruntime as ort

def has_alpha(png_path: Path) -> bool:
    try:
        with Image.open(png_path) as img:
            return img.mode in ("RGBA", "LA") or (img.mode == "P" and 'transparency' in img.info)
    except Exception as e:
        print(f"Error reading {png_path}: {e}")
        return False

def preprocess(img: Image.Image) -> np.ndarray:
    # Convert to RGB, resize to 320x320 (U2-Net expected size) while keeping aspect ratio
    img_resized = img.resize((320, 320), Image.BILINEAR)
    img_np = np.asarray(img_resized).astype('float32') / 255.0
    # If image has 4 channels, drop alpha for model input
    if img_np.shape[2] == 4:
        img_np = img_np[:, :, :3]
    # Transpose to (C, H, W)
    img_np = np.transpose(img_np, (2, 0, 1))
    img_np = np.expand_dims(img_np, axis=0)  # (1, 3, H, W)
    return img_np

def postprocess(mask: np.ndarray, orig_size) -> Image.Image:
    # mask shape (1, 1, H, W) -> (H, W)
    mask = mask.squeeze()
    mask = (mask * 255).astype('uint8')
    mask_img = Image.fromarray(mask).resize(orig_size, Image.BILINEAR)
    return mask_img

def remove_background(input_path: Path, output_path: Path, session: ort.InferenceSession):
    with Image.open(input_path) as img:
        orig_size = img.size
        # Ensure RGB for model
        img_rgb = img.convert('RGB')
        input_tensor = preprocess(img_rgb)
        ort_inputs = {session.get_inputs()[0].name: input_tensor}
        ort_outs = session.run(None, ort_inputs)
        mask = ort_outs[0]  # assuming first output is mask
        mask_img = postprocess(mask, orig_size)
        # Apply mask as alpha channel
        img_rgba = img.convert('RGBA')
        r, g, b, _ = img_rgba.split()
        result = Image.merge('RGBA', (r, g, b, mask_img))
        result.save(output_path, format='PNG')
        print(f"Processed {input_path.name} -> {output_path.name}")

def main():
    parser = argparse.ArgumentParser(description='Batch background removal using U2-Net ONNX')
    parser.add_argument('input_dir', type=str, help='Folder with source PNGs')
    parser.add_argument('output_dir', type=str, help='Folder to write processed PNGs')
    parser.add_argument('--model', type=str, default='u2net.onnx', help='Path to ONNX model')
    args = parser.parse_args()

    input_dir = Path(args.input_dir)
    output_dir = Path(args.output_dir)
    model_path = Path(args.model)

    if not model_path.is_file():
        print(f"Model file not found: {model_path}")
        sys.exit(1)

    output_dir.mkdir(parents=True, exist_ok=True)

    session = ort.InferenceSession(str(model_path), providers=['CPUExecutionProvider'])

    for png_file in input_dir.glob('*.png'):
        if not has_alpha(png_file):
            out_path = output_dir / png_file.name.replace('.png', '_transparent.png')
            remove_background(png_file, out_path, session)
        else:
            print(f"Skipping {png_file.name} (already has alpha)")

if __name__ == '__main__':
    main()
