// ============================================================================
// i18n.ts -- PayFlow language core (English / Hindi)
// ============================================================================
// Dependency-free i18n. Mirrors the rbac.ts persistence pattern: a private
// storage key, an SSR-guarded getter/setter, and translation lookup helpers.
// Banking acronyms (UPI, EFRMS, FIU, STR, CTR, RBI, AML, KYC, CFR, MFA, IOC,
// SOC, MLRO) are kept as-is in Hindi -- standard Hinglish banking usage.
// ============================================================================

import { UI_STRINGS, type UIStringKey } from '@/lib/translations'
import type {
  OperationalWorkflow,
  PayflowRole,
  RolePolicy,
} from '@/lib/rbac'

export type Language = 'en' | 'hi'

export const LANGUAGES: { id: Language; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'hi', label: 'हिंदी' },
]

export const DEFAULT_LANGUAGE: Language = 'en'

const LANG_STORAGE_KEY = 'payflow.uiLanguage'

// ── Persistence (mirrors rbac.ts getStoredRole / storeRole) ────────────────

export function getStoredLanguage(): Language {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE
  const stored = window.localStorage.getItem(LANG_STORAGE_KEY)
  return isLanguage(stored) ? stored : DEFAULT_LANGUAGE
}

export function storeLanguage(language: Language): void {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(LANG_STORAGE_KEY, language)
  }
}

function isLanguage(value: unknown): value is Language {
  return value === 'en' || value === 'hi'
}

// ── UI string lookup ───────────────────────────────────────────────────────

/**
 * Translate a UI string key for the given language. Falls back to English,
 * then to the raw key if neither is present (should never happen for typed
 * keys, but keeps runtime robust).
 */
export function translate(lang: Language, key: UIStringKey): string {
  const entry = UI_STRINGS[key]
  if (!entry) return key
  return lang === 'hi' ? entry.hi : entry.en
}

export type TFunction = (key: UIStringKey) => string

/** Build a bound translator for a language. */
export function makeTranslator(lang: Language): TFunction {
  return (key: UIStringKey) => translate(lang, key)
}

// ── Role data translations ─────────────────────────────────────────────────
// Hindi overrides for the user-facing display fields of each banking role.
// Fields not overridden fall back to the English value in ROLE_POLICIES.

type RoleDisplayFields = Pick<
  RolePolicy,
  'label' | 'domain' | 'summary' | 'escalationScope' | 'shift' | 'reportingLine' | 'decisionAuthority' | 'toolStack'
>

