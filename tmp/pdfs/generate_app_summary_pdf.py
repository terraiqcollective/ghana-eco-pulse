from io import BytesIO
from pathlib import Path

from pypdf import PdfReader
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer


ROOT = Path(r"C:\Users\zutad\Desktop\web_app")
OUTPUT_DIR = ROOT / "output" / "pdf"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_PDF = OUTPUT_DIR / "ghana-eco-pulse-app-summary.pdf"


CONTENT = {
    "title": "App Summary",
    "app_name": "Ghana Eco-Pulse",
    "what_it_is": (
        "A one-page summary of the repo-backed web app: an interactive Next.js platform for "
        "mapping forest carbon stock and mining-driven carbon loss in Ghana's high forest zone. "
        "The app combines geospatial map layers, KPI views, and charts powered by Google Earth Engine data."
    ),
    "who_its_for": (
        "Primary persona: environmental regulators and climate/forestry analysts who need "
        "a browser-based way to inspect mining-related forest carbon impacts by year, region, and district."
    ),
    "features": [
        "Interactive Leaflet map with carbon, mining, region, and district layers.",
        "Year-based analysis with metadata-driven available years from Earth Engine.",
        "Region and district drill-down, including clickable boundary selection on the map.",
        "KPI cards for forest carbon stock and mining-driven carbon loss.",
        "Trend and balance charts rendered in the dashboard for comparison over time.",
        "Basemap switching, responsive panels, and mobile filter/metrics navigation.",
        "Error handling and loading states around map, metadata, district, and metrics requests.",
    ],
    "architecture": [
        "UI: `app/page.js` renders `Dashboard` inside `ErrorBoundary`; `Dashboard` manages filters, selected layers, compare mode, and data fetches.",
        "Map: `app/components/Map.js` uses React Leaflet to draw basemaps, GeoJSON boundaries, and raster tile URLs returned by the server.",
        "Services: Next.js API routes under `app/api/gee/*` expose metadata, districts, metrics, boundaries, layers, and auth helpers.",
        "Data: `lib/gee-server.js` initializes Google Earth Engine with environment credentials and asset IDs, then routes query FeatureCollections/ImageCollections.",
        "Flow: browser selection -> Next API route -> Earth Engine query/aggregation -> JSON or tile URL response -> dashboard KPIs, charts, and map layers.",
    ],
    "run_steps": [
        "`npm install`",
        "Create `.env.local` with the GEE vars referenced in `lib/gee-server.js` and the API routes: `PRIVATE_KEY`, `SERVICE_EMAIL`, `PROJECT_ID`, `CARBON_FC`, `MINING_FC`, `PILOT_AREA`, `CARBON_VIS`, `MINING_VIS`, `FULL_DISTRICTS_FC`, `FULL_REGIONS_FC`.",
        "`npm run dev` and open `http://localhost:3000`.",
        "How to obtain or provision valid Earth Engine credentials/assets: Not found in repo.",
    ],
}


def make_styles(body_size: int, bullet_size: int):
    styles = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            "Title",
            parent=styles["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=20,
            leading=22,
            textColor=colors.HexColor("#14342B"),
            spaceAfter=4,
            alignment=TA_LEFT,
        ),
        "subtitle": ParagraphStyle(
            "Subtitle",
            parent=styles["BodyText"],
            fontName="Helvetica-Bold",
            fontSize=10,
            leading=12,
            textColor=colors.HexColor("#A06A10"),
            spaceAfter=10,
        ),
        "heading": ParagraphStyle(
            "Heading",
            parent=styles["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=10,
            leading=12,
            textColor=colors.HexColor("#14342B"),
            spaceBefore=4,
            spaceAfter=4,
        ),
        "body": ParagraphStyle(
            "Body",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=body_size,
            leading=body_size + 2,
            textColor=colors.HexColor("#222222"),
            spaceAfter=5,
        ),
        "bullet": ParagraphStyle(
            "Bullet",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=bullet_size,
            leading=bullet_size + 2,
            leftIndent=0,
            textColor=colors.HexColor("#222222"),
        ),
        "footer": ParagraphStyle(
            "Footer",
            parent=styles["BodyText"],
            fontName="Helvetica-Oblique",
            fontSize=7,
            leading=9,
            textColor=colors.HexColor("#666666"),
            spaceBefore=6,
        ),
    }


def bullet_paragraphs(items, style, bullet_color):
    paragraphs = []
    for item in items:
        paragraphs.append(
            Paragraph(
                f'<font color="{bullet_color}"><b>-</b></font> {item}',
                style,
            )
        )
    paragraphs.append(Spacer(1, 2))
    return paragraphs


def build_story(styles):
    story = [
        Paragraph(CONTENT["title"], styles["title"]),
        Paragraph(CONTENT["app_name"], styles["subtitle"]),
        Paragraph("<b>What it is</b>", styles["heading"]),
        Paragraph(CONTENT["what_it_is"], styles["body"]),
        Paragraph("<b>Who it's for</b>", styles["heading"]),
        Paragraph(CONTENT["who_its_for"], styles["body"]),
        Paragraph("<b>What it does</b>", styles["heading"]),
        *bullet_paragraphs(CONTENT["features"], styles["bullet"], "#A06A10"),
        Paragraph("<b>How it works</b>", styles["heading"]),
        *bullet_paragraphs(CONTENT["architecture"], styles["bullet"], "#14342B"),
        Paragraph("<b>How to run</b>", styles["heading"]),
        *bullet_paragraphs(CONTENT["run_steps"], styles["bullet"], "#14342B"),
        Spacer(1, 2),
        Paragraph(
            "Source basis: repo README, `package.json`, `app/page.js`, dashboard/map components, and `app/api/gee/*` routes. "
            "Items unavailable in code/docs are marked as Not found in repo.",
            styles["footer"],
        ),
    ]
    return story


def build_pdf_bytes(body_size: int, bullet_size: int) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=0.6 * inch,
        rightMargin=0.6 * inch,
        topMargin=0.55 * inch,
        bottomMargin=0.45 * inch,
    )

    styles = make_styles(body_size, bullet_size)

    def draw_page(canvas, doc):
        canvas.saveState()
        canvas.setFillColor(colors.HexColor("#F5F1E7"))
        canvas.rect(0, 0, doc.pagesize[0], doc.pagesize[1], fill=1, stroke=0)
        canvas.setFillColor(colors.HexColor("#14342B"))
        canvas.rect(0, doc.pagesize[1] - 18, doc.pagesize[0], 18, fill=1, stroke=0)
        canvas.setFillColor(colors.HexColor("#C08A2E"))
        canvas.rect(0, 0, doc.pagesize[0], 8, fill=1, stroke=0)
        canvas.restoreState()

    doc.build(build_story(styles), onFirstPage=draw_page, onLaterPages=draw_page)
    return buffer.getvalue()


def ensure_single_page():
    for body_size, bullet_size in [(9, 9), (8, 8), (7, 7)]:
        pdf_bytes = build_pdf_bytes(body_size, bullet_size)
        if len(PdfReader(BytesIO(pdf_bytes)).pages) == 1:
            OUTPUT_PDF.write_bytes(pdf_bytes)
            return
    raise RuntimeError("Could not fit content onto a single page.")


if __name__ == "__main__":
    ensure_single_page()
    print(OUTPUT_PDF)
