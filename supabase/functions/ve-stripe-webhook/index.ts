import Stripe from 'npm:stripe@14'
import { createClient } from 'jsr:@supabase/supabase-js@2'

// This single endpoint now receives checkout.session.completed events from three
// separate Stripe accounts: VE's existing account (points purchases, legacy
// founding-membership), the LESARUSS account (Problem Solver deposits,
// e.g. Hugh Stewart; Coach OS subscriptions, e.g. Meatless Muscle dashboard billing;
// TalentVangelist Audit purchases; SAR book tripwire purchases, added 2026-08-16;
// VE Passport $11/month subscriptions, added 2026-08-17),
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

async function subscribeToBeehiiv(email: string, publicationId: string) {
  const res = await fetch(
    `https://api.beehiiv.com/v2/publications/${publicationId}/subscriptions`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('BEEHIIV_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        reactivate_existing: true,
        send_welcome_email: false,
        utm_source: 'vegans-explore',
        utm_medium: 'checkout'
      })
    }
  )
  if (!res.ok) {
    console.error(`Beehiiv error (${publicationId}):`, await res.text())
  } else {
    console.log(`Beehiiv subscribed to ${publicationId}:`, email)
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

// Branded receipt for the VE Passport $11/month subscription - both the first
// signup charge and every subsequent monthly renewal reuse this same email.
function buildPassportReceiptEmail(opts: { points: number; balance: number; renewal: boolean }): string {
  const { points, balance, renewal } = opts
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
        <p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#444;">${renewal ? 'Your $11/month Passport subscription renewed and your monthly Points just landed.' : 'Thanks for subscribing to the $11/month Passport. Your Points are in and your subscription is active.'}</p>
        <div style="background:#e8f5e9;border:1px solid #b8ddb9;border-radius:8px;padding:18px 22px;margin:0 0 24px;">
          <p style="margin:0 0 4px;font-size:12px;color:#2d7d31;font-weight:700;letter-spacing:.05em;">POINTS ADDED</p>
          <p style="margin:0;font-size:26px;font-weight:800;color:#2d7d31;">+${points.toLocaleString()} Points</p>
          <p style="margin:6px 0 0;font-size:13px;color:#2d7d31;">New balance: ${balance.toLocaleString()} Points</p>
        </div>
        <a href="https://vegansexplore.com/guides" style="display:inline-block;background:#3A9B3E;color:#fff;font-weight:700;padding:12px 24px;border-radius:6px;text-decoration:none;font-size:14px;">Unlock a Guide</a>
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

Deno.serve(async (req: Request) => {
  const sig = req.headers.get('stripe-signature')
  if (!sig) return new Response('Missing signature', { status: 400 })

  const body = await req.text()

  let event: Stripe.Event | null = null
  let lastErr: any = null
  for (const secret of WEBHOOK_SECRETS) {
    try {
      event = await stripe.webhooks.constructEventAsync(body, sig, secret)
      break
    } catch (err) {
      lastErr = err
    }
  }
  if (!event) {
    console.error('Webhook signature error (tried all configured secrets):', lastErr?.message)
    return new Response(`Webhook error: ${lastErr?.message ?? 'invalid signature'}`, { status: 400 })
  }

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

    // --- Explore Season Partners Guide purchase (ve-partner-guide sessions carry this metadata) ---
    // Added 2026-09-24 (Logan) per the locked playbook explore-season-partners-guide.
    // ve-partner-guide writes a pending public.sponsors row before sending the
    // buyer to Stripe; this flips it to active, grants a year of membership when
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
            ? para('Your Vegans Explore membership is active on your account for the year.')
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
            para('Your Community Manager will reach out with next steps. Questions? Just reply to this email.')))
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
    // Mirrors GeekFon's $11/mo = 1,100 Points pattern. Marks the member as an
    // active Passport subscriber and credits the first month's Points immediately;
    // renewals are credited by the invoice.payment_succeeded branch below.
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

      const { data: result, error: creditError } = await supabase.rpc('credit_points_purchase', {
        p_member_id: memberId,
        p_amount: 1100,
        p_stripe_session_id: session.id,
        p_package: 'passport_monthly',
      })

      if (creditError) {
        console.error('credit_points_purchase (passport signup) error:', creditError)
      }

      console.log('Passport subscription activated:', memberId, subscriptionId, result)

      try {
        const { data: member } = await supabase.from('members').select('email').eq('id', memberId).maybeSingle()
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
              subject: 'Your Passport is active - +1,100 Points added',
              html: buildPassportReceiptEmail({ points: 1100, balance: result.balance, renewal: false })
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
    // any-amount path to the same 'active' membership_status the $11/month
    // Passport subscription grants above. Credits points at the locked
    // Founders-pledge rate ($1 = 100 points, canon-ve-founders-pledge-points-
    // 2026-08-29) so a $5 contribution behaves identically to a $5 Founders
    // pledge -- amount_cents and points happen to be numerically equal at
    // that rate (500 cents = 500 points), which is why no separate
    // dollars-to-points conversion is done here.
    if (session.metadata?.type === 'entry_contribution') {
      const memberId = session.metadata.member_id
      const points = parseInt(session.metadata.amount_cents || '0', 10)

      if (!memberId || !points) {
        console.error('entry_contribution session missing member_id/amount_cents metadata:', session.id)
        return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } })
      }

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

      const { data: result, error: creditError } = await supabase.rpc('credit_points_purchase', {
        p_member_id: memberId,
        p_amount: points,
        p_stripe_session_id: session.id,
        p_package: 'entry_contribution',
      })

      if (creditError) {
        console.error('credit_points_purchase (entry_contribution) error:', creditError)
      }

      console.log('Entry contribution activated membership:', memberId, points, result)

      try {
        const { data: member } = await supabase.from('members').select('email').eq('id', memberId).maybeSingle()
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
              subject: 'Your Passport is active - thank you for supporting the community',
              html: buildPointsReceiptEmail(points, result.balance)
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

    // --- Legacy pre-launch founding-membership branch (unchanged) ---
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

    await subscribeToBeehiiv(email, Deno.env.get('BEEHIIV_MASTER_PUBLICATION_ID')!)
    await subscribeToBeehiiv(email, Deno.env.get('BEEHIIV_VE_PUBLICATION_ID')!)

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

  // --- VE Passport monthly renewal branch (invoice.payment_succeeded) ---
  // Added 2026-08-17 (Logan). Only the recurring renewal invoices matter here --
  // the very first invoice on a new subscription is already covered by the
  // checkout.session.completed branch above, so billing_reason is checked to
  // avoid double-crediting month 1. credit_points_purchase is idempotent on
  // (ref_id, reason), so even a duplicate webhook delivery for the same invoice
  // is safe to replay.
  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object as Stripe.Invoice
    if (invoice.billing_reason === 'subscription_cycle' && invoice.subscription) {
      const subscriptionId = invoice.subscription as string

      const { data: member, error: lookupError } = await supabase
        .from('members')
        .select('id, email')
        .eq('stripe_subscription_id', subscriptionId)
        .eq('membership_tier', 'passport')
        .maybeSingle()

      if (lookupError) {
        console.error('members lookup by stripe_subscription_id error:', lookupError)
        return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } })
      }

      if (member) {
        const { data: result, error: creditError } = await supabase.rpc('credit_points_purchase', {
          p_member_id: member.id,
          p_amount: 1100,
          p_stripe_session_id: invoice.id,
          p_package: 'passport_monthly_renewal',
        })

        if (creditError) {
          console.error('credit_points_purchase (passport renewal) error:', creditError)
        } else {
          console.log('Passport renewal credited:', member.id, subscriptionId, result)
          try {
            if (member.email && result?.balance != null) {
              await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  from: 'VEGANS EXPLORE <hello@vegansexplore.com>',
                  to: member.email,
                  subject: 'Your Passport renewed - +1,100 Points added',
                  html: buildPassportReceiptEmail({ points: 1100, balance: result.balance, renewal: true })
                })
              })
            }
          } catch (e) {
            console.error('Passport renewal receipt email failed:', e)
          }
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
