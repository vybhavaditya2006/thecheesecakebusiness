"""Cut a single piece out of its photo, for scripts/process-photos.mjs.

    python scripts/cutout.py <input.png> <output.png> [model]

rembg (isnet-general-use) finds the piece; the edge is then worked out by
alpha matting at the photo's full resolution, in a narrow band either side of
rembg's outline, so the paper cup's ridges stay crisp. rembg's own matting
step uses a wide band and on some photos gives up and leaves a stepped edge,
so the matting is done here directly with pymatting, which rembg uses too.
The colours at the edge are recovered as well (no fringe of the table).
"""

import sys

import numpy as np
from PIL import Image
from pymatting import estimate_alpha_cf, estimate_foreground_ml
from rembg import new_session, remove
from scipy import ndimage

source, target = sys.argv[1], sys.argv[2]
model = sys.argv[3] if len(sys.argv) > 3 else "isnet-general-use"

image = Image.open(source).convert("RGB")
mask = np.asarray(remove(image, session=new_session(model), only_mask=True), dtype=np.float64) / 255

# The trimap: sure inside, sure outside, and a band about the outline that
# the matting decides. The band scales with the picture.
band = max(3, round(max(image.size) / 400))
inside = ndimage.binary_erosion(mask > 0.5, iterations=band)
outside = ~ndimage.binary_dilation(mask > 0.5, iterations=band)
trimap = np.full(mask.shape, 0.5)
trimap[inside] = 1
trimap[outside] = 0

pixels = np.asarray(image, dtype=np.float64) / 255
alpha = estimate_alpha_cf(pixels, trimap, laplacian_kwargs={"epsilon": 1e-6}, cg_kwargs={"maxiter": 2000})
alpha = np.clip(alpha, 0, 1)
foreground = np.clip(estimate_foreground_ml(pixels, alpha), 0, 1)

rgba = np.dstack([foreground, alpha])
Image.fromarray(np.round(rgba * 255).astype(np.uint8), "RGBA").save(target)
