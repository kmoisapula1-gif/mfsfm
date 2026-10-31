import json
import re
"""Builds the Moisapula Facilities Solutions static site into ./site.

Edit copy and contact details here, run `python3 build.py`, then commit ./site
(Vercel serves it as-is).
"""
from pathlib import Path

# ---------------------------------------------------------------------------
# CONTACT DETAILS: fill these in before going live.
# Leave PHONE_TEL / WHATSAPP empty and the Call / WhatsApp buttons are hidden
# (visitors are sent to the assessment form instead).
# ---------------------------------------------------------------------------
EMAIL = "info@mfscentral.co.za"
PHONE_DISPLAY = "+27 76 298 5243"
PHONE_TEL = "+27762985243"
WHATSAPP = "27762985243"
SITE = "https://www.mfsfm.co.za"

OUT = Path(__file__).parent / "site"

ICON = {
    "clean": '<path d="M12 2.5 C12 2.5 5 10 5 14.5 a7 7 0 0 0 14 0 C19 10 12 2.5 12 2.5 Z"/><path d="M9 15 a3 3 0 0 0 3 3"/>',
    "grounds": '<path d="M5 19 C5 10 11 4 20 4 C20 13 14 19 5 19 Z"/><path d="M5 19 L13 11"/>',
    "property": '<path d="M14.5 6.5 a4 4 0 0 0 5 5 L12 19 a2.1 2.1 0 0 1 -3 -3 Z"/><path d="M14.5 6.5 L17 4 a4 4 0 0 1 3 3 L17.5 9.5"/><path d="M4 20 L9 15"/>',
    "support": '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20 a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5 a3.5 3.5 0 0 1 0 7"/><path d="M18 14 a6.5 6.5 0 0 1 3.5 6"/>',
    "build": '<path d="M3 21 L21 21"/><path d="M5 21 L5 9 L12 4 L19 9 L19 21"/><path d="M9 21 L9 14 L15 14 L15 21"/>',
}
ICON_STROKE = {"clean": "#114B36", "grounds": "#114B36", "property": "#114B36", "support": "#FFFFFF", "build": "#114B36"}
PROP_ICON = {
    "office": '<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2M11 21v-3h2v3"/>',
    "estate": '<path d="M3 11 L8 7 L13 11 V20 H3 Z"/><path d="M11 9 L16 5 L21 9 V20 H13"/><path d="M6 20v-4h4v4"/>',
    "home": '<path d="M3 11.5 L12 4 L21 11.5"/><path d="M5.5 9.5V20h13V9.5"/><path d="M10 20v-5h4v5"/>',
    "industrial": '<path d="M3 20V10l5 3V10l5 3V10l5 3V5h3v15Z"/><path d="M7 17h2M12 17h2"/>',
    "retail": '<path d="M5 8h14l-1 12H6Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    "education": '<path d="M2 9 L12 4 L22 9 L12 14 Z"/><path d="M6 11v5c3 2 9 2 12 0v-5"/>',
    "government": '<path d="M3 9 L12 4 L21 9"/><path d="M5 9v9M9 9v9M15 9v9M19 9v9M3 20h18"/>',
}
CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5 L10 17 L19 7"/></svg>'
CHECK_DIV = CHECK.replace('stroke="currentColor"', 'style="stroke:var(--div)"')
PHONE_SVG = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>'
CHAT_SVG = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.8 7L4 20l1.1-4.6A8 8 0 1 1 21 12Z"/></svg>'
MAIL_SVG = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>'


def icon(key, size=26):
    return (f'<span class="icon-dot div-{key}"><svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" '
            f'stroke="{ICON_STROKE[key]}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{ICON[key]}</svg></span>')


def prop_icon(key):
    return (f'<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.8" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{PROP_ICON[key]}</svg>')


def btn(href, long, short=None, cls="btn-sun", arrow=False, extra=""):
    """A button with a full label on desktop and a 2-3 word label on phones."""
    a = ' <span class="arr" aria-hidden="true">&rarr;</span>' if arrow else ""
    if short and short != long:
        label = f'<span class="lbl-lg">{long}{a}</span><span class="lbl-sm">{short}{a}</span>'
    else:
        label = f"{long}{a}"
    return f'<a class="btn {cls}" href="{href}"{extra}>{label}</a>'


PHOTO_SIZES = json.loads((OUT / "assets/img/photos/sizes.json").read_text())


def photo(name, alt, cls="", sizes="(max-width: 960px) 100vw, 50vw", pos=None, eager=False):
    w, h = PHOTO_SIZES[name]
    style = f' style="object-position:{pos}"' if pos else ""
    load = 'fetchpriority="high"' if eager else 'loading="lazy" decoding="async"'
    return (f'<picture class="{cls}"><source type="image/webp" srcset="assets/img/photos/{name}.webp">'
            f'<img src="assets/img/photos/{name}.jpg" alt="{alt}" width="{w}" height="{h}" {load}{style}></picture>')


def eco_logo(h=28, cls="eco-badge", caption=""):
    w = round(h * 600 / 193)
    cap = f'<span class="eco-cap">{caption}</span>' if caption else ""
    return f'<span class="{cls}"><img src="assets/img/ecotech-logo.png" alt="Ecotech Engineering Africa" width="{w}" height="{h}" loading="lazy">{cap}</span>'


def director_href():
    return f"tel:{PHONE_TEL}" if PHONE_TEL else "contact.html#director"


def whatsapp_href(text="Hello MFS, I would like to discuss facilities services for my site."):
    from urllib.parse import quote
    return f"https://wa.me/{WHATSAPP}?text={quote(text)}" if WHATSAPP else ""


NAV = [("index.html", "Home"), ("about.html", "About"), ("services.html", "Services"),
       ("industries.html", "Industries"), ("contact.html", "Contact")]

DIVISIONS = {
    "cleaning": {
        "key": "clean", "file": "cleaning.html", "name": "Cleaning & Hygiene",
        "tagline": "Clean, healthy spaces, every day.",
        "pitch": "Professional cleaning and hygiene solutions that keep workplaces, estates, homes and public areas healthy, safe and well presented.",
        "intro": "Daily, scheduled and once-off cleaning, delivered by trained, uniformed teams with the right equipment and consumables.",
        "highlights": ["Office, estate and home cleaning", "Deep cleaning", "Washroom hygiene", "Pressure washing"],
        "cta": ("Request a Cleaning Proposal", "Get Cleaning Quote"), "card_cta": "Get Cleaning Quote",
        "services": [
            ("General office cleaning", "Daily and scheduled cleaning of workspaces, kitchens and boardrooms."),
            ("Estate and common area cleaning", "Entrances, clubhouses, walkways and shared facilities."),
            ("Home cleaning", "Regular, spring and move-in or move-out cleans for private homes."),
            ("Deep cleaning", "Periodic intensive cleans, including carpets and hard floors."),
            ("Hygiene and washroom services", "Sanitiser, hygiene units and sanitary bin servicing."),
            ("Consumable supply management", "Toilet paper, hand towels and soap, monitored and replenished."),
            ("Window and glass cleaning", "Interior and exterior glazing and shopfronts."),
            ("High-level cleaning", "Ceilings, light fittings and high surfaces, using safe work-at-height methods."),
            ("Post-construction cleaning", "Builders' cleans that get new or renovated spaces ready for handover."),
            ("Pressure washing", "Paving, walls, parking areas and bin areas."),
        ],
        "safety": ["Colour-coded cloths and mops to prevent cross-contamination",
                   "Safety data sheets for every chemical on site",
                   "Safe work-at-height methods for high-level cleaning",
                   "Supervisor inspections against an agreed checklist"],
        "serve": ["Commercial offices", "Residential estates", "Residential homes", "Retail centres", "Schools", "Industrial facilities", "Public sector"],
    },
    "grounds": {
        "key": "grounds", "file": "grounds.html", "name": "Grounds & Landscaping",
        "tagline": "Outdoor spaces that make a first impression.",
        "pitch": "Grounds care and landscaping that keep homes, estates, office parks and facilities neat, green and inviting all year round.",
        "intro": "Scheduled grounds programmes and once-off projects, delivered by trained teams with well-maintained equipment.",
        "highlights": ["Lawn and garden care", "Bush clearing", "Irrigation installation", "Once-off projects"],
        "cta": ("Discuss Landscaping Requirements", "Get Landscaping Quote"), "card_cta": "Get Landscaping Quote",
        "services": [
            ("Lawn maintenance", "Mowing, edging and lawn health care."),
            ("Garden services", "Beds, pruning, mulching and general upkeep."),
            ("Tree trimming and pruning", "Shaping, thinning and safe removal of branches."),
            ("Bush clearing", "Overgrown areas and vacant land cleared safely."),
            ("Weed control", "Paving, beds and verges kept weed-free."),
            ("Seasonal planting", "Colour and planting refreshed each season."),
            ("Irrigation installation and monitoring", "New systems installed; existing ones checked for leaks and coverage."),
            ("Garden refuse and waste clearing", "Green waste and site rubbish removed to licensed sites."),
            ("Grounds maintenance programmes", "A scheduled plan agreed for every site."),
            ("Once-off projects", "Garden makeovers, instant lawn and landscape installations."),
        ],
        "safety": ["Trained operators and full PPE for mowers, brushcutters and chainsaws",
                   "Water-wise practices and indigenous planting",
                   "Garden refuse removed to licensed sites, never dumped or burned",
                   "Scheduled programmes agreed and inspected per site"],
        "serve": ["Residential estates", "Residential homes", "Office parks", "Industrial facilities", "Schools", "Retail centres", "Public sector"],
    },
    "property": {
        "key": "property", "file": "property-care.html", "name": "Property Care & Building Works",
        "tagline": "From small repairs to major works.",
        "pitch": "Proactive maintenance and repairs from MFS's own teams, with specialist building and civil works delivered through our partner, Ecotech Engineering.",
        "intro": "Inspection-led maintenance from our own teams. We document condition, risk and cost clearly, so you can make informed decisions about your property.",
        "highlights": ["Repairs and painting", "Paving repairs", "Rubble removal", "Building inspections"],
        "cta": ("Book a Site Inspection", "Book Inspection"), "card_cta": "Book Site Inspection",
        "services": [
            ("Minor repairs and maintenance", "Doors, locks, fittings and everyday fixes."),
            ("Painting and touch-ups", "Interior and exterior refreshes."),
            ("Paving repairs", "Lifted, cracked and sunken paving restored."),
            ("Rubble removal", "Building rubble and debris cleared and removed."),
            ("General handyman services", "A reliable pair of hands on call."),
            ("Building inspections", "Condition checks with photo reports and priorities."),
            ("Preventative maintenance support", "Scheduled checks that catch small problems before they become expensive ones."),
        ],
        "safety": ["Risk assessment and method statement before work starts",
                   "Photo-documented inspections and condition reports",
                   "Construction Regulations compliance on building projects, with Ecotech",
                   "Rubble and waste removed responsibly"],
        "serve": ["Residential estates", "Residential homes", "Commercial offices", "Retail centres", "Industrial facilities", "Schools", "Public sector"],
    },
    "support": {
        "key": "support", "file": "support-services.html", "name": "Support Services",
        "tagline": "Extra hands when your operations need them.",
        "pitch": "Flexible support solutions, from events to everyday site needs, tailored to your requirements.",
        "intro": "Reliable, inducted people and coordinated support for the moments your site needs more than its usual team.",
        "highlights": ["Event support", "Waste coordination", "Site support personnel", "Once-off or ongoing"],
        "cta": ("Talk to Our Team", "Talk to Our Team"), "card_cta": "Talk to Our Team",
        "services": [
            ("Event support services", "Setup, cleaning and site support before, during and after events."),
            ("Waste management coordination", "Bin areas, scheduled removals and recycling, coordinated with licensed providers."),
            ("Facilities assistance", "General help with day-to-day facility tasks."),
            ("Site support personnel", "Reliable, inducted staff for day-to-day site needs."),
            ("General operational support", "Flexible help for peak periods and short-term operational needs."),
        ],
        "safety": ["Vetted, inducted and uniformed staff",
                   "Site-specific safety briefings before work starts",
                   "Waste handled through licensed providers",
                   "One coordinator per event or assignment"],
        "serve": ["Commercial offices", "Residential estates", "Retail centres", "Industrial facilities", "Schools", "Public sector"],
    },
}
BUILD = ["Civil construction", "Paving and surfacing", "Stormwater systems", "Building refurbishment",
         "Concrete works", "Infrastructure maintenance", "Building maintenance and upgrades"]

