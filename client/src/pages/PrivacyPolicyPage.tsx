import { useState, useEffect } from "react"
import { ArrowLeft, FileText, Printer, Check } from "lucide-react"
import { useNavigate } from "react-router-dom"

interface Section {
  id: string;
  title: string;
  content: string[];
}

const SECTIONS: Section[] = [
  {
    id: "intro",
    title: "1. Introduction",
    content: [
      "PRIVACY POLICY",
      "AQ ESTATES HOLDING SPV, LLC",
      "AQE COMMUNITY PARTNERSHIP PROGRAM",
      "Effective Date: May 1, 2026",
      "Last Updated: May 2026",
      "1. INTRODUCTION",
      "AQ Estates Holding SPV, LLC, together with its affiliates, subsidiaries, successors, assigns, operating partners, service providers, and authorized representatives (collectively referred to as \"AQ Estates,\" \"AQE,\" \"Company,\" \"we,\" \"our,\" or \"us\"), recognizes the importance of privacy, confidentiality, transparency, and responsible information management.",
      "This Privacy Policy explains how AQ Estates collects, uses, processes, stores, protects, transfers, discloses, and otherwise handles personal information obtained from Community Partners, website visitors, applicants, service providers, vendors, contractors, affiliates, and other individuals who interact with AQ Estates or participate in the AQE Community Partnership Program.",
      "AQ Estates is committed to maintaining appropriate safeguards designed to protect personal information while supporting the operation of its community partnership programs, hospitality initiatives, technology services, educational programs, governance activities, compliance obligations, and business operations.",
      "By accessing our websites, registering an account, submitting information, acquiring AQE Digital Units, participating in AQE programs, using AQE services, or otherwise interacting with AQ Estates, you acknowledge that you have read, understood, and agreed to the practices described in this Privacy Policy.",
      "If you do not agree with the terms of this Privacy Policy, you should discontinue use of our services and refrain from submitting personal information to AQ Estates."
    ]
  },
  {
    id: "scope",
    title: "2. Scope of this Privacy Policy",
    content: [
      "This Privacy Policy applies to information collected through:",
      "• The AQ Estates website and related websites;",
      "• Community Partner registration portals;",
      "• AQE Digital Unit enrollment platforms;",
      "• Customer service interactions;",
      "• Electronic communications;",
      "• Mobile applications;",
      "• Online forms;",
      "• Video conferences;",
      "• Events and conferences;",
      "• Hospitality programs;",
      "• Social media interactions;",
      "• Business relationships;",
      "• Third-party service providers acting on behalf of AQ Estates; and",
      "• Any other services operated or controlled by AQ Estates.",
      "This Privacy Policy applies regardless of whether information is collected electronically, verbally, in writing, through automated systems, or through third-party service providers acting on behalf of AQ Estates."
    ]
  },
  {
    id: "definitions",
    title: "3. Definitions",
    content: [
      "For purposes of this Privacy Policy, the following definitions apply.",
      "\"Personal Information\" means any information that identifies, relates to, describes, or can reasonably be associated with an identifiable individual.",
      "\"Community Partner\" means any individual or entity that participates in the AQE Community Partnership Program.",
      "\"AQE Digital Units\" means the digital records used to represent participation within the AQE Community Partnership Program.",
      "\"Processing\" means any operation performed on personal information, including collection, storage, use, disclosure, transfer, modification, analysis, or deletion.",
      "\"Service Provider\" means any third party engaged by AQ Estates to perform services on its behalf.",
      "\"Applicable Law\" means any law, regulation, governmental order, court decision, regulatory requirement, or legal obligation applicable to AQ Estates or the individual concerned."
    ]
  },
  {
    id: "collect",
    title: "4. Information We Collect",
    content: [
      "AQ Estates may collect various categories of information depending upon the nature of the relationship between the individual and AQ Estates.",
      "The information collected may include information voluntarily provided by users, information generated through participation in AQE programs, information obtained through compliance procedures, information collected automatically through technology systems, and information obtained from third-party sources.",
      "Personal information may include an individual's full legal name, residential address, mailing address, email address, telephone number, date of birth, citizenship, nationality, identification numbers, tax information, business affiliations, professional information, and other information necessary to establish or maintain participation within the AQE ecosystem.",
      "In certain circumstances, AQ Estates may collect copies of government-issued identification documents, passports, driver's licenses, residence permits, utility bills, bank references, corporate formation documents, beneficial ownership information, source-of-funds documentation, and similar records necessary to satisfy legal, compliance, or operational requirements.",
      "AQ Estates may also collect transaction-related information, participation history, governance activity records, account preferences, communication records, customer support interactions, hospitality program participation records, event attendance records, and other information related to an individual's engagement with AQ Estates.",
      "Technical information may be collected automatically when individuals access AQ Estates websites or systems. Such information may include Internet Protocol (IP) addresses, browser types, operating systems, device identifiers, connection information, usage statistics, cookies, website navigation patterns, geolocation information where permitted by law, and other technical data.",
      "AQ Estates may combine information obtained from multiple sources for purposes described in this Privacy Policy."
    ]
  },
  {
    id: "verification",
    title: "5. Identity Verification and Compliance Information",
    content: [
      "As part of its commitment to legal compliance, fraud prevention, anti-money laundering efforts, sanctions screening, risk management, and community protection, AQ Estates may require Community Partners and applicants to undergo identity verification procedures.",
      "These procedures may include collection and verification of personal information, government-issued identification documents, proof of residence documentation, beneficial ownership information, source-of-funds information, sanctions screening results, politically exposed person screening results, and other compliance-related information.",
      "AQ Estates reserves the right to reject, suspend, restrict, delay, or terminate participation where requested compliance information is not provided or where AQ Estates determines that participation may present legal, regulatory, financial, operational, or reputational risks.",
      "The collection and processing of compliance-related information are essential components of AQ Estates' efforts to maintain a secure and responsible community environment."
    ]
  },
  {
    id: "use",
    title: "6. How We Use Information",
    content: [
      "AQ Estates uses personal information for legitimate business purposes related to the operation, management, protection, and development of its programs and services.",
      "Personal information may be used to establish and maintain accounts, verify identities, process registrations, administer Community Partner participation, maintain records of AQE Digital Unit ownership, facilitate governance activities, communicate updates, administer hospitality benefits, provide customer support, process payments, investigate disputes, improve services, conduct analytics, and satisfy legal obligations.",
      "Information may also be used to detect fraud, prevent abuse, monitor security threats, conduct risk assessments, perform compliance reviews, enforce agreements, protect intellectual property, and maintain the integrity of AQ Estates systems.",
      "AQ Estates may use information to develop new products, improve existing services, evaluate community needs, measure participation trends, enhance operational efficiency, and support long-term strategic planning."
    ]
  },
  {
    id: "legal-bases",
    title: "7. Legal Bases for Processing Information",
    content: [
      "AQ Estates processes personal information only for legitimate and lawful purposes connected to the operation of its business, the administration of the AQE Community Partnership Program, the protection of Community Partners, and compliance with applicable laws and regulations.",
      "Depending upon the jurisdiction involved, AQ Estates may process personal information based upon one or more legal grounds, including the necessity of processing for the performance of contractual obligations, compliance with legal and regulatory requirements, protection of legitimate business interests, prevention of fraud and abuse, protection of the rights and safety of Community Partners, fulfillment of community administration responsibilities, and, where required by law, the consent of the individual concerned.",
      "Where consent is required under applicable law, AQ Estates will seek such consent through appropriate mechanisms. However, withdrawal of consent may limit AQ Estates' ability to provide certain services, benefits, participation opportunities, or account access.",
      "AQ Estates may also process information where necessary to establish, exercise, defend, investigate, or enforce legal rights, claims, obligations, or contractual relationships.",
      "Nothing contained in this Privacy Policy shall be interpreted as limiting AQ Estates' ability to process information where such processing is required or permitted by applicable law."
    ]
  },
  {
    id: "disclosure",
    title: "8. Disclosure and Sharing of Information",
    content: [
      "AQ Estates respects the privacy of Community Partners and does not sell personal information to third parties for monetary compensation.",
      "However, AQ Estates may share information with carefully selected service providers, contractors, professional advisors, compliance partners, technology providers, hospitality operators, payment processors, auditors, insurers, consultants, legal advisors, and other third parties whose services support the operation of AQ Estates and the AQE Community Partnership Program.",
      "Information may be shared when necessary to process transactions, verify identity, provide customer support, administer programs, maintain technology infrastructure, conduct compliance reviews, detect fraud, enforce agreements, respond to legal requests, or fulfill operational requirements.",
      "AQ Estates may disclose information to governmental authorities, courts, law enforcement agencies, regulators, tax authorities, securities authorities, or other competent bodies where required by applicable law, court order, subpoena, regulatory request, legal proceeding, or governmental investigation.",
      "IN connection with mergers, acquisitions, reorganizations, asset sales, restructurings, financings, business combinations, or similar transactions, AQ Estates may transfer or disclose information as part of due diligence activities or business continuity planning.",
      "Recipients of information are expected to implement reasonable safeguards designed to protect personal information and to use such information only for authorized purposes.",
      "AQ Estates does not control the independent privacy practices of third parties and encourages individuals to review applicable privacy policies before engaging with third-party services."
    ]
  },
  {
    id: "international",
    title: "9. International Data Transfers",
    content: [
      "AQ Estates operates internationally and may engage service providers, affiliates, business partners, contractors, consultants, and technology providers located in multiple countries and jurisdictions.",
      "As a result, personal information may be transferred, stored, processed, accessed, or maintained outside an individual's country of residence.",
      "The privacy laws and data protection regulations applicable in other jurisdictions may differ from those applicable in the individual's country of residence and may provide different levels of legal protection.",
      "By participating in AQ Estates programs, using AQ Estates services, submitting information, or otherwise interacting with AQ Estates, individuals acknowledge and consent to the transfer, processing, and storage of information across international borders to the extent permitted by applicable law.",
      "AQ Estates will take commercially reasonable measures designed to ensure that international transfers are conducted in a secure and responsible manner consistent with applicable legal requirements.",
      "However, AQ Estates cannot guarantee that every jurisdiction maintains identical privacy protections."
    ]
  },
  {
    id: "security",
    title: "10. Data Security and Cybersecurity Measures",
    content: [
      "AQ Estates recognizes the importance of safeguarding personal information and has implemented administrative, technical, organizational, and physical security measures designed to reduce the risk of unauthorized access, disclosure, misuse, alteration, destruction, or loss of information.",
      "Security measures may include encryption technologies, access controls, authentication procedures, monitoring systems, cybersecurity protocols, network security controls, backup procedures, employee training programs, vendor oversight procedures, and incident response plans.",
      "Access to personal information is generally restricted to individuals who require such access for legitimate business purposes.",
      "Despite reasonable efforts to protect information, no method of electronic transmission, internet communication, cloud storage, database management, cybersecurity infrastructure, or information technology system can be guaranteed to be completely secure.",
      "Cybersecurity threats continue to evolve, and sophisticated attacks may occur despite protective measures.",
      "Accordingly, AQ Estates cannot guarantee absolute security and disclaims liability for unauthorized access, interception, alteration, theft, destruction, disclosure, or misuse of information resulting from circumstances beyond its reasonable control.",
      "Individuals are responsible for maintaining the confidentiality of their account credentials, passwords, authentication devices, and other access mechanisms.",
      "Any suspected security incident should be reported to AQ Estates immediately."
    ]
  },
  {
    id: "retention",
    title: "11. Data Retention",
    content: [
      "AQ Estates retains personal information only for as long as reasonably necessary to fulfill the purposes described in this Privacy Policy, satisfy contractual obligations, administer participation programs, protect business interests, maintain records, resolve disputes, comply with legal obligations, and enforce agreements.",
      "The retention period applicable to specific categories of information may vary depending upon legal requirements, operational needs, regulatory obligations, business purposes, risk management considerations, and applicable statutes of limitation.",
      "Certain information may be retained beyond the termination of participation in order to comply with regulatory requirements, tax obligations, anti-money laundering obligations, litigation holds, audit requirements, dispute resolution procedures, or recordkeeping obligations.",
      "When AQ Estates determines that information is no longer required, reasonable measures may be taken to delete, anonymize, archive, aggregate, or securely dispose of such information.",
      "However, residual copies may remain in backup systems, disaster recovery systems, archived records, or legal preservation environments for a limited period."
    ]
  },
  {
    id: "rights",
    title: "12. Your Privacy Rights",
    content: [
      "Depending upon applicable law and the jurisdiction in which an individual resides, certain privacy rights may be available.",
      "Such rights may include the right to access personal information, request correction of inaccurate information, request deletion of information, object to certain processing activities, restrict processing, withdraw consent where applicable, receive information regarding processing activities, request data portability, or submit complaints to relevant supervisory authorities.",
      "The availability and scope of such rights may vary based upon jurisdiction, legal requirements, operational considerations, contractual obligations, compliance obligations, and other factors.",
      "AQ Estates may require verification of identity before responding to privacy-related requests.",
      "Certain requests may be denied where permitted by law, including situations involving legal obligations, security concerns, fraud prevention measures, compliance requirements, protection of third-party rights, or legitimate business interests.",
      "Requests regarding privacy rights may be submitted using the contact information provided in this Privacy Policy.",
      "AQ Estates will make reasonable efforts to respond within applicable legal timeframes."
    ]
  },
  {
    id: "cookies",
    title: "13. Cookies and Tracking Technologies",
    content: [
      "AQ Estates websites, applications, and online services may use cookies, web beacons, pixels, session identifiers, analytics technologies, tracking technologies, and similar tools designed to improve functionality, security, user experience, performance measurement, and operational efficiency.",
      "These technologies may collect information regarding browsing activity, website usage, device characteristics, session activity, navigation patterns, referral sources, interaction history, and technical performance.",
      "Cookies may be used to remember preferences, maintain login sessions, enhance security, analyze website traffic, improve content delivery, prevent fraud, and support operational functions.",
      "Users may modify browser settings to manage cookie preferences. However, disabling cookies may affect the functionality, performance, security, or availability of certain services.",
      "AQ Estates may use third-party analytics services to better understand website performance and user interactions.",
      "Such third-party services may collect information subject to their own privacy practices."
    ]
  },
  {
    id: "marketing",
    title: "14. Marketing Communications",
    content: [
      "AQ Estates may periodically communicate with Community Partners and other individuals regarding updates, announcements, educational content, hospitality programs, partnership opportunities, governance activities, service enhancements, promotions, events, compliance notices, and operational matters.",
      "Individuals may receive communications through email, text messaging, telephone calls, social media platforms, mobile applications, websites, postal mail, or other communication channels.",
      "Where required by law, individuals may be provided with options to manage communication preferences or opt out of certain marketing communications.",
      "Even where marketing communications are declined, AQ Estates may continue to send transactional, compliance-related, account-related, security-related, legal, or operational communications necessary for participation in AQ Estates programs.",
      "AQ Estates shall not be responsible for delays, interruptions, delivery failures, spam filtering issues, telecommunications disruptions, or other circumstances affecting communication delivery."
    ]
  },
  {
    id: "third-party",
    title: "15. Third-Party Service Providers",
    content: [
      "AQ Estates relies upon a variety of third-party service providers to support the operation, administration, security, compliance, development, and maintenance of its services and programs. These service providers may include hosting providers, cloud service providers, payment processors, identity verification providers, compliance screening providers, customer support vendors, communication platforms, analytics providers, cybersecurity firms, auditors, consultants, legal advisors, accounting firms, hospitality operators, event organizers, and other business partners.",
      "In order to perform services on behalf of AQ Estates, such providers may receive access to certain categories of information necessary to fulfill their assigned responsibilities. AQ Estates seeks to engage reputable providers that implement appropriate security measures and confidentiality protections; however, AQ Estates cannot guarantee the performance, security practices, or privacy policies of independent third parties.",
      "Third-party service providers may operate in multiple jurisdictions and may process information in accordance with their own legal obligations and internal policies. Individuals are encouraged to review the privacy policies and terms of service of any third-party service they choose to use.",
      "AQ Estates shall not be responsible for the privacy practices, security measures, content, policies, actions, omissions, products, services, or conduct of third-party organizations that are not directly controlled by AQ Estates.",
      "Where third-party services are integrated into AQ Estates platforms, individuals acknowledge that their use of such services may be subject to separate agreements, privacy policies, disclosures, and legal requirements."
    ]
  },
  {
    id: "children",
    title: "16. Children's Privacy",
    content: [
      "The AQE Community Partnership Program and related AQ Estates services are intended exclusively for adults who have reached the legal age of majority in their respective jurisdictions and, in all cases, are at least eighteen (18) years of age.",
      "AQ Estates does not knowingly solicit, collect, process, maintain, or store personal information from individuals under the age of eighteen (18).",
      "If AQ Estates becomes aware that personal information has been collected from a minor without appropriate legal authorization, AQ Estates may take reasonable steps to remove such information from its active systems and may terminate any associated account or participation.",
      "Parents, guardians, or legal representatives who believe that a minor has provided information to AQ Estates are encouraged to contact AQ Estates immediately so that appropriate action may be taken.",
      "AQ Estates reserves the right to request proof of age, identification documents, or additional verification information at any time in order to confirm eligibility for participation.",
      "Any individual who provides false information regarding age or eligibility may be subject to account suspension, termination of participation, or other actions deemed appropriate by AQ Estates."
    ]
  },
  {
    id: "government",
    title: "17. Government Requests, Regulatory Compliance, and Investigations",
    content: [
      "AQ Estates is committed to operating in a lawful and responsible manner and may cooperate with governmental authorities, regulatory agencies, law enforcement organizations, courts, tax authorities, financial intelligence units, sanctions authorities, securities regulators, and other competent bodies where required or permitted by law.",
      "AQ Estates may disclose information when it reasonably believes that disclosure is necessary to comply with legal obligations, enforce contractual rights, protect public safety, prevent fraud, investigate misconduct, respond to lawful requests, comply with court orders, satisfy regulatory requirements, or protect the rights and interests of AQ Estates, Community Partners, or third parties.",
      "AQ Estates may conduct internal reviews, compliance assessments, investigations, audits, sanctions screenings, anti-money laundering reviews, fraud prevention reviews, and risk management activities as part of its commitment to maintaining a secure and compliant environment.",
      "Where permitted by law, AQ Estates may retain records associated with investigations, compliance reviews, legal proceedings, regulatory inquiries, dispute resolution activities, and enforcement actions for extended periods.",
      "Nothing contained in this Privacy Policy shall limit AQ Estates' ability to comply with applicable laws, governmental directives, judicial proceedings, regulatory requirements, or lawful requests from competent authorities.",
      "Community Partners acknowledge that compliance obligations may require AQ Estates to collect, maintain, review, disclose, or transfer information without prior notice when legally authorized or required to do so."
    ]
  },
  {
    id: "records",
    title: "18. Community Partnership Records",
    content: [
      "AQ Estates maintains records relating to participation in the AQE Community Partnership Program for operational, legal, compliance, governance, auditing, historical, and administrative purposes.",
      "Such records may include account information, registration information, AQE Digital Unit ownership records, transaction records, governance participation records, communications, support requests, compliance documentation, participation history, event attendance records, hospitality program records, and other information associated with Community Partner activities.",
      "The AQE Digital Registry, together with related records maintained by AQ Estates, may serve as the official record of participation within the AQE Community Partnership Program.",
      "Community Partners are responsible for ensuring that information provided to AQ Estates remains accurate, complete, and current. Failure to maintain accurate information may result in delays, restrictions, suspension of benefits, compliance issues, communication failures, or other operational consequences.",
      "AQ Estates reserves the right to maintain historical records of participation even after termination of participation where such retention is necessary for legal, compliance, operational, auditing, accounting, historical, or business purposes.",
      "Participation records may be used to administer governance programs, determine eligibility for benefits, support dispute resolution processes, maintain operational continuity, and protect the integrity of the AQE ecosystem."
    ]
  },
  {
    id: "changes",
    title: "19. Changes to this Privacy Policy",
    content: [
      "AQ Estates reserves the right to amend, revise, supplement, modify, update, replace, or discontinue portions of this Privacy Policy at any time and for any reason.",
      "Changes may be necessary to reflect legal developments, regulatory requirements, technological advancements, operational changes, business developments, industry practices, security enhancements, service modifications, or evolving community needs.",
      "Updated versions of this Privacy Policy may be published through AQ Estates websites, Community Partner portals, mobile applications, electronic communications, public notices, or other communication channels selected by AQ Estates.",
      "AQ Estates encourages Community Partners and users to periodically review this Privacy Policy to remain informed regarding current privacy practices.",
      "Unless otherwise required by law, revised versions of this Privacy Policy shall become effective upon publication or upon the effective date specified within the updated policy.",
      "AQ Estates may, but shall not be obligated to, provide additional notice regarding material changes."
    ]
  },
  {
    id: "contact",
    title: "20. Contact Information",
    content: [
      "Questions, requests, concerns, complaints, or inquiries relating to this Privacy Policy or AQ Estates' information handling practices may be directed to AQ Estates using the contact information below.",
      "AQ ESTATES HOLDING SPV, LLC",
      "AQE COMMUNITY PARTNERSHIP PROGRAM",
      "Email: support@aqestate.net",
      "Website: www.aqestate.net",
      "AQ Estates may designate additional contact methods, compliance officers, privacy representatives, support channels, or regional representatives from time to time.",
      "Individuals submitting requests may be required to provide sufficient information to verify identity before AQ Estates can respond to certain inquiries.",
      "AQ Estates reserves the right to decline requests that are fraudulent, abusive, unreasonable, repetitive, unlawful, or otherwise inconsistent with applicable legal requirements."
    ]
  },
  {
    id: "acceptance",
    title: "21. Continued Use Constitutes Acceptance",
    content: [
      "By accessing AQ Estates websites, creating an account, submitting information, participating in the AQE Community Partnership Program, acquiring AQE Digital Units, using AQ Estates services, receiving Community Partner benefits, attending AQ Estates events, participating in governance activities, or otherwise interacting with AQ Estates, each individual acknowledges that he, she, or it has read, understood, and agreed to this Privacy Policy.",
      "AQ Estates may modify this Privacy Policy from time to time. Continued use of AQ Estates services, continued participation in the AQE Community Partnership Program, continued ownership of AQE Digital Units, continued receipt of benefits, or continued interaction with AQ Estates following publication of an updated Privacy Policy shall constitute acceptance of the revised Privacy Policy.",
      "If an individual does not agree with any portion of this Privacy Policy or any future revisions, the individual should discontinue use of AQ Estates services and participation in AQ Estates programs, subject to any contractual obligations that may continue to apply.",
      "By continuing to participate in the AQE Community Partnership Program after any revision becomes effective, the individual expressly agrees to be bound by the then-current version of this Privacy Policy."
    ]
  },
  {
    id: "acknowledgement",
    title: "Acknowledgement",
    content: [
      "BY USING AQ ESTATES SERVICES, REGISTERING AN ACCOUNT, SUBMITTING INFORMATION, ACQUIRING AQE DIGITAL UNITS, OR CONTINUING TO PARTICIPATE IN THE AQE COMMUNITY PARTNERSHIP PROGRAM, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREED TO THIS PRIVACY POLICY.",
      "YOU FURTHER ACKNOWLEDGE THAT YOU ARE SOLELY RESPONSIBLE FOR COMPLYING WITH THE PRIVACY, DATA PROTECTION, TAX, REPORTING, REGULATORY, AND OTHER LEGAL REQUIREMENTS APPLICABLE IN YOUR COUNTRY, STATE, PROVINCE, TERRITORY, OR JURISDICTION OF RESIDENCE.",
      "AQ ESTATES MAKES NO REPRESENTATION THAT PARTICIPATION IS LAWFUL IN EVERY JURISDICTION, AND EACH COMMUNITY PARTNER IS RESPONSIBLE FOR DETERMINING WHETHER PARTICIPATION IS PERMITTED UNDER APPLICABLE LAWS.",
      "YOUR CONTINUED PARTICIPATION CONSTITUTES YOUR ACCEPTANCE OF THIS PRIVACY POLICY AND ALL FUTURE REVISIONS THERETO."
    ]
  }
];

