import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";

import { ContactForm } from "@/modules/marketing/components/contact-form";
import { SubpageHero } from "@/modules/marketing/components/subpage-hero";

export const metadata: Metadata = {
  title: "Contact — PropAI",
  description:
    "Talk to a real person about buying, selling, or running your brokerage on PropAI. No bots, no pressure.",
};

const DETAILS = [
  { icon: Mail, label: "Email", value: "hello@propai.com" },
  { icon: Phone, label: "Phone", value: "+1 (555) 010-2040" },
  { icon: MapPin, label: "Office", value: "600 Market Street, San Francisco, CA" },
  { icon: Clock, label: "Hours", value: "Mon–Fri, 9am–6pm PT" },
];

export default function ContactPage() {
  return (
    <>
      <SubpageHero
        eyebrow="Contact"
        title="Let's talk"
        description="Whether you're buying, selling, or bringing your brokerage onto PropAI, a real person is ready to help."
      />

      <section className="py-16 sm:py-20">
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.3fr] lg:gap-16">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Reach us directly</h2>
            <p className="text-muted-foreground mt-3 leading-relaxed">
              Prefer to skip the form? These reach the same team. Details are
              illustrative for this portfolio demo.
            </p>

            <ul className="mt-8 space-y-6">
              {DETAILS.map((detail) => (
                <li key={detail.label} className="flex items-start gap-4">
                  <span className="bg-primary/10 text-primary inline-flex size-11 shrink-0 items-center justify-center rounded-full">
                    <detail.icon className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-muted-foreground text-xs tracking-wide uppercase">
                      {detail.label}
                    </p>
                    <p className="mt-1 font-medium">{detail.value}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <ContactForm />
        </div>
      </section>
    </>
  );
}