STEPS = [("Site assessment", "We visit your site and identify operational requirements."),
         ("Tailored solution", "A detailed proposal with service scope, staffing and KPIs."),
         ("Accountable delivery", "Dedicated teams, supervision and quality controls."),
         ("Reporting and improvement", "Monthly reporting, inspections and service reviews.")]

CHOOSE = [("Owner-managed", "The founder is involved on every account and answers the phone."),
          ("Single point of accountability", "One contact, one invoice and one report across every service."),
          ("Monthly reporting", "Photos, inspection scores and open issues, every month."),
          ("Safety-driven", "Risk assessments, PPE and site procedures as standard."),
          ("Flexible contracts", "Once-off, scheduled or full service contracts."),
          ("Specialist partner", "Building and civil works through Ecotech Engineering.")]

COMMITMENTS = ["Professional appearance", "Trained personnel", "Consistent communication", "Regular site inspections",
               "Monthly reporting", "Health and safety compliance", "Quality-focused delivery"]

INDUSTRIES = [("estate", "Residential estates", "Common areas, landscaping and property care."),
              ("home", "Residential homes", "Home cleaning, garden services, repairs and building works for homeowners."),
              ("office", "Commercial offices", "Cleaning, hygiene and maintenance services."),
              ("retail", "Retail centres", "Public area cleaning, washrooms and support services."),
              ("industrial", "Industrial facilities", "Cleaning, grounds and operational support."),
              ("education", "Educational institutions", "Cleaning, hygiene and exterior maintenance."),
              ("government", "Government and public sector", "Facilities support and maintenance solutions.")]


def head(title, description, path):
    return f"""<!doctype html>
<html lang="en-ZA">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title}</title>
<meta name="description" content="{description}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{description}">
<meta property="og:type" content="website">
<meta property="og:url" content="{SITE}/{'' if path == 'index.html' else path.replace('.html', '')}">
<meta property="og:image" content="{SITE}/assets/img/og-image.png">
<meta name="theme-color" content="#114B36">
<link rel="icon" type="image/png" sizes="32x32" href="assets/img/favicon-32.png">
<link rel="apple-touch-icon" href="assets/img/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;600;700;900&amp;display=swap">
<link rel="stylesheet" href="assets/css/site.css">
</head>
<body>
"""


CHEV = '<svg class="chev" viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><path d="M3 4.5 L6 7.5 L9 4.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'


def logo_svg():
    """The horizontal logo inline, so the dots can pulse and a gold light can travel the bar."""
    s = (OUT / "assets/img/logo-horizontal.svg").read_text()
    s = s.replace('<svg ', '<svg class="logo-svg" role="img" aria-label="Moisapula Facilities Solutions" ', 1)
    s = s.replace('<circle cx="14.52"', '<circle class="lg-dot" cx="14.52"', 1).replace('<circle cx="210.02"', '<circle class="lg-dot lg-dot-2" cx="210.02"', 1)
    pulse = ('<circle class="lg-pulse lg-trail" r="4.2" fill="#D9A441" opacity="0"/>'
             '<circle class="lg-pulse" r="3.1" fill="#FFF3D6" opacity="0"/>')
    return s.replace("</svg>", pulse + "</svg>")


def mega_services():
    items = []
    for slug in ["cleaning", "grounds", "property", "support"]:
        d = DIVISIONS[slug]
        items.append(f'<a class="mega-item" href="{d["file"]}">{icon(d["key"])}<span><b>{d["name"].replace("&", "&amp;")}</b><small>{d["tagline"]}</small></span></a>')
    items.append(f'<a class="mega-item" href="property-care.html#building">{icon("build")}<span><b>Building &amp; Civil Works</b><small class="mega-eco">Delivered with {eco_logo(14, "eco-inline")}</small></span></a>')
    return f'''<div class="mega mega-services" role="group" aria-label="Services">
          <div class="mega-grid">{''.join(items)}</div>
          <div class="mega-aside">
            <span class="eyebrow">One partner</span>
            <p>Start with one service and add others under the same contract, with one monthly report.</p>
            <a class="mega-link" href="services.html">All services <span aria-hidden="true">&rarr;</span></a>
            <a class="btn btn-sun mega-btn" href="contact.html">Book a Free Assessment</a>
          </div>
        </div>'''


def mega_industries():
    links = []
    for i, (k, lbl, title, short, reqs, *_r, cta, cta_s) in enumerate(ENVS):
        links.append(f'<a class="mega-env{" is-on" if i == 0 else ""}" href="industries.html#{k}" data-title="{title}" data-short="{short}" data-reqs="{"|".join(reqs[:3])}" data-k="{k}">{prop_icon(k)}<span>{lbl}</span></a>')
    k, lbl, title, short, reqs = ENVS[0][:5]
    pills = "".join(f"<li>{r}</li>" for r in reqs[:3])
    return f'''<div class="mega mega-industries" role="group" aria-label="Industries">
          <div class="mega-envs">{''.join(links)}</div>
          <div class="mega-preview" aria-hidden="true">
            <span class="eyebrow">Built for</span>
            <b class="mp-title">{title}</b>
            <p class="mp-short">{short}</p>
            <ul class="mp-reqs">{pills}</ul>
            <span class="mega-link mp-go">See how we support it <span aria-hidden="true">&rarr;</span></span>
          </div>
        </div>'''


def header(current):
    items = []
    for href, label in NAV:
        cur = ' aria-current="page"' if href == current else ""
        if href == "services.html":
            items.append(f'<div class="nav-item has-mega"><a href="{href}"{cur} aria-haspopup="true">{label}{CHEV}</a>{mega_services()}</div>')
        elif href == "industries.html":
            items.append(f'<div class="nav-item has-mega"><a href="{href}"{cur} aria-haspopup="true">{label}{CHEV}</a>{mega_industries()}</div>')
        else:
            items.append(f'<div class="nav-item"><a href="{href}"{cur}>{label}</a></div>')
    call = f'<a class="nav-call" href="tel:{PHONE_TEL}" aria-label="Call {PHONE_DISPLAY}">{PHONE_SVG}<span>{PHONE_DISPLAY}</span></a>' if PHONE_TEL else ""
    extra = [f'<a class="btn btn-sun" href="contact.html">Get a Proposal <span class="arr" aria-hidden="true">&rarr;</span></a>']
    if PHONE_TEL:
        extra.append(f'<a class="btn btn-outline" href="tel:{PHONE_TEL}">{PHONE_SVG}<span>Call the Director</span></a>')
    if WHATSAPP:
        extra.append(f'<a class="btn btn-outline" href="{whatsapp_href()}" target="_blank" rel="noopener">{CHAT_SVG}<span>WhatsApp</span></a>')
    extra.append(f'<a class="btn btn-outline" href="mailto:{EMAIL}">{MAIL_SVG}<span>{EMAIL}</span></a>')
    return f"""<a class="skip" href="#main">Skip to content</a>
<header class="site-header">
  <div class="wrap nav-shell">
    <div class="nav-row">
      <span class="nav-ambient" aria-hidden="true"></span>
      <a class="brand" href="index.html">{logo_svg()}</a>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav"><span class="nt-lines" aria-hidden="true"><i></i><i></i></span><span class="nt-label">Menu</span></button>
      <nav id="site-nav" class="site-nav" aria-label="Main">
        <div class="nav-links"><span class="nav-pill" aria-hidden="true"></span>{''.join(items)}</div>
        <div class="nav-mobile-extra"><span class="eyebrow">Get in touch</span>{''.join(extra)}</div>
        {call}
        <a class="btn btn-sun nav-cta" href="contact.html">Get a Proposal <span class="arr" aria-hidden="true">&rarr;</span></a>
      </nav>
    </div>
  </div>
</header>
<main id="main">
"""


def mobile_bar():
    items = []
    if PHONE_TEL:
        items.append(f'<a href="tel:{PHONE_TEL}">{PHONE_SVG}<span>Call</span></a>')
    if WHATSAPP:
        items.append(f'<a href="{whatsapp_href()}" target="_blank" rel="noopener">{CHAT_SVG}<span>WhatsApp</span></a>')
    if not items:
        items.append(f'<a href="mailto:{EMAIL}">{MAIL_SVG}<span>Email</span></a>')
    items.append('<a class="go" href="contact.html">Get Quote</a>')
    return f'<nav class="mobile-bar" aria-label="Quick actions">{"".join(items)}</nav>'


def closing_cta():
    checks = "".join(f"<li>{CHECK.replace('currentColor', '#D9A441')}<span>{t}</span></li>" for t in
                     ["Free site assessment", "Tailored proposal", "Single point of accountability"])
    return f"""<section class="closing">
  <div class="wrap closing-grid">
    <div class="stack" style="gap:18px">
      <span class="bar"></span>
      <h2>Let's improve your property together</h2>
      <p class="lead">Whether you need cleaning, landscaping, maintenance or a complete facilities solution, we're ready to help.</p>
      <ul class="closing-checks">{checks}</ul>
    </div>
    <div class="closing-actions">
      {btn('contact.html', 'Request a Proposal', 'Get Quote')}
      {btn(director_href(), 'Talk to a Director', 'Talk to Director', 'btn-ghost')}
      <p class="closing-note">{EMAIL}<br>{PHONE_DISPLAY} · Gauteng</p>
    </div>
  </div>
</section>
"""


FOOTER = f"""</main>
<footer class="site-footer">
  <div class="wrap">
    <div class="footer-grid">
      <div class="footer-brand">
        <img src="assets/img/logo-horizontal-reversed.svg" alt="Moisapula Facilities Solutions" width="277" height="44">
        <p class="footer-tag">Connecting People,<br>Properties &amp; Performance.</p>
        <a class="footer-cta" href="contact.html">Get a Quote &rarr;</a>
      </div>
      <div>
        <h4>Services</h4>
        <ul>
          <li><a href="cleaning.html">Cleaning &amp; Hygiene</a></li>
          <li><a href="grounds.html">Grounds &amp; Landscaping</a></li>
          <li><a href="property-care.html">Property Care &amp; Building</a></li>
          <li><a href="support-services.html">Support Services</a></li>
        </ul>
      </div>
      <div>
        <h4>Company</h4>
        <ul>
          <li><a href="about.html">About us</a></li>
          <li><a href="about.html#founder">Meet the founder</a></li>
          <li><a href="industries.html">Industries</a></li>
          <li><a href="services.html#process">Our process</a></li>
        </ul>
      </div>
      <div>
        <h4>Contact</h4>
        <ul>
          <li>{EMAIL}</li>
          <li>{PHONE_DISPLAY}</li>
          <li>Gauteng, South Africa</li>
        </ul>
      </div>
    </div>
    <div class="footer-base">
      <span>&copy; 2026 Moisapula Facilities Solutions.</span>
      <span class="footer-partner">Building &amp; civil works delivered through {eco_logo(22)}</span>
    </div>
  </div>
</footer>
""" + mobile_bar() + """
<!--DOCK-->
<script src="assets/js/site.js"></script>
<script src="assets/js/motion.js" defer></script>
</body>
</html>
"""


