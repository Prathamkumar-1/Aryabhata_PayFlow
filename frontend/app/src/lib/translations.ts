// ============================================================================
// translations.ts -- Flat English/Hindi UI string dictionary
// ============================================================================
// Organized by surface (landing, nav, actions, common). Banking acronyms
// (UPI, EFRMS, FIU, STR, CTR, RBI, AML, KYC, CFR, MFA, IOC, SOC, MLRO) are
// intentionally kept as-is in the Hindi column -- this matches how Indian
// banking staff actually read and write these terms (Hinglish banking style).
// ============================================================================

export type TranslationEntry = { en: string; hi: string }

// Keys are grouped by dotted namespace for readability. The `t()` lookup is a
// flat Record lookup, so namespacing is purely organizational.
export const UI_STRINGS = {
  // ── Landing page: utility strip ────────────────────────────────────────
  'landing.skipToMain': { en: 'Skip to main content', hi: 'मुख्य सामग्री पर जाएँ' },
  'landing.screenReader': { en: 'Screen reader', hi: 'स्क्रीन रीडर' },
  'landing.contactUs': { en: 'Contact Us', hi: 'संपर्क करें' },
  'landing.portal': { en: 'PayFlow Portal', hi: 'PayFlow पोर्टल' },
  'landing.rbacApi': { en: 'RBAC API', hi: 'RBAC API' },
  'landing.langEnglish': { en: 'English', hi: 'English' },
  'landing.langHindi': { en: 'हिंदी', hi: 'हिंदी' },

  // ── Landing page: header ───────────────────────────────────────────────
  'landing.govtUndertaking': {
    en: 'A Government of India Undertaking | PayFlow Fraud Intelligence',
    hi: 'भारत सरकार का उपक्रम | PayFlow फ्रॉड इंटेलिजेंस',
  },
  'landing.searchPlaceholder': { en: 'Looking for something specific?', hi: 'कुछ खास खोज रहे हैं?' },
  'landing.loginCta': { en: 'Internet Banking Style Login', hi: 'इंटरनेट बैंकिंग लॉगिन' },

  // ── Landing page: service nav bar ──────────────────────────────────────
  'landing.service.efrms': { en: 'EFRMS Monitoring', hi: 'EFRMS निगरानी' },
  'landing.service.cyberCell': { en: 'Cyber Cell', hi: 'साइबर सेल' },
  'landing.service.branch': { en: 'Branch Review', hi: 'शाखा समीक्षा' },
  'landing.service.fiu': { en: 'FIU Reporting', hi: 'FIU रिपोर्टिंग' },
  'landing.service.cfr': { en: 'CFR Registry', hi: 'CFR रजिस्ट्री' },
  'landing.service.digital': { en: 'Digital Banking', hi: 'डिजिटल बैंकिंग' },
  'landing.service.rbi': { en: 'RBI Returns', hi: 'RBI रिटर्न' },
  'landing.service.caseEvidence': { en: 'Case Evidence', hi: 'केस साक्ष्य' },

  // ── Landing page: online services sidebar ──────────────────────────────
  'landing.onlineServices': { en: 'Online Services', hi: 'ऑनलाइन सेवाएँ' },
  'landing.openService': { en: 'Open Service', hi: 'सेवा खोलें' },
  'landing.online.socQueue.label': { en: 'SOC Queue', hi: 'SOC कतार' },
  'landing.online.socQueue.body': {
    en: 'Live EFRMS alerts, device risk, velocity bursts',
    hi: 'लाइव EFRMS अलर्ट, डिवाइस जोखिम, वेग वृद्धि',
  },
  'landing.online.cyberIr.label': { en: 'Cyber IR', hi: 'साइबर IR' },
  'landing.online.cyberIr.body': {
    en: 'Phishing, malware, endpoint containment',
    hi: 'फ़िशिंग, मालवेयर, एंडपॉइंट नियंत्रण',
  },
  'landing.online.fundFlowCase.label': { en: 'Fund-Flow Case', hi: 'फंड-फ़्लो केस' },
  'landing.online.fundFlowCase.body': {
    en: 'Mule chain, layering, round-tripping drill',
    hi: 'म्यूल चेन, लेयरिंग, राउंड-ट्रिपिंग अभ्यास',
  },
  'landing.online.paymentsDesk.label': { en: 'Payments Desk', hi: 'भुगतान डेस्क' },
  'landing.online.paymentsDesk.body': {
    en: 'Hold, hotlist, beneficiary, customer exposure',
    hi: 'होल्ड, हॉटलिस्ट, लाभार्थी, ग्राहक जोखिम',
  },
  'landing.online.efrmsRules.label': { en: 'EFRMS Rules', hi: 'EFRMS नियम' },
  'landing.online.efrmsRules.body': {
    en: 'Scenario tuning, threshold drift, false positives',
    hi: 'परिदृश्य ट्यूनिंग, थ्रेशोल्ड बदलाव, फ़ॉल्स पॉजिटिव',
  },
  'landing.online.amlMule.label': { en: 'AML Mule Network', hi: 'AML म्यूल नेटवर्क' },
  'landing.online.amlMule.body': {
    en: 'CDD, structuring, STR draft and watchlists',
    hi: 'CDD, स्ट्रक्चरिंग, STR प्रारूप और वॉचलिस्ट',
  },
  'landing.online.fiuPackage.label': { en: 'FIU Package', hi: 'FIU पैकेज' },
  'landing.online.fiuPackage.body': {
    en: 'STR/CTR/FMR evidence and audit hashes',
    hi: 'STR/CTR/FMR साक्ष्य और ऑडिट हैश',
  },
  'landing.online.committeeGate.label': { en: 'Committee Gate', hi: 'समिति गेट' },
  'landing.online.committeeGate.body': {
    en: 'Freeze, countermeasure and policy approvals',
    hi: 'फ़्रीज़, प्रति-उपाय और नीति अनुमोदन',
  },

  // ── Landing page: hero ─────────────────────────────────────────────────
  'landing.commandPortal': { en: 'Fraud Operations Command Portal', hi: 'फ्रॉड ऑपरेशन कमांड पोर्टल' },
  'landing.heroHeadline': {
    en: 'PayFlow for Union Bank fraud, cyber, FIU and branch teams.',
    hi: 'Union Bank के फ्रॉड, साइबर, FIU और शाखा टीमों के लिए PayFlow।',
  },
  'landing.heroSubtitle': {
    en: 'A Union Bank-style operations entry point for EFRMS, SOC, digital payments, AML, FIU reporting, fraud investigation, model governance, risk oversight and audit control review.',
    hi: 'EFRMS, SOC, डिजिटल भुगतान, AML, FIU रिपोर्टिंग, फ्रॉड जाँच, मॉडल अनुशासन, जोखिम निरीक्षण और ऑडिट नियंत्रण समीक्षा के लिए Union Bank-शैली का ऑपरेशन प्रवेश बिंदु।',
  },

  // ── Landing page: stage tiles ──────────────────────────────────────────
  'landing.stage.efrms.title': { en: 'EFRMS + SOC', hi: 'EFRMS + SOC' },
  'landing.stage.efrms.body': { en: 'Alerts, devices, sessions, IOCs', hi: 'अलर्ट, डिवाइस, सत्र, IOC' },
  'landing.stage.frm.title': { en: 'FRM + Payments', hi: 'FRM + भुगतान' },
  'landing.stage.frm.body': { en: 'Cases, holds, hotlists, graph review', hi: 'केस, होल्ड, हॉटलिस्ट, ग्राफ़ समीक्षा' },
  'landing.stage.aml.title': { en: 'AML + FIU', hi: 'AML + FIU' },
  'landing.stage.aml.body': { en: 'CDD, STR, CTR, FMR, CFR, DAKSH', hi: 'CDD, STR, CTR, FMR, CFR, DAKSH' },
  'landing.stage.audit.title': { en: 'Audit + Risk', hi: 'ऑडिट + जोखिम' },
  'landing.stage.audit.body': { en: 'Evidence hash, approvals, model feedback', hi: 'साक्ष्य हैश, अनुमोदन, मॉडल प्रतिक्रिया' },

  // ── Landing page: hero controls + selected role sidebar ────────────────
  'landing.control.roleHeader': { en: 'role header', hi: 'रोल हेडर' },
  'landing.control.tabs': { en: 'tabs available', hi: 'टैब उपलब्ध' },
  'landing.control.actions': { en: 'actions enabled', hi: 'क्रियाएँ सक्षम' },
  'landing.selectedRole': { en: 'Selected Role', hi: 'चयनित रोल' },
  'landing.infoMetric.domain': { en: 'Domain', hi: 'डोमेन' },
  'landing.infoMetric.tabs': { en: 'Tabs Open', hi: 'खुले टैब' },
  'landing.infoMetric.actions': { en: 'Write Actions', hi: 'राइट क्रियाएँ' },
  'landing.infoMetric.shift': { en: 'Shift / Queue', hi: 'शिफ़्ट / कतार' },
  'landing.infoMetric.reportsTo': { en: 'Reports To', hi: 'रिपोर्ट' },
  'landing.toolStack': { en: 'tool stack', hi: 'टूल स्टैक' },

  // ── Landing page: hero CTAs ────────────────────────────────────────────
  'landing.openOverview': { en: 'Open Fund-Flow Overview', hi: 'फंड-फ़्लो ओवरव्यू खोलें' },
  'landing.testRbac': { en: 'Test RBAC In Event Lab', hi: 'Event Lab में RBAC जाँचें' },

  // ── Landing page: action matrix labels ─────────────────────────────────
  'landing.action.refreshIntel': { en: 'Refresh Intel', hi: 'इंटेल रिफ़्रेश' },
  'landing.action.launchCase': { en: 'Launch Case', hi: 'केस शुरू करें' },
  'landing.action.paymentHold': { en: 'Payment Hold', hi: 'भुगतान होल्ड' },
  'landing.action.cardHotlist': { en: 'Card Hotlist', hi: 'कार्ड हॉटलिस्ट' },
  'landing.action.approveFreeze': { en: 'Approve Freeze', hi: 'फ़्रीज़ अनुमोदन' },
  'landing.action.socIsolation': { en: 'SOC Isolation', hi: 'SOC आइसोलेशन' },
  'landing.action.amlDraft': { en: 'AML Draft', hi: 'AML प्रारूप' },
  'landing.action.fiuFiling': { en: 'FIU/RBI Filing', hi: 'FIU/RBI फाइलिंग' },
  'landing.action.toggleRule': { en: 'Toggle Rule', hi: 'नियम टॉगल' },
  'landing.action.auditReview': { en: 'Audit Review', hi: 'ऑडिट समीक्षा' },

  // ── Landing page: portal blocks ────────────────────────────────────────
  'landing.portal.digital.title': { en: 'Digital Banking Services', hi: 'डिजिटल बैंकिंग सेवाएँ' },
  'landing.portal.digital.value': { en: 'UPI / IMPS / Cards / Net Banking', hi: 'UPI / IMPS / कार्ड / नेट बैंकिंग' },
  'landing.portal.efrms.title': { en: 'EFRMS / SOC Watch', hi: 'EFRMS / SOC वॉच' },
  'landing.portal.efrms.value': { en: 'Velocity, MFA, device, malware, phishing', hi: 'वेग, MFA, डिवाइस, मालवेयर, फ़िशिंग' },
  'landing.portal.rbi.title': { en: 'RBI / FIU Workbench', hi: 'RBI / FIU वर्कबेंच' },
  'landing.portal.rbi.value': { en: 'STR, CTR, FMR, CFR and audit trail', hi: 'STR, CTR, FMR, CFR और ऑडिट ट्रेल' },
  'landing.portal.backend.title': { en: 'Live Backend', hi: 'लाइव बैकएंड' },
  'landing.portal.backend.value': { en: 'SSE + role header + permission guards', hi: 'SSE + रोल हेडर + अनुमति गार्ड' },

  // ── Landing page: authority matrix section ─────────────────────────────
  'landing.authority.badge': { en: 'Indian bank fraud operating model', hi: 'भारतीय बैंक फ्रॉड ऑपरेटिंग मॉडल' },
  'landing.authority.heading': { en: 'Operational workflow authority matrix', hi: 'ऑपरेशनल वर्कफ़्लो अथॉरिटी मैट्रिक्स' },
  'landing.authority.rolesWired': { en: 'bank roles wired', hi: 'बैंक रोल वायर्ड' },

  // ── Landing page: role picker section ──────────────────────────────────
  'landing.rolePicker.heading': { en: 'Choose Prototype Role', hi: 'प्रोटोटाइप रोल चुनें' },
  'landing.rolePicker.body': {
    en: 'Role authority spans tab access, write controls, backend permission checks, case actions, evidence packages and reporting gates.',
    hi: 'रोल अथॉरिटी में टैब एक्सेस, राइट नियंत्रण, बैकएंड अनुमति जाँच, केस क्रियाएँ, साक्ष्य पैकेज और रिपोर्टिंग गेट शामिल हैं।',
  },
  'landing.rolePicker.liveConsole': { en: 'Live local console', hi: 'लाइव लोकल कंसोल' },
  'landing.rolePicker.authority': { en: 'authority', hi: 'अथॉरिटी' },
  'landing.rolePicker.statTabs': { en: 'tabs', hi: 'टैब' },
  'landing.rolePicker.statActions': { en: 'actions', hi: 'क्रियाएँ' },
  'landing.rolePicker.statPerms': { en: 'perms', hi: 'अनुमति' },
  'landing.rolePicker.previewAccess': { en: 'Preview Access', hi: 'एक्सेस पूर्वावलोकन' },
  'landing.rolePicker.launchAsRole': { en: 'Launch as Role', hi: 'रोल से शुरू करें' },

  // ── Navigation: tab labels (full + short) ──────────────────────────────
  'nav.tab.preFraudIntel.full': { en: 'Pre-Fraud Intel', hi: 'प्री-फ्रॉड इंटेल' },
  'nav.tab.preFraudIntel.short': { en: 'Pre-Fraud', hi: 'प्री-फ्रॉड' },
  'nav.tab.overview.full': { en: 'Fund-Flow Overview', hi: 'फंड-फ़्लो ओवरव्यू' },
  'nav.tab.overview.short': { en: 'Overview', hi: 'ओवरव्यू' },
  'nav.tab.threatSim.full': { en: 'Adaptive Event Lab', hi: 'अनुकूली Event Lab' },
  'nav.tab.threatSim.short': { en: 'Event Lab', hi: 'Event Lab' },
  'nav.tab.investigations.full': { en: 'Investigations', hi: 'जाँच' },
  'nav.tab.investigations.short': { en: 'Investigate', hi: 'जाँच' },
  'nav.tab.intelligence.full': { en: 'Intelligence & Integrity', hi: 'इंटेलिजेंस और अखंडता' },
  'nav.tab.intelligence.short': { en: 'Intel', hi: 'इंटेल' },
  'nav.tab.analytics.full': { en: 'Analytics', hi: 'एनालिटिक्स' },
  'nav.tab.analytics.short': { en: 'Analytics', hi: 'एनालिटिक्स' },
  'nav.tab.compliance.full': { en: 'Compliance & Regulatory', hi: 'अनुपालन और नियामक' },
  'nav.tab.compliance.short': { en: 'Comply', hi: 'अनुपालन' },
  'nav.tab.system.full': { en: 'System', hi: 'सिस्टम' },
  'nav.tab.system.short': { en: 'System', hi: 'सिस्टम' },

  // ── Top bar ────────────────────────────────────────────────────────────
  'topbar.skipToMain': { en: 'Skip to main content', hi: 'मुख्य सामग्री पर जाएँ' },
  'topbar.workspaceStrip': { en: 'Backend-synced fraud operations workspace', hi: 'बैकएंड-सिंक्ड फ्रॉड ऑपरेशन वर्कस्पेस' },
  'topbar.landingPage': { en: 'Landing Page', hi: 'लैंडिंग पेज' },
  'topbar.apiDocs': { en: 'API Docs', hi: 'API डॉक्स' },
  'topbar.brandTitle': { en: 'Union Bank PayFlow portal', hi: 'Union Bank PayFlow पोर्टल' },
  'topbar.bankOfIndia': { en: 'Union Bank of India', hi: 'Union Bank of India' },
  'topbar.brandUndertaking': {
    en: 'A Government of India Undertaking | PayFlow Fraud Intelligence',
    hi: 'भारत सरकार का उपक्रम | PayFlow फ्रॉड इंटेलिजेंस',
  },
  'topbar.tagline': { en: 'Good people to bank with', hi: 'भरोसेमंद बैंकिंग के लिए' },
  'topbar.roleSrOnly': { en: 'Union Bank role', hi: 'Union Bank रोल' },
  // Primary nav uses shorter distinct labels ("Fund-Flow", "Investigator Workbench", "FIU Reporting")
  'topbar.nav.preFraudIntel': { en: 'Pre-Fraud Intel', hi: 'प्री-फ्रॉड इंटेल' },
  'topbar.nav.fundFlow': { en: 'Fund-Flow', hi: 'फंड-फ़्लो' },
  'topbar.nav.eventLab': { en: 'Adaptive Event Lab', hi: 'अनुकूली Event Lab' },
  'topbar.nav.investigator': { en: 'Investigator Workbench', hi: 'जाँच वर्कबेंच' },
  'topbar.nav.fiuReporting': { en: 'FIU Reporting', hi: 'FIU रिपोर्टिंग' },

  // ── Role context switcher ──────────────────────────────────────────────
  'roleSwitcher.openTabs': { en: 'open tabs', hi: 'खुले टैब' },
  'roleSwitcher.locked': { en: 'locked', hi: 'लॉक्ड' },
  'roleSwitcher.roleMatrix': { en: 'Role Matrix', hi: 'रोल मैट्रिक्स' },
  'roleSwitcher.bankReality': { en: 'Bank Reality', hi: 'बैंक रियलिटी' },

  // ── Action buttons: Event Lab ──────────────────────────────────────────
  'action.previewChain': { en: 'Preview Chain', hi: 'चेन पूर्वावलोकन' },
  'action.launchIntoPipeline': { en: 'Launch Into Pipeline', hi: 'पाइपलाइन में भेजें' },
  'action.launchIntoPipeline.title': { en: 'Launch Event Lab run', hi: 'Event Lab रन शुरू करें' },
  'action.analystApprovalRequired': { en: 'analyst approval required', hi: 'एनालिस्ट अनुमोदन आवश्यक' },

  // ── Action buttons: countermeasures ────────────────────────────────────
  'action.approve': { en: 'Approve', hi: 'अनुमोदन' },
  'action.reject': { en: 'Reject', hi: 'अस्वीकार' },
  'action.approveCountermeasure.title': { en: 'Approve countermeasure', hi: 'प्रति-उपाय अनुमोदन' },
  'action.rejectCountermeasure.title': { en: 'Reject countermeasure', hi: 'प्रति-उपाय अस्वीकार' },
  'action.advisoryOnly.title': { en: 'Advisory-only proposal cannot execute', hi: 'सलाहकार-मात्र प्रस्ताव निष्पादित नहीं हो सकता' },

  // ── Action buttons: attack launcher ────────────────────────────────────
  'action.launchAttack': { en: 'Launch Attack', hi: 'अटैक शुरू करें' },
  'action.launching': { en: 'Launching...', hi: 'शुरू हो रहा है...' },
  'action.launchAttack.title': { en: 'Launch attack simulation', hi: 'अटैक सिमुलेशन शुरू करें' },

  // ── Action buttons: escalations ────────────────────────────────────────
  'action.fiu': { en: 'FIU', hi: 'FIU' },
  'action.approveEscalation.title': { en: 'Approve escalation', hi: 'एस्केलेशन अनुमोदन' },
  'action.rejectEscalation.title': { en: 'Reject escalation', hi: 'एस्केलेशन अस्वीकार' },
  'action.escalateFiu.title': { en: 'Escalate to FIU queue', hi: 'FIU कतार में एस्केलेट करें' },

  // ── Action buttons: investigations page ────────────────────────────────
  'action.launchCaseDrill': { en: 'Launch Case Drill', hi: 'केस ड्रिल शुरू करें' },
  'action.launchingShort': { en: 'Launching', hi: 'शुरू हो रहा' },
  'action.launchCaseDrill.title': { en: 'Launch case drill', hi: 'केस ड्रिल शुरू करें' },
  'action.generate': { en: 'Generate', hi: 'जनरेट करें' },
  'action.generating': { en: 'Generating', hi: 'जनरेट हो रहा' },
  'action.generateEvidence.title': { en: 'Generate FIU evidence package', hi: 'FIU साक्ष्य पैकेज जनरेट करें' },
  'action.openPrintablePackage': { en: 'Open Printable Package', hi: 'प्रिंट करने योग्य पैकेज खोलें' },

  // ── Common (re-used across surfaces) ───────────────────────────────────
  'common.loading': { en: 'Loading...', hi: 'लोड हो रहा...' },
} satisfies Record<string, TranslationEntry>

export type UIStringKey = keyof typeof UI_STRINGS
