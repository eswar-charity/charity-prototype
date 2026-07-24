"""Curated short-alias NP admin accounts for USA_20 nonprofits."""
from __future__ import annotations

LEGACY_NP_EMAIL = "np@charityhub.com"
NP_DEMO_PASSWORD = "Passw0rd!"

# email, nonprofit Common Name (must match import_nonprofits name), display_name
NP_ACCOUNT_ALIASES: list[dict[str, str]] = [
    {"email": "redcross@charityhub.com", "nonprofit_name": "American Red Cross", "display_name": "American Red Cross Admin"},
    {"email": "feedingamerica@charityhub.com", "nonprofit_name": "Feeding America", "display_name": "Feeding America Admin"},
    {"email": "stjude@charityhub.com", "nonprofit_name": "St. Jude Children's Research Hospital", "display_name": "St. Jude Children's Research Hospital Admin"},
    {"email": "habitat@charityhub.com", "nonprofit_name": "Habitat for Humanity", "display_name": "Habitat for Humanity Admin"},
    {"email": "unitedway@charityhub.com", "nonprofit_name": "United Way", "display_name": "United Way Admin"},
    {"email": "goodwill@charityhub.com", "nonprofit_name": "Goodwill", "display_name": "Goodwill Admin"},
    {"email": "bgca@charityhub.com", "nonprofit_name": "Boys & Girls Clubs of America", "display_name": "Boys & Girls Clubs of America Admin"},
    {"email": "ymca@charityhub.com", "nonprofit_name": "YMCA of the USA", "display_name": "YMCA of the USA Admin"},
    {"email": "bbbs@charityhub.com", "nonprofit_name": "Big Brothers Big Sisters", "display_name": "Big Brothers Big Sisters Admin"},
    {"email": "makeawish@charityhub.com", "nonprofit_name": "Make-A-Wish America", "display_name": "Make-A-Wish America Admin"},
    {"email": "rmhc@charityhub.com", "nonprofit_name": "Ronald McDonald House Charities", "display_name": "Ronald McDonald House Charities Admin"},
    {"email": "komen@charityhub.com", "nonprofit_name": "Susan G. Komen", "display_name": "Susan G. Komen Admin"},
    {"email": "acs@charityhub.com", "nonprofit_name": "American Cancer Society", "display_name": "American Cancer Society Admin"},
    {"email": "alz@charityhub.com", "nonprofit_name": "Alzheimer's Association", "display_name": "Alzheimer's Association Admin"},
    {"email": "nature@charityhub.com", "nonprofit_name": "The Nature Conservancy", "display_name": "The Nature Conservancy Admin"},
    {"email": "sierraclub@charityhub.com", "nonprofit_name": "Sierra Club Foundation", "display_name": "Sierra Club Foundation Admin"},
    {"email": "charitywater@charityhub.com", "nonprofit_name": "charity: water", "display_name": "charity: water Admin"},
    {"email": "wwf@charityhub.com", "nonprofit_name": "World Wildlife Fund (WWF-US)", "display_name": "World Wildlife Fund (WWF-US) Admin"},
    {"email": "aspca@charityhub.com", "nonprofit_name": "ASPCA", "display_name": "ASPCA Admin"},
    {"email": "msf@charityhub.com", "nonprofit_name": "Doctors Without Borders USA", "display_name": "Doctors Without Borders USA Admin"},
]