def trust_graphic():
    return """<figure class="trust" aria-label="MFS connects client needs to successful outcomes">
  <div class="trust-node t1"><span class="dot"></span><b>CLIENT NEEDS</b><span>Clean, safe, working spaces</span></div>
  <div class="trust-line l1"></div>
  <div class="trust-core">
    <img src="assets/img/mark-reversed.svg" alt="" width="212" height="60">
    <div class="trust-roles"><span>Planning</span><span>Coordination</span><span>Accountability</span></div>
  </div>
  <div class="trust-line l2"></div>
  <div class="trust-node t3"><span class="dot"></span><b>SUCCESSFUL OUTCOME</b><span>Delivered, reported, improved</span></div>
  <figcaption>We connect clients, teams and specialist partners to deliver measurable results.</figcaption>
</figure>"""


def connection_model():
    """Hero centrepiece: Client needs -> MFS -> Successful outcome."""
    tip = lambda i, title, items: f"""<div class="acm-tip" role="tooltip" id="tip-{i}" data-for="{i}"><b>{title}</b><ul>{''.join(f'<li><strong>{a}</strong> {b}</li>' for a, b in items)}</ul></div>"""
    return f"""<div class="acm" data-acm>
  <p class="sr-only">MFS connects client needs to successful outcomes through planning, coordination and accountability.</p>
  <div class="acm-stage" aria-hidden="false">
    <svg class="acm-lines" aria-hidden="true" focusable="false">
      <path class="acm-line l1" pathLength="1" d="M0 0"/>
      <path class="acm-line l2" pathLength="1" d="M0 0"/>
      <circle class="acm-pulse halo" r="9"/><circle class="acm-pulse" r="3.5"/>
    </svg>
    <div class="acm-rail" aria-hidden="true"></div>
    <div class="acm-node n-client" data-node="client">
      <button type="button" class="acm-dot" aria-label="Client needs" aria-describedby="tip-client"><span class="outer"></span><span class="ring"></span><span class="core"></span></button>
      <div class="acm-label"><b>Client needs</b><span>Clean · Safe · Operational</span></div>
    </div>
    <div class="acm-core" data-node="mfs">
      <img class="acm-mark" src="assets/img/mark-reversed.svg" alt="" width="529" height="150">
      <canvas class="acm-canvas" aria-hidden="true"></canvas>
      <button type="button" class="acm-hit" aria-label="MFS" aria-describedby="tip-mfs"></button>
    </div>
    <div class="acm-node n-outcome" data-node="outcome">
      <button type="button" class="acm-dot" aria-label="Successful outcome" aria-describedby="tip-outcome"><span class="outer"></span><span class="ring"></span><span class="core"></span></button>
      <div class="acm-label"><b>Successful outcome</b><span>Delivered · Reported · Improved</span></div>
    </div>
  </div>
  <div class="acm-roles" aria-hidden="true"><span>Planning</span><span>Coordination</span><span>Accountability</span></div>
  <div class="acm-tips">
    {tip('client', 'Client needs', [('Clean facilities', 'that make the right impression'), ('Safe environments', 'for staff, residents and visitors'), ('A reliable partner', 'who answers and takes ownership')])}
    {tip('mfs', 'MFS', [('Planning', 'every site scoped and scheduled'), ('Coordination', 'one team across all services'), ('Accountability', 'one point of contact, clear reporting')])}
    {tip('outcome', 'Successful outcome', [('Delivered', 'to the agreed scope and standard'), ('Maintained', 'with inspections and reporting'), ('Improved', 'through regular reviews')])}
  </div>
  <ol class="acm-flow" aria-label="How MFS works">
    <li class="acm-card"><span class="acm-dot-sm"></span><b>Client needs</b><span>Clean facilities, safe environments and a reliable partner.</span></li>
    <li class="acm-card acm-card--core"><img src="assets/img/mark-reversed.svg" alt="MFS" width="170" height="48"><span>Planning · Coordination · Accountability</span></li>
    <li class="acm-card"><span class="acm-dot-sm"></span><b>Successful outcome</b><span>Delivered, maintained and improved.</span></li>
  </ol>
</div>"""


def division_card(slug):
    d = DIVISIONS[slug]
    items = "".join(f"<li>{h}</li>" for h in d["highlights"])
    return f"""<div class="card division-card div-{d['key']}">
  <span class="top"></span>
  <div class="body">
    {icon(d['key'])}
    <h3><a class="stretch" href="{d['file']}">{d['name'].replace('&', '&amp;')}</a></h3>
    <p class="div-tag">{d['tagline']}</p>
    <ul>{items}</ul>
    <div class="card-actions">
      <a class="card-cta" href="contact.html#{slug}">{d['card_cta']} &rarr;</a>
      <a class="card-more" href="{d['file']}">Learn more</a>
    </div>
  </div>
</div>"""


def blueprint():
    """Ecotech illustration: blueprint grid -> wireframe -> finished structure (animated by motion.js)."""
    win = "".join(f'<rect class="bp-fill bp-win" x="{x}" y="{y}" width="22" height="18" rx="2"/>' for x in (92, 132, 172, 212) for y in (74, 117))
    win += "".join(f'<rect class="bp-fill bp-win" x="{x}" y="128" width="18" height="16" rx="2"/>' for x in (254, 290))
    lines = [
        ("M20 192 H380", 0), ("M70 192 V60 H240 V192", 1), ("M240 192 V110 H330 V192", 2),
        ("M70 103 H240", 3), ("M70 146 H240", 4), ("M60 60 L155 30 L250 60", 5),
        ("M140 192 V164 H170 V192", 6), ("M350 192 V40 H300 M350 48 L318 40", 7),
    ]
    paths = "".join(f'<path class="bp-line" pathLength="1" d="{d}" style="--i:{i}"/>' for d, i in lines)
    return f"""<figure class="blueprint" aria-label="Illustration: a building drawn from blueprint to finished structure">
  <svg viewBox="0 0 400 210" aria-hidden="true" focusable="false">
    <defs><pattern id="bp-grid" width="16" height="16" patternUnits="userSpaceOnUse"><path d="M16 0H0V16" fill="none" stroke="currentColor" stroke-width="0.6"/></pattern></defs>
    <rect class="bp-grid" x="0" y="0" width="400" height="210" fill="url(#bp-grid)"/>
    <g class="bp-solid"><rect class="bp-fill bp-body" x="70" y="60" width="170" height="132"/><rect class="bp-fill bp-body2" x="240" y="110" width="90" height="82"/><path class="bp-fill bp-roof" d="M60 60 L155 30 L250 60 Z"/>{win}<rect class="bp-fill bp-door" x="140" y="164" width="30" height="28"/></g>
    <g class="bp-wire">{paths}</g>
    <path class="bp-dim" d="M70 204 H240 M70 200 V208 M240 200 V208"/>
  </svg>
  <figcaption class="bp-stages"><span>Plan</span><span>Engineer</span><span>Deliver</span></figcaption>
</figure>"""


def ecotech_section():
    caps = "".join(f"<li>{CHECK.replace('currentColor', '#8A96A8')}<span>{b}</span></li>" for b in BUILD[:6])
    return f"""<section class="section section--navy ecotech" id="building">
  <div class="wrap two-col">
    <div class="stack" style="gap:18px">
      <span class="bar" style="background:var(--c-build)"></span><span class="eyebrow">Strategic partnership</span>
      <h2>Specialist building &amp; civil works</h2>
      <p class="lead" style="color:var(--sky)">Building and civil works are delivered through our strategic partnership with Ecotech Engineering. MFS clients access qualified engineering expertise while keeping a single point of accountability.</p>
      <div class="btn-row">
        {btn('contact.html#property', 'Request Building Works Assessment', 'Request Assessment')}
        {btn('property-care.html#building', 'Discuss a Building Project', 'Discuss Project', 'btn-ghost')}
      </div>
    </div>
    <div class="partner-card">
      <div class="eco-head">{eco_logo(40)}<div><b>Ecotech Engineering Africa</b><span>MFS's building and civil works partner</span></div></div>
      {blueprint()}
      <ul class="checks cap-list" style="grid-template-columns:1fr 1fr">{caps}</ul>
    </div>
  </div>
</section>"""


def steps_html():
    cells = "".join(f'<li class="card step"><span class="step-num">{i}</span><h3>{t}</h3><p>{d}</p></li>' for i, (t, d) in enumerate(STEPS, 1))
    return f'<ol class="grid grid-4 steps">{cells}</ol>'


def choose_html(dark=False):
    cells = "".join(f'<div class="choose-card"><h3>{t}</h3><p>{d}</p></div>' for t, d in CHOOSE)
    return f'<div class="choose">{cells}</div>'


# ---------- Service tiles (home bento grid) ----------
TILES = [
    ("cleaning", "clean", "t-clean tile--dark", "cleaning.html", ["General office cleaning", "Estate and common area cleaning", "Home cleaning", "Deep cleaning", "Hygiene and washroom services", "Pressure washing"]),
    ("grounds", "grounds", "t-grounds", "grounds.html", None),
    ("property", "property", "t-property", "property-care.html", None),
    ("support", "support", "t-support", "support-services.html", None),
]


def tile(slug, key, cls, href, items):
    d = DIVISIONS[slug]
    items = items or d["highlights"]
    lis = "".join(f"<li>{i}</li>" for i in items)
    return f"""<article class="tile {cls} div-{key}">
  <svg class="tile-art" viewBox="0 0 24 24" aria-hidden="true">{ICON[key]}</svg>
  <div class="tile-head">{icon(key)}</div>
  <h3><a class="stretch" href="{href}">{d['name'].replace('&', '&amp;')}</a></h3>
  <p class="tile-tag">{d['tagline']}</p>
  <div class="tile-swap"><p class="tile-pitch">{d['pitch']}</p><ul class="tile-list">{lis}</ul></div>
  <div class="tile-actions"><a class="tile-cta" href="contact.html#{slug}">{d['card_cta']} <span aria-hidden="true">&rarr;</span></a><span class="tile-more" aria-hidden="true">View service</span></div>
</article>"""


def tiles_html():
    cells = "".join(tile(*t) for t in TILES)
    cells = cells.replace('<div class="tile-actions"><a class="tile-cta" href="contact.html#cleaning">',
        '<ul class="tile-modes" aria-label="Service options"><li><b>Daily</b>Offices and common areas</li><li><b>Scheduled</b>Weekly or monthly cleans</li><li><b>Once-off</b>Deep, spring and move-out cleans</li></ul><div class="tile-actions"><a class="tile-cta" href="contact.html#cleaning">', 1)
    build_lis = "".join(f"<li>{b}</li>" for b in BUILD[:5])
    cells += f"""<article class="tile t-build tile--dark div-build">
  <svg class="tile-art" viewBox="0 0 24 24" aria-hidden="true">{ICON['build']}</svg>
  <div class="tile-head">{icon('build')}<span class="tile-badge tile-badge--eco">With {eco_logo(18, "eco-inline")}</span></div>
  <h3><a class="stretch" href="property-care.html#building">Building &amp; Civil Works</a></h3>
  <p class="tile-tag">Specialist projects, one point of accountability.</p>
  <div class="tile-swap"><p class="tile-pitch">Building and civil works delivered through our strategic partner, Ecotech Engineering, managed by MFS from start to handover.</p><ul class="tile-list">{build_lis}</ul></div>
  <div class="tile-actions"><a class="tile-cta" href="contact.html#building">Discuss a Building Project <span aria-hidden="true">&rarr;</span></a><span class="tile-more" aria-hidden="true">View service</span></div>
</article>"""
    return f'<div class="bento">{cells}</div>'


# ---------- Contract timeline ----------
STEP_GETS = ["A free site visit and walk-through of your requirements.",
             "A written proposal within 5 working days.",
             "A named supervisor and an agreed service checklist.",
             "A monthly report with photos, plus regular service reviews."]


def timeline_html():
    steps = "".join(f"""<li class="tl-step"><span class="tl-node" aria-hidden="true">{i}</span><div class="tl-card"><span class="tl-kicker">Step {i}</span><h3>{t}</h3><p>{d}</p><p class="tl-get"><b>You get:</b> {g}</p></div></li>"""
                    for i, ((t, d), g) in enumerate(zip(STEPS, STEP_GETS), 1))
    return f'<div class="tl" data-tl><div class="tl-rail" aria-hidden="true"><i></i></div><ol>{steps}</ol></div>'


