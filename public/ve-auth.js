
(function(global){'use strict';
var SUPABASE_ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3Ymh3ZnhwbmNyc2ZodHRpbW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjAxMzksImV4cCI6MjA5MDIzNjEzOX0.9mxjK0bn5WATCbNLWrHPakD6yHUDtHFHrOaklPnWkOA';
var FN_URL='https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-auth';
var GOOGLE_ID='554053879127-o0vp4rrjp5qgeoq4fbje3qtbrvlupt59.apps.googleusercontent.com';
function getToken(){try{return localStorage.getItem('ve_token')||null;}catch(e){return null;}}
function getRealMember(){try{return JSON.parse(localStorage.getItem('ve_member')||'null');}catch(e){return null;}}
function setSession(t,m){try{localStorage.setItem('ve_token',t);localStorage.setItem('ve_member',JSON.stringify(m));}catch(e){}}
function clearSession(){try{localStorage.removeItem('ve_token');localStorage.removeItem('ve_member');}catch(e){}}
// --- Super Admin "View As" simulator (2026-07-12). Lets Sean's own account
// (members.is_superadmin = true) preview the site as a logged-out visitor or a
// simulated free member with a chosen Points balance, without touching his real
// session. Preview only: getToken() always returns the REAL token, so any real
// network call (signup, login, spend_points_for_guide, etc.) never runs against
// faked data. Only ever honored when the real underlying account is a super admin.
function isRealSuperAdmin(){var m=getRealMember();return!!(m&&m.is_superadmin);}
function getViewAs(){if(!isRealSuperAdmin())return null;try{var v=JSON.parse(localStorage.getItem('ve_view_as')||'null');if(!v||(v.mode!=='public'&&v.mode!=='member'))return null;return v;}catch(e){return null;}}
function setViewAs(mode,points){if(!isRealSuperAdmin())return;try{localStorage.setItem('ve_view_as',JSON.stringify({mode:mode,points:points||0}));}catch(e){}window.location.reload();}
function clearViewAs(){try{localStorage.removeItem('ve_view_as');}catch(e){}window.location.reload();}
function getMember(){var v=getViewAs();if(v){if(v.mode==='public')return null;var real=getRealMember();return real?Object.assign({},real,{lesars_balance:v.points||0}):null;}return getRealMember();}
function isLoggedIn(){var v=getViewAs();if(v)return v.mode==='member';return!!getToken();}
function call(action,body){return fetch(FN_URL+'?action='+action,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+SUPABASE_ANON},body:JSON.stringify(body||{})}).then(function(r){return r.json();});}
function signup(email,password,name,ref,community){return call('signup',{email:email,password:password,name:name,referral_code:ref||null,home_community:community||null}).then(function(d){if(d.token)setSession(d.token,d.member);return d;});}
function login(email,password){return call('login',{email:email,password:password}).then(function(d){if(d.token)setSession(d.token,d.member);return d;});}
function loginWithGoogle(idToken,community){return call('google',{id_token:idToken,home_community:community||null}).then(function(d){if(d.token)setSession(d.token,d.member);return d;});}
function forgotPassword(email){return call('forgot_password',{email:email});}
function resetPassword(token,password){return call('reset_password',{token:token,password:password});}
function completeOnboarding(payload){var body=Object.assign({},payload,{token:getToken()});return call('complete_onboarding',body).then(function(d){if(d.member){var m=Object.assign({},getRealMember()||{},d.member);setSession(getToken(),m);}return d;});}
function setHomeCommunity(slug){return call('set_home_community',{token:getToken(),home_community:slug}).then(function(d){if(d.member){var m=Object.assign({},getRealMember()||{},d.member);setSession(getToken(),m);}return d;});}
function joinCommunity(slug){return call('join_community',{token:getToken(),community_slug:slug}).then(function(d){if(d.communities){var m=Object.assign({},getRealMember()||{},{communities:d.communities});setSession(getToken(),m);}return d;});}
function leaveCommunity(slug){return call('leave_community',{token:getToken(),community_slug:slug}).then(function(d){if(d.communities){var m=Object.assign({},getRealMember()||{},{communities:d.communities});setSession(getToken(),m);}return d;});}
function joinCampaign(slug){return call('join_campaign',{token:getToken(),initiative_slug:slug}).then(function(d){if(d.campaigns){var m=Object.assign({},getRealMember()||{},{campaigns:d.campaigns});setSession(getToken(),m);}return d;});}
function leaveCampaign(slug){return call('leave_campaign',{token:getToken(),initiative_slug:slug}).then(function(d){if(d.campaigns){var m=Object.assign({},getRealMember()||{},{campaigns:d.campaigns});setSession(getToken(),m);}return d;});}
function getLayout(){return call('get_layout',{token:getToken()});}
function saveLayout(layout){return call('save_layout',{token:getToken(),layout:layout});}
function hideModule(key){return call('hide_module',{token:getToken(),module_key:key}).then(function(d){if(d.hidden_modules){var m=Object.assign({},getRealMember()||{},{hidden_modules:d.hidden_modules});setSession(getToken(),m);}return d;});}
function showModule(key){return call('show_module',{token:getToken(),module_key:key}).then(function(d){if(d.hidden_modules){var m=Object.assign({},getRealMember()||{},{hidden_modules:d.hidden_modules});setSession(getToken(),m);}return d;});}
function saveListing(listingId){return call('save_listing',{token:getToken(),listing_id:listingId});}
function unsaveListing(listingId){return call('unsave_listing',{token:getToken(),listing_id:listingId});}
function listSavedListings(){return call('list_saved_listings',{token:getToken()});}
function signOut(){clearSession();window.location.href='/';}
function initGoogleSignIn(buttonEl,callback,community){if(!window.google||!window.google.accounts)return;window.google.accounts.id.initialize({client_id:GOOGLE_ID,auto_select:false,cancel_on_tap_outside:true,callback:function(r){loginWithGoogle(r.credential,community).then(callback);}});if(buttonEl)window.google.accounts.id.renderButton(buttonEl,{type:'standard',shape:'rectangular',theme:'outline',text:'continue_with',size:'large',width:buttonEl.offsetWidth||360});}
function requirePassport(onGranted,message){if(isLoggedIn()){onGranted();return;}showAuthModal(message||'You need a free Passport to do that.');}
var _modalCb=null,_modalInited=false,_gBtnInited=false;
function showAuthModal(message,onSuccess){_modalCb=onSuccess||null;if(!_modalInited){_buildModal();_modalInited=true;}var msg=document.getElementById('ve-am-msg');if(msg)msg.textContent=message||'Sign in to your Passport, or create a free one to continue.';_setAuthMode('login');var modal=document.getElementById('ve-auth-modal');if(modal){modal.style.display='flex';document.body.style.overflow='hidden';}_loadGSI(function(){if(!_gBtnInited){var el=document.getElementById('ve-am-google-btn');if(el)_initGBtn(el);}});}
function hideAuthModal(){var m=document.getElementById('ve-auth-modal');if(m){m.style.display='none';document.body.style.overflow='';}var e=document.getElementById('ve-am-error');if(e){e.textContent='';e.style.display='none';}}
function _onSuccess(){hideAuthModal();if(_modalCb)_modalCb();else location.reload();}
function _showErr(msg){var e=document.getElementById('ve-am-error');if(e){e.textContent=msg;e.style.display='block';}}
function _clearErr(){var e=document.getElementById('ve-am-error');if(e){e.textContent='';e.style.display='none';}}
function _loadGSI(cb){if(window.google&&window.google.accounts){cb();return;}if(document.querySelector('script[src*="accounts.google.com/gsi"]')){var t=0,iv=setInterval(function(){t++;if(window.google&&window.google.accounts){clearInterval(iv);cb();}else if(t>50)clearInterval(iv);},100);return;}var s=document.createElement('script');s.src='https://accounts.google.com/gsi/client';s.async=true;s.defer=true;s.onload=cb;document.head.appendChild(s);}
function _initGBtn(el){window.google.accounts.id.initialize({client_id:GOOGLE_ID,auto_select:false,cancel_on_tap_outside:true,callback:function(r){_clearErr();loginWithGoogle(r.credential).then(function(d){if(d.error){_showErr(d.error||'Google sign-in failed. Please try again.');return;}_onSuccess();}).catch(function(){_showErr('Something went wrong. Please try again.');});}});window.google.accounts.id.renderButton(el,{type:'standard',shape:'rectangular',theme:'outline',text:'continue_with',size:'large',width:el.offsetWidth||336});_gBtnInited=true;}
// Login/Create-Account are two tabs on the SAME modal (2026-08-19, V direction:
// "Both options should be clearly available so they don't have to leave the
// process") -- previously "create an account" was a small link off to a separate
// /join page, which did a hard window.location.replace('/onboarding') on success
// and threw away whatever the visitor was in the middle of (e.g. a wizard's
// selected path/notes). Both tabs now resolve through the exact same _onSuccess()
// path as sign-in, so a fresh signup here never navigates away.
var _authMode='login';
function _setAuthMode(mode){
  _authMode=mode;
  var isSignup=mode==='signup';
  var tabLogin=document.getElementById('ve-am-tab-login');
  var tabSignup=document.getElementById('ve-am-tab-signup');
  if(tabLogin)tabLogin.classList.toggle('active',!isSignup);
  if(tabSignup)tabSignup.classList.toggle('active',isSignup);
  var title=document.getElementById('ve-am-title');
  if(title)title.textContent=isSignup?'Create Your Free Passport':'Welcome Back';
  var nameWrap=document.getElementById('ve-am-name-wrap');
  if(nameWrap)nameWrap.style.display=isSignup?'block':'none';
  var pwInput=document.getElementById('ve-am-password');
  if(pwInput)pwInput.setAttribute('autocomplete',isSignup?'new-password':'current-password');
  var submit=document.getElementById('ve-am-submit');
  if(submit)submit.textContent=isSignup?'Create Free Account':'Sign In';
  _clearErr();
}
function _buildModal(){
var s=document.createElement('style');
s.textContent=
'#ve-auth-modal{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:9999;align-items:center;justify-content:center;padding:20px;font-family:"Montserrat",sans-serif;}'+
'#ve-am-box{background:#fff;border-radius:12px;padding:36px 32px 28px;max-width:400px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.2);position:relative;}'+
'#ve-am-logo{text-align:center;margin-bottom:20px;}'+
'#ve-am-logo img{height:28px;width:auto;}'+
'#ve-am-box h2{margin:0 0 6px;font-size:20px;font-weight:800;color:#1a1a1a;text-align:center;font-family:"Montserrat",sans-serif;}'+
'#ve-am-msg{margin:0 0 20px;font-size:13px;color:#555;text-align:center;line-height:1.5;font-family:"Montserrat",sans-serif;}'+
'#ve-am-error{display:none;background:#FEF2F2;border:1px solid #FECACA;border-radius:6px;padding:10px 12px;font-size:12px;color:#dc2626;font-weight:600;margin-bottom:12px;line-height:1.4;text-align:left;font-family:"Montserrat",sans-serif;}'+
'#ve-am-google-wrap{margin-bottom:12px;}'+
'.ve-am-divider{display:flex;align-items:center;gap:10px;margin:4px 0 14px;}'+
'.ve-am-divider-line{flex:1;border-top:1px solid rgba(0,0,0,0.1);}'+
'.ve-am-divider-text{font-size:11px;font-weight:600;color:#999;white-space:nowrap;font-family:"Montserrat",sans-serif;}'+
'.ve-am-field{margin-bottom:12px;}'+
'.ve-am-field label{display:block;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#555;margin-bottom:4px;font-family:"Montserrat",sans-serif;}'+
'.ve-am-field input{display:block;width:100%;padding:11px 13px;border:1.5px solid rgba(0,0,0,0.15);border-radius:6px;font-family:"Montserrat",sans-serif;font-size:13px;color:#1a1a1a;background:#fff;box-sizing:border-box;transition:border-color 0.15s;-webkit-appearance:none;}'+
'.ve-am-field input:focus{outline:none;border-color:#22C55E;}'+
'#ve-am-tabs{display:flex;gap:6px;margin-bottom:18px;background:#F3F4F6;border-radius:8px;padding:4px;}'+
'.ve-am-tab{flex:1;padding:9px 10px;border:none;background:transparent;border-radius:6px;font-family:"Montserrat",sans-serif;font-size:11.5px;font-weight:800;letter-spacing:0.03em;color:#6B7280;cursor:pointer;transition:background 0.15s,color 0.15s;}'+
'.ve-am-tab.active{background:#fff;color:#1a1a1a;box-shadow:0 1px 3px rgba(0,0,0,0.12);}'+
'#ve-am-submit{display:block;width:100%;padding:13px;background:#22C55E;color:#fff;font-family:"Montserrat",sans-serif;font-size:12px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;border:none;border-radius:6px;cursor:pointer;transition:background 0.15s;margin-top:4px;box-sizing:border-box;}'+
'#ve-am-submit:hover{background:#16A34A;}'+
'#ve-am-submit:disabled{background:#9CA3AF;cursor:not-allowed;}'+
'#ve-am-close{position:absolute;top:12px;right:14px;background:none;border:none;font-size:22px;cursor:pointer;color:#999;line-height:1;padding:4px;}'+
'#ve-am-close:focus-visible{outline:3px solid #22C55E;border-radius:4px;}'+
'@media(max-width:480px){#ve-am-box{padding:28px 20px 22px;}}';
document.head.appendChild(s);
var el=document.createElement('div');
el.id='ve-auth-modal';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-labelledby','ve-am-title');
el.innerHTML=
'<div id="ve-am-box">'+
'<button id="ve-am-close" aria-label="Close">x</button>'+
'<div id="ve-am-logo"><img src="/public/logo-ve-landscape-v1.svg" alt="VEGANS EXPLORE"></div>'+
'<h2 id="ve-am-title">Welcome Back</h2>'+
'<p id="ve-am-msg">Sign in to your Passport.</p>'+
'<div id="ve-am-tabs" role="tablist">'+
'<button type="button" id="ve-am-tab-login" class="ve-am-tab active" role="tab" aria-selected="true">Sign In</button>'+
'<button type="button" id="ve-am-tab-signup" class="ve-am-tab" role="tab" aria-selected="false">Create Free Account</button>'+
'</div>'+
'<div id="ve-am-error" role="alert"></div>'+
'<div id="ve-am-google-wrap"><div id="ve-am-google-btn"></div></div>'+
'<div class="ve-am-divider"><div class="ve-am-divider-line"></div><span class="ve-am-divider-text">or use email</span><div class="ve-am-divider-line"></div></div>'+
'<form id="ve-am-form" novalidate>'+
'<div class="ve-am-field" id="ve-am-name-wrap" style="display:none;"><label for="ve-am-name">Name</label><input type="text" id="ve-am-name" name="name" autocomplete="name" placeholder="Your name"></div>'+
'<div class="ve-am-field"><label for="ve-am-email">Email</label><input type="email" id="ve-am-email" name="email" autocomplete="email" placeholder="you@example.com" required></div>'+
'<div class="ve-am-field"><label for="ve-am-password">Password</label><input type="password" id="ve-am-password" name="password" autocomplete="current-password" placeholder="Your password" required></div>'+
'<button type="submit" id="ve-am-submit">Sign In</button>'+
'</form>'+
'</div>';
document.body.appendChild(el);
document.getElementById('ve-am-close').addEventListener('click',hideAuthModal);
el.addEventListener('click',function(e){if(e.target===el)hideAuthModal();});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&el.style.display==='flex')hideAuthModal();});
document.getElementById('ve-am-tab-login').addEventListener('click',function(){_setAuthMode('login');});
document.getElementById('ve-am-tab-signup').addEventListener('click',function(){_setAuthMode('signup');});
document.getElementById('ve-am-form').addEventListener('submit',function(e){
e.preventDefault();_clearErr();
var email=document.getElementById('ve-am-email').value.trim();
var pw=document.getElementById('ve-am-password').value;
var btn=document.getElementById('ve-am-submit');
if(!email||email.indexOf('@')===-1){_showErr('Please enter a valid email address.');return;}
if(_authMode==='signup'){
var name=document.getElementById('ve-am-name').value.trim();
if(!name){_showErr('Please enter your name.');return;}
if(pw.length<8){_showErr('Password must be at least 8 characters.');return;}
btn.disabled=true;btn.textContent='Creating your Passport...';
signup(email,pw,name).then(function(d){
btn.disabled=false;btn.textContent='Create Free Account';
if(d.error){_showErr(d.error);return;}
_onSuccess();
}).catch(function(){btn.disabled=false;btn.textContent='Create Free Account';_showErr('Something went wrong. Please try again.');});
return;
}
if(!pw){_showErr('Please enter your password.');return;}
btn.disabled=true;btn.textContent='Signing in...';
login(email,pw).then(function(d){
btn.disabled=false;btn.textContent='Sign In';
if(d.error){_showErr(d.error);return;}
_onSuccess();
}).catch(function(){btn.disabled=false;btn.textContent='Sign In';_showErr('Something went wrong. Please try again.');});
});}
global.VEAuth={getToken:getToken,getMember:getMember,isLoggedIn:isLoggedIn,setSession:setSession,clearSession:clearSession,signup:signup,login:login,loginWithGoogle:loginWithGoogle,forgotPassword:forgotPassword,resetPassword:resetPassword,initGoogleSignIn:initGoogleSignIn,signOut:signOut,completeOnboarding:completeOnboarding,setHomeCommunity:setHomeCommunity,joinCommunity:joinCommunity,leaveCommunity:leaveCommunity,joinCampaign:joinCampaign,leaveCampaign:leaveCampaign,getLayout:getLayout,saveLayout:saveLayout,hideModule:hideModule,showModule:showModule,saveListing:saveListing,unsaveListing:unsaveListing,listSavedListings:listSavedListings,requirePassport:requirePassport,showAuthModal:showAuthModal,hideAuthModal:hideAuthModal,getRealMember:getRealMember,isRealSuperAdmin:isRealSuperAdmin,getViewAs:getViewAs,setViewAs:setViewAs,clearViewAs:clearViewAs};
})(window);
