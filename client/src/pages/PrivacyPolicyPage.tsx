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
      "AQ Estates (Ameritec Quantum Estate) (\"AQ Estates,\" \"Company,\" \"we,\" \"our,\" or \"us\") respects your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, store, and disclose information when you visit our website, create an account, purchase AQE Digital Units, or otherwise interact with our services.",
      "By using our website and services, you consent to the practices described in this Privacy Policy."
    ]
  },
  {
    id: "info-collect",
    title: "2. Information We Collect",
    content: [
      "We may collect the following categories of information:",
      "Personal Information",
      "• Full name",
      "• Email address",
      "• Phone number",
      "• Mailing address",
      "• Date of birth",
      "• Government-issued identification documents",
      "• Wallet addresses",
      "• Payment-related information",
      "Account Information",
      "• Username and password",
      "• Account preferences",
      "• Transaction history",
      "• Login activity",
      "Technical Information",
      "• IP address",
      "• Browser type",
      "• Device information",
      "• Operating system",
      "• Website usage data",
      "• Cookies and similar technologies"
    ]
  },
  {
    id: "use-info",
    title: "3. How We Use Your Information",
    content: [
      "We may use your information to:",
      "• Create and manage user accounts",
      "• Process transactions and payments",
      "• Verify identity and comply with KYC/AML requirements",
      "• Provide customer support",
      "• Improve our products and services",
      "• Prevent fraud, abuse, and unauthorized access",
      "• Communicate important updates and notices",
      "• Comply with legal and regulatory obligations"
    ]
  },
  {
    id: "share-info",
    title: "4. Sharing of Information",
    content: [
      "We do not sell your personal information.",
      "We may share information with:",
      "• Payment processors and financial service providers",
      "• Identity verification and compliance providers",
      "• Technology and hosting partners",
      "• Professional advisors and auditors",
      "• Government agencies or regulators when required by law",
      "All third-party service providers are expected to maintain appropriate security measures and confidentiality protections."
    ]
  },
  {
    id: "data-security",
    title: "5. Data Security",
    content: [
      "We implement commercially reasonable administrative, technical, and organizational safeguards designed to protect personal information from unauthorized access, disclosure, alteration, or destruction.",
      "However, no method of electronic transmission or storage is completely secure, and we cannot guarantee absolute security."
    ]
  },
  {
    id: "data-retention",
    title: "6. Data Retention",
    content: [
      "We retain personal information for as long as necessary to:",
      "• Provide our services",
      "• Fulfill contractual obligations",
      "• Comply with legal and regulatory requirements",
      "• Resolve disputes and enforce agreements"
    ]
  },
  {
    id: "your-rights",
    title: "7. Your Rights",
    content: [
      "Depending on your jurisdiction, you may have rights to:",
      "• Access your personal information",
      "• Correct inaccurate information",
      "• Request deletion of personal information",
      "• Restrict certain processing activities",
      "• Withdraw consent where applicable",
      "Requests may be submitted using the contact information provided below."
    ]
  },
  {
    id: "cookies",
    title: "8. Cookies",
    content: [
      "Our website may use cookies and similar technologies to improve functionality, analyze traffic, enhance user experience, and maintain security.",
      "Users may modify browser settings to manage cookie preferences."
    ]
  },
  {
    id: "international-transfers",
    title: "9. International Transfers",
    content: [
      "Your information may be transferred to and processed in countries other than your country of residence. By using our services, you consent to such transfers where permitted by law."
    ]
  },
  {
    id: "third-party-services",
    title: "10. Third-Party Services",
    content: [
      "Our website may contain links to third-party websites or services. AQE is not responsible for the privacy practices of third parties.",
      "Users should review the privacy policies of those services independently."
    ]
  },
  {
    id: "children-privacy",
    title: "11. Children's Privacy",
    content: [
      "Our services are not intended for individuals under the age of 18. We do not knowingly collect personal information from minors."
    ]
  },
  {
    id: "changes-policy",
    title: "12. Changes to This Policy",
    content: [
      "We may update this Privacy Policy from time to time. Changes will become effective upon posting on our website.",
      "Continued use of the services after updates constitutes acceptance of the revised policy."
    ]
  },
  {
    id: "contact-info",
    title: "13. Contact Information",
    content: [
      "AQ ESTATES HOLDING SPV, LLC",
      "Email: support@aqestate.net",
      "Website: www.aqestate.net",
      "For privacy-related inquiries, please contact us using the information above."
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
              Effective Date: 5/01/2026
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
