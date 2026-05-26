import React, { useState, useEffect } from "react"
import { ArrowLeft, FileText, Printer, Check } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"

interface Section {
  id: string;
  title: string;
  content: string[];
  isSublist?: boolean;
}

const SECTIONS: Section[] = [
  {
    id: "intro",
    title: "Introduction",
    content: [
      "AQ Estates Holding SPV / Ameritec Quantun Estates Holding FZ, LLC / Ameritec IPS",
      "Accredited Investor & Regulation S Terms and Conditions",
      "Prepared in American English for Private Offering Compliance Purposes",
      "This document is intended as a foundational compliance and disclosure template for private offerings involving accredited investors under Regulation D and offshore participants under Regulation S of the United States Securities Act of 1933."
    ]
  },
  {
    id: "important-notice",
    title: "Important Notice",
    content: [
      "These Terms and Conditions (“Agreement”) govern participation in any private offering, digital ownership participation, digital asset participation, or related business opportunity offered by AQ Estate, AQ Estate Holding, Ameritec IPS, LLC, Ameritec Quantum Estates Holding FZ, LLC and AQ Estates Holding SPV (AQE), or affiliated entities (collectively referred to as the “Company”).",
      "By accessing this website, registering an account, reviewing offering materials, or participating in any offering or platform activity, you acknowledge that you have read, understood, and agreed to these Terms and Conditions.",
      "Participation is void where prohibited by law."
    ]
  },
  {
    id: "legal-notice",
    title: "Legal Notice",
    content: [
      "THIS DOCUMENT IS PROVIDED FOR INFORMATIONAL AND COMPLIANCE PURPOSES ONLY AND DOES NOT CONSTITUTE AN OFFER TO SELL OR A SOLICITATION OF AN OFFER TO PURCHASE ANY SECURITY, DIGITAL ASSET, DIGITAL UNIT, OR FINANCIAL INSTRUMENT IN ANY JURISDICTION WHERE SUCH OFFER OR SOLICITATION WOULD BE UNLAWFUL.",
      "ANY PARTICIPATION REFERENCED HEREIN IS INTENDED SOLELY FOR QUALIFIED PERSONS WHO MEET APPLICABLE LEGAL REQUIREMENTS UNDER RELEVANT SECURITIES LAWS AND REGULATIONS.",
      "PARTICIPANTS ARE STRONGLY ADVISED TO CONSULT THEIR OWN LEGAL COUNSEL, TAX ADVISORS, ACCOUNTANTS, AND FINANCIAL PROFESSIONALS PRIOR TO PARTICIPATING IN ANY OFFERING OR TRANSACTION.",
      "THE COMPANY MAKES NO REPRESENTATION THAT ANY PARTICIPATION OPPORTUNITY IS SUITABLE, APPROPRIATE, OR LEGALLY AVAILABLE IN ANY PARTICULAR JURISDICTION."
    ]
  },
  {
    id: "section-1",
    title: "1. No Public Offering",
    content: [
      "The offerings described on this platform are not public offerings and are not intended for the general public.",
      "Any participation opportunities may be offered only:",
      "• To accredited investors under applicable United States securities laws and exemptions, including Regulation D where applicable; and/or",
      "• To non-U.S. citizens participating in offshore transactions pursuant to Regulation S under the United States Securities Act of 1933.",
      "The Company reserves the right to determine participant eligibility at its sole discretion."
    ]
  },
  {
    id: "section-2",
    title: "2. Accredited Investor Representations (United States)",
    content: [
      "If you are a United States person or participating from within the United States, you represent and warrant that:",
      "• You are an “Accredited Investor” as defined under Rule 501 of Regulation D under the Securities Act of 1933.",
      "• You understand the speculative nature of the offering.",
      "• You are financially capable of bearing the complete loss of your participation amount.",
      "• You are participating for your own account and not on behalf of another party unless properly authorized.",
      "• You have conducted your own independent due diligence.",
      "• You understand that the offering may be subject to transfer restrictions and limited liquidity.",
      "• You understand that no governmental authority has reviewed, approved, or endorsed the offering.",
      "• You understand that past performance does not guarantee future results.",
      "• You acknowledge that no guaranteed profits, income, appreciation, or financial returns have been promised.",
      "The Company may request additional documentation to verify accredited investor status."
    ]
  },
  {
    id: "section-3",
    title: "3. Regulation S Representations (Non-U.S. Participants)",
    content: [
      "If you are participating pursuant to Regulation S, you represent and warrant that:",
      "• You are not a “U.S. Citizen” as defined under Regulation S.",
      "• You are located outside the United States at the time of participation.",
      "• You are not acquiring any interest for the account or benefit of a U.S. Citizen.",
      "• You are participating in an offshore transaction.",
      "• You understand that securities or digital interests acquired under Regulation S may be subject to resale restrictions.",
      "• You acknowledge responsibility for compliance with the laws of your own jurisdiction.",
      "• You understand that participation may not be available in all countries.",
      "• You acknowledge that the Company may refuse participation based on jurisdictional or compliance concerns."
    ]
  },
  {
    id: "section-4",
    title: "4. No Guaranteed Returns",
    content: [
      "The Company does not guarantee:",
      "• Profits",
      "• Financial returns",
      "• Asset appreciation",
      "• Monthly income",
      "• Liquidity",
      "• Market value increases",
      "• Business success",
      "Any forward-looking statements, projections, examples, estimates, forecasts, or market commentary are illustrative only and should not be interpreted as guarantees.",
      "Participation involves substantial risk, including the possible loss of all funds."
    ]
  },
  {
    id: "section-5",
    title: "5. Risk Disclosures",
    content: [
      "Participants acknowledge and accept all risks associated with participation, including but not limited to:",
      "• Regulatory risks",
      "• Blockchain technology risks",
      "• Smart contract risks",
      "• Cybersecurity risks",
      "• Market volatility",
      "• Digital asset fluctuations",
      "• Real estate market risks",
      "• Liquidity risks",
      "• Operational risks",
      "• Economic risks",
      "• Project delays",
      "• Government actions",
      "• Tax risks",
      "• Force majeure events",
      "The Company makes no guarantee regarding future operations, valuations, or market conditions."
    ]
  },
  {
    id: "section-6",
    title: "6. No Financial, Legal, or Tax Advice",
    content: [
      "Information provided by the Company does not constitute:",
      "• Legal advice",
      "• Financial advice",
      "• Investment advice",
      "• Accounting advice",
      "• Tax advice",
      "Participants are strongly encouraged to consult their own legal, financial, tax, and compliance professionals before participating."
    ]
  },
  {
    id: "section-7",
    title: "7. Compliance and KYC/AML",
    content: [
      "The Company reserves the right to require:",
      "• Government-issued identification",
      "• Proof of address",
      "• Source of funds documentation",
      "• Sanctions screening",
      "• Identity verification",
      "• Additional compliance documentation",
      "The Company may reject, suspend, or terminate participation at any time if compliance requirements are not satisfied.",
      "The Company reserves the right to refuse participation from restricted jurisdictions, sanctioned individuals, politically exposed persons (PEPs), or any participant deemed high-risk."
    ]
  },
  {
    id: "section-8",
    title: "8. Restricted Jurisdictions",
    content: [
      "Participation may not be available in jurisdictions where such participation would violate local laws or regulations.",
      "It is the participant’s sole responsibility to determine whether participation is lawful in their jurisdiction.",
      "The Company makes no representation regarding the legality of participation in any country."
    ]
  },
  {
    id: "section-9",
    title: "9. Digital Asset and Blockchain Disclosure",
    content: [
      "The Company may utilize blockchain technologies, digital ownership systems, smart contracts, digital units, or digital asset infrastructure.",
      "Participants acknowledge that blockchain-related technologies may involve:",
      "• Software vulnerabilities",
      "• Wallet risks",
      "• Network disruptions",
      "• Regulatory uncertainty",
      "• Technology failures",
      "• Irreversible transactions",
      "Participants are solely responsible for maintaining the security of their wallets, credentials, passwords, recovery phrases, and devices."
    ]
  },
  {
    id: "section-10",
    title: "10. No Custody of Customer Funds",
    content: [
      "Unless expressly stated otherwise in writing, the Company does not act as:",
      "• A bank",
      "• A custodial institution",
      "• A money transmitter",
      "• A cryptocurrency exchange",
      "• A broker-dealer",
      "Third-party payment providers, compliance providers, or regulated service providers may process transactions and compliance verification."
    ]
  },
  {
    id: "section-11",
    title: "11. Forward-Looking Statements",
    content: [
      "Certain statements may constitute forward-looking statements, including projections, expectations, goals, or anticipated developments.",
      "Actual results may differ materially from any forward-looking statements.",
      "The Company undertakes no obligation to update forward-looking statements."
    ]
  },
  {
    id: "section-12",
    title: "12. Disclaimer of Warranties",
    content: [
      "TO THE MAXIMUM EXTENT PERMITTED UNDER APPLICABLE LAW, THE PLATFORM, WEBSITE, OFFERINGS, DIGITAL INFRASTRUCTURE, MATERIALS, TECHNOLOGY, CONTENT, AND RELATED SERVICES ARE PROVIDED ON AN “AS IS” AND “AS AVAILABLE” BASIS WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED.",
      "THE COMPANY EXPRESSLY DISCLAIMS ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO:",
      "• MERCHANTABILITY;",
      "• FITNESS FOR A PARTICULAR PURPOSE;",
      "• NON-INFRINGEMENT;",
      "• ACCURACY OF INFORMATION;",
      "• CONTINUOUS AVAILABILITY;",
      "• SECURITY OF DIGITAL SYSTEMS;",
      "• UNINTERRUPTED OPERATION.",
      "THE COMPANY DOES NOT WARRANT THAT THE PLATFORM OR SERVICES WILL BE FREE OF ERRORS, VIRUSES, CYBERSECURITY INCIDENTS, DELAYS, OR INTERRUPTIONS."
    ]
  },
  {
    id: "section-13",
    title: "13. Limitation of Liability",
    content: [
      "To the fullest extent permitted by law, the Company, its affiliates, officers, directors, employees, contractors, partners, and representatives shall not be liable for:",
      "• Any direct or indirect losses",
      "• Lost profits",
      "• Market losses",
      "• Digital asset losses",
      "• Data loss",
      "• Technology interruptions",
      "• Cybersecurity incidents",
      "• Third-party failures",
      "• Regulatory actions",
      "• Delays or inability to access services",
      "Participation is entirely at the participant’s own risk."
    ]
  },
  {
    id: "section-14",
    title: "14. Indemnification",
    content: [
      "Participants agree to indemnify and hold harmless the Company and its affiliates from any claims, liabilities, damages, costs, or expenses arising from:",
      "• Violation of these Terms",
      "• Violation of laws or regulations",
      "• Misrepresentation by the participant",
      "• Unauthorized use of the platform",
      "• Disputes with third parties"
    ]
  },
  {
    id: "section-15",
    title: "15. Privacy",
    content: [
      "The Company may collect and process personal information for:",
      "• Compliance purposes",
      "• Identity verification",
      "• Fraud prevention",
      "• Operational purposes",
      "• Regulatory obligations",
      "By participating, you consent to the collection and use of information in accordance with applicable privacy laws and Company policies."
    ]
  },
  {
    id: "section-16",
    title: "16. Intellectual Property",
    content: [
      "All platform content, trademarks, logos, graphics, technology, branding, and materials remain the exclusive property of the Company unless otherwise stated.",
      "No rights are granted except as expressly permitted."
    ]
  },
  {
    id: "section-17",
    title: "17. Modifications",
    content: [
      "The Company reserves the right to modify, update, suspend, or discontinue any aspect of the platform, offering, or these Terms at any time without prior notice.",
      "Continued participation constitutes acceptance of any revised Terms."
    ]
  },
  {
    id: "section-18",
    title: "18. Termination",
    content: [
      "The Company reserves the right to suspend or terminate access or participation at its sole discretion, including for:",
      "• Compliance concerns",
      "• Violation of Terms",
      "• Fraudulent activity",
      "• Regulatory concerns",
      "• Misrepresentation"
    ]
  },
  {
    id: "section-19",
    title: "19. Governing Law",
    content: [
      "These Terms shall be governed by and interpreted in accordance with the laws determined by the Company’s applicable operating jurisdiction, without regard to conflict of law principles.",
      "Any disputes shall be resolved in the jurisdiction selected by the Company unless otherwise required by law."
    ]
  },
  {
    id: "section-20",
    title: "20. Electronic Consent",
    content: [
      "By clicking “I Agree,” registering an account, signing electronically, or participating through the platform, you acknowledge and agree that:",
      "• Electronic signatures are legally binding.",
      "• Electronic records satisfy legal writing requirements.",
      "• You consent to electronic communications and notices."
    ]
  },
  {
    id: "section-21",
    title: "21. Entire Agreement",
    content: [
      "These Terms and Conditions constitute the entire agreement between the participant and the Company regarding participation and supersede prior communications or understandings."
    ]
  },
  {
    id: "acknowledgment",
    title: "Participant Acknowledgment",
    content: [
      "By participating, you acknowledge that:",
      "• You have read and understood these Terms;",
      "• You understand the risks involved.",
      "• You are participating voluntarily;",
      "• You are legally permitted to participate in your jurisdiction.",
      "• You understand there are no guaranteed returns.",
      "• You agree to comply with all applicable laws and regulations.",
      "© AQ Estates Holding SPV / Ameritec Quantum Estates Holding / Ameritec IPS / AQE All Rights Reserved."
    ]
  }
];

