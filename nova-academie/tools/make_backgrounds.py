"""Render the game's photographic backgrounds from CC0 Poly Haven panoramas.

Usage: python3 tools/make_backgrounds.py <hdri_dir> <out_dir>
Panoramas: https://polyhaven.com (CC0). Download URL pattern:
https://dl.polyhaven.org/file/ph-assets/HDRIs/extra/Tonemapped%20JPG/<name>.jpg
"""
import os, sys
from PIL import ImageEnhance
from pano import load_pano, render

# key: (panorama, yaw, pitch, fov, brightness, saturation)
VIEWS = {
    'chateau_nuit':  ('ladybrand_heritage_house', -27, 6, 72, 1.15, 1.1),
    'chateau_jour':  ('furstenstein', 34, 6, 72, 1.0, 1.1),
    'parc':          ('medieval_cafe', -115, 2, 90, 1.0, 1.1),
    'piscine':       ('pool', 0, 2, 90, 1.0, 1.05),
    'hall':          ('entrance_hall', 45, 0, 85, 1.0, 1.05),
    'salon':         ('wooden_lounge', -40, -4, 90, 1.0, 1.05),
    'salon2':        ('lythwood_lounge', 20, -2, 90, 1.0, 1.0),
    'chambre':       ('relax_inn_seaview_suite', 75, -4, 88, 1.0, 1.05),
    'cuisine':       ('warm_restaurant', 0, -2, 90, 1.0, 1.0),
    'cafe':          ('comfy_cafe', 60, -2, 90, 1.0, 1.05),
    'danse':         ('dancing_hall', 150, -4, 92, 1.0, 1.05),
    'repetition':    ('mirrored_hall', 30, -2, 90, 1.0, 1.0),
    'sport':         ('gym_01', 0, -4, 90, 1.0, 1.0),
    'yoga':          ('yoga_room', -30, -2, 100, 1.0, 1.0),
    'chant':         ('ballroom', -150, -4, 85, 1.0, 1.05),
    'salle_musique': ('music_hall_02', 0, 6, 105, 1.0, 1.05),
    'theatre':       ('theater_01', 0, 2, 108, 1.0, 1.05),
    'scene':         ('theater_02', 0, 4, 100, 1.0, 1.1),
    'prime':         ('circus_arena', 0, -6, 85, 1.0, 1.1),
    'plateau_tv':    ('tv_studio', 75, -6, 95, 1.0, 1.05),
    'finale':        ('music_hall_01', 0, 4, 85, 1.0, 1.05),
    'bureau':        ('reading_room', 60, -4, 88, 1.0, 1.0),
    'confessionnal': ('neon_photostudio', 25, -6, 100, 0.85, 1.15),
    'piscine_int':   ('indoor_pool', 0, -4, 90, 1.0, 1.0),
    'jardin':        ('borghese_gardens', 90, 2, 85, 1.0, 1.05),
}

if __name__ == '__main__':
    src, out = sys.argv[1], sys.argv[2]
    only = sys.argv[3:]
    os.makedirs(out, exist_ok=True)
    cache = {}
    for key, (pano, yaw, pitch, fov, bri, sat) in VIEWS.items():
        if only and key not in only:
            continue
        if pano not in cache:
            cache.clear()
            cache[pano] = load_pano(os.path.join(src, pano + '.jpg'))
        img = render(cache[pano], yaw, pitch, fov)
        if bri != 1.0:
            img = ImageEnhance.Brightness(img).enhance(bri)
        if sat != 1.0:
            img = ImageEnhance.Color(img).enhance(sat)
        img.save(os.path.join(out, key + '.jpg'), quality=84, optimize=True, progressive=True)
        print('ok', key)
