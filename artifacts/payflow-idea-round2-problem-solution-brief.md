# PayFlow: Intelligent Fund Flow Tracking for Fraud Detection in Union Bank of India

**iDEA 2.0 National Level Hackathon Round 2 | CSI-KJSSE in collaboration with Union Bank of India | PS3 | Team Aryabhata**

## Page 1 — Problem Statement: Real-Time Payments Need Real-Time Trust

India’s digital payment success has created a new banking responsibility. UPI is now daily infrastructure for merchants, pensioners, students, migrant workers, Jan Dhan account holders and rural households entering formal finance. Public reports based on NPCI data show UPI crossing **23 billion monthly transactions and nearly ₹30 lakh crore in value in May 2026**, while PMJDY has expanded formal banking access to more than **56 crore accounts**. This scale proves India’s inclusion strength, but it also means fraud no longer appears as one suspicious account. It moves as a chain of funds across accounts, branches, products and channels.

For Union Bank of India, the challenge is not only loss prevention; it is protection of public trust. A fraudster can split a victim payment into mule accounts, layer it through UPI or IMPS, activate dormant accounts, route funds across regions and keep individual transfers below obvious thresholds. Traditional alerts catch fragments, but investigators need the complete answer: **where did the money go, how fast did it move, who received it next, and what evidence supports customer action or FIU reporting?**

PS3 asks for an intelligent fund-flow tracking system that maps end-to-end fund movement within the bank across accounts, products, branches and channels. It must detect rapid layering, circular transactions, structuring, dormant-account activation and mismatch between customer profile and actual behaviour. In real operations, this is not just a dashboard problem. It is an evidence, response and accountability problem.

| Current Gap | Operational Impact for Union Bank |
|---|---|
| Account-level alerts | Money trail reconstruction is slow. |
| Mule accounts look normal alone | Inclusion customers need fair protection. |
| Channel-wise views | Fraud exploits UPI, IMPS, ATM and branch gaps. |
| Late evidence packaging | Recovery, support and FIU reporting slow down. |

RBI’s regulatory direction reinforces the same need: digital payments must be safe, governed and resilient; fraud risk must be measurable; and customer protection must scale with adoption. RBI reporting highlights digital-payment fraud as a major category by number, and public awareness material repeatedly warns against money mule activity. For a public sector bank, the next leap is not simply faster payments. It is faster, explainable and accountable fraud intelligence.

The social implication is significant. If a pensioner, small merchant or first-time digital user loses money and cannot understand the path of the fraud, trust in formal banking weakens. Union Bank needs a system that traces funds rapidly, shows investigators the full journey, protects genuine customers from unnecessary friction and supports evidence-led action. PayFlow turns scattered alerts into a live, explainable fund journey.

---

## Page 2 — Solution and Proof of Concept: PayFlow as a Live Fraud Operations Layer

PayFlow is our proof of concept for PS3: a Union Bank-focused fraud intelligence workspace that converts payment activity into a visual, explainable and action-ready fund-flow graph. Instead of forcing analysts to chase isolated alerts, PayFlow shows how money travels from first debit to mule hops, consolidation accounts and possible cash-out nodes. It detects layering, round-tripping, dormant-account activation and profile mismatch, then presents the case for fraud analysts, branch teams, compliance users and FIU-facing officers.

The prototype demonstrates event ingestion, fund-flow mapping, risk scoring, graph-based pattern discovery, live backend visibility, AI-assisted explanation, role-based access, countermeasure review and evidence packaging. A branch user can see whether a complaint is isolated or part of a mule network. A fraud analyst can inspect downstream beneficiaries before action. A compliance user receives a cleaner evidence narrative without manual reconstruction.

| Traditional Workflow | PayFlow Approach |
|---|---|
| Isolated alert review | Live origin-to-destination fund graph |
| Scattered notes and evidence | One investigator workspace |
| Generic AI summaries | Evidence-tied graph and ML reasoning |
| Late compliance packaging | FIU-ready context from investigation trace |

PayFlow keeps human authority intact. AI assists investigation; it does not autonomously approve holds, freezes or filings. Graph analytics and machine learning identify suspicious flow behaviour, while an open-source **Qwen 3.5 4B** model running on GPU gives bounded explanations in plain banking language. This can run inside an air-gapped Union Bank-controlled environment, keeping sensitive transaction context away from external APIs. Local GPU inference also lowers recurring vendor dependency and per-token cost, making AI assistance practical for public sector banking.

The implementation is an overlay, not a core-banking replacement. Union Bank can begin with high-risk UPI/IMPS mule-chain detection in selected fraud operations, tune with historical and simulated cases, and then expand to branch escalations, ATM/card signals and customer-contact evidence. The same layer can later support enterprise evidence packaging, compliance review and reusable fraud-intelligence playbooks.

| Impact Area | Pilot-Level Projection |
|---|---:|
| Fund-flow reconstruction time | 60-75% reduction |
| Linked mule-chain discovery | 30-45% improvement |
| False-positive handling effort | 20-35% reduction |
| Evidence package preparation | 50-70% faster |
| AI operating cost | Lower through local open-source GPU inference |

PayFlow aligns with Digital India because it strengthens the trust layer beneath mass adoption. It does not slow down UPI; it helps banks understand misuse at payment speed. It does not replace branch judgement; it gives branch and fraud teams a shared evidence view. It does not treat inclusion customers as risk by default; it separates genuine low-income usage from unusual network behaviour. For Union Bank and other PSU banks, PayFlow can scale wherever high transaction volume, mule-account abuse and regulatory reporting pressure intersect.

**Core promise:** when fraudulent money moves in seconds, the bank’s understanding of that movement must also move in seconds.

**References:** RBI Digital Payment Security Controls and Annual Report 2024-25; NPCI/UPI public statistics; PMJDY financial inclusion context.