export default function TermsPage() {
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
              Official Private Offering Document
            </span>
            <h2 className="text-[28px] sm:text-[32px] font-extrabold text-[#111827] leading-tight mb-2 tracking-tight">
              Accredited Investor & Regulation S Terms & Conditions
            </h2>
            <p className="text-[14px] text-[#6b7280] font-medium italic">
              Prepared in American English for Private Offering Compliance Purposes
            </p>
          </div>

          {/* Legal Content Sections */}
          <div className="space-y-10">
            {SECTIONS.map((section) => {
              const isIntro = section.id === "intro";
              const isNotice = section.id === "important-notice";
              const isLegal = section.id === "legal-notice";

              return (
                <section
                  key={section.id}
                  id={section.id}
                  className="scroll-mt-24 transition-opacity duration-300"
                >
                  {!isIntro && !isNotice && !isLegal && (
                    <h3 className="text-[18px] font-bold text-[#111827] border-b border-gray-100 pb-2 mb-4">
                      {section.title}
                    </h3>
                  )}

                  {isNotice && (
                    <div className="bg-[#276152]/5 border border-[#276152]/20 rounded-xl p-6 mb-6">
                      <h4 className="text-[14px] font-bold text-[#276152] uppercase tracking-wider mb-3">
                        {section.title}
                      </h4>
                      <div className="space-y-3">
                        {section.content.map((p, i) => (
                          <p key={i} className="text-[14px] leading-relaxed text-[#374151]">
                            {p}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {isLegal && (
                    <div className="bg-red-50 border border-red-100 rounded-xl p-6 mb-6">
                      <h4 className="text-[14px] font-bold text-red-700 uppercase tracking-wider mb-3">
                        {section.title}
                      </h4>
                      <div className="space-y-3">
                        {section.content.map((p, i) => (
                          <p key={i} className="text-[13px] leading-relaxed text-red-800 font-medium">
                            {p}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Standard Render */}
                  {!isNotice && !isLegal && (
                    <div className="space-y-3">
                      {section.content.map((item, idx) => {
                        // Check if item starts with bullet marker
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
                        
                        // Default paragraph styling
                        return (
                          <p
                            key={idx}
                            className={`text-[14px] leading-relaxed text-[#4b5563] ${
                              isIntro && idx === 0
                                ? "text-[16px] font-semibold text-[#111827]"
                                : isIntro && idx === 1
                                ? "text-[15px] font-medium text-[#276152]"
                                : ""
                            }`}
                          >
                            {item}
                          </p>
                        );
                      })}
                    </div>
                  )}
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