export const ROLE_TRANSLATIONS: Record<PayflowRole, { hi: Partial<RoleDisplayFields> }> = {
  soc_analyst: {
    hi: {
      label: 'SOC एनालिस्ट',
      domain: '24x7 EFRMS / सुरक्षा ऑपरेशन सेंटर',
      summary: 'लाइव अलर्ट, डिवाइस/सत्र विसंगतियाँ और बाहरी फ्रॉड संकेतों की निगरानी।',
      escalationScope: 'अलर्ट ट्रायज और केस उठा सकते हैं; फ़्रीज़ या नियामक फाइलिंग निष्पादित नहीं कर सकते।',
      shift: '24x7 L1 निगरानी',
      reportingLine: 'SOC L2 / साइबर सिक्योरिटी ऑपरेशन्स',
      decisionAuthority: 'EFRMS/SIEM अलर्ट स्वीकारें और पुष्ट खाता/डिवाइस विसंगतियाँ एस्केलेट करें।',
      toolStack: ['EFRMS/Clari5', 'SIEM', 'UEBA', 'थ्रेट इंटेलिजेंस प्लेटफ़ॉर्म'],
    },
  },
  soc_l2_incident_responder: {
    hi: {
      label: 'SOC L2 / इंसिडेंट रिस्पॉन्डर',
      domain: 'साइबर इंसिडेंट रिस्पॉन्स',
      summary: 'मालवेयर, फ़िशिंग, एंडपॉइंट समझौता और पेमेंट-चैनल घुसपैठ संकेतों को नियंत्रित करता है।',
      escalationScope: 'खराब एंडपॉइंट आइसोलेट और साइबर-लिंक्ड केस शुरू कर सकते हैं; बैंकिंग फ़्रीज़ या FIU फाइलिंग अनुमोदित नहीं कर सकते।',
      shift: '24x7 L2 कंटेनमेंट',
      reportingLine: 'CISO / इंसिडेंट रिस्पॉन्स लीड',
      decisionAuthority: 'फ्रॉड ऑपरेशन के खातों पर कार्रवाई से पहले एंडपॉइंट आइसोलेशन और साइबर कंटेनमेंट अनुमोदित करें।',
      toolStack: ['SIEM', 'SOAR', 'EDR', 'फॉरेंसिक टूलकिट', 'TIP'],
    },
  },
  threat_hunter: {
    hi: {
      label: 'थ्रेट हंटर',
      domain: 'साइबर थ्रेट इंटेलिजेंस',
      summary: 'म्यूल भर्ती, फ़िशिंग इन्फ़्रास्ट्रक्चर, APK अभियान और OSINT-लिंक्ड संकेत खोजता है।',
      escalationScope: 'थ्रेट इंटेलिजेंस प्रकाशित और नियंत्रण परीक्षण कर सकते हैं; ग्राहक केस या नियामक फाइलिंग तय नहीं कर सकते।',
      shift: 'थ्रेट-नेतृत्व हंट चक्र',
      reportingLine: 'साइबर सिक्योरिटी / SOC L3',
      decisionAuthority: 'सत्यापित IOC और प्लेबुक को SOC और फ्रॉड एनालिस्ट कतार में पदोन्नत करें।',
      toolStack: ['TIP', 'OSINT', 'SIEM', 'SOAR', 'सैंडबॉक्स एनालिसिस'],
    },
  },
  fraud_analyst: {
    hi: {
      label: 'फ्रॉड एनालिस्ट',
      domain: 'ट्रांज़ैक्शन मॉनिटरिंग और फ्रॉड मैनेजमेंट विभाग',
      summary: 'फंड-फ़्लो केस जाँचता है, ग्राफ़ साक्ष्य मान्य करता है, और एनालिस्ट निर्णय तैयार करता है।',
      escalationScope: 'एनालिस्ट कतार आइटम तय और साक्ष्य पैकेज कर सकते हैं; उच्च-प्रभाव फ़्रीज़ को समिति अनुमोदन चाहिए।',
      shift: '24x7 ट्रांज़ैक्शन मॉनिटरिंग',
      reportingLine: 'फ्रॉड रिस्क मैनेजमेंट / ट्रांज़ैक्शन मॉनिटरिंग लीड',
      decisionAuthority: 'एनालिस्ट थ्रेशोल्ड के भीतर तत्काल होल्ड/हॉटलिस्ट लगाएँ और केस समिति या अनुपालन हेतु पैक करें।',
      toolStack: ['EFRMS/Clari5', 'Finacle CBS', 'केस मैनेजमेंट', 'ग्राफ़ एनालिटिक्स'],
    },
  },
  transaction_officer: {
    hi: {
      label: 'ट्रांज़ैक्शन अधिकारी',
      domain: 'डिजिटल पेमेंट्स ऑपरेशन्स',
      summary: 'तत्काल भुगतान होल्ड, कार्ड हॉटलिस्टिंग, लाभार्थी जाँच और ग्राहक-प्रभाव ट्रायज निष्पादित करता है।',
      escalationScope: 'ऑपरेशनल होल्ड और हॉटलिस्टिंग निष्पादित कर सकते हैं; नियम ट्यून, फ़्रीज़ अनुमोदन, या STR/FMR फाइल नहीं कर सकते।',
      shift: 'ग्राहक-प्रभाव पेमेंट डेस्क',
      reportingLine: 'डिजिटल बैंकिंग ऑपरेशन्स / FRM डेस्क',
      decisionAuthority: 'दस्तावेज़ीकृत थ्रेशोल्ड के भीतर संदिग्ध ट्रांज़ैक्शन अस्थायी रूप से होल्ड और उजागर कार्ड हॉटलिस्ट करें।',
      toolStack: ['Finacle CBS', 'EFRMS/Clari5', 'कार्ड स्विच', 'केस मैनेजमेंट'],
    },
  },
  efrms_specialist: {
    hi: {
      label: 'EFRMS विशेषज्ञ',
      domain: 'फ्रॉड नियम और परिदृश्य ट्यूनिंग',
      summary: 'EFRMS परिदृश्य, चैंपियन-चैलेंजर नियंत्रण और फ़ॉल्स-पॉजिटिव फ़ीडबैक लूप ट्यून करता है।',
      escalationScope: 'नियम ट्यून और परीक्षण कर सकते हैं; ग्राहक फ्रॉड केस तय या नियामक फाइलिंग जमा नहीं कर सकते।',
      shift: 'व्यवसाय-घंटे ट्यूनिंग, 24x7 आपातकालीन सहायता के साथ',
      reportingLine: 'FRM नियम लीड / एनालिटिक्स टीम',
      decisionAuthority: 'सिमुलेशन और समिति-समर्थित आपातकालीन अनुमोदन के बाद सत्यापित नियम परिवर्तन पदोन्नत करें।',
      toolStack: ['EFRMS/Clari5', 'पायथन एनालिटिक्स', 'मॉडल मॉनिटर', 'केस फ़ीडबैक'],
    },
  },
  branch_ops: {
    hi: {
      label: 'शाखा ऑपरेशन्स',
      domain: 'शाखा / ग्राहक संपर्क',
      summary: 'ग्राहक संदर्भ, लाभार्थी पंजीकरण और शाखा-स्तरीय सुधार साक्ष्य की समीक्षा करता है।',
      escalationScope: 'ग्राहक-संपर्क संदर्भ और शाखा अवलोकन जोड़ सकते हैं; रिपोर्ट फाइल या नियंत्रण बदल नहीं सकते।',
      shift: 'शाखा व्यवसाय घंटे / ग्राहक कॉलबैक',
      reportingLine: 'शाखा प्रबंधक / क्षेत्रीय ऑपरेशन्स',
      decisionAuthority: 'केंद्रीय केस बंद होने से पहले ग्राहक संपर्क, KYC और शाखा अवलोकन की पुष्टि करें।',
      toolStack: ['Finacle CBS', 'KYC/CDD रिकॉर्ड', 'केस मैनेजमेंट', 'ग्राहक संपर्क लॉग'],
    },
  },
  aml_analyst: {
    hi: {
      label: 'AML एनालिस्ट',
      domain: 'AML / KYC / म्यूल नेटवर्क मॉनिटरिंग',
      summary: 'स्ट्रक्चरिंग, लेयरिंग, म्यूल खाते, CDD अंतराल और संदिग्ध ट्रांज़ैक्शन प्रारूप जाँचता है।',
      escalationScope: 'AML/STR साक्ष्य और CDD नोट प्रारूपित कर सकते हैं; Principal Officer या अनुपालक अधिकारी फाइलिंग अधिकृत करते हैं।',
      shift: 'AML जाँच कतार',
      reportingLine: 'AML मैनेजर / Principal Officer',
      decisionAuthority: 'संदिग्ध ट्रांज़ैक्शन तर्क प्रारूपित करें और अनुमोदन हेतु खाता प्रतिबंध की सिफारिश करें।',
      toolStack: ['AML सूट', 'वॉचलिस्ट', 'Finacle CBS', 'ग्राफ़ एनालिटिक्स', 'केस मैनेजमेंट'],
    },
  },
  compliance_officer: {
    hi: {
      label: 'अनुपालक अधिकारी',
      domain: 'RBI / FIU-IND / CBI रिपोर्टिंग',
      summary: 'नियामक रिपोर्टिंग, फ्रॉड रजिस्ट्री अपडेट और FIU-तैयार साक्ष्य समीक्षा का स्वामित्व रखता है।',
      escalationScope: 'STR/CTR/FMR/CFR आर्टिफ़ैक्ट फाइल और बाहरी रिपोर्टिंग वर्कफ़्लो समन्वय कर सकते हैं।',
      shift: 'नियामक रिपोर्टिंग डेस्क',
      reportingLine: 'Principal Officer / अनुपालन प्रमुख',
      decisionAuthority: 'रिपोर्ट योग्य फ्रॉड, STR/CTR/FMR, CFR, DAKSH और बाहरी रिपोर्टिंग पैकेज अधिकृत करें।',
      toolStack: ['FIU-IND पोर्टल', 'RBI DAKSH', 'CFR', 'केस मैनेजमेंट', 'ऑडिट लेजर'],
    },
  },
  principal_officer: {
    hi: {
      label: 'Principal Officer / MLRO',
      domain: 'AML अनुपालन अथॉरिटी',
      summary: 'STR अनुमोदन, FIU प्रसार, AML अनुशासन और संदिग्ध गतिविधि हस्ताक्षर का स्वामित्व रखता है।',
      escalationScope: 'AML फाइलिंग और FIU प्रसार अनुमोदित कर सकते हैं; सीधे साइबर कंटेनमेंट ऑपरेट नहीं करते।',
      shift: 'AML हस्ताक्षर कतार',
      reportingLine: 'मुख्य अनुपालन अधिकारी / बोर्ड अनुपालन समिति',
      decisionAuthority: 'एनालिस्ट समीक्षा के बाद STR/FIU प्रस्तुतियाँ और AML अनुशासन निर्णय अधिकृत करें।',
      toolStack: ['AML सूट', 'FIU-IND पोर्टल', 'वॉचलिस्ट', 'केस मैनेजमेंट', 'ऑडिट लेजर'],
    },
  },
  fraud_investigator: {
    hi: {
      label: 'फ्रॉड जाँचकर्ता',
      domain: 'फ्रॉड जाँच यूनिट',
      summary: 'केस साक्ष्य, रूट-कॉज़ टाइमलाइन, कॉमन-पॉइंट-ऑफ़-कॉम्प्रोमाइज़ लिंक और LEA-तैयार पैक बनाता है।',
      escalationScope: 'जाँच साक्ष्य और FMR पैक निष्कर्ष निकाल सकते हैं; फ़्रीज़/नियम निर्णय को अब भी समिति अथॉरिटी चाहिए।',
      shift: 'जाँच कतार',
      reportingLine: 'फ्रॉड जाँच यूनिट लीड',
      decisionAuthority: 'जाँच निष्कर्ष निर्धारित करें और ऑडिट ट्रेस के साथ कानून-प्रवर्तन/नियामक साक्ष्य पैक तैयार करें।',
      toolStack: ['केस मैनेजमेंट', 'ग्राफ़ एनालिटिक्स', 'फॉरेंसिक टूलकिट', 'CFR', 'ऑडिट लेजर'],
    },
  },
  fraud_committee: {
    hi: {
      label: 'फ्रॉड समिति',
      domain: 'बोर्ड / कार्यकारी फ्रॉड समिति',
      summary: 'उच्च-प्रभाव सुधार, खाता फ़्रीज़ और एंटरप्राइज़ नीति ओवरराइड अनुमोदित करती है।',
      escalationScope: 'फ़्रीज़, नियम परिवर्तन, रिपोर्टिंग निर्णय और सुधार निष्पादन अधिकृत कर सकते हैं।',
      shift: 'कार्यकारी अनुमोदन बोर्ड',
      reportingLine: 'बोर्ड-स्तरीय जोखिम/फ्रॉड अनुशासन',
      decisionAuthority: 'उच्च-प्रभाव फ़्रीज़, नियम ओवरराइड, नियामक पैकेज और क्रॉस-टीम सुधार हेतु अंतिम अथॉरिटी।',
      toolStack: ['समिति डॉकेट', 'EFRMS/Clari5', 'केस मैनेजमेंट', 'RBI/FIU साक्ष्य', 'ऑडिट लेजर'],
    },
  },
  risk_analyst: {
    hi: {
      label: 'जोखिम एनालिस्ट',
      domain: 'एंटरप्राइज़ रिस्क मैनेजमेंट',
      summary: 'फ्रॉड जोखिम, थ्रेशोल्ड, परिदृश्य हानि और पोर्टफ़ोलियो-स्तरीय नियंत्रण प्रभावशीलता ट्रैक करता है।',
      escalationScope: 'अधिकतर-पठन जोखिम निरीक्षण; केस तय, खाता फ़्रीज़ या रिपोर्ट फाइल नहीं कर सकते।',
      shift: 'जोखिम समीक्षा चक्र',
      reportingLine: 'CRO / एंटरप्राइज़ रिस्क समिति',
      decisionAuthority: 'समिति समीक्षा हेतु जोखिम एपेटाइट और थ्रेशोल्ड परिवर्तन की सिफारिश करें।',
      toolStack: ['रिस्क डैशबोर्ड', 'एनालिटिक्स वेयरहाउस', 'केस मैनेजमेंट', 'ऑडिट लेजर'],
    },
  },
  data_scientist: {
    hi: {
      label: 'डेटा वैज्ञानिक / ML इंजीनियर',
      domain: 'AI / मॉडल अनुशासन',
      summary: 'मॉडल ड्रिफ़्ट, फ़ीचर गुणवत्ता, फ़ॉल्स-पॉजिटिव लूप और Qwen रीज़निंग टेलीमेट्री मॉनिटर करता है।',
      escalationScope: 'मॉडल व्यवहार समीक्षा और एनोटेट कर सकते हैं; फ्रॉड नियंत्रण ऑपरेट या बाहरी रिपोर्ट फाइल नहीं कर सकते।',
      shift: 'मॉडल मॉनिटरिंग चक्र',
      reportingLine: 'एनालिटिक्स प्रमुख / मॉडल रिस्क अनुशासन',
      decisionAuthority: 'मापे गए ड्रिफ़्ट और एनालिस्ट फ़ीडबैक के आधार पर मॉडल/नियम पुनः-अंशांकन की सिफारिश करें।',
      toolStack: ['पायथन एनालिटिक्स', 'मॉडल मॉनिटर', 'Qwen रनटाइम टेलीमेट्री', 'फ़ीचर स्टोर', 'ऑडिट लेजर'],
    },
  },
  internal_audit: {
    hi: {
      label: 'आंतरिक ऑडिट',
      domain: 'स्वतंत्र ऑडिट और नियंत्रण परीक्षण',
      summary: 'केस क्रियाएँ, अनुमति उपयोग, साक्ष्य अखंडता और नियामक नियंत्रण पालन की समीक्षा करता है।',
      escalationScope: 'केवल-पठन ऑडिट निरीक्षण; कोई ऑपरेशनल राइट, फ़्रीज़, नियम या फाइलिंग अथॉरिटी नहीं।',
      shift: 'आवधिक और घटना-ट्रिगर ऑडिट',
      reportingLine: 'आंतरिक ऑडिट / ऑडिट समिति',
      decisionAuthority: 'ऑपरेशनल स्थिति बदले बिना ऑडिट निष्कर्ष और नियंत्रण अपवाद उठाएँ।',
      toolStack: ['ऑडिट लेजर', 'केस मैनेजमेंट', 'RBI/FIU साक्ष्य', 'एक्सेस लॉग'],
    },
  },
  system_admin: {
    hi: {
      label: 'सिस्टम प्रशासक',
      domain: 'प्लेटफ़ॉर्म ऑपरेशन्स',
      summary: 'बिना केस अथॉरिटी के रनटाइम स्वास्थ्य, मॉडल/सेवा टेलीमेट्री और प्लेटफ़ॉर्म नियंत्रण बनाए रखता है।',
      escalationScope: 'प्लेटफ़ॉर्म नियंत्रण ट्यून कर सकते हैं; फ्रॉड निर्णय अनुमोदित या बाहरी रिपोर्ट फाइल नहीं कर सकते।',
      shift: 'प्लेटफ़ॉर्म सहायता',
      reportingLine: 'टेक्नोलॉजी ऑपरेशन्स',
      decisionAuthority: 'बिना केस अथॉरिटी के सेवा स्वास्थ्य, डिप्लॉयमेंट और रनटाइम नियंत्रण बनाए रखें।',
      toolStack: ['FastAPI', 'SSE', 'Ollama/Qwen रनटाइम', 'Nixpacks', 'ऑब्ज़र्वबिलिटी लॉग'],
    },
  },
}

