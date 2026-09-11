(() => {
  "use strict";

  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const products = Array.isArray(window.KAARVI_PRODUCTS) ? window.KAARVI_PRODUCTS : [];

  // ---------- Cart ----------
  function getCart() {
    try { return JSON.parse(localStorage.getItem("kaarvi_cart") || "[]"); } catch { return []; }
  }
  function saveCart(cart) {
    localStorage.setItem("kaarvi_cart", JSON.stringify(cart));
    updateCartCount();
  }
  function updateCartCount() {
    const count = getCart().reduce((sum, item) => sum + item.qty, 0);
    $$("[data-cart-count]").forEach(el => el.textContent = count);
  }
  function toast(text) {
    let el = $("#kaarviToast");
    if (!el) {
      el = document.createElement("div");
      el.id = "kaarviToast";
      Object.assign(el.style, {position:"fixed",right:"18px",bottom:"78px",zIndex:10001,padding:"12px 16px",borderRadius:"10px",background:"#06386d",color:"#fff",boxShadow:"0 10px 28px #0003",fontWeight:"700"});
      document.body.appendChild(el);
    }
    el.textContent = "✓ " + text;
    el.style.display = "block";
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.style.display = "none", 2200);
  }
  function addToCart(id) {
    const p = products.find(x => String(x.id) === String(id));
    if (!p) return;
    const cart = getCart(), item = cart.find(x => x.id === p.id);
    if (item) item.qty += 1;
    else cart.push({id:p.id,name:p.name,price:p.price,image:p.image,qty:1});
    saveCart(cart); toast(`${p.name} added to cart`);
  }
  function changeQty(id, delta) {
    const cart = getCart(), item = cart.find(x => String(x.id) === String(id));
    if (!item) return;
    item.qty += delta;
    saveCart(item.qty <= 0 ? cart.filter(x => x.id !== item.id) : cart);
    renderCartModal();
  }
  function ensureCartModal() {
    if ($("#kaarviCartModal")) return;
    const modal = document.createElement("div");
    modal.id = "kaarviCartModal";
    modal.innerHTML = `<div class="kcart-backdrop" data-close-cart></div>
      <div class="kcart-panel" role="dialog" aria-modal="true" aria-labelledby="kcartTitle">
        <button class="kcart-close" data-close-cart aria-label="Close cart">×</button>
        <div class="section-kicker">YOUR CART</div><h2 id="kcartTitle">Selected products</h2>
        <div id="kcartItems"></div><div class="kcart-total"><strong>Total</strong><strong id="kcartTotal">₹0</strong></div>
        <div class="kcart-actions"><button class="btn btn-outline" id="clearCart">Clear cart</button><button class="btn btn-green" data-close-cart>Continue</button></div>
      </div>`;
    document.body.appendChild(modal);
    modal.addEventListener("click", e => {
      const close = e.target.closest("[data-close-cart]");
      if (close) modal.classList.remove("show");
      const action = e.target.closest("[data-cart-action]");
      if (!action) return;
      const id = action.dataset.id;
      if (action.dataset.cartAction === "plus") changeQty(id, 1);
      if (action.dataset.cartAction === "minus") changeQty(id, -1);
      if (action.dataset.cartAction === "remove") {
        saveCart(getCart().filter(x => String(x.id) !== String(id)));
        renderCartModal();
      }
    });
    $("#clearCart", modal).addEventListener("click", () => { saveCart([]); renderCartModal(); });
  }
  function renderCartModal() {
    ensureCartModal();
    const items = getCart(), box = $("#kcartItems");
    box.innerHTML = items.length ? items.map(i => `<div class="kcart-item">
      <img src="${i.image}" alt="${escapeHtml(i.name)}"><div class="kcart-item-main"><strong>${escapeHtml(i.name)}</strong>
      <span>₹${Number(i.price).toLocaleString("en-IN")}</span><div class="kcart-qty">
      <button data-cart-action="minus" data-id="${i.id}">−</button><b>${i.qty}</b><button data-cart-action="plus" data-id="${i.id}">+</button>
      <button class="kcart-remove" data-cart-action="remove" data-id="${i.id}">Remove</button></div></div></div>`).join("") :
      `<div class="empty-state">Your cart is empty.</div>`;
    const total = items.reduce((s,i) => s + Number(i.price)*i.qty, 0);
    $("#kcartTotal").textContent = `₹${total.toLocaleString("en-IN")}`;
  }
  function openCart() { ensureCartModal(); renderCartModal(); $("#kaarviCartModal").classList.add("show"); }

  // ---------- Login ----------
  function currentUser() {
    try { return JSON.parse(localStorage.getItem("kaarvi_user") || "null"); } catch { return null; }
  }
  function injectLoginButton() {
    const nav = $(".nav");
    if (!nav || $(".k-login-btn", nav)) return;
    const user = currentUser();
    const a = document.createElement("a");
    a.className = "btn btn-outline k-login-btn";
    a.href = "login.html";
    a.textContent = user?.name ? `Hi, ${user.name.split(" ")[0]}` : "Login";
    a.setAttribute("aria-label", user ? "Open account" : "Login");
    nav.appendChild(a);
  }

  // ---------- Multilingual UI ----------
  const T = {
    en: {home:"Home",artisan:"Artisan Hub",buyers:"Buyers Hub",enhancer:"Image Enhancer",help:"Help",login:"Login",logout:"Logout",
      homeTitle:"Digital empowerment for India’s artisan communities.", homeHero:"Indian craft, connected to opportunity.",
      artisanTitle:"Prepare. Catalogue. Sell.", buyerTitle:"Indian crafts, presented clearly.", helpTitle:"Kaarvi Assistant",
      forArtisans:"For Artisans",explore:"Explore Crafts",generate:"Generate Catalogue",add:"Add to Cart"},
    hi: {home:"होम",artisan:"आर्टिजन हब",buyers:"बायर्स हब",enhancer:"इमेज एन्हांसर",help:"मदद",login:"लॉगिन",logout:"लॉगआउट",
      homeTitle:"भारत के कारीगर समुदायों का डिजिटल सशक्तिकरण।",homeHero:"भारतीय हस्तकला को अवसरों से जोड़ना।",
      artisanTitle:"तैयार करें। कैटलॉग बनाएं। बेचें।",buyerTitle:"भारतीय हस्तकलाएं, साफ़ तरीके से प्रस्तुत।",helpTitle:"Kaarvi सहायक",
      forArtisans:"कारीगरों के लिए",explore:"हस्तकला देखें",generate:"कैटलॉग बनाएं",add:"कार्ट में जोड़ें"},
    bn: {home:"হোম",artisan:"আর্টিজান হাব",buyers:"বায়ার্স হাব",enhancer:"ইমেজ এনহ্যান্সার",help:"সহায়তা",login:"লগইন",
      homeTitle:"ভারতের artisan সম্প্রদায়ের ডিজিটাল ক্ষমতায়ন।",homeHero:"ভারতীয় কারুশিল্পকে সুযোগের সঙ্গে যুক্ত করা।",
      artisanTitle:"প্রস্তুত করুন। ক্যাটালগ করুন। বিক্রি করুন।",buyerTitle:"ভারতীয় কারুশিল্প, পরিষ্কারভাবে উপস্থাপিত।",helpTitle:"Kaarvi Assistant",
      forArtisans:"Artisan-এর জন্য",explore:"কারুশিল্প দেখুন",generate:"ক্যাটালগ তৈরি করুন",add:"কার্টে যোগ করুন"},
    ta: {home:"முகப்பு",artisan:"கைவினைஞர் மையம்",buyers:"வாங்குபவர் மையம்",enhancer:"பட மேம்பாடு",help:"உதவி",login:"உள்நுழை",
      homeTitle:"இந்திய கைவினை சமூகங்களுக்கான டிஜிட்டல் முன்னேற்றம்.",homeHero:"இந்திய கைவினையை வாய்ப்புடன் இணைத்தல்.",
      artisanTitle:"தயார் செய். பட்டியலிடு. விற்பனை செய்.",buyerTitle:"இந்திய கைவினைகள் தெளிவாக வழங்கப்படுகின்றன.",helpTitle:"Kaarvi உதவியாளர்",
      forArtisans:"கைவினைஞர்களுக்காக",explore:"கைவினைகளைப் பார்க்க",generate:"பட்டியல் உருவாக்கு",add:"கார்ட்டில் சேர்"},
    te: {home:"హోమ్",artisan:"ఆర్టిసన్ హబ్",buyers:"బయ్యర్స్ హబ్",enhancer:"ఇమేజ్ ఎన్‌హాన్సర్",help:"సహాయం",login:"లాగిన్",
      homeTitle:"భారతీయ కళాకారుల సమాజాలకు డిజిటల్ సాధికారత.",homeHero:"భారతీయ హస్తకళను అవకాశాలతో కలపడం.",
      artisanTitle:"సిద్ధం చేయండి. కేటలాగ్ చేయండి. అమ్మండి.",buyerTitle:"భారతీయ హస్తకళలు స్పష్టంగా ప్రదర్శించబడ్డాయి.",helpTitle:"Kaarvi సహాయకుడు",
      forArtisans:"కళాకారుల కోసం",explore:"హస్తకళలను చూడండి",generate:"కేటలాగ్ రూపొందించండి",add:"కార్ట్‌లో జోడించండి"},
    mr: {home:"होम",artisan:"आर्टिझन हब",buyers:"बायर्स हब",enhancer:"इमेज एन्हांसर",help:"मदत",login:"लॉगिन",
      homeTitle:"भारतीय कारागीर समुदायांचे डिजिटल सक्षमीकरण.",homeHero:"भारतीय हस्तकलेला संधीशी जोडणे.",
      artisanTitle:"तयार करा. कॅटलॉग करा. विक्री करा.",buyerTitle:"भारतीय हस्तकला स्पष्टपणे सादर.",helpTitle:"Kaarvi सहाय्यक",
      forArtisans:"कारागिरांसाठी",explore:"हस्तकला पहा",generate:"कॅटलॉग तयार करा",add:"कार्टमध्ये जोडा"}
  };

  // Extended Indian language support.
  Object.assign(T, {
    pa: {home:"ਮੁੱਖ ਪੰਨਾ",artisan:"ਕਾਰੀਗਰ ਹੱਬ",buyers:"ਖਰੀਦਦਾਰ ਹੱਬ",enhancer:"ਚਿੱਤਰ ਸੁਧਾਰ",help:"ਮਦਦ",login:"ਲੌਗਇਨ",logout:"ਲੌਗਆਉਟ",
      homeTitle:"ਭਾਰਤ ਦੇ ਕਾਰੀਗਰ ਭਾਈਚਾਰਿਆਂ ਲਈ ਡਿਜ਼ਿਟਲ ਸਸ਼ਕਤੀਕਰਨ।",homeHero:"ਭਾਰਤੀ ਹਸਤਕਲਾ ਨੂੰ ਮੌਕਿਆਂ ਨਾਲ ਜੋੜਨਾ।",artisanTitle:"ਤਿਆਰ ਕਰੋ। ਕੈਟਾਲਾਗ ਬਣਾਓ। ਵੇਚੋ।",buyerTitle:"ਭਾਰਤੀ ਹਸਤਕਲਾ, ਸਪਸ਼ਟ ਢੰਗ ਨਾਲ ਪੇਸ਼ ਕੀਤੀ।",helpTitle:"Kaarvi ਸਹਾਇਕ",forArtisans:"ਕਾਰੀਗਰਾਂ ਲਈ",explore:"ਹਸਤਕਲਾ ਵੇਖੋ",generate:"ਕੈਟਾਲਾਗ ਬਣਾਓ",add:"ਕਾਰਟ ਵਿੱਚ ਪਾਓ"},
    gu: {home:"હોમ",artisan:"કારીગર હબ",buyers:"ખરીદદાર હબ",enhancer:"છબી સુધારક",help:"મદદ",login:"લૉગિન",logout:"લૉગઆઉટ",
      homeTitle:"ભારતના કારીગર સમુદાયોનું ડિજિટલ સશક્તિકરણ.",homeHero:"ભારતીય હસ્તકલાને તકો સાથે જોડવી.",artisanTitle:"તૈયાર કરો. કેટલોગ બનાવો. વેચો.",buyerTitle:"ભારતીય હસ્તકલા, સ્પષ્ટ રીતે રજૂ કરેલી.",helpTitle:"Kaarvi સહાયક",forArtisans:"કારીગરો માટે",explore:"હસ્તકલા જુઓ",generate:"કેટલોગ બનાવો",add:"કાર્ટમાં ઉમેરો"},
    kn: {home:"ಮುಖಪುಟ",artisan:"ಕುಶಲಕರ್ಮಿ ಹಬ್",buyers:"ಖರೀದಿದಾರರ ಹಬ್",enhancer:"ಚಿತ್ರ ಸುಧಾರಕ",help:"ಸಹಾಯ",login:"ಲಾಗಿನ್",logout:"ಲಾಗ್‌ಔಟ್",
      homeTitle:"ಭಾರತದ ಕುಶಲಕರ್ಮಿ ಸಮುದಾಯಗಳ ಡಿಜಿಟಲ್ ಸಬಲೀಕರಣ.",homeHero:"ಭಾರತೀಯ ಕರಕುಶಲವನ್ನು ಅವಕಾಶಗಳೊಂದಿಗೆ ಸಂಪರ್ಕಿಸುವುದು.",artisanTitle:"ತಯಾರಿಸಿ. ಕ್ಯಾಟಲಾಗ್ ಮಾಡಿ. ಮಾರಾಟ ಮಾಡಿ.",buyerTitle:"ಭಾರತೀಯ ಕರಕುಶಲ, ಸ್ಪಷ್ಟವಾಗಿ ಪ್ರಸ್ತುತಪಡಿಸಲಾಗಿದೆ.",helpTitle:"Kaarvi ಸಹಾಯಕ",forArtisans:"ಕುಶಲಕರ್ಮಿಗಳಿಗಾಗಿ",explore:"ಕರಕುಶಲ ವೀಕ್ಷಿಸಿ",generate:"ಕ್ಯಾಟಲಾಗ್ ರಚಿಸಿ",add:"ಕಾರ್ಟ್‌ಗೆ ಸೇರಿಸಿ"},
    ml: {home:"ഹോം",artisan:"കരകൗശല ഹബ്",buyers:"വാങ്ങുന്നവരുടെ ഹബ്",enhancer:"ചിത്ര മെച്ചപ്പെടുത്തൽ",help:"സഹായം",login:"ലോഗിൻ",logout:"ലോഗൗട്ട്",
      homeTitle:"ഇന്ത്യയിലെ കരകൗശല സമൂഹങ്ങളുടെ ഡിജിറ്റൽ ശാക്തീകരണം.",homeHero:"ഇന്ത്യൻ കരകൗശലത്തെ അവസരങ്ങളുമായി ബന്ധിപ്പിക്കുന്നു.",artisanTitle:"തയ്യാറാക്കുക. കാറ്റലോഗ് ചെയ്യുക. വിൽക്കുക.",buyerTitle:"ഇന്ത്യൻ കരകൗശലങ്ങൾ വ്യക്തമായി അവതരിപ്പിക്കുന്നു.",helpTitle:"Kaarvi സഹായി",forArtisans:"കരകൗശലക്കാർക്കായി",explore:"കരകൗശലങ്ങൾ കാണുക",generate:"കാറ്റലോഗ് സൃഷ്ടിക്കുക",add:"കാർട്ടിലേക്ക് ചേർക്കുക"},
    or: {home:"ହୋମ୍",artisan:"କାରିଗର ହବ୍",buyers:"କ୍ରେତା ହବ୍",enhancer:"ଚିତ୍ର ସୁଧାରକ",help:"ସହାୟତା",login:"ଲଗଇନ୍",logout:"ଲଗଆଉଟ୍",
      homeTitle:"ଭାରତର କାରିଗର ସମୁଦାୟଙ୍କ ଡିଜିଟାଲ ସଶକ୍ତିକରଣ।",homeHero:"ଭାରତୀୟ ହସ୍ତଶିଳ୍ପକୁ ସୁଯୋଗ ସହିତ ଯୋଡିବା।",artisanTitle:"ପ୍ରସ୍ତୁତ କରନ୍ତୁ। କ୍ୟାଟାଲଗ୍ କରନ୍ତୁ। ବିକ୍ରି କରନ୍ତୁ।",buyerTitle:"ଭାରତୀୟ ହସ୍ତଶିଳ୍ପ, ସ୍ପଷ୍ଟ ଭାବରେ ପ୍ରଦର୍ଶିତ।",helpTitle:"Kaarvi ସହାୟକ",forArtisans:"କାରିଗରଙ୍କ ପାଇଁ",explore:"ହସ୍ତଶିଳ୍ପ ଦେଖନ୍ତୁ",generate:"କ୍ୟାଟାଲଗ୍ ସୃଷ୍ଟି କରନ୍ତୁ",add:"କାର୍ଟରେ ଯୋଡନ୍ତୁ"},
    as: {home:"হোম",artisan:"কাৰিকৰ হাব",buyers:"ক্ৰেতা হাব",enhancer:"চিত্ৰ উন্নতকৰণ",help:"সহায়তা",login:"লগইন",logout:"লগআউট",
      homeTitle:"ভাৰতৰ কাৰিকৰ সম্প্ৰদায়ৰ ডিজিটেল সশক্তিকৰণ।",homeHero:"ভাৰতীয় হস্তশিল্পক সুযোগৰ সৈতে সংযোগ কৰা।",artisanTitle:"প্ৰস্তুত কৰক। কেটেলগ কৰক। বিক্ৰী কৰক।",buyerTitle:"ভাৰতীয় হস্তশিল্প, স্পষ্টভাৱে উপস্থাপন কৰা হৈছে।",helpTitle:"Kaarvi সহায়ক",forArtisans:"কাৰিকৰৰ বাবে",explore:"হস্তশিল্প চাওক",generate:"কেটেলগ সৃষ্টি কৰক",add:"কাৰ্টত যোগ কৰক"}
  });

  // ---------- Automatic language + location ----------
  // Kaarvi keeps a single location + language choice across every page.
  // Users can either use live device location or choose a state/UT manually.
  // The selected language is applied to the entire page with Google Translate.
  const LOCATION_LANGUAGE = {
    "andaman and nicobar islands":"hi", "andhra pradesh":"te", "arunachal pradesh":"hi",
    "assam":"as", "bihar":"hi", "chandigarh":"hi", "chhattisgarh":"hi", "dadra and nagar haveli and daman and diu":"hi",
    "delhi":"hi", "goa":"hi", "gujarat":"gu", "haryana":"hi", "himachal pradesh":"hi", "jammu and kashmir":"hi",
    "jharkhand":"hi", "karnataka":"kn", "kerala":"ml", "ladakh":"hi", "lakshadweep":"ml", "madhya pradesh":"hi",
    "maharashtra":"mr", "manipur":"hi", "meghalaya":"as", "mizoram":"hi", "nagaland":"hi", "odisha":"or",
    "puducherry":"ta", "punjab":"pa", "rajasthan":"hi", "sikkim":"hi", "tamil nadu":"ta", "telangana":"te",
    "tripura":"bn", "uttar pradesh":"hi", "uttarakhand":"hi", "west bengal":"bn"
  };
  const LOCATION_OPTIONS = [
    ["Punjab","pa"],["Haryana","hi"],["Delhi","hi"],["Uttar Pradesh","hi"],["Uttarakhand","hi"],["Himachal Pradesh","hi"],
    ["Rajasthan","hi"],["Madhya Pradesh","hi"],["Bihar","hi"],["Jharkhand","hi"],["Chhattisgarh","hi"],["Goa","hi"],
    ["Maharashtra","mr"],["Gujarat","gu"],["Odisha","or"],["Assam","as"],["West Bengal","bn"],["Tripura","bn"],
    ["Tamil Nadu","ta"],["Puducherry","ta"],["Telangana","te"],["Andhra Pradesh","te"],["Karnataka","kn"],["Kerala","ml"],
    ["Chandigarh","hi"],["Jammu and Kashmir","hi"],["Ladakh","hi"],["Sikkim","hi"],["Manipur","hi"],["Meghalaya","as"],
    ["Mizoram","hi"],["Nagaland","hi"],["Arunachal Pradesh","hi"],["Andaman and Nicobar Islands","hi"],
    ["Lakshadweep","ml"],["Dadra and Nagar Haveli and Daman and Diu","hi"]
  ];
  const LOCATION_UI = {
    en:{location:"Location",change:"Change location",live:"Use live location",manual:"Choose location manually",title:"Choose your location",hint:"Your location controls the default language across the whole Kaarvi website.",state:"Select state / UT",save:"Save location",cancel:"Cancel",current:"Current location"},
    hi:{location:"स्थान",change:"स्थान बदलें",live:"लाइव लोकेशन इस्तेमाल करें",manual:"स्थान खुद चुनें",title:"अपना स्थान चुनें",hint:"आपका स्थान पूरी Kaarvi वेबसाइट की डिफ़ॉल्ट भाषा तय करेगा।",state:"राज्य / केंद्र शासित प्रदेश चुनें",save:"स्थान सेव करें",cancel:"रद्द करें",current:"वर्तमान स्थान"},
    pa:{location:"ਟਿਕਾਣਾ",change:"ਟਿਕਾਣਾ ਬਦਲੋ",live:"ਲਾਈਵ ਟਿਕਾਣਾ ਵਰਤੋ",manual:"ਟਿਕਾਣਾ ਖੁਦ ਚੁਣੋ",title:"ਆਪਣਾ ਟਿਕਾਣਾ ਚੁਣੋ",hint:"ਤੁਹਾਡਾ ਟਿਕਾਣਾ ਪੂਰੀ Kaarvi ਵੈੱਬਸਾਈਟ ਦੀ ਡਿਫ਼ਾਲਟ ਭਾਸ਼ਾ ਤੈਅ ਕਰੇਗਾ।",state:"ਰਾਜ / ਕੇਂਦਰ ਸ਼ਾਸਿਤ ਪ੍ਰਦੇਸ਼ ਚੁਣੋ",save:"ਟਿਕਾਣਾ ਸੇਵ ਕਰੋ",cancel:"ਰੱਦ ਕਰੋ",current:"ਮੌਜੂਦਾ ਟਿਕਾਣਾ"},
    bn:{location:"অবস্থান",change:"অবস্থান বদলান",live:"লাইভ অবস্থান ব্যবহার করুন",manual:"অবস্থান নিজে বেছে নিন",title:"আপনার অবস্থান বেছে নিন",hint:"আপনার অবস্থান পুরো Kaarvi ওয়েবসাইটের ডিফল্ট ভাষা ঠিক করবে।",state:"রাজ্য / কেন্দ্রশাসিত অঞ্চল বেছে নিন",save:"অবস্থান সেভ করুন",cancel:"বাতিল",current:"বর্তমান অবস্থান"},
    mr:{location:"स्थान",change:"स्थान बदला",live:"लाइव्ह लोकेशन वापरा",manual:"स्थान स्वतः निवडा",title:"तुमचे स्थान निवडा",hint:"तुमचे स्थान संपूर्ण Kaarvi वेबसाइटची डीफॉल्ट भाषा ठरवेल.",state:"राज्य / केंद्रशासित प्रदेश निवडा",save:"स्थान सेव्ह करा",cancel:"रद्द करा",current:"सध्याचे स्थान"},
    gu:{location:"સ્થાન",change:"સ્થાન બદલો",live:"લાઇવ લોકેશન વાપરો",manual:"સ્થાન જાતે પસંદ કરો",title:"તમારું સ્થાન પસંદ કરો",hint:"તમારું સ્થાન સમગ્ર Kaarvi વેબસાઇટની ડિફૉલ્ટ ભાષા નક્કી કરશે.",state:"રાજ્ય / કેન્દ્રશાસિત પ્રદેશ પસંદ કરો",save:"સ્થાન સાચવો",cancel:"રદ કરો",current:"વર્તમાન સ્થાન"},
    ta:{location:"இடம்",change:"இடத்தை மாற்று",live:"நேரடி இருப்பிடத்தைப் பயன்படுத்து",manual:"இடத்தை கைமுறையாகத் தேர்வு செய்",title:"உங்கள் இடத்தைத் தேர்வு செய்க",hint:"உங்கள் இடம் முழு Kaarvi இணையதளத்தின் இயல்பு மொழியைத் தீர்மானிக்கும்.",state:"மாநிலம் / யூனியன் பிரதேசத்தைத் தேர்வு செய்க",save:"இடத்தை சேமி",cancel:"ரத்து செய்",current:"தற்போதைய இடம்"},
    te:{location:"స్థానం",change:"స్థానం మార్చండి",live:"లైవ్ లొకేషన్ ఉపయోగించండి",manual:"స్థానాన్ని మాన్యువల్‌గా ఎంచుకోండి",title:"మీ స్థానాన్ని ఎంచుకోండి",hint:"మీ స్థానం మొత్తం Kaarvi వెబ్‌సైట్ డిఫాల్ట్ భాషను నిర్ణయిస్తుంది.",state:"రాష్ట్రం / కేంద్ర పాలిత ప్రాంతాన్ని ఎంచుకోండి",save:"స్థానాన్ని సేవ్ చేయండి",cancel:"రద్దు",current:"ప్రస్తుత స్థానం"},
    kn:{location:"ಸ್ಥಳ",change:"ಸ್ಥಳ ಬದಲಿಸಿ",live:"ಲೈವ್ ಸ್ಥಳ ಬಳಸಿ",manual:"ಸ್ಥಳವನ್ನು ಕೈಯಾರೆ ಆಯ್ಕೆಮಾಡಿ",title:"ನಿಮ್ಮ ಸ್ಥಳವನ್ನು ಆಯ್ಕೆಮಾಡಿ",hint:"ನಿಮ್ಮ ಸ್ಥಳವು ಸಂಪೂರ್ಣ Kaarvi ವೆಬ್‌ಸೈಟ್‌ನ ಡೀಫಾಲ್ಟ್ ಭಾಷೆಯನ್ನು ನಿರ್ಧರಿಸುತ್ತದೆ.",state:"ರಾಜ್ಯ / ಕೇಂದ್ರಾಡಳಿತ ಪ್ರದೇಶ ಆಯ್ಕೆಮಾಡಿ",save:"ಸ್ಥಳ ಉಳಿಸಿ",cancel:"ರದ್ದು",current:"ಪ್ರಸ್ತುತ ಸ್ಥಳ"},
    ml:{location:"സ്ഥലം",change:"സ്ഥലം മാറ്റുക",live:"ലൈവ് ലൊക്കേഷൻ ഉപയോഗിക്കുക",manual:"സ്ഥലം സ്വയം തിരഞ്ഞെടുക്കുക",title:"നിങ്ങളുടെ സ്ഥലം തിരഞ്ഞെടുക്കുക",hint:"നിങ്ങളുടെ സ്ഥലം മുഴുവൻ Kaarvi വെബ്‌സൈറ്റിന്റെ ഡിഫോൾട്ട് ഭാഷ നിശ്ചയിക്കും.",state:"സംസ്ഥാനം / കേന്ദ്രഭരണ പ്രദേശം തിരഞ്ഞെടുക്കുക",save:"സ്ഥലം സേവ് ചെയ്യുക",cancel:"റദ്ദാക്കുക",current:"നിലവിലെ സ്ഥലം"},
    or:{location:"ସ୍ଥାନ",change:"ସ୍ଥାନ ବଦଳାନ୍ତୁ",live:"ଲାଇଭ୍ ଲୋକେସନ ବ୍ୟବହାର କରନ୍ତୁ",manual:"ସ୍ଥାନ ନିଜେ ବାଛନ୍ତୁ",title:"ଆପଣଙ୍କ ସ୍ଥାନ ବାଛନ୍ତୁ",hint:"ଆପଣଙ୍କ ସ୍ଥାନ ସମଗ୍ର Kaarvi ୱେବସାଇଟର ଡିଫଲ୍ଟ ଭାଷା ନିର୍ଦ୍ଧାରଣ କରିବ।",state:"ରାଜ୍ୟ / କେନ୍ଦ୍ରଶାସିତ ଅଞ୍ଚଳ ବାଛନ୍ତୁ",save:"ସ୍ଥାନ ସେଭ୍ କରନ୍ତୁ",cancel:"ବାତିଲ୍",current:"ବର୍ତ୍ତମାନ ସ୍ଥାନ"},
    as:{location:"স্থান",change:"স্থান সলনি কৰক",live:"লাইভ লোকেচন ব্যৱহাৰ কৰক",manual:"স্থান নিজে বাছক",title:"আপোনাৰ স্থান বাছক",hint:"আপোনাৰ স্থানে সমগ্ৰ Kaarvi ৱেবছাইটৰ ডিফল্ট ভাষা নিৰ্ধাৰণ কৰিব।",state:"ৰাজ্য / কেন্দ্ৰীয় শাসিত অঞ্চল বাছক",save:"স্থান সংৰক্ষণ কৰক",cancel:"বাতিল",current:"বৰ্তমান স্থান"}
  };
  const SUPPORTED_LANGS = new Set(Object.keys(T));
  function browserLanguage() {
    const list=navigator.languages || [navigator.language || "en"];
    for(const raw of list){const code=String(raw).toLowerCase().split("-")[0];if(SUPPORTED_LANGS.has(code))return code;}
    return "en";
  }
  async function languageFromLocation(lat,lon){
    try{
      const r=await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}&localityLanguage=en`,{cache:"no-store"});
      if(r.ok){
        const d=await r.json();
        const state=String(d.principalSubdivision||"").toLowerCase();
        for(const key of Object.keys(LOCATION_LANGUAGE)) if(state.includes(key)) return {language:LOCATION_LANGUAGE[key],state:d.principalSubdivision||"India"};
      }
    }catch(_){ }
    return {language:"hi",state:"India"};
  }
  function ensureTranslateUI(){
    if(document.getElementById("google_translate_element")) return;
    const box=document.createElement("div"); box.id="google_translate_element"; box.setAttribute("aria-hidden","true");
    box.style.cssText="position:fixed;left:-10000px;top:-10000px;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none";
    document.body.appendChild(box);
    if(!document.getElementById("kaarvi-translate-style")){
      const st=document.createElement("style"); st.id="kaarvi-translate-style";
      st.textContent=`.goog-te-banner-frame,.goog-te-balloon-frame,.goog-tooltip,.goog-text-highlight{display:none!important}body{top:0!important}.skiptranslate{font-size:0!important}.skiptranslate iframe{display:none!important}`;
      document.head.appendChild(st);
    }
    window.googleTranslateElementInit=function(){
      if(window.google?.translate?.TranslateElement){
        new google.translate.TranslateElement({pageLanguage:"en",includedLanguages:"hi,pa,bn,mr,gu,ta,te,kn,ml,or,as",autoDisplay:false},"google_translate_element");
        setTimeout(()=>applyGoogleTranslation(localStorage.getItem("kaarvi_lang")||"en"),350);
      }
    };
    const script=document.createElement("script"); script.src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"; script.async=true; document.head.appendChild(script);
  }
  function applyGoogleTranslation(lang){
    const combo=document.querySelector(".goog-te-combo"); if(!combo)return false;
    combo.value=lang; combo.dispatchEvent(new Event("change")); return true;
  }
  function uiText(lang,key){return (LOCATION_UI[lang]||LOCATION_UI.en)[key];}
  function locationLabel(){return localStorage.getItem("kaarvi_location_state")||"";}
  function updateLocationButton(){
    const b=$("#kaarviLocationButton"); if(!b)return;
    const lang=localStorage.getItem("kaarvi_lang")||"en", state=locationLabel();
    b.textContent=`📍 ${state||uiText(lang,"location")}`;
    b.title=uiText(lang,"change");
  }
  function setLanguage(lang){
    lang=SUPPORTED_LANGS.has(lang)?lang:"en";
    localStorage.setItem("kaarvi_lang",lang); localStorage.setItem("kaarvi_chat_lang",lang);
    document.documentElement.lang=lang; $$('[data-lang]').forEach(s=>s.value=lang);
    const t=T[lang]||T.en, loginBtn=$(".k-login-btn");
    if(loginBtn){const u=currentUser();loginBtn.textContent=u?.name?`Hi, ${u.name.split(" ")[0]}`:t.login;}
    $$('[data-add-cart]').forEach(b=>b.textContent=t.add);
    updateLocationButton(); ensureTranslateUI();
    if(!applyGoogleTranslation(lang)) setTimeout(()=>applyGoogleTranslation(lang),800);
    // Give Google Translate a second pass for JS-created catalogue/cart content.
    setTimeout(()=>applyGoogleTranslation(lang),1200);
  }
  function saveLocation(state,lang){
    localStorage.setItem("kaarvi_location_state",state); localStorage.setItem("kaarvi_lang",lang);
    localStorage.setItem("kaarvi_location_set","1"); setLanguage(lang); closeLocationModal();
    toast(`${state} selected`);
  }
  function closeLocationModal(){document.getElementById("kaarviLocationModal")?.remove();}
  function openLocationModal(){
    closeLocationModal();
    const lang=localStorage.getItem("kaarvi_lang")||"en";
    const modal=document.createElement("div"); modal.id="kaarviLocationModal";
    const opts=LOCATION_OPTIONS.map(([name,code])=>`<option value="${code}" data-state="${name}">${name}</option>`).join("");
    modal.innerHTML=`<div class="k-location-backdrop"></div><div class="k-location-panel" role="dialog" aria-modal="true" aria-labelledby="kLocationTitle">
      <button type="button" class="k-location-close" aria-label="${uiText(lang,"cancel")}">×</button>
      <div class="section-kicker">📍 ${uiText(lang,"location")}</div><h2 id="kLocationTitle">${uiText(lang,"title")}</h2>
      <p>${uiText(lang,"hint")}</p>
      <button type="button" class="btn btn-green" id="kUseLive">📡 ${uiText(lang,"live")}</button>
      <div class="k-location-divider"><span>OR</span></div>
      <label>${uiText(lang,"state")}<select id="kManualState"><option value="">${uiText(lang,"state")}</option>${opts}</select></label>
      <button type="button" class="btn btn-primary" id="kSaveManual">${uiText(lang,"save")}</button>
      <small id="kLocationStatus" aria-live="polite"></small>
    </div>`;
    document.body.appendChild(modal);
    const st=document.createElement("style"); st.id="kaarvi-location-style";
    st.textContent=`#kaarviLocationModal{position:fixed;inset:0;z-index:10060;display:grid;place-items:center;padding:18px}.k-location-backdrop{position:absolute;inset:0;background:#06101dcc}.k-location-panel{position:relative;width:min(560px,100%);background:#fff;border:1px solid #d8e0ea;border-radius:20px;padding:24px;box-shadow:0 25px 80px #0006;display:grid;gap:12px;color:#172033;font-family:Inter,system-ui,sans-serif}.k-location-panel h2{margin:0;font-family:Fraunces,serif}.k-location-panel p{margin:0;color:#536174;line-height:1.5}.k-location-panel label{display:grid;gap:6px;font-weight:700}.k-location-panel select{padding:12px;border:1px solid #cbd5e1;border-radius:10px;font:inherit}.k-location-close{position:absolute;right:14px;top:10px;border:0;background:transparent;font-size:28px;cursor:pointer}.k-location-divider{display:flex;align-items:center;gap:10px;color:#7b8798}.k-location-divider:before,.k-location-divider:after{content:"";height:1px;background:#dce2e9;flex:1}.k-location-divider span{font-size:12px;font-weight:800}.k-location-panel small{min-height:18px;color:#b42318}`;
    document.head.appendChild(st);
    $(".k-location-close",modal).onclick=closeLocationModal; $(".k-location-backdrop",modal).onclick=closeLocationModal;
    $("#kSaveManual",modal).onclick=()=>{const s=$("#kManualState",modal),o=s.options[s.selectedIndex];if(!s.value){$("#kLocationStatus",modal).textContent=uiText(lang,"state");return;}saveLocation(o.dataset.state,s.value);};
    $("#kUseLive",modal).onclick=()=>{
      const status=$("#kLocationStatus",modal);
      if(!navigator.geolocation){status.textContent="Live location is not supported by this browser. Choose a state manually.";return;}
      status.textContent="Requesting location permission…";
      navigator.geolocation.getCurrentPosition(async pos=>{
        status.textContent="Detecting your state…";
        const result=await languageFromLocation(pos.coords.latitude,pos.coords.longitude);
        saveLocation(result.state,result.language);
      },err=>{status.textContent=err.code===1?"Location permission was denied. Choose your state manually.":"Could not detect location. Choose your state manually.";},{enableHighAccuracy:true,timeout:12000,maximumAge:300000});
    };
  }
  function ensureLocationControl(){
    if($("#kaarviLocationButton"))return;
    const nav=$(".header .nav");
    if(!document.getElementById("kaarvi-location-button-style")){
      const st=document.createElement("style"); st.id="kaarvi-location-button-style";
      st.textContent=`.location-btn{border:1px solid #cbd5e1;background:#fff;color:#172033;border-radius:999px;padding:8px 12px;font:700 12px Inter,system-ui,sans-serif;cursor:pointer;white-space:nowrap}.location-btn:hover{transform:translateY(-1px)}.k-location-floating{position:fixed;right:16px;bottom:16px;z-index:10040;box-shadow:0 8px 25px #0002}`;
      document.head.appendChild(st);
    }
    if(nav){
      const b=document.createElement("button"); b.type="button"; b.id="kaarviLocationButton"; b.className="location-btn"; b.onclick=openLocationModal; nav.insertBefore(b,$(".lang",nav)||null);
    } else {
      const b=document.createElement("button"); b.type="button"; b.id="kaarviLocationButton"; b.className="location-btn k-location-floating"; b.onclick=openLocationModal; document.body.appendChild(b);
    }
    updateLocationButton();
  }
  function requestInitialLocation(){
    ensureLocationControl();
    if(localStorage.getItem("kaarvi_location_set")==="1")return;
    // First visit gets an explicit choice: live location or manual state.
    setTimeout(openLocationModal,250);
  }
  function detectKaarviLanguage(){
    const saved=localStorage.getItem("kaarvi_lang");
    const state=localStorage.getItem("kaarvi_location_state");
    if(saved&&SUPPORTED_LANGS.has(saved))return {lang:saved,state:state||""};
    return {lang:browserLanguage(),state:state||""};
  }

  // ---------- Product catalogue ----------
  function renderProducts(list) {
    const grid=$("#productGrid"); if(!grid) return;
    grid.innerHTML = list.length ? list.map(p => `<article class="product">
      <div class="product-image"><img src="${p.image}" alt="${escapeHtml(p.alt||p.name)}" loading="lazy" referrerpolicy="no-referrer"><span>${escapeHtml(p.region)}</span></div>
      <div class="product-body"><div class="tag">${escapeHtml(p.category)}</div><h3>${escapeHtml(p.name)}</h3>
      <div class="product-meta"><span>${escapeHtml(p.region)}</span><strong class="price">₹${Number(p.price).toLocaleString("en-IN")}</strong></div>
      <div class="product-actions"><button class="btn btn-green" data-add-cart="${p.id}">${T[localStorage.getItem("kaarvi_lang")||"en"].add}</button><button class="btn btn-outline" data-quick-view="${p.id}">Details</button></div></div></article>`).join("") :
      `<div class="empty-state"><strong>No products found.</strong><br>Try another search or category.</div>`;
  }
  function initBuyers() {
    if(!$("#productGrid")) return;
    let active="all"; const search=$("#productSearch");
    const apply=()=>{const q=(search?.value||"").trim().toLowerCase();renderProducts(products.filter(p=>(active==="all"||p.category===active)&&[p.name,p.category,p.region].join(" ").toLowerCase().includes(q)));};
    $$(".filter").forEach(btn=>btn.addEventListener("click",()=>{$$(".filter").forEach(b=>b.classList.remove("active"));btn.classList.add("active");active=btn.dataset.filter||"all";apply();}));
    search?.addEventListener("input",apply);
    $("#productGrid").addEventListener("click",e=>{const a=e.target.closest("[data-add-cart]");if(a)return addToCart(a.dataset.addCart);const d=e.target.closest("[data-quick-view]");if(d){const p=products.find(x=>String(x.id)===d.dataset.quickView);if(p)alert(`${p.name}\n${p.category} • ${p.region}\n₹${Number(p.price).toLocaleString("en-IN")}`);}});
    apply();
  }

  // ---------- Dynamic pricing ----------
  function calculatePrice() {
    const material=Number($("#materialCost")?.value)||0, making=Number($("#makingCost")?.value)||0;
    const demand=Number($("#demandScore")?.value)||50, uniqueness=Number($("#uniquenessScore")?.value)||50;
    const season=Number($("#seasonScore")?.value)||50, qty=Number($("#batchQty")?.value)||1;
    const overhead=(material+making)*0.12;
    const base=material+making+overhead;
    const multiplier=1 + ((demand-50)*0.006) + ((uniqueness-50)*0.004) + ((season-50)*0.002);
    const unit=Math.max(base*0.95, base*multiplier);
    const low=Math.round(unit*0.95/10)*10, high=Math.round(unit*1.12/10)*10;
    const bulk=qty>=20?0.96:qty>=10?0.98:1;
    const finalLow=Math.round(low*bulk/10)*10, finalHigh=Math.round(high*bulk/10)*10;
    if($("#priceResult")) $("#priceResult").innerHTML=`<strong>Suggested range: ₹${finalLow.toLocaleString("en-IN")} – ₹${finalHigh.toLocaleString("en-IN")}</strong><span>Estimated cost ₹${Math.round(base).toLocaleString("en-IN")} • Demand ${demand}/100 • Uniqueness ${uniqueness}/100 • Season ${season}/100 • Batch ${qty}</span>`;
  }
  function initPricing() {
    if(!$("#pricingCalculator")) return;
    $$("#pricingCalculator input").forEach(i=>i.addEventListener("input",()=>{const out=$("#"+i.id+"Value");if(out)out.textContent=i.value;calculatePrice();}));
    $("#calculatePrice")?.addEventListener("click",calculatePrice); calculatePrice();
  }

  // ---------- Catalogue generator ----------
  function initArtisan() {
    $("#generateCatalog")?.addEventListener("click",async()=>{
      const name=$("#catalogName")?.value.trim()||"Handcrafted Indian Craft";
      const material=$("#catalogMaterial")?.value.trim()||"traditional handmade craft";
      const region=$("#catalogRegion")?.value.trim()||"India";
      const features=$("#catalogFeatures")?.value.trim()||"carefully made with distinctive detailing";
      const lang=$("#catalogLanguage")?.value||"en";
      const prefixes={en:"Handcrafted",hi:"हस्तनिर्मित",bn:"হস্তনির্মিত",ta:"கைவினை",te:"చేతిపని",mr:"हस्तनिर्मित"};
      const prefix=prefixes[lang]||"Handcrafted";
      $("#catalogOutTitle").textContent=`${prefix} ${name}`;
      $("#catalogOutDesc").textContent=`${name} is a ${material} creation from ${region}, featuring ${features}. Made for buyers who value authentic Indian craft and handmade character.`;
      $("#catalogOutSeo").textContent=`${name} | ${material} | ${region} | Kaarvi`;
      $("#catalogOutput")?.classList.add("show");
    });
    $$("form[data-demo]").forEach(f=>f.addEventListener("submit",e=>{e.preventDefault();toast("Product saved in prototype mode");}));
  }

  function escapeHtml(value){return String(value).replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));}

  // ---------- MongoDB-backed checkout & reviews ----------
  async function postJson(url, payload) {
    const r = await fetch(url, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload) });
    const data = await r.json().catch(()=>({}));
    if (!r.ok) throw new Error(data.error || "Request failed.");
    return data;
  }

  async function demoSubmit(event, message) {
    event.preventDefault();
    const form = event.currentTarget || event.target;
    if (!form.reportValidity()) return false;
    const user = currentUser();
    try {
      if (form.id === "orderForm") {
        const name = $("#orderName")?.value.trim() || "";
        const phone = $("#orderPhone")?.value.trim() || "";
        const address = $("#orderAddress")?.value.trim() || "";
        const city = $("#orderCity")?.value.trim() || "";
        const pin = $("#orderPin")?.value.trim() || "";
        const paymentMethod = form.querySelector('input[name="pay"]:checked')?.parentElement?.textContent?.toLowerCase().includes("online") ? "online" : "cod";
        const data = await postJson("/api/orders", { user, items:getCart(), shipping:{name,phone,address,city,pin}, paymentMethod });
        saveCart([]);
        alert(data.orderId ? `Order request saved. Order ID: ${data.orderId}` : message);
        form.reset();
        updateCartCount();
      } else if (form.id === "reviewForm") {
        const selects = form.querySelectorAll("select");
        const product = selects[0]?.value || "";
        const rating = Number((selects[1]?.value || "").charAt(0));
        const review = form.querySelector("textarea")?.value.trim() || "";
        const data = await postJson("/api/reviews", { user, product, rating, review });
        alert(data.reviewId ? "Thank you — your review was saved." : message);
        form.reset();
      } else {
        alert(message);
      }
    } catch (err) {
      if (String(err.message).toLowerCase().includes("mongodb is not connected")) {
        alert(message + "\n\nDemo mode: MongoDB is not configured yet, so nothing was saved to the database.");
      } else {
        alert(err.message || message);
      }
    }
    return false;
  }
  window.demoSubmit = demoSubmit;


  function registerServiceWorker(){if("serviceWorker" in navigator)navigator.serviceWorker.register("sw.js").catch(()=>{});}

  // ---------- Artisan / Buyer role ----------
  function getRole(){try{return localStorage.getItem("kaarvi_role");}catch{return null;}}
  function isStandalone(){
    return window.matchMedia && window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  }
  function roleLabel(role){return role==="artisan"?"Artisan":role==="buyer"?"Buyer":null;}
  function roleHub(role){return role==="artisan"?"artisan-hub.html":role==="buyer"?"buyers-hub.html":"index.html";}

  function initRole(){
    const page=(location.pathname.split("/").pop()||"index.html");
    if(page==="welcome.html"||page==="login.html") return;

    // If launched as an installed app with no role chosen yet, ask first.
    if(isStandalone() && !getRole()){
      window.location.replace("login.html");
      return;
    }

    const role=getRole();
    if(!role || role==="guest") return;

    // Small role badge in the header, so people can switch anytime.
    const nav=$(".header .nav");
    if(nav && !$(".role-badge", nav)){
      const badge=document.createElement("a");
      badge.className="role-badge";
      badge.href="login.html?switch=1";
      badge.innerHTML=(role==="artisan"?"🧵 ":"🛍️ ")+roleLabel(role);
      const langSelect=$(".lang", nav);
      if(langSelect) nav.insertBefore(badge, langSelect); else nav.appendChild(badge);
    }

    // Welcome-back banner on the homepage pointing straight to their hub.
    if(page==="index.html" || page===""){
      const header=$(".header");
      if(header && !$(".role-banner")){
        const banner=document.createElement("div");
        banner.className="role-banner";
        banner.innerHTML=`<div class="container"><span>👋 Welcome back — continuing as <strong>${roleLabel(role)}</strong></span><a class="btn btn-outline" href="${roleHub(role)}">Go to your Hub</a><button type="button" class="role-banner-close" aria-label="Dismiss">×</button></div>`;
        header.insertAdjacentElement("afterend", banner);
        $(".role-banner-close", banner)?.addEventListener("click",()=>banner.remove());
      }
    }
  }

  document.addEventListener("DOMContentLoaded",()=>{
    injectLoginButton();
    const detected=detectKaarviLanguage();
    $$("[data-lang]").forEach(s=>s.addEventListener("change",()=>setLanguage(s.value)));
    setLanguage(detected.lang);
    requestInitialLocation();
    $$("[data-open-cart]").forEach(b=>b.addEventListener("click",openCart));
    updateCartCount(); initBuyers(); initArtisan(); initPricing(); initRole(); registerServiceWorker();
  });
})();
