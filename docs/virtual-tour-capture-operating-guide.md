# Singapore Virtual Property Tour Operating Guide

## What UrbanKey publishes today

UrbanKey’s initial **Virtual Property Tour** is an optional guided photo-and-floor-plan experience. It connects approved listing images to room hotspots and a schematic floor-plan navigator while retaining the pre-existing photo-timing selector. It must be labelled as a guided photo tour—not a complete 360-degree capture, survey, or as-built model—unless verified panoramic capture assets and route data are supplied later.

Only selected Singapore listings expose the Virtual Property Tour badge. Listings without approved tour metadata remain standard photo listings.

## Required authorisation and review

The listing owner or an authorised representative must opt in before a tour can be prepared or published. The publishing agent remains responsible for confirming that the room order, captions, approved highlights, floor-plan relationships, and listing statements are accurate for the material being shown.

| Review stage | Required control | Publication rule |
|---|---|---|
| Consent | Owner or authorised representative approves the tour media and scope. | Do not publish without recorded authority. |
| Coverage | Include the intended room sequence and note omitted rooms or areas. | Do not imply a complete walkthrough when coverage is partial. |
| Automated privacy pass | Detect candidates for faces, family photographs, letters, cards, name cards, access codes, screens, licence plates, and other personal information. | Flag assets for review; automated detection alone is insufficient. |
| Manual privacy review | A person confirms redactions and checks for missed personal information. | Required before publishing a real listing tour. |
| Accuracy review | Check that no blur or crop hides a material defect, damage, fixture, access constraint, view, or condition. | Reject misleading tours and correct the media. |
| Final publication | Agent confirms tour label, floor-plan disclaimer, and AI-guide metadata. | Set the review status to `reviewed` only after the preceding checks. |

> **Important:** The current product foundation stores a `demo-review-required` status and displays the required privacy workflow. It does **not** yet perform pixel-level automatic redaction. A production upload pipeline must integrate a vetted vision/redaction provider, retain the original only in authorised storage, keep a redaction audit record, and require manual approval before the public asset is served.

## Capture-quality checklist for future 360-degree tours

For a future true panoramic implementation, capture a planned route through each intended room and connecting corridor, maintain line-of-sight between adjacent positions, use stable exposure and sufficient lighting, remove moving objects, and capture the centre of each space. The operator must avoid showing personal documents, family images, access keys, alarms, security panels, and any other information that could identify or expose the seller. These practices are consistent with public virtual-tour capture guidance.[1]

Each future 360-degree record should include the panorama source, room identifier, adjacent hotspots, initial heading, capture date, review status, agent approval, owner authority, and redaction reference. Do not manufacture a 360-degree navigation mesh from ordinary photographs.

## AI Tour Guide boundary

The optional guide reads only the currently selected room’s approved label, note, and highlights after a visitor chooses **Listen to guide**. It must not infer measurements, condition, availability, ownership, schools, amenities, legal status, or price implications beyond the approved listing metadata. It cannot chat with external parties, book appointments, give professional advice, or amend the listing. Future conversational capabilities require approved source citations, escalation wording, multilingual review, and a transcript/audit policy.

## Viewer analytics boundary

The foundation records session-only tour entry, room visits, and appointment intent in the visitor’s device storage. It does not perform cross-list tracking, identity resolution, automated lead scoring, or unsolicited contact. A future agent analytics view must use documented consent, retention limits, role-based access, and aggregation thresholds before any reporting is exposed.

## References

[1]: https://www.zillow.com/3d-home/faq/ "Zillow 3D Home FAQ"
