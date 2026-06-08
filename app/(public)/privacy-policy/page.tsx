import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "Privacy Policy | HOMEUP",
  description:
    "How HOMEUP (Haus Plus Pte. Ltd.) collects, uses, discloses, and protects your personal data in accordance with Singapore's Personal Data Protection Act (PDPA).",
};

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-10 font-display text-base font-bold uppercase tracking-wide text-neutral-900">
      {children}
    </h2>
  );
}

function Ol({ children }: { children: React.ReactNode }) {
  return (
    <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-neutral-600">
      {children}
    </ol>
  );
}

function Ul({ children }: { children: React.ReactNode }) {
  return (
    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-neutral-600">
      {children}
    </ul>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <>
      <Navbar />
      <main className="bg-white">
        <div className="mx-auto w-full max-w-[820px] px-6 py-14 sm:px-8 lg:py-20">

          {/* Title */}
          <p className="text-xs font-semibold uppercase tracking-widest text-primary-600">
            Legal
          </p>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl">
            Privacy Policy / Data Protection Notice
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-neutral-600">
            This Privacy Policy / Data Protection Notice (<strong>&ldquo;Notice&rdquo;</strong>)
            sets out the basis on which Haus Plus Pte. Ltd. (<strong>&ldquo;HOMEUP&rdquo;</strong>,{" "}
            <strong>&ldquo;we&rdquo;</strong>, <strong>&ldquo;us&rdquo;</strong>, or{" "}
            <strong>&ldquo;our&rdquo;</strong>) may collect, use, disclose or otherwise process
            personal data of individuals in accordance with the Personal Data Protection Act 2012
            of Singapore (<strong>&ldquo;PDPA&rdquo;</strong>).
          </p>
          <p className="mt-3 text-sm leading-relaxed text-neutral-600">
            This Notice applies to personal data in our possession or under our control, including
            personal data in the possession of third party organisations which we have engaged to
            collect, use, disclose or process personal data for our purposes.
          </p>

          {/* Personal Data */}
          <H2>Personal Data</H2>
          <Ol>
            <li>
              In this Notice:
              <br />
              <strong>&ldquo;customer&rdquo;</strong> means any individual who (a) contacts us
              through any means to find out more about any services we provide, (b) submits an
              enquiry, form or request through our website or advertising channels, or (c) may
              enter into or has entered into a contract or arrangement with us in relation to our
              services.
              <br />
              <strong>&ldquo;personal data&rdquo;</strong> means data, whether true or not, about
              an individual who can be identified (a) from that data, or (b) from that data and
              other information to which we have or are likely to have access.
            </li>
            <li>
              Depending on the nature of your interaction with us, the personal data which we may
              collect includes:
              <Ul>
                <li>your name;</li>
                <li>mobile number and email address;</li>
                <li>
                  property related details you choose to provide, such as property type, property
                  location, intended timeline, budget, housing plans, and service requirements;
                </li>
                <li>
                  records of your enquiries, appointments, communications, feedback and
                  interactions with us through website forms, WhatsApp, phone, email, social media
                  or other channels;
                </li>
                <li>
                  technical and usage data such as IP address, browser type, device information,
                  pages viewed, buttons clicked, referral source, date and time of visit, and
                  approximate location data;
                </li>
                <li>
                  marketing and preference data, including your responses to campaigns, lead forms,
                  advertisements, remarketing audiences, and website interactions.
                </li>
              </Ul>
            </li>
            <li>
              We do not intentionally request unnecessary sensitive personal data. Please do not
              submit NRIC numbers, bank account details, or other sensitive personal information
              through our website forms unless specifically requested by us for a legitimate
              purpose.
            </li>
            <li>
              Other terms used in this Notice shall have the meanings given to them in the PDPA
              where the context so permits.
            </li>
          </Ol>

          {/* Collection */}
          <H2>Collection of Personal Data</H2>
          <Ol>
            <li>
              We generally collect personal data when:
              <Ol>
                <li>you voluntarily provide it to us directly;</li>
                <li>
                  you submit a contact form, valuation form, appointment request or other form on
                  our website;
                </li>
                <li>
                  you contact us through WhatsApp, phone, email, social media, or any other
                  communication channel;
                </li>
                <li>
                  you interact with our advertisements, landing pages, website tools, cookies,
                  tags, pixels or analytics technologies;
                </li>
                <li>
                  your authorised representative provides your personal data to us on your behalf;
                  or
                </li>
                <li>
                  collection, use or disclosure without consent is permitted or required under the
                  PDPA or other applicable laws.
                </li>
              </Ol>
            </li>
            <li>
              By providing your personal data to us, submitting a form, contacting us, or
              continuing to use our website, you acknowledge that you have been notified of the
              purposes for which your personal data is collected, used and disclosed as set out in
              this Notice.
            </li>
            <li>
              We may seek your consent where required under applicable law before collecting
              additional personal data or using your personal data for a new purpose which has not
              previously been notified to you.
            </li>
          </Ol>

          {/* Purposes */}
          <H2>Purposes for Collection, Use and Disclosure</H2>
          <Ol>
            <li>
              We may collect, use and disclose your personal data for any or all of the following
              purposes:
              <Ol>
                <li>
                  responding to, processing and following up on your enquiries, requests, feedback
                  and appointments;
                </li>
                <li>contacting you about the services you have requested or may be interested in;</li>
                <li>providing property related consultation, coordination and support;</li>
                <li>verifying your identity where reasonably required;</li>
                <li>
                  maintaining records of our communications and relationship management with you;
                </li>
                <li>
                  improving our website, customer experience, marketing strategy and service
                  delivery;
                </li>
                <li>
                  measuring and understanding website traffic, user behaviour, lead sources,
                  campaign performance and conversion activity;
                </li>
                <li>
                  sending service related updates, reminders, confirmations and follow ups;
                </li>
                <li>
                  sending marketing or promotional messages where permitted by law or where you
                  have provided the necessary consent;
                </li>
                <li>
                  supporting internal business administration, reporting, analytics and operational
                  planning;
                </li>
                <li>
                  complying with applicable laws, regulations, codes of practice, guidelines or
                  lawful requests by authorities; and
                </li>
                <li>any other purpose reasonably related to the aforesaid.</li>
              </Ol>
            </li>
          </Ol>

          {/* Analytics / Cookies */}
          <H2>Website Analytics, Cookies and Advertising Technologies</H2>
          <Ol>
            <li>
              Our website may use cookies, pixels, tags, scripts and similar technologies to
              collect information about how visitors interact with our website. These technologies
              may be deployed by us or by third party platforms and service providers.
            </li>
            <li>
              Such technologies may collect or process information including:
              <Ul>
                <li>pages viewed and time spent on our website;</li>
                <li>button clicks, form submissions and other conversion events;</li>
                <li>browser type, device information and operating system;</li>
                <li>IP address and referral source;</li>
                <li>cookie IDs, advertising IDs and other online identifiers;</li>
                <li>general location and usage patterns.</li>
              </Ul>
            </li>
            <li>
              We may use platforms and tools provided by third parties such as{" "}
              <strong>Meta</strong>, <strong>Google</strong>,{" "}
              <strong>Google Analytics</strong>, <strong>Google Ads</strong>,{" "}
              <strong>Google Tag Manager</strong>, and similar advertising or analytics providers
              to understand website traffic, measure ad performance, track conversions, build
              remarketing audiences, and show more relevant advertisements on external platforms.
            </li>
            <li>
              This means that if you visit our website or interact with our forms or
              advertisements, information about those actions may be collected and matched, where
              supported by the relevant platform, for purposes such as:
              <Ol>
                <li>measuring the effectiveness of our ads and campaigns;</li>
                <li>understanding which pages or services are generating interest;</li>
                <li>retargeting website visitors with relevant advertisements;</li>
                <li>creating custom or similar audiences for advertising;</li>
                <li>improving our marketing and lead generation efforts.</li>
              </Ol>
            </li>
            <li>
              Where required, we will obtain your consent for non-essential cookies or tracking
              technologies. You may adjust your browser settings to refuse certain cookies,
              although doing so may affect website functionality or measurement accuracy.
            </li>
          </Ol>

          {/* Disclosure */}
          <H2>Disclosure of Personal Data</H2>
          <Ol>
            <li>
              We may disclose your personal data:
              <Ol>
                <li>
                  where such disclosure is reasonably required in connection with the provision of
                  services requested by you;
                </li>
                <li>
                  to our employees, agents, representatives and service providers on a need-to-know
                  basis;
                </li>
                <li>
                  to vendors supporting our website, hosting, forms, analytics, CRM, messaging,
                  advertising, automation and business operations;
                </li>
                <li>
                  to advertising and analytics platforms such as Meta and Google for the purposes
                  described in this Notice;
                </li>
                <li>
                  to professional advisers such as accountants, auditors, insurers and lawyers
                  where necessary;
                </li>
                <li>
                  to regulators, authorities, law enforcement agencies or other parties where
                  required or permitted by law; or
                </li>
                <li>
                  to any other party where you have given your consent or where such disclosure is
                  reasonably connected to a purpose stated in this Notice.
                </li>
              </Ol>
            </li>
            <li>
              The purposes listed above may continue to apply even where our relationship with you
              has been terminated or altered, for a reasonable period thereafter, including where
              necessary for legal, compliance, audit or business record purposes.
            </li>
          </Ol>

          {/* Withdrawal */}
          <H2>Withdrawal of Consent</H2>
          <Ol>
            <li>
              The consent that you provide for the collection, use and disclosure of your personal
              data will remain valid until withdrawn by you in writing. You may withdraw your
              consent and request that we stop collecting, using and/or disclosing your personal
              data for any or all of the purposes stated in this Notice by contacting our Data
              Protection Officer using the contact details below.
            </li>
            <li>
              Upon receipt of your request, we may require reasonable time to process it and to
              inform you of the consequences of withdrawing such consent, including any legal
              consequences or impact on our ability to provide services to you.
            </li>
            <li>
              Please note that depending on the nature and scope of your request, we may not be
              able to continue providing certain services or responding fully to your enquiry if
              the relevant personal data is required for those purposes.
            </li>
            <li>
              Withdrawal of consent does not affect our right to continue to collect, use or
              disclose personal data where such collection, use or disclosure without consent is
              permitted or required under applicable law.
            </li>
          </Ol>

          {/* Access & Correction */}
          <H2>Access to and Correction of Personal Data</H2>
          <Ol>
            <li>
              If you wish to request access to a copy of the personal data we hold about you, or
              information about the ways in which we have used or disclosed your personal data, or
              if you wish to correct or update your personal data, you may submit your request to
              our Data Protection Officer in writing.
            </li>
            <li>
              We may charge a reasonable administrative fee for an access request where permitted
              by law. If so, we will inform you of the fee before processing your request.
            </li>
            <li>
              We will respond to your request within a reasonable time in accordance with the PDPA
              and applicable requirements. If we are unable to provide access or make a requested
              correction, we will generally inform you of the reasons unless we are not required to
              do so under the PDPA.
            </li>
          </Ol>

          {/* Protection */}
          <H2>Protection of Personal Data</H2>
          <Ol>
            <li>
              To safeguard your personal data from unauthorised access, collection, use,
              disclosure, copying, modification, disposal or similar risks, we implement reasonable
              administrative, physical and technical security arrangements.
            </li>
            <li>
              These measures may include access controls, secure hosting arrangements, password
              protection, software updates, malware protection, and restricting access to personal
              data to authorised personnel and service providers on a need-to-know basis.
            </li>
            <li>
              However, no method of transmission over the Internet or method of electronic storage
              is completely secure. While we strive to protect your personal data, we cannot
              guarantee absolute security.
            </li>
          </Ol>

          {/* Accuracy */}
          <H2>Accuracy of Personal Data</H2>
          <Ol>
            <li>
              We generally rely on personal data provided by you or your authorised representative.
              To help us maintain accurate, complete and current records, please notify us if there
              are changes to your personal data.
            </li>
          </Ol>

          {/* Retention */}
          <H2>Retention of Personal Data</H2>
          <Ol>
            <li>
              We may retain your personal data for as long as it is necessary to fulfil the purpose
              for which it was collected, or as required or permitted by applicable laws.
            </li>
            <li>
              We will cease to retain your personal data, or remove the means by which the data can
              be associated with you, as soon as it is reasonable to assume that such retention no
              longer serves the purpose for which the personal data was collected and is no longer
              necessary for legal or business purposes.
            </li>
          </Ol>

          {/* Overseas transfers */}
          <H2>Transfers of Personal Data Outside Singapore</H2>
          <Ol>
            <li>
              Some of our service providers or technology platforms may process or store personal
              data outside Singapore. Where personal data is transferred outside Singapore, we will
              take reasonable steps to ensure that the receiving party provides a standard of
              protection comparable to that required under the PDPA.
            </li>
          </Ol>

          {/* Third party */}
          <H2>Third Party Sites and Services</H2>
          <Ol>
            <li>
              Our website may contain links to third party websites, plug-ins or services. We are
              not responsible for the privacy practices of such third parties. You should review
              their own privacy policies where relevant.
            </li>
          </Ol>

          {/* DPO */}
          <H2>Data Protection Officer</H2>
          <Ol>
            <li>
              If you have any questions, feedback or requests relating to this Notice or your
              personal data, you may contact our Data Protection Officer at:
              <div className="mt-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm leading-relaxed text-neutral-700">
                <p className="font-semibold">Data Protection Officer</p>
                <p>Haus Plus Pte. Ltd.</p>
                <p>
                  Email:{" "}
                  <a
                    href="mailto:dpo@homeup.sg"
                    className="text-primary-600 underline hover:text-primary-700"
                  >
                    dpo@homeup.sg
                  </a>
                </p>
              </div>
            </li>
          </Ol>

          {/* Effect & changes */}
          <H2>Effect of Notice and Changes to Notice</H2>
          <Ol>
            <li>
              This Notice applies together with any other notices, disclaimers, consent clauses and
              contractual terms that apply in relation to the collection, use and disclosure of your
              personal data by us.
            </li>
            <li>
              We may revise this Notice from time to time without prior notice. The updated version
              will be posted on this page and the revised date will be reflected below. Your
              continued use of our website or services after such changes shall constitute your
              acknowledgement of the updated Notice to the extent permitted by law.
            </li>
          </Ol>

          {/* Dates */}
          <div className="mt-10 border-t border-neutral-100 pt-6 text-xs text-neutral-400">
            <p>Effective Date: 1 Jan 2026</p>
            <p>Last Updated: 9 Mar 2026</p>
          </div>

          <div className="mt-6">
            <Link
              href="/"
              className="text-sm font-semibold text-primary-600 hover:text-primary-700"
            >
              ← Back to home
            </Link>
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}
