# -*- coding: utf-8 -*-
"""Generate architectural elevation graphics for NCC 2022 Types A, B, C.

Produces a multi-page PDF with:
  1. Hero side-by-side height comparison (true to scale, with metric ruler)
  2. Type A — 8-storey Class 2 + basement, fire safety package callouts
  3. Type B — 2-storey Class 2 over garage (< 12 m)
  4. Type C — single-storey Class 6 + 7b
  5. Fire safety systems vs effective height (visual matrix)
  6. FRL & compartmentation reference

Style: 369 Alliance brand (navy / gold / amber).
"""

from __future__ import annotations

import os
from dataclasses import dataclass

import matplotlib.patches as patches
import matplotlib.pyplot as plt
from matplotlib.backends.backend_pdf import PdfPages
from matplotlib.lines import Line2D
from matplotlib.patches import FancyArrowPatch, FancyBboxPatch, Rectangle

# ---------------------------------------------------------------------------
# Brand palette
# ---------------------------------------------------------------------------
NAVY = "#1A1A2E"
GOLD = "#A68A64"
AMBER = "#C07040"
CREAM = "#F5EFE6"
PAPER = "#FBFAF7"
LIGHT_GREY = "#E8E6E1"
SLATE = "#46505C"

RED_A = "#C0392B"
ORANGE_B = "#E67E22"
GREEN_C = "#2E7D32"

WIN_GLAZE = "#88B0C4"
WIN_FRAME = "#2D3F4F"
ROOF = "#2C3543"
SLAB = "#7A6B57"
GROUND = "#7A6B57"
SKY = "#F1F4F7"