/**
 * Return a RolePolicy copy with Hindi overrides applied for the user-facing
 * display fields. Non-display fields (role, tabs, permissions, featureFocus,
 * workflowSteps) are passed through untouched. Any missing Hindi override
 * gracefully falls back to the original English value.
 */
export function translateRole(policy: RolePolicy, lang: Language): RolePolicy {
  if (lang === 'en') return policy
  const overrides = ROLE_TRANSLATIONS[policy.role]?.hi ?? {}
  return { ...policy, ...overrides }
}

// ── Operational workflow translations ──────────────────────────────────────

type WorkflowOverride = {
  title?: string
  trigger?: string
  actions?: string[] // indexed by stage order
}

export const WORKFLOW_TRANSLATIONS: Record<string, { hi: WorkflowOverride }> = {
  upi_remote_access_scam: {
    hi: {
      title: 'UPI रिमोट-एक्सेस घोटाला',
      trigger: 'तेज UPI वेग, नया डिवाइस/MFA संदर्भ, रिमोट-सपोर्ट या स्क्रीन-शेयर संकेत।',
      actions: [
        'डिवाइस/सत्र विसंगति और लाइव EFRMS अलर्ट का पता लगाएँ।',
        'एनालिस्ट होल्ड लगाएँ, लाभार्थी वेग और म्यूल ग्राफ़ की जाँच करें।',
        'जहाँ ग्राहक जोखिम सक्रिय हो वहाँ भुगतान होल्ड या कार्ड हॉटलिस्ट निष्पादित करें।',
        'ग्राहक संपर्क, KYC और शिकायत टाइमलाइन की पुष्टि करें।',
        'थ्रेशोल्ड पूरे होने पर 1930/NCRP/DAKSH/FMR पैकेज तैयार करें।',
      ],
    },
  },
  phishing_malware_intrusion: {
    hi: {
      title: 'फ़िशिंग या मालवेयर-लिंक्ड बैंकिंग घुसपैठ',
      trigger: 'संदिग्ध PowerShell, एंडपॉइंट विसंगति, दुर्भावनापूर्ण APK, क्रेडेंशियल चोरी, या लेटरल मूवमेंट।',
      actions: [
        'फ़िशिंग डोमेन, APK, IOC और बाहरी अभियान संदर्भ सत्यापित करें।',
        'वर्कस्टेशन/डिवाइस सत्र आइसोलेट करें और फॉरेंसिक साक्ष्य सुरक्षित रखें।',
        'साइबर टाइमलाइन को धन-गति और प्रभावित खातों से जोड़ें।',
        'सत्यापित IOC/प्लेबुक के बाद डिजिटल-चैनल परिदृश्य ट्यून करें।',
        'उच्च-प्रभाव कंटेनमेंट या आपातकालीन नियम रोलआउट अनुमोदित करें।',
      ],
    },
  },
  mule_layering_network: {
    hi: {
      title: 'म्यूल खाता और लेयरिंग नेटवर्क',
      trigger: 'स्ट्रक्चर्ड जमा, तेज़ कंसोलिडेशन, पास-थ्रू व्यवहार, डॉर्मेंट सक्रियण, या CFR मिलान।',
      actions: [
        'CDD/KYC समीक्षा करें और STR तर्क प्रारूपित करें।',
        'ग्राफ़ साक्ष्य और कनेक्टेड-खाता जाँच पैकेज बनाएँ।',
        'AML समीक्षा के बाद STR/FIU प्रसार अधिकृत करें।',
        'ऑडिट हैश के साथ STR/CTR/FMR/CFR आर्टिफ़ैक्ट फाइल करें।',
        'पोर्टफ़ोलियो जोखिम की समीक्षा करें और नियंत्रण कसने की सिफारिश करें।',
      ],
    },
  },
  atm_card_cloning: {
    hi: {
      title: 'ATM स्किमिंग या कार्ड क्लोनिंग',
      trigger: 'असंभव यात्रा, बार-बार कार्ड-प्रेज़ेंट विफलताएँ, कॉमन ATM पॉइंट, या क्रॉस-बॉर्डर उपयोग।',
      actions: [
        'असंभव-यात्रा और डिवाइस/पेमेंट-रेल विसंगतियों की निगरानी करें।',
        'उजागर कार्ड हॉटलिस्ट करें और ग्राहक धन की रक्षा करें।',
        'कॉमन पॉइंट ऑफ़ कॉम्प्रोमाइज़ और लिंक्ड शिकारों को सहसंबंधित करें।',
        'FMR/CFR और बाहरी रिपोर्टिंग आर्टिफ़ैक्ट तैयार करें।',
        'साक्ष्य चेन, अनुमोदन और कर्तव्यों के पृथक्करण को मान्य करें।',
      ],
    },
  },
}

/**
 * Return an OperationalWorkflow copy with Hindi overrides applied. Stage
 * actions are overridden positionally; any stage without an override keeps
 * its English action text.
 */
export function translateWorkflow(workflow: OperationalWorkflow, lang: Language): OperationalWorkflow {
  if (lang === 'en') return workflow
  const override = WORKFLOW_TRANSLATIONS[workflow.id]?.hi
  if (!override) return workflow
  return {
    ...workflow,
    title: override.title ?? workflow.title,
    trigger: override.trigger ?? workflow.trigger,
    stages: workflow.stages.map((stage, index) => ({
      ...stage,
      action: override.actions?.[index] ?? stage.action,
    })),
  }
}
