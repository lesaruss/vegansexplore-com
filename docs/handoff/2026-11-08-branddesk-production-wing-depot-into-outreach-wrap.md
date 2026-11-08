# branddesk-production-wing: the Depot's people tools into BrandDesk Outreach (wrap, 2026-11-08)

## Rule (Sean, locked)
Never use Depot Outreach (`ve_people_outreach`). Every email goes through BrandDesk > Vegans Explore > Outreach campaigns
(`ve_outreach_campaigns`, sent by `ve-outreach` `campaignTick`). Never use or restore a Depot page that says it moved to BrandDesk.

## Live
- Redirect stubs (agent comment + policy line in each): admin/depot/outreach, social, playbooks, analytics, members.
  business-outreach keeps only #places, #checkups, #partners (hash guard), the rest redirects to the Roster.
- Cron `ve-people-outreach` unscheduled (migration 20261108_retire_depot_outreach.sql). 78 old drafts stay unsent.
- Edge function `ve-hq-bridge` (admin token + as_member; super admins in good standing only, never agents; 15-minute token, hq_bridge:true; logged).
- CLAUDE.md section "Moving to BrandDesk" and the REMOVED note on Depot > Outreach.

## Built, waiting on Sean's merge (HQ branch claude/amazing-hamilton-zpeq6o, 7e882a9, preview READY)
- lib/veDepot.ts (ALLOW map, cached bridge tokens), app/api/branddesk/depot/route.ts.
- OutreachDesk: Who list opens a person page (timeline, tags, notes, Give/Take back points) with group boxes
  (Ambassadors, Invited, Referral claims); PeopleRoom: Links tab.
- Not clicked signed in as an owner (vegan@ is an agent; the bridge refuses it: view only).

## After merge
Redirect Depot People, Links and Referral claims to BrandDesk.

## Still in the Depot, order to move
1. New invitations (Founding Member, Ambassador, Nonprofit/Group Partner) as a BrandDesk campaign type.
2. Ambassador commissions, creator applications, paid work.
3. Role applications, Leads.
4. Nonprofit Partners, Group Partners, Community Managers, Profiles review (all empty 2026-11-08).
5. BrandDesk client billing.

## Brion Hurley
+2,500 points (admin_adjust, founder ref), link pp-brion-thanks; his email went out through Depot Outreach before removal
(row 311baf5f, email_sends 863dd771 delivered, opened). Tracking intact.
