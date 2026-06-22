import { useState, useEffect } from "react"
import { ArrowLeft, FileText, Printer, Check } from "lucide-react"
import { useNavigate } from "react-router-dom"

interface Section {
  id: string;
  title: string;
  content: string[];
  isSublist?: boolean;
}

const SECTIONS: Section[] = [
  {
    id: "intro",
    title: "Preamble",
    content: [
      "AQE COMMUNITY PARTNERSHIP AGREEMENT",
      "TERMS AND CONDITIONS OF PARTICIPATION",
      "PREAMBLE",
      "This Community Partnership Agreement (\"Agreement\") is entered into between AQE, together with its affiliated entities, subsidiaries, successors, and designated operating partners (collectively referred to as \"AQE\"), and each individual or entity that elects to acquire AQE Digital Units and participate in the AQE Community Partnership Program (the \"Community Partner\").",
      "AQE was established with the vision of creating a global community of individuals and organizations that wish to participate in the growth, development, and long-term success of real-world businesses, hospitality projects, technology platforms, intellectual property assets, and other initiatives developed or acquired by AQE and its affiliated entities.",
      "Unlike traditional financial products, cryptocurrencies, or speculative digital assets, AQE Digital Units are intended to serve as a digital representation of participation within the AQE Community Partnership Program. AQE Digital Units are designed to create a transparent and efficient method of recording community participation, governance rights, partnership interests, and other rights and benefits that may be granted under the AQE ecosystem from time to time.",
      "The purpose of this Agreement is to clearly explain the nature of participation, the rights and responsibilities of Community Partners, the role of AQE Digital Units, and the standards that govern the relationship between AQE and its Community Partners.",
      "By acquiring AQE Digital Units, the Community Partner acknowledges that he, she, or it has carefully reviewed this Agreement, understands the risks associated with participation, and voluntarily elects to become part of the AQE Community Partnership Program."
    ]
  },
  {
    id: "nature-partnership",
    title: "1. The Nature of AQE Community Partnership",
    content: [
      "The AQE Community Partnership Program has been established to allow individuals and organizations to participate in the development and growth of the AQE ecosystem. The program is intended to foster a collaborative environment in which Community Partners may contribute to the expansion of AQE projects while sharing in certain rights, benefits, opportunities, and governance participation established by AQE.",
      "The relationship between AQE and each Community Partner is contractual in nature and is governed exclusively by the terms set forth in this Agreement, together with any supplementary policies, governance charters, operating procedures, compliance requirements, and future amendments that may be adopted by AQE.",
      "A Community Partner is not an employee of AQE and shall not be entitled to wages, salaries, employment benefits, retirement benefits, workers' compensation benefits, unemployment benefits, or any other rights normally associated with employment relationships.",
      "Likewise, a Community Partner is not automatically a director, manager, officer, agent, representative, or fiduciary of AQE solely by virtue of holding AQE Digital Units. No Community Partner shall have authority to bind AQE to any contract, obligation, liability, or commitment unless such authority has been expressly granted in writing by AQE.",
      "Participation in the AQE Community Partnership Program is intended to create a community-based relationship founded upon shared interests, collaboration, responsible governance, and long-term ecosystem growth. Community Partners are expected to act in good faith, support the objectives of the AQE ecosystem, and conduct themselves in a manner that promotes the reputation, integrity, and sustainability of the community.",
      "AQE believes that long-term success is best achieved through cooperation rather than speculation. Accordingly, the Community Partnership Program is designed to encourage meaningful participation, responsible stewardship, and long-term engagement rather than short-term trading activity."
    ]
  },
  {
    id: "digital-units",
    title: "2. AQE Digital Units",
    content: [
      "AQE Digital Units are digital records maintained by AQE and its authorized systems. The primary purpose of AQE Digital Units is to record and measure a Community Partner's participation within the AQE ecosystem.",
      "AQE Digital Units are not intended to function as a currency, medium of exchange, payment instrument, bank account, savings product, debt obligation, or deposit account. AQE Digital Units are not issued by a government, central bank, or regulated financial institution and should not be interpreted as legal tender in any jurisdiction.",
      "The acquisition of AQE Digital Units represents participation in the AQE Community Partnership Program and may provide access to certain partnership rights, governance opportunities, benefits, privileges, and participation programs established by AQE from time to time.",
      "AQE Digital Units may also serve as the basis upon which certain voting rights, participation rights, eligibility levels, community recognition programs, hospitality benefits, educational programs, networking opportunities, and other community initiatives are administered.",
      "The rights associated with AQE Digital Units may evolve as the AQE ecosystem develops. AQE reserves the right to introduce additional features, benefits, governance mechanisms, operational improvements, and partnership programs that may enhance the utility and functionality of AQE Digital Units.",
      "Nothing contained in this Agreement shall be interpreted as guaranteeing any specific financial return, increase in value, revenue distribution, appreciation, liquidity, market price, or future economic benefit."
    ]
  },
  {
    id: "partner-admission",
    title: "3. Community Partner Admission",
    content: [
      "Participation in the AQE Community Partnership Program is subject to acceptance by AQE. No individual or entity shall become a Community Partner merely by submitting an application, expressing interest in participation, or tendering funds. Admission shall occur only after AQE has reviewed the applicant's information and has determined, in its sole discretion, that the applicant satisfies all eligibility requirements established by AQE.",
      "AQE reserves the right to request information necessary to verify the identity, residency, legal capacity, source of funds, and compliance status of any applicant. Such information may include government-issued identification, proof of address, business registration documents, tax information, declarations regarding beneficial ownership, or any other documentation deemed necessary by AQE.",
      "Participation in the AQE Community Partnership Program is intended only for individuals and legal entities that are legally permitted to enter into binding agreements under the laws applicable to their jurisdiction. By applying for admission as a Community Partner, the applicant represents and warrants that he, she, or it possesses the legal capacity and authority to enter into this Agreement and to fulfill all obligations arising hereunder.",
      "AQE reserves the right to reject any application for participation without providing a reason and without incurring any liability to the applicant. AQE may also suspend or delay admission where additional due diligence, compliance review, or legal analysis is required.",
      "Once admitted, the Community Partner shall receive an allocation of AQE Digital Units corresponding to the accepted participation amount and shall be recorded in the AQE Digital Registry. The AQE Digital Registry shall serve as the official record of participation and ownership within the AQE Community Partnership Program."
    ]
  },
  {
    id: "interests-ownership",
    title: "4. Partnership Interests and Digital Unit Ownership",
    content: [
      "AQE Digital Units represent a digital record of participation within the AQE Community Partnership Program. AQE Digital Units may also represent a proportional interest in designated partnership holdings, rights, benefits, governance opportunities, or participation programs established by AQE from time to time.",
      "Ownership of AQE Digital Units shall not grant direct legal title to any specific property, building, hotel, intellectual property asset, technology platform, trademark, patent, account, bank balance, or other asset owned by AQE or its affiliated entities. Rather, AQE Digital Units represent participation within the broader AQE ecosystem and the rights expressly granted under this Agreement.",
      "Community Partners acknowledge that AQE may own, acquire, develop, operate, lease, manage, license, finance, or dispose of various assets through different legal entities, subsidiaries, partnerships, foundations, trusts, special purpose vehicles, operating companies, and other organizational structures. AQE Digital Units shall not automatically provide direct ownership of any individual asset unless expressly stated in writing by AQE.",
      "The ownership records maintained within the AQE Digital Registry shall be considered conclusive evidence of ownership of AQE Digital Units. Community Partners are responsible for ensuring that their account information remains accurate and current. AQE shall not be liable for losses arising from inaccurate information provided by a Community Partner.",
      "AQE may establish procedures governing the transfer, assignment, inheritance, gifting, pledge, or disposition of AQE Digital Units. Any attempted transfer that fails to comply with AQE policies may be declared void and unenforceable."
    ]
  },
  {
    id: "rights",
    title: "5. Rights of Community Partners",
    content: [
      "AQE believes that a successful community is built upon transparency, participation, accountability, and shared opportunity. Accordingly, Community Partners may be granted certain rights and privileges designed to promote meaningful participation within the AQE ecosystem.",
      "Subject to applicable law and AQE policies, Community Partners may be entitled to participate in governance initiatives, community consultations, voting programs, educational opportunities, networking activities, hospitality programs, strategic development discussions, and other community-driven initiatives established by AQE.",
      "Community Partners may receive access to periodic updates regarding the progress of AQE projects, development milestones, operational activities, financial performance summaries, hospitality initiatives, strategic partnerships, and future ecosystem plans. AQE shall determine the frequency, format, and scope of such disclosures.",
      "Community Partners may be eligible to participate in community voting initiatives. Voting initiatives may address matters relating to ecosystem development, community programs, strategic priorities, hospitality initiatives, technology upgrades, governance proposals, or other matters determined by AQE.",
      "The rights granted to Community Partners are contractual rights only and shall be interpreted in accordance with this Agreement. No Community Partner shall possess rights beyond those expressly granted herein.",
      "AQE reserves the right to modify, expand, suspend, or discontinue specific rights, benefits, privileges, or participation programs where necessary to comply with applicable law, protect the community, improve operational efficiency, or support the long-term sustainability of the AQE ecosystem."
    ]
  },
  {
    id: "responsibilities",
    title: "6. Responsibilities of Community Partners",
    content: [
      "Community Partners play an important role in maintaining the integrity, reputation, and sustainability of the AQE ecosystem. Every Community Partner is expected to conduct himself, herself, or itself in a professional, ethical, and lawful manner.",
      "Each Community Partner agrees to comply with all applicable laws, regulations, governmental requirements, and community standards. Community Partners shall not engage in conduct that could harm AQE, its affiliated entities, other Community Partners, business relationships, hospitality operations, technology systems, or public reputation.",
      "Community Partners shall not make false, misleading, deceptive, or unauthorized representations concerning AQE. No Community Partner may represent himself, herself, or itself as an officer, director, employee, agent, spokesperson, legal representative, investment advisor, or authorized representative of AQE unless expressly authorized in writing.",
      "Community Partners shall maintain the confidentiality of non-public information received from AQE and shall use such information solely for legitimate participation purposes. Confidential information may include business plans, strategic initiatives, financial information, technical information, operational procedures, partnership discussions, software systems, intellectual property, and proprietary data.",
      "Community Partners shall immediately notify AQE of any unauthorized use of their account, suspected security breach, identity theft, fraudulent activity, or violation of community standards.",
      "Failure to comply with the obligations contained in this Agreement may result in suspension, termination, loss of benefits, restriction of voting rights, forfeiture of privileges, or other remedies available to AQE."
    ]
  },
  {
    id: "governance",
    title: "7. Governance and Voting Rights",
    content: [
      "AQE believes that long-term success is strengthened when Community Partners are given meaningful opportunities to participate in the development of the ecosystem. Accordingly, AQE may establish governance mechanisms that allow Community Partners to provide recommendations, vote on designated matters, and contribute to the future direction of the AQE Community Partnership Program.",
      "Governance participation is intended to encourage engagement, transparency, accountability, and collaboration among Community Partners. Governance rights granted under this Agreement are contractual rights and do not create corporate shareholder rights, statutory partnership rights, management rights, fiduciary rights, or any rights otherwise provided under corporate law unless expressly stated by AQE in writing.",
      "AQE may establish voting programs that address matters including community initiatives, project priorities, hospitality programs, ecosystem improvements, educational initiatives, charitable activities, technological enhancements, strategic recommendations, or other matters deemed appropriate by AQE.",
      "Voting power may be determined by factors including AQE Digital Units held, participation history, partnership status, community contributions, holding duration, governance classifications, or other criteria established by AQE from time to time.",
      "AQE reserves the exclusive right to determine which matters are subject to voting, the method of voting, eligibility requirements, voting periods, quorum requirements, approval thresholds, and the binding or non-binding nature of any vote.",
      "Certain governance proposals may be advisory in nature and intended solely to provide community feedback. Other proposals may be designated as binding and implemented by AQE subject to legal, regulatory, operational, or financial considerations.",
      "Nothing contained in this Agreement shall obligate AQE to implement any recommendation, proposal, vote outcome, or governance initiative where AQE determines that implementation would be impractical, unlawful, financially detrimental, operationally unreasonable, or inconsistent with the long-term interests of the ecosystem."
    ]
  },
  {
    id: "revenue",
    title: "8. Revenue Participation and Distributions",
    content: [
      "AQE may establish programs through which eligible Community Partners may participate in distributions derived from designated AQE activities, operations, projects, assets, hospitality ventures, licensing programs, technology services, or other approved business activities.",
      "Any distribution program established by AQE shall be governed by separate policies, formulas, eligibility requirements, participation criteria, and operational guidelines determined by AQE.",
      "Community Partners acknowledge and agree that participation in any distribution program is not guaranteed and shall remain subject to the financial performance, operational success, cash flow availability, regulatory requirements, reserve requirements, debt obligations, maintenance obligations, expansion plans, and other business considerations determined by AQE.",
      "AQE shall have sole discretion to determine the timing, amount, frequency, methodology, and conditions of any distribution program. AQE may modify, suspend, delay, reduce, or terminate distributions when deemed necessary for the protection and sustainability of the ecosystem.",
      "No Community Partner shall have a guaranteed right to receive profits, dividends, interest, returns, appreciation, revenue sharing, income, distributions, or other financial benefits unless specifically authorized under a separate written policy adopted by AQE.",
      "Community Partners acknowledge that business operations involve risk and that future revenues, if any, may differ substantially from projections, forecasts, expectations, estimates, or historical performance.",
      "Participation in the AQE Community Partnership Program should not be based upon expectations of guaranteed financial returns, guaranteed appreciation, guaranteed distributions, or guaranteed economic benefits."
    ]
  },
  {
    id: "hospitality",
    title: "9. Hospitality Benefits and Community Privileges",
    content: [
      "As part of its commitment to building a global community, AQE may offer certain hospitality benefits, community privileges, lifestyle programs, educational opportunities, networking events, accommodation benefits, wellness programs, concierge services, travel opportunities, recognition programs, and other membership-related benefits.",
      "Such benefits may vary depending upon partnership classification, AQE Digital Unit holdings, participation history, promotional programs, strategic contributions, or other criteria established by AQE.",
      "Hospitality benefits may include access to AQE-operated facilities, affiliated properties, partner venues, community events, educational programs, conferences, retreats, recreational facilities, dining privileges, wellness services, and other experiences determined by AQE.",
      "All hospitality benefits shall be subject to availability, reservation requirements, operational limitations, maintenance schedules, legal requirements, capacity restrictions, local regulations, and other conditions determined by AQE or its affiliated service providers.",
      "AQE reserves the right to modify, suspend, replace, discontinue, or substitute any benefit, privilege, service, accommodation, program, event, or offering without liability.",
      "Community Partners acknowledge that hospitality benefits are supplemental community privileges and shall not constitute vested property rights, contractual guarantees, perpetual entitlements, or financial obligations of AQE.",
      "AQE shall not be liable for losses, damages, injuries, delays, cancellations, interruptions, service limitations, force majeure events, governmental actions, travel restrictions, natural disasters, labor disputes, or other circumstances affecting the availability of hospitality benefits."
    ]
  },
  {
    id: "compliance",
    title: "10. Compliance, KYC, AML, and International Participation",
    content: [
      "AQE is committed to maintaining a lawful, transparent, and responsible ecosystem. Accordingly, AQE may implement Know Your Customer (KYC), Anti-Money Laundering (AML), Counter-Terrorist Financing (CTF), sanctions screening, source-of-funds verification, risk assessment procedures, and other compliance measures as deemed necessary.",
      "Each Community Partner agrees to provide accurate, complete, and truthful information requested by AQE for compliance purposes. Failure to provide requested information may result in delays, restrictions, suspension, or termination of participation.",
      "AQE reserves the right to conduct periodic reviews of Community Partners and to request updated information whenever necessary to satisfy legal, regulatory, compliance, operational, or risk-management requirements.",
      "Each Community Partner acknowledges that AQE operates internationally and that laws differ significantly among jurisdictions. The Community Partner is solely responsible for determining whether participation is lawful under the laws applicable to his, her, or its jurisdiction.",
      "AQE does not provide legal, tax, accounting, regulatory, immigration, investment, or financial advice. Community Partners are strongly encouraged to consult independent professional advisors before participating in the AQE Community Partnership Program.",
      "The Community Partner shall bear sole responsibility for all taxes, duties, levies, reporting requirements, disclosure obligations, registrations, permits, filings, compliance obligations, and legal requirements arising from participation in the AQE Community Partnership Program.",
      "AQE makes no representation that participation is lawful, approved, licensed, authorized, or suitable in any particular jurisdiction. Participation is undertaken solely at the Community Partner's own risk.",
      "To the fullest extent permitted by law, AQE shall not be responsible for any penalties, fines, taxes, regulatory actions, legal claims, investigations, enforcement proceedings, losses, damages, or liabilities arising from a Community Partner's failure to comply with laws applicable within his, her, or its jurisdiction.",
      "AQE reserves the right to prohibit, restrict, suspend, or terminate participation from any jurisdiction where legal, regulatory, compliance, operational, reputational, or business risks may arise."
    ]
  },
  {
    id: "risk",
    title: "11. Risk Disclosures",
    content: [
      "Participation in the AQE Community Partnership Program involves substantial risks. Community Partners should carefully evaluate their personal, financial, legal, and business circumstances before acquiring AQE Digital Units.",
      "AQE projects may be affected by market conditions, economic cycles, inflation, interest rates, political developments, legal changes, technological developments, operational challenges, competition, financing conditions, construction risks, hospitality industry conditions, management decisions, natural disasters, force majeure events, and numerous other factors beyond AQE's control.",
      "There can be no assurance that AQE projects will achieve their objectives, meet projections, generate revenues, maintain profitability, preserve asset values, expand successfully, secure financing, obtain permits, complete developments, or achieve anticipated growth.",
      "Community Partners acknowledge that AQE Digital Units may not be liquid, transferable, redeemable, marketable, exchangeable, or readily convertible into cash. Opportunities to transfer or dispose of AQE Digital Units may be limited or unavailable.",
      "Community Partners further acknowledge that laws and regulations affecting community programs, digital records, hospitality operations, partnership structures, taxation, international participation, and related activities may change at any time and may adversely affect AQE or Community Partners.",
      "AQE expressly disclaims any guarantee regarding future value, appreciation, profitability, revenue generation, distributions, liquidity, transferability, economic performance, or financial outcomes.",
      "By participating in the AQE Community Partnership Program, each Community Partner acknowledges that he, she, or it fully understands and voluntarily accepts all risks associated with participation."
    ]
  },
  {
    id: "transfers",
    title: "12. Transfers, Assignments, and Restrictions",
    content: [
      "AQE Digital Units are intended to support participation within the AQE Community Partnership Program and are not intended to function as a publicly traded instrument, exchange-listed asset, or unrestricted transferable interest. Accordingly, AQE reserves the right to establish policies governing the transfer, assignment, gifting, inheritance, succession, pledge, or other disposition of AQE Digital Units.",
      "No Community Partner shall transfer or attempt to transfer AQE Digital Units in a manner that violates applicable laws, regulations, court orders, sanctions requirements, compliance obligations, or AQE policies. Any attempted transfer that fails to comply with such requirements may be declared invalid, void, and without legal effect.",
      "AQE may require identity verification, compliance reviews, source-of-funds verification, documentation, approvals, waiting periods, transfer fees, or other procedures before recognizing a transfer of AQE Digital Units. AQE shall have no obligation to recognize a transfer until all required conditions have been satisfied.",
      "AQE may restrict transfers involving certain jurisdictions, individuals, entities, politically exposed persons, sanctioned parties, prohibited activities, or any person that AQE determines may create legal, compliance, operational, financial, or reputational risks.",
      "In the event of death, incapacity, dissolution, bankruptcy, liquidation, receivership, or other legal disability affecting a Community Partner, AQE may require legal documentation before recognizing any successor, beneficiary, heir, estate representative, trustee, or authorized representative.",
      "Nothing in this Agreement shall require AQE to establish a secondary market, redemption program, buyback program, exchange facility, liquidity mechanism, or repurchase obligation with respect to AQE Digital Units.",
      "Community Partners acknowledge that the ability to transfer AQE Digital Units may be limited, restricted, delayed, suspended, or unavailable and that AQE makes no guarantee regarding future transferability or liquidity."
    ]
  },
  {
    id: "suspension",
    title: "13. Suspension, Termination, and Forfeiture",
    content: [
      "AQE reserves the right to suspend, restrict, or terminate the participation of any Community Partner whenever AQE reasonably determines that such action is necessary to protect the integrity, reputation, legal compliance, operational stability, financial health, or long-term sustainability of the AQE ecosystem.",
      "Grounds for suspension or termination may include, but shall not be limited to, fraud, misrepresentation, illegal conduct, violation of community standards, breach of this Agreement, provision of false information, failure to complete compliance requirements, misuse of AQE intellectual property, harassment of other Community Partners, disruptive conduct, unauthorized commercial activities, money laundering concerns, sanctions concerns, or conduct that may expose AQE to legal or reputational risk.",
      "Prior to termination, AQE may provide notice and an opportunity to respond where AQE determines that such notice is appropriate. However, AQE reserves the right to impose immediate suspension or termination without prior notice where urgent circumstances exist.",
      "During a suspension period, AQE may temporarily restrict access to voting rights, benefits, community programs, hospitality privileges, accounts, digital records, distributions, or other aspects of participation.",
      "Termination shall result in the loss of future participation rights, governance privileges, community benefits, and other rights associated with continued participation in the AQE Community Partnership Program.",
      "AQE may establish procedures governing the treatment of AQE Digital Units following suspension or termination. Such procedures may include holding periods, compliance reviews, transfer restrictions, forfeiture provisions for misconduct, or other measures deemed necessary by AQE.",
      "Termination of participation shall not relieve the Community Partner of obligations that by their nature survive termination, including confidentiality obligations, indemnification obligations, dispute resolution provisions, compliance obligations, and liability limitations."
    ]
  },
  {
    id: "liability",
    title: "14. Limitation of Liability and Indemnification",
    content: [
      "To the fullest extent permitted by applicable law, AQE, its parent companies, subsidiaries, affiliates, officers, directors, managers, employees, consultants, advisors, contractors, service providers, agents, successors, and assigns shall not be liable for any indirect, incidental, consequential, special, exemplary, punitive, or speculative damages arising from or related to participation in the AQE Community Partnership Program.",
      "This limitation shall apply regardless of whether the alleged damages relate to business losses, lost opportunities, lost profits, loss of goodwill, loss of data, interruption of operations, technological failures, regulatory changes, market conditions, investment decisions, project performance, hospitality services, governance outcomes, or other matters.",
      "AQE shall not be responsible for losses resulting from cyberattacks, hacking incidents, software errors, system outages, telecommunications failures, internet disruptions, governmental actions, force majeure events, natural disasters, pandemics, labor disputes, acts of war, civil unrest, or other events beyond AQE's reasonable control.",
      "To the maximum extent permitted by law, the aggregate liability of AQE arising from any claim related to this Agreement shall not exceed the total amount paid by the affected Community Partner to AQE during the twelve-month period immediately preceding the event giving rise to the claim.",
      "Each Community Partner agrees to indemnify, defend, and hold harmless AQE and its affiliates from and against any claims, losses, liabilities, damages, costs, expenses, penalties, fines, judgments, settlements, or legal fees arising from the Community Partner's breach of this Agreement, violation of applicable laws, misuse of AQE programs, infringement of third-party rights, or wrongful conduct.",
      "The obligations contained in this Article shall survive termination of participation and remain enforceable to the fullest extent permitted by law."
    ]
  },
  {
    id: "disputes",
    title: "15. Dispute Resolution, Arbitration, and Governing Law",
    content: [
      "AQE and each Community Partner agree that disputes should be resolved efficiently, privately, and in good faith whenever possible.",
      "Before commencing any legal proceeding, the parties shall first attempt to resolve disputes through informal discussions and negotiations. Either party may provide written notice describing the nature of the dispute and the relief requested.",
      "If the dispute cannot be resolved through good-faith negotiations within a reasonable period, the dispute shall be submitted to binding arbitration, unless prohibited by applicable law.",
      "The arbitration shall be conducted by a recognized arbitration organization selected by AQE or otherwise agreed upon by the parties. The arbitration proceedings shall be conducted in the English language unless otherwise agreed in writing.",
      "The arbitrator shall have authority to award remedies permitted under applicable law and consistent with the limitations contained in this Agreement. The arbitrator's decision shall be final and binding upon all parties.",
      "Community Partners agree that disputes shall be resolved on an individual basis and not as part of any class action, representative action, collective action, consolidated proceeding, or similar litigation.",
      "AQE reserves the right to seek injunctive relief, equitable relief, protective orders, or other remedies from courts of competent jurisdiction when necessary to protect confidential information, intellectual property, business operations, compliance obligations, or community interests.",
      "This Agreement shall be governed by and interpreted in accordance with the laws of the jurisdiction designated by AQE from time to time. Community Partners acknowledge that AQE may operate through multiple legal entities and jurisdictions and that AQE may designate the governing law applicable to specific programs, projects, or operational structures."
    ]
  },
  {
    id: "representations",
    title: "16. Partner Representations, Acknowledgements, and Acceptance",
    content: [
      "By participating in the AQE Community Partnership Program and acquiring AQE Digital Units, each Community Partner represents, warrants, and acknowledges that he, she, or it has carefully reviewed this Agreement and fully understands its contents.",
      "The Community Partner acknowledges that AQE Digital Units are acquired voluntarily and that no guarantee has been made regarding future value, appreciation, distributions, financial returns, business performance, project success, liquidity, transferability, or economic outcomes.",
      "The Community Partner acknowledges that participation involves risk and that AQE has advised participants to seek independent legal, tax, accounting, and financial advice before participating.",
      "The Community Partner further acknowledges that AQE does not provide legal, tax, accounting, investment, securities, financial planning, immigration, or regulatory advice and that all participation decisions are made independently by the Community Partner.",
      "The Community Partner represents that all information provided to AQE is true, complete, accurate, and not misleading and agrees to promptly update AQE if any material information changes.",
      "The Community Partner acknowledges that he, she, or it is solely responsible for compliance with all laws, regulations, tax requirements, reporting obligations, registration requirements, and governmental requirements applicable within his, her, or its jurisdiction.",
      "The Community Partner acknowledges that AQE has not represented that participation is lawful in every jurisdiction and that the Community Partner has independently determined that participation is permitted under applicable laws.",
      "The Community Partner agrees to comply with all present and future AQE policies, governance standards, compliance procedures, operational requirements, community standards, and program guidelines.",
      "This Agreement constitutes the entire understanding between AQE and the Community Partner with respect to participation in the AQE Community Partnership Program and supersedes all prior discussions, communications, representations, proposals, understandings, or agreements relating to the subject matter herein.",
      "If any provision of this Agreement is determined to be invalid, illegal, or unenforceable, the remaining provisions shall remain in full force and effect.",
      "AQE reserves the right to amend, revise, update, supplement, or modify this Agreement at any time. Material changes may be communicated through AQE websites, applications, partner portals, electronic communications, or other methods determined by AQE.",
      "Continued participation following publication of updated terms shall constitute acceptance of such revisions."
    ]
  },
  {
    id: "legal-notice",
    title: "Participant Acknowledgment",
    content: [
      "BY ACQUIRING AQE DIGITAL UNITS OR OTHERWISE PARTICIPATING IN THE AQE COMMUNITY PARTNERSHIP PROGRAM, THE COMMUNITY PARTNER ACKNOWLEDGES THAT HE, SHE, OR IT HAS READ, UNDERSTOOD, AND AGREED TO BE LEGALLY BOUND BY THIS AGREEMENT."
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
              Official Partnership Document
            </span>
            <h2 className="text-[28px] sm:text-[32px] font-extrabold text-[#111827] leading-tight mb-2 tracking-tight">
              AQE Community Partnership Agreement
            </h2>
            <p className="text-[14px] text-[#6b7280] font-medium italic">
              Terms and Conditions of Participation
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