plt.rcParams.update(
    {
        "font.family": "DejaVu Sans",
        "font.size": 10,
        "axes.edgecolor": NAVY,
        "axes.labelcolor": NAVY,
        "axes.titlecolor": NAVY,
        "savefig.facecolor": PAPER,
        "figure.facecolor": PAPER,
    }
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def page_canvas(title, subtitle):
    """Create a landscape A3-ish figure with a navy title bar."""
    fig = plt.figure(figsize=(16, 10), dpi=160)
    fig.patch.set_facecolor(PAPER)

    # Title bar
    title_ax = fig.add_axes([0, 0.92, 1, 0.08])
    title_ax.set_xlim(0, 1)
    title_ax.set_ylim(0, 1)
    title_ax.add_patch(Rectangle((0, 0), 1, 1, color=NAVY))
    title_ax.text(0.025, 0.6, title, color="white", fontsize=22, fontweight="bold",
                  va="center", ha="left")
    title_ax.text(0.025, 0.18, subtitle, color="#CFCFE0", fontsize=12,
                  va="center", ha="left")
    title_ax.axis("off")

    # Footer line
    foot_ax = fig.add_axes([0, 0.0, 1, 0.04])
    foot_ax.set_xlim(0, 1)
    foot_ax.set_ylim(0, 1)
    foot_ax.text(0.025, 0.5,
                 "369 Alliance — NCC 2022 design reference (conceptual diagram, true to vertical scale)",
                 color=SLATE, fontsize=9, va="center")
    foot_ax.text(0.975, 0.5, "Volume One · Part C2 · Specification 5",
                 color=GOLD, fontsize=9, va="center", ha="right", fontweight="bold")
    foot_ax.axis("off")
    return fig


def add_main_axes(fig, rect=(0.06, 0.08, 0.88, 0.78)):
    ax = fig.add_axes(rect)
    ax.set_facecolor(PAPER)
    return ax


def shadow_box(ax, x, y, w, h, color, alpha=1.0, radius=0.6, zorder=2):
    """Soft shadow + filled rounded rect. The filled rect uses `zorder`,
    the shadow uses `zorder - 1` so callers can layer pills on top with
    `zorder + 1`."""
    s = FancyBboxPatch((x + 0.08, y - 0.18), w, h,
                       boxstyle=f"round,pad=0.02,rounding_size={radius}",
                       linewidth=0, facecolor="#00000010", zorder=zorder - 1)
    ax.add_patch(s)
    box = FancyBboxPatch((x, y), w, h,
                         boxstyle=f"round,pad=0.02,rounding_size={radius}",
                         linewidth=0, facecolor=color, alpha=alpha, zorder=zorder)
    ax.add_patch(box)
    return box


def chip(ax, x, y, label, color, text_color="white", fontsize=11):
    cx = FancyBboxPatch((x, y), 1.2, 0.45,
                        boxstyle="round,pad=0.02,rounding_size=0.18",
                        linewidth=0, facecolor=color)
    ax.add_patch(cx)
    ax.text(x + 0.6, y + 0.225, label, ha="center", va="center",
            fontsize=fontsize, color=text_color, fontweight="bold")


# ---------------------------------------------------------------------------
# Building drawer (architectural elevation, true to vertical scale)
# ---------------------------------------------------------------------------
@dataclass
class BuildingSpec:
    """Defines one building elevation."""

    name: str             # 'Type A' etc.
    label_color: str
    levels: list          # list of dicts: {height: m, occ: str, code: 'L8'|'GF'|'B1'|'Garage'|'Roof'}
    width_m: float = 18.0
    parapet_m: float = 0.6
    color_facade: str = "#D8DBE0"
    color_glaze: str = WIN_GLAZE
    has_basement: bool = False
    show_windows: bool = True


def draw_building(ax, x_left, building: BuildingSpec, y_ground=0.0,
                  show_storey_labels=True, scale_label=True):
    """Draw an architectural elevation in metric units on `ax`.
    Returns (x_right, top_y).
    """
    levels = building.levels
    width = building.width_m

    # Compute cumulative heights from bottom
    # Order in levels list goes top->bottom. Reverse for drawing.
    bottom_to_top = list(reversed(levels))

    # Track y positions
    y = y_ground
    basement_depth = 0.0
    for lv in bottom_to_top:
        if lv["code"] in ("B1", "Garage") and building.has_basement:
            basement_depth += lv["height"]
    y -= basement_depth  # start below ground if basement

    # Draw basement first (below ground line)
    cur_y = y_ground - basement_depth
    for lv in bottom_to_top:
        h = lv["height"]
        if lv["code"] in ("B1",) and building.has_basement:
            # Below-ground basement (lighter, hatched)
            ax.add_patch(Rectangle((x_left, cur_y), width, h,
                                   facecolor="#BDB6A6", edgecolor=NAVY,
                                   linewidth=1.0, hatch="////", alpha=0.55, zorder=3))
            ax.text(x_left + width / 2, cur_y + h / 2,
                    f"{lv['code']}  ·  {lv['occ']}",
                    ha="center", va="center", fontsize=9, color=NAVY,
                    fontweight="bold")
            cur_y += h

    # Above-ground portion
    for lv in bottom_to_top:
        if lv["code"] in ("B1",) and building.has_basement:
            continue  # already drawn
        h = lv["height"]
        is_roof = lv["code"] in ("Roof",)

        if lv["code"] == "Garage":
            face_color = "#B8B0A0"
            edge_color = NAVY
            ax.add_patch(Rectangle((x_left, cur_y), width, h,
                                   facecolor=face_color, edgecolor=edge_color,
                                   linewidth=1.2, zorder=3))
            # Garage door
            door_w = width * 0.55
            door_h = h * 0.62
            ax.add_patch(Rectangle((x_left + (width - door_w) / 2,
                                   cur_y + h * 0.05),
                                   door_w, door_h,
                                   facecolor="#444B57", edgecolor=NAVY,
                                   linewidth=0.8, zorder=4))
            # Garage door slats
            for s in range(1, 7):
                ax.plot([x_left + (width - door_w) / 2,
                         x_left + (width + door_w) / 2],
                        [cur_y + h * 0.05 + door_h * s / 7] * 2,
                        color="#2A3038", linewidth=0.5, zorder=5)
            ax.text(x_left + width / 2, cur_y + h - 0.3, lv["occ"],
                    ha="center", va="top", fontsize=8.5,
                    color=NAVY, fontweight="bold")
        elif is_roof:
            # Parapet + roof plant box
            ax.add_patch(Rectangle((x_left, cur_y), width, h,
                                   facecolor="#9CA0A8", edgecolor=NAVY,
                                   linewidth=1.0, zorder=3))
            ax.add_patch(Rectangle((x_left + width * 0.55,
                                    cur_y + h * 0.15),
                                   width * 0.3, h * 0.7,
                                   facecolor=ROOF, edgecolor=NAVY,
                                   linewidth=0.8, zorder=4))
            ax.text(x_left + width * 0.7, cur_y + h * 0.5, "PLANT",
                    ha="center", va="center", fontsize=7,
                    color="white", fontweight="bold")
            ax.text(x_left + width * 0.2, cur_y + h * 0.5, lv["code"],
                    ha="center", va="center", fontsize=9,
                    color=NAVY, fontweight="bold")
        else:
            # Normal storey: facade + window grid
            ax.add_patch(Rectangle((x_left, cur_y), width, h,
                                   facecolor=building.color_facade,
                                   edgecolor=NAVY, linewidth=1.0, zorder=3))
            if building.show_windows:
                # Window grid: ~3.0 m wide bays, glazing fraction ~0.55
                bay_w = 3.0
                n_bays = max(1, int(width / bay_w))
                pad_x = (width - n_bays * bay_w) / 2 + 0.3
                win_h = h * 0.55
                win_y = cur_y + (h - win_h) / 2
                for k in range(n_bays):
                    bx = x_left + pad_x + k * bay_w + bay_w * 0.12
                    bw = bay_w * 0.76
                    ax.add_patch(Rectangle((bx, win_y), bw, win_h,
                                           facecolor=building.color_glaze,
                                           edgecolor=WIN_FRAME,
                                           linewidth=0.8, zorder=4))
                    # Mullion
                    ax.plot([bx + bw / 2] * 2,
                            [win_y, win_y + win_h],
                            color=WIN_FRAME, linewidth=0.6, zorder=5)
                    # Transom
                    ax.plot([bx, bx + bw],
                            [win_y + win_h * 0.55] * 2,
                            color=WIN_FRAME, linewidth=0.6, zorder=5)
            # Slab line
            ax.plot([x_left, x_left + width],
                    [cur_y + h, cur_y + h],
                    color=SLAB, linewidth=2.0, zorder=6)
            if show_storey_labels:
                # Pill behind the storey code so it stays readable over windows
                code_w = 1.4
                code_h = 0.9
                ax.add_patch(FancyBboxPatch((x_left + 0.35, cur_y + h - code_h - 0.1),
                                            code_w, code_h,
                                            boxstyle="round,pad=0.02,rounding_size=0.18",
                                            linewidth=0, facecolor="white",
                                            alpha=0.92, zorder=6))
                ax.text(x_left + 0.35 + code_w / 2, cur_y + h - code_h / 2 - 0.1,
                        lv["code"], ha="center", va="center", fontsize=9,
                        color=NAVY, fontweight="bold", zorder=7)
        cur_y += h

    top_y = cur_y
    # Type label chip — placed BELOW the building (below soil, never overlapping)
    chip_y = y_ground - basement_depth - 1.95
    ax.add_patch(FancyBboxPatch((x_left + width / 2 - 1.9, chip_y),
                                3.8, 1.0,
                                boxstyle="round,pad=0.02,rounding_size=0.45",
                                linewidth=0, facecolor=building.label_color, zorder=12))
    ax.text(x_left + width / 2, chip_y + 0.5,
            building.name, ha="center", va="center",
            fontsize=13, color="white", fontweight="bold", zorder=13)

    # Total above-ground height annotation
    above_h = top_y - y_ground
    if scale_label:
        ax.annotate(
            "",
            xy=(x_left + width + 1.1, top_y),
            xytext=(x_left + width + 1.1, y_ground),
            arrowprops=dict(arrowstyle="<->", color=NAVY, lw=1.2),
        )
        ax.text(x_left + width + 1.5, (top_y + y_ground) / 2,
                f"{above_h:.1f} m", color=NAVY, fontsize=10, fontweight="bold",
                rotation=90, va="center")

    return x_left + width, top_y


def draw_height_ruler(ax, x, y_min, y_max, thresholds=((12, "12 m\nsub-tall threshold"),
                                                       (25, "25 m\nhigh-rise threshold"),
                                                       (50, "50 m"))):
    """Vertical metric ruler on the LEFT of the canvas."""
    # Tickmark scale
    ax.plot([x, x], [y_min, y_max], color=NAVY, linewidth=1.4, zorder=2)
    for m in range(int(y_min // 5) * 5, int(y_max) + 1, 5):
        if m < y_min or m > y_max:
            continue
        ax.plot([x - 0.4, x], [m, m], color=NAVY, linewidth=0.8)
        ax.text(x - 0.6, m, f"{m} m", ha="right", va="center",
                color=SLATE, fontsize=8)
    # Threshold dashed lines across the canvas
    for h_m, txt in thresholds:
        if y_min <= h_m <= y_max:
            ax.axhline(h_m, color=AMBER, linestyle=(0, (6, 4)),
                       linewidth=1.2, zorder=1, alpha=0.85)
            ax.text(x - 0.6, h_m + 0.2, txt, ha="right", va="bottom",
                    color=AMBER, fontsize=8.5, fontweight="bold")


# ---------------------------------------------------------------------------
# Page 1 — HERO height comparison
# ---------------------------------------------------------------------------
def page_hero(pdf):
    fig = page_canvas(
        "Type A · B · C — Height comparison at scale",
        "Same vertical scale; ruler shows the 12 m and 25 m fire-safety thresholds (NCC 2022 C2D2 / E1D7 / E3D9)",
    )
    ax = add_main_axes(fig)

    # Compose the three buildings on the same scale
    type_a = BuildingSpec(
        name="TYPE A",
        label_color=RED_A,
        has_basement=True,
        levels=[
            {"code": "Roof", "occ": "Plant + roof", "height": 1.2},
            {"code": "L8", "occ": "Class 2", "height": 3.0},
            {"code": "L7", "occ": "Class 2", "height": 3.0},
            {"code": "L6", "occ": "Class 2", "height": 3.0},
            {"code": "L5", "occ": "Class 2", "height": 3.0},
            {"code": "L4", "occ": "Class 2", "height": 3.0},
            {"code": "L3", "occ": "Class 2", "height": 3.0},
            {"code": "L2", "occ": "Class 2", "height": 3.0},
            {"code": "L1", "occ": "Class 2 + lobby", "height": 3.2},
            {"code": "GF", "occ": "Lobby + retail", "height": 3.6},
            {"code": "B1", "occ": "Class 7a carpark", "height": 3.0},
        ],
        width_m=18, color_facade="#D6DEE6",
    )

    type_b = BuildingSpec(
        name="TYPE B",
        label_color=ORANGE_B,
        has_basement=False,
        levels=[
            {"code": "L2", "occ": "Class 2 SOUs", "height": 2.9},
            {"code": "L1", "occ": "Class 2 SOUs", "height": 2.9},
            {"code": "GF", "occ": "Entry / lobby", "height": 3.0},
            {"code": "Garage", "occ": "Class 7a (excluded from RIS)", "height": 2.5},
        ],
        width_m=14, color_facade="#E4DACE",
    )

    type_c = BuildingSpec(
        name="TYPE C",
        label_color=GREEN_C,
        has_basement=False,
        levels=[
            {"code": "Roof", "occ": "", "height": 0.8},
            {"code": "GF", "occ": "Class 6 + Class 7b", "height": 4.0},
        ],
        width_m=22, color_facade="#E5E1D2",
    )

    y_ground = 0.0

    # Position buildings with gaps
    x_a = 6
    x_b = x_a + type_a.width_m + 8
    x_c = x_b + type_b.width_m + 8

    # Backdrop sky band
    ax.add_patch(Rectangle((-2, -6), 80, 38, color=SKY, zorder=0))

    # Ground line
    ax.plot([-2, 78], [y_ground, y_ground], color=GROUND, linewidth=2.5, zorder=2)
    # Soil hatch below ground
    ax.add_patch(Rectangle((-2, -6), 80, 6, facecolor="#D4C8B4",
                           edgecolor="none", alpha=0.6, zorder=0))

    draw_building(ax, x_a, type_a, y_ground=y_ground)
    draw_building(ax, x_b, type_b, y_ground=y_ground)
    draw_building(ax, x_c, type_c, y_ground=y_ground)

    # Ruler on left
    draw_height_ruler(ax, x=2.5, y_min=-3, y_max=32)

    # Effective height markers above each
    ax.text(x_a + type_a.width_m / 2, 30,
            "Effective height ≈ 26 m\n→ triggers > 25 m package",
            ha="center", va="bottom", color=RED_A, fontsize=10,
            fontweight="bold")
    ax.text(x_b + type_b.width_m / 2, 14,
            "Effective height ≈ 9 m\n< 12 m, no tall-building package",
            ha="center", va="bottom", color=ORANGE_B, fontsize=10,
            fontweight="bold")
    ax.text(x_c + type_c.width_m / 2, 8,
            "Single storey, ≈ 4 m\nFire-source feature distance is the key control",
            ha="center", va="bottom", color=GREEN_C, fontsize=10,
            fontweight="bold")

    ax.set_xlim(-2, 78)
    ax.set_ylim(-7, 33)
    ax.set_aspect("equal")
    ax.axis("off")

    pdf.savefig(fig)
    plt.close(fig)


# ---------------------------------------------------------------------------
# Page 2 — Type A detailed
# ---------------------------------------------------------------------------
def page_type_a(pdf):
    fig = page_canvas(
        "Type A — 8-storey Class 2 + basement carpark",
        "Most fire-resistant scheme; effective height ≈ 26 m triggers the > 25 m fire-safety package",
    )
    ax = add_main_axes(fig)
    ax.add_patch(Rectangle((-2, -8), 80, 42, color=SKY, zorder=0))
    ax.plot([-2, 78], [0, 0], color=GROUND, linewidth=2.5, zorder=2)
    ax.add_patch(Rectangle((-2, -8), 80, 8, facecolor="#D4C8B4", alpha=0.6, zorder=0))

    type_a = BuildingSpec(
        name="TYPE A",
        label_color=RED_A,
        has_basement=True,
        levels=[
            {"code": "Roof", "occ": "Plant + roof", "height": 1.2},
            {"code": "L8", "occ": "Class 2 apartments", "height": 3.0},
            {"code": "L7", "occ": "Class 2 apartments", "height": 3.0},
            {"code": "L6", "occ": "Class 2 apartments", "height": 3.0},
            {"code": "L5", "occ": "Class 2 apartments", "height": 3.0},
            {"code": "L4", "occ": "Class 2 apartments", "height": 3.0},
            {"code": "L3", "occ": "Class 2 apartments", "height": 3.0},
            {"code": "L2", "occ": "Class 2 apartments", "height": 3.0},
            {"code": "L1", "occ": "Class 2 + lobby", "height": 3.2},
            {"code": "GF", "occ": "Lobby + Class 6 retail", "height": 3.6},
            {"code": "B1", "occ": "Class 7a carpark + services", "height": 3.0},
        ],
        width_m=20, color_facade="#D6DEE6",
    )

    draw_height_ruler(ax, x=4.5, y_min=-4, y_max=32)
    draw_building(ax, x_left=8, building=type_a)

    # Equipment annotations on the building (y coords aligned to actual floors)
    # Floors: B1 −3..0 · GF 0..3.6 · L1 3.6..6.8 · L2 6.8..9.8 · L3 9.8..12.8
    #        L4 12.8..15.8 · L5 15.8..18.8 · L6 18.8..21.8 · L7 21.8..24.8
    #        L8 24.8..27.8 · Roof 27.8..29.0
    bx = 8
    bw = 20
    annotations = [
        (28.4, "Roof plant",           "Smoke-exhaust risers terminate above roof (E2D14)"),
        (23.3, "Emergency lift",       "Required where effective height > 25 m (E3D9 / AS 1735.1)"),
        (17.3, "Pressurised stair",    "Stair pressurisation per AS 1668.1 (D2D6 / E2D14)"),
        (11.3, "Hydrants + hose reels","Coverage from L3 to top of building (E1D2 / E1D3)"),
        ( 5.2, "Sprinklers (dual)",    "Class 2 over 25 m → dual water supply (E1D7)"),
        ( 1.8, "FCR + booster",        "Fire Control Room at access level (E1D14, Spec 20)"),
        (-1.5, "Carpark separation",   "Class 7a separated from Class 2 by 90/90/90 (Spec 5)"),
    ]

    leader_x = bx + bw + 3.0
    text_x = leader_x + 4
    for y, hd, sub in annotations:
        # Marker dot on facade
        ax.add_patch(patches.Circle((bx + bw - 0.6, y), 0.35,
                                    facecolor=AMBER, edgecolor=NAVY,
                                    linewidth=0.8, zorder=8))
        # Leader line
        ax.plot([bx + bw - 0.25, leader_x],
                [y, y], color=NAVY, linewidth=0.8, zorder=7)
        # Callout box
        shadow_box(ax, text_x, y - 0.9, 32, 1.8, "white", radius=0.35, zorder=2)
        ax.text(text_x + 0.5, y + 0.15, hd, fontsize=10,
                color=NAVY, fontweight="bold", va="center", zorder=5)
        ax.text(text_x + 0.5, y - 0.55, sub, fontsize=9,
                color=SLATE, va="center", zorder=5)

    # Effective height bracket
    ax.annotate(
        "",
        xy=(bx - 1.5, 26),
        xytext=(bx - 1.5, 0),
        arrowprops=dict(arrowstyle="<->", color=RED_A, lw=2.0),
    )
    ax.text(bx - 2.0, 13, "Effective height\n≈ 26 m  > 25 m",
            rotation=90, va="center", ha="right",
            color=RED_A, fontsize=10, fontweight="bold")

    ax.set_xlim(0, 78)
    ax.set_ylim(-8, 33)
    ax.set_aspect("equal")
    ax.axis("off")

    pdf.savefig(fig)
    plt.close(fig)


# ---------------------------------------------------------------------------
# Page 3 — Type B detailed
# ---------------------------------------------------------------------------
def page_type_b(pdf):
    fig = page_canvas(
        "Type B — 2-storey Class 2 over garage (< 12 m)",
        "Intermediate scheme; the garage is excluded from Rise in Storeys when C2D4(2) is met",
    )
    ax = add_main_axes(fig)
    ax.add_patch(Rectangle((-2, -8), 80, 28, color=SKY, zorder=0))
    ax.plot([-2, 78], [0, 0], color=GROUND, linewidth=2.5, zorder=2)
    ax.add_patch(Rectangle((-2, -8), 80, 8, facecolor="#D4C8B4", alpha=0.6, zorder=0))

    type_b = BuildingSpec(
        name="TYPE B",
        label_color=ORANGE_B,
        has_basement=False,
        levels=[
            {"code": "Roof", "occ": "", "height": 0.8},
            {"code": "L2", "occ": "Class 2 apartments (SOUs)", "height": 2.9},
            {"code": "L1", "occ": "Class 2 apartments (SOUs)", "height": 2.9},
            {"code": "GF", "occ": "Entry lobby + mailboxes", "height": 3.0},
            {"code": "Garage", "occ": "Class 7a (excluded from RIS)", "height": 2.5},
        ],
        width_m=18, color_facade="#E4DACE",
    )

    draw_height_ruler(ax, x=4.5, y_min=-4, y_max=16,
                      thresholds=((12, "12 m\nsub-tall threshold"),))
    draw_building(ax, x_left=8, building=type_b, y_ground=0)

    # Effective height bracket — top of L2 measured from natural ground level
    # (garage/basement is excluded under C2D4(2)). Garage h=2.5, GF=3.0, L1=2.9, L2=2.9.
    eff_y_top = 11.3   # garage(2.5) + GF(3.0) + L1(2.9) + L2(2.9)
    ax.annotate(
        "",
        xy=(7, eff_y_top),
        xytext=(7, 0),
        arrowprops=dict(arrowstyle="<->", color=ORANGE_B, lw=2.0),
    )
    ax.text(6.4, eff_y_top / 2,
            "Effective height\n≈ 8.8 m  < 12 m",
            rotation=90, va="center", ha="right",
            color=ORANGE_B, fontsize=10, fontweight="bold")

    # Side panel with design focus
    panel_x = 32
    items = [
        ("SOU separation",
         "Walls between sole-occupancy units 60/60/60 (Spec 5 Table 4); "
         "acoustic + fire requirements work together (F5D2)."),
        ("Carpark separation",
         "Class 7a garage separated from the Class 2 part by walls and floor of "
         "90/90/90 (C3D8 + Spec 5 §3.5)."),
        ("Systems profile",
         "Hydrants and hose reels depend on total floor area and town-main "
         "coverage. Sprinklers are not typically required under 12 m."),
        ("Fire-isolated stair",
         "Required where Rise in Storeys ≥ 2 and no other compliant exit; stair "
         "shaft FRL 90/90/90."),
        ("Exits and travel",
         "Two exits per storey above ground (D2D2); travel distances per D3D5."),
        ("Smoke alarms",
         "Mains-powered photoelectric AS 3786 in every bedroom, hallway and storey."),
    ]
    y = 16
    for hd, sub in items:
        shadow_box(ax, panel_x, y - 1.6, 42, 2.0, "white", radius=0.35)
        ax.text(panel_x + 0.6, y - 0.4, hd, fontsize=11, color=NAVY,
                fontweight="bold", va="center")
        ax.text(panel_x + 0.6, y - 1.1, sub, fontsize=9, color=SLATE,
                va="center")
        y -= 2.6

    ax.set_xlim(0, 78)
    ax.set_ylim(-5, 17)
    ax.set_aspect("equal")
    ax.axis("off")

    pdf.savefig(fig)
    plt.close(fig)


# ---------------------------------------------------------------------------
# Page 4 — Type C detailed (single storey + boundary)
# ---------------------------------------------------------------------------
def page_type_c(pdf):
    fig = page_canvas(
        "Type C — Single-storey Class 6 showroom + Class 7b storage",
        "Least restrictive scheme; key controls are fire-source feature distance and compartmentation",
    )
    ax = add_main_axes(fig)
    ax.add_patch(Rectangle((-2, -8), 80, 22, color=SKY, zorder=0))
    ax.plot([-2, 78], [0, 0], color=GROUND, linewidth=2.5, zorder=2)
    ax.add_patch(Rectangle((-2, -8), 80, 8, facecolor="#D4C8B4", alpha=0.6, zorder=0))

    # Height ruler on the left so single-storey scale is obvious
    draw_height_ruler(ax, x=4.5, y_min=-3, y_max=12,
                      thresholds=((12, "12 m\nsub-tall threshold"),))

    # Building dimensions — bigger so the elevation reads clearly on the page
    bx = 9
    by = 0
    h = 5.5
    showroom_w = 18
    storage_w = 10
    total_w = showroom_w + storage_w

    # Showroom (Class 6)
    ax.add_patch(Rectangle((bx, by), showroom_w, h,
                           facecolor="#E5E1D2", edgecolor=NAVY,
                           linewidth=1.2, zorder=3))
    # Storefront glazing
    ax.add_patch(Rectangle((bx + 0.6, by + 0.5), showroom_w - 1.2, h - 1.6,
                           facecolor=WIN_GLAZE, edgecolor=WIN_FRAME,
                           linewidth=0.8, zorder=4))
    # Mullions
    for k in range(1, 6):
        ax.plot([bx + showroom_w * k / 6] * 2,
                [by + 0.5, by + h - 1.1],
                color=WIN_FRAME, linewidth=0.7, zorder=5)
    # Entry
    ax.add_patch(Rectangle((bx + showroom_w / 2 - 1.0, by),
                           2.0, h * 0.6,
                           facecolor="#3A4250", edgecolor=NAVY,
                           linewidth=0.8, zorder=6))

    # Storage (Class 7b) — taller parapet, no glazing
    ax.add_patch(Rectangle((bx + showroom_w, by), storage_w, h + 0.4,
                           facecolor="#D6CFC0", edgecolor=NAVY,
                           linewidth=1.2, zorder=3))
    ax.add_patch(Rectangle((bx + showroom_w + 1.2, by + 0.6),
                           storage_w - 4, h - 1.5,
                           facecolor="#7B8A99", edgecolor=NAVY,
                           linewidth=0.8, zorder=4))  # roller door
    for s in range(1, 8):
        ax.plot([bx + showroom_w + 1.2,
                 bx + showroom_w + 1.2 + (storage_w - 4)],
                [by + 0.6 + (h - 1.5) * s / 8] * 2,
                color="#3F4A55", linewidth=0.4, zorder=5)

    # Roof line — slight pitch
    ax.add_patch(patches.Polygon(
        [[bx, by + h], [bx + showroom_w, by + h],
         [bx + showroom_w + storage_w * 0.3, by + h + 0.4],
         [bx + showroom_w + storage_w, by + h + 0.4]],
        closed=False, fill=False, edgecolor=NAVY, linewidth=1.2, zorder=4))

    # Internal fire wall (red highlight) extending above roof
    fw_x = bx + showroom_w
    ax.plot([fw_x, fw_x], [by - 0.2, by + h + 1.0],
            color=RED_A, linewidth=4.5, zorder=7, solid_capstyle="butt")
    ax.text(fw_x, by + h + 1.4, "Internal fire wall 90/90/90",
            ha="center", va="bottom", color=RED_A, fontsize=10, fontweight="bold")

    # Boundary line on the right with fire source feature
    boundary_x = bx + total_w + 2.5
    ax.plot([boundary_x, boundary_x], [-1, 12],
            color=NAVY, linewidth=1.2, linestyle=(0, (4, 3)), zorder=2)
    ax.text(boundary_x + 0.3, 6, "Boundary /\nfire source feature",
            color=NAVY, fontsize=9, va="center")
    # FSF distance arrow
    ax.annotate("",
                xy=(boundary_x, 1.0), xytext=(bx + total_w, 1.0),
                arrowprops=dict(arrowstyle="<->", color=AMBER, lw=1.4))
    ax.text((bx + total_w + boundary_x) / 2, 1.5,
            "FSF distance < 1.5 m\ncontrols external wall FRL",
            color=AMBER, fontsize=9, ha="center", fontweight="bold")

    # Building labels inside (zorder 9 — sit above glazing rectangles)
    ax.add_patch(FancyBboxPatch((bx + 1.5, by + h - 1.6),
                                showroom_w - 3, 1.2,
                                boxstyle="round,pad=0.02,rounding_size=0.25",
                                linewidth=0, facecolor="white",
                                alpha=0.92, zorder=8))
    ax.text(bx + showroom_w / 2, by + h - 0.7,
            "Class 6 showroom · 950 m²",
            ha="center", va="center", fontsize=12, color=NAVY,
            fontweight="bold", zorder=9)
    ax.add_patch(FancyBboxPatch((bx + showroom_w + 0.6, by + h - 1.6),
                                storage_w - 1.2, 1.2,
                                boxstyle="round,pad=0.02,rounding_size=0.25",
                                linewidth=0, facecolor="white",
                                alpha=0.92, zorder=8))
    ax.text(bx + showroom_w + storage_w / 2, by + h - 0.7,
            "Class 7b storage",
            ha="center", va="center", fontsize=11, color=NAVY,
            fontweight="bold", zorder=9)

    # Type C chip — below soil, well clear of building
    ax.add_patch(FancyBboxPatch((bx + total_w / 2 - 1.9, -3.3),
                                3.8, 1.0,
                                boxstyle="round,pad=0.02,rounding_size=0.45",
                                linewidth=0, facecolor=GREEN_C, zorder=12))
    ax.text(bx + total_w / 2, -2.8, "TYPE C",
            ha="center", va="center", fontsize=13, color="white",
            fontweight="bold", zorder=13)

    # Right panel — design focus (wrapped to fit width)
    panel_x = 47
    panel_w = 30
    items = [
        ("Rise in Storeys = 1",
         "Combustible structural framing may be possible\naway from fire-source features (Spec 5 Table 5)."),
        ("External walls",
         "FRL 60/60/60 within 1.5 m of boundary;\nnon-combustible if < 900 mm; combustible beyond 3 m."),
        ("Compartment cap",
         "Class 6 max 5 500 m²; Class 7b max 18 000 m³.\nInternal fire wall 90/90/90 separates classes."),
        ("Hydrants & hose reels",
         "Required if floor area > 500 m² OR > 90 m to a\ntown-main hydrant. Hose reels follow."),
        ("Sprinklers",
         "Generally not required unless triggered by\nSpec E1.5 (e.g. retail > 2 000 m²)."),
        ("Exits",
         "Single exit only if area ≤ 200 m² and travel ≤ 20 m\n(D2D2); otherwise two exits."),
    ]
    y = 12
    for hd, sub in items:
        shadow_box(ax, panel_x, y - 2.4, panel_w, 2.7, "white",
                   radius=0.35, zorder=2)
        ax.text(panel_x + 0.6, y - 0.5, hd, fontsize=10, color=NAVY,
                fontweight="bold", va="center", zorder=5)
        ax.text(panel_x + 0.6, y - 1.55, sub, fontsize=8.6, color=SLATE,
                va="center", zorder=5)
        y -= 3.0

    ax.set_xlim(0, 80)
    ax.set_ylim(-6, 14)
    ax.set_aspect("equal")
    ax.axis("off")

    pdf.savefig(fig)
    plt.close(fig)


# ---------------------------------------------------------------------------
# Page 5 — Fire safety vs height (matrix)
# ---------------------------------------------------------------------------
def page_systems_matrix(pdf):
    fig = page_canvas(
        "Fire safety systems by effective height",
        "Visual matrix — required (red), optional (amber), not required (green)",
    )
    ax = add_main_axes(fig)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 60)
    ax.axis("off")

    rows = [
        ("Hydrant system",       ["O", "R", "R", "R"]),
        ("Hose reels",           ["O", "R", "R", "R"]),
        ("Booster connection",   ["O", "R", "R", "R*"]),
        ("Fire Control Room",    ["N", "C", "R", "R"]),
        ("Pressurised stair",    ["N", "R", "R", "R"]),
        ("Sprinkler system",     ["S", "S", "R", "R"]),
        ("Emergency lift",       ["N", "O", "R", "R"]),
        ("Smoke management",     ["A", "C", "M", "Z"]),
        ("Mass timber permitted",["Y", "Y", "L", "N2"]),
    ]
    cols = ["< 12 m\nType B / C", "12–25 m\nType A / B", "> 25 m\nType A", "> 50 m\nType A"]

    color_map = {
        "R": (GREEN_C, "Required"),
        "R*":(GREEN_C, "Required (twin)"),
        "O": (AMBER, "Optional"),
        "N": (RED_A, "Not required"),
        "C": (AMBER, "Conditional"),
        "S": (AMBER, "Per Spec E1.5"),
        "A": ("#37715a", "Smoke alarms"),
        "M": (GREEN_C, "Mech. control"),
        "Z": (GREEN_C, "Zone press."),
        "Y": (GREEN_C, "Permitted"),
        "L": (AMBER, "Restricted ≤ 25 m"),
        "N2":(RED_A, "Not in Class 2/3"),
    }

    # Title row
    table_x = 6
    table_y_top = 50
    row_h = 4.2
    col_widths = [22, 16, 16, 16, 16]

    # Header
    cur_x = table_x
    shadow_box(ax, cur_x, table_y_top, col_widths[0], row_h, NAVY,
               radius=0.35, zorder=2)
    ax.text(cur_x + col_widths[0] / 2, table_y_top + row_h / 2,
            "System / equipment", color="white", ha="center", va="center",
            fontsize=11, fontweight="bold", zorder=5)
    cur_x += col_widths[0]
    for i, c in enumerate(cols):
        shadow_box(ax, cur_x, table_y_top, col_widths[i + 1], row_h, NAVY,
                   radius=0.35, zorder=2)
        ax.text(cur_x + col_widths[i + 1] / 2, table_y_top + row_h / 2, c,
                color="white", ha="center", va="center",
                fontsize=10, fontweight="bold", zorder=5)
        cur_x += col_widths[i + 1]

    # Rows
    for i, (sys_name, vals) in enumerate(rows):
        ry = table_y_top - (i + 1) * row_h
        bg = "white" if i % 2 == 0 else CREAM
        shadow_box(ax, table_x, ry, col_widths[0], row_h, bg,
                   radius=0.25, zorder=2)
        ax.text(table_x + 0.6, ry + row_h / 2, sys_name,
                color=NAVY, ha="left", va="center",
                fontsize=10, fontweight="bold", zorder=5)
        cx = table_x + col_widths[0]
        for j, v in enumerate(vals):
            color, text = color_map[v]
            shadow_box(ax, cx, ry, col_widths[j + 1], row_h, bg,
                       radius=0.25, zorder=2)
            # Pill — must sit ON TOP of the row background
            pill_w = col_widths[j + 1] - 2
            ax.add_patch(FancyBboxPatch((cx + 1, ry + 0.7),
                                        pill_w, row_h - 1.4,
                                        boxstyle="round,pad=0.02,rounding_size=0.6",
                                        linewidth=0, facecolor=color, zorder=4))
            ax.text(cx + 1 + pill_w / 2, ry + row_h / 2, text,
                    color="white", ha="center", va="center",
                    fontsize=9.5, fontweight="bold", zorder=6)
            cx += col_widths[j + 1]

    # Legend
    legend_y = 4
    legend_items = [(GREEN_C, "Required"), (AMBER, "Conditional / optional"),
                    (RED_A, "Not required / not permitted")]
    lx = 6
    for c, t in legend_items:
        ax.add_patch(FancyBboxPatch((lx, legend_y), 1.6, 1.6,
                                    boxstyle="round,pad=0.02,rounding_size=0.6",
                                    linewidth=0, facecolor=c))
        ax.text(lx + 2.2, legend_y + 0.8, t, color=NAVY,
                fontsize=10, va="center")
        lx += 28

    pdf.savefig(fig)
    plt.close(fig)


# ---------------------------------------------------------------------------
# Page 6 — FRL reference
# ---------------------------------------------------------------------------
def page_frl(pdf):
    fig = page_canvas(
        "FRL intensity & compartmentation reference",
        "Quick reference — Specification 5 Tables 3, 4 & 5; numeric values in minutes",
    )
    ax = add_main_axes(fig)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 60)
    ax.axis("off")

    # Left: FRL intensity bars
    ax.text(5, 56, "Typical loadbearing FRL by Type",
            color=NAVY, fontsize=14, fontweight="bold")
    ax.text(5, 53, "(ranged across element type — read full Spec 5 for the worst case)",
            color=SLATE, fontsize=10)

    bars = [
        ("Type A", RED_A, 240, "240/240/240"),
        ("Type B", ORANGE_B, 120, "120/120/120"),
        ("Type C", GREEN_C, 60, "60/60/60"),
    ]
    bar_x = 16
    bar_w_max = 38
    for i, (name, color, val, label) in enumerate(bars):
        y = 47 - i * 6
        ax.text(5, y + 0.4, name, color=NAVY, fontsize=12, fontweight="bold",
                zorder=5)
        ax.text(5, y - 0.8, "Most fire-resistant" if name == "Type A"
                else ("Intermediate" if name == "Type B" else "Least restrictive"),
                color=SLATE, fontsize=9, zorder=5)
        # Track
        ax.add_patch(FancyBboxPatch((bar_x, y - 0.3), bar_w_max, 1.6,
                                    boxstyle="round,pad=0.02,rounding_size=0.5",
                                    linewidth=0, facecolor="#E5E1D2", zorder=3))
        # Bar (must sit on top of track)
        ax.add_patch(FancyBboxPatch((bar_x, y - 0.3), bar_w_max * (val / 240), 1.6,
                                    boxstyle="round,pad=0.02,rounding_size=0.5",
                                    linewidth=0, facecolor=color, zorder=4))
        # Label
        ax.text(bar_x + bar_w_max + 1.5, y + 0.5,
                f"{val} min indicative upper FRL",
                color=NAVY, fontsize=10, fontweight="bold", va="center",
                zorder=5)

    # Element rows
    rows = [
        ("External wall (≤ 1.5 m to boundary)", "240/240/240", "120/120/120", "90/60/30"),
        ("Internal loadbearing wall",            "240/240/240", "120/120/120", "60/60/60"),
        ("Floor",                                 "120/120/120", "90/90/90",   "60/60/60"),
        ("SOU separating wall (Class 2/3)",       "90/90/90",    "60/60/60",   "60/60/60"),
        ("Roof",                                  "90/60/30",    "60/30/30",   "—"),
    ]
    table_x = 5
    table_y_top = 26
    row_h = 3.4
    col_widths = [30, 13, 13, 13]
    headers = ["Element", "Type A", "Type B", "Type C"]
    cur_x = table_x
    for i, h in enumerate(headers):
        shadow_box(ax, cur_x, table_y_top, col_widths[i], row_h, GOLD,
                   radius=0.3, zorder=2)
        ax.text(cur_x + col_widths[i] / 2, table_y_top + row_h / 2, h,
                color="white", ha="center", va="center",
                fontsize=10, fontweight="bold", zorder=5)
        cur_x += col_widths[i]

    for i, row in enumerate(rows):
        ry = table_y_top - (i + 1) * row_h
        bg = "white" if i % 2 == 0 else CREAM
        cx = table_x
        for j, val in enumerate(row):
            shadow_box(ax, cx, ry, col_widths[j], row_h, bg,
                       radius=0.2, zorder=2)
            color = NAVY
            font_w = "normal"
            if j == 1:
                color = RED_A
                font_w = "bold"
            elif j == 2:
                color = ORANGE_B
                font_w = "bold"
            elif j == 3:
                color = GREEN_C
                font_w = "bold"
            ax.text(cx + col_widths[j] / 2 if j > 0 else cx + 0.6,
                    ry + row_h / 2, val,
                    color=color, ha="center" if j > 0 else "left",
                    va="center", fontsize=9.5, fontweight=font_w, zorder=5)
            cx += col_widths[j]

    # Right column — compartment / exit reminders
    panel_x = 75
    panel_w = 22
    items = [
        ("Class 6 retail",     "Max compartment 5 500 m²;\ntravel to point of choice 20 m; 2 exits."),
        ("Class 7a carpark",   "8 000 m² if sprinklered;\n40 m travel distance; 2 exits."),
        ("Class 9a hospital",  "2 000 m²; 12 m travel\nwithin patient-care area."),
        ("Class 9c aged care", "500 m² resident-use area;\ntighter smoke comp / travel."),
        ("Exit principle",     "Two exits from each storey above\nground unless concession applies."),
    ]
    y = 52
    for hd, sub in items:
        shadow_box(ax, panel_x, y - 3.2, panel_w, 3.6, "white",
                   radius=0.4, zorder=2)
        ax.text(panel_x + 0.6, y - 0.7, hd, fontsize=10.5, color=NAVY,
                fontweight="bold", va="center", zorder=5)
        ax.text(panel_x + 0.6, y - 2.0, sub, fontsize=8.6, color=SLATE,
                va="center", zorder=5)
        y -= 5.0

    pdf.savefig(fig)
    plt.close(fig)


# ---------------------------------------------------------------------------
# Build all
# ---------------------------------------------------------------------------
def main(out_pdf, out_png_dir=None):
    os.makedirs(os.path.dirname(out_pdf), exist_ok=True)
    if out_png_dir:
        os.makedirs(out_png_dir, exist_ok=True)

    with PdfPages(out_pdf) as pdf:
        page_hero(pdf)
        page_type_a(pdf)
        page_type_b(pdf)
        page_type_c(pdf)
        page_systems_matrix(pdf)
        page_frl(pdf)

    print(f"PDF written: {out_pdf}")

    if out_png_dir:
        # Also export each page as a PNG for embedding in Excel / web.
        from pdf2image import convert_from_path  # optional
        images = convert_from_path(out_pdf, dpi=180)
        for i, im in enumerate(images, start=1):
            p = os.path.join(out_png_dir, f"page_{i:02d}.png")
            im.save(p, "PNG")
            print(f"  wrote {p}")


if __name__ == "__main__":
    import sys
    out = sys.argv[1] if len(sys.argv) > 1 else "Building_Types_NCC2022_v2.pdf"
    main(out, out_png_dir=None)