def process_section(sid, eyebrow, title, lead, cta_href, cta_long, cta_short, cls="section section--mist"):
    lead_html = f'<p class="lead">{lead}</p>' if lead else ""
    return f"""<section class="{cls}"{f' id="{sid}"' if sid else ''}>
  <div class="wrap process-grid">
    <div class="process-head">
      <span class="bar"></span><span class="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      {lead_html}
      <p class="process-note"><b>Ready to get started?</b> The first step is free.</p>
      {btn(cta_href, cta_long, cta_short, arrow=True)}
    </div>
    {timeline_html()}
  </div>
</section>"""


# ---------- Floating contact dock (desktop) ----------
def dock():
    items = []
    if PHONE_TEL:
        items.append(f'<a href="tel:{PHONE_TEL}">{PHONE_SVG}<span>Call</span></a>')
    if WHATSAPP:
        items.append(f'<a href="{whatsapp_href()}" target="_blank" rel="noopener">{CHAT_SVG}<span>WhatsApp</span></a>')
    items.append(f'<a href="mailto:{EMAIL}">{MAIL_SVG}<span>Email</span></a>')
    items.append('<a class="dock-go" href="contact.html">Get a Proposal <span aria-hidden="true">&rarr;</span></a>')
    return f'<nav class="dock" data-dock aria-label="Contact MFS" inert>{"".join(items)}</nav>'


def write(name, html):
    d = dock()
    if name == "contact.html":
        d = d.replace('<a class="dock-go" href="contact.html">Get a Proposal', '<a class="dock-go" href="#assess">Start Assessment')
    html = html.replace("<!--DOCK-->", d)
    (OUT / name).write_text(html, encoding="utf-8")


ENVS = [
    ("estate", "Estates", "Residential estates", "Common areas, landscaping and property care.",
     ["Common area cleaning", "Landscaping and irrigation", "Paving, painting and repairs", "Waste coordination"],
     ["Shared spaces in constant use", "Resident expectations and trustee reporting", "Kerb appeal and property value"],
     "Estate Care Package", "Cleaning, Grounds and Property Care under one contract, reporting to your trustees.", "Get Estate Proposal", "Estate Proposal"),
    ("home", "Homes", "Residential homes", "Cleaning, garden services, repairs and building works.",
     ["Regular and deep cleans", "Garden services", "Painting and repairs", "Building works via Ecotech"],
     ["Finding people you trust on your property", "Juggling several contractors", "Once-off jobs done properly"],
     "Home Care Package", "One vetted, uniformed team for the house, the garden and the repairs in between.", "Get Home Quote", "Home Quote"),
    ("office", "Offices", "Commercial offices", "Cleaning, hygiene and maintenance services.",
     ["Daily office cleaning", "Washrooms and consumables", "Repairs and preventative maintenance", "Event and day-to-day support"],
     ["High foot traffic", "Hygiene for staff and visitors", "First impressions"],
     "Workplace Package", "Cleaning &amp; Hygiene, Property Care and Support Services from one accountable partner.", "Get Office Proposal", "Office Proposal"),
    ("industrial", "Industrial", "Industrial facilities", "Cleaning, grounds and operational support.",
     ["Heavy-duty cleaning", "Grounds and perimeter maintenance", "Waste coordination", "Civil works via Ecotech"],
     ["Safety on active sites", "Operational uptime", "Large yards and perimeters"],
     "Integrated Facilities Package", "Cleaning, Grounds, Property Care and Building Works planned around your operations.", "Get Industrial Proposal", "Industrial Proposal"),
    ("retail", "Retail", "Retail centres", "Public area cleaning, washrooms and support services.",
     ["Public area and washroom cleaning", "Glass and pressure washing", "Repairs between trading hours", "Waste coordination"],
     ["Peak trading foot traffic", "Customer experience", "Work that can't disrupt trading"],
     "Centre Package", "Cleaning &amp; Hygiene, Property Care and Support Services scheduled around trading hours.", "Get Retail Proposal", "Retail Proposal"),
    ("education", "Education", "Educational institutions", "Classrooms, ablutions, grounds and maintenance.",
     ["Classroom and ablution cleaning", "Holiday deep cleans", "Sports fields and grounds", "Repairs and painting"],
     ["High occupancy", "Health of learners and staff", "Work planned around the school calendar"],
     "Campus Package", "Cleaning, Grounds and Property Care planned term by term.", "Get School Proposal", "School Proposal"),
    ("government", "Government", "Government and public sector", "Integrated, compliant facilities support.",
     ["Offices, public areas and washrooms", "Grounds maintenance programmes", "Maintenance and infrastructure works", "Site support and waste coordination"],
     ["Compliance and documentation", "Accountability across sites", "Service continuity"],
     "Public Sector Package", "Integrated facilities management with one accountable partner and documented reporting.", "Get Public Sector Proposal", "Public Sector Proposal"),
]



# =========================== HOME ===========================
selector_tabs = "".join(
    f'<button class="prop-tab" type="button" role="tab" aria-selected="{"true" if k == "estate" else "false"}" data-prop="{k}" id="tab-{k}">{prop_icon(k)}<span>{n.split(" and ")[0].replace("Educational institutions", "Education").replace("Government", "Government")}</span></button>'
    for k, n, _ in INDUSTRIES)

home = head("Moisapula Facilities Solutions | Facilities Management in Gauteng",
            "One accountable partner for cleaning, landscaping, maintenance, hygiene and specialist building works for homes, estates, offices, retail and industrial sites in Gauteng.",
            "index.html") + header("index.html") + f"""
<section class="hero hero--acm">
  <div class="acm-bg" aria-hidden="true"><span class="acm-grid"></span><span class="acm-glow"></span></div>
  <div class="hero-pin">
  <div class="wrap hero-grid">
    <div class="hero-copy">
      <span class="eyebrow">Facilities management without the hassle</span>
      <h1>Connecting People, Properties and Performance.</h1>
      <p class="lead">One partner for cleaning, landscaping, maintenance, hygiene and specialist building works. We help homes, estates, offices, retail centres and industrial facilities stay clean, safe and operational through accountable service delivery.</p>
      <div class="hero-cta">
        <div class="btn-row">
          {btn('contact.html', 'Request a Free Site Assessment', 'Free Assessment')}
          {btn(director_href(), 'Talk to a Director', 'Talk to Director', 'btn-ghost')}
        </div>
        <p class="cta-sub">Receive a tailored facilities proposal within 5 working days.</p>
      </div>
      <p class="service-line">Cleaning · Landscaping · Hygiene · Property Care · Support Services · Building &amp; Civil Works</p>
    </div>
    {connection_model()}
  </div>
  <p class="acm-cue" aria-hidden="true">Scroll to see how we connect</p>
  </div>
</section>
<div class="strip" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div>

<section class="glance" aria-label="MFS at a glance">
  <div class="wrap glance-grid">
    <div class="stat"><span class="num" data-count="5">5</span><span class="cap">Service divisions</span></div>
    <div class="stat"><span class="num" data-count="1">1</span><span class="cap">Point of accountability</span></div>
    <div class="stat"><span class="num"><span data-count="100">100</span>%</span><span class="cap">Owner-managed</span></div>
    <div class="stat"><span class="num"><span data-count="1">1</span> day</span><span class="cap">To reply to every request</span></div>
  </div>
</section>

<section class="section section--mist" id="selector">
  <div class="wrap">
    <div class="section-head">
      <span class="bar"></span><span class="eyebrow">Find the right service</span>
      <h2>What type of property do you look after?</h2>
      <p class="lead">Choose your property type to see the services we recommend.</p>
    </div>
    <div class="selector">
      <div class="prop-tabs" role="tablist" aria-label="Property type">{selector_tabs}</div>
      <div class="prop-panel" id="prop-panel" role="tabpanel" aria-live="polite">
        <div class="prop-head"><span class="eyebrow">Recommended for</span><h3 id="prop-title">Residential estates</h3><p id="prop-intro">Keep common areas clean, gardens green and the estate well maintained, with one partner reporting to your trustees.</p></div>
        <ul class="prop-recs" id="prop-recs"></ul>
        <div class="btn-row">
          <a class="btn btn-sun" id="prop-cta" href="contact.html#estate"><span class="lbl-lg">Get a Proposal for Your Estate</span><span class="lbl-sm">Get Proposal</span></a>
          <a class="btn btn-outline" href="services.html">View Services</a>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="section section--tiles">
  <div class="wrap">
    <div class="section-head">
      <span class="bar"></span><span class="eyebrow">Our services</span>
      <h2>One partner for every part of your property</h2>
      <p class="lead">Start with one service and add others under the same contract, with one account manager and one monthly report.</p>
    </div>
    {tiles_html()}
  </div>
</section>

<section class="section gallery-sec">
  <div class="wrap">
    <div class="section-head"><span class="bar"></span><span class="eyebrow">On site</span><h2>Facilities care, done properly</h2><p class="lead">Trained, uniformed teams with the right equipment for every job, from daily cleaning to paving repairs.</p></div>
    <div class="gallery">
      <figure class="g-a">{photo("team", "A uniformed cleaning team standing beside their vehicle with cleaning equipment", sizes="(max-width: 760px) 100vw, 25vw", pos="50% 70%")}<figcaption>Site teams</figcaption></figure>
      <figure class="g-b">{photo("clean-pressure", "Pressure washing stone steps", sizes="(max-width: 760px) 100vw, 50vw", pos="60% 40%")}<figcaption>Pressure washing</figcaption></figure>
      <figure class="g-c">{photo("grounds-shears", "Close-up of hands trimming a hedge with garden shears", sizes="(max-width: 760px) 100vw, 25vw", pos="35% 50%")}<figcaption>Hedge and garden care</figcaption></figure>
      <figure class="g-d">{photo("property-paving", "A worker in safety boots laying paving blocks", sizes="(max-width: 760px) 100vw, 25vw", pos="50% 60%")}<figcaption>Paving repairs</figcaption></figure>
      <figure class="g-e">{photo("grounds-trimmer", "A line trimmer cutting grass along a verge", sizes="(max-width: 760px) 100vw, 50vw", pos="55% 60%")}<figcaption>Grounds maintenance</figcaption></figure>
    </div>
  </div>
</section>

<section class="section section--navy">
  <div class="wrap">
    <div class="section-head"><span class="bar"></span><span class="eyebrow">Why choose MFS</span><h2>Why property managers choose MFS</h2></div>
    {choose_html()}
    <div class="founder-strip">
      <img src="assets/img/kamogelo-moisapula.jpg" alt="Kamogelo Moisapula, Founder and Managing Director" width="96" height="96" loading="lazy">
      <div class="stack" style="gap:6px">
        <p class="fq">"Property managers don't need more suppliers. They need partners who answer their phones and take ownership of problems."</p>
        <p><b>Kamogelo Moisapula</b>, Founder and Managing Director</p>
      </div>
      {btn('about.html#founder', 'Meet the Founder', 'Meet Founder', arrow=True)}
    </div>
  </div>
</section>
""" + closing_cta() + FOOTER.replace('<script src="assets/js/site.js"></script>', '<script src="assets/js/site.js"></script>\n<script src="assets/js/acm.js" defer></script>')
write("index.html", home)

