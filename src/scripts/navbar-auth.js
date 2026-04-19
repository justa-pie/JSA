// =============================================
// navbar-auth.js — Lyrix (Firebase v12 Modular)
// Nhúng vào TẤT CẢ các trang — cuối <body>
// KHÔNG dùng type="module" trong HTML nữa
// =============================================

(function () {
    'use strict';

    // ==========================================
    // 🔥 FIREBASE CONFIG
    // ==========================================
    const FB_CFG = {
        apiKey:            "AIzaSyANhY8Ze06tNkGF2MQmujPY2gXsMgIYMG4",
        authDomain:        "lyrix-b258b.firebaseapp.com",
        projectId:         "lyrix-b258b",
        storageBucket:     "lyrix-b258b.firebasestorage.app",
        messagingSenderId: "586165994873",
        appId:             "1:586165994873:web:7a48b5181409abfe459ba8"
    };

    // ==========================================
    // LOAD FIREBASE v12 MODULAR qua ESM CDN
    // ==========================================
    const MOD_URL = 'https://www.gstatic.com/firebasejs/12.0.0';

    let _auth = null;   // firebase auth instance
    let _GoogleProvider = null;

    async function loadFirebase() {
        const { initializeApp, getApps } = await import(`${MOD_URL}/firebase-app.js`);
        const {
            getAuth,
            onAuthStateChanged,
            signInWithEmailAndPassword,
            createUserWithEmailAndPassword,
            signInWithPopup,
            GoogleAuthProvider,
            signOut
        } = await import(`${MOD_URL}/firebase-auth.js`);

        // Tránh init nhiều lần nếu đã có app
        const app = getApps().length ? getApps()[0] : initializeApp(FB_CFG);
        _auth = getAuth(app);
        _GoogleProvider = new GoogleAuthProvider();

        // Expose các hàm auth cần dùng vào closure
        window._lxFB = {
            signInWithEmailAndPassword: (e, p) => signInWithEmailAndPassword(_auth, e, p),
            createUserWithEmailAndPassword: (e, p) => createUserWithEmailAndPassword(_auth, e, p),
            signInWithPopup: () => signInWithPopup(_auth, _GoogleProvider),
            signOut: () => signOut(_auth),
            onAuthStateChanged: (cb) => onAuthStateChanged(_auth, cb)
        };

        // Bắt đầu lắng nghe auth state
        onAuthStateChanged(_auth, (user) => lxUpdateNav(user));
    }

    // =============================================
    // STYLES
    // =============================================
    function lxInjectStyles() {
        const s = document.createElement('style');
        s.textContent = `
        #lyrixAuthOverlay {
            display:none; position:fixed; inset:0;
            background:rgba(0,0,0,0.72); backdrop-filter:blur(8px);
            z-index:9999; align-items:center; justify-content:center;
        }
        #lyrixAuthOverlay.lx-open { display:flex; animation:lxFadeIn 0.2s ease; }
        @keyframes lxFadeIn { from{opacity:0} to{opacity:1} }

        #lyrixAuthModal {
            background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);
            border:1px solid rgba(167,139,250,0.3); border-radius:24px;
            padding:36px 32px; width:100%; max-width:420px; margin:16px;
            position:relative; box-shadow:0 30px 80px rgba(0,0,0,0.5);
            animation:lxSlideUp 0.3s ease;
        }
        @keyframes lxSlideUp { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }

        .lx-close {
            position:absolute; top:14px; right:14px;
            background:rgba(255,255,255,0.07); border:none; border-radius:50%;
            width:32px; height:32px; display:flex; align-items:center; justify-content:center;
            color:#9ca3af; cursor:pointer; font-size:0.85rem; transition:all 0.2s;
        }
        .lx-close:hover { background:rgba(248,113,113,0.2); color:#f87171; }

        .lx-tabs {
            display:flex; background:rgba(0,0,0,0.35); border-radius:12px;
            padding:4px; margin-bottom:22px; border:1px solid rgba(167,139,250,0.15);
        }
        .lx-tab {
            flex:1; padding:9px; border:none; background:transparent;
            color:#9ca3af; border-radius:9px; font-size:0.88rem; font-weight:600;
            cursor:pointer; transition:all 0.3s; font-family:inherit;
        }
        .lx-tab.active { background:#a78bfa; color:#fff; box-shadow:0 4px 15px rgba(167,139,250,0.4); }

        .lx-heading { font-size:1.45rem; font-weight:700; color:#a78bfa; margin-bottom:4px; }
        .lx-sub { color:#9ca3af; font-size:0.83rem; margin-bottom:20px; }

        .lx-msg { padding:10px 14px; border-radius:8px; font-size:0.84rem; font-weight:500;
            margin-bottom:14px; display:none; align-items:center; gap:8px; }
        .lx-msg.lx-show { display:flex; }
        .lx-msg.success { background:rgba(52,211,153,0.1); border:1px solid rgba(52,211,153,0.3); color:#34d399; }
        .lx-msg.error   { background:rgba(248,113,113,0.1); border:1px solid rgba(248,113,113,0.3); color:#f87171; }

        .lx-field { margin-bottom:13px; }
        .lx-field label { display:block; color:#9ca3af; font-size:0.8rem; font-weight:600; margin-bottom:5px; }
        .lx-wrap { position:relative; }
        .lx-ico { position:absolute; left:13px; top:50%; transform:translateY(-50%);
            color:#6b7280; font-size:0.82rem; pointer-events:none; }
        .lx-wrap input {
            width:100%; padding:11px 40px 11px 36px;
            background:rgba(0,0,0,0.45); border:1.5px solid rgba(167,139,250,0.2);
            border-radius:10px; color:#f3f4f6; font-size:0.88rem; outline:none;
            transition:all 0.3s; font-family:inherit;
        }
        .lx-wrap input:focus { border-color:#a78bfa; box-shadow:0 0 0 3px rgba(167,139,250,0.15); }
        .lx-wrap input::placeholder { color:rgba(156,163,175,0.4); }
        .lx-wrap input.lx-invalid { border-color:#f87171; }
        .lx-eye { position:absolute; right:11px; top:50%; transform:translateY(-50%);
            background:none; border:none; color:#6b7280; cursor:pointer;
            font-size:0.82rem; transition:color 0.2s; padding:0; }
        .lx-eye:hover { color:#a78bfa; }
        .lx-err { color:#f87171; font-size:0.76rem; margin-top:4px; display:none; }
        .lx-err.lx-show { display:block; }

        .lx-pw-strength { margin-top:6px; display:none; }
        .lx-pw-bar { height:4px; border-radius:2px; background:rgba(255,255,255,0.08); overflow:hidden; margin-bottom:3px; }
        .lx-pw-fill { height:100%; border-radius:2px; width:0%; transition:all 0.3s; }
        .lx-pw-lbl { font-size:0.74rem; color:#9ca3af; }

        .lx-btn {
            width:100%; padding:12px; border:none; border-radius:10px;
            font-size:0.92rem; font-weight:700; cursor:pointer;
            display:flex; align-items:center; justify-content:center; gap:8px;
            margin-bottom:9px; transition:all 0.3s; font-family:inherit;
        }
        .lx-btn-primary { background:#a78bfa; color:#fff; box-shadow:0 6px 20px rgba(167,139,250,0.4); }
        .lx-btn-primary:hover:not(:disabled) { background:#9d6fff; transform:translateY(-2px); }
        .lx-btn-google  { background:rgba(255,255,255,0.05); color:#f3f4f6; border:1.5px solid rgba(255,255,255,0.12); }
        .lx-btn-google:hover:not(:disabled) { background:rgba(255,255,255,0.1); transform:translateY(-2px); }
        .lx-btn-google img { width:17px; height:17px; }
        .lx-btn:disabled { opacity:0.65; cursor:not-allowed; }
        .lx-spin { width:15px; height:15px; border:2px solid rgba(255,255,255,0.3);
            border-top-color:#fff; border-radius:50%; animation:lxR 0.7s linear infinite; display:none; }
        .lx-btn.lx-loading .lx-spin { display:block; }
        .lx-btn.lx-loading .lx-bt  { display:none; }
        @keyframes lxR { to{transform:rotate(360deg)} }

        .lx-div { display:flex; align-items:center; gap:10px; margin:10px 0;
            color:#6b7280; font-size:0.78rem; }
        .lx-div::before,.lx-div::after { content:''; flex:1; height:1px; background:rgba(167,139,250,0.15); }

        /* Navbar */
        #lxNavUser { display:flex; align-items:center; gap:7px; }
        .lx-login-btn {
            display:flex; align-items:center; gap:7px;
            padding:8px 18px; background:#a78bfa; color:#fff !important;
            border-radius:50px; font-weight:700; font-size:0.88rem;
            border:none; cursor:pointer; transition:all 0.3s;
            box-shadow:0 4px 15px rgba(167,139,250,0.4); font-family:inherit;
        }
        .lx-login-btn:hover { background:#9d6fff; transform:translateY(-2px); }
        .lx-user-pill {
            display:flex; align-items:center; gap:7px;
            padding:5px 12px 5px 6px;
            background:rgba(167,139,250,0.15); border:1px solid rgba(167,139,250,0.3);
            border-radius:50px; max-width:190px;
        }
        .lx-user-pill img, .lx-avi {
            width:26px; height:26px; border-radius:50%; object-fit:cover;
            border:2px solid #a78bfa; flex-shrink:0;
        }
        .lx-avi { display:flex; align-items:center; justify-content:center;
            background:rgba(167,139,250,0.2); color:#a78bfa; font-size:0.9rem; }
        .lx-uname {
            font-size:0.8rem; color:#f3f4f6; font-weight:600;
            overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:120px;
        }
        .lx-out {
            background:rgba(248,113,113,0.15); border:1px solid rgba(248,113,113,0.3);
            border-radius:50%; width:32px; height:32px; display:flex; align-items:center;
            justify-content:center; cursor:pointer; transition:all 0.3s;
            color:#f87171; font-size:0.82rem; flex-shrink:0;
        }
        .lx-out:hover { background:rgba(248,113,113,0.3); border-color:#f87171; transform:scale(1.1); }
        `;
        document.head.appendChild(s);
    }

    // =============================================
    // MODAL HTML
    // =============================================
    function lxInjectModal() {
        const el = document.createElement('div');
        el.id = 'lyrixAuthOverlay';
        el.innerHTML = `
        <div id="lyrixAuthModal">
          <button class="lx-close" onclick="lxClose()" title="Đóng"><i class="fas fa-times"></i></button>
          <div class="lx-tabs">
            <button class="lx-tab active" id="lxTL" onclick="lxTab('login')"><i class="fas fa-sign-in-alt"></i> Đăng nhập</button>
            <button class="lx-tab" id="lxTS" onclick="lxTab('signup')"><i class="fas fa-user-plus"></i> Đăng ký</button>
          </div>
          <div class="lx-msg" id="lxMsg"><i id="lxMI" class="fas fa-circle-info"></i><span id="lxMT"></span></div>

          <!-- LOGIN -->
          <div id="lxLF">
            <div class="lx-heading">🎵 Chào mừng lại!</div>
            <div class="lx-sub">Đăng nhập để khám phá âm nhạc cùng Lyrix</div>
            <div class="lx-field">
              <label>Email</label>
              <div class="lx-wrap">
                <i class="fas fa-envelope lx-ico"></i>
                <input type="email" id="lxLE" placeholder="you@example.com" oninput="lxCE('lxLE')">
              </div>
              <div class="lx-err" id="lxLEE"></div>
            </div>
            <div class="lx-field">
              <label>Mật khẩu</label>
              <div class="lx-wrap">
                <i class="fas fa-lock lx-ico"></i>
                <input type="password" id="lxLP" placeholder="Nhập mật khẩu..." oninput="lxCE('lxLP')">
                <button class="lx-eye" type="button" onclick="lxEye('lxLP',this)"><i class="fas fa-eye"></i></button>
              </div>
              <div class="lx-err" id="lxLPE"></div>
            </div>
            <button class="lx-btn lx-btn-primary" id="lxBL" onclick="lxLogin()">
              <div class="lx-spin"></div><span class="lx-bt"><i class="fas fa-sign-in-alt"></i> Đăng nhập</span>
            </button>
            <div class="lx-div">hoặc</div>
            <button class="lx-btn lx-btn-google" id="lxBG1" onclick="lxGoogle()">
              <div class="lx-spin"></div><span class="lx-bt"><img src="https://www.google.com/favicon.ico" alt="G"> Tiếp tục với Google</span>
            </button>
          </div>

          <!-- SIGNUP -->
          <div id="lxSF" style="display:none">
            <div class="lx-heading">✨ Tạo tài khoản</div>
            <div class="lx-sub">Tham gia Lyrix — hoàn toàn miễn phí</div>
            <div class="lx-field">
              <label>Email</label>
              <div class="lx-wrap">
                <i class="fas fa-envelope lx-ico"></i>
                <input type="email" id="lxSE" placeholder="you@example.com" oninput="lxCE('lxSE')">
              </div>
              <div class="lx-err" id="lxSEE"></div>
            </div>
            <div class="lx-field">
              <label>Mật khẩu</label>
              <div class="lx-wrap">
                <i class="fas fa-lock lx-ico"></i>
                <input type="password" id="lxSP" placeholder="Tạo mật khẩu mạnh..." oninput="lxPwMeter();lxCE('lxSP')">
                <button class="lx-eye" type="button" onclick="lxEye('lxSP',this)"><i class="fas fa-eye"></i></button>
              </div>
              <div class="lx-pw-strength" id="lxPWS">
                <div class="lx-pw-bar"><div class="lx-pw-fill" id="lxPWF"></div></div>
                <div class="lx-pw-lbl" id="lxPWL"></div>
              </div>
              <div class="lx-err" id="lxSPE"></div>
            </div>
            <div class="lx-field">
              <label>Xác nhận mật khẩu</label>
              <div class="lx-wrap">
                <i class="fas fa-lock lx-ico"></i>
                <input type="password" id="lxSC" placeholder="Nhập lại mật khẩu..." oninput="lxCE('lxSC')">
                <button class="lx-eye" type="button" onclick="lxEye('lxSC',this)"><i class="fas fa-eye"></i></button>
              </div>
              <div class="lx-err" id="lxSCE"></div>
            </div>
            <button class="lx-btn lx-btn-primary" id="lxBS" onclick="lxSignup()">
              <div class="lx-spin"></div><span class="lx-bt"><i class="fas fa-user-plus"></i> Đăng ký</span>
            </button>
            <div class="lx-div">hoặc</div>
            <button class="lx-btn lx-btn-google" id="lxBG2" onclick="lxGoogle()">
              <div class="lx-spin"></div><span class="lx-bt"><img src="https://www.google.com/favicon.ico" alt="G"> Tiếp tục với Google</span>
            </button>
          </div>
        </div>`;

        el.addEventListener('click', e => { if (e.target === el) lxClose(); });
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') lxClose();
            if (e.key === 'Enter' && el.classList.contains('lx-open')) {
                g('lxSF').style.display === 'none' ? lxLogin() : lxSignup();
            }
        });
        document.body.appendChild(el);
    }

    // =============================================
    // NAV BUTTON
    // =============================================
    function lxInjectNavButton() {
        const ul = document.querySelector('.navbar-nav');
        if (!ul || g('lxNavItem')) return;
        const li = document.createElement('li');
        li.className = 'nav-item ms-lg-2'; li.id = 'lxNavItem';
        li.innerHTML = '<div id="lxNavUser"><button class="lx-login-btn" onclick="lxOpen()"><i class="fas fa-sign-in-alt"></i> Đăng nhập</button></div>';
        const back = ul.querySelector('.btn-back')?.closest('li');
        if (back) ul.insertBefore(li, back); else ul.appendChild(li);
    }

    function lxUpdateNav(user) {
        const c = g('lxNavUser');
        if (!c) return;
        if (user) {
            const avi = user.photoURL
                ? `<img src="${user.photoURL}" alt="">`
                : `<div class="lx-avi"><i class="fas fa-user"></i></div>`;
            const name = user.displayName || user.email || '';
            c.innerHTML = `
              <div class="lx-user-pill" title="${user.email}">${avi}<span class="lx-uname">${name}</span></div>
              <button class="lx-out" onclick="lxLogout()" title="Đăng xuất"><i class="fas fa-sign-out-alt"></i></button>`;
        } else {
            c.innerHTML = `<button class="lx-login-btn" onclick="lxOpen()"><i class="fas fa-sign-in-alt"></i> Đăng nhập</button>`;
        }
    }

    // =============================================
    // HELPERS
    // =============================================
    function g(id) { return document.getElementById(id); }

    window.lxOpen  = (tab = 'login') => { lxTab(tab); lxHideMsg(); g('lyrixAuthOverlay').classList.add('lx-open'); document.body.style.overflow = 'hidden'; };
    window.lxClose = () => { g('lyrixAuthOverlay').classList.remove('lx-open'); document.body.style.overflow = ''; };
    window.lxTab   = (t) => {
        g('lxLF').style.display = t === 'login'  ? 'block' : 'none';
        g('lxSF').style.display = t === 'signup' ? 'block' : 'none';
        g('lxTL').classList.toggle('active', t === 'login');
        g('lxTS').classList.toggle('active', t === 'signup');
        lxHideMsg();
    };

    window.lxEye = (id, btn) => {
        const inp = g(id), ico = btn.querySelector('i');
        inp.type = inp.type === 'password' ? 'text' : 'password';
        ico.classList.toggle('fa-eye',      inp.type === 'password');
        ico.classList.toggle('fa-eye-slash', inp.type === 'text');
    };

    window.lxCE = (id) => {
        const el = g(id); if (el) el.classList.remove('lx-invalid');
        const er = g(id + 'E'); if (er) { er.textContent = ''; er.classList.remove('lx-show'); }
    };

    function lxSE(inId, erId, msg) {
        const el = g(inId); if (el) el.classList.add('lx-invalid');
        const er = g(erId); if (er) { er.textContent = msg; er.classList.add('lx-show'); }
    }

    function lxShowMsg(type, text) {
        const b = g('lxMsg'), t = g('lxMT'), i = g('lxMI');
        b.className = `lx-msg lx-show ${type}`;
        t.textContent = text;
        i.className = type === 'success' ? 'fas fa-circle-check' : 'fas fa-circle-exclamation';
        if (type === 'success') setTimeout(lxHideMsg, 3000);
    }
    function lxHideMsg() { const b = g('lxMsg'); if (b) b.classList.remove('lx-show'); }

    function lxLoad(id, on) {
        const b = g(id); if (!b) return;
        b.classList.toggle('lx-loading', on);
        b.disabled = on;
    }

    function lxValEmail(e) { return e.includes('@') && e.includes('.'); }
    function lxValPw(pw) {
        const f = [];
        if (pw.length < 6)        f.push('ít nhất 6 ký tự');
        if (!/[A-Z]/.test(pw))   f.push('1 chữ HOA');
        if (!/[a-z]/.test(pw))   f.push('1 chữ thường');
        if (!/[0-9]/.test(pw))   f.push('1 chữ số');
        return { valid: f.length === 0, failed: f };
    }

    window.lxPwMeter = () => {
        const pw = g('lxSP').value, bar = g('lxPWS'), fill = g('lxPWF'), lbl = g('lxPWL');
        if (!pw) { bar.style.display = 'none'; return; }
        bar.style.display = 'block';
        let sc = 0;
        if (pw.length >= 6)           sc++;
        if (pw.length >= 10)          sc++;
        if (/[A-Z]/.test(pw))        sc++;
        if (/[a-z]/.test(pw))        sc++;
        if (/[0-9]/.test(pw))        sc++;
        if (/[^A-Za-z0-9]/.test(pw)) sc++;
        const ls = [
            { p: '16%',  c: '#f87171', t: '🔴 Rất yếu' },
            { p: '32%',  c: '#fb923c', t: '🟠 Yếu' },
            { p: '50%',  c: '#fbbf24', t: '🟡 Trung bình' },
            { p: '66%',  c: '#a3e635', t: '🟢 Khá mạnh' },
            { p: '82%',  c: '#34d399', t: '💪 Mạnh' },
            { p: '100%', c: '#a78bfa', t: '🔥 Rất mạnh' },
        ];
        const l = ls[Math.min(sc, 5)];
        fill.style.width = l.p; fill.style.background = l.c; lbl.textContent = l.t;
    };

    // =============================================
    // FIREBASE ERROR MESSAGES
    // =============================================
    function lxErrMsg(code) {
        const m = {
            'auth/email-already-in-use':   'Email này đã được đăng ký rồi.',
            'auth/invalid-email':          'Địa chỉ email không hợp lệ.',
            'auth/weak-password':          'Mật khẩu quá yếu (Firebase yêu cầu ít nhất 6 ký tự).',
            'auth/user-not-found':         'Không tìm thấy tài khoản với email này.',
            'auth/wrong-password':         'Mật khẩu không đúng.',
            'auth/invalid-credential':     'Email hoặc mật khẩu không đúng.',
            'auth/too-many-requests':      'Quá nhiều lần thử. Đợi vài phút rồi thử lại.',
            'auth/network-request-failed': 'Lỗi mạng. Kiểm tra kết nối internet.',
            'auth/popup-closed-by-user':   '',
            'auth/cancelled-popup-request':'',
            'auth/popup-blocked':          'Popup bị chặn. Hãy cho phép popup từ trang này.',
            'auth/operation-not-allowed':  'Phương thức đăng nhập này chưa được bật trong Firebase Console.',
        };
        return m[code] ?? `Lỗi Firebase: ${code}`;
    }

    // =============================================
    // LOGIN
    // =============================================
    window.lxLogin = async () => {
        if (!window._lxFB) { lxShowMsg('error', 'Firebase chưa sẵn sàng, thử lại!'); return; }
        lxHideMsg();
        const email = g('lxLE').value.trim(), pw = g('lxLP').value;
        let err = false;
        if (!email)              { lxSE('lxLE', 'lxLEE', 'Vui lòng nhập email.'); err = true; }
        else if (!lxValEmail(email)) { lxSE('lxLE', 'lxLEE', "Email phải chứa ký tự '@'."); err = true; }
        if (!pw)                 { lxSE('lxLP', 'lxLPE', 'Vui lòng nhập mật khẩu.'); err = true; }
        if (err) return;
        lxLoad('lxBL', true);
        try {
            await _lxFB.signInWithEmailAndPassword(email, pw);
            lxShowMsg('success', '✅ Đăng nhập thành công!');
            setTimeout(lxClose, 1200);
        } catch (e) {
            console.error('Login error:', e.code, e.message);
            const msg = lxErrMsg(e.code);
            if (msg) lxShowMsg('error', msg);
            lxLoad('lxBL', false);
        }
    };

    // =============================================
    // SIGNUP
    // =============================================
    window.lxSignup = async () => {
        if (!window._lxFB) { lxShowMsg('error', 'Firebase chưa sẵn sàng, thử lại!'); return; }
        lxHideMsg();
        const email = g('lxSE').value.trim(), pw = g('lxSP').value, cf = g('lxSC').value;
        let err = false;
        if (!email)               { lxSE('lxSE', 'lxSEE', 'Vui lòng nhập email.'); err = true; }
        else if (!lxValEmail(email)) { lxSE('lxSE', 'lxSEE', "Email phải chứa ký tự '@'."); err = true; }
        if (!pw)                  { lxSE('lxSP', 'lxSPE', 'Vui lòng nhập mật khẩu.'); err = true; }
        else {
            const { valid, failed } = lxValPw(pw);
            if (!valid) { lxSE('lxSP', 'lxSPE', `Cần có: ${failed.join(', ')}.`); err = true; }
        }
        if (pw && cf !== pw)      { lxSE('lxSC', 'lxSCE', 'Mật khẩu xác nhận không khớp.'); err = true; }
        if (err) return;
        lxLoad('lxBS', true);
        try {
            await _lxFB.createUserWithEmailAndPassword(email, pw);
            lxShowMsg('success', '🎉 Đăng ký thành công! Chào mừng bạn!');
            setTimeout(lxClose, 1200);
        } catch (e) {
            console.error('Signup error:', e.code, e.message);
            const msg = lxErrMsg(e.code);
            if (msg) lxShowMsg('error', msg);
            lxLoad('lxBS', false);
        }
    };

    // =============================================
    // GOOGLE LOGIN
    // =============================================
    window.lxGoogle = async () => {
        if (!window._lxFB) { lxShowMsg('error', 'Firebase chưa sẵn sàng, thử lại!'); return; }
        lxHideMsg();
        try {
            await _lxFB.signInWithPopup();
            lxShowMsg('success', '✅ Đăng nhập Google thành công!');
            setTimeout(lxClose, 1200);
        } catch (e) {
            console.error('Google error:', e.code, e.message);
            const msg = lxErrMsg(e.code);
            if (msg) lxShowMsg('error', msg);
        }
    };

    // =============================================
    // LOGOUT
    // =============================================
    window.lxLogout = async () => {
        if (window._lxFB) await _lxFB.signOut();
    };

    // =============================================
    // BOOT
    // =============================================
    lxInjectStyles();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => { lxInjectModal(); lxInjectNavButton(); });
    } else {
        lxInjectModal();
        lxInjectNavButton();
    }

    // Load Firebase async — không block render
    loadFirebase().catch(e => console.error('Firebase load error:', e));

})();