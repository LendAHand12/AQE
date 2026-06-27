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
    title: "1. Purpose",
    content: [
      "AQ ESTATES",
      "REFUND, CANCELLATION, CHARGEBACK, AND PARTICIPATION REVERSAL POLICY",
      "Effective Date: May 1, 2026",
      "AQ ESTATES HOLDING SPV, LLC",
      "AQE COMMUNITY PARTNERSHIP PROGRAM",
      "1. PURPOSE",
      "This Refund, Cancellation, Chargeback, and Participation Reversal Policy (\"Policy\") governs purchases of AQE Digital Units and participation in the AQE Community Partnership Program.",
      "AQE Digital Units represent participation within the AQE Community Partnership Program and may provide access to certain governance rights, community benefits, hospitality programs, educational opportunities, participation privileges, and other benefits offered by AQ Estates from time to time.",
      "Because AQE Digital Units are issued, recorded, administered, and maintained through the AQE Digital Registry and because participation rights may be granted immediately following purchase, all refund requests shall be governed by this Policy.",
      "By purchasing AQE Digital Units, submitting payment, or participating in the AQE Community Partnership Program, the participant acknowledges that he, she, or it has read, understood, and agreed to this Policy."
    ]
  },
  {
    id: "review-period",
    title: "2. Purchase Review Period",
    content: [
      "AQ Estates recognizes that participants should have an opportunity to review program documentation and understand the nature of participation before a purchase becomes final.",
      "Accordingly, a participant may request cancellation of a purchase within seven (7) calendar days from the date of purchase, provided that all eligibility requirements described in this Policy are satisfied.",
      "During the review period, the participant may submit a written request for cancellation by contacting AQ Estates through the designated support channels.",
      "AQ Estates reserves the right to review all requests and verify eligibility before approving any cancellation or refund request."
    ]
  },
  {
    id: "eligibility",
    title: "3. Eligibility for Refunds",
    content: [
      "A refund request may be considered if:",
      "• The request is submitted within seven (7) calendar days of purchase;",
      "• The AQE Digital Units associated with the purchase remain under the participant's control;",
      "• The participant has not transferred, assigned, gifted, exchanged, pledged, or otherwise disposed of the AQE Digital Units;",
      "• No governance rights have been exercised;",
      "• No voting rights have been used;",
      "• No distributions have been received;",
      "• No hospitality benefits have been used;",
      "• No referral rewards have been earned or paid;",
      "• No bonuses or promotional allocations have been utilized;",
      "• No fraud investigation is pending;",
      "• No compliance concerns exist; and",
      "• The transaction otherwise qualifies under applicable law and payment processor requirements.",
      "Meeting the above requirements does not automatically guarantee approval of a refund request.",
      "AQ Estates reserves the right to review each request individually."
    ]
  },
  {
    id: "finalization",
    title: "4. Finalization of Participation",
    content: [
      "Participation shall become final upon the earliest occurrence of any of the following:",
      "• The expiration of seven (7) calendar days following the purchase date;",
      "• The transfer of AQE Digital Units;",
      "• The exercise of voting rights;",
      "• Participation in governance activities;",
      "• Receipt of distributions;",
      "• Receipt or use of hospitality benefits;",
      "• Receipt or use of bonuses, incentives, referral rewards, or promotional benefits;",
      "• Material participation in any AQE Community Partnership Program activity.",
      "Once participation becomes final, purchases shall generally be considered non-refundable except where required by applicable law or expressly approved by AQ Estates."
    ]
  },
  {
    id: "eligible-refunds",
    title: "5. Eligible Refund Circumstances",
    content: [
      "AQ Estates may approve refunds under circumstances including, but not limited to:",
      "• Duplicate transactions;",
      "• Documented payment processing errors;",
      "• Technical system errors;",
      "• Unauthorized transactions verified through investigation;",
      "• Administrative errors attributable to AQ Estates;",
      "• Transactions processed after a valid cancellation request;",
      "• Refunds required by applicable law; or",
      "• Other circumstances approved by AQ Estates in its sole and reasonable discretion.",
      "AQ Estates shall have sole authority to evaluate the facts and circumstances of each request."
    ]
  },
  {
    id: "non-refundable",
    title: "6. Non-Refundable Transactions",
    content: [
      "Except where required by law, refunds generally will not be granted for:",
      "• Changes of mind;",
      "• Changes in personal financial circumstances;",
      "• Dissatisfaction with market conditions;",
      "• Changes in perceived value;",
      "• Failure to review AQ Estates documents;",
      "• Failure to understand program benefits or risks;",
      "• Changes in local regulations;",
      "• Tax consequences;",
      "• Loss of account access caused by the participant;",
      "• Government actions affecting the participant;",
      "• Business decisions made by AQ Estates;",
      "• Future project performance; or",
      "• Speculative expectations that are not achieved.",
      "Participants are encouraged to carefully review all AQ Estates documents before purchasing AQE Digital Units."
    ]
  },
  {
    id: "return-units",
    title: "7. Return of AQE Digital Units",
    content: [
      "As a mandatory condition of any approved refund, cancellation, participation reversal, rescission, payment reversal, or refund request, the participant shall immediately surrender, transfer, assign, return, and relinquish all AQE Digital Units associated with the refunded transaction to AQ Estates.",
      "AQ Estates shall have the right to cancel, remove, deactivate, retire, reclaim, reverse, or otherwise recover such AQE Digital Units from the participant's account or from the AQE Digital Registry.",
      "No participant shall be entitled to receive a refund while retaining AQE Digital Units associated with the refunded purchase.",
      "If any AQE Digital Units have been transferred, sold, gifted, assigned, pledged, exchanged, or otherwise disposed of before approval of the refund request, AQ Estates may deny the refund request or require the participant to return an equivalent number of AQE Digital Units before processing any refund.",
      "The return of AQE Digital Units is a material condition of any refund approval.",
      "No refund shall become final until AQ Estates confirms that all AQE Digital Units associated with the refunded transaction have been fully returned, cancelled, forfeited, or recovered."
    ]
  },
  {
    id: "forfeiture",
    title: "8. Forfeiture of Benefits",
    content: [
      "Upon approval of any refund, all benefits associated with the refunded transaction shall immediately terminate.",
      "Such benefits may include:",
      "• Promotional bonuses;",
      "• Referral rewards;",
      "• Community allocations;",
      "• Governance rights;",
      "• Voting rights;",
      "• Participation rights;",
      "• Distributions;",
      "• Hospitality benefits;",
      "• Membership privileges;",
      "• Educational benefits;",
      "• Recognition programs; and",
      "• Any other benefits associated with the refunded AQE Digital Units.",
      "AQ Estates reserves the right to reverse, cancel, recover, offset, or remove any benefits previously granted."
    ]
  },
  {
    id: "review-process",
    title: "9. Refund Review Process",
    content: [
      "All refund requests must be submitted in writing.",
      "AQ Estates may require:",
      "• Proof of identity;",
      "• Proof of payment;",
      "• Transaction records;",
      "• Supporting documentation;",
      "• Compliance verification; and",
      "• Additional information reasonably necessary to evaluate the request.",
      "Submission of a request does not guarantee approval.",
      "AQ Estates shall review requests in good faith and communicate its determination after completion of the review process."
    ]
  },
  {
    id: "processing",
    title: "10. Processing of Approved Refunds",
    content: [
      "Approved refunds shall generally be issued to the original payment method used for the purchase whenever reasonably possible.",
      "If the original payment method is unavailable, AQ Estates may require an alternative method consistent with applicable laws and payment processor requirements.",
      "Refund processing times may vary depending upon financial institutions, payment networks, compliance reviews, and operational requirements.",
      "Approved refunds are generally processed within ten (10) to thirty (30) business days after approval."
    ]
  },
  {
    id: "chargeback",
    title: "11. Chargeback Policy",
    content: [
      "Participants agree to first contact AQ Estates before initiating a chargeback, payment dispute, payment reversal, bank claim, cardholder dispute, or similar action.",
      "AQ Estates is committed to resolving concerns fairly and efficiently and encourages participants to seek resolution directly through customer support.",
      "Most concerns can be resolved without involving financial institutions."
    ]
  },
  {
    id: "abusive-chargebacks",
    title: "12. Fraudulent or Abusive Chargebacks",
    content: [
      "AQ Estates reserves the right to contest any chargeback or dispute that it reasonably believes is inaccurate, fraudulent, abusive, misleading, or inconsistent with this Policy.",
      "AQ Estates may submit supporting documentation including:",
      "• Transaction records;",
      "• Identity verification records;",
      "• Terms acceptance records;",
      "• IP address logs;",
      "• Communication history;",
      "• Compliance records;",
      "• Usage records;",
      "• Governance participation records; and",
      "• Other evidence demonstrating authorization of the transaction.",
      "Participants who initiate fraudulent chargebacks may have their accounts suspended or permanently terminated.",
      "AQ Estates reserves all rights available under applicable law to recover losses associated with fraudulent chargebacks."
    ]
  },
  {
    id: "responsibility",
    title: "13. Participant Responsibility",
    content: [
      "Each participant is solely responsible for reviewing all AQ Estates documents before purchasing AQE Digital Units.",
      "Each participant is solely responsible for determining whether participation is lawful within his, her, or its jurisdiction.",
      "AQ Estates does not provide legal, tax, investment, accounting, regulatory, immigration, or financial advice.",
      "Participants should consult qualified advisors before participating."
    ]
  },
  {
    id: "changes",
    title: "14. Policy Changes",
    content: [
      "AQ Estates reserves the right to modify, revise, update, supplement, or replace this Policy at any time.",
      "Updated versions shall become effective upon publication unless otherwise stated.",
      "Continued participation in the AQE Community Partnership Program after publication of revised terms shall constitute acceptance of the revised Policy."
    ]
  },
  {
    id: "contact",
    title: "Contact Information",
    content: [
      "CONTACT INFORMATION",
      "AQ ESTATES HOLDING SPV, LLC",
      "Email: support@aqestate.net",
      "Website: www.aqestate.net",
      "All refund requests must be submitted in writing.",
      "Participants are encouraged to contact AQ Estates before initiating any chargeback or payment dispute."
    ]
  },
  {
    id: "acknowledgement",
    title: "Acknowledgement",
    content: [
      "BY PURCHASING AQE DIGITAL UNITS, SUBMITTING PAYMENT, OR CONTINUING TO PARTICIPATE IN THE AQE COMMUNITY PARTNERSHIP PROGRAM, THE PARTICIPANT ACKNOWLEDGES THAT HE, SHE, OR IT HAS READ, UNDERSTOOD, AND AGREED TO THIS REFUND, CANCELLATION, CHARGEBACK, AND PARTICIPATION REVERSAL POLICY.",
      "THE PARTICIPANT FURTHER ACKNOWLEDGES THAT NO REFUND SHALL ENTITLE THE PARTICIPANT TO RETAIN AQE DIGITAL UNITS, BONUSES, COMMUNITY ALLOCATIONS, GOVERNANCE RIGHTS, DISTRIBUTIONS, HOSPITALITY BENEFITS, OR ANY OTHER BENEFITS ASSOCIATED WITH THE REFUNDED TRANSACTION.",
      "CONTINUED PARTICIPATION CONSTITUTES ACCEPTANCE OF THIS POLICY AND ANY FUTURE REVISIONS."
    ]
  }
];

export default function ReturnPolicyPage() {
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
              Refund & Reversal Policy
            </span>
            <h2 className="text-[28px] sm:text-[32px] font-extrabold text-[#111827] leading-tight mb-2 tracking-tight">
              Refund, Cancellation, Chargeback, and Participation Reversal Policy
            </h2>
            <p className="text-[14px] text-[#6b7280] font-medium italic">
              Effective Date: May 1, 2026
            </p>
          </div>

          {/* Legal Content Sections */}
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