# =========================== ABOUT ===========================
about = head("About Moisapula Facilities Solutions",
             "Moisapula Facilities Solutions connects people, properties and services. Our story, our founder and our commitments.",
             "about.html") + header("about.html") + f"""
<section class="page-hero">
  <div class="wrap">
    <span class="eyebrow">About us</span>
    <h1>We connect people, properties and services</h1>
    <p class="lead">Moisapula Facilities Solutions is a South African facilities management company providing professional cleaning, landscaping, hygiene, property care and support services to residential estates, private homes, commercial properties, retail centres, industrial facilities and public sector clients.</p>
    <div class="btn-row">{btn('contact.html', 'Request a Free Site Assessment', 'Free Assessment')}{btn(director_href(), 'Talk to a Director', 'Talk to Director', 'btn-ghost')}</div>
  </div>
</section>

<section class="section">
  <div class="wrap two-col">
    <div class="prose">
      <span class="bar"></span><span class="eyebrow">Our story</span>
      <h2>The spaces we depend on matter</h2>
      <p>People spend a significant part of their lives in offices, residential communities, schools, shopping centres, industrial facilities and public spaces. These environments shape safety, productivity, wellbeing and first impressions. Yet the services that keep them functioning often work behind the scenes: the landscaping that enhances a property's image, the cleaning that creates a healthier environment, the maintenance that prevents costly breakdowns, and the support services that keep operations running smoothly.</p>
      <p>Moisapula Facilities Solutions was established to bring these essential services together under a single accountable partner. We believe clients deserve more than contractors. They deserve a partner who understands their environment, protects their assets and takes ownership of the outcome.</p>
      <p>Through our integrated approach and our strategic partnership with Ecotech Engineering for building and civil works, we connect expertise, resources and people to help properties operate at their best.</p>
      <p style="font-weight:900;color:var(--navy);font-size:1.2rem">Because when spaces perform better, people perform better.</p>
    </div>
    <div class="stack" style="gap:20px">
      <div class="hero-like">{trust_graphic()}</div>
      <div class="card"><h3>The meaning behind our logo</h3><p>The two points at either end of our logo represent the client on one side and the desired outcome on the other. The bar that joins them runs through M, F and S: Moisapula Facilities Solutions is the connection between the two. It symbolises partnership, coordination and accountability, because nothing operates in isolation.</p></div>
    </div>
  </div>
</section>

<section class="section exist" style="padding-top:0">
  <div class="wrap exist-grid">
    <div class="stack" style="gap:14px">
      <span class="bar"></span><span class="eyebrow">Why we exist</span>
      <h2>People spend their lives in buildings</h2>
    </div>
    <div class="prose">
      <p class="exist-words"><span>Working.</span> <span>Learning.</span> <span>Shopping.</span> <span>Living.</span></p>
      <p>Behind every successful property is an environment that is clean, safe and properly maintained. MFS exists to create those environments.</p>
    </div>
  </div>
</section>

<section class="section section--mist">
  <div class="wrap">
    <div class="vm">
      <div class="card"><span class="label">OUR VISION</span><p>To become South Africa's most trusted facilities management partner, recognised for connecting quality service, accountability and sustainable outcomes.</p></div>
      <div class="card"><span class="label">OUR MISSION</span><p>To deliver integrated facilities solutions that protect assets, support operations and create clean, safe and productive environments through professional service and trusted partnerships.</p></div>
      <div class="card"><span class="label">OUR PURPOSE</span><p>We connect people, properties and services to create environments where businesses and communities can thrive.</p></div>
    </div>
  </div>
</section>

<section class="section" id="founder">
  <div class="wrap founder">
    <img src="assets/img/kamogelo-moisapula.jpg" alt="Kamogelo Moisapula, Founder and Managing Director" width="300" height="375" loading="lazy">
    <div class="prose">
      <span class="eyebrow">A message from our founder</span>
      <h2>The partner I would want to hire myself</h2>
      <p>Property managers don't need more suppliers. They need partners who answer their phones, take ownership of problems and consistently deliver on their commitments. MFS was founded on this belief.</p>
      <p>As an insurance claims assessor, I spent my working days inspecting properties after something had gone wrong. Again and again, I saw how much a well-maintained facility protects its owner, and how quickly small, neglected problems become expensive ones when nobody takes responsibility.</p>
      <p>In investment banking, I learned the discipline of numbers, contracts and accountability. Clients need to know exactly what they are paying for, and they need to see it delivered.</p>
      <p>MFS brings those lessons together. We are a young company, and we will not pretend otherwise. What we promise is an owner who answers the phone, teams that are trained and properly equipped, transparent reporting, and trusted partners such as Ecotech Engineering wherever specialist skills are needed. When you work with MFS, you deal with people invested in the result, not just the contract.</p>
      <p>I invite you to judge us by our work. Let us start with a free site assessment.</p>
      <p><b style="color:var(--navy);font-size:1.15rem">Kamogelo Moisapula</b><br>Founder and Managing Director · BCom Economics</p>
      <div class="btn-row">{btn(director_href(), 'Talk to a Director', 'Talk to Director', 'btn-navy')}</div>
    </div>
  </div>
</section>

<section class="section section--navy">
  <div class="wrap">
    <div class="section-head"><span class="bar"></span><span class="eyebrow">Our commitments</span><h2>What you can expect on every site</h2></div>
    <div class="commit" style="margin-top:0;border-top:0;padding-top:0">
      <ul>{''.join(f"<li>{CHECK.replace('currentColor', '#D9A441')}<span>{c}</span></li>" for c in COMMITMENTS)}</ul>
    </div>
  </div>
</section>

<section class="photo-strip" aria-label="Our work">
  {photo("team-walk", "A uniformed team carrying cleaning equipment to a client's building", sizes="(max-width: 760px) 100vw, 50vw", pos="62% 50%")}
  {photo("grounds-rake", "A groundskeeper raking leaves on a lawn", sizes="(max-width: 760px) 100vw, 25vw", pos="55% 50%")}
  {photo("equipment-van", "A service vehicle loaded with cleaning machines, buckets and ladders", sizes="(max-width: 760px) 100vw, 25vw", pos="50% 60%")}
</section>

<section class="section">
  <div class="wrap two-col">
    <div class="stack">
      <span class="bar"></span><span class="eyebrow">Health, safety &amp; environment</span>
      <h2>Safe operations and environmental responsibility go hand in hand</h2>
      <ul class="checks" style="grid-template-columns:1fr">{''.join(f'<li>{CHECK.replace("currentColor", "#4C9A52")}<span>{t}</span></li>' for t in ["Risk identification and mitigation", "PPE compliance", "Site-specific safety procedures", "Incident reporting and corrective action", "Environmental responsibility", "Responsible waste management", "Ongoing staff awareness and training"])}</ul>
    </div>
    <div class="stack">
      <span class="bar"></span><span class="eyebrow">People &amp; culture</span>
      <h2>Our success is built on our people</h2>
      <div class="chips">{''.join(f'<span class="chip">{t}</span>' for t in ["Professional conduct", "Skills development", "Fair labour practices", "Respect and accountability", "Consistent service standards", "A culture of safety and teamwork"])}</div>
      <p>By investing in our people, we create better outcomes for our clients.</p>
      <span class="bar" style="margin-top:20px"></span><span class="eyebrow">Compliance</span>
      <div class="chips">{''.join(f'<span class="chip">{t}</span>' for t in ["CIPC registration", "SARS tax compliance", "UIF registration", "COIDA registration", "Public liability insurance", "Health and safety compliance"])}</div>
      <p>Supporting documentation is available on request.</p>
    </div>
  </div>
</section>
""" + closing_cta() + FOOTER
write("about.html", about)


# ---------- Services explorer (services page) ----------
SVX_MEDIA = {
    "cleaning": '''<svg class="mx mx-clean" viewBox="0 0 200 180" aria-hidden="true">
  <defs>
    <linearGradient id="dropFill" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#BFE6F7" stop-opacity=".95"/><stop offset=".55" stop-color="#3FA7D6" stop-opacity=".55"/><stop offset="1" stop-color="#1F6F99" stop-opacity=".85"/></linearGradient>
    <radialGradient id="dropGlow" cx=".5" cy=".6" r=".5"><stop offset="0" stop-color="#3FA7D6" stop-opacity=".45"/><stop offset="1" stop-color="#3FA7D6" stop-opacity="0"/></radialGradient>
  </defs>
  <ellipse class="mx-ripple" cx="100" cy="158" rx="34" ry="7"/>
  <ellipse class="mx-ripple r2" cx="100" cy="158" rx="34" ry="7"/>
  <circle cx="100" cy="98" r="70" fill="url(#dropGlow)" class="mx-glow"/>
  <g class="mx-drop">
    <path d="M100 22 C100 22 56 78 56 108 a44 44 0 0 0 88 0 C144 78 100 22 100 22Z" fill="url(#dropFill)" stroke="rgba(255,255,255,.85)" stroke-width="1.5"/>
    <path class="mx-refract" d="M70 112 C74 132 92 144 112 142" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="4" stroke-linecap="round"/>
    <ellipse cx="84" cy="88" rx="7" ry="13" fill="#fff" fill-opacity=".75" transform="rotate(28 84 88)"/>
  </g>
  <g class="mx-sparks" fill="#D9A441">
    <path style="--i:0" d="M40 52 l3 9 9 3 -9 3 -3 9 -3 -9 -9 -3 9 -3Z"/>
    <path style="--i:1" d="M160 40 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2Z"/>
    <path style="--i:2" d="M165 118 l2.5 7 7 2.5 -7 2.5 -2.5 7 -2.5 -7 -7 -2.5 7 -2.5Z"/>
    <path style="--i:3" d="M30 128 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2Z"/>
  </g>
</svg>''',
    "grounds": '''<svg class="mx mx-grounds" viewBox="0 0 200 180" aria-hidden="true">
  <g class="mx-leaf">
    <polygon points="100,22 128,52 104,70" fill="#6DBB72"/><polygon points="100,22 104,70 78,50" fill="#4C9A52"/>
    <polygon points="128,52 140,92 104,70" fill="#5AAA60"/><polygon points="78,50 104,70 62,86" fill="#3E8645"/>
    <polygon points="140,92 128,124 104,110" fill="#4C9A52"/><polygon points="104,70 140,92 104,110" fill="#6DBB72"/>
    <polygon points="62,86 104,110 72,120" fill="#5AAA60"/><polygon points="62,86 104,70 104,110" fill="#47924D"/>
    <polygon points="72,120 104,110 100,140" fill="#3E8645"/><polygon points="104,110 128,124 100,140" fill="#5AAA60"/>
    <path d="M100 26 L102 140" stroke="#E8F5E9" stroke-opacity=".55" stroke-width="1.6" fill="none"/>
  </g>
  <g class="mx-grass" stroke="#4C9A52" stroke-width="3" stroke-linecap="round" fill="none">
    <path style="--i:0" d="M40 172 q2 -18 -4 -30"/><path style="--i:1" d="M52 172 q-2 -22 6 -36"/><path style="--i:2" d="M64 172 q3 -16 -2 -26"/>
    <path style="--i:3" d="M136 172 q-3 -20 4 -32"/><path style="--i:4" d="M148 172 q2 -24 -5 -38"/><path style="--i:5" d="M160 172 q-2 -16 5 -26"/>
    <path style="--i:6" d="M96 172 q1 -12 -3 -20"/><path style="--i:7" d="M106 172 q-1 -14 4 -22"/>
  </g>
</svg>''',
    "property": '''<svg class="mx mx-build" viewBox="0 0 220 180" aria-hidden="true">
  <g class="mx-faces">
    <path d="M60 70 L110 45 L110 140 L60 160Z" fill="#F6E1D3"/><path d="M110 45 L170 70 L170 160 L110 140Z" fill="#E9C2A8"/>
    <path d="M60 70 L110 45 L170 70 L120 92Z" fill="#E06A2C" fill-opacity=".85"/>
    <g fill="#114B36" fill-opacity=".75"><path d="M122 84 l14 5 v14 l-14 -5Z"/><path d="M146 92 l14 5 v14 l-14 -5Z"/><path d="M122 112 l14 5 v14 l-14 -5Z"/><path d="M146 120 l14 5 v14 l-14 -5Z"/>
    <path d="M72 88 l12 -6 v14 l-12 6Z"/><path d="M92 78 l12 -6 v14 l-12 6Z"/><path d="M72 116 l12 -6 v14 l-12 6Z"/><path d="M92 106 l12 -6 v14 l-12 6Z"/></g>
  </g>
  <g class="mx-wire" fill="none" stroke="#E06A2C" stroke-width="1.6" stroke-linejoin="round">
    <path pathLength="1" d="M60 70 L110 45 L170 70 L120 92 Z"/><path pathLength="1" d="M60 70 L60 160 L120 182"/>
    <path pathLength="1" d="M120 92 L120 182 L170 160 L170 70"/><path pathLength="1" d="M110 45 L110 140 L60 160 M110 140 L170 160"/>
    <path pathLength="1" d="M60 100 L120 122 L170 100 M60 130 L120 152 L170 130" stroke-opacity=".5"/>
  </g>
  <g class="mx-grid" stroke="#8A96A8" stroke-opacity=".35" stroke-width="1"><path d="M20 168 H200"/><path d="M30 176 H190"/></g>
</svg>''',
    "support": '''<svg class="mx mx-net" viewBox="0 0 200 180" aria-hidden="true">
  <g class="mx-links" stroke="#7E5A9B" stroke-width="1.6" fill="none">
    <path id="nl1" style="--i:0" pathLength="1" d="M100 90 L40 44"/><path style="--i:1" pathLength="1" d="M100 90 L160 40"/>
    <path style="--i:2" pathLength="1" d="M100 90 L170 120"/><path style="--i:3" pathLength="1" d="M100 90 L48 140"/>
    <path style="--i:4" pathLength="1" d="M100 90 L104 158"/><path style="--i:5" pathLength="1" d="M40 44 L160 40" stroke-opacity=".35"/>
    <path style="--i:6" pathLength="1" d="M170 120 L104 158 L48 140" stroke-opacity=".35"/>
  </g>
  <g class="mx-pulses" fill="#D9A441">
    <circle r="3.5" style="--path: path('M100 90 L40 44'); --i:0"/><circle r="3.5" style="--path: path('M100 90 L160 40'); --i:1"/>
    <circle r="3.5" style="--path: path('M100 90 L170 120'); --i:2"/><circle r="3.5" style="--path: path('M100 90 L48 140'); --i:3"/>
  </g>
  <g class="mx-nodes" fill="#fff" stroke="#7E5A9B" stroke-width="2.5">
    <circle style="--i:0" cx="40" cy="44" r="9"/><circle style="--i:1" cx="160" cy="40" r="7"/><circle style="--i:2" cx="170" cy="120" r="9"/>
    <circle style="--i:3" cx="48" cy="140" r="7"/><circle style="--i:4" cx="104" cy="158" r="6"/>
  </g>
  <circle class="mx-hub" cx="100" cy="90" r="15" fill="#D9A441" stroke="#fff" stroke-width="3"/>
</svg>''',
}
SVX_ORDER = [("cleaning", "Primary service"), ("grounds", "Outdoor care"), ("support", "Operational support"), ("property", "Specialist capability")]
# Which divisions suit each property type (matches the home selector and industries page)
SVX_MATCH = {"estate": ["cleaning", "grounds", "property"], "home": ["cleaning", "grounds", "property"],
             "office": ["cleaning", "property", "support"], "retail": ["cleaning", "property", "support"],
             "industrial": ["cleaning", "grounds", "property"], "education": ["cleaning", "grounds", "property"],
             "government": ["cleaning", "grounds", "property", "support"]}


