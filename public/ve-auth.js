
(function(global){'use strict';
var SUPABASE_ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3Ymh3ZnhwbmNyc2ZodHRpbW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjAxMzksImV4cCI6MjA5MDIzNjEzOX0.9mxjK0bn5WATCbNLWrHPakD6yHUDtHFHrOaklPnWkOA';
var FN_URL='https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-auth';
var GOOGLE_ID='450477549015-ioh43e9qi7m89qknkoo318b2geejja4t.apps.googleusercontent.com';
function getToken(){try{return localStorage.getItem('ve_token')||null;}catch(e){return null;}}
function getMember(){try{return JSON.parse(localStorage.getItem('ve_member')||'null');}catch(e){return null;}}
function setSession(t,m){try{localStorage.setItem('ve_token',t);localStorage.setItem('ve_member',JSON.stringify(m));}catch(e){}}
function clearSession(){try{localStorage.removeItem('ve_token');localStorage.removeItem('ve_member');}catch(e){}}
function isLoggedIn(){return!!getToken();}
function call(action,body){return fetch(FN_URL+'?action='+action,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+SUPABASE_ANON},body:JSON.stringify(body||{})}).then(function(r){return r.json();});}
function signup(email,password,name,ref){return call('signup',{email:email,password:password,name:name,referral_code:ref||null}).then(function(d){if(d.token)setSession(d.token,d.member);return d;});}
function login(email,password){return call('login',{email:email,password:password}).then(function(d){if(d.token)setSession(d.token,d.member);return d;});}
function loginWithGoogle(idToken){return call('google',{id_token:idToken}).then(function(d){if(d.token)setSession(d.token,d.member);return d;});}
function signOut(){clearSession();window.location.href='/';}
function initGoogleSignIn(buttonEl,callback){if(!window.google||!window.google.accounts)return;window.google.accounts.id.initialize({client_id:GOOGLE_ID,auto_select:false,cancel_on_tap_outside:true,callback:function(r){loginWithGoogle(r.credential).then(callback);}});if(buttonEl)window.google.accounts.id.renderButton(buttonEl,{type:'standard',shape:'rectangular',theme:'outline',text:'continue_with',size:'large',width:buttonEl.offsetWidth||360});}
function requirePassport(onGranted,message){if(isLoggedIn()){onGranted();return;}showAuthModal(message||'You need a free Passport to do that.');}
var _modalCb=null,_modalInited=false,_gBtnInited=false;
function showAuthModal(message,onSuccess){_modalCb=onSuccess||null;if(!_modalInited){_buildModal();_modalInited=true;}var msg=document.getElementById('ve-am-msg');if(msg&&message)msg.textContent=message;var modal=document.getElementById('ve-auth-modal');if(modal){modal.style.display='flex';document.body.style.overflow='hidden';}_loadGSI(function(){if(!_gBtnInited){var el=document.getElementById('ve-am-google-btn');if(el)_initGBtn(el);}});}
function hideAuthModal(){var m=document.getElementById('ve-auth-modal');if(m){m.style.display='none';document.body.style.overflow='';}var e=document.getElementById('ve-am-error');if(e){e.textContent='';e.style.display='none';}}
function _onSuccess(){hideAuthModal();if(_modalCb)_modalCb();else location.reload();}
function _showErr(msg){var e=document.getElementById('ve-am-error');if(e){e.textContent=msg;e.style.display='block';}}
function _clearErr(){var e=document.getElementById('ve-am-error');if(e){e.textContent='';e.style.display='none';}}
function _loadGSI(cb){if(window.google&&window.google.accounts){cb();return;}if(document.querySelector('script[src*="accounts.google.com/gsi"]')){var t=0,iv=setInterval(function(){t++;if(window.google&&window.google.accounts){clearInterval(iv);cb();}else if(t>50)clearInterval(iv);},100);return;}var s=document.createElement('script');s.src='https://accounts.google.com/gsi/client';s.async=true;s.defer=true;s.onload=cb;document.head.appendChild(s);}
function _initGBtn(el){window.google.accounts.id.initialize({client_id:GOOGLE_ID,auto_select:false,cancel_on_tap_outside:true,callback:function(r){_clearErr();loginWithGoogle(r.credential).then(function(d){if(d.error){_showErr(d.error||'Google sign-in failed. Please try again.');return;}_onSuccess();}).catch(function(){_showErr('Something went wrong. Please try again.');});}});window.google.accounts.id.renderButton(el,{type:'standard',shape:'rectangular',theme:'outline',text:'continue_with',size:'large',width:el.offsetWidth||336});_gBtnInited=true;}
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
'#ve-am-submit{display:block;width:100%;padding:13px;background:#22C55E;color:#fff;font-family:"Montserrat",sans-serif;font-size:12px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;border:none;border-radius:6px;cursor:pointer;transition:background 0.15s;margin-top:4px;box-sizing:border-box;}'+
'#ve-am-submit:hover{background:#16A34A;}'+
'#ve-am-submit:disabled{background:#9CA3AF;cursor:not-allowed;}'+
'#ve-am-join{text-align:center;margin-top:16px;font-size:12px;color:#555;font-family:"Montserrat",sans-serif;}'+
'#ve-am-join a{color:#22C55E;font-weight:700;text-decoration:none;}'+
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
'<div id="ve-am-error" role="alert"></div>'+
'<div id="ve-am-google-wrap"><div id="ve-am-google-btn"></div></div>'+
'<div class="ve-am-divider"><div class="ve-am-divider-line"></div><span class="ve-am-divider-text">or sign in with email</span><div class="ve-am-divider-line"></div></div>'+
'<form id="ve-am-form" novalidate>'+
'<div class="ve-am-field"><label for="ve-am-email">Email</label><input type="email" id="ve-am-email" name="email" autocomplete="email" placeholder="you@example.com" required></div>'+
'<div class="ve-am-field"><label for="ve-am-password">Password</label><input type="password" id="ve-am-password" name="password" autocomplete="current-password" placeholder="Your password" required></div>'+
'<button type="submit" id="ve-am-submit">Sign In</button>'+
'</form>'+
'<p id="ve-am-join">Got no Passport yet? <a href="/join">Get one free</a></p>'+
'</div>';
document.body.appendChild(el);
document.getElementById('ve-am-close').addEventListener('click',hideAuthModal);
el.addEventListener('click',function(e){if(e.target===el)hideAuthModal();});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&el.style.display==='flex')hideAuthModal();});
document.getElementById('ve-am-form').addEventListener('submit',function(e){
e.preventDefault();_clearErr();
var email=document.getElementById('ve-am-email').value.trim();
var pw=document.getElementById('ve-am-password').value;
var btn=document.getElementById('ve-am-submit');
if(!email){_showErr('Please enter your email.');return;}
if(!pw){_showErr('Please enter your password.');return;}
btn.disabled=true;btn.textContent='Signing in...';
login(email,pw).then(function(d){
btn.disabled=false;btn.textContent='Sign In';
if(d.error){_showErr(d.error);return;}
_onSuccess();
}).catch(function(){btn.disabled=false;btn.textContent='Sign In';_showErr('Something went wrong. Please try again.');});
});}
global.VEAuth={getToken:getToken,getMember:getMember,isLoggedIn:isLoggedIn,setSession:setSession,clearSession:clearSession,signup:signup,login:login,loginWithGoogle:loginWithGoogle,initGoogleSignIn:initGoogleSignIn,signOut:signOut,requirePassport:requirePassport,showAuthModal:showAuthModal,hideAuthModal:hideAuthModal};
})(window);
