import Stripe from 'npm:stripe@14'
import { createClient } from 'jsr:@supabase/supabase-js@2'

// This single endpoint now receives checkout.session.completed events from three
// separate Stripe accounts: VE's existing account (points purchases, legacy
// founding-membership), the LESARUSS account (Problem Solver deposits,
// e.g. Hugh Stewart; Coach OS subscriptions, e.g. Meatless Muscle dashboard billing;
// TalentVangelist Audit purchases; SAR book tripwire purchases, added 2026-08-16;
// VE Passport $11/month subscriptions, added 2026-08-17; VE Verified yearly
// subscriptions on VE's account, added 2026-09-27),
// and now Meatless Muscle's OWN account
// (Brooke Sellers' cookbook e-book sales, added 2026-08-13 per Sean - book sales
// route to her Stripe directly, not the shared LESARUSS one). Each account has its
// own registered webhook endpoint pointing here with its own signing secret, so
// verification tries all configured secrets before rejecting - the business-logic
// branches below are unchanged.
// Test-mode LESARUSS webhook secret is also tried, so test-mode checkout
// sessions (client-intake-checkout, coach-os-billing-session with test_mode:true,
// talentvangelist-audit-checkout with test_mode:true) verify correctly too.
// MEATLESS_MUSCLE_STRIPE_WEBHOOK_SECRET is not set yet - Brooke still needs to add
// a webhook endpoint in her own Stripe dashboard pointing here and give us the
// whsec_... it generates. Until then this array entry is just absent (filtered out
// below), so cookbook purchases on her account will show as 'pending' and never
// flip to 'paid' until that secret is added.
//
// IMPORTANT: Deno's crypto provider is async-only (SubtleCrypto), so this
// MUST use constructEventAsync, not the sync constructEvent - the sync form
// throws "SubtleCryptoProvider cannot be used in a synchronous context" on
// every single call, which was silently causing every webhook delivery to
// fail signature verification (fixed 2026-07-17 while testing the LESARUSS
// test-mode Stripe pipeline).
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  httpClient: Stripe.createFetchHttpClient(),
})
const WEBHOOK_SECRETS = [
  Deno.env.get('STRIPE_WEBHOOK_SECRET'),
  Deno.env.get('STRIPE_WEBHOOK_SECRET_LESARUSS'),
  Deno.env.get('STRIPE_WEBHOOK_SECRET_LESARUSS_TEST'),
  Deno.env.get('MEATLESS_MUSCLE_STRIPE_WEBHOOK_SECRET'),
].filter(Boolean) as string[]

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

// Checkout buyers join the LESARUSS email lists (public.email_list_members,
// universal email system in lesaruss-hq migration 028), replacing Beehiiv.
// email_list_subscribe is idempotent and never re-adds someone who
// unsubscribed, bounced or complained. A failure is logged, never thrown, so
// it cannot break the checkout flow.
async function subscribeToList(email: string, name: string, list: string) {
  const { error } = await supabase.rpc('email_list_subscribe', {
    p_list: list,
    p_email: email,
    p_name: name || null,
    p_source: 'vegans-explore',
    p_source_detail: 'checkout',
  })
  if (error) {
    console.error(`Email list error (${list}):`, error.message)
  } else {
    console.log(`Email list subscribed to ${list}:`, email)
  }
}

function buildWelcomeEmail(name: string, magicLink: string): string {
  const firstName = name ? name.split(' ')[0] : 'Founding Member'
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Welcome to VEGANS EXPLORE</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f5f5;padding:32px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;">

      <!-- Header -->
      <tr>
        <td style="background:#2D7A4F;padding:32px;">
          <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">VEGANS EXPLORE</p>
          <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.65);">Coming July 13, 2026</p>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="padding:36px 32px;">
          <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#111111;line-height:1.3;">Thank you for being here early, ${firstName}.</h1>
          <p style="margin:0 0 14px;font-size:15px;line-height:1.7;color:#444444;">Your founding membership is confirmed. You are one of the first people inside VEGANS EXPLORE, and that means something to us.</p>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#444444;">We are putting the finishing touches on the full experience. The moment beta access opens, you will be the first to know - and the first in.</p>

          <!-- CTA -->
          <table cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 28px;">
            <tr>
              <td style="background:#2D7A4F;border-radius:6px;">
                <a href="${magicLink}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">Enter the members room</a>
              </td>
            </tr>
          </table>

          <hr style="border:none;border-top:1px solid #eeeeee;margin:24px 0;">

          <p style="margin:0 0 14px;font-size:15px;line-height:1.7;color:#444444;">Until then, your members room is your home base. We will reach you there when the doors open.</p>
          <p style="margin:0;font-size:15px;line-height:1.7;color:#444444;">We are glad you are with us. See you on the other side.</p>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background:#f9f9f9;padding:16px 32px;border-top:1px solid #eeeeee;">
          <p style="margin:0;font-size:11px;color:#aaaaaa;">VEGANS EXPLORE &nbsp;|&nbsp; contact@vegansexplore.com &nbsp;|&nbsp; <a href="https://vegansexplore.com" style="color:#aaaaaa;">vegansexplore.com</a></p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`
}

function buildPointsReceiptEmail(points: number, balance: number): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f7f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:32px 16px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;">
      <tr><td style="background:#1a1a1a;padding:28px 32px;"><span style="color:#22C55E;font-size:18px;font-weight:700;letter-spacing:0.05em;">VEGANS EXPLORE</span></td></tr>
      <tr><td style="padding:32px;">
        <h1 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#111;">Points added to your account</h1>
        <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;padding:18px 22px;margin:18px 0 24px;">
          <p style="margin:0 0 4px;font-size:12px;color:#166534;font-weight:700;letter-spacing:.05em;">POINTS ADDED</p>
          <p style="margin:0;font-size:26px;font-weight:800;color:#15803D;">+${points.toLocaleString()} Points</p>
          <p style="margin:6px 0 0;font-size:13px;color:#166534;">New balance: ${balance.toLocaleString()} Points</p>
        </div>
        <a href="https://vegansexplore.com/guides" style="display:inline-block;background:#22C55E;color:#fff;font-weight:700;padding:12px 24px;border-radius:6px;text-decoration:none;font-size:14px;">Unlock a Guide</a>
      </td></tr>
      <tr><td style="background:#f9f9f9;padding:14px 32px;border-top:1px solid #eee;"><p style="margin:0;font-size:11px;color:#aaa;">VEGANS EXPLORE &nbsp;|&nbsp; vegansexplore.com</p></td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`
}

// Thank-you for a contribution from a member who already holds the Passport (the dashboard's Contribute).
// It earns the flat 25-point thank-you, never points by the dollar (Sean, 2026-10-25).
function buildContributionThanksEmail(amountCents: number): string {
  const dollars = (amountCents / 100).toLocaleString('en-US', { minimumFractionDigits: amountCents % 100 ? 2 : 0 })
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f7f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:32px 16px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;">
      <tr><td style="background:#1a1a1a;padding:28px 32px;"><span style="color:#3A9B3E;font-size:18px;font-weight:700;letter-spacing:0.05em;">VEGANS EXPLORE</span></td></tr>
      <tr><td style="padding:32px;">
        <h1 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#111;">Thank you for your contribution</h1>
        <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#444;">Your $${dollars} helps us build faster: Community Nights, events, and support for local Vegan businesses and organizations. It is a contribution to our community, not a tax-deductible donation. A 25-point thank-you is in your account.</p>
        <a href="https://vegansexplore.com/dashboard" style="display:inline-block;background:#3A9B3E;color:#fff;font-weight:700;padding:12px 24px;border-radius:6px;text-decoration:none;font-size:14px;">Back to your dashboard</a>
      </td></tr>
      <tr><td style="background:#f9f9f9;padding:14px 32px;border-top:1px solid #eee;"><p style="margin:0;font-size:11px;color:#aaa;">VEGANS EXPLORE &nbsp;|&nbsp; vegansexplore.com</p></td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`
}

// Branded receipt for the Passport, used by the $11 one-time join (entry_contribution) and the
// legacy monthly subscription's signup and renewals. Sean locked 2026-10-25: the Passport comes with
// 1,100 welcome points (one Guide's worth); more points come from taking part.
function buildPassportReceiptEmail(opts: { renewal: boolean }): string {
  const { renewal } = opts
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f7f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:32px 16px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;">
      <tr><td style="background:#1a1a1a;padding:28px 32px;"><span style="color:#3A9B3E;font-size:18px;font-weight:700;letter-spacing:0.05em;">VEGANS EXPLORE</span></td></tr>
      <tr><td style="padding:32px;">
        <h1 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#111;">${renewal ? 'Your Passport renewed' : 'Your Passport is active'}</h1>
        <p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#444;">${renewal ? 'Your Passport renewed. Thank you for being part of the community.' : 'Thank you for joining Vegans Explore. Your Passport is active: vote for your favorite listings in the Directory and build your Vegan world from your dashboard.'}</p>
        ${renewal ? '' : `<div style="background:#e8f5e9;border:1px solid #b8ddb9;border-radius:8px;padding:18px 22px;margin:0 0 24px;">
          <p style="margin:0 0 4px;font-size:12px;color:#2d7d31;font-weight:700;letter-spacing:.05em;">WELCOME POINTS</p>
          <p style="margin:0;font-size:26px;font-weight:800;color:#2d7d31;">+1,100 points</p>
          <p style="margin:6px 0 0;font-size:13px;color:#2d7d31;">One Guide's worth: unlock a Guide, or use them any way points work.</p>
        </div>`}
        <p style="margin:0 0 24px;font-size:13px;line-height:1.6;color:#444;">More points come from what you do in the community: Bounties, competitions and taking part on the site. Your lifetime points move you up through Level 1, 2 and 3.</p>
        <a href="https://vegansexplore.com/guides" style="display:inline-block;background:#3A9B3E;color:#fff;font-weight:700;padding:12px 24px;border-radius:6px;text-decoration:none;font-size:14px;">Pick your Guide</a>
      </td></tr>
      <tr><td style="background:#f9f9f9;padding:14px 32px;border-top:1px solid #eee;"><p style="margin:0;font-size:11px;color:#aaa;">VEGANS EXPLORE &nbsp;|&nbsp; vegansexplore.com</p></td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`
}