export default function PrivacyPolicyPage() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<string>("intro");

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200;
      for (const section of SECTIONS) {
        const element = document.getElementById(section.id);
        if (element) {
          const top = element.offsetTop;
          const height = element.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleScrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const topOffset = element.offsetTop - 100;
      window.scrollTo({
        top: topOffset,
        behavior: "smooth"
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#f8faf9] text-[#1f2937] font-sans antialiased pb-20 selection:bg-[#276152]/10 selection:text-[#276152]">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-50 bg-[#f8faf9]/80 backdrop-blur-md border-b border-[#e5e7eb] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate("/register");
              }
            }}
            className="p-2 text-[#6b7280] hover:text-[#276152] hover:bg-[#276152]/5 rounded-full transition-all active:scale-95"
            aria-label="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#276152] flex items-center justify-center text-white font-bold text-sm">
              AQ
            </div>
            <div>
              <h1 className="text-base font-bold text-[#111827] tracking-tight">AQ ESTATES</h1>
              <p className="text-[11px] text-[#6b7280] font-medium uppercase tracking-wider">Compliance Documents</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 border border-[#d5d7db] bg-white text-[13px] font-semibold text-[#4b5563] px-3.5 py-2 rounded-lg hover:bg-gray-50 transition-all active:scale-95 hover:border-gray-400"
          >
            <Printer size={16} />
            <span>Print Document</span>
          </button>
        </div>
      </header>

      {/* Main Wrapper */}
      <div className="max-w-[1280px] mx-auto px-6 py-8 flex gap-8">
        {/* Left Sticky Sidebar (Table of Contents) */}
        <aside className="hidden lg:block w-[300px] shrink-0 sticky top-24 self-start max-h-[calc(100vh-120px)] overflow-y-auto pr-4 scrollbar-thin">
          <div className="mb-4 flex items-center gap-2 px-3 text-[#276152]">
            <FileText size={16} />
            <span className="text-[12px] font-bold uppercase tracking-wider">Table of Contents</span>
          </div>
          <nav className="space-y-1">
            {SECTIONS.map((section) => {
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => handleScrollToSection(section.id)}
                  className={`w-full text-left px-3 py-2 text-[13px] font-medium rounded-lg transition-all duration-200 border-l-2 ${
                    isActive
                      ? "text-[#276152] bg-[#276152]/5 border-[#276152] font-semibold"
                      : "text-[#6b7280] border-transparent hover:text-[#4b5563] hover:bg-gray-100/70"
                  }`}
                >
                  {section.title}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Right Main Content */}
        <main className="flex-1 max-w-[850px] mx-auto bg-white border border-[#e5e7eb] rounded-2xl shadow-sm p-8 sm:p-12">
          {/* Document Cover */}
          <div className="border-b border-[#e5e7eb] pb-8 mb-8 text-center sm:text-left">
            <span className="inline-block text-[11px] font-bold text-[#276152] uppercase bg-[#276152]/10 px-3 py-1 rounded-full mb-3 tracking-wide">
              Privacy Document
            </span>
            <h2 className="text-[28px] sm:text-[32px] font-extrabold text-[#111827] leading-tight mb-2 tracking-tight">
              Privacy Policy
            </h2>
            <p className="text-[14px] text-[#6b7280] font-medium italic">
              Effective Date: May 1, 2026
            </p>
          </div>

          {/* Privacy Content Sections */}
          <div className="space-y-10">
            {SECTIONS.map((section) => {
              const isIntro = section.id === "intro";

              return (
                <section
                  key={section.id}
                  id={section.id}
                  className="scroll-mt-24 transition-opacity duration-300"
                >
                  {!isIntro && (
                    <h3 className="text-[18px] font-bold text-[#111827] border-b border-gray-100 pb-2 mb-4">
                      {section.title}
                    </h3>
                  )}

                  <div className="space-y-3">
                    {section.content.map((item, idx) => {
                      // Check if item is a list bullet
                      if (item.startsWith("• ")) {
                        return (
                          <div key={idx} className="flex items-start gap-2.5 pl-4 py-0.5">
                            <Check size={14} className="text-[#276152] shrink-0 mt-1" />
                            <p className="text-[14px] leading-relaxed text-[#4b5563]">
                              {item.replace(/^•\s+/, "")}
                            </p>
                          </div>
                        );
                      }

                      // Check if item is a subsection header (like Personal Information, Account Information, etc.)
                      const isSubHeader = item === "Personal Information" || item === "Account Information" || item === "Technical Information";

                      return (
                        <p
                          key={idx}
                          className={`text-[14px] leading-relaxed text-[#4b5563] ${
                            isIntro && idx === 0
                              ? "text-[15px] font-medium text-[#374151]"
                              : isSubHeader
                              ? "text-[15px] font-bold text-[#111827] pt-2"
                              : ""
                          }`}
                        >
                          {item}
                        </p>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>

          {/* Bottom Back Button */}
          <div className="border-t border-[#e5e7eb] pt-8 mt-12 flex justify-between items-center">
            <span className="text-[12px] text-[#9ca3af]">Last updated: May 2026</span>
            <button
              onClick={() => {
                if (window.history.length > 1) {
                  navigate(-1);
                } else {
                  navigate("/register");
                }
              }}
              className="flex items-center gap-2 bg-[#276152] hover:bg-[#1e4d41] text-white px-5 py-2.5 rounded-xl font-semibold text-[14px] shadow-sm transition-all active:scale-[0.98]"
            >
              <ArrowLeft size={16} />
              <span>Back to Register</span>
            </button>
          </div>
        </main>
      </div>
    </div>
  )
}
