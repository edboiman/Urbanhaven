// Sources behind checklist items. "Reviewed" is the date the page was opened for this release.
export const checklistSources: Record<string, { org: string; title: string; url: string; reviewed: string; note?: string }> = {
  "ready-kit": {
    org: "Ready.gov (FEMA)",
    title: "Build A Kit",
    url: "https://www.ready.gov/kit",
    reviewed: "2026-10-31",
    note: "Lists water “one gallon per person per day for several days” and “at least a several-day supply” of food. It does not set a 14-day target.",
  },
  "cdc-water": {
    org: "CDC",
    title: "How to Create an Emergency Water Supply",
    url: "https://www.cdc.gov/water-emergency/about/how-to-create-and-store-an-emergency-water-supply.html",
    reviewed: "2026-10-31",
    note: "“Store at least 1 gallon of water per person, per day for 3 days. Try to store a 2-week supply if possible.” Replace stored water every six months.",
  },
  "cdc-safe-water": {
    org: "CDC",
    title: "How to Make Water Safe in an Emergency",
    url: "https://www.cdc.gov/water-emergency/about/index.html",
    reviewed: "2026-10-31",
  },
  "cdc-hygiene": {
    org: "CDC",
    title: "Guidelines for Personal Hygiene During an Emergency",
    url: "https://www.cdc.gov/water-emergency/safety/guidelines-for-personal-hygiene-during-an-emergency.html",
    reviewed: "2026-10-31",
    note: "Hand sanitizer should contain at least 60% alcohol.",
  },
  "ready-plan": {
    org: "Ready.gov (FEMA)",
    title: "Family Emergency Communication Plan card",
    url: "https://www.ready.gov/sites/default/files/2025-06/family-communication-plan_fillable-card.pdf",
    reviewed: "2026-10-31",
  },
  "ready-pets": {
    org: "Ready.gov (FEMA)",
    title: "Prepare Your Pets for Disasters",
    url: "https://www.ready.gov/pets",
    reviewed: "2026-10-31",
    note: "The page refused automated retrieval during this review. Pet items follow Ready.gov's kit list (pet food and extra water); amounts are yours to set with your veterinarian.",
  },
  "usfa-smoke": {
    org: "U.S. Fire Administration",
    title: "When to test smoke alarms",
    url: "https://www.usfa.fema.gov/gallery/pictographs/pictograph04.html",
    reviewed: "2026-10-31",
    note: "“Test smoke alarms at least once a month using the test button.”",
  },
  "king-county-toilet": {
    org: "Public Health – Seattle & King County",
    title: "How to create an emergency toilet",
    url: "https://kingcounty.gov/en/dept/dph/health-safety/safety-injury-prevention/emergency-preparedness/personal-preparedness/emergency-toilets",
    reviewed: "2026-10-31",
  },
  "egle-wells": {
    org: "Michigan EGLE",
    title: "Protecting Your Private Water Supply in an Emergency (04/2020)",
    url: "https://www.michigan.gov/egle/-/media/Project/Websites/egle/Documents/Programs/DWEHD/Water-Well-Construction/Protecting-Your-Private-Water-Supply-in-an-Emergency.pdf",
    reviewed: "2026-10-31",
    note: "Suggests a few 5-gallon pails of non-drinking water for toilet flushing during outages for homes on private wells.",
  },
};