// Branded receipt for Coach OS digital purchases (e.g. Meatless Muscle cookbook).
// Includes the real download link directly in the email (not just "go back to the
// site") since Sean flagged 2026-07-21 that the first version of this email gave
// no download link and no Miss Meatless Muscle branding - it read as generic and
// unprofessional. Colors/logo mark match the live site (index.html .brand /
// --green-900 / --green-700). Reusable for future Coach OS clients: swap brandName,
// accent colors, productName, and supportEmail per brand.
function buildCookbookReceiptEmail(opts: {
  brandName: string
  brandAccentHtml: string
  productName: string
  priceLabel: string
  downloadUrl: string
  supportEmail: string
  siteUrl: string
}): string {
  const { brandName, brandAccentHtml, productName, priceLabel, downloadUrl, supportEmail, siteUrl } = opts
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Your order is ready</title></head>
<body style="margin:0;padding:0;background:#eef7f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:32px 16px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #e5e7eb;">

      <tr><td style="background:#123a22;padding:26px 32px;">
        <span style="color:#ffffff;font-size:18px;font-weight:800;">${brandName} ${brandAccentHtml}</span>
      </td></tr>

      <tr><td style="padding:36px 32px;">
        <h1 style="margin:0 0 14px;font-size:22px;font-weight:800;color:#123a22;">You're all set!</h1>
        <p style="margin:0 0 22px;font-size:15px;line-height:1.6;color:#444444;">Thanks for grabbing <strong>${productName}</strong>. Your e-book is ready to download below - no need to go back to the site.</p>

        <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 26px;">
          <tr>
            <td style="background:#1f6b3a;border-radius:6px;">
              <a href="${downloadUrl}" style="display:inline-block;padding:14px 30px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">Download Your E-Book (PDF)</a>
            </td>
          </tr>
        </table>

        <div style="background:#eef7f0;border-radius:8px;padding:16px 20px;margin:0 0 24px;">
          <p style="margin:0 0 4px;font-size:11px;color:#1f6b3a;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;">Order Summary</p>
          <p style="margin:0;font-size:14px;color:#123a22;font-weight:600;">${productName}</p>
          <p style="margin:2px 0 0;font-size:14px;color:#4b5563;">${priceLabel} &middot; Digital download</p>
        </div>

        <p style="margin:0;font-size:13px;line-height:1.6;color:#6b7280;">Keep this email - the download link above works anytime. Questions about the book? Just reply to Brooke directly at <a href="mailto:${supportEmail}" style="color:#1f6b3a;">${supportEmail}</a>.</p>
      </td></tr>

      <tr><td style="background:#f9f9f9;padding:16px 32px;border-top:1px solid #eeeeee;">
        <p style="margin:0;font-size:11px;color:#aaaaaa;">${brandName} &nbsp;|&nbsp; <a href="${siteUrl}" style="color:#aaaaaa;">${siteUrl.replace('https://','')}</a></p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`
}

// Branded receipt for SAR book tripwire purchases (From Blur to Blueprint, and every
// future SAR book reusing this same $11 model). Points the reader straight at the
// real-member-area login (email + one-time code) rather than handing out the
// content directly by email, per Sean's 2026-08-16 explicit choice of a real member
// area over plain email delivery.
function buildBookTripwireReceiptEmail(opts: {
  productName: string
  priceLabel: string
  accessUrl: string
}): string {
  const { productName, priceLabel, accessUrl } = opts
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>You're in</title></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:32px 16px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #e5e7eb;">
      <tr><td style="background:#111111;padding:26px 32px;"><span style="color:#ffffff;font-size:18px;font-weight:800;">SEAN A. RUSSELL</span></td></tr>
      <tr><td style="padding:36px 32px;">
        <h1 style="margin:0 0 14px;font-size:22px;font-weight:800;color:#111111;">You're in.</h1>
        <p style="margin:0 0 22px;font-size:15px;line-height:1.6;color:#444444;">Thanks for grabbing <strong>${productName}</strong>. Your digital book, audiobook, and the chapter-by-chapter video series are waiting for you inside your member access page.</p>
        <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 26px;">
          <tr><td style="background:#111111;border-radius:6px;">
            <a href="${accessUrl}" style="display:inline-block;padding:14px 30px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">Enter Your Access Page</a>
          </td></tr>
        </table>
        <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#6b7280;">Use the same email you just checked out with to sign in there - we'll send a one-time code, no password needed.</p>
        <p style="margin:16px 0 0;font-size:14px;color:#123a22;font-weight:600;">${productName}</p>
        <p style="margin:2px 0 0;font-size:14px;color:#4b5563;">${priceLabel} &middot; One-time purchase</p>
      </td></tr>
      <tr><td style="background:#f9f9f9;padding:16px 32px;border-top:1px solid #eeeeee;"><p style="margin:0;font-size:11px;color:#aaaaaa;">Sean A. Russell &nbsp;|&nbsp; <a href="https://seanarussell.com" style="color:#aaaaaa;">seanarussell.com</a></p></td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`
}

// Branded receipt for the ADA Unlocked $111 course + Level 1 Audit purchase.
// Repositioned 2026-08-16 (Logan) from the original $11 "2027 Countdown" guide,
// per Sean: same real-member-area-over-plain-email standard as the SAR book
// tripwire -- points to /guide/access on the ADA Unlocked site instead of a
// download link, since this product is a gated web course + live audit tool,
// not a file.
function buildAdaGuideReceiptEmail(opts: {
  productName: string
  priceLabel: string
  accessUrl: string
}): string {
  const { productName, priceLabel, accessUrl } = opts
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>You're in</title></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:32px 16px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #e5e7eb;">
      <tr><td style="background:#123a22;padding:26px 32px;"><span style="color:#ffffff;font-size:18px;font-weight:800;">ADA UNLOCKED</span></td></tr>
      <tr><td style="padding:36px 32px;">
        <h1 style="margin:0 0 14px;font-size:22px;font-weight:800;color:#111111;">You're in.</h1>
        <p style="margin:0 0 22px;font-size:15px;line-height:1.6;color:#444444;">Thanks for grabbing <strong>${productName}</strong>. Your course, your Level 1 Audit tool, and your action plan are waiting for you inside your access page.</p>
        <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 26px;">
          <tr><td style="background:#123a22;border-radius:6px;">
            <a href="${accessUrl}" style="display:inline-block;padding:14px 30px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">Enter Your Access Page</a>
          </td></tr>
        </table>
        <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#6b7280;">Use the same email you just checked out with to sign in there - we'll send a one-time code, no password needed.</p>
        <p style="margin:16px 0 0;font-size:14px;color:#123a22;font-weight:600;">${productName}</p>
        <p style="margin:2px 0 0;font-size:14px;color:#4b5563;">${priceLabel} &middot; One-time purchase</p>
      </td></tr>
      <tr><td style="background:#f9f9f9;padding:16px 32px;border-top:1px solid #eeeeee;"><p style="margin:0;font-size:11px;color:#aaaaaa;">ADA Unlocked &nbsp;|&nbsp; <a href="https://ada-unlocked.vercel.app" style="color:#aaaaaa;">adaunlocked.com</a></p></td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`
}

// Branded receipt for the ADA Unlocked Level 2 Audit deposit ($1,500). Added
// 2026-08-16 (Logan) as part of wiring the first working draft of the
// intake-to-remediation-to-close-out workflow Sean asked to see end to end.
// Points to the internal /admin/engagements tracker context implicitly by telling
// the client we'll be in touch to confirm access -- this is a paid engagement
// kickoff, not a self-serve product, so there is no gated access page here.
function buildAdaLevel2ReceiptEmail(opts: {
  orgName: string
  priceLabel: string
}): string {
  const { orgName, priceLabel } = opts
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Your Level 2 Audit is confirmed</title></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:32px 16px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #e5e7eb;">
      <tr><td style="background:#123a22;padding:26px 32px;"><span style="color:#ffffff;font-size:18px;font-weight:800;">ADA UNLOCKED</span></td></tr>
      <tr><td style="padding:36px 32px;">
        <h1 style="margin:0 0 14px;font-size:22px;font-weight:800;color:#111111;">Your Level 2 Audit is confirmed.</h1>
        <p style="margin:0 0 22px;font-size:15px;line-height:1.6;color:#444444;">Thanks, ${orgName}. We've got your Level 2 Audit request and payment. Next, we'll follow up directly to confirm scope and how you'd like to grant access -- nothing gets touched on your site until that's confirmed with you.</p>
        <p style="margin:16px 0 0;font-size:14px;color:#123a22;font-weight:600;">Level 2 Audit</p>
        <p style="margin:2px 0 0;font-size:14px;color:#4b5563;">${priceLabel} &middot; One-time</p>
      </td></tr>
      <tr><td style="background:#f9f9f9;padding:16px 32px;border-top:1px solid #eeeeee;"><p style="margin:0;font-size:11px;color:#aaaaaa;">ADA Unlocked &nbsp;|&nbsp; <a href="https://ada-unlocked.vercel.app" style="color:#aaaaaa;">adaunlocked.com</a></p></td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`
}