def svx_card(slug, tag, i):
    d = DIVISIONS[slug]
    name = d["name"].replace("&", "&amp;")
    chips = "".join(f'<li style="--i:{j}">{s}</li>' for j, (s, _t) in enumerate(d["services"]))
    extra = ' <span class="svx-partner">with ' + eco_logo(16, "eco-inline") + '</span>' if slug == "property" else ""
    return f'''<article class="svx-card div-{d["key"]} svx-{slug}" data-slug="{slug}" style="--n:{i}" tabindex="0" aria-labelledby="svx-h-{slug}">
      <span class="svx-light" aria-hidden="true"></span>
      <div class="svx-media" aria-hidden="true">{SVX_MEDIA[slug]}</div>
      <div class="svx-body">
        <span class="svx-tag"><i></i>{tag}{extra}</span>
        <h3 id="svx-h-{slug}">{name}</h3>
        <p class="svx-tagline">{d["tagline"]}</p>
        <p class="svx-pitch">{d["pitch"]}</p>
        <div class="svx-drawer"><ul class="svx-chips">{chips}</ul></div>
        <div class="svx-actions"><a class="svx-cta" href="contact.html#{slug}">{d["card_cta"]} <span class="arr" aria-hidden="true">&rarr;</span></a><a class="svx-more" href="{d["file"]}">Explore {d["name"].split(" ")[0].lower() if slug != "property" else "property care"}</a></div>
      </div>
    </article>'''


def services_explorer():
    import json
    envs = {k: {"title": t, "pack": pk, "cta": c, "short": cs} for k, _l, t, _s, _r, _c, pk, _pd, c, cs in ENVS}
    divs = {s: {"name": DIVISIONS[s]["name"], "tagline": DIVISIONS[s]["tagline"], "serve": DIVISIONS[s]["serve"], "cta": DIVISIONS[s]["card_cta"], "file": DIVISIONS[s]["file"]} for s, _t in SVX_ORDER}
    data = json.dumps({"match": SVX_MATCH, "envs": envs, "divs": divs}).replace("</", "<\\/")
    chips = '<button class="svx-prop" type="button" aria-pressed="true" data-k="all">All properties</button>' + "".join(
        f'<button class="svx-prop" type="button" aria-pressed="false" data-k="{k}">{prop_icon(k)}<span>{lbl}</span></button>' for k, lbl, *_r in ENVS)
    cards = "".join(svx_card(s, t, i) for i, (s, t) in enumerate(SVX_ORDER))
    eco_nodes = "".join(f'<span class="eco-node eco-{s}" data-slug="{s}"><i></i><b>{lbl}</b></span>' for s, lbl in
                        [("cleaning", "Cleaning"), ("grounds", "Landscaping"), ("property", "Property Care"), ("support", "Support")])
    return f'''<section class="section svx" id="explore" aria-labelledby="svx-title">
  <div class="wrap">
    <div class="svx-head">
      <div class="section-head"><span class="bar"></span><span class="eyebrow">Explore our services</span><h2 id="svx-title">Four divisions. One accountable partner.</h2></div>
      <div class="svx-match"><span class="svx-q" id="svx-q">What property do you manage?</span><div class="svx-props" role="group" aria-labelledby="svx-q">{chips}</div></div>
    </div>
    <div class="svx-layout">
      <div class="svx-rail" aria-hidden="true"><span class="svx-rail-line"><i></i></span><b class="svx-end top">Client</b><b class="svx-end bottom">Outcome</b></div>
      <div class="svx-bento">{cards}</div>
      <aside class="svx-panel" aria-live="polite">
        <div class="eco" aria-hidden="true">
          <svg viewBox="0 0 240 200"><g class="eco-lines"><path data-slug="cleaning" d="M120 100 L120 34"/><path data-slug="grounds" d="M120 100 L34 100"/><path data-slug="property" d="M120 100 L206 100"/><path data-slug="support" d="M120 100 L120 166"/></g></svg>
          {eco_nodes}<span class="eco-hub"><img src="assets/img/mark-reversed.svg" alt="" width="46" height="20"></span>
        </div>
        <div class="svx-cfg">
          <span class="eyebrow" id="cfg-eyebrow">Service focus</span>
          <h3 id="cfg-title">Cleaning &amp; Hygiene</h3>
          <p id="cfg-sub">Clean, healthy spaces, every day.</p>
          <span class="cfg-label" id="cfg-label">Recommended for</span>
          <ul class="cfg-list" id="cfg-list"></ul>
          <p class="cfg-pack" id="cfg-pack" hidden></p>
          <a class="btn btn-sun cfg-cta" id="cfg-cta" href="contact.html#cleaning"><span id="cfg-cta-t">Get Cleaning Quote</span> <span class="arr" aria-hidden="true">&rarr;</span></a>
        </div>
      </aside>
    </div>
  </div>
  <script type="application/json" id="svx-data">{data}</script>
</section>'''


# =========================== SERVICES ===========================
def division_overview(slug):
    d = DIVISIONS[slug]
    svc = "".join(f"<li>{s}</li>" for s, _ in d["services"])
    return f"""<div class="card division-card div-{d['key']}">
  <span class="top"></span>
  <div class="body">
    <div style="display:flex;gap:14px;align-items:center">{icon(d['key'])}<div><h3>{d['name'].replace('&', '&amp;')}</h3><p class="div-tag">{d['tagline']}</p></div></div>
    <p>{d['pitch']}</p>
    <ul>{svc}</ul>
    <div class="card-actions">
      <a class="card-cta" href="contact.html#{slug}">{d['card_cta']} &rarr;</a>
      <a class="card-more" href="{d['file']}">Learn more</a>
    </div>
  </div>
</div>"""

services = head("Services | Moisapula Facilities Solutions",
                "Cleaning & Hygiene, Grounds & Landscaping, Property Care & Building Works and Support Services from one accountable partner.",
                "services.html") + header("services.html") + f"""
<section class="page-hero">
  <div class="wrap">
    <span class="eyebrow">Our services</span>
    <h1>One partner. Multiple services. Reliable delivery.</h1>
    <p class="lead">Four service divisions delivered by our own trained teams, plus specialist building and civil works through our partner, Ecotech Engineering. Once-off, scheduled and contract-based options are available for every service.</p>
    <div class="btn-row">{btn('contact.html', 'Get a Tailored Proposal', 'Get Proposal')}{btn('index.html#selector', 'Find the Right Service', 'Find Service', 'btn-ghost')}</div>
  </div>
</section>
<div class="strip" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div>
{services_explorer()}
{ecotech_section()}
{process_section("process", "How we work", "Every contract follows the same cycle", "Our approach is simple: understand your requirements, deploy the right resources, maintain consistent standards and provide clear accountability.", "contact.html", "Book a Free Site Assessment", "Book Assessment")}
""" + closing_cta() + FOOTER
write("services.html", services.replace('<script src="assets/js/motion.js" defer></script>', '<script src="assets/js/motion.js" defer></script>\n<script src="assets/js/services.js" defer></script>'))

# =========================== DIVISION PAGES ===========================
DIV_PHOTO = {"cleaning": ("clean-home", "Two cleaners in uniform vacuuming and mopping a living room", "", "50% 60%"),
             "grounds": ("grounds-trim", "A groundskeeper in overalls trimming grass along a row of conifers", "", "78% 50%"),
             "property": ("property-paving", "A worker in safety boots laying paving blocks", "", "50% 55%"),
             "support": ("support-steps", "A uniformed team carrying equipment across a property", "", "50% 72%")}