// ---- Money in (Sean, 2026-11-01: "Is there something that can be sent to me whenever we receive money?... branded and let me
// know what was purchased and by whom"). One email to the team for every live payment this webhook receives, from every account,
// before any product's own branch runs, so a new product is covered without a change here: a paid Checkout session, and a
// subscription renewal invoice (the first invoice of a subscription is its Checkout session, so it is not counted twice).
// ve_money_alerts keeps one row per payment (stripe_id unique), so a Stripe retry never sends twice. Test mode sends nothing.
// A preview of any real session: POST ?money_preview=<cs_...> with Authorization: Bearer <LESARUSS_ADMIN_TOKEN>, sent with
// [Preview] and no row.
const MONEY_TO = 'contact@lesaruss.com'
const MONEY_LABELS: Record<string, [string, string]> = {
  entry_contribution: ['Vegans Explore', 'Vegans Explore Passport'],
  passport_subscription: ['Vegans Explore', 'Vegans Explore Passport (monthly)'],
  points_purchase: ['Vegans Explore', 'Points'],
  partner_guide_purchase: ['Vegans Explore', 'Explore Season Partners Guide'],
  ve_verified: ['Vegans Explore', 'VE Verified (yearly)'],
  ve_guide_purchase: ['Vegans Explore', 'A Guide'],
  ve_ticket: ['Vegans Explore', 'Event tickets'],
  ve_tour_ticket: ['Vegans Explore', 'Tour tickets'],
  ve_audit_purchase: ['Vegans Explore', 'Restaurant audit'],
  ve_branddesk: ['Vegans Explore', 'BrandDesk managed marketing'],
  ve_group_gift: ['Vegans Explore', 'A gifted membership'],
  ve_service: ['Vegans Explore', 'A service'],
  ve_credit_purchase: ['Vegans Explore', 'Guide credits'],
  ve_claim: ['Vegans Explore', 'Listing claim'],
  book_tripwire_purchase: ['Sean A. Russell', 'Book'],
  ada_unlocked_guide_purchase: ['ADA Unlocked', 'ADA Unlocked course and Level 1 Audit'],
  ada_unlocked_level2_deposit: ['ADA Unlocked', 'Level 2 Audit deposit'],
  coach_os_digital_purchase: ['Meatless Muscle', 'Cookbook'],
  coach_os_subscription: ['Coach OS', 'Coach OS subscription'],
  problem_solver_deposit: ['LESARUSS', 'Problem Solver deposit'],
  talentvangelist_audit: ['TalentVangelist', 'TalentVangelist Audit'],
  // LESARUSS-account checkouts that carry metadata.kind (lesaruss-hq lib/*.ts; the campaigns checkout on every brand).
  lr_passport: ['LESARUSS.ai', 'LESARUSS Passport'],
  listing_claim: ['LESARUSS.ai', 'LESARUSS.ai listing claim'],
  guide_order: ['LESARUSS.ai', 'A LESARUSS.ai Guide'],
  business_membership: ['LESARUSS', 'LESARUSS business membership'],
  campaign_pledge: ['LESARUSS', 'Campaign pledge'],
}
// The one type that names several products: label it by what the session says (Sean, 2026-11-01, Money in item 2).
function moneyLabel(type: string, meta: Record<string, string>, member: any, at: Date): string {
  if (type === 've_verified') {
    if (meta.tier === 'brand') {
      const offer = meta.offer === 'front_row' ? 'Front Row Start' : meta.offer === 'prorated' ? 'prorated' : meta.offer === 'preparation' ? 'Preparation window' : ''
      return 'Partner plan ($111 every 111 days)' + (offer || meta.period ? ` · ${[offer, meta.period ? 'Period ' + meta.period : ''].filter(Boolean).join(', ')}` : '')
    }
    if (meta.tier === 'plus') return 'Passport Anchor (quarterly)'
    if (meta.tier === 'verified') return 'Passport Stop (quarterly)'
    return 'Listing plan'
  }
  if (type === 'entry_contribution') {
    if (meta.claim_id) return 'Listing claim with the Passport'
    // Already a member well before this payment: the dashboard's Contribute, not a new Passport.
    if (member?.entry_paid_at && new Date(member.entry_paid_at).getTime() < at.getTime() - 3600e3) return 'A contribution'
    return 'Vegans Explore Passport'
  }
  if (type === 'campaign_pledge' && meta.campaign_slug) return `Campaign pledge: ${meta.campaign_slug}`
  return MONEY_LABELS[type]?.[1] || ''
}
function moneyAccount(verifiedWith: string | null): { name: string; slug: string; key: string | undefined } {
  if (verifiedWith && verifiedWith === Deno.env.get('STRIPE_WEBHOOK_SECRET')) return { name: 'Vegans Explore', slug: 'vegans-explore', key: Deno.env.get('STRIPE_SECRET_KEY') }
  if (verifiedWith && verifiedWith === Deno.env.get('MEATLESS_MUSCLE_STRIPE_WEBHOOK_SECRET')) return { name: 'Meatless Muscle', slug: 'meatless-muscle', key: undefined }
  return { name: 'LESARUSS', slug: 'lesaruss', key: Deno.env.get('STRIPE_SECRET_KEY_LESARUSS') }
}
const moneyEsc = (v: unknown) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const moneyFmt = (cents: number, cur = 'usd') => (cur.toLowerCase() === 'usd' ? '$' : cur.toUpperCase() + ' ') + (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const moneyEastern = (d: Date) => d.toLocaleString('en-US', { timeZone: 'America/New_York', weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) + ' Eastern'
async function moneyLines(sessionId: string, key: string | undefined): Promise<string[]> {
  const keys = [key, Deno.env.get('STRIPE_SECRET_KEY'), Deno.env.get('STRIPE_SECRET_KEY_LESARUSS')].filter(Boolean) as string[]
  for (const k of [...new Set(keys)]) {
    try {
      const r = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}/line_items?limit=10`, { headers: { Authorization: `Bearer ${k}` } })
      if (!r.ok) continue
      const o = await r.json()
      return (o.data || []).map((li: any) => `${li.quantity && li.quantity > 1 ? li.quantity + ' x ' : ''}${li.description || li.price?.nickname || 'Item'} (${moneyFmt(li.amount_total ?? 0, li.currency || 'usd')})`)
    } catch { /* next key */ }
  }
  return []
}
async function moneyMember(email: string | null) {
  if (!email) return null
  const { data } = await supabase.from('members').select('*').ilike('email', email).limit(1).maybeSingle()
  return data as any
}
// Their first payment: not a renewal, and their account was paid for within the hour of this payment (or they have none yet).
const moneyFirst = (o: any) => !o.renewal && (!o.member?.entry_paid_at || new Date(o.member.entry_paid_at).getTime() >= o.at.getTime() - 3600e3)
// Midnight Eastern on the 1st of this Eastern month, as UTC: 04:00Z under EDT, 05:00Z under EST (the clock change is read
// from the zone itself, so December counts from 05:00Z and April from 04:00Z).
function moneyMonthStart(now: Date): string {
  const ym = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit' }).format(now)
  for (const h of [4, 5]) {
    const t = new Date(`${ym}-01T0${h}:00:00Z`)
    const hour = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: '2-digit', hourCycle: 'h23' }).format(t)
    if (hour === '00') return t.toISOString()
  }
  return new Date(`${ym}-01T05:00:00Z`).toISOString()
}
async function moneyMonth(): Promise<{ cents: number; count: number }> {
  const { data } = await supabase.from('ve_money_alerts').select('amount_cents').gte('created_at', moneyMonthStart(new Date()))
  return { cents: (data || []).reduce((t: number, r: any) => t + (r.amount_cents || 0), 0), count: (data || []).length }
}
function moneyEmail(o: { amount: number; currency: string; brand: string; product: string; lines: string[]; name: string; email: string;
  member: any; first: boolean; at: Date; account: string; stripeUrl: string; ref: string; month: { cents: number; count: number }; renewal: boolean; preview: boolean }) {
  const ve = o.brand === 'Vegans Explore'
  const m = o.member
  const who = m ? `${moneyEsc(o.name || m.name || m.username || '')}${m.username ? ` <span style="color:#6b7280">@${moneyEsc(m.username)}</span>` : ''}` : moneyEsc(o.name || 'Not given')
  const memberLine = m
    ? [m.founding_member ? 'Founding Member' : (m.membership_status === 'active' ? 'Member' : 'Account waiting for payment'), m.ve_role && !['member'].includes(m.ve_role) ? String(m.ve_role).replace(/_/g, ' ') : '', m.home_community ? 'Home: ' + String(m.home_community).replace(/-/g, ' ') : '', m.created_at ? 'Account since ' + new Date(m.created_at).toLocaleDateString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', year: 'numeric' }) : ''].filter(Boolean).join(' · ')
    : 'No Vegans Explore account with this email'
  const row = (k: string, v: string) => `<tr><td style="padding:10px 0;border-top:1px solid #eef0ec;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#2D5C27;width:120px;vertical-align:top">${k}</td><td style="padding:10px 0;border-top:1px solid #eef0ec;font-size:15px;color:#1A1A1A;line-height:1.5">${v}</td></tr>`
  const head = ve
    ? `<td style="background:#0F1F14;padding:20px 28px"><img src="https://vegansexplore.com/public/ve-mark.png" width="34" height="34" alt="" style="vertical-align:middle;border-radius:6px"> <span style="color:#ffffff;font-size:17px;font-weight:900;letter-spacing:.08em;vertical-align:middle;margin-left:8px">VEGANS EXPLORE</span></td>`
    : `<td style="background:#1A1A1A;padding:20px 28px"><span style="color:#ffffff;font-size:17px;font-weight:900;letter-spacing:.08em">${moneyEsc(o.brand.toUpperCase())}</span></td>`
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Money in</title></head>
<body style="margin:0;padding:0;background:#f3f5f1;font-family:Montserrat,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:28px 14px"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e3e8e0">
<tr>${head}</tr>
<tr><td style="padding:30px 28px 8px">
${o.preview ? '<p style="margin:0 0 14px;padding:8px 12px;background:#fff4e0;color:#6b4a00;border-radius:6px;font-size:13px;font-weight:700">Preview: a real payment from earlier, shown as the email will look. Nothing new came in.</p>' : ''}
<p style="margin:0;font-size:12px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#3A9B3E">${o.renewal ? 'Renewal paid' : 'Money in'}</p>
<p style="margin:6px 0 2px;font-size:44px;font-weight:900;color:#1A1A1A;line-height:1.05">${moneyFmt(o.amount, o.currency)}</p>
<p style="margin:0 0 6px;font-size:17px;font-weight:700;color:#2D5C27">${moneyEsc(o.product)}</p>
<p style="margin:0 0 18px;font-size:14px;color:#4b5563">from ${moneyEsc(o.name || o.email || 'someone')}${o.first ? ' · <b style="color:#F69820">their first payment</b>' : ''}</p>
<table width="100%" cellpadding="0" cellspacing="0" border="0">
${row('What', o.lines.length ? o.lines.map(moneyEsc).join('<br>') : moneyEsc(o.product))}
${row('Who', who)}
${row('Email', o.email ? `<a href="mailto:${moneyEsc(o.email)}" style="color:#2D5C27">${moneyEsc(o.email)}</a>` : 'Not given')}
${row('Member', moneyEsc(memberLine))}
${row('When', moneyEsc(moneyEastern(o.at)))}
${row('Paid to', moneyEsc(o.account) + ' Stripe' + (o.brand !== o.account ? ' · ' + moneyEsc(o.brand) : ''))}
</table>
<table cellpadding="0" cellspacing="0" border="0" style="margin:22px 0 6px"><tr><td style="background:#2D5C27;border-radius:6px"><a href="${moneyEsc(o.stripeUrl)}" style="display:inline-block;padding:12px 20px;color:#ffffff;font-size:13px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;text-decoration:none">See it in Stripe</a></td></tr></table>
</td></tr>
<tr><td style="padding:16px 28px;background:#E8F5E9;font-size:14px;color:#1A1A1A"><b>This month so far:</b> ${moneyFmt(o.month.cents)} from ${o.month.count} payment${o.month.count === 1 ? '' : 's'}</td></tr>
<tr><td style="padding:14px 28px;font-size:11px;color:#9ca3af">Sent to the team for every payment we receive. Reference ${moneyEsc(o.ref)}.</td></tr>
</table></td></tr></table></body></html>`
}
async function moneySend(subject: string, html: string): Promise<string | null> {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'VEGANS EXPLORE <hello@vegansexplore.com>', to: [MONEY_TO], subject, html }),
  })
  return r.ok ? null : `resend ${r.status}: ${(await r.text()).slice(0, 200)}`
}
async function moneyFromSession(session: Stripe.Checkout.Session, acct: { name: string; slug: string; key: string | undefined }, preview: boolean) {
  const type = String(session.metadata?.type || session.metadata?.kind || '')
  const [brand0] = MONEY_LABELS[type] || (type.startsWith('ve_') ? ['Vegans Explore', ''] : [acct.name, ''])
  const lines = await moneyLines(session.id, acct.key)
  const email = session.customer_details?.email || session.customer_email || ''
  const member = await moneyMember(email)
  const at0 = new Date((session.created || Date.now() / 1000) * 1000)
  const label0 = moneyLabel(type, (session.metadata || {}) as Record<string, string>, member, at0)
  const product = label0 || (lines[0] ? lines[0].replace(/ \([^)]*\)$/, '') : 'A payment')
  const name = session.customer_details?.name || member?.name || ''
  const pi = typeof session.payment_intent === 'string' ? session.payment_intent : (session.payment_intent as any)?.id
  const stripeUrl = `https://dashboard.stripe.com/${session.livemode ? '' : 'test/'}${pi ? 'payments/' + pi : 'checkout/sessions/' + session.id}`
  return { amount: session.amount_total || 0, currency: session.currency || 'usd', brand: brand0, product, lines, name, email, member, stripeUrl, ref: session.id, at: new Date((session.created || Date.now() / 1000) * 1000), account: acct.name, renewal: false, preview }
}
async function moneyAlert(event: Stripe.Event, verifiedWith: string | null) {
  if (!event.livemode) return
  const acct = moneyAccount(verifiedWith)
  let o: any = null, stripeId = '', kind = 'checkout'
  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    const s = event.data.object as Stripe.Checkout.Session
    if (s.payment_status !== 'paid' || !(s.amount_total && s.amount_total > 0)) return
    stripeId = s.id
    o = await moneyFromSession(s, acct, false)
  } else if (event.type === 'invoice.payment_succeeded') {
    const inv = event.data.object as Stripe.Invoice
    if (!(inv.amount_paid > 0) || inv.billing_reason === 'subscription_create') return
    stripeId = inv.id; kind = 'renewal'
    const email = inv.customer_email || ''
    const member = await moneyMember(email)
    const line = (inv.lines?.data || []).map((l: any) => `${l.description || 'Subscription'} (${moneyFmt(l.amount ?? 0, inv.currency)})`)
    // The subscription carries its checkout's metadata (ve-claims sets subscription_data[metadata]), so a renewal is labeled like
    // its first payment: under API 2025+ it is on inv.parent.subscription_details, before that inv.subscription_details.
    const subMeta = ((inv as any).parent?.subscription_details?.metadata || (inv as any).subscription_details?.metadata || {}) as Record<string, string>
    const subType = String(subMeta.type || subMeta.kind || '')
    const atR = new Date(((inv as any).status_transitions?.paid_at || inv.created) * 1000)
    const subLabel = subType ? moneyLabel(subType, subMeta, member, atR) : ''
    const subBrand = MONEY_LABELS[subType]?.[0] || (subType.startsWith('ve_') ? 'Vegans Explore' : acct.name)
    o = { amount: inv.amount_paid, currency: inv.currency, brand: subBrand, product: subLabel || (line[0] ? line[0].replace(/ \([^)]*\)$/, '') : 'Subscription renewal'), lines: line,
      name: inv.customer_name || member?.name || '', email, member, ref: inv.id, at: new Date(((inv as any).status_transitions?.paid_at || inv.created) * 1000), account: acct.name, renewal: true, preview: false,
      stripeUrl: `https://dashboard.stripe.com/invoices/${inv.id}` }
  } else return
  // One row per payment: a retried event finds it and stops here.
  const { data: prior } = await supabase.from('ve_money_alerts').select('id').ilike('buyer_email', o.email || '-').limit(1)
  const { data: row, error } = await supabase.from('ve_money_alerts').insert({ stripe_id: stripeId, kind, account: acct.slug, brand: o.brand, product: o.product,
    amount_cents: o.amount, currency: o.currency, buyer_email: o.email || null, buyer_name: o.name || null, member_id: o.member?.id || null }).select('id').single()
  if (error) { if (!/duplicate|unique/i.test(error.message)) console.error('money alert row:', error.message); return }
  o.first = moneyFirst(o) && !(prior && prior.length)
  o.month = await moneyMonth()
  const err = await moneySend(`${moneyFmt(o.amount, o.currency)} in: ${o.product} from ${o.name || o.email || 'someone'}`, moneyEmail(o))
  await supabase.from('ve_money_alerts').update(err ? { send_error: err } : { sent_at: new Date().toISOString() }).eq('id', row.id)
  if (err) console.error('money alert send:', err)
}

Deno.serve(async (req: Request) => {
  // A preview of the money-in email for a real session (see moneyAlert above).
  const previewId = new URL(req.url).searchParams.get('money_preview')
  if (previewId) {
    const tok = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
    const { data: adm } = await supabase.from('lesaruss_secrets').select('value').eq('key', 'LESARUSS_ADMIN_TOKEN').maybeSingle()
    if (!tok || tok !== adm?.value) return new Response('forbidden', { status: 403 })
    for (const [k, acct] of [[Deno.env.get('STRIPE_SECRET_KEY'), 'Vegans Explore'], [Deno.env.get('STRIPE_SECRET_KEY_LESARUSS'), 'LESARUSS']] as const) {
      if (!k) continue
      const r = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(previewId)}`, { headers: { Authorization: `Bearer ${k}` } })
      if (!r.ok) continue
      const session = await r.json()
      const o: any = await moneyFromSession(session, { name: acct, slug: acct === 'LESARUSS' ? 'lesaruss' : 'vegans-explore', key: k }, true)
      o.first = moneyFirst(o); o.month = await moneyMonth()
      const err = await moneySend(`[Preview] ${moneyFmt(o.amount, o.currency)} in: ${o.product} from ${o.name || o.email || 'someone'}`, moneyEmail(o))
      return new Response(JSON.stringify({ sent: !err, error: err, product: o.product, lines: o.lines, amount: o.amount, name: o.name, email: o.email }), { headers: { 'Content-Type': 'application/json' } })
    }
    return new Response(JSON.stringify({ error: 'session_not_found' }), { status: 404, headers: { 'Content-Type': 'application/json' } })
  }
  const sig = req.headers.get('stripe-signature')
  if (!sig) return new Response('Missing signature', { status: 400 })

  const body = await req.text()

  let event: Stripe.Event | null = null
  let lastErr: any = null
  // Which signing secret verified this event, so a branch can tell which
  // Stripe account it came from (STRIPE_WEBHOOK_SECRET is VE's own account).
  let verifiedWith: string | null = null
  for (const secret of WEBHOOK_SECRETS) {
    try {
      event = await stripe.webhooks.constructEventAsync(body, sig, secret)
      verifiedWith = secret
      break
    } catch (err) {
      lastErr = err
    }
  }
  if (!event) {
    console.error('Webhook signature error (tried all configured secrets):', lastErr?.message)
    return new Response(`Webhook error: ${lastErr?.message ?? 'invalid signature'}`, { status: 400 })
  }

  // Money in: the team hears about every live payment before any product's branch runs (never blocks the branches).
  try { await moneyAlert(event, verifiedWith) } catch (e) { console.error('money alert failed:', e) }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    // GUARD (2026-08-31, Logan): skip sessions created by the unified
    // campaigns/checkout system (metadata.kind === 'campaign_pledge' -- used
    // by every brand's /api/campaigns/checkout + /api/campaigns/webhook
    // pledge flow, including lesaruss-ai's Podcast Starter Guide $11 unlock).
    // Without this guard, any checkout.session.completed event on this
    // shared Stripe account that doesn't match one of the metadata.type
    // branches below falls all the way through to the legacy pre-launch
    // founding-membership branch, which unconditionally sends a VEGANS
    // EXPLORE welcome email and mints a Supabase Auth magic link, regardless
    // of which brand or campaign the payment was actually for. Real case:
    // Sean's $11 lesaruss-ai Founders pledge (2026-08-31) got a VEGANS
    // EXPLORE "founding member" email whose magic link dead-ended on
    // lesaruss.ai's homepage, because no dedicated Stripe webhook endpoint
    // existed yet for /api/campaigns/webhook -- that endpoint is now
    // registered (we_... on this same account), so this guard just makes
    // sure this legacy fallback never doubles-up on those events again, and
    // fails safe (skips, does not guess) if a future brand's campaign_pledge
    // checkout reaches here before its own dedicated endpoint exists.
    if (session.metadata?.kind === 'campaign_pledge') {
      console.log('Skipping legacy branch for unified campaigns/checkout session:', session.id, session.metadata.campaign_slug)
      return new Response(JSON.stringify({ received: true, ignored: 'campaign_pledge_handled_by_campaigns_webhook' }), { headers: { 'Content-Type': 'application/json' } })
    }

    // --- VE Verified / Verified Plus yearly subscription (ve-claims sessions carry this metadata) ---
    // Added 2026-09-27 (Logan), playbook ve-verified-tours-hunt group A. Activation lives in one
    // place, ve-claims' verified_confirm (the buyer's return trip runs the same code), so this
    // branch just triggers it; it is idempotent on the membership's awaiting_payment status.
    if (session.metadata?.type === 've_verified') {
      try {
        const r = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/ve-claims?verified_confirm=${encodeURIComponent(session.id)}`, { redirect: 'manual' })
        console.log('ve_verified activation:', session.id, r.status, r.headers.get('location'))
      } catch (e) {
        console.error('ve_verified activation failed:', session.id, e)
        return new Response('ve_verified activation failed', { status: 500 })
      }
      return new Response(JSON.stringify({ received: true, ve_verified: true }), { headers: { 'Content-Type': 'application/json' } })
    }

    // --- Any other VE product that confirms itself (added 2026-09-27, Logan; first: Tours) ---
    // The session names its own confirm function in metadata.confirm_fn (for example ve-tours), and
    // that function's GET ?confirm=<session id> marks it paid; the buyer's return trip runs the same
    // code. New VE products need no change here as long as they set type 've_*' and confirm_fn.
    if (typeof session.metadata?.type === 'string' && session.metadata.type.startsWith('ve_') && /^ve-[a-z-]+$/.test(session.metadata?.confirm_fn || '')) {
      try {
        const r = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/${session.metadata.confirm_fn}?confirm=${encodeURIComponent(session.id)}`, { redirect: 'manual' })
        console.log('VE self-confirm:', session.metadata.type, session.id, r.status, r.headers.get('location'))
      } catch (e) {
        console.error('VE self-confirm failed:', session.metadata.type, session.id, e)
        return new Response('VE confirm failed', { status: 500 })
      }
      return new Response(JSON.stringify({ received: true, confirmed_by: session.metadata.confirm_fn }), { headers: { 'Content-Type': 'application/json' } })
    }

    // --- Explore Season Partners Guide purchase (ve-partner-guide sessions carry this metadata) ---
    // Added 2026-09-24 (Logan) per the locked playbook explore-season-partners-guide.
    // ve-partner-guide writes a pending public.sponsors row before sending the
    // buyer to Stripe; this flips it to active, grants the one-time membership when
    // the offer includes it (Member, Community Night tables), and emails the
    // buyer plus whoever the row was routed to (city Community Manager and/or
    // Sean). A buyer with no account yet keeps the membership waiting on the
    // sponsors row; the members insert trigger claim_partner_membership_* grants
    // it the moment they sign up with the same email.
    if (session.metadata?.type === 'partner_guide_purchase') {
      const sponsorId = session.metadata.sponsor_id
      const ok = (extra: Record<string, unknown> = {}) => new Response(JSON.stringify({ received: true, ...extra }), { headers: { 'Content-Type': 'application/json' } })
      if (!sponsorId) {
        console.error('partner_guide_purchase session missing sponsor_id metadata:', session.id)
        return ok()
      }
      const { data: sp } = await supabase.from('sponsors').select('*').eq('id', sponsorId).maybeSingle()
      if (!sp) {
        console.error('partner_guide_purchase sponsor row not found:', sponsorId, session.id)
        return ok()
      }
      if (sp.status === 'active' || sp.status === 'completed') return ok({ duplicate: true })

      const paidAt = new Date().toISOString()
      const email = String(sp.contact_email || session.customer_details?.email || '').toLowerCase()
      let claimedBy: string | null = null
      if (sp.includes_membership) {
        let memberId: string | null = session.metadata.member_id || sp.member_id || null
        if (!memberId && email) {
          const { data: candidates } = await supabase.from('members').select('id, email').ilike('email', email).is('merged_into_member_id', null).limit(5)
          memberId = (candidates || []).find((m: any) => String(m.email).toLowerCase() === email)?.id ?? null
        }
        if (memberId) {
          const { error: mErr } = await supabase.from('members')
            .update({ membership_status: 'active', entry_paid_at: paidAt, updated_at: paidAt })
            .eq('id', memberId)
          if (mErr) console.error('partner_guide_purchase membership grant error:', mErr)
          else claimedBy = memberId
        }
      }

      const { error: upErr } = await supabase.from('sponsors').update({
        status: 'active',
        paid_at: paidAt,
        approved_at: paidAt,
        amount_cents: session.amount_total ?? sp.amount_cents,
        stripe_session_id: session.id,
        membership_claimed_by: claimedBy,
        member_id: sp.member_id ?? claimedBy,
        updated_at: paidAt,
      }).eq('id', sponsorId)
      if (upErr) {
        console.error('partner_guide_purchase sponsors update error:', upErr)
        return new Response(`Update error: ${upErr.message}`, { status: 500 })
      }

      try {
        const { data: offer } = await supabase.from('ve_partner_offers').select('name, includes').eq('slug', sp.offer_slug).maybeSingle()
        const offerName = offer?.name ?? 'your Explore Season package'
        const amount = `$${((session.amount_total ?? sp.amount_cents ?? 0) / 100).toFixed(2)}`
        const eventChoice = sp.answers?.event ? ` (${sp.answers.event})` : ''
        const esc = (s: string) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))
        const shell = (title: string, inner: string) => `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:32px 16px;"><tr><td align="center"><table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;"><tr><td style="background:#1a1a1a;padding:24px 32px;"><span style="color:#ffffff;font-size:16px;font-weight:800;letter-spacing:0.06em;">VEGANS EXPLORE</span></td></tr><tr><td style="padding:32px;"><h1 style="margin:0 0 14px;font-size:21px;font-weight:800;color:#111;">${title}</h1>${inner}</td></tr><tr><td style="background:#f9f9f9;padding:14px 32px;border-top:1px solid #eee;"><p style="margin:0;font-size:11px;color:#6b6b6b;">VEGANS EXPLORE | contact@vegansexplore.com | <a href="https://vegansexplore.com/partners" style="color:#6b6b6b;">vegansexplore.com/partners</a></p></td></tr></table></td></tr></table></body></html>`
        const para = (t: string) => `<p style="margin:0 0 12px;font-size:15px;line-height:1.65;color:#333;">${t}</p>`
        const list = (items: string[]) => '<ul style="margin:0 0 16px;padding-left:20px;">' + items.map((i) => `<li style="font-size:14px;line-height:1.6;color:#333;margin-bottom:4px;">${esc(i)}</li>`).join('') + '</ul>'
        const first = esc(String(sp.contact_name || '').split(' ')[0] || 'there')
        const membershipLine = sp.includes_membership
          ? (claimedBy
            ? para('Your Vegans Explore Founding Membership is active on your account. It is one time and never renews.')
            : para(`Your membership is included. Create your account at <a href="https://vegansexplore.com/join">vegansexplore.com/join</a> with this same email (${esc(email)}) and it will already be active.`))
          : ''
        const send = (to: string[], subject: string, html: string, replyTo?: string) => fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: 'VEGANS EXPLORE <hello@vegansexplore.com>', to, subject, html, ...(replyTo ? { reply_to: replyTo } : {}) }),
        })
        if (email) {
          await send([email], `You're in: ${offerName}`, shell(`You're in, ${first}.`,
            para(`Payment of ${amount} received for <strong>${esc(offerName)}${esc(eventChoice)}</strong>. Here is what is included:`) +
            list(offer?.includes ?? []) + membershipLine +
            para('The Vegans Explore team will reach out with next steps. Questions? Just reply to this email.')),
            (Array.isArray(sp.routed_to) && sp.routed_to[0]) || 'contact@lesaruss.com')
        }
        const routed: string[] = Array.isArray(sp.routed_to) && sp.routed_to.length ? sp.routed_to : ['contact@lesaruss.com']
        await send(routed, `[Explore Season] Paid ${amount}: ${offerName} - ${sp.company_name || sp.contact_name}`, shell('New Partners Guide purchase',
          para(`<strong>${esc(sp.company_name || sp.contact_name)}</strong> paid ${amount} for <strong>${esc(offerName)}${esc(eventChoice)}</strong>.`) +
          para(`Contact: ${esc(sp.contact_name)}, ${esc(email)}${sp.contact_phone ? ', ' + esc(sp.contact_phone) : ''}. City: ${esc(sp.city_slug)}. Membership ${sp.includes_membership ? (claimedBy ? 'granted to their account' : 'waiting for them to sign up') : 'not included'}.`) +
          para(`Sponsor record ${esc(sp.id)}.`)), email || undefined)
      } catch (e) {
        console.error('partner_guide_purchase emails failed:', e)
      }

      console.log('Partners Guide purchase activated:', sponsorId, sp.offer_slug, claimedBy)
      return ok({ partner_guide: 'active', membership_claimed_by: claimedBy })
    }

    // --- VE Passport $11/month subscription branch (ve-passport-checkout sessions carry this metadata) ---
    // Added 2026-08-17 (Logan) per the locked exploration-universal-points-ladder
    // ($11/month Passport tier) and V's request to surface it on Vegans Explore.
    // Marks the member as an active Passport subscriber. Since 2026-10-25 (Sean) it adds no
    // points; renewals are handled by the invoice.payment_succeeded branch below. No monthly
    // Passport is offered any more; this stays for a legacy subscription.
    if (session.metadata?.type === 'passport_subscription') {
      const memberId = session.metadata.member_id
      const customerId = session.customer as string
      const subscriptionId = session.subscription as string

      if (!memberId) {
        console.error('passport_subscription session missing member_id metadata:', session.id)
        return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } })
      }

      // 2026-09-17 (Sean + V design session): annual option added alongside
      // monthly. ve-passport-checkout stamps metadata.period on the session;
      // fall back to 'monthly' for older/replayed sessions that predate this
      // metadata key.
      const subscriptionPeriod = session.metadata?.period === 'annual' ? 'annual' : 'monthly';

      const { error: memberUpdateError } = await supabase
        .from('members')
        .update({
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          membership_tier: 'passport',
          subscription_period: subscriptionPeriod,
          subscription_ends_at: null,
          // Pay-or-pledge gate (2026-09-17, Sean): this is one of the two paths
          // that clears membership_status out of 'pending_payment'. Setting
          // entry_paid_at unconditionally here is correct even on a lapsed-then-
          // resubscribed member -- it just records "most recent activation",
          // which is all requireActiveMembership in ve-auth actually reads
          // membership_status for anyway.
          membership_status: 'active',
          entry_paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', memberId)

      if (memberUpdateError) {
        console.error('members passport_subscription update error:', memberUpdateError)
        return new Response(`Update error: ${memberUpdateError.message}`, { status: 500 })
      }

      // Sean, 2026-10-25: no points with the Passport. Its Guide credit comes from ve_passport_credit.
      console.log('Passport subscription activated:', memberId, subscriptionId)

      try {
        const { data: member } = await supabase.from('members').select('email').eq('id', memberId).maybeSingle()
        if (member?.email) {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              from: 'VEGANS EXPLORE <hello@vegansexplore.com>',
              to: member.email,
              subject: 'Your Passport is active',
              html: buildPassportReceiptEmail({ renewal: false })
            })
          })
        }
      } catch (e) {
        console.error('Passport signup receipt email failed:', e)
      }

      return new Response(JSON.stringify({ received: true, passport: 'active' }), { headers: { 'Content-Type': 'application/json' } })
    }

    // --- SAR book tripwire purchase branch (book-tripwire-checkout sessions carry this metadata) ---
    // Added 2026-08-16 (Logan) per Sean's $11 one-time book+audiobook+video-series
    // model. Generic across property_slug so every future SAR book reuses this same
    // branch -- no per-book webhook logic needed.
    if (session.metadata?.type === 'book_tripwire_purchase') {
      const propertySlug = session.metadata.property_slug
      const email = session.customer_details?.email || null

      const { data: purchase, error } = await supabase
        .from('book_tripwire_purchases')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          email: email,
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_session_id', session.id)
        .select('property_slug, amount_cents')
        .maybeSingle()

      if (error) {
        console.error('book_tripwire_purchases update error:', error)
        return new Response(`Update error: ${error.message}`, { status: 500 })
      }

      console.log('Book tripwire purchase marked paid:', propertySlug, session.id, email)

      try {
        if (email && purchase) {
          const BOOK_CONFIG: Record<string, { productName: string; accessUrl: string }> = {
            'blur-to-blueprint': {
              productName: 'From Blur to Blueprint — Full Access',
              accessUrl: 'https://seanarussell.com/blur-to-blueprint-access.html',
            },
          }
          const config = BOOK_CONFIG[purchase.property_slug]
          if (config) {
            const priceLabel = `$${((purchase.amount_cents ?? 0) / 100).toFixed(2)}`
            const emailRes = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                from: 'Sean A. Russell <hello@lesaruss.ai>',
                to: email,
                subject: `You're in — ${config.productName}`,
                html: buildBookTripwireReceiptEmail({
                  productName: config.productName,
                  priceLabel,
                  accessUrl: config.accessUrl,
                })
              })
            })
            if (!emailRes.ok) console.error('Book tripwire receipt email failed to send:', await emailRes.text())
          } else {
            console.error('No BOOK_CONFIG entry for property_slug:', purchase.property_slug)
          }
        }
      } catch (e) {
        console.error('Book tripwire purchase confirmation email failed:', e)
      }

      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'LESARUSS <contact@lesaruss.com>',
            to: ['contact@lesaruss.com'],
            subject: `Book tripwire purchase: ${propertySlug}`,
            html: `<p style="font-family:sans-serif;">Book: ${propertySlug}<br>Email: ${email}<br>Amount: $${((purchase?.amount_cents ?? 0) / 100).toFixed(2)}<br>Stripe session: ${session.id}</p>`
          })
        })
      } catch (e) {
        console.error('Book tripwire internal notification email failed:', e)
      }

      return new Response(JSON.stringify({ received: true, purchase: 'paid' }), { headers: { 'Content-Type': 'application/json' } })
    }

    // --- ADA Unlocked $111 course + Level 1 Audit purchase branch (ada-guide-checkout sessions carry this metadata) ---
    // Added 2026-08-16 (Logan) reusing the exact same tripwire model Sean set the same day
    // for SAR books: Stripe checkout -> paid row -> real email+one-time-code access page.
    // Repositioned same day from $11 guide to $111 course + Level 1 Audit per Sean.
    // Content here is a gated web course + live audit tool (ada-guide-access-verify),
    // not a downloadable file.
    if (session.metadata?.type === 'ada_unlocked_guide_purchase') {
      const email = session.customer_details?.email || null

      const { data: purchase, error } = await supabase
        .from('ada_unlocked_guide_purchases')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          email: email,
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_session_id', session.id)
        .select('amount_cents')
        .maybeSingle()

      if (error) {
        console.error('ada_unlocked_guide_purchases update error:', error)
        return new Response(`Update error: ${error.message}`, { status: 500 })
      }

      console.log('ADA Unlocked course + audit purchase marked paid:', session.id, email)

      try {
        if (email && purchase) {
          const priceLabel = `$${((purchase.amount_cents ?? 0) / 100).toFixed(2)}`
          const emailRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              from: 'ADA Unlocked <hello@lesaruss.ai>',
              to: email,
              subject: "You're in — ADA 101 Course + Level 1 Audit",
              html: buildAdaGuideReceiptEmail({
                productName: 'ADA 101 Course + Level 1 Audit',
                priceLabel,
                accessUrl: 'https://ada-unlocked.vercel.app/guide/access',
              })
            })
          })
          if (!emailRes.ok) console.error('ADA guide receipt email failed to send:', await emailRes.text())
        }
      } catch (e) {
        console.error('ADA guide purchase confirmation email failed:', e)
      }

      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'LESARUSS <contact@lesaruss.com>',
            to: ['contact@lesaruss.com'],
            subject: `ADA Unlocked course + audit purchase`,
            html: `<p style="font-family:sans-serif;">Email: ${email}<br>Amount: $${((purchase?.amount_cents ?? 0) / 100).toFixed(2)}<br>Stripe session: ${session.id}</p>`
          })
        })
      } catch (e) {
        console.error('ADA guide internal notification email failed:', e)
      }

      return new Response(JSON.stringify({ received: true, purchase: 'paid' }), { headers: { 'Content-Type': 'application/json' } })
    }

    // --- ADA Unlocked Level 2 Audit deposit branch (ada-service-checkout sessions carry this metadata) ---
    // Added 2026-08-16 (Logan) as part of wiring Level 2 checkout onto the
    // service-intake-to-remediation-to-close-out workflow shipped earlier today.
    // On payment: flip the matching ada_unlocked_service_intakes row's
    // deposit_status to 'paid' and move engagement status from 'new' to 'scoped'
    // (a paid Level 2 Audit is a committed engagement, not just a lead anymore) --
    // but only advance status if it's still 'new', so it never clobbers manual
    // admin-panel progress (e.g. someone already moved it to 'active').
    if (session.metadata?.type === 'ada_unlocked_level2_deposit') {
      const intakeId = session.metadata.intake_id
      if (!intakeId) {
        console.error('ada_unlocked_level2_deposit session missing intake_id metadata:', session.id)
        return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } })
      }

      const { data: existing } = await supabase
        .from('ada_unlocked_service_intakes')
        .select('org_name, contact_email, status, deposit_amount_cents')
        .eq('id', intakeId)
        .maybeSingle()

      const patch: Record<string, unknown> = {
        deposit_status: 'paid',
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      if (existing?.status === 'new') patch.status = 'scoped'

      const { data: intake, error } = await supabase
        .from('ada_unlocked_service_intakes')
        .update(patch)
        .eq('id', intakeId)
        .select('org_name, contact_email, deposit_amount_cents')
        .maybeSingle()

      if (error) {
        console.error('ada_unlocked_service_intakes deposit update error:', error)
        return new Response(`Update error: ${error.message}`, { status: 500 })
      }

      console.log('ADA Unlocked Level 2 Audit deposit marked paid:', intakeId, session.id)

      try {
        const email = intake?.contact_email || session.customer_details?.email
        if (email && intake) {
          const priceLabel = `$${((intake.deposit_amount_cents ?? 0) / 100).toFixed(2)}`
          const emailRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              from: 'ADA Unlocked <hello@lesaruss.ai>',
              to: email,
              subject: "Your Level 2 Audit is confirmed",
              html: buildAdaLevel2ReceiptEmail({
                orgName: intake.org_name || 'there',
                priceLabel,
              })
            })
          })
          if (!emailRes.ok) console.error('ADA Level 2 receipt email failed to send:', await emailRes.text())
        }
      } catch (e) {
        console.error('ADA Level 2 deposit confirmation email failed:', e)
      }

      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'LESARUSS <contact@lesaruss.com>',
            to: ['contact@lesaruss.com'],
            subject: `ADA Unlocked Level 2 Audit paid: ${intake?.org_name || intakeId}`,
            html: `<p style="font-family:sans-serif;">Org: ${intake?.org_name || '(unknown)'}<br>Email: ${intake?.contact_email || session.customer_details?.email || '(unknown)'}<br>Amount: $${((intake?.deposit_amount_cents ?? 0) / 100).toFixed(2)}<br>Stripe session: ${session.id}</p>`
          })
        })
      } catch (e) {
        console.error('ADA Level 2 internal notification email failed:', e)
      }

      return new Response(JSON.stringify({ received: true, deposit: 'paid' }), { headers: { 'Content-Type': 'application/json' } })
    }

    // --- VE Points purchase branch (ve-points-checkout sessions carry this metadata) ---
    if (session.metadata?.type === 'points_purchase') {
      const memberId = session.metadata.member_id
      const points = parseInt(session.metadata.points || '0', 10)
      const pkg = session.metadata.package || null

      if (!memberId || !points) {
        console.error('points_purchase session missing member_id/points metadata:', session.id)
        return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } })
      }

      const { data: result, error } = await supabase.rpc('credit_points_purchase', {
        p_member_id: memberId,
        p_amount: points,
        p_stripe_session_id: session.id,
        p_package: pkg,
      })

      if (error) {
        console.error('credit_points_purchase error:', error)
        return new Response(`Credit error: ${error.message}`, { status: 500 })
      }

      console.log('Points credited:', memberId, points, result)

      try {
        const { data: member } = await supabase.from('members').select('email, name').eq('id', memberId).maybeSingle()
        if (member?.email && result?.balance != null) {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              from: 'VEGANS EXPLORE <hello@vegansexplore.com>',
              to: member.email,
              subject: `+${points.toLocaleString()} Points added to your account`,
              html: buildPointsReceiptEmail(points, result.balance)
            })
          })
        }
      } catch (e) {
        console.error('Points receipt email failed:', e)
      }

      return new Response(JSON.stringify({ received: true, credited: result }), { headers: { 'Content-Type': 'application/json' } })
    }

    // --- VE entry contribution branch (ve-entry-checkout sessions carry this metadata) ---
    // Added 2026-09-17 (Logan) for the pay-or-pledge gate: the one-time,
    // any-amount path to an 'active' membership_status (the $11 Passport).
    // It credited points at $1 = 100 until Sean, 2026-10-25; now the join gives 1,100 welcome points and every
    // payment the 25-point thank-you.
    if (session.metadata?.type === 'entry_contribution') {
      const memberId = session.metadata.member_id
      const points = parseInt(session.metadata.amount_cents || '0', 10)

      if (!memberId || !points) {
        console.error('entry_contribution session missing member_id/amount_cents metadata:', session.id)
        return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } })
      }

      // An active member contributing again (the dashboard's Contribute, Sean 2026-10-04) gets a
      // thank-you, not "your Passport is active". Read before the update flips the status.
      // Another brand's account (one members row per email) reads 'active' before it has paid us, so it counts as a
      // repeat only when Vegans Explore already holds it (ve_member_entitled, migration 20261029_brand_memberships.sql).
      const { data: before } = await supabase.from('members').select('membership_status, entry_paid_at').eq('id', memberId).maybeSingle()
      const { data: entitledBefore } = await supabase.rpc('ve_member_entitled', { p_member: memberId })
      const repeat = before?.membership_status === 'active' && entitledBefore === true

      const { error: memberUpdateError } = await supabase
        .from('members')
        .update({
          membership_status: 'active',
          entry_paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', memberId)

      if (memberUpdateError) {
        console.error('members entry_contribution update error:', memberUpdateError)
        return new Response(`Update error: ${memberUpdateError.message}`, { status: 500 })
      }
      // The Vegans Explore Passport on record, for an account another brand made too.
      const { error: bmErr } = await supabase.rpc('ve_brand_membership_grant', { p_member: memberId, p_kind: 'passport', p_source: 'stripe', p_ref: session.id })
      if (bmErr) console.error('brand membership grant error:', bmErr)

      // Sean locked 2026-10-25 (playbook ve-pricing-points-passport): joining, $11 one time, is the Passport and comes with
      // 1,100 welcome points, once per member (ref 'welcome'). Every payment also earns the flat 25-point thank-you. Points
      // are never bought: neither amount follows the dollars paid.
      // A member who came in through a survey door (or on an invitation) is already active but has never paid: their first $11
      // still brings the 1,100 welcome points (Sean, 2026-11-05, the Pre-Vegan Guide's optional contribution). ref 'welcome'
      // keeps it once per member.
      const firstPayment = !before?.entry_paid_at
      if (!repeat || firstPayment) {
        const { error: wErr } = await supabase.rpc('ve_points_grant', { p_member: memberId, p_amount: 1100, p_reason: 'welcome', p_ref: 'welcome' })
        if (wErr) console.error('welcome points error:', wErr)
      }
      const { error: tErr } = await supabase.rpc('ve_purchase_thanks', { p_member: memberId, p_ref: `stripe:${session.id}` })
      if (tErr) console.error('purchase thanks error:', tErr)
      // The Passport pays the link that brought them, from Level 2 (Sean, 2026-10-28; ve_affiliate_earn, once per member).
      if (!repeat) {
        const { data: aff, error: aErr } = await supabase.rpc('ve_affiliate_earn', { p_buyer: memberId, p_product: 'passport', p_product_ref: 'passport', p_ref: `passport:${memberId}` })
        if (aErr) console.error('affiliate commission error:', aErr)
        else if (aff?.earned) console.log('Affiliate commission:', aff)
      }
      console.log('Entry contribution activated membership:', memberId, points, repeat ? 'contribution' : 'join')

      try {
        const { data: member } = await supabase.from('members').select('email').eq('id', memberId).maybeSingle()
        if (member?.email) {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              from: 'VEGANS EXPLORE <hello@vegansexplore.com>',
              to: member.email,
              subject: repeat ? 'Thank you for your contribution to Vegans Explore' : 'Your Passport is active - 1,100 welcome points are in',
              html: repeat ? buildContributionThanksEmail(points) : buildPassportReceiptEmail({ renewal: false })
            })
          })
        }
      } catch (e) {
        console.error('Entry contribution receipt email failed:', e)
      }

      return new Response(JSON.stringify({ received: true, membership: 'active' }), { headers: { 'Content-Type': 'application/json' } })
    }

    // --- Coach OS digital purchase branch (coach-os-cookbook-checkout sessions carry this metadata) ---
    if (session.metadata?.type === 'coach_os_digital_purchase') {
      const email = session.customer_details?.email || null

      const { data: purchase, error } = await supabase
        .from('coach_os_digital_purchases')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          email: email,
        })
        .eq('stripe_session_id', session.id)
        .select('brand_slug, product_slug, amount_cents')
        .maybeSingle()

      if (error) {
        console.error('coach_os_digital_purchases update error:', error)
        return new Response(`Update error: ${error.message}`, { status: 500 })
      }

      console.log('Coach OS digital purchase marked paid:', session.metadata.brand_slug, session.metadata.product_slug, session.id, email)

      try {
        if (email && purchase) {
          // Currently only the meatless-muscle cookbook exists; this map is the seam
          // for adding the next Coach OS digital product without touching webhook logic.
          const PRODUCT_CONFIG: Record<string, { pdfSecretKey: string; productName: string; brandName: string; supportEmail: string; siteUrl: string }> = {
            'high-protein-cookbook': {
              pdfSecretKey: 'MEATLESS_MUSCLE_COOKBOOK_PDF_URL',
              productName: 'High-Protein Recipes for Every Meal',
              brandName: 'Miss Meatless Muscle',
              supportEmail: 'contact@meatlessmuscle.com',
              siteUrl: 'https://meatless-muscle.vercel.app',
            },
          }
          const config = PRODUCT_CONFIG[purchase.product_slug]

          if (config) {
            const { data: secretRow } = await supabase
              .from('lesaruss_secrets')
              .select('value')
              .eq('key', config.pdfSecretKey)
              .maybeSingle()

            if (secretRow?.value) {
              const priceLabel = `$${((purchase.amount_cents ?? 0) / 100).toFixed(2)}`
              const emailRes = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  from: `${config.brandName} <hello@lesaruss.ai>`,
                  to: email,
                  subject: `Your ${config.productName} download is ready`,
                  html: buildCookbookReceiptEmail({
                    brandName: 'Miss Meatless',
                    brandAccentHtml: '<span style="color:#7fd99a;">Muscle</span>',
                    productName: config.productName,
                    priceLabel,
                    downloadUrl: secretRow.value,
                    supportEmail: config.supportEmail,
                    siteUrl: config.siteUrl,
                  })
                })
              })
              if (!emailRes.ok) console.error('Cookbook receipt email failed to send:', await emailRes.text())
            } else {
              console.error('No PDF URL secret found for product_slug:', purchase.product_slug)
            }
          } else {
            console.error('No PRODUCT_CONFIG entry for product_slug:', purchase.product_slug)
          }
        }
      } catch (e) {
        console.error('Cookbook purchase confirmation email failed:', e)
      }

      return new Response(JSON.stringify({ received: true, purchase: 'paid' }), { headers: { 'Content-Type': 'application/json' } })
    }

    // --- Coach OS subscription branch (coach-os-billing-session sessions carry this metadata) ---
    if (session.metadata?.type === 'coach_os_subscription') {
      const brandSlug = session.metadata.brand_slug
      const customerId = session.customer as string
      const subscriptionId = session.subscription as string

      const { error } = await supabase
        .from('coach_os_billing')
        .upsert({
          brand_slug: brandSlug,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          status: 'active',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'brand_slug' })

      if (error) {
        console.error('coach_os_billing upsert error:', error)
        return new Response(`Update error: ${error.message}`, { status: 500 })
      }

      console.log('Coach OS subscription activated:', brandSlug, customerId, subscriptionId)

      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'LESARUSS <contact@lesaruss.com>',
            to: ['contact@lesaruss.com'],
            subject: `Coach OS subscription started: ${brandSlug}`,
            html: `<p style="font-family:sans-serif;">Brand: ${brandSlug}<br>Stripe customer: ${customerId}<br>Stripe subscription: ${subscriptionId}<br>Session: ${session.id}</p>`
          })
        })
      } catch (e) {
        console.error('Coach OS subscription notification email failed:', e)
      }

      return new Response(JSON.stringify({ received: true, subscription: 'active' }), { headers: { 'Content-Type': 'application/json' } })
    }

    // --- Problem Solver deposit branch (client-intake-checkout sessions carry this metadata) ---
    if (session.metadata?.type === 'problem_solver_deposit') {
      const projectSlug = session.metadata.project_slug
      const clientSlug = session.metadata.client_slug

      if (!projectSlug || !clientSlug) {
        console.error('problem_solver_deposit session missing project_slug/client_slug metadata:', session.id)
        return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } })
      }

      const amount = (session.amount_total ?? 0) / 100

      const { data: intake, error } = await supabase
        .from('client_intakes')
        .update({
          deposit_status: 'paid',
          deposit_paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('project_slug', projectSlug)
        .eq('client_slug', clientSlug)
        .select()
        .maybeSingle()

      if (error) {
        console.error('client_intakes deposit update error:', error)
        return new Response(`Update error: ${error.message}`, { status: 500 })
      }

      console.log('Problem Solver deposit marked paid:', projectSlug, clientSlug, session.id)

      let ownerFirstName = 'the LESARUSS team'
      try {
        const { data: project } = await supabase
          .from('studio_projects')
          .select('owner_label, owner_role')
          .eq('slug', projectSlug)
          .maybeSingle()
        if (project?.owner_label && project.owner_role !== 'client') {
          ownerFirstName = String(project.owner_label).split(' ')[0]
        }
      } catch (e) {
        console.error('owner_label lookup failed, using fallback signature:', e)
      }

      try {
        const clientEmail = intake?.client_email || session.customer_details?.email
        const clientName = intake?.client_name || session.customer_details?.name || 'there'
        if (clientEmail) {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              from: 'LESARUSS <contact@lesaruss.com>',
              to: clientEmail,
              subject: 'Deposit received - your project is moving into build',
              html: `<p style="font-family:sans-serif;">Hi ${String(clientName).split(' ')[0]},</p><p style="font-family:sans-serif;">Your deposit of $${amount.toFixed(2)} has been received. Your project is moving into build now, and I'll be reaching out directly with next steps.</p><p style="font-family:sans-serif;">- ${ownerFirstName}, LESARUSS</p>`
            })
          })
        }
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'LESARUSS <contact@lesaruss.com>',
            to: ['contact@lesaruss.com'],
            subject: `Deposit paid: ${projectSlug}`,
            html: `<p style="font-family:sans-serif;"><strong>Deposit paid</strong><br>Project: ${projectSlug}<br>Client: ${clientName} (${clientEmail || 'no email on file'})<br>Amount: $${amount.toFixed(2)}<br>Stripe session: ${session.id}</p>`
          })
        })
      } catch (e) {
        console.error('Problem Solver deposit confirmation email failed:', e)
      }

      return new Response(JSON.stringify({ received: true, deposit: 'paid' }), { headers: { 'Content-Type': 'application/json' } })
    }

    // --- TalentVangelist Audit purchase branch (talentvangelist-audit-checkout sessions carry this metadata) ---
    if (session.metadata?.type === 'talentvangelist_audit') {
      const email = session.customer_details?.email || session.metadata.email || null
      const name = session.metadata.name || session.customer_details?.name || ''

      const { error } = await supabase
        .from('talentvangelist_purchases')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          email: email,
        })
        .eq('stripe_session_id', session.id)

      if (error) {
        console.error('talentvangelist_purchases update error:', error)
        return new Response(`Update error: ${error.message}`, { status: 500 })
      }

      console.log('TalentVangelist Audit marked paid:', session.id, email)

      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'LESARUSS <contact@lesaruss.com>',
            to: ['contact@lesaruss.com'],
            subject: `TalentVangelist Audit paid: ${name || email}`,
            html: `<p style="font-family:sans-serif;">Name: ${name || '(not provided)'}<br>Email: ${email}<br>Stripe session: ${session.id}</p>`
          })
        })
      } catch (e) {
        console.error('TalentVangelist Audit notification email failed:', e)
      }

      return new Response(JSON.stringify({ received: true, purchase: 'paid' }), { headers: { 'Content-Type': 'application/json' } })
    }

    // --- Legacy pre-launch founding-membership branch ---
    // GUARD (2026-10-08, Logan): this branch runs ONLY for events from VE's own
    // Stripe account. Every other account (the shared LESARUSS account above
    // all) carries many brands' checkouts that have their own webhooks, and an
    // unmatched one must never fall through to a VEGANS EXPLORE welcome. Real
    // case: Sean's 2026-10-08 Humble Cabbage tee order (humblecabbage.com
    // checkout, LESARUSS account) got the VE founding-member email and a
    // vegans-explore list subscription. The 2026-08-31 campaign_pledge guard
    // above fixed one instance; this closes the whole class.
    const isVeAccountEvent = !!verifiedWith && verifiedWith === Deno.env.get('STRIPE_WEBHOOK_SECRET')
    if (!isVeAccountEvent) {
      console.log('Skipping legacy founding-membership branch for non-VE-account session:', session.id, JSON.stringify(session.metadata ?? {}))
      return new Response(JSON.stringify({ received: true, ignored: 'not_a_ve_account_session' }), { headers: { 'Content-Type': 'application/json' } })
    }

    const email = session.customer_details?.email
    const name = session.customer_details?.name || ''

    if (!email) {
      return new Response('No email', { status: 200 })
    }

    // GUARD (2026-08-19, Logan, per V's approval): this legacy branch used to run
    // its full side-effect chain -- members upsert, magic link, real "welcome to
    // VEGANS EXPLORE" email, real Beehiiv subscriptions -- for ANY checkout.session.completed
    // event that fell through to here, including Stripe test-mode events (no real
    // payment). That's the likely origin of the unattributed college-domain
    // "signups" flagged this session (ans156@georgetown.edu, amymayton@boisestate.edu):
    // no Stripe Customer record exists for either email in the live or test
    // account, but a real welcome email/newsletter subscription could still have
    // gone out if a test event carried that address. Skip all side effects when
    // the event is not livemode, so test noise stops touching real inboxes.
    if (event.livemode === false) {
      console.log('Skipping legacy founding-membership side effects for test-mode event:', email)
      return new Response(JSON.stringify({ received: true, test_mode_skipped: true }), { headers: { 'Content-Type': 'application/json' } })
    }

    console.log('Processing checkout for:', email)

    // BUGFIX (2026-08-19, Logan, per V request to trace unattributed college-domain
    // signups): this upsert referenced a column named 'status' that has never
    // existed on public.members (the real column is membership_status). Every
    // single checkout that hit this branch has been silently failing to write a
    // members row since this branch existed -- the error was caught and logged,
    // but execution continued straight into the magic-link/welcome-email/Beehiiv
    // steps below regardless, so paying customers (e.g. ans156@georgetown.edu,
    // amymayton@boisestate.edu, both 2026-08-17) got charged, welcomed as
    // VEGANS EXPLORE, and Beehiiv-subscribed, but never got an actual member
    // record -- no tracked membership_tier, and no tenant_id for brand
    // attribution. Also explicitly set tenant_id to the Vegans Explore tenant:
    // members.tenant_id defaults to the LESARUSS tenant, which would have
    // mislabeled every one of these VE founding members once notify_new_member()
    // started reading tenant_id (fixed same session, see MEMBERS-TABLE-TENANT-
    // HARDCODED-VE) instead of assuming everything in members was VE.
    const { error: upsertError } = await supabase
      .from('members')
      .upsert({
        email,
        name,
        membership_status: 'active',
        stripe_customer_id: session.customer as string,
        membership_tier: 'founder',
        tenant_id: '00000000-0000-4000-a000-000000000002',
        updated_at: new Date().toISOString()
      }, { onConflict: 'email' })

    if (upsertError) console.error('Member upsert error:', upsertError)

    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo: 'https://vegansexplore.com/members' }
    })

    if (linkError) console.error('Magic link error:', linkError)
    const magicLink = linkData?.properties?.action_link

    if (magicLink) {
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'VEGANS EXPLORE <contact@vegansexplore.com>',
          to: email,
          subject: "You're in early - welcome to VEGANS EXPLORE",
          html: buildWelcomeEmail(name, magicLink)
        })
      })
      if (!emailRes.ok) {
        console.error('Resend welcome email error:', await emailRes.text())
      } else {
        console.log('Welcome email sent to:', email)
      }
    }

    await subscribeToList(email, name, 'lesaruss-pulse')
    await subscribeToList(email, name, 'vegans-explore')

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'VEGANS EXPLORE <contact@vegansexplore.com>',
        to: ['contact@lesaruss.com'],
        subject: `New VEGANS EXPLORE founding member: ${name || email}`,
        html: `<p style="font-family:sans-serif;"><strong>New founding member</strong><br>Name: ${name || '(not provided)'}<br>Email: ${email}<br>Stripe session: ${session.id}</p>`
      })
    })
  }

  // --- VE Verified renewals and cancellations (added 2026-09-27, Logan) ---
  // Keyed on ve_verified_memberships.stripe_subscription_id, so these never touch Passport rows.
  // The membership's listing summary (badge, renewal date) is kept by a trigger on that table.
  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object as Stripe.Invoice
    // Newer Stripe API versions move the subscription id under parent.subscription_details.
    const subId = ((invoice as any).subscription ?? (invoice as any).parent?.subscription_details?.subscription ?? null) as string | null
    if (subId && invoice.billing_reason === 'subscription_cycle') {
      const line: any = (invoice as any).lines?.data?.[0]
      const now = new Date().toISOString()
      const patch: Record<string, unknown> = { status: 'active', last_paid_at: now, updated_at: now }
      if (line?.period?.start) patch.current_period_start = new Date(line.period.start * 1000).toISOString()
      if (line?.period?.end) patch.renews_at = new Date(line.period.end * 1000).toISOString()
      const { data, error } = await supabase.from('ve_verified_memberships').update(patch).eq('stripe_subscription_id', subId).in('status', ['active', 'past_due', 'lapsed']).select('id')
      if (error) console.error('ve_verified renewal update error:', error)
      else if (data?.length) console.log('ve_verified renewed:', subId, patch.renews_at)
    }
  }
  if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as any
    const item = sub.items?.data?.[0] || {}
    const end = sub.current_period_end ?? item.current_period_end
    const status = event.type === 'customer.subscription.deleted' || sub.status === 'canceled' ? 'canceled'
      : (sub.status === 'past_due' || sub.status === 'unpaid') ? 'past_due' : (sub.status === 'active' || sub.status === 'trialing') ? 'active' : null
    const patch: Record<string, unknown> = { cancel_at_period_end: !!sub.cancel_at_period_end, updated_at: new Date().toISOString() }
    if (status) patch.status = status
    if (end) patch.renews_at = new Date(end * 1000).toISOString()
    if (status === 'canceled') patch.canceled_at = new Date((sub.canceled_at || Date.now() / 1000) * 1000).toISOString()
    const { data, error } = await supabase.from('ve_verified_memberships').update(patch).eq('stripe_subscription_id', sub.id).neq('status', 'awaiting_payment').select('id')
    if (error) console.error('ve_verified subscription update error:', error)
    else if (data?.length) console.log('ve_verified subscription', event.type, sub.id, status)
  }

  // --- VE Passport monthly renewal branch (invoice.payment_succeeded) ---
  // Added 2026-08-17 (Logan). Only the recurring renewal invoices matter here --
  // the very first invoice on a new subscription is already covered by the
  // checkout.session.completed branch above, so billing_reason is checked to
  // avoid double-handling month 1. Since 2026-10-25 a renewal adds no points:
  // it only sends the receipt.
  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object as Stripe.Invoice
    if (invoice.billing_reason === 'subscription_cycle' && invoice.subscription) {
      const subscriptionId = invoice.subscription as string

      const { data: member, error: lookupError } = await supabase
        .from('members')
        .select('id, email, subscription_period')
        .eq('stripe_subscription_id', subscriptionId)
        .eq('membership_tier', 'passport')
        .maybeSingle()

      if (lookupError) {
        console.error('members lookup by stripe_subscription_id error:', lookupError)
        return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } })
      }

      if (member) {
        // Sean, 2026-10-25: no points with the Passport; the month's Guide credit comes from
        // ve_passport_credit (cron ve-passport-credits). The renewal only sends the receipt.
        console.log('Passport renewal:', member.id, subscriptionId)
        try {
          if (member.email) {
            await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                from: 'VEGANS EXPLORE <hello@vegansexplore.com>',
                to: member.email,
                subject: 'Your Passport renewed',
                html: buildPassportReceiptEmail({ renewal: true })
              })
            })
          }
        } catch (e) {
          console.error('Passport renewal receipt email failed:', e)
        }
      } else {
        console.log('invoice.payment_succeeded subscription_cycle with no matching active Passport member (likely a different subscription type):', subscriptionId)
      }
    }
  }

  // --- VE Passport cancellation branch (customer.subscription.deleted) ---
  // Added 2026-08-17 (Logan). Reverts membership_tier back to free so a lapsed
  // or cancelled Passport subscriber doesn't stay flagged as an active
  // subscriber forever. Points already earned are untouched -- Points never
  // expire per the Passport page copy.
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    const { error } = await supabase
      .from('members')
      .update({
        membership_tier: 'member',
        subscription_period: null,
        subscription_ends_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscription.id)
      .eq('membership_tier', 'passport')

    if (error) {
      console.error('members passport cancellation update error:', error)
    } else {
      console.log('Passport subscription cancelled, membership_tier reverted:', subscription.id)
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