for slug, d in DIVISIONS.items():
    name_html = d["name"].replace("&", "&amp;")
    svc_cards = "".join(f'<div class="card svc div-{d["key"]}"><h3>{s}</h3><p>{t}</p></div>' for s, t in d["services"])
    safety = "".join(f'<li>{CHECK_DIV}<span>{t}</span></li>' for t in d["safety"])
    serve = "".join(f'<span class="chip div-{d["key"]}"><i></i>{t}</span>' for t in d["serve"])
    icons = icon(d["key"], 30) + (icon("build", 30) if slug == "property" else "")
    long, short = d["cta"]
    build_section = ""
    if slug == "property":
        build_section = f"""
<section class="section section--navy" id="building">
  <div class="wrap two-col">
    <div class="stack" style="gap:18px">
      <span class="bar" style="background:var(--c-build)"></span><span class="eyebrow">Delivered through Ecotech Engineering</span>
      <h2>Building &amp; Civil Works</h2>
      <p>Through our strategic partnership with Ecotech Engineering, we provide specialist building and civil works supported by qualified technical expertise and project delivery capabilities, under MFS's single point of accountability.</p>
      <div class="btn-row">{btn('contact.html#property', 'Request Building Works Assessment', 'Request Assessment')}{btn(director_href(), 'Discuss Your Project', 'Discuss Project', 'btn-ghost')}</div>
    </div>
    <div class="partner-card">
      <div class="eco-head">{eco_logo(40)}<div><b>Ecotech Engineering Africa</b><span>MFS's building and civil works partner</span></div></div>
      {blueprint()}
      <ul class="checks cap-list" style="grid-template-columns:1fr 1fr">{''.join(f'<li>{CHECK.replace("currentColor", "#8A96A8")}<span>{b}</span></li>' for b in BUILD)}</ul>
    </div>
  </div>
</section>"""
    bar_var = {"cleaning": "c-clean", "grounds": "c-grounds", "property": "c-property", "support": "c-support"}[slug]
    page = head(f"{d['name']} | Moisapula Facilities Solutions", d["pitch"], d["file"]) + header("services.html") + f"""
<section class="page-hero page-hero--photo div-{d['key']}">
  <div class="wrap hero-split">
  <div class="hero-text">
    <span class="crumbs"><a href="services.html">Services</a> / {name_html}</span>
    <div class="icons">{icons}</div>
    <h1>{name_html}</h1>
    <p class="tagline">{d['tagline']}</p>
    <p class="lead">{d['pitch']}</p>
    <div class="btn-row">{btn('contact.html#' + slug, long, short)}{btn(director_href(), 'Talk to a Director', 'Talk to Director', 'btn-ghost')}</div>
  </div>
  <figure class="hero-photo">{photo(DIV_PHOTO[slug][0], DIV_PHOTO[slug][1], pos=DIV_PHOTO[slug][3], sizes="(max-width: 960px) 100vw, 40vw", eager=True)}</figure>
  </div>
</section>
<section class="section">
  <div class="wrap">
    <div class="section-head"><span class="bar" style="background:var(--{bar_var})"></span><span class="eyebrow">What we do</span><h2>{'Property Care' if slug == 'property' else name_html} services</h2><p class="lead">{d['intro']}</p></div>
    <div class="grid grid-3">{svc_cards}</div>
  </div>
</section>{build_section}
<section class="section section--mist div-{d['key']}">
  <div class="wrap two-col">
    <div class="stack">
      <span class="eyebrow">Safety and quality</span>
      <h2>Standards on every job</h2>
      <ul class="checks" style="grid-template-columns:1fr">{safety}</ul>
    </div>
    <div class="stack">
      <span class="eyebrow">Who we serve</span>
      <h2>Sites we look after</h2>
      <div class="chips">{serve}</div>
      <p>Once-off, scheduled and contract-based options are available.</p>
    </div>
  </div>
</section>
{process_section(None, "How we work", "Four steps from first call to first report", "", "contact.html#" + slug, long, short, cls="section")}
""" + closing_cta() + FOOTER
    write(d["file"], page)

# =========================== INDUSTRIES ===========================
def env_section():
    tabs = ""
    for i, (k, lbl, title, short, *_rest) in enumerate(ENVS):
        noun = "site" if k == "government" else ("home" if k == "home" else title.split(" ")[-1].lower().rstrip("s"))
        noun = {"estate": "estate", "office": "office", "industrial": "facility", "retail": "centre", "education": "school"}.get(k, noun)
        tabs += (f'<button class="env-tab" type="button" role="tab" id="tab-{k}" aria-controls="{k}" aria-selected="{"true" if i == 0 else "false"}" tabindex="{0 if i == 0 else -1}" data-k="{k}" data-noun="{noun}">'
                 f'<span class="env-tab-i" aria-hidden="true">{prop_icon(k)}</span><span class="env-tab-t">{lbl}</span><span class="env-tab-s">{short}</span>'
                 f'<span class="env-tab-go" aria-hidden="true">View solution &rarr;</span></button>')
    cards = []
    for i, (k, lbl, title, short, reqs, chals, pack, pack_d, cta, cta_s) in enumerate(ENVS):
        pills = "".join(f'<li style="--i:{j}">{CHECK}{r}</li>' for j, r in enumerate(reqs))
        ch = "".join(f'<li style="--i:{j + len(reqs)}">{c}</li>' for j, c in enumerate(chals))
        active = " is-active" if i == 0 else ""
        cards.append(
            f'<article class="env-card{active}" id="{k}" role="tabpanel" aria-labelledby="tab-{k}" data-k="{k}">'
            f'<header class="env-card-head"><span class="env-card-i" aria-hidden="true">{prop_icon(k)}</span><div><h3>{title}</h3><p>{short}</p></div></header>'
            f'<div class="env-block"><span class="env-label">Typical requirements</span><ul class="env-pills">{pills}</ul></div>'
            f'<div class="env-block"><span class="env-label">Common challenges</span><ul class="env-ch">{ch}</ul></div>'
            f'<div class="env-pack" style="--i:8"><span class="env-label">Suggested package</span><b>{pack}</b><p>{pack_d}</p></div>'
            + btn('contact.html#' + k, cta, cta_s, 'btn-sun env-cta', arrow=True) + '</article>')
    art = "".join(f'<span class="env-art{" is-active" if i == 0 else ""}" data-k="{k}">{prop_icon(k)}</span>' for i, (k, *_r) in enumerate(ENVS))
    dots = "".join(f'<i data-k="{k}"></i>' for k, *_r in ENVS)
    return f"""<section class="env" id="environments" aria-labelledby="env-title">
  <div class="env-track">
    <div class="env-sticky">
      <div class="wrap env-inner">
        <div class="env-head">
          <span class="eyebrow">Choose your environment</span>
          <h1 id="env-title">Built for the spaces people depend on</h1>
          <p class="lead">Every environment has different operational requirements. Select yours to see how we would support it.</p>
        </div>
        <div class="env-grid">
          <div class="env-side">
            <div class="env-tabs" role="tablist" aria-label="Environments" aria-orientation="vertical"><span class="env-ind" aria-hidden="true"></span>{tabs}</div>
            <p class="env-hint" aria-hidden="true"><span class="env-hint-scroll">Scroll to explore, or pick one</span><span class="env-hint-swipe">Swipe to explore</span></p>
          </div>
          <div class="env-stage" aria-hidden="true">
            <canvas class="env-canvas"></canvas>
            <div class="env-arts">{art}</div>
            <div class="env-link">
              <svg viewBox="0 0 300 12" preserveAspectRatio="none"><line class="env-link-base" x1="6" y1="6" x2="294" y2="6"/><line class="env-link-run" x1="6" y1="6" x2="294" y2="6" pathLength="1"/></svg>
              <span class="env-node n1"><i></i><b class="env-client">Your estate</b></span>
              <span class="env-node n2"><i></i><b>MFS</b></span>
              <span class="env-node n3"><i></i><b>Outcome</b></span>
            </div>
          </div>
          <div class="env-panels">{''.join(cards)}</div>
        </div>
        <div class="env-dots" aria-hidden="true">{dots}</div>
      </div>
    </div>
  </div>
</section>"""


industries = head("Industries | Moisapula Facilities Solutions",
                  "Facilities services for residential estates, private homes, commercial offices, retail centres, industrial facilities, schools and the public sector.",
                  "industries.html") + header("industries.html") + env_section() + f"""
<section class="section">
  <div class="wrap">
    <div class="after-steps"><p><b>Don't see your environment?</b> Let's build a solution for your site.</p>{btn('contact.html', 'Discuss Your Requirements', 'Discuss Your Site', 'btn-navy', arrow=True)}</div>
  </div>
</section>
<section class="section section--navy">
  <div class="wrap">
    <div class="section-head"><span class="bar"></span><span class="eyebrow">Why choose MFS</span><h2>Why property managers choose MFS</h2></div>
    {choose_html()}
  </div>
</section>
""" + closing_cta() + FOOTER
write("industries.html", industries.replace('<script src="assets/js/motion.js" defer></script>', '<script src="assets/js/motion.js" defer></script>\n<script src="assets/js/env.js" defer></script>'))

# =========================== CONTACT (assessment request) ===========================
svc_opts = [("cleaning", "Cleaning"), ("grounds", "Landscaping"), ("property", "Property Care"), ("hygiene", "Hygiene Services"),
            ("support", "Support Services"), ("building", "Building & Civil Works"), ("multiple", "Multiple Services")]
chips = "".join(f'<label class="pick-chip" for="svc-{v}"><input type="checkbox" id="svc-{v}" name="services" value="{v}" data-label="{t.replace("&", "&amp;")}"><span>{CHECK}{t.replace("&", "&amp;")}</span></label>' for v, t in svc_opts)


def drawn_icon(k):
    return re.sub(r'<(path|rect)\b', r'<\1 pathLength="1"', prop_icon(k))


def short_prop(n):
    return n.replace("Educational institutions", "Educational facility").replace("Government and public sector", "Government")


props = "".join(
    f'<label class="pick-card pc-{k}" for="prop-{k}"><input type="radio" id="prop-{k}" name="property" value="{n}" data-key="{k}" data-label="{short_prop(n)}">'
    f'<span class="pc"><span class="pc-art" aria-hidden="true"><span class="pc-ghost">{prop_icon(k)}</span><span class="pc-main">{drawn_icon(k)}</span></span>'
    f'<b>{short_prop(n)}</b><i class="pc-check" aria-hidden="true">{CHECK}</i></span></label>' for k, n, _ in INDUSTRIES)
sizes = "".join(f'<label class="pick-row" for="size-{i}"><input type="radio" id="size-{i}" name="size" value="{t}" data-label="{t}"><span><b>{t}</b><small>{s}</small></span></label>' for i, (t, s) in enumerate([
    ("Small site", "A home, single office, shop or small complex"),
    ("Medium site", "An estate, office park or school"),
    ("Large site", "A large estate, campus or industrial facility"),
    ("Multiple sites", "A portfolio of properties")]))
freqs = "".join(f'<label class="pick-chip" for="freq-{i}"><input type="radio" id="freq-{i}" name="frequency" value="{t}" data-label="{t}"><span>{CHECK}{t}</span></label>'
                for i, t in enumerate(["Once-off", "Weekly", "Monthly", "Ongoing contract", "Not sure yet"]))
quick = []
if PHONE_TEL:
    quick.append(f'<a class="quick" href="tel:{PHONE_TEL}">{PHONE_SVG}<span>Call Now</span></a>')
if WHATSAPP:
    quick.append(f'<a class="quick" href="{whatsapp_href()}" target="_blank" rel="noopener">{CHAT_SVG}<span>WhatsApp</span></a>')
quick.append(f'<button class="quick" type="button" data-copy="{EMAIL}">{MAIL_SVG}<span>Copy Email</span></button>')

STEP_NAMES = ["Property", "Services", "Site size", "Your site", "Contact"]
nodes = "".join(f'<span class="ca-node" style="--x:{x}%;--y:{y}%;--s:{s};--d:{d}s"></span>' for x, y, s, d in [
    (8, 22, 1, 0), (22, 78, .7, 2), (38, 14, .55, 4), (47, 62, .8, 1), (58, 30, .6, 3), (66, 86, 1, 5), (79, 18, .75, 2.5), (90, 58, .6, 4.5), (96, 30, .9, 1.5)])
hub_svg = (f'<svg class="ca-fb-lines" viewBox="0 0 400 300" aria-hidden="true"><path d="M200 150 L200 52 M200 150 L64 150 M200 150 L336 150 M200 150 L200 248"/></svg>'
           f'<span class="ca-fb-hub"></span>'
           + "".join(f'<span class="ca-fb-ic ic-{k}">{prop_icon(k)}</span>' for k in ["office", "estate", "retail", "industrial"]))
how_steps = [
    ("Tell us about your property", "Five short questions about your site, the services you need and how often.",
     '<path d="M5 4h10l4 4v12H5Z"/><path d="M15 4v4h4M8 12h8M8 16h5"/>'),
    ("We assess your requirements", "A director reviews your request and visits your site, free of charge.",
     '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5M8.5 11l2 2 3.5-3.5"/>'),
    ("Receive a tailored proposal", "A clear scope, schedule and price, within 5 working days of the visit.",
     '<path d="M4 6h16v12H4Z"/><path d="M4 7l8 6 8-6"/>'),
    ("Start improving your site", "One team, one contract and regular reporting from day one.",
     '<path d="M4 18l5-5 4 4 7-8"/><path d="M15 9h5v5"/>'),
]
how_html = "".join(
    f'<li class="how-step" style="--i:{i}"><span class="how-dot" aria-hidden="true"></span><span class="how-num">0{i + 1}</span>'
    f'<span class="how-ic" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">{svg}</svg></span>'
    f'<h3>{t}</h3><p>{d}</p></li>' for i, (t, d, svg) in enumerate(how_steps))
cap_rows = "".join(f'<div class="cap-row" data-row="{k}"><dt>{lbl}</dt><dd data-empty="{e}">{e}</dd></div>' for k, lbl, e in [
    ("property", "Property", "Not selected yet"), ("services", "Services", "Not selected yet"), ("size", "Site size", "Not selected yet"),
    ("location", "Location", "Not added yet"), ("frequency", "How often", "Not selected yet"), ("contact", "Contact", "Not added yet")])
cap_arts = "".join(f'<span class="cap-art" data-k="{k}">{prop_icon(k)}</span>' for k, _n, _t in INDUSTRIES)
dir_actions = []
if WHATSAPP:
    dir_actions.append(f'<a class="btn btn-sun" href="{whatsapp_href()}" target="_blank" rel="noopener">{CHAT_SVG}<span>WhatsApp the Director</span></a>')
if PHONE_TEL:
    dir_actions.append(f'<a class="btn btn-ghost" href="tel:{PHONE_TEL}">{PHONE_SVG}<span>Call {PHONE_DISPLAY}</span></a>')
dir_actions.append(f'<a class="btn {"btn-ghost" if WHATSAPP else "btn-sun"}" href="mailto:{EMAIL}?subject=Site%20assessment%20enquiry">{MAIL_SVG}<span>Email the Director</span></a>')
dir_actions.append(f'<button class="btn btn-ghost" type="button" data-copy="{EMAIL}">Copy Email</button>')
dir_rows = f'<div class="dir-row"><b>Email</b><span>{EMAIL}</span></div>'
if PHONE_TEL:
    dir_rows += f'<div class="dir-row"><b>Phone</b><span>{PHONE_DISPLAY}</span></div>'
dir_rows += '<div class="dir-row"><b>Service area</b><span>Johannesburg, Ekurhuleni and Tshwane, plus the West Rand and Sedibeng on request.</span></div>'
dir_feats = "".join(f'<li>{CHECK}<span><b>{t}</b>{d}</span></li>' for t, d in [
    ("Direct access", "You deal with the founder from the first message."),
    ("Fast response", "Every request is reviewed within one working day."),
    ("Site-specific advice", "Recommendations based on a visit to your property."),
    ("No call centre", "No ticket numbers and no hand-offs.")])

contact = head("Request a Site Assessment | Moisapula Facilities Solutions",
               "Every property is different. Tell us about your site and we'll prepare a tailored facilities solution.",
               "contact.html") + header("contact.html") + f"""
<section class="ca-hero" aria-labelledby="ca-title">
  <div class="ca-bg" aria-hidden="true"><span class="ca-grid"></span><span class="ca-beam"></span><span class="ca-spot"></span>{nodes}</div>
  <div class="wrap ca-hero-grid">
    <div class="ca-copy">
      <span class="eyebrow">Request a site assessment</span>
      <h1 id="ca-title"><span class="ln"><span>Let's talk</span></span> <span class="ln"><span>about your site</span></span></h1>
      <p class="lead">Every property is different. Tell us about your site and we'll start preparing a tailored facilities solution.</p>
      <ul class="hero-checks">{''.join(f"<li>{CHECK.replace('currentColor', '#D9A441')}<span>{t}</span></li>" for t in ["Free site assessment", "Tailored proposal", "No obligation"])}</ul>
      <div class="btn-row">{btn('#assess', 'Start Your Assessment', 'Start Assessment', 'btn-sun', arrow=True)}{btn('#how', 'How It Works', 'How It Works', 'btn-ghost')}</div>
    </div>
    <div class="ca-flow" aria-hidden="true">
      <svg viewBox="0 0 12 300" preserveAspectRatio="none"><line class="ca-flow-base" x1="6" y1="6" x2="6" y2="294"/><line class="ca-flow-run" x1="6" y1="6" x2="6" y2="294"/></svg>
      <span class="ca-flow-n f1"><i></i><b>Client</b></span><span class="ca-flow-n f2"><i></i><b>MFS</b></span><span class="ca-flow-n f3"><i></i><b>Solution</b></span>
    </div>
    <div class="ca-visual" aria-hidden="true"><canvas class="ca-canvas"></canvas><div class="ca-fallback">{hub_svg}</div></div>
  </div>
</section>

<section class="ca-how" id="how" aria-labelledby="how-title">
  <div class="how-track"><div class="how-sticky"><div class="wrap">
    <div class="section-head"><span class="bar"></span><span class="eyebrow">How it works</span><h2 id="how-title">From first message to a better-run site</h2></div>
    <ol class="how-steps"><span class="how-line" aria-hidden="true"><i></i></span>{how_html}</ol>
  </div></div></div>
</section>

<section class="section section--mist ca-assess" id="assess">
  <div class="wrap">
    <div class="section-head"><span class="bar"></span><span class="eyebrow">Your site assessment</span><h2>Tell us about your site</h2><p class="lead">Your answers build your assessment as you go. A director reviews every request personally.</p></div>
    <div class="form-wrap">
    <form class="quote-form" id="quote-form" novalidate>
      <div class="progress" aria-hidden="true">
        <div class="progress-top"><p id="progress-text">Step 1 of 5 · Property</p><b id="progress-pct">20%</b></div>
        <div class="progress-bar"><span id="progress-fill"></span><i id="progress-dot"></i></div>
        <ol class="progress-steps">{''.join(f'<li data-s="{i + 1}">{s}</li>' for i, s in enumerate(STEP_NAMES))}</ol>
      </div>

      <div class="steps-view">
      <fieldset class="step-panel" data-step="1">
        <legend><span class="step-label">Step 1</span>What type of property is it?</legend>
        <div class="pick-cards">{props}</div>
      </fieldset>

      <fieldset class="step-panel" data-step="2" hidden>
        <legend><span class="step-label">Step 2</span>What services are you interested in?</legend>
        <div class="pick-chips">{chips}</div>
      </fieldset>

      <fieldset class="step-panel" data-step="3" hidden>
        <legend><span class="step-label">Step 3</span>How big is the site?</legend>
        <div class="pick-rows">{sizes}</div>
      </fieldset>

      <fieldset class="step-panel" data-step="4" hidden>
        <legend><span class="step-label">Step 4</span>Tell us more about your site</legend>
        <div class="float"><input type="text" id="location" name="location" placeholder=" "><label for="location">Site location (suburb and city)</label></div>
        <div class="pick-group"><span class="pick-q">How often do you need help?</span><div class="pick-chips">{freqs}</div></div>
        <div class="float"><textarea id="message" name="message" placeholder=" " rows="4"></textarea><label for="message">Describe your site and requirements</label></div>
      </fieldset>

      <fieldset class="step-panel" data-step="5" hidden>
        <legend><span class="step-label">Step 5</span>Your details</legend>
        <div class="field-row">
          <div class="float"><input type="text" id="name" name="name" autocomplete="name" placeholder=" " required><label for="name">Full name</label></div>
          <div class="float"><input type="text" id="company" name="company" autocomplete="organization" placeholder=" "><label for="company">Company or estate name (if any)</label></div>
        </div>
        <div class="field-row">
          <div class="float"><input type="tel" id="phone" name="phone" autocomplete="tel" placeholder=" "><label for="phone">Mobile number</label></div>
          <div class="float"><input type="email" id="email" name="email" autocomplete="email" placeholder=" "><label for="email">Email address</label></div>
        </div>
      </fieldset>
      </div>

      <p class="form-error" id="form-error" hidden></p>
      <div class="step-nav">
        <button class="btn btn-outline" type="button" id="step-back" hidden>Back</button>
        <button class="btn btn-navy" type="button" id="step-next">Continue <span class="arr" aria-hidden="true">&rarr;</span></button>
        <button class="btn btn-sun" type="submit" id="step-submit" hidden>Submit Assessment Request <span class="arr" aria-hidden="true">&rarr;</span></button>
      </div>

      <div class="form-result" id="form-result" hidden tabindex="-1">
        <span class="fr-badge" aria-hidden="true">{CHECK}</span>
        <h3 id="result-title">Assessment request submitted</h3>
        <p id="result-text"></p>
        <div class="fr-send" id="fr-send" hidden>
          <pre id="quote-summary"></pre>
          <div class="btn-row">
            <a class="btn btn-sun" id="mail-link" href="mailto:{EMAIL}">Email This Request <span class="arr" aria-hidden="true">&rarr;</span></a>
            <button class="btn btn-outline" type="button" data-copy-target="quote-summary">Copy Request</button>
          </div>
        </div>
        <h4>What happens next</h4>
        <ol class="fr-steps">
          <li style="--i:0"><b>Director review</b><span>Within one working day</span></li>
          <li style="--i:1"><b>Initial discussion</b><span>A short call about your site and priorities</span></li>
          <li style="--i:2"><b>Site assessment</b><span>We visit and assess, free of charge</span></li>
          <li style="--i:3"><b>Tailored proposal</b><span>Within 5 working days of the visit</span></li>
        </ol>
      </div>

      <div class="quick-row"><span>Or reach us directly</span>{''.join(quick)}</div>
    </form>
    <aside class="ca-preview" aria-label="Your assessment so far">
      <div class="cap-head">
        <span class="eyebrow">Live preview</span>
        <h3>Your assessment</h3>
        <div class="cap-meter"><i id="cap-fill"></i></div>
        <small id="cap-pct">0% complete</small>
      </div>
      <div class="cap-vis" aria-hidden="true"><canvas class="cap-canvas"></canvas><div class="cap-arts">{cap_arts}<span class="cap-empty">Select a property to see it here</span></div></div>
      <dl class="cap-rows">{cap_rows}</dl>
      <p class="cap-note">A director reviews every request within one working day.</p>
    </aside>
    </div>
  </div>
</section>

<section class="section ca-director" id="director">
  <div class="wrap">
    <div class="dir-card">
      <div class="dir-photo">
        <img src="assets/img/kamogelo-moisapula.jpg" alt="Kamogelo Moisapula, Founder and Managing Director" width="300" height="375" loading="lazy">
        <span class="dir-badge"><i aria-hidden="true"></i>Owner managed</span>
      </div>
      <div class="dir-body">
        <span class="eyebrow">Talk to a director</span>
        <h2>Owner-managed. Real accountability.</h2>
        <p class="dir-lead">Your enquiry goes straight to Kamogelo Moisapula, Founder and Managing Director, not a call centre.</p>
        <ul class="dir-feats">{dir_feats}</ul>
        <div class="dir-rows">{dir_rows}</div>
        <div class="btn-row">{''.join(dir_actions)}</div>
      </div>
    </div>
  </div>
</section>
""" + FOOTER.replace('<script src="assets/js/motion.js" defer></script>', '<script src="assets/js/motion.js" defer></script>\n<script src="assets/js/contact.js" defer></script>')
write("contact.html", contact.replace('<a class="go" href="contact.html">Get Quote</a>', '<a class="go" href="#assess">Start Assessment</a>'))


pages = ["index.html", "about.html", "services.html"] + [d["file"] for d in DIVISIONS.values()] + ["industries.html", "contact.html"]
(OUT / "sitemap.xml").write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    "".join(f"  <url><loc>{SITE}/{'' if p == 'index.html' else p.replace('.html', '')}</loc></url>\n" for p in pages) + "</urlset>\n")
(OUT / "robots.txt").write_text(f"User-agent: *\nAllow: /\nSitemap: {SITE}/sitemap.xml\n")
print("Built", len(pages), "pages")
